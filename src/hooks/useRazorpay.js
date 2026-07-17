import { useCallback } from 'react';
import { trackEvent } from '@/utils/analytics';
import { logEvent } from '@/utils/txnLog';

const RAZORPAY_KEY_ID = import.meta.env.VITE_RAZORPAY_KEY_ID;
const API_BASE = import.meta.env.VITE_API_URL ?? '';

function loadRazorpayScript() {
    return new Promise((resolve) => {
        if (window.Razorpay) return resolve(true);
        const script = document.createElement('script');
        script.src = 'https://checkout.razorpay.com/v1/checkout.js';
        script.onload = () => resolve(true);
        script.onerror = () => resolve(false);
        document.body.appendChild(script);
    });
}

function mapEnrollmentRow(row) {
    if (!row) return null;
    return {
        enrollmentId: row.enrollment_id,
        customerName: row.customer_name,
        customerEmail: row.customer_email,
        customerPhone: row.customer_phone,
        programName: row.program_name,
        planType: row.plan_type,
        coachingType: row.coaching_type,
        durationMonths: row.duration_months,
        amountPaid: row.amount_paid,
        originalAmount: row.original_amount,
        couponCode: row.coupon_code,
        couponSavings: row.coupon_savings,
        razorpayOrderId: row.razorpay_order_id,
        razorpayPaymentId: row.razorpay_payment_id,
        paymentDate: row.payment_date,
        paymentStatus: row.payment_status,
        age: row.age,
        city: row.city,
        weight: row.weight,
        goals: row.goals,
        medicalIssue: row.medical_issue,
        medicalNote: row.medical_note,
        partnerName: row.partner_name,
        partnerAge: row.partner_age,
        partnerWeight: row.partner_weight,
        partnerGoals: row.partner_goals,
        partnerMedicalIssue: row.partner_medical_issue,
        partnerMedicalNote: row.partner_medical_note,
    };
}

export function useRazorpay() {
    const initiatePayment = useCallback(async ({
        // amountPaise is only used for analytics/UI — the server resolves
        // and persists the real price at create-order time.
        amountPaise,
        couponCode,
        couponSavings,
        name = '', email = '', contact = '',
        description = 'RECODE™ Coaching Plan',
        programName = '',
        planType = 'individual',
        durationMonths = '3',
        coachingType = 'online',
        age, city, weight, goals, medicalIssue, medicalNote,
        partnerName, partnerAge, partnerWeight, partnerGoals, partnerMedicalIssue, partnerMedicalNote,
        onSuccess, onError, onDismiss,
    }) => {
        if (!RAZORPAY_KEY_ID) {
            onError?.('Razorpay key is not configured.');
            return;
        }

        const loaded = await loadRazorpayScript();
        if (!loaded) {
            logEvent({ step: 'razorpay_script_load', status: 'failed' });
            onError?.('Failed to load payment gateway. Check your internet connection.');
            return;
        }

        // ── 1. Create order — server resolves the real price AND writes the
        //    pending enrollment row (all customer/enrollee data goes here now,
        //    before payment even opens). Returns enrollmentId + order details.
        let order;
        try {
            logEvent({
                step: 'create_order_request',
                status: 'started',
                metadata: { coachingType, planType, durationMonths, couponCode: couponCode || null },
            });

            const res = await fetch(`${API_BASE}/api/create-order`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    coachingType, planType, durationMonths, couponCode,
                    customerName: name,
                    customerEmail: email,
                    customerPhone: contact,
                    programName,
                    age, city, weight,
                    goals: goals || [],
                    medicalIssue, medicalNote,
                    partnerName, partnerAge, partnerWeight,
                    partnerGoals: partnerGoals || [],
                    partnerMedicalIssue, partnerMedicalNote,
                }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Order creation failed');
            order = data;

            logEvent({
                orderId: order.order_id,
                enrollmentId: order.enrollmentId,
                step: 'create_order_request',
                status: 'success',
                metadata: { amount: order.amount },
            });
        } catch (err) {
            logEvent({ step: 'create_order_request', status: 'failed', message: err.message });
            onError?.(err.message || 'Could not create payment order. Please try again.');
            return;
        }

        if (!order?.order_id || !order?.enrollmentId) {
            logEvent({
                step: 'create_order_request',
                status: 'failed',
                message: 'invalid order response (missing order_id or enrollmentId)',
            });
            onError?.('Invalid order response from server. Please try again.');
            return;
        }

        const options = {
            key: RAZORPAY_KEY_ID,
            amount: order.amount,
            currency: order.currency,
            name: 'FitWithSudarshan',
            description,
            image: 'https://vducmiggraxtqdgt.public.blob.vercel-storage.com/logo.png',
            order_id: order.order_id,
            prefill: { name, email, contact },
            theme: { color: '#e71763' },
            modal: {
                backdropclose: false,
                escape: false,
                handleback: true,
                ondismiss: () => {
                    logEvent({
                        orderId: order.order_id,
                        enrollmentId: order.enrollmentId,
                        step: 'checkout_dismissed',
                        status: 'warning',
                    });
                    // Payment abandoned — the pending row stays as 'pending'.
                    // The payment-reminder email flow / follow-ups can target
                    // these rows later without any extra work here.
                    onDismiss?.();
                },
            },
            handler: async (response) => {
                try { window.__rzpInstance?.close(); window.__rzpInstance = null; } catch (_) { }

                logEvent({
                    orderId: response.razorpay_order_id,
                    paymentId: response.razorpay_payment_id,
                    enrollmentId: order.enrollmentId,
                    step: 'razorpay_handler_fired',
                    status: 'success',
                });

                try {
                    // ── 2. Confirm payment — single call that verifies the
                    //    signature, confirms capture with Razorpay, and
                    //    flips the pending row to paid. Replaces the old
                    //    two-call verify-payment + create-enrollment sequence
                    //    to cut a network round trip off the critical path.
                    //    It's idempotent, and the Razorpay webhook races it
                    //    independently as a second, server-side-only path
                    //    to the same result — no client-side retry needed,
                    //    the webhook is the safety net.
                    logEvent({
                        orderId: response.razorpay_order_id,
                        paymentId: response.razorpay_payment_id,
                        enrollmentId: order.enrollmentId,
                        step: 'confirm_payment_request',
                        status: 'started',
                    });

                    const confirmRes = await fetch(`${API_BASE}/api/confirm-payment`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            razorpay_order_id: response.razorpay_order_id,
                            razorpay_payment_id: response.razorpay_payment_id,
                            razorpay_signature: response.razorpay_signature,
                        }),
                    });
                    const confirmData = await confirmRes.json();

                    if (!confirmRes.ok || !confirmData.success) {
                        logEvent({
                            orderId: response.razorpay_order_id,
                            paymentId: response.razorpay_payment_id,
                            enrollmentId: order.enrollmentId,
                            step: 'confirm_payment_request',
                            status: 'failed',
                            message: confirmData.error,
                            metadata: { httpStatus: confirmRes.status },
                        });

                        // Payment WAS captured by Razorpay. Even if this call
                        // failed (timeout, transient error, etc), the webhook
                        // will independently flip the pending row to paid —
                        // so this is NOT data loss, just a slow confirmation.
                        // Still tell the user honestly rather than faking success.
                        onError?.(
                            `Your payment was received (ID: ${response.razorpay_payment_id}). ` +
                            `We're finalizing your enrollment in the background — you'll get a confirmation email shortly. ` +
                            `If you don't hear back within a few minutes, contact support with this payment ID.`
                        );
                        return;
                    }

                    logEvent({
                        orderId: response.razorpay_order_id,
                        paymentId: response.razorpay_payment_id,
                        enrollmentId: order.enrollmentId,
                        step: 'confirm_payment_request',
                        status: 'success',
                    });

                    const enrollment = mapEnrollmentRow(confirmData.enrollment);

                    trackEvent('purchase', {
                        transaction_id: response.razorpay_payment_id,
                        value: enrollment?.amountPaid ?? amountPaise / 100,
                        currency: 'INR',
                        plan_type: planType,
                        coaching_type: coachingType,
                        coupon: couponCode || undefined,
                    });

                    logEvent({
                        orderId: response.razorpay_order_id,
                        paymentId: response.razorpay_payment_id,
                        enrollmentId: order.enrollmentId,
                        step: 'client_flow_complete',
                        status: 'success',
                    });

                    onSuccess?.(enrollment);
                } catch (err) {
                    logEvent({
                        orderId: response.razorpay_order_id,
                        paymentId: response.razorpay_payment_id,
                        enrollmentId: order.enrollmentId,
                        step: 'client_flow_complete',
                        status: 'failed',
                        message: err.message,
                    });
                    onError?.(err.message || 'Payment verification failed. Contact support.');
                }
            },
        };

        const rzp = new window.Razorpay(options);
        window.__rzpInstance = rzp;

        rzp.on('payment.failed', (response) => {
            try { rzp.close(); window.__rzpInstance = null; } catch (_) { }
            logEvent({
                orderId: order.order_id,
                enrollmentId: order.enrollmentId,
                step: 'razorpay_payment_failed_event',
                status: 'failed',
                message: response.error?.description,
                metadata: { code: response.error?.code, reason: response.error?.reason },
            });
            // Pending row stays 'pending' — nothing to clean up, follow-up
            // / payment_failed email flow can pick this up as-is.
            onError?.(response.error?.description || 'Payment failed. Please try again.');
        });

        logEvent({ orderId: order.order_id, enrollmentId: order.enrollmentId, step: 'checkout_opened', status: 'started' });
        rzp.open();
    }, []);

    return { initiatePayment };
}
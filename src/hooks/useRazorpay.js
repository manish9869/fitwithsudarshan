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

// ── GA4 purchase-event dedupe guard ──────────────────────────────────────────
// Prevents firing a duplicate `purchase` event for the same Razorpay
// payment ID if the handler ever runs twice (e.g. a re-render, a retried
// callback, or a user re-triggering the flow before navigation completes).
function alreadyTrackedPurchase(paymentId) {
    if (!paymentId) return false;
    try {
        const key = 'ga_tracked_purchases';
        const list = JSON.parse(sessionStorage.getItem(key) || '[]');
        if (list.includes(paymentId)) return true;
        list.push(paymentId);
        // Keep the list bounded so it doesn't grow unbounded in a long session
        if (list.length > 50) list.shift();
        sessionStorage.setItem(key, JSON.stringify(list));
        return false;
    } catch {
        return false;
    }
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

                    // ── GA4 purchase event — deduped by payment ID ──
                    if (!alreadyTrackedPurchase(response.razorpay_payment_id)) {
                        trackEvent('purchase', {
                            transaction_id: response.razorpay_payment_id,
                            value: enrollment?.amountPaid ?? amountPaise / 100,
                            currency: 'INR',
                            plan_type: planType,
                            coaching_type: coachingType,
                            coupon: couponCode || undefined,
                        });
                    }

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
            onError?.(response.error?.description || 'Payment failed. Please try again.');
        });

        logEvent({ orderId: order.order_id, enrollmentId: order.enrollmentId, step: 'checkout_opened', status: 'started' });
        rzp.open();
    }, []);

    return { initiatePayment };
}
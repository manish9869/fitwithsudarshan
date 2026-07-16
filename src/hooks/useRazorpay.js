import { useCallback } from 'react';
import { buildEnrollment } from '../services/enrollmentService';
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
        // NOTE: amountPaise is no longer sent to create-order — it's only
        // used here for UI display. The server resolves the real price.
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

        // ── 1. Create order — server computes the real price ────────────────
        let order;
        try {
            logEvent({ step: 'create_order_request', status: 'started', metadata: { coachingType, planType, durationMonths, couponCode: couponCode || null } });

            const res = await fetch(`${API_BASE}/api/create-order`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ coachingType, planType, durationMonths, couponCode }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Order creation failed');
            order = data;

            logEvent({ orderId: order.order_id, step: 'create_order_request', status: 'success', metadata: { amount: order.amount } });
        } catch (err) {
            logEvent({ step: 'create_order_request', status: 'failed', message: err.message });
            onError?.(err.message || 'Could not create payment order. Please try again.');
            return;
        }

        if (!order?.order_id) {
            logEvent({ step: 'create_order_request', status: 'failed', message: 'invalid order response (missing order_id)' });
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
                    logEvent({ orderId: order.order_id, step: 'checkout_dismissed', status: 'warning' });
                    onDismiss?.();
                },
            },
            handler: async (response) => {
                try { window.__rzpInstance?.close(); window.__rzpInstance = null; } catch (_) { }

                logEvent({
                    orderId: response.razorpay_order_id,
                    paymentId: response.razorpay_payment_id,
                    step: 'razorpay_handler_fired',
                    status: 'success',
                });

                try {
                    logEvent({
                        orderId: response.razorpay_order_id,
                        paymentId: response.razorpay_payment_id,
                        step: 'verify_payment_request',
                        status: 'started',
                    });

                    const verifyRes = await fetch(`${API_BASE}/api/verify-payment`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            razorpay_order_id: response.razorpay_order_id,
                            razorpay_payment_id: response.razorpay_payment_id,
                            razorpay_signature: response.razorpay_signature,
                        }),
                    });
                    const verifyData = await verifyRes.json();
                    if (!verifyRes.ok || !verifyData.success) {
                        logEvent({
                            orderId: response.razorpay_order_id,
                            paymentId: response.razorpay_payment_id,
                            step: 'verify_payment_request',
                            status: 'failed',
                            message: verifyData.error,
                        });
                        throw new Error(verifyData.error || 'Payment verification failed');
                    }

                    logEvent({
                        orderId: response.razorpay_order_id,
                        paymentId: response.razorpay_payment_id,
                        step: 'verify_payment_request',
                        status: 'success',
                    });

                    const enrollment = buildEnrollment({
                        customerName: name, customerEmail: email, customerPhone: contact,
                        programName, planType, durationMonths, coachingType,
                        amountPaid: amountPaise / 100,
                        couponCode: couponCode || null,
                        couponSavings: couponSavings || 0,
                        razorpayOrderId: response.razorpay_order_id,
                        razorpayPaymentId: response.razorpay_payment_id,
                        age, city, weight, goals: goals || [], medicalIssue, medicalNote,
                        partnerName, partnerAge, partnerWeight, partnerGoals: partnerGoals || [],
                        partnerMedicalIssue, partnerMedicalNote,
                    });

                    // ── Persist — server verifies amount/plan against Razorpay
                    //    and sends emails itself. Retry a couple of times for
                    //    transient failures before giving up. Non-retryable
                    //    errors (400s — mismatch, validation, misconfig) break
                    //    immediately instead of wasting 2 more attempts.
                    let saved = null;
                    let lastErr = null;
                    for (let attempt = 0; attempt < 3 && !saved; attempt++) {
                        try {
                            logEvent({
                                orderId: response.razorpay_order_id,
                                paymentId: response.razorpay_payment_id,
                                enrollmentId: enrollment.enrollmentId,
                                step: `create_enrollment_attempt_${attempt + 1}`,
                                status: 'started',
                            });

                            const createRes = await fetch(`${API_BASE}/api/create-enrollment`, {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({
                                    razorpay_order_id: response.razorpay_order_id,
                                    razorpay_payment_id: response.razorpay_payment_id,
                                    razorpay_signature: response.razorpay_signature,
                                    enrollment,
                                }),
                            });
                            const createData = await createRes.json();

                            if (createRes.ok && createData.success) {
                                saved = createData;
                                logEvent({
                                    orderId: response.razorpay_order_id,
                                    paymentId: response.razorpay_payment_id,
                                    enrollmentId: enrollment.enrollmentId,
                                    step: `create_enrollment_attempt_${attempt + 1}`,
                                    status: 'success',
                                });
                            } else {
                                lastErr = createData.error || `HTTP ${createRes.status}`;
                                logEvent({
                                    orderId: response.razorpay_order_id,
                                    paymentId: response.razorpay_payment_id,
                                    enrollmentId: enrollment.enrollmentId,
                                    step: `create_enrollment_attempt_${attempt + 1}`,
                                    status: 'failed',
                                    message: lastErr,
                                    metadata: { httpStatus: createRes.status },
                                });

                                // Client errors (4xx) are not transient — retrying
                                // the exact same payload will fail identically.
                                // Break immediately instead of burning 2 more
                                // attempts + delays.
                                if (createRes.status >= 400 && createRes.status < 500) {
                                    break;
                                }
                                if (attempt < 2) await new Promise((r) => setTimeout(r, 1200));
                            }
                        } catch (e) {
                            lastErr = e.message;
                            logEvent({
                                orderId: response.razorpay_order_id,
                                paymentId: response.razorpay_payment_id,
                                enrollmentId: enrollment.enrollmentId,
                                step: `create_enrollment_attempt_${attempt + 1}`,
                                status: 'failed',
                                message: e.message,
                            });
                            if (attempt < 2) await new Promise((r) => setTimeout(r, 1200));
                        }
                    }

                    if (!saved) {
                        // Payment WAS captured by Razorpay, but we could not
                        // record it. Do NOT show a fake success screen.
                        console.error('[Razorpay] 🚨 Enrollment save failed after retries:', lastErr, 'paymentId:', response.razorpay_payment_id);
                        logEvent({
                            orderId: response.razorpay_order_id,
                            paymentId: response.razorpay_payment_id,
                            enrollmentId: enrollment.enrollmentId,
                            step: 'create_enrollment_all_attempts',
                            status: 'failed',
                            message: lastErr,
                        });
                        onError?.(
                            `Your payment was received (ID: ${response.razorpay_payment_id}), but we couldn't finalize your enrollment automatically. ` +
                            `Please contact support with this payment ID and we'll sort it out immediately.`
                        );
                        return;
                    }

                    if (couponCode) {
                        // usage increment now happens server-side inside create-enrollment
                    }

                    trackEvent('purchase', {
                        transaction_id: enrollment.razorpayPaymentId,
                        value: enrollment.amountPaid,
                        currency: 'INR',
                        plan_type: enrollment.planType,
                        coaching_type: enrollment.coachingType,
                        coupon: enrollment.couponCode || undefined,
                    });

                    logEvent({
                        orderId: response.razorpay_order_id,
                        paymentId: response.razorpay_payment_id,
                        enrollmentId: enrollment.enrollmentId,
                        step: 'client_flow_complete',
                        status: 'success',
                    });

                    onSuccess?.(mapEnrollmentRow(saved.enrollment) ?? enrollment);
                } catch (err) {
                    logEvent({
                        orderId: response.razorpay_order_id,
                        paymentId: response.razorpay_payment_id,
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
                step: 'razorpay_payment_failed_event',
                status: 'failed',
                message: response.error?.description,
                metadata: { code: response.error?.code, reason: response.error?.reason },
            });
            onError?.(response.error?.description || 'Payment failed. Please try again.');
        });

        logEvent({ orderId: order.order_id, step: 'checkout_opened', status: 'started' });
        rzp.open();
    }, []);

    return { initiatePayment };
}
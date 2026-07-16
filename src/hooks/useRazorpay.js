import { useCallback } from 'react';
import { buildEnrollment } from '../services/enrollmentService';
import { trackEvent } from '@/utils/analytics';

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
            onError?.('Failed to load payment gateway. Check your internet connection.');
            return;
        }

        // ── 1. Create order — server computes the real price ────────────────
        let order;
        try {
            const res = await fetch(`${API_BASE}/api/create-order`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ coachingType, planType, durationMonths, couponCode }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Order creation failed');
            order = data;
        } catch (err) {
            onError?.(err.message || 'Could not create payment order. Please try again.');
            return;
        }

        if (!order?.order_id) {
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
                ondismiss: () => onDismiss?.(),
            },
            handler: async (response) => {
                try { window.__rzpInstance?.close(); window.__rzpInstance = null; } catch (_) { }

                try {
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
                        throw new Error(verifyData.error || 'Payment verification failed');
                    }

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
                    //    transient failures before giving up.
                    let saved = null;
                    let lastErr = null;
                    for (let attempt = 0; attempt < 3 && !saved; attempt++) {
                        try {
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
                            } else {
                                lastErr = createData.error || `HTTP ${createRes.status}`;
                                if (attempt < 2) await new Promise((r) => setTimeout(r, 1200));
                            }
                        } catch (e) {
                            lastErr = e.message;
                            if (attempt < 2) await new Promise((r) => setTimeout(r, 1200));
                        }
                    }

                    if (!saved) {
                        // Payment WAS captured by Razorpay, but we could not
                        // record it. Do NOT show a fake success screen.
                        console.error('[Razorpay] 🚨 Enrollment save failed after retries:', lastErr, 'paymentId:', response.razorpay_payment_id);
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

                    onSuccess?.(saved.enrollment ?? enrollment);
                } catch (err) {
                    onError?.(err.message || 'Payment verification failed. Contact support.');
                }
            },
        };

        const rzp = new window.Razorpay(options);
        window.__rzpInstance = rzp;

        rzp.on('payment.failed', (response) => {
            try { rzp.close(); window.__rzpInstance = null; } catch (_) { }
            onError?.(response.error?.description || 'Payment failed. Please try again.');
        });

        rzp.open();
    }, []);

    return { initiatePayment };
}
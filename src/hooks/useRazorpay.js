import { useCallback } from 'react';
import { buildEnrollment, saveEnrollmentToSupabase } from '../services/enrollmentService';
import { sendEmail } from '../services/emailService';
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
        // Payment
        amountPaise,
        originalAmountPaise,   // before coupon; falls back to amountPaise
        couponCode,
        couponSavings,
        // Buyer identity
        name = '',
        email = '',
        contact = '',
        // Plan meta
        description = 'RECODE™ Coaching Plan',
        programName = '',
        planType = 'individual',
        durationMonths = '3',
        coachingType = 'online',
        // Person 1 details
        age,
        city,
        weight,
        goals,
        medicalIssue,
        medicalNote,
        // Partner details
        partnerName,
        partnerAge,
        partnerWeight,
        partnerGoals,
        partnerMedicalIssue,
        partnerMedicalNote,
        // Callbacks
        onSuccess,
        onError,
        onDismiss,
    }) => {
        console.group('%c[Razorpay] initiatePayment', 'color:#e71763;font-weight:bold');
        console.log('amountPaise:', amountPaise);
        console.log('name:', name, '| email:', email, '| contact:', contact);
        console.log('couponCode:', couponCode || 'none', '| savings:', couponSavings || 0);
        console.log('VITE_RAZORPAY_KEY_ID:', RAZORPAY_KEY_ID ?? '❌ MISSING');
        console.log('API_BASE:', API_BASE || '(relative — dev proxy)');

        if (!RAZORPAY_KEY_ID) {
            console.error('[Razorpay] ❌ VITE_RAZORPAY_KEY_ID is undefined.');
            console.groupEnd();
            onError?.('Razorpay key is not configured. Check VITE_RAZORPAY_KEY_ID in your .env file.');
            return;
        }

        console.log('[Razorpay] Loading checkout.js…');
        const loaded = await loadRazorpayScript();
        if (!loaded) {
            console.groupEnd();
            onError?.('Failed to load payment gateway. Check your internet connection.');
            return;
        }

        // ── 1. Create order ─────────────────────────────────────────────────────
        let order;
        try {
            const res = await fetch(`${API_BASE}/api/create-order`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ amount: amountPaise, currency: 'INR' }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Order creation failed');
            order = data;
        } catch (err) {
            console.error('[Razorpay] ❌ create-order failed:', err.message);
            console.groupEnd();
            onError?.(err.message || 'Could not create payment order. Please try again.');
            return;
        }

        if (!order?.order_id || typeof order.order_id !== 'string') {
            console.error('[Razorpay] ❌ order_id missing. Full response:', order);
            console.groupEnd();
            onError?.('Invalid order response from server. Please try again.');
            return;
        }

        // ── 2. Open modal ────────────────────────────────────────────────────────
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
                    console.log('[Razorpay] Modal dismissed by user');
                    onDismiss?.();
                },
            },
            handler: async (response) => {
                try {
                    if (window.__rzpInstance) {
                        window.__rzpInstance.close();
                        window.__rzpInstance = null;
                    }
                } catch (_) { /* safe */ }

                console.log('[Razorpay] ✅ Payment captured:', response);

                // ── 3. Verify signature ──────────────────────────────────────────────
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

                    // ── 4. Build enrollment ──────────────────────────────────────────────
                    const enrollment = buildEnrollment({
                        customerName: name,
                        customerEmail: email,
                        customerPhone: contact,
                        programName,
                        planType,
                        durationMonths,
                        coachingType,
                        amountPaid: amountPaise / 100,
                        originalAmount: (originalAmountPaise ?? amountPaise) / 100,
                        couponCode: couponCode || null,
                        couponSavings: couponSavings || 0,
                        razorpayOrderId: response.razorpay_order_id,
                        razorpayPaymentId: response.razorpay_payment_id,
                        // Person 1
                        age, city, weight,
                        goals: goals || [],
                        medicalIssue,
                        medicalNote,
                        // Partner
                        partnerName,
                        partnerAge,
                        partnerWeight,
                        partnerGoals: partnerGoals || [],
                        partnerMedicalIssue,
                        partnerMedicalNote,
                    });

                    console.log('[Razorpay] ✅ Enrollment built:', enrollment);

                    // ── 5. Persist to Supabase (fire-and-forget) ─────────────────────────
                    saveEnrollmentToSupabase(enrollment).then((result) => {
                        if (!result.success) {
                            console.warn('[Razorpay] ⚠️ Supabase save failed (non-blocking):', result.error);
                        }
                    });

                    // ── 6. Send emails (fire-and-forget) ─────────────────────────────────
                    sendEmail({ type: 'enrollment_both', to: null, data: enrollment });

                    trackEvent('purchase', {
                        transaction_id: enrollment.razorpayPaymentId,
                        value: enrollment.amountPaid,
                        currency: 'INR',
                        plan_type: enrollment.planType,
                        coaching_type: enrollment.coachingType,
                        coupon: enrollment.couponCode || undefined,
                    });

                    console.log('[Razorpay] ✅ Calling onSuccess.');
                    console.groupEnd();
                    onSuccess?.(enrollment);
                } catch (err) {
                    console.error('[Razorpay] ❌ Verification failed:', err.message);
                    console.groupEnd();
                    onError?.(err.message || 'Payment verification failed. Contact support.');
                }
            },
        };

        const rzp = new window.Razorpay(options);
        window.__rzpInstance = rzp;

        rzp.on('payment.failed', (response) => {
            console.error('[Razorpay] ❌ payment.failed event:', response.error);
            console.groupEnd();
            try { rzp.close(); window.__rzpInstance = null; } catch (_) { }
            onError?.(response.error?.description || 'Payment failed. Please try again.');
        });

        rzp.open();
    }, []);

    return { initiatePayment };
}
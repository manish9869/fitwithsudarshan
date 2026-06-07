import { useCallback } from 'react';
import { buildEnrollment } from '../services/enrollmentService';
import { sendEnrollmentEmails } from '../services/emailService';

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
        amountPaise,
        name = '',
        email = '',
        contact = '',
        description = 'RECODE™ Coaching Plan',
        programName = '',
        planType = 'individual',
        durationMonths = '3',
        coachingType = 'online',
        onSuccess,
        onError,
        onDismiss,
    }) => {
        console.group('%c[Razorpay] initiatePayment', 'color:#e71763;font-weight:bold');
        console.log('amountPaise:', amountPaise);
        console.log('name:', name, '| email:', email, '| contact:', contact);
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
        console.log('[Razorpay] Script loaded:', loaded, '| window.Razorpay:', typeof window.Razorpay);
        if (!loaded) {
            console.groupEnd();
            onError?.('Failed to load payment gateway. Check your internet connection.');
            return;
        }

        // ── 1. Create order ─────────────────────────────────────────────────
        console.log('[Razorpay] POST /api/create-order  amount:', amountPaise);
        let order;
        try {
            const res = await fetch(`${API_BASE}/api/create-order`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ amount: amountPaise, currency: 'INR' }),
            });
            const data = await res.json();
            console.log('[Razorpay] /api/create-order response — status:', res.status, 'body:', data);
            if (!res.ok) throw new Error(data.error || 'Order creation failed');
            order = data;
        } catch (err) {
            console.error('[Razorpay] ❌ create-order failed:', err.message);
            console.groupEnd();
            onError?.(err.message || 'Could not create payment order. Please try again.');
            return;
        }

        console.log('[Razorpay] order_id:', order?.order_id, '| amount:', order?.amount);
        if (!order?.order_id || typeof order.order_id !== 'string') {
            console.error('[Razorpay] ❌ order_id missing. Full response:', order);
            console.groupEnd();
            onError?.('Invalid order response from server. Please try again.');
            return;
        }

        // ── 2. Open modal ───────────────────────────────────────────────────
        const options = {
            key: RAZORPAY_KEY_ID,
            amount: order.amount,
            currency: order.currency,
            name: 'FitWithSudarshan',
            description,
            image: 'https://media.base44.com/images/public/6a2381461c7fbce9d10aa67e/8f822062b_logo.png',
            order_id: order.order_id,
            prefill: { name, email, contact },
            theme: { color: '#e71763' },
            // ── Suppress Razorpay's own success screen ──────────────────────
            // The modal closes immediately after payment.captured; our handler
            // fires before Razorpay can render its "Payment Successful" overlay.
            // We close the iframe manually in the handler so no native modal flashes.
            modal: {
                backdropclose: false,
                escape: false,
                handleback: true,
                ondismiss: () => {
                    console.log('[Razorpay] Modal dismissed by user');
                    onDismiss?.();
                },
            },
            config: {
                display: {
                    // Prevents the built-in success/failure screens from rendering
                    hide_topbar: false,
                },
            },
            handler: async (response) => {
                // Close the Razorpay iframe immediately so their success modal
                // never appears — we handle everything in our own UI
                try {
                    // rzp instance is closed below; store ref for cleanup
                    if (window.__rzpInstance) {
                        window.__rzpInstance.close();
                        window.__rzpInstance = null;
                    }
                } catch (_) { /* safe to ignore */ }

                console.log('[Razorpay] ✅ Payment captured:', response);

                // ── 3. Verify signature ─────────────────────────────────────
                console.log('[Razorpay] POST /api/verify-payment…');
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
                    console.log('[Razorpay] /api/verify-payment response — status:', verifyRes.status, 'body:', verifyData);
                    if (!verifyRes.ok || !verifyData.success) {
                        throw new Error(verifyData.error || 'Payment verification failed');
                    }

                    // ── 4. Build enrollment ─────────────────────────────────
                    const enrollment = buildEnrollment({
                        customerName: name,
                        customerEmail: email,
                        customerPhone: contact,
                        programName,
                        planType,
                        durationMonths,
                        coachingType,
                        amountPaid: amountPaise / 100,
                        razorpayOrderId: response.razorpay_order_id,
                        razorpayPaymentId: response.razorpay_payment_id,
                    });

                    console.log('[Razorpay] ✅ Enrollment built:', enrollment);

                    // ── 5. Emails (fire-and-forget) ─────────────────────────
                    sendEnrollmentEmails(enrollment);

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

        console.log('[Razorpay] Opening modal with options:', {
            key: options.key,
            amount: options.amount,
            currency: options.currency,
            order_id: options.order_id,
        });

        const rzp = new window.Razorpay(options);
        // Store reference so handler can close it before their success screen renders
        window.__rzpInstance = rzp;

        rzp.on('payment.failed', (response) => {
            console.error('[Razorpay] ❌ payment.failed event:', response.error);
            console.groupEnd();
            // Close modal so their failure screen doesn't show either
            try { rzp.close(); window.__rzpInstance = null; } catch (_) { }
            onError?.(response.error?.description || 'Payment failed. Please try again.');
        });

        rzp.open();
    }, []);

    return { initiatePayment };
}
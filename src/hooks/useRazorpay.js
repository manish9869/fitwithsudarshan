import { useCallback } from 'react';

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
        onSuccess,
        onError,
        onDismiss,
    }) => {
        console.group('%c[Razorpay] initiatePayment', 'color:#e71763;font-weight:bold');
        console.log('amountPaise:', amountPaise);
        console.log('name:', name, '| email:', email, '| contact:', contact);
        console.log('VITE_RAZORPAY_KEY_ID:', RAZORPAY_KEY_ID ?? '❌ MISSING');
        console.log('API_BASE:', API_BASE || '(relative — dev proxy)');

        // Guard: key must be present
        if (!RAZORPAY_KEY_ID) {
            console.error('[Razorpay] ❌ VITE_RAZORPAY_KEY_ID is undefined. Check your .env file and restart Vite.');
            console.groupEnd();
            onError?.('Razorpay key is not configured. Check VITE_RAZORPAY_KEY_ID in your .env file.');
            return;
        }

        // ── Load script ───────────────────────────────────────────────────────
        console.log('[Razorpay] Loading checkout.js…');
        const loaded = await loadRazorpayScript();
        console.log('[Razorpay] Script loaded:', loaded, '| window.Razorpay:', typeof window.Razorpay);
        if (!loaded) {
            console.error('[Razorpay] ❌ Failed to load checkout.js');
            console.groupEnd();
            onError?.('Failed to load payment gateway. Check your internet connection.');
            return;
        }

        // ── 1. Create order ───────────────────────────────────────────────────
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

        // Guard: order_id must be a non-empty string
        console.log('[Razorpay] order_id:', order?.order_id, '| amount:', order?.amount, '| currency:', order?.currency);
        if (!order?.order_id || typeof order.order_id !== 'string') {
            console.error('[Razorpay] ❌ order_id is missing or not a string. Full response:', order);
            console.groupEnd();
            onError?.('Invalid order response from server. Please try again.');
            return;
        }

        // ── 2. Open modal ─────────────────────────────────────────────────────
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
            modal: {
                ondismiss: () => {
                    console.log('[Razorpay] Modal dismissed by user');
                    onDismiss?.();
                },
            },
            handler: async (response) => {
                console.log('[Razorpay] ✅ Payment captured:', response);

                // ── 3. Verify signature ───────────────────────────────────────
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
                    console.log('[Razorpay] ✅ Signature verified. Calling onSuccess.');
                    console.groupEnd();
                    onSuccess?.(response);
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
        rzp.on('payment.failed', (response) => {
            console.error('[Razorpay] ❌ payment.failed event:', response.error);
            console.groupEnd();
            onError?.(response.error?.description || 'Payment failed. Please try again.');
        });
        rzp.open();
    }, []);

    return { initiatePayment };
}
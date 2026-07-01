/**
 * src/utils/analytics.js
 *
 * Thin wrapper around gtag for firing custom GA4 events.
 * Safe to call even before gtag has loaded (silently no-ops).
 *
 * @example
 * trackEvent('whatsapp_click', { source: 'floating_button' });
 *
 * @example
 * trackEvent('purchase', {
 *   transaction_id: enrollment.razorpayPaymentId,
 *   value: enrollment.amountPaid,
 *   currency: 'INR',
 * });
 */
export function trackEvent(name, params = {}) {
    if (typeof window === "undefined" || typeof window.gtag !== "function") return;
    window.gtag("event", name, params);
}
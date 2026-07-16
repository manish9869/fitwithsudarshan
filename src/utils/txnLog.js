/**
 * src/utils/txnLog.js
 *
 * Frontend-side transaction step logger. Sends to POST /api/log-event so
 * client-side failures (checkout dismissed, handler never fired, network
 * drop before verify-payment, etc) are visible alongside backend logs in
 * the same `transaction_logs` table.
 *
 * NEVER throws and never blocks the calling code — logging must not be
 * able to break the actual payment flow.
 */
const API_BASE = import.meta.env.VITE_API_URL ?? '';

export function logEvent({ orderId, paymentId, enrollmentId, step, status, message, metadata }) {
    try {
        fetch(`${API_BASE}/api/log-event`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ orderId, paymentId, enrollmentId, step, status, message, metadata }),
            keepalive: true, // survives page navigation (e.g. redirect to /payment-success)
        }).catch(() => { /* swallow — logging must never break the flow */ });
    } catch (_) {
        /* swallow — e.g. fetch not available in some edge environment */
    }
}
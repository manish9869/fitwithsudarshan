/**
 * src/services/emailService.js
 *
 * Single function: sendEmail({ type, to, data })
 *
 * `type` maps to a backend template name:
 *   'enrollment_coach'    → new enrollment alert to coach
 *   'enrollment_customer' → confirmation to customer
 *   'welcome'             → onboarding start email to customer
 *   'payment_failed'      → failed payment notice
 *   'payment_reminder'    → nudge for incomplete checkout
 */

const API_BASE = import.meta.env.VITE_API_URL ?? '';

/**
 * Send a single email using a named backend template.
 *
 * @param {object} opts
 * @param {string} opts.type  - template name e.g. 'welcome'
 * @param {string} opts.to    - recipient email address
 * @param {object} opts.data  - variables injected into the template
 * @returns {Promise<{ success: boolean }>}
 *
 * @example
 * // Enrollment confirmation to customer
 * await sendEmail({ type: 'enrollment_customer', to: user.email, data: enrollment });
 *
 * @example
 * // Welcome after onboarding starts
 * await sendEmail({ type: 'welcome', to: user.email, data: { customerName: 'Rohan' } });
 *
 * @example
 * // Both enrollment emails in one call (uses dedicated endpoint)
 * await sendEmail({ type: 'enrollment_both', to: null, data: enrollment });
 */
export async function sendEmail({ type, to, data = {} }) {
    try {
        // Special case: fire both enrollment emails via the dedicated endpoint
        if (type === 'enrollment_both') {
            const res = await fetch(`${API_BASE}/api/send-enrollment-emails`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data),
            });
            const json = await res.json();
            if (!res.ok) {
                console.error('[emailService] enrollment_both failed:', json);
                return { success: false };
            }
            console.log(`[emailService] ✅ enrollment_both — coach:${json.coach} customer:${json.customer}`);
            return { success: true, ...json };
        }

        // All other templates → single /api/send-email call
        if (!to) {
            console.error(`[emailService] "to" is required for type="${type}"`);
            return { success: false };
        }

        const res = await fetch(`${API_BASE}/api/send-email`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ template: type, to, data }),
        });
        const json = await res.json();

        if (!res.ok) {
            console.error(`[emailService] Server error for type="${type}":`, json);
            return { success: false };
        }
        console.log(`[emailService] ✅ type="${type}" → ${to}`);
        return { success: true };

    } catch (err) {
        console.error(`[emailService] ❌ type="${type}" failed:`, err.message);
        return { success: false };
    }
}
/**
 * emailService.js
 * Sends emails via EmailJS (browser SDK) — no server required.
 * Customer confirmation includes the invoice PDF as a base64 attachment.
 *
 * ENV VARS needed in .env:
 *   VITE_EMAILJS_SERVICE_ID
 *   VITE_EMAILJS_PUBLIC_KEY
 *   VITE_EMAILJS_COACH_TEMPLATE_ID    ← template for coach notification
 *   VITE_EMAILJS_CUSTOMER_TEMPLATE_ID ← template for customer confirmation
 */

import emailjs from '@emailjs/browser';
import { generateInvoicePDF } from './invoiceService';

const SERVICE_ID = import.meta.env.VITE_EMAILJS_SERVICE_ID;
const PUBLIC_KEY = import.meta.env.VITE_EMAILJS_PUBLIC_KEY;
const COACH_TPL = import.meta.env.VITE_EMAILJS_COACH_TEMPLATE_ID;
const CUSTOMER_TPL = import.meta.env.VITE_EMAILJS_CUSTOMER_TEMPLATE_ID;

// Initialize once
emailjs.init(PUBLIC_KEY);

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatDate(date = new Date()) {
    return new Intl.DateTimeFormat('en-IN', {
        day: '2-digit', month: 'long', year: 'numeric',
        hour: '2-digit', minute: '2-digit', hour12: true,
        timeZone: 'Asia/Kolkata',
    }).format(new Date(date));
}

function formatCurrency(amount) {
    return new Intl.NumberFormat('en-IN', {
        style: 'currency', currency: 'INR', maximumFractionDigits: 0,
    }).format(amount);
}

/**
 * Convert the jsPDF doc to a base64 data URI string.
 * EmailJS accepts `{ name, data, contentType }` attachment objects
 * when the template has an attachment field named `invoice_attachment`.
 *
 * NOTE: EmailJS Pro plan is required for attachments. If you're on a free
 * plan this will silently be ignored — the rest of the email still sends.
 */
function buildInvoiceAttachment(enrollment) {
    try {
        const doc = generateInvoicePDF(enrollment);
        // output('datauristring') → "data:application/pdf;base64,JVBERi0xLjM..."
        const dataUri = doc.output('datauristring');
        // Strip the data URI prefix so we have raw base64
        const base64 = dataUri.split(',')[1];
        return {
            name: `RECODE-Invoice-${enrollment.enrollmentId}.pdf`,
            data: base64,
            contentType: 'application/pdf',
        };
    } catch (err) {
        console.warn('[emailService] Could not generate invoice attachment:', err);
        return null;
    }
}

// ─── Coach Notification Email ────────────────────────────────────────────────
/**
 * Sends a new-enrollment alert to the coach / admin.
 *
 * Template variables (must match your EmailJS template):
 *   to_email, to_name, customer_name, customer_email, customer_phone,
 *   program_name, amount_paid, payment_id, order_id, enrollment_id,
 *   payment_date, reply_to
 */
export async function sendCoachNotification(enrollment) {
    if (!SERVICE_ID || !COACH_TPL || !PUBLIC_KEY) {
        console.warn('[emailService] Coach template env vars not set — skipping.');
        return;
    }

    const params = {
        to_email: import.meta.env.VITE_COACH_EMAIL || 'Fitwithsudarshanofficial@gmail.com',
        to_name: 'Sudarshan Chavan',
        reply_to: enrollment.customerEmail,
        customer_name: enrollment.customerName,
        customer_email: enrollment.customerEmail,
        customer_phone: enrollment.customerPhone,
        program_name: enrollment.programName,
        amount_paid: formatCurrency(enrollment.amountPaid),
        payment_id: enrollment.razorpayPaymentId,
        order_id: enrollment.razorpayOrderId,
        enrollment_id: enrollment.enrollmentId,
        payment_date: formatDate(enrollment.paymentDate),
    };

    return emailjs.send(SERVICE_ID, COACH_TPL, params);
}

// ─── Customer Confirmation Email ─────────────────────────────────────────────
/**
 * Sends an enrollment confirmation + invoice attachment to the customer.
 *
 * Template variables:
 *   to_email, to_name, program_name, enrollment_id, amount_paid,
 *   payment_id, payment_date, coach_email, coach_whatsapp, reply_to,
 *   invoice_attachment  ← base64 PDF (EmailJS Pro only)
 *
 * To enable the attachment in your EmailJS template:
 *   1. In the template editor add a "Dynamic attachment" field
 *   2. Set the variable name to: invoice_attachment
 *   3. EmailJS will read `{ name, data, contentType }` from that variable
 */
export async function sendCustomerConfirmation(enrollment) {
    if (!SERVICE_ID || !CUSTOMER_TPL || !PUBLIC_KEY) {
        console.warn('[emailService] Customer template env vars not set — skipping.');
        return;
    }

    const attachment = buildInvoiceAttachment(enrollment);

    const params = {
        to_email: enrollment.customerEmail,
        to_name: enrollment.customerName,
        reply_to: import.meta.env.VITE_COACH_EMAIL || 'Fitwithsudarshanofficial@gmail.com',
        program_name: enrollment.programName,
        enrollment_id: enrollment.enrollmentId,
        amount_paid: formatCurrency(enrollment.amountPaid),
        payment_id: enrollment.razorpayPaymentId,
        payment_date: formatDate(enrollment.paymentDate),
        coach_email: import.meta.env.VITE_COACH_EMAIL || 'Fitwithsudarshanofficial@gmail.com',
        coach_whatsapp: 'https://wa.me/919619708124',
        // Attachment (requires EmailJS Pro)
        ...(attachment ? { invoice_attachment: attachment } : {}),
    };

    return emailjs.send(SERVICE_ID, CUSTOMER_TPL, params);
}

// ─── Send both emails (fire-and-forget with graceful fallback) ────────────────
export async function sendEnrollmentEmails(enrollment) {
    const results = await Promise.allSettled([
        sendCoachNotification(enrollment),
        sendCustomerConfirmation(enrollment),
    ]);

    results.forEach((r, i) => {
        if (r.status === 'rejected') {
            console.error(`[emailService] Email ${i === 0 ? 'coach' : 'customer'} failed:`, r.reason);
        } else {
            console.log(`[emailService] ✅ ${i === 0 ? 'Coach' : 'Customer'} email sent.`);
        }
    });

    return results;
}
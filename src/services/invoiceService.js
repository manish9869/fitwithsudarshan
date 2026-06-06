/**
 * invoiceService.js
 * Generates a professional PDF invoice and triggers a browser download.
 * Uses jsPDF which is already listed in package.json.
 */

import { jsPDF } from 'jspdf';

// Brand palette
const BRAND_RED = '#e71763';
const DARK_BG = '#0a0a0a';
const DARK_MID = '#1a1a1a';
const LIGHT_TEXT = '#ffffff';
const MUTED = '#888888';

function formatCurrency(amount) {
    return new Intl.NumberFormat('en-IN', {
        style: 'currency', currency: 'INR', maximumFractionDigits: 0,
    }).format(amount);
}

function formatDate(isoStr) {
    return new Intl.DateTimeFormat('en-IN', {
        day: '2-digit', month: 'long', year: 'numeric',
        timeZone: 'Asia/Kolkata',
    }).format(new Date(isoStr));
}

// ─── Draw helpers ──────────────────────────────────────────────────────────────

function hexToRGB(hex) {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return [r, g, b];
}

function setFillHex(doc, hex) {
    doc.setFillColor(...hexToRGB(hex));
}

function setTextHex(doc, hex) {
    doc.setTextColor(...hexToRGB(hex));
}

function setDrawHex(doc, hex) {
    doc.setDrawColor(...hexToRGB(hex));
}

// ─── Main generator ────────────────────────────────────────────────────────────
export function generateInvoicePDF(enrollment) {
    const doc = new jsPDF({ unit: 'mm', format: 'a4' });
    const W = 210; // A4 width mm
    const H = 297; // A4 height mm

    // ── Dark background ──
    setFillHex(doc, DARK_BG);
    doc.rect(0, 0, W, H, 'F');

    // ── Accent header bar ──
    setFillHex(doc, BRAND_RED);
    doc.rect(0, 0, W, 22, 'F');

    // ── Header text ──
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    setTextHex(doc, LIGHT_TEXT);
    doc.text('FIT WITH SUDARSHAN', 14, 14);

    // Invoice label right-aligned
    doc.setFontSize(10);
    doc.text('INVOICE', W - 14, 9, { align: 'right' });
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.text(`# ${enrollment.enrollmentId}`, W - 14, 15, { align: 'right' });

    // ── Divider strip ──
    setFillHex(doc, DARK_MID);
    doc.rect(0, 22, W, 1, 'F');

    // ── Company info block ──
    let y = 34;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    setTextHex(doc, LIGHT_TEXT);
    doc.text('FIT WITH SUDARSHAN', 14, y);
    doc.setFont('helvetica', 'normal');
    setTextHex(doc, MUTED);
    doc.setFontSize(8);
    doc.text('RECODE™ — Recovery-Based Transformation', 14, y + 5);
    doc.text('Mumbai, Maharashtra, India', 14, y + 10);
    doc.text('Fitwithsudarshanofficial@gmail.com', 14, y + 15);
    doc.text('+91 96197 08124', 14, y + 20);

    // ── Invoice meta right ──
    const metaX = W - 14;
    doc.setFont('helvetica', 'bold');
    setTextHex(doc, LIGHT_TEXT);
    doc.text('Invoice Date', metaX, y, { align: 'right' });
    doc.setFont('helvetica', 'normal');
    setTextHex(doc, MUTED);
    doc.text(formatDate(enrollment.paymentDate), metaX, y + 5, { align: 'right' });

    doc.setFont('helvetica', 'bold');
    setTextHex(doc, LIGHT_TEXT);
    doc.text('Payment Status', metaX, y + 12, { align: 'right' });
    setTextHex(doc, '#22c55e'); // green
    doc.text('PAID', metaX, y + 17, { align: 'right' });

    // ── Section separator ──
    y += 30;
    setDrawHex(doc, '#333333');
    doc.setLineWidth(0.3);
    doc.line(14, y, W - 14, y);
    y += 8;

    // ── Bill To ──
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    setTextHex(doc, BRAND_RED);
    doc.text('BILL TO', 14, y);
    y += 6;
    doc.setFont('helvetica', 'bold');
    setTextHex(doc, LIGHT_TEXT);
    doc.setFontSize(10);
    doc.text(enrollment.customerName, 14, y);
    doc.setFont('helvetica', 'normal');
    setTextHex(doc, MUTED);
    doc.setFontSize(8);
    doc.text(enrollment.customerEmail, 14, y + 5);
    if (enrollment.customerPhone) {
        doc.text(enrollment.customerPhone, 14, y + 10);
    }

    // ── Payment Reference right ──
    const refY = y;
    doc.setFont('helvetica', 'bold');
    setTextHex(doc, BRAND_RED);
    doc.text('PAYMENT REFERENCE', metaX, refY, { align: 'right' });
    doc.setFont('helvetica', 'normal');
    setTextHex(doc, MUTED);
    doc.text(`Enrollment ID: ${enrollment.enrollmentId}`, metaX, refY + 6, { align: 'right' });
    doc.text(`Payment ID: ${enrollment.razorpayPaymentId}`, metaX, refY + 11, { align: 'right' });
    doc.text(`Order ID: ${enrollment.razorpayOrderId}`, metaX, refY + 16, { align: 'right' });

    // ── Line items table ──
    y += 28;
    setDrawHex(doc, '#333333');
    doc.line(14, y, W - 14, y);
    y += 1;

    // Table header
    setFillHex(doc, DARK_MID);
    doc.rect(14, y, W - 28, 10, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    setTextHex(doc, MUTED);
    doc.text('DESCRIPTION', 18, y + 6.5);
    doc.text('PROGRAM', 90, y + 6.5);
    doc.text('DURATION', 135, y + 6.5);
    doc.text('AMOUNT', W - 18, y + 6.5, { align: 'right' });
    y += 10;

    // Table row
    setFillHex(doc, '#111111');
    doc.rect(14, y, W - 28, 14, 'F');
    doc.setFont('helvetica', 'normal');
    setTextHex(doc, LIGHT_TEXT);
    doc.text('RECODE™ Coaching Plan', 18, y + 9);
    setTextHex(doc, MUTED);
    doc.text(enrollment.coachingType || 'Online', 90, y + 9);
    doc.text(
        enrollment.durationMonths ? `${enrollment.durationMonths} Month${enrollment.durationMonths > 1 ? 's' : ''}` : '—',
        135, y + 9
    );
    setTextHex(doc, LIGHT_TEXT);
    doc.text(formatCurrency(enrollment.amountPaid), W - 18, y + 9, { align: 'right' });
    y += 14;

    // ── Totals ──
    y += 4;
    setDrawHex(doc, '#333333');
    doc.line(120, y, W - 14, y);
    y += 6;

    const totalRows = [
        ['Subtotal', formatCurrency(enrollment.amountPaid)],
        ['GST / Tax', 'Included'],
        ['TOTAL PAID', formatCurrency(enrollment.amountPaid)],
    ];

    totalRows.forEach(([label, val], i) => {
        const isLast = i === totalRows.length - 1;
        if (isLast) {
            setFillHex(doc, BRAND_RED);
            doc.rect(120, y - 2, W - 14 - 120, 10, 'F');
            doc.setFont('helvetica', 'bold');
            setTextHex(doc, LIGHT_TEXT);
        } else {
            doc.setFont('helvetica', 'normal');
            setTextHex(doc, MUTED);
        }
        doc.text(label, 124, y + 4.5);
        doc.text(val, W - 18, y + 4.5, { align: 'right' });
        y += isLast ? 12 : 8;
    });

    // ── Next steps ──
    y += 6;
    setFillHex(doc, DARK_MID);
    doc.rect(14, y, W - 28, 40, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    setTextHex(doc, BRAND_RED);
    doc.text('WHAT HAPPENS NEXT', 18, y + 8);
    doc.setFont('helvetica', 'normal');
    setTextHex(doc, MUTED);
    doc.setFontSize(8);
    const steps = [
        '① Our coaching team will review your enrollment within 24 hours.',
        '② You will receive your onboarding instructions via WhatsApp & email.',
        '③ Your personalized RECODE™ fitness plan will be prepared.',
        '④ Begin your transformation journey!',
    ];
    steps.forEach((s, i) => {
        doc.text(s, 18, y + 16 + i * 7);
    });

    // ── Footer ──
    y = H - 16;
    setFillHex(doc, DARK_MID);
    doc.rect(0, y, W, 16, 'F');
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    setTextHex(doc, MUTED);
    doc.text('FitWithSudarshan.com  |  Fitwithsudarshanofficial@gmail.com  |  +91 96197 08124', W / 2, y + 6, { align: 'center' });
    doc.text('This is a computer-generated invoice. No signature required.', W / 2, y + 12, { align: 'center' });

    return doc;
}

// ─── Download trigger ──────────────────────────────────────────────────────────
export function downloadInvoice(enrollment) {
    const doc = generateInvoicePDF(enrollment);
    const filename = `RECODE-Invoice-${enrollment.enrollmentId}.pdf`;
    doc.save(filename);
}

// ─── Return as blob URL (for inline preview / email attachment) ────────────────
export function getInvoiceBlobUrl(enrollment) {
    const doc = generateInvoicePDF(enrollment);
    const blob = doc.output('blob');
    return URL.createObjectURL(blob);
}
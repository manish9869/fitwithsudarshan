/**
 * src/pages/admin/adminPdfExport.js
 *
 * jsPDF-based PDF exports, split out of adminUtils.js so that jsPDF (and its
 * internal html2canvas dependency) only gets fetched when an admin actually
 * clicks "Export PDF" — not on every admin page that imports adminUtils.js
 * for a formatter. Always import this module dynamically (`await import(...)`)
 * at the point of use, never as a static top-level import.
 */
import jsPDF from 'jspdf';
import { fmtCurrency } from './adminUtils';

// ── PDF Export — Enrollments ──────────────────────────────────────────────────
export function exportEnrollmentsToPDF(rows, { dateFrom, dateTo, filters } = {}) {
    const doc = new jsPDF({ unit: 'mm', format: 'a4', orientation: 'landscape' });
    const PW = 297, PH = 210;
    const ML = 10, MR = 10;
    const CW = PW - ML - MR;

    // Colors
    const BRAND = [231, 23, 99];
    const BG = [10, 10, 14];
    const CARD = [18, 18, 24];
    const WHITE = [255, 255, 255];
    const GREY60 = [153, 153, 168];
    const GREY35 = [90, 90, 105];
    const HEADER_ROW = [30, 30, 42];
    const ALT_ROW = [22, 22, 30];

    const fc = (c) => doc.setFillColor(...c);
    const tc = (c) => doc.setTextColor(...c);
    const dc = (c) => doc.setDrawColor(...c);

    // Background
    fc(BG); doc.rect(0, 0, PW, PH, 'F');

    // Header bar
    fc(CARD); doc.rect(0, 0, PW, 24, 'F');
    fc(BRAND); doc.rect(0, 0, PW, 2.5, 'F');

    doc.setFont('helvetica', 'bold'); doc.setFontSize(14);
    tc(WHITE);
    doc.text('RECODE™', ML + 3, 13);
    doc.setFont('helvetica', 'normal'); doc.setFontSize(9);
    tc(GREY60);
    doc.text('Enrollment Report', ML + 3, 19);

    // Date range
    const dateLabel = dateFrom && dateTo ? `${dateFrom} → ${dateTo}` : 'All Time';
    doc.setFont('helvetica', 'normal'); doc.setFontSize(8);
    tc(GREY35);
    doc.text(`Generated: ${new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}`, PW - MR, 12, { align: 'right' });
    doc.text(`Period: ${dateLabel}`, PW - MR, 18, { align: 'right' });

    // Summary strip
    const totalRevenue = rows.reduce((s, r) => s + (Number(r.amount_paid) || 0), 0);
    const totalEnrollments = rows.length;
    const coupleCount = rows.filter(r => r.plan_type === 'couple').length;
    const couponCount = rows.filter(r => r.coupon_code).length;

    fc(BRAND); doc.rect(ML, 26, CW, 10, 'F');
    doc.setFont('helvetica', 'bold'); doc.setFontSize(7.5);
    tc(WHITE);
    const summaryItems = [
        `Total Enrollments: ${totalEnrollments}`,
        `Total Revenue: ${fmtCurrency(totalRevenue)}`,
        `Couple Plans: ${coupleCount}`,
        `Coupons Used: ${couponCount}`,
    ];
    summaryItems.forEach((item, i) => {
        doc.text(item, ML + 8 + i * (CW / 4), 32.5);
    });

    // Table
    const tableTop = 40;
    const cols = [
        { key: 'enrollment_id', label: 'Enrollment ID', w: 32 },
        { key: 'customer_name', label: 'Name', w: 30 },
        { key: 'customer_email', label: 'Email', w: 44 },
        { key: 'customer_phone', label: 'Phone', w: 24 },
        { key: 'program_name', label: 'Program', w: 42 },
        { key: 'coaching_type', label: 'Type', w: 18 },
        { key: 'plan_type', label: 'Plan', w: 18 },
        { key: 'duration_months', label: 'Duration', w: 16 },
        { key: 'amount_paid', label: 'Amount', w: 20 },
        { key: 'payment_status', label: 'Status', w: 16 },
        { key: 'payment_date', label: 'Date', w: 17 },
    ];

    // Table header
    fc(HEADER_ROW);
    doc.rect(ML, tableTop, CW, 8, 'F');
    doc.setFont('helvetica', 'bold'); doc.setFontSize(6.5);
    tc(GREY60);
    let cx = ML + 2;
    cols.forEach(col => {
        doc.text(col.label.toUpperCase(), cx, tableTop + 5.2);
        cx += col.w;
    });

    // Table rows
    const ROW_H = 7;
    const MAX_ROWS = Math.floor((PH - tableTop - 8 - 14) / ROW_H);
    const visibleRows = rows.slice(0, MAX_ROWS);

    visibleRows.forEach((row, i) => {
        const ry = tableTop + 8 + i * ROW_H;
        if (i % 2 === 0) { fc(ALT_ROW); doc.rect(ML, ry, CW, ROW_H, 'F'); }

        doc.setFont('helvetica', 'normal'); doc.setFontSize(6.5);
        tc(GREY60);
        cx = ML + 2;
        cols.forEach(col => {
            let val = row[col.key];
            if (col.key === 'amount_paid') val = fmtCurrency(val);
            else if (col.key === 'duration_months') val = val ? `${val}M` : '—';
            else if (col.key === 'payment_date') val = val ? new Date(val).toLocaleDateString('en-IN') : '—';
            else if (col.key === 'program_name') val = String(val || '').substring(0, 28);
            else if (col.key === 'customer_email') val = String(val || '').substring(0, 26);
            val = String(val ?? '—');
            doc.text(val, cx, ry + 4.5);
            cx += col.w;
        });

        // Bottom border
        dc([30, 30, 42]); doc.setLineWidth(0.1);
        doc.line(ML, ry + ROW_H, ML + CW, ry + ROW_H);
    });

    if (rows.length > MAX_ROWS) {
        doc.setFont('helvetica', 'italic'); doc.setFontSize(7); tc(GREY35);
        doc.text(`+ ${rows.length - MAX_ROWS} more rows — export Excel for full dataset`, ML, PH - 10);
    }

    // Footer
    fc(CARD); doc.rect(0, PH - 8, PW, 8, 'F');
    doc.setFont('helvetica', 'normal'); doc.setFontSize(6.5); tc(GREY35);
    doc.text('FitWithSudarshan · RECODE™ · Confidential', PW / 2, PH - 3, { align: 'center' });
    doc.text(`Page 1`, PW - MR, PH - 3, { align: 'right' });

    doc.save(`recode-enrollments-${new Date().toISOString().slice(0, 10)}.pdf`);
}

// ── PDF Export — Assessments ──────────────────────────────────────────────────
export function exportAssessmentsToPDF(rows, { dateFrom, dateTo } = {}) {
    const doc = new jsPDF({ unit: 'mm', format: 'a4', orientation: 'landscape' });
    const PW = 297, PH = 210;
    const ML = 10, MR = 10;
    const CW = PW - ML - MR;

    const BRAND = [231, 23, 99];
    const BG = [10, 10, 14];
    const CARD = [18, 18, 24];
    const WHITE = [255, 255, 255];
    const GREY60 = [153, 153, 168];
    const GREY35 = [90, 90, 105];
    const HEADER_ROW = [30, 30, 42];
    const ALT_ROW = [22, 22, 30];

    const fc = (c) => doc.setFillColor(...c);
    const tc = (c) => doc.setTextColor(...c);
    const dc = (c) => doc.setDrawColor(...c);

    fc(BG); doc.rect(0, 0, PW, PH, 'F');
    fc(CARD); doc.rect(0, 0, PW, 24, 'F');
    fc(BRAND); doc.rect(0, 0, PW, 2.5, 'F');

    doc.setFont('helvetica', 'bold'); doc.setFontSize(14); tc(WHITE);
    doc.text('RECODE™', ML + 3, 13);
    doc.setFont('helvetica', 'normal'); doc.setFontSize(9); tc(GREY60);
    doc.text('Assessment Report', ML + 3, 19);

    const dateLabel = dateFrom && dateTo ? `${dateFrom} → ${dateTo}` : 'All Time';
    doc.setFont('helvetica', 'normal'); doc.setFontSize(8); tc(GREY35);
    doc.text(`Generated: ${new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}`, PW - MR, 12, { align: 'right' });
    doc.text(`Period: ${dateLabel}`, PW - MR, 18, { align: 'right' });

    // Summary
    const avgCommitment = rows.length
        ? (rows.reduce((s, r) => s + (r.commitment || 0), 0) / rows.length).toFixed(1)
        : '—';
    fc(BRAND); doc.rect(ML, 26, CW, 10, 'F');
    doc.setFont('helvetica', 'bold'); doc.setFontSize(7.5); tc(WHITE);
    [
        `Total Assessments: ${rows.length}`,
        `Avg. Commitment: ${avgCommitment}/10`,
        `New: ${rows.filter(r => r.status === 'new').length}`,
        `Completed: ${rows.filter(r => r.status === 'completed').length}`,
    ].forEach((item, i) => doc.text(item, ML + 8 + i * (CW / 4), 32.5));

    const tableTop = 40;
    const cols = [
        { key: 'first_name', label: 'Name', w: 28 },
        { key: 'whatsapp', label: 'WhatsApp', w: 26 },
        { key: 'age', label: 'Age', w: 10 },
        { key: 'gender', label: 'Gender', w: 16 },
        { key: 'city', label: 'City', w: 22 },
        { key: 'plan', label: 'Plan', w: 36 },
        { key: 'main_goal', label: 'Goal', w: 42 },
        { key: 'workout_status', label: 'Fitness Level', w: 32 },
        { key: 'commitment', label: 'Commit', w: 14 },
        { key: 'status', label: 'Status', w: 18 },
        { key: 'created_at', label: 'Submitted', w: 22 },
    ];

    fc(HEADER_ROW); doc.rect(ML, tableTop, CW, 8, 'F');
    doc.setFont('helvetica', 'bold'); doc.setFontSize(6.5); tc(GREY60);
    let cx = ML + 2;
    cols.forEach(col => { doc.text(col.label.toUpperCase(), cx, tableTop + 5.2); cx += col.w; });

    const ROW_H = 7;
    const MAX_ROWS = Math.floor((PH - tableTop - 8 - 14) / ROW_H);
    rows.slice(0, MAX_ROWS).forEach((row, i) => {
        const ry = tableTop + 8 + i * ROW_H;
        if (i % 2 === 0) { fc(ALT_ROW); doc.rect(ML, ry, CW, ROW_H, 'F'); }
        doc.setFont('helvetica', 'normal'); doc.setFontSize(6.5); tc(GREY60);
        cx = ML + 2;
        cols.forEach(col => {
            let val = row[col.key];
            if (col.key === 'first_name') val = `${row.first_name || ''} ${row.last_name || ''}`.trim();
            else if (col.key === 'commitment') val = val ? `${val}/10` : '—';
            else if (col.key === 'created_at') val = val ? new Date(val).toLocaleDateString('en-IN') : '—';
            else if (col.key === 'main_goal') val = String(val || '').substring(0, 26);
            else if (col.key === 'workout_status') val = String(val || '').replace(/\s*\(.*?\)/, '').substring(0, 18);
            doc.text(String(val ?? '—'), cx, ry + 4.5);
            cx += col.w;
        });
        dc([30, 30, 42]); doc.setLineWidth(0.1);
        doc.line(ML, ry + ROW_H, ML + CW, ry + ROW_H);
    });

    if (rows.length > MAX_ROWS) {
        doc.setFont('helvetica', 'italic'); doc.setFontSize(7); tc(GREY35);
        doc.text(`+ ${rows.length - MAX_ROWS} more rows — export Excel for full dataset`, ML, PH - 10);
    }

    fc(CARD); doc.rect(0, PH - 8, PW, 8, 'F');
    doc.setFont('helvetica', 'normal'); doc.setFontSize(6.5); tc(GREY35);
    doc.text('FitWithSudarshan · RECODE™ · Confidential', PW / 2, PH - 3, { align: 'center' });

    doc.save(`recode-assessments-${new Date().toISOString().slice(0, 10)}.pdf`);
}

/**
 * src/pages/admin/adminUtils.js
 *
 * Formatting helpers + CSV / Excel / PDF export utilities.
 * Also exports date-range presets used by the export modals.
 */
import jsPDF from 'jspdf';
import * as XLSX from 'xlsx';
import { getToken } from './adminApi';

// ── Formatters ────────────────────────────────────────────────────────────────

// Beautifies raw DB slugs (coaching_type, plan_type, payment_method, etc.)
// for display — "basic_individual" → "Basic Individual". Previously only
// used for the enrollments list's filter dropdown labels; the table cells
// and detail-drawer rows right next to those same filters showed the raw
// slug, so the two views of the same field looked inconsistent.
export function formatLabel(value) {
    if (!value) return '—';
    return String(value)
        .replace(/_/g, ' ')
        .replace(/\b\w/g, (c) => c.toUpperCase());
}

export function fmtCurrency(amount) {
    if (!amount && amount !== 0) return '—';
    return new Intl.NumberFormat('en-IN', {
        style: 'currency', currency: 'INR', maximumFractionDigits: 0,
    }).format(amount);
}

export function fmtCompactCurrency(amount) {
    if (!amount && amount !== 0) return '—';
    const n = Number(amount);
    if (n >= 100000) return `₹${(n / 100000).toFixed(1)}L`;
    if (n >= 1000) return `₹${(n / 1000).toFixed(1)}K`;
    return fmtCurrency(n);
}

export function fmtDate(iso, short = false) {
    if (!iso) return '—';
    const d = new Date(iso);
    if (isNaN(d.getTime())) return '—';
    if (short) {
        return new Intl.DateTimeFormat('en-IN', {
            day: '2-digit', month: 'short', year: 'numeric', timeZone: 'Asia/Kolkata',
        }).format(d);
    }
    return new Intl.DateTimeFormat('en-IN', {
        day: '2-digit', month: 'short', year: 'numeric',
        hour: '2-digit', minute: '2-digit', hour12: true, timeZone: 'Asia/Kolkata',
    }).format(d);
}

export function fmtRelativeTime(iso) {
    if (!iso) return '—';
    const d = new Date(iso);
    if (isNaN(d.getTime())) return '—';
    const diffMs = Date.now() - d.getTime();
    const mins = Math.floor(diffMs / 60000);
    if (mins < 1) return 'just now';
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    const days = Math.floor(hrs / 24);
    if (days < 7) return `${days}d ago`;
    return fmtDate(iso, true);
}

export function fmtGoals(goals) {
    if (!goals) return '—';
    if (Array.isArray(goals)) return goals.join(', ') || '—';
    return String(goals);
}

// Display-only — never mutates what's actually stored. Handles the common
// real-world mess (ALL CAPS, all lowercase, "john  doe") without trying to
// be clever about apostrophes/hyphens (McDonald, O'Brien) — good enough for
// how names actually get typed into a form, not a full name-parsing library.
export function fmtName(name) {
    if (!name) return name;
    return String(name)
        .trim()
        .toLowerCase()
        .replace(/\s+/g, ' ')
        .replace(/\b\p{L}/gu, (c) => c.toUpperCase());
}

// Turns a display name into a URL/id-safe slug — "Paneer Tikka!" -> "paneer-tikka".
export function slugify(s) {
    return String(s || '').toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/(^-+|-+$)/g, '');
}

// Appends "-2", "-3"… only if the base id is already taken — used wherever
// an id auto-generates from a name field (Diet Foods, Diet Exercises, Diet
// Templates) so ids stay readable in the common case of no collision,
// instead of always suffixing something the admin never even sees.
export function uniqueId(base, existingIds) {
    if (!base) return base;
    if (!existingIds.has(base)) return base;
    let n = 2;
    while (existingIds.has(`${base}-${n}`)) n++;
    return `${base}-${n}`;
}

// ── Date Range Presets ────────────────────────────────────────────────────────
export const DATE_PRESETS = [
    { label: 'Today', days: 0 },
    { label: 'Yesterday', days: 1 },
    { label: 'Last 7 days', days: 7 },
    { label: 'Last 30 days', days: 30 },
    { label: 'Last 3 months', days: 90 },
    { label: 'Last 6 months', days: 180 },
    { label: 'Last 1 year', days: 365 },
    { label: 'All time', days: 9999 },
];

export function presetToDateRange(days) {
    const now = new Date();
    const to = new Date(now);
    to.setHours(23, 59, 59, 999);
    const from = new Date(now);
    if (days === 0) {
        from.setHours(0, 0, 0, 0);
    } else if (days === 1) {
        from.setDate(from.getDate() - 1);
        from.setHours(0, 0, 0, 0);
        to.setDate(to.getDate() - 1);
        to.setHours(23, 59, 59, 999);
    } else if (days === 9999) {
        from.setFullYear(2020, 0, 1);
        from.setHours(0, 0, 0, 0);
    } else {
        from.setDate(from.getDate() - days);
        from.setHours(0, 0, 0, 0);
    }
    return {
        from: from.toISOString().slice(0, 10),
        to: to.toISOString().slice(0, 10),
    };
}

// ── CSV Export ────────────────────────────────────────────────────────────────
export function exportToCSV(data, filename) {
    if (!data || !data.length) return;
    const headers = Object.keys(data[0]);
    const csvRows = [
        headers.join(','),
        ...data.map((row) =>
            headers
                .map((h) => {
                    const val = row[h];
                    if (val === null || val === undefined) return '';
                    if (Array.isArray(val)) return `"${val.join('; ')}"`;
                    const str = String(val).replace(/"/g, '""');
                    return str.includes(',') || str.includes('\n') || str.includes('"')
                        ? `"${str}"`
                        : str;
                })
                .join(',')
        ),
    ].join('\n');

    triggerDownload(new Blob([csvRows], { type: 'text/csv;charset=utf-8;' }), `${filename}.csv`);
}

// ── Excel Export ──────────────────────────────────────────────────────────────
export function exportToExcel(data, filename, sheetName = 'Data') {
    if (!data || !data.length) return;

    const ws = XLSX.utils.json_to_sheet(data);

    // Auto-width columns
    const colWidths = Object.keys(data[0]).map((key) => ({
        wch: Math.max(
            key.length + 2,
            ...data.slice(0, 50).map((row) => String(row[key] ?? '').length + 2)
        ),
    }));
    ws['!cols'] = colWidths;

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, sheetName);
    XLSX.writeFile(wb, `${filename}.xlsx`);
}

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
    const GREEN = [52, 211, 153];
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

// ── Excel Export — Enrollments ────────────────────────────────────────────────
export function exportEnrollmentsToExcel(rows, { dateFrom, dateTo } = {}) {
    const data = rows.map((r) => ({
        'Enrollment ID': r.enrollment_id || '',
        'Customer Name': r.customer_name || '',
        'Email': r.customer_email || '',
        'Phone': r.customer_phone || '',
        'Program': r.program_name || '',
        'Coaching Type': r.coaching_type || '',
        'Plan Type': r.plan_type || '',
        'Duration (months)': r.duration_months || '',
        'Amount Paid (₹)': r.amount_paid || 0,
        'Original Amount (₹)': r.original_amount || r.amount_paid || 0,
        'Coupon Code': r.coupon_code || '',
        'Coupon Savings (₹)': r.coupon_savings || 0,
        'Payment Status': r.payment_status || '',
        'Payment Date': r.payment_date ? new Date(r.payment_date).toLocaleDateString('en-IN') : '',
        'Age': r.age || '',
        'City': r.city || '',
        'Weight': r.weight || '',
        'Goals': Array.isArray(r.goals) ? r.goals.join('; ') : (r.goals || ''),
        'Medical Issue': r.medical_issue || '',
        'Medical Note': r.medical_note || '',
        'Partner Name': r.partner_name || '',
        'Partner Age': r.partner_age || '',
        'Partner Goals': Array.isArray(r.partner_goals) ? r.partner_goals.join('; ') : '',
        'Razorpay Payment ID': r.razorpay_payment_id || '',
        'Razorpay Order ID': r.razorpay_order_id || '',
        'Created At': r.created_at ? new Date(r.created_at).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }) : '',
    }));

    const ws = XLSX.utils.json_to_sheet(data);

    // Header styling
    const range = XLSX.utils.decode_range(ws['!ref']);
    for (let C = range.s.c; C <= range.e.c; C++) {
        const addr = XLSX.utils.encode_cell({ r: 0, c: C });
        if (!ws[addr]) continue;
        ws[addr].s = { font: { bold: true }, fill: { fgColor: { rgb: 'E71763' } }, alignment: { horizontal: 'center' } };
    }

    // Auto column widths
    ws['!cols'] = Object.keys(data[0] || {}).map((key) => ({
        wch: Math.max(key.length + 2, ...data.slice(0, 100).map((row) => String(row[key] ?? '').length + 2)),
    }));

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Enrollments');

    // Summary sheet
    const summary = [
        ['RECODE™ Enrollment Export Summary', ''],
        ['Generated', new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })],
        ['Period', dateFrom && dateTo ? `${dateFrom} to ${dateTo}` : 'All Time'],
        ['Total Enrollments', rows.length],
        ['Total Revenue (₹)', rows.reduce((s, r) => s + (Number(r.amount_paid) || 0), 0)],
        ['Individual Plans', rows.filter(r => r.plan_type === 'individual').length],
        ['Couple Plans', rows.filter(r => r.plan_type === 'couple').length],
        ['Online Coaching', rows.filter(r => r.coaching_type === 'online').length],
        ['Video Coaching', rows.filter(r => r.coaching_type === 'video').length],
        ['Personal Training', rows.filter(r => r.coaching_type === 'personal').length],
        ['Coupons Used', rows.filter(r => r.coupon_code).length],
        ['Total Savings Given (₹)', rows.reduce((s, r) => s + (Number(r.coupon_savings) || 0), 0)],
    ];
    const wsSummary = XLSX.utils.aoa_to_sheet(summary);
    wsSummary['!cols'] = [{ wch: 30 }, { wch: 25 }];
    XLSX.utils.book_append_sheet(wb, wsSummary, 'Summary');

    XLSX.writeFile(wb, `recode-enrollments-${new Date().toISOString().slice(0, 10)}.xlsx`);
}

// ── Excel Export — Assessments ────────────────────────────────────────────────
export function exportAssessmentsToExcel(rows, { dateFrom, dateTo } = {}) {
    const data = rows.map((r) => ({
        'Assessment ID': r.id || '',
        'First Name': r.first_name || '',
        'Last Name': r.last_name || '',
        'WhatsApp': r.whatsapp || '',
        'Email': r.email || '',
        'Age': r.age || '',
        'Gender': r.gender || '',
        'City': r.city || '',
        'Plan': r.plan || '',
        'Profession': r.profession || '',
        'Weight (kg)': r.current_weight || '',
        'Height (cm)': r.height || '',
        'Workout Status': r.workout_status || '',
        'Training Days/Week': r.training_days || '',
        'Training Location': r.training_location || '',
        'Main Goal': r.main_goal || '',
        'Desired Result': r.desired_result || '',
        'Why Now': r.why_now || '',
        'Food Preference': r.food_preference || '',
        'Daily Food Routine': r.daily_food_routine || '',
        'Biggest Struggle': r.biggest_struggle || '',
        'Sleep Hours': r.sleep_hours || '',
        'Medical Conditions': r.medical_conditions || '',
        'Commitment Score': r.commitment ?? '',
        'Status': r.status || '',
        'Submitted At': r.created_at ? new Date(r.created_at).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }) : '',
    }));

    const ws = XLSX.utils.json_to_sheet(data);
    ws['!cols'] = Object.keys(data[0] || {}).map((key) => ({
        wch: Math.max(key.length + 2, ...data.slice(0, 100).map((row) => String(row[key] ?? '').length + 2)),
    }));

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Assessments');

    const summary = [
        ['RECODE™ Assessment Export Summary', ''],
        ['Generated', new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })],
        ['Period', dateFrom && dateTo ? `${dateFrom} to ${dateTo}` : 'All Time'],
        ['Total Assessments', rows.length],
        ['New', rows.filter(r => r.status === 'new').length],
        ['Reviewed', rows.filter(r => r.status === 'reviewed').length],
        ['Plan Sent', rows.filter(r => r.status === 'plan_sent').length],
        ['Completed', rows.filter(r => r.status === 'completed').length],
        ['Avg. Commitment', rows.length ? (rows.reduce((s, r) => s + (r.commitment || 0), 0) / rows.length).toFixed(1) : '—'],
    ];
    const wsSummary = XLSX.utils.aoa_to_sheet(summary);
    wsSummary['!cols'] = [{ wch: 28 }, { wch: 22 }];
    XLSX.utils.book_append_sheet(wb, wsSummary, 'Summary');

    XLSX.writeFile(wb, `recode-assessments-${new Date().toISOString().slice(0, 10)}.xlsx`);
}

// ── PDF Invoice (via backend, admin-authenticated) ────────────────────────────
// Goes through the authenticated /api/admin/enrollments/:id/invoice route
// (not the public /api/invoice used right after a website checkout) so it
// works for manual enrollments too and the PDF is always built from the
// server's own record, not whatever fields this call happens to pass.
export async function downloadInvoicePDF(enrollment) {
    const API_BASE = import.meta.env.VITE_API_URL ?? '';

    const dbId = enrollment?.id;
    const invoiceId = enrollment?.enrollmentId || enrollment?.enrollment_id;

    if (!dbId) {
        throw new Error('Missing enrollment ID.');
    }

    const res = await fetch(`${API_BASE}/api/admin/enrollments/${dbId}/invoice`, {
        headers: {
            Accept: 'application/pdf',
            Authorization: `Bearer ${getToken()}`,
        },
    });

    const contentType = res.headers.get('content-type') || '';

    if (!res.ok) {
        let message = 'Invoice generation failed.';

        try {
            const data = await res.json();
            message = data?.error || data?.message || message;
        } catch {
            // ignore
        }

        throw new Error(message);
    }

    if (!contentType.toLowerCase().includes('application/pdf')) {
        throw new Error('Server did not return a valid PDF.');
    }

    const blob = await res.blob();

    if (!blob || blob.size === 0) {
        throw new Error('Generated invoice PDF is empty.');
    }

    const safeInvoiceId = String(invoiceId).replace(/[^a-zA-Z0-9-_]/g, '');

    const timestamp = new Date()
        .toISOString()
        .replace(/[:.]/g, '-')
        .slice(0, 19);

    triggerDownload(
        blob,
        `RECODE-Invoice-${safeInvoiceId}-${timestamp}.pdf`
    );

    return true;
}
// ── PDF Receipt for a single payment (partial/installment) — via backend,
//    admin-authenticated. Goes through /api/admin/enrollments/:id/payments/
//    :paymentId/receipt — the server looks up the enrollment + payment (and
//    recomputes the running "paid to date" total) itself instead of trusting
//    whatever the caller passes in.
export async function downloadPaymentReceiptPDF({ enrollment, payment }) {
    const API_BASE = import.meta.env.VITE_API_URL ?? '';

    if (!enrollment?.id || !payment?.id) {
        throw new Error('Missing enrollment or payment ID.');
    }

    const res = await fetch(`${API_BASE}/api/admin/enrollments/${enrollment.id}/payments/${payment.id}/receipt`, {
        headers: {
            Accept: 'application/pdf',
            Authorization: `Bearer ${getToken()}`,
        },
    });

    const contentType = res.headers.get('content-type') || '';

    if (!res.ok) {
        let message = 'Receipt generation failed.';
        try {
            const data = await res.json();
            message = data?.error || data?.message || message;
        } catch {
            // ignore
        }
        throw new Error(message);
    }

    if (!contentType.toLowerCase().includes('application/pdf')) {
        throw new Error('Server did not return a valid PDF.');
    }

    const blob = await res.blob();
    if (!blob || blob.size === 0) {
        throw new Error('Generated receipt PDF is empty.');
    }

    const safeId = String(enrollment.enrollmentId || enrollment.enrollment_id || 'receipt')
        .replace(/[^a-zA-Z0-9-_]/g, '');
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);

    triggerDownload(blob, `RECODE-Receipt-${safeId}-${timestamp}.pdf`);
    return true;
}

// ── Date + Time (always shown, 12-hour format, IST) ──────────────────────────
export function fmtDateTime(iso) {
    if (!iso) return '—';
    const d = new Date(iso);
    if (isNaN(d.getTime())) return '—';
    return new Intl.DateTimeFormat('en-IN', {
        day: '2-digit', month: 'short', year: 'numeric',
        hour: 'numeric', minute: '2-digit', hour12: true,
        timeZone: 'Asia/Kolkata',
    }).format(d);
}

// ── Convert an ISO timestamp to a value usable in <input type="datetime-local">,
// expressed in IST wall-clock time (so what the admin sees/edits matches
// what shows up everywhere else, since the whole app displays IST).
export function toISTDatetimeLocal(iso) {
    const d = iso ? new Date(iso) : new Date();
    if (isNaN(d.getTime())) return '';
    const parts = new Intl.DateTimeFormat('en-CA', {
        timeZone: 'Asia/Kolkata',
        year: 'numeric', month: '2-digit', day: '2-digit',
        hour: '2-digit', minute: '2-digit', hour12: false,
    }).formatToParts(d);
    const get = (t) => parts.find((p) => p.type === t)?.value;
    return `${get('year')}-${get('month')}-${get('day')}T${get('hour')}:${get('minute')}`;
}

// Turns a <input type="datetime-local"> value ("YYYY-MM-DDTHH:mm") into a
// correct UTC ISO string, treating the input as IST (since that's what the
// admin panel displays everywhere). Without this, the browser/server would
// each guess the timezone differently and the saved time could drift.
export function istDatetimeLocalToISO(value) {
    if (!value) return null;
    // value has no seconds/offset — append both, pinned to IST (+05:30)
    return new Date(`${value}:00+05:30`).toISOString();
}

// ── Helpers ───────────────────────────────────────────────────────────────────
function triggerDownload(blob, filename) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');

    a.href = url;
    a.download = filename;
    a.style.display = 'none';

    document.body.appendChild(a);
    a.click();

    setTimeout(() => {
        URL.revokeObjectURL(url);
        a.remove();
    }, 1000);
}

// ── Badge colors ──────────────────────────────────────────────────────────────
export function statusBadge(status) {
    const map = {
        paid: { bg: 'rgba(52,211,153,0.1)', border: 'rgba(52,211,153,0.3)', color: '#34d399' },
        pending: { bg: 'rgba(251,191,36,0.1)', border: 'rgba(251,191,36,0.3)', color: '#fbbf24' },
        failed: { bg: 'rgba(239,68,68,0.1)', border: 'rgba(239,68,68,0.3)', color: '#f87171' },
        refunded: { bg: 'rgba(168,85,247,0.1)', border: 'rgba(168,85,247,0.3)', color: '#c084fc' },
        new: { bg: 'rgba(96,165,250,0.1)', border: 'rgba(96,165,250,0.3)', color: '#60a5fa' },
        reviewed: { bg: 'rgba(251,191,36,0.1)', border: 'rgba(251,191,36,0.3)', color: '#fbbf24' },
        plan_sent: { bg: 'rgba(167,139,250,0.1)', border: 'rgba(167,139,250,0.3)', color: '#a78bfa' },
        completed: { bg: 'rgba(52,211,153,0.1)', border: 'rgba(52,211,153,0.3)', color: '#34d399' },
        archived: { bg: 'rgba(255,255,255,0.04)', border: 'rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.4)' },
    };
    return map[status] || map.new;
}

export function exportSingleEnrollmentToExcel(enrollment) {
    exportEnrollmentsToExcel([enrollment], {});
}
export function exportSingleAssessmentToExcel(assessment) {
    exportAssessmentsToExcel([assessment], {});
}
export function exportSingleRowToJSON(row, filename) {
    const blob = new Blob([JSON.stringify(row, null, 2)], { type: 'application/json' });
    triggerDownload(blob, `${filename}.json`);
}

export const ENROLLMENT_STATUSES = ['paid', 'pending', 'failed', 'refunded'];
export const ASSESSMENT_STATUSES = ['new', 'reviewed', 'plan_sent', 'completed', 'archived'];
export const CHART_COLORS = ['#e71763', '#60a5fa', '#34d399', '#fbbf24', '#a78bfa', '#f472b6', '#fb923c'];
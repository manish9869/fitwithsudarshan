/**
 * src/pages/admin/adminExcelExport.js
 *
 * xlsx-based Excel exports, split out of adminUtils.js so that xlsx only
 * gets fetched when an admin actually triggers an Excel export — not on
 * every admin page that imports adminUtils.js for a formatter. Always
 * import this module dynamically (`await import(...)`) at the point of
 * use, never as a static top-level import.
 */
import * as XLSX from 'xlsx';

// ── Excel Export — generic ──────────────────────────────────────────────────
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

// ── Single-row convenience wrappers ───────────────────────────────────────────
export function exportSingleEnrollmentToExcel(enrollment) {
    exportEnrollmentsToExcel([enrollment], {});
}
export function exportSingleAssessmentToExcel(assessment) {
    exportAssessmentsToExcel([assessment], {});
}

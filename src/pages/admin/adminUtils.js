/**
 * src/pages/admin/adminUtils.js
 *
 * Formatting helpers + CSV export + date-range presets used by the export
 * modals. The heavier Excel/PDF export functions live in their own files
 * (adminExcelExport.js / adminPdfExport.js), imported dynamically at the
 * point of use — this file is imported by nearly every admin page (for its
 * formatters alone), so it deliberately does NOT import xlsx or jspdf.
 */
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
        // Lead statuses
        contacted: { bg: 'rgba(251,191,36,0.1)', border: 'rgba(251,191,36,0.3)', color: '#fbbf24' },
        converted: { bg: 'rgba(52,211,153,0.1)', border: 'rgba(52,211,153,0.3)', color: '#34d399' },
        not_interested: { bg: 'rgba(255,255,255,0.04)', border: 'rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.4)' },
    };
    return map[status] || map.new;
}

export const LEAD_STATUSES = ['new', 'contacted', 'converted', 'not_interested'];

// ── Enrollment lifecycle — Active / Active · Renewed / Expired ───────────────
// Computed client-side, not stored: the correct answer changes every day, so
// caching it server-side would just go stale. `plan_start_date` is set once
// at creation and never touched again (see backend), so the end date it
// implies is stable even if the row later gets extra installment payments.
export function getLifecycleStatus(enrollment) {
    if (enrollment.payment_status !== 'paid' || !enrollment.plan_start_date || !enrollment.duration_months) {
        return null;
    }
    const end = new Date(enrollment.plan_start_date);
    end.setMonth(end.getMonth() + Number(enrollment.duration_months));
    const daysRemaining = Math.ceil((end.getTime() - Date.now()) / 86400000);
    const isRenewed = !!enrollment.root_enrollment_id;

    if (daysRemaining < 0) {
        return { tag: 'expired', label: 'Expired', daysRemaining };
    }
    return {
        tag: isRenewed ? 'active_renewed' : 'active',
        label: isRenewed ? 'Active · Renewed' : 'Active',
        daysRemaining,
        expiringSoon: daysRemaining <= 7,
    };
}

export function lifecycleBadge(tag) {
    const map = {
        active: { bg: 'rgba(52,211,153,0.1)', border: 'rgba(52,211,153,0.3)', color: '#34d399' },
        active_renewed: { bg: 'rgba(96,165,250,0.1)', border: 'rgba(96,165,250,0.3)', color: '#60a5fa' },
        expired: { bg: 'rgba(255,255,255,0.04)', border: 'rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.4)' },
    };
    return map[tag] || map.active;
}

export const LIFECYCLE_FILTERS = [
    { value: 'all', label: 'All Lifecycles' },
    { value: 'active', label: 'Active' },
    { value: 'active_renewed', label: 'Active · Renewed' },
    { value: 'expired', label: 'Expired' },
    { value: 'expiring_soon', label: 'Expiring Soon' },
];

export function exportSingleRowToJSON(row, filename) {
    const blob = new Blob([JSON.stringify(row, null, 2)], { type: 'application/json' });
    triggerDownload(blob, `${filename}.json`);
}

export const ENROLLMENT_STATUSES = ['paid', 'pending', 'failed', 'refunded'];
export const ASSESSMENT_STATUSES = ['new', 'reviewed', 'plan_sent', 'completed', 'archived'];
export const CHART_COLORS = ['#e71763', '#60a5fa', '#34d399', '#fbbf24', '#a78bfa', '#f472b6', '#fb923c'];
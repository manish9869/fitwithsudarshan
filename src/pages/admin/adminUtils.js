/**
 * src/pages/admin/adminUtils.js
 *
 * Pure formatting helpers + CSV export. No network/auth logic lives here
 * anymore — that all moved to adminApi.js so there's exactly one place
 * that talks to the backend.
 */

// ── Formatters ────────────────────────────────────────────────────────────────
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

// ── CSV / Excel export ────────────────────────────────────────────────────────
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

    const blob = new Blob([csvRows], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${filename}.csv`;
    a.click();
    URL.revokeObjectURL(url);
}

// ── PDF invoice for admin (reuses backend endpoint) ───────────────────────────
export async function downloadInvoicePDF(enrollment) {
    const API_BASE = import.meta.env.VITE_API_URL ?? '';
    const res = await fetch(`${API_BASE}/api/invoice`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(enrollment),
    });
    if (!res.ok) throw new Error('Failed to generate invoice');
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `RECODE-Invoice-${enrollment.enrollment_id || enrollment.enrollmentId}.pdf`;
    a.click();
    URL.revokeObjectURL(url);
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

export const ENROLLMENT_STATUSES = ['paid', 'pending', 'failed', 'refunded'];
export const ASSESSMENT_STATUSES = ['new', 'reviewed', 'plan_sent', 'completed', 'archived'];

export const CHART_COLORS = ['#e71763', '#60a5fa', '#34d399', '#fbbf24', '#a78bfa', '#f472b6', '#fb923c'];
/**
 * src/pages/admin/adminUtils.js
 * Shared helpers for the admin panel.
 */

import { createClient } from '@supabase/supabase-js';

// ── Supabase client (frontend uses anon key — reads only) ─────────────────────
let _supabase = null;
export function getAdminSupabase() {
    if (_supabase) return _supabase;
    const url = import.meta.env.VITE_SUPABASE_URL;
    const key = import.meta.env.VITE_SUPABASE_ANON_KEY;
    if (!url || !key) throw new Error('Supabase env vars missing');
    _supabase = createClient(url, key);
    return _supabase;
}

// ── Formatters ────────────────────────────────────────────────────────────────
export function fmtCurrency(amount) {
    if (!amount && amount !== 0) return '—';
    return new Intl.NumberFormat('en-IN', {
        style: 'currency', currency: 'INR', maximumFractionDigits: 0,
    }).format(amount);
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
        ...data.map(row =>
            headers.map(h => {
                const val = row[h];
                if (val === null || val === undefined) return '';
                if (Array.isArray(val)) return `"${val.join('; ')}"`;
                const str = String(val).replace(/"/g, '""');
                return str.includes(',') || str.includes('\n') || str.includes('"')
                    ? `"${str}"`
                    : str;
            }).join(',')
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
        new: { bg: 'rgba(96,165,250,0.1)', border: 'rgba(96,165,250,0.3)', color: '#60a5fa' },
        reviewed: { bg: 'rgba(251,191,36,0.1)', border: 'rgba(251,191,36,0.3)', color: '#fbbf24' },
        completed: { bg: 'rgba(52,211,153,0.1)', border: 'rgba(52,211,153,0.3)', color: '#34d399' },
        archived: { bg: 'rgba(255,255,255,0.04)', border: 'rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.4)' },
    };
    return map[status] || map.new;
}

// ── Notes persistence (localStorage — no DB table needed) ─────────────────────
const NOTES_KEY = 'recode_admin_notes';

export function getNotes() {
    try { return JSON.parse(localStorage.getItem(NOTES_KEY) || '{}'); } catch { return {}; }
}

export function saveNote(id, text) {
    const notes = getNotes();
    if (!text || !text.trim()) {
        delete notes[id];
    } else {
        notes[id] = { text: text.trim(), updatedAt: new Date().toISOString() };
    }
    localStorage.setItem(NOTES_KEY, JSON.stringify(notes));
}

export function getNote(id) {
    return getNotes()[id] || null;
}
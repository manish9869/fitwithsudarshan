// src/pages/admin/AdminLogs.jsx
//
// Browses transaction_logs — the audit trail behind every checkout, webhook,
// and admin action. What actually gets written here depends on the
// "Verbose logging" toggle in Site Settings → Logging: off (default) keeps
// only failures/warnings + each transaction's final outcome; on keeps every
// intermediate step too. This page just displays whatever's there.
import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Loader2, AlertCircle, RefreshCw, Search, X, ScrollText, Settings } from 'lucide-react';
import { fetchLogs } from './adminApi';
import { fmtDateTime } from './adminUtils';
import { useDebounce } from './useDebounce';
import PaginationBar from './PaginationBar';

const STATUS_OPTIONS = ['all', 'failed', 'warning', 'success', 'started'];
const SOURCE_OPTIONS = ['all', 'backend', 'frontend'];

const STATUS_META = {
    failed: { bg: 'rgba(239,68,68,0.1)', border: 'rgba(239,68,68,0.3)', color: '#f87171' },
    warning: { bg: 'rgba(251,191,36,0.1)', border: 'rgba(251,191,36,0.3)', color: '#fbbf24' },
    success: { bg: 'rgba(52,211,153,0.1)', border: 'rgba(52,211,153,0.3)', color: '#34d399' },
    started: { bg: 'rgba(255,255,255,0.06)', border: 'rgba(255,255,255,0.15)', color: 'rgba(255,255,255,0.55)' },
};

function StatusBadge({ status }) {
    const meta = STATUS_META[status] || STATUS_META.started;
    return (
        <span
            className="text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wide"
            style={{ background: meta.bg, border: `1px solid ${meta.border}`, color: meta.color }}
        >
            {status}
        </span>
    );
}

export default function AdminLogs() {
    const [rows, setRows] = useState([]);
    const [total, setTotal] = useState(0);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const [status, setStatus] = useState('all');
    const [source, setSource] = useState('all');
    const [search, setSearch] = useState('');
    const debouncedSearch = useDebounce(search, 350);

    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(50);

    const load = useCallback(async () => {
        setLoading(true);
        setError('');
        try {
            const data = await fetchLogs({ status, source, search: debouncedSearch, page, pageSize });
            setRows(data.rows || []);
            setTotal(data.total || 0);
        } catch (e) {
            setError(e.message || 'Failed to load logs.');
        } finally {
            setLoading(false);
        }
    }, [status, source, debouncedSearch, page, pageSize]);

    useEffect(() => { load(); }, [load]);
    useEffect(() => { setPage(1); }, [status, source, debouncedSearch]);

    const totalPages = Math.max(1, Math.ceil(total / pageSize));

    return (
        <div>
            <div className="flex items-center justify-between gap-4 mb-6 flex-wrap">
                <div>
                    <h1 className="text-xl font-black text-white mb-1 flex items-center gap-2">
                        <ScrollText className="w-5 h-5" style={{ color: '#e71763' }} /> System Logs
                    </h1>
                    <p className="text-xs text-white/35">
                        Recent checkout / webhook / admin activity. Failures and warnings always show up here regardless of the verbose setting.
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <Link
                        to="/admin/site-settings"
                        className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs text-white/50 hover:text-white transition-all"
                        style={{ border: '1px solid rgba(255,255,255,0.08)' }}
                    >
                        <Settings className="w-3.5 h-3.5" /> Logging Settings
                    </Link>
                    <button
                        onClick={load}
                        className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs text-white/50 hover:text-white transition-all"
                        style={{ border: '1px solid rgba(255,255,255,0.08)' }}
                    >
                        <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} /> Refresh
                    </button>
                </div>
            </div>

            {/* Filters */}
            <div className="flex items-center gap-2 mb-4 flex-wrap">
                <div className="relative flex-1 min-w-[220px]">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/30" />
                    <input
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Search step, message, or enrollment ID..."
                        className="w-full rounded-xl pl-9 pr-8 py-2 text-xs text-white outline-none"
                        style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}
                    />
                    {search && (
                        <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white">
                            <X className="w-3.5 h-3.5" />
                        </button>
                    )}
                </div>

                <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value)}
                    className="rounded-xl px-3 py-2 text-xs text-white capitalize"
                    style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}
                >
                    {STATUS_OPTIONS.map((s) => (
                        <option key={s} value={s} style={{ background: '#0a0a0a' }}>{s === 'all' ? 'All Statuses' : s}</option>
                    ))}
                </select>

                <select
                    value={source}
                    onChange={(e) => setSource(e.target.value)}
                    className="rounded-xl px-3 py-2 text-xs text-white capitalize"
                    style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}
                >
                    {SOURCE_OPTIONS.map((s) => (
                        <option key={s} value={s} style={{ background: '#0a0a0a' }}>{s === 'all' ? 'All Sources' : s}</option>
                    ))}
                </select>
            </div>

            {error && (
                <div className="flex items-center gap-2 px-4 py-3 rounded-xl mb-4 text-sm"
                    style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', color: '#f87171' }}>
                    <AlertCircle className="w-4 h-4 flex-shrink-0" /> {error}
                </div>
            )}

            <div className="rounded-2xl overflow-hidden" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.07)' }}>
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.06)', background: 'rgba(255,255,255,0.02)' }}>
                                {['Time', 'Step', 'Status', 'Source', 'Reference', 'Message'].map((label) => (
                                    <th key={label} className="px-4 py-3 text-left text-[10px] font-black uppercase tracking-widest text-white/35 whitespace-nowrap">
                                        {label}
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr><td colSpan={6} className="px-4 py-16 text-center"><Loader2 className="w-6 h-6 animate-spin mx-auto text-white/25" /></td></tr>
                            ) : rows.length === 0 ? (
                                <tr><td colSpan={6} className="px-4 py-16 text-center"><p className="text-sm text-white/25">No logs match these filters.</p></td></tr>
                            ) : (
                                rows.map((row) => (
                                    <tr key={row.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                                        <td className="px-4 py-3 text-xs text-white/50 whitespace-nowrap">{fmtDateTime(row.created_at)}</td>
                                        <td className="px-4 py-3 text-xs font-mono text-white/70 whitespace-nowrap">{row.step}</td>
                                        <td className="px-4 py-3"><StatusBadge status={row.status} /></td>
                                        <td className="px-4 py-3 text-xs text-white/40 capitalize">{row.source}</td>
                                        <td className="px-4 py-3 text-[11px] font-mono text-white/40 whitespace-nowrap">
                                            {row.enrollment_id || row.razorpay_payment_id || row.razorpay_order_id || '—'}
                                        </td>
                                        <td className="px-4 py-3 text-xs text-white/60 max-w-[360px] truncate" title={row.message || ''}>
                                            {row.message || '—'}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                <PaginationBar
                    page={page}
                    totalPages={totalPages}
                    totalItems={total}
                    pageSize={pageSize}
                    onPageChange={setPage}
                    onPageSizeChange={setPageSize}
                />
            </div>
        </div>
    );
}

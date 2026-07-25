/**
 * src/pages/admin/AdminFollowUps.jsx
 *
 * Every paid enrollment gets a follow-up reminder 7 days after payment
 * (and again 7 days after each logged follow-up). This page lists who's
 * due, lets the admin log a follow-up (resets the 7-day clock), snooze
 * with a custom gap, or stop reminders for a client entirely.
 *
 * Now uses real server-side pagination (page/pageSize/search all sent to
 * the API) instead of pulling up to 200 rows and relying on the browser
 * to scroll through them.
 */
import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    RefreshCw, Search, MessageCircle, CheckCircle2, Clock, X,
    AlertCircle, Loader2, StickyNote, PauseCircle, Calendar,
} from 'lucide-react';
import { fetchFollowUps, markFollowUp } from './adminApi';
import { fmtCurrency, fmtDateTime } from './adminUtils';
import { useToast } from './ToastProvider';
import { useDebounce } from './useDebounce';
import PaginationBar from './PaginationBar';

function daysAgo(iso) {
    if (!iso) return null;
    return Math.floor((Date.now() - new Date(iso).getTime()) / (24 * 60 * 60 * 1000));
}

function DueBadge({ nextFollowupAt }) {
    const d = daysAgo(nextFollowupAt);
    if (d == null) return null;
    if (d > 0) return (
        <span className="text-[10px] font-bold px-2 py-1 rounded-full" style={{ background: 'rgba(239,68,68,0.1)', color: '#f87171' }}>
            {d} day{d !== 1 ? 's' : ''} overdue
        </span>
    );
    if (d === 0) return (
        <span className="text-[10px] font-bold px-2 py-1 rounded-full" style={{ background: 'rgba(251,191,36,0.1)', color: '#fbbf24' }}>
            Due today
        </span>
    );
    return (
        <span className="text-[10px] font-bold px-2 py-1 rounded-full" style={{ background: 'rgba(52,211,153,0.1)', color: '#34d399' }}>
            In {-d} day{-d !== 1 ? 's' : ''}
        </span>
    );
}

function ActionModal({ row, action, onClose, onDone }) {
    const [note, setNote] = useState('');
    const [days, setDays] = useState(7);
    const [saving, setSaving] = useState(false);
    const toast = useToast();

    const titles = {
        completed: 'Log Follow-Up',
        snoozed: 'Snooze Reminder',
        stopped: 'Stop Reminders',
    };

    const successMessages = {
        completed: 'Follow-up logged',
        snoozed: 'Reminder snoozed',
        stopped: 'Reminders stopped',
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            await markFollowUp(row.id, { action, note: note || undefined, days: action === 'snoozed' ? days : undefined });
            toast.success(successMessages[action] || 'Updated');
            onDone();
        } catch (e) {
            setSaving(false);
            toast.error(e.message || 'Failed to update follow-up.');
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
                className="relative w-full max-w-sm rounded-2xl overflow-hidden"
                style={{ background: '#0e0e16', border: '1px solid rgba(255,255,255,0.1)' }}
                onClick={(e) => e.stopPropagation()}>
                <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                    <p className="font-bold text-white text-sm">{titles[action]} — {row.customer_name}</p>
                    <button onClick={onClose} className="text-white/30 hover:text-white"><X className="w-4 h-4" /></button>
                </div>
                <div className="p-5 space-y-4">
                    {action === 'snoozed' && (
                        <div>
                            <label className="text-[11px] font-bold text-white/45 uppercase tracking-widest mb-1.5 block">Remind again in (days)</label>
                            <input type="number" min="1" value={days} onChange={(e) => setDays(e.target.value)}
                                className="w-full rounded-xl px-3.5 py-2.5 text-sm text-white outline-none"
                                style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }} />
                        </div>
                    )}
                    <div>
                        <label className="text-[11px] font-bold text-white/45 uppercase tracking-widest mb-1.5 block">Note (optional)</label>
                        <textarea rows={3} value={note} onChange={(e) => setNote(e.target.value)}
                            placeholder={action === 'stopped' ? 'e.g. Client said no thanks for now' : 'e.g. Called on WhatsApp, considering the 6-month plan'}
                            className="w-full rounded-xl px-3.5 py-2.5 text-sm text-white placeholder:text-white/25 resize-none outline-none"
                            style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }} />
                    </div>
                    <div className="flex gap-3">
                        <button onClick={onClose} className="flex-1 py-2.5 rounded-xl text-sm text-white/40" style={{ border: '1px solid rgba(255,255,255,0.08)' }}>Cancel</button>
                        <button onClick={handleSave} disabled={saving}
                            className="flex-1 py-2.5 rounded-xl text-sm font-bold text-white flex items-center justify-center gap-2 disabled:opacity-60"
                            style={{ background: action === 'stopped' ? '#ef4444' : '#e71763' }}>
                            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Confirm'}
                        </button>
                    </div>
                </div>
            </motion.div>
        </div>
    );
}

export default function AdminFollowUps() {
    const [rows, setRows] = useState([]);
    const [total, setTotal] = useState(0);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const [showAll, setShowAll] = useState(false); // false = due only, true = all active
    const [search, setSearch] = useState('');
    const debouncedSearch = useDebounce(search, 300);

    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(15);

    const [modal, setModal] = useState(null); // { row, action }

    const load = useCallback(async () => {
        setLoading(true);
        setError('');
        try {
            const res = await fetchFollowUps({
                due: showAll ? undefined : 'true',
                search: debouncedSearch.trim() || undefined,
                page,
                pageSize,
            });
            setRows(res.rows || []);
            setTotal(res.total ?? (res.rows || []).length);
        } catch (e) {
            setError(e.message || 'Failed to load follow-ups.');
        } finally {
            setLoading(false);
        }
    }, [showAll, debouncedSearch, page, pageSize]);

    useEffect(() => { load(); }, [load]);

    // Reset to page 1 whenever a filter changes (not when just paging).
    useEffect(() => { setPage(1); }, [showAll, debouncedSearch, pageSize]);

    const totalPages = Math.max(1, Math.ceil(total / pageSize));

    const handleDone = () => {
        setModal(null);
        load();
    };

    return (
        <div>
            <div className="flex items-center justify-between gap-4 mb-6 flex-wrap">
                <div>
                    <h1 className="text-xl font-black text-white mb-1">Follow-Ups</h1>
                    <p className="text-xs text-white/35">Clients due for a check-in about their next plan, 7 days after payment (or their last follow-up).</p>
                </div>
                <div className="flex items-center gap-2">
                    <button onClick={() => setShowAll((s) => !s)}
                        className="px-3 py-2 rounded-xl text-xs font-bold transition-all"
                        style={showAll
                            ? { background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', color: 'white' }
                            : { background: 'rgba(231,23,99,0.1)', border: '1px solid rgba(231,23,99,0.25)', color: '#e71763' }}>
                        {showAll ? 'Showing All Active' : 'Showing Due Only'}
                    </button>
                    <button onClick={load} className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs text-white/50 hover:text-white transition-all"
                        style={{ border: '1px solid rgba(255,255,255,0.08)' }}>
                        <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} /> Refresh
                    </button>
                </div>
            </div>

            <div className="relative mb-5 max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/30" />
                <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search client…"
                    className="w-full rounded-xl pl-9 pr-4 py-2.5 text-sm text-white placeholder:text-white/25 outline-none"
                    style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }} />
                {search && (
                    <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white">
                        <X className="w-3.5 h-3.5" />
                    </button>
                )}
            </div>

            {error && (
                <div className="flex items-center gap-2 px-4 py-3 rounded-xl mb-4 text-sm"
                    style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', color: '#f87171' }}>
                    <AlertCircle className="w-4 h-4 flex-shrink-0" /> {error}
                </div>
            )}

            <div className="rounded-2xl overflow-hidden" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.07)' }}>
                {loading ? (
                    <div className="py-24 flex justify-center"><Loader2 className="w-6 h-6 animate-spin text-white/25" /></div>
                ) : rows.length === 0 ? (
                    <div className="py-20 text-center">
                        <CheckCircle2 className="w-8 h-8 mx-auto mb-3" style={{ color: '#34d399' }} />
                        <p className="text-sm text-white/40">{showAll ? 'No active follow-ups yet.' : "You're all caught up — nothing due right now."}</p>
                    </div>
                ) : (
                    <div className="p-3 sm:p-4 space-y-2.5">
                        {rows.map((row) => (
                            <motion.div key={row.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                                className="rounded-2xl p-4 flex items-center justify-between gap-4 flex-wrap"
                                style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.07)' }}>
                                <div className="min-w-0 flex-1">
                                    <div className="flex items-center gap-2 flex-wrap mb-1">
                                        <p className="font-bold text-white text-sm">{row.customer_name}</p>
                                        {row.source === 'manual' && (
                                            <span className="text-[9px] font-bold px-1.5 py-0.5 rounded" style={{ background: 'rgba(96,165,250,0.12)', color: '#60a5fa' }}>MANUAL</span>
                                        )}
                                        <DueBadge nextFollowupAt={row.next_followup_at} />
                                    </div>
                                    <p className="text-xs text-white/40 truncate">{row.program_name}</p>
                                    <div className="flex items-center gap-3 mt-1.5 text-[11px] text-white/30 flex-wrap">
                                        <span className="flex items-center gap-1"><Calendar className="w-3 h-3" /> Paid {fmtDateTime(row.payment_date)}</span>
                                        <span>·</span>
                                        <span>{fmtCurrency(row.amount_paid)}</span>
                                        {row.last_followup_at && (
                                            <>
                                                <span>·</span>
                                                <span>Last followed up {fmtDateTime(row.last_followup_at)}</span>
                                            </>
                                        )}
                                    </div>
                                </div>

                                <div className="flex items-center gap-1.5 flex-shrink-0">
                                    {row.customer_phone && (
                                        <a href={`https://wa.me/${row.customer_phone.replace(/\D/g, '')}`} target="_blank" rel="noopener noreferrer"
                                            className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'rgba(37,211,102,0.12)', color: '#25D366' }}
                                            title="WhatsApp client">
                                            <MessageCircle className="w-3.5 h-3.5" />
                                        </a>
                                    )}
                                    <button onClick={() => setModal({ row, action: 'completed' })}
                                        className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold text-white"
                                        style={{ background: '#e71763' }}>
                                        <CheckCircle2 className="w-3.5 h-3.5" /> Followed Up
                                    </button>
                                    <button onClick={() => setModal({ row, action: 'snoozed' })}
                                        className="w-8 h-8 rounded-lg flex items-center justify-center text-white/40 hover:text-white hover:bg-white/8"
                                        title="Snooze">
                                        <Clock className="w-3.5 h-3.5" />
                                    </button>
                                    <button onClick={() => setModal({ row, action: 'stopped' })}
                                        className="w-8 h-8 rounded-lg flex items-center justify-center text-white/40 hover:text-red-400 hover:bg-red-500/8"
                                        title="Stop reminders">
                                        <PauseCircle className="w-3.5 h-3.5" />
                                    </button>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                )}

                {!loading && total > 0 && (
                    <PaginationBar
                        page={page}
                        totalPages={totalPages}
                        totalItems={total}
                        pageSize={pageSize}
                        onPageChange={setPage}
                        onPageSizeChange={(n) => { setPageSize(n); setPage(1); }}
                    />
                )}
            </div>

            <AnimatePresence>
                {modal && (
                    <ActionModal row={modal.row} action={modal.action} onClose={() => setModal(null)} onDone={handleDone} />
                )}
            </AnimatePresence>
        </div>
    );
}
/**
 * Today's queue — every message due today (and anything overdue).
 * Hand-send mode: "Send" opens WhatsApp with the message pre-filled and
 * marks it sent (undoable). Auto mode: one button drains the queue via API.
 */
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Send, SkipForward, Undo2, Loader2, CheckCircle2, Inbox, Zap, ChevronDown, Image as ImageIcon, RefreshCw } from 'lucide-react';
import { waApi } from '../adminApi';
import { useToast } from '../ToastProvider';
import { card, btnGhost, btnPrimary, formatPhone, assistedText, waLink, WA_GREEN, EmptyState } from './waShared';

const STATUS_TABS = [
    { id: 'pending', label: 'To send' },
    { id: 'sent', label: 'Sent' },
    { id: 'skipped', label: 'Skipped' },
    { id: 'failed', label: 'Failed' },
];

export default function WaQueue({ status: overview, onChanged }) {
    const toast = useToast();
    const [tab, setTab] = useState('pending');
    const [rows, setRows] = useState([]);
    const [loading, setLoading] = useState(true);
    const [expanded, setExpanded] = useState(null);
    const [selected, setSelected] = useState(new Set());
    const [autoSending, setAutoSending] = useState(false);

    const load = useCallback(async () => {
        setLoading(true);
        try {
            const r = await waApi.queue({ status: tab, date: tab === 'pending' ? undefined : overview?.today });
            setRows(r.rows || []);
            setSelected(new Set());
        } catch (e) {
            toast.error(e.message);
        } finally {
            setLoading(false);
        }
    }, [tab, overview?.today, toast]);

    useEffect(() => { load(); }, [load]);

    const setRowStatus = async (row, status) => {
        setRows((rs) => rs.map((r) => (r.id === row.id ? { ...r, status } : r)));
        try {
            await waApi.updateQueueItem(row.id, status);
            onChanged?.();
        } catch (e) {
            setRows((rs) => rs.map((r) => (r.id === row.id ? { ...r, status: row.status } : r)));
            toast.error(e.message);
        }
    };

    const sendByHand = (row) => {
        window.open(waLink(row.phone, assistedText(row)), '_blank', 'noopener,noreferrer');
        setRowStatus(row, 'sent');
    };

    const pendingRows = useMemo(() => rows.filter((r) => r.status === 'pending'), [rows]);
    const nextUp = pendingRows[0];

    const skipSelected = async () => {
        const ids = [...selected];
        try {
            await waApi.skipQueue(ids);
            setRows((rs) => rs.map((r) => (selected.has(r.id) ? { ...r, status: 'skipped' } : r)));
            setSelected(new Set());
            toast.success(`Skipped ${ids.length} message${ids.length === 1 ? '' : 's'}`);
            onChanged?.();
        } catch (e) {
            toast.error(e.message);
        }
    };

    const autoSendAll = async () => {
        setAutoSending(true);
        let sent = 0;
        let failed = 0;
        try {
            // Small batches so each request fits the serverless time limit.
            for (let i = 0; i < 200; i += 1) {
                const r = await waApi.dispatch();
                sent += r.sent;
                failed += r.failed;
                if (!r.remaining || (r.sent === 0 && r.failed === 0)) break;
            }
            toast.success(`Sent ${sent}${failed ? ` · ${failed} failed (see Failed tab)` : ''}`);
        } catch (e) {
            toast.error(e.message);
        } finally {
            setAutoSending(false);
            load();
            onChanged?.();
        }
    };

    const today = overview?.today;

    return (
        <div className="space-y-4">
            {/* Action bar */}
            <div className="flex flex-wrap items-center gap-2">
                <div className="flex gap-1 p-1 rounded-xl" style={card}>
                    {STATUS_TABS.map((t) => (
                        <button key={t.id} onClick={() => setTab(t.id)}
                            className={`px-3 py-1.5 rounded-lg text-xs font-semibold ${tab === t.id ? 'text-white' : 'text-white/40 hover:text-white/70'}`}
                            style={tab === t.id ? { background: 'rgba(231,23,99,0.15)' } : undefined}>
                            {t.label}
                        </button>
                    ))}
                </div>
                <button onClick={load} className={btnGhost} aria-label="Refresh"><RefreshCw className="w-3.5 h-3.5" /></button>
                <div className="flex-1" />
                {tab === 'pending' && selected.size > 0 && (
                    <button onClick={skipSelected} className={btnGhost}><SkipForward className="w-4 h-4" /> Skip {selected.size}</button>
                )}
                {tab === 'pending' && overview?.apiConfigured && pendingRows.length > 0 && (
                    <button onClick={autoSendAll} disabled={autoSending} className={btnPrimary} style={{ background: WA_GREEN, color: '#05210f' }}>
                        {autoSending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />}
                        {autoSending ? 'Sending…' : `Send all ${pendingRows.length} automatically`}
                    </button>
                )}
                {tab === 'pending' && nextUp && (
                    <button onClick={() => sendByHand(nextUp)} className={btnPrimary} style={{ background: '#e71763' }}>
                        <Send className="w-4 h-4" /> Send next · {nextUp.name?.split(' ')[0] || formatPhone(nextUp.phone)}
                    </button>
                )}
            </div>

            {tab === 'pending' && !overview?.apiConfigured && pendingRows.length > 0 && (
                <p className="text-xs text-white/40 leading-relaxed">
                    Hand-send mode: <b className="text-white/70">Send</b> opens WhatsApp with the message ready, and you just press send there.
                    It's marked sent automatically; use <b className="text-white/70">Undo</b> if you didn't send it.
                    Tip: on your phone, open this page and work through “Send next”.
                </p>
            )}

            {loading ? (
                <div className="flex justify-center py-16"><Loader2 className="w-5 h-5 text-white/30 animate-spin" /></div>
            ) : rows.length === 0 ? (
                <EmptyState
                    icon={tab === 'pending' ? CheckCircle2 : Inbox}
                    title={tab === 'pending' ? 'All caught up for today' : `Nothing ${tab} ${tab === 'pending' ? '' : 'today'}`}
                    text={tab === 'pending'
                        ? 'Messages from broadcasts and day-wise sequences land here on the day they are due.'
                        : 'Messages show up here as you work through the queue.'}
                />
            ) : (
                <div className="rounded-2xl overflow-hidden" style={card}>
                    {rows.map((row) => {
                        const overdue = row.status === 'pending' && today && row.scheduled_date < today;
                        const done = row.status !== 'pending';
                        const isOpen = expanded === row.id;
                        return (
                            <div key={row.id} className="px-4 py-3" style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', opacity: tab === 'pending' && done ? 0.5 : 1 }}>
                                <div className="flex items-center gap-3">
                                    {tab === 'pending' && (
                                        <input type="checkbox" aria-label={`Select ${row.name}`} disabled={done}
                                            checked={selected.has(row.id)}
                                            onChange={(e) => setSelected((s) => { const n = new Set(s); e.target.checked ? n.add(row.id) : n.delete(row.id); return n; })}
                                            className="accent-primary w-4 h-4 flex-shrink-0" />
                                    )}
                                    <button onClick={() => setExpanded(isOpen ? null : row.id)} className="flex-1 min-w-0 text-left">
                                        <div className="flex items-center gap-2 flex-wrap">
                                            <span className="text-sm font-semibold text-white truncate">{row.name || 'Unnamed'}</span>
                                            <span className="text-xs text-white/35">{formatPhone(row.phone)}</span>
                                            {overdue && <span className="text-[10px] font-bold uppercase px-1.5 py-0.5 rounded" style={{ background: 'rgba(251,191,36,0.12)', color: '#fbbf24' }}>From {row.scheduled_date}</span>}
                                            {row.image_url && <ImageIcon className="w-3.5 h-3.5 text-white/30" aria-label="Has image" />}
                                        </div>
                                        <p className="text-xs text-white/40 truncate mt-0.5">
                                            <span className="text-white/55">{row.source}</span> · {row.body}
                                        </p>
                                        {row.status === 'failed' && row.error && <p className="text-xs text-red-400 mt-0.5">{row.error}</p>}
                                    </button>
                                    <ChevronDown className={`w-4 h-4 text-white/25 flex-shrink-0 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                                    <div className="flex items-center gap-1.5 flex-shrink-0">
                                        {row.status === 'pending' ? (
                                            <>
                                                <button onClick={() => setRowStatus(row, 'skipped')} className="p-2 rounded-lg text-white/40 hover:text-white hover:bg-white/5" aria-label="Skip" title="Skip">
                                                    <SkipForward className="w-4 h-4" />
                                                </button>
                                                <button onClick={() => sendByHand(row)} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold active:scale-[0.97]" style={{ background: WA_GREEN, color: '#05210f' }}>
                                                    <Send className="w-3.5 h-3.5" /> Send
                                                </button>
                                            </>
                                        ) : (
                                            <button onClick={() => setRowStatus(row, 'pending')} className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs text-white/50 hover:text-white hover:bg-white/5">
                                                <Undo2 className="w-3.5 h-3.5" /> {row.status === 'failed' ? 'Retry' : 'Undo'}
                                            </button>
                                        )}
                                    </div>
                                </div>
                                {isOpen && (
                                    <div className="mt-3 ml-0 sm:ml-7 rounded-xl p-3 text-sm text-white/75 whitespace-pre-wrap" style={{ background: 'rgba(255,255,255,0.03)' }}>
                                        {row.image_url && <img src={row.image_url} alt="" className="max-h-48 rounded-lg mb-2" />}
                                        {row.body}
                                        {row.cta_url && <p className="mt-2 text-xs" style={{ color: '#53bdeb' }}>{row.cta_label || 'Link'} → {row.cta_url}</p>}
                                        {row.sent_at && <p className="mt-2 text-[11px] text-white/30">Sent {new Date(row.sent_at).toLocaleString('en-IN')} · {row.channel === 'api' ? 'automatic' : 'by hand'}</p>}
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}

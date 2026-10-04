/**
 * Send a one-off message to selected contacts or a group, with templates and
 * a live preview, without creating a broadcast. Messages are logged in the
 * queue's history; unsent ones stay in Today's queue.
 */
import { useEffect, useMemo, useState } from 'react';
import { X, Send, Loader2, Zap, Check, Undo2, ArrowLeft, MessageCircle } from 'lucide-react';
import { waApi } from '../adminApi';
import { useToast } from '../ToastProvider';
import { ComposerWithTemplates } from './TemplateGallery';
import PreviewPanel from './PreviewPanel';
import { findPlaceholders } from './waTemplates';
import { btnGhost, btnPrimary, formatPhone, assistedText, waLink, PINK, WA_GREEN } from './waShared';

/**
 * target: { contactIds?: string[], groupId?: string, label: string, count: number }
 */
export default function DirectMessageModal({ target, apiConfigured, onClose, onSent }) {
    const toast = useToast();
    const [msg, setMsg] = useState({ body: '', image_url: '', cta_label: '', cta_url: '' });
    const [phase, setPhase] = useState('compose'); // compose | send
    const [rows, setRows] = useState([]);
    const [busy, setBusy] = useState(false);

    useEffect(() => {
        const onKey = (e) => e.key === 'Escape' && phase === 'compose' && onClose();
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, [onClose, phase]);

    const blanks = findPlaceholders(msg.body, msg.cta_url);
    const pending = useMemo(() => rows.filter((r) => r.status === 'pending'), [rows]);
    const sentCount = rows.filter((r) => r.status === 'sent').length;

    const prepare = async () => {
        if (!msg.body.trim()) return toast.error('Write a message or pick a template.');
        if (blanks.length) return toast.error(`Fill in ${blanks.join(', ')} first.`);
        setBusy(true);
        try {
            const r = await waApi.direct({
                ...msg,
                contactIds: target.contactIds || [],
                groupIds: target.groupId ? [target.groupId] : [],
            });
            setRows(r.messages || []);
            setPhase('send');
        } catch (e) {
            toast.error(e.message);
        } finally {
            setBusy(false);
        }
    };

    const setStatus = async (row, status) => {
        setRows((rs) => rs.map((r) => (r.id === row.id ? { ...r, status } : r)));
        try {
            await waApi.updateQueueItem(row.id, status);
        } catch (e) {
            setRows((rs) => rs.map((r) => (r.id === row.id ? { ...r, status: row.status } : r)));
            toast.error(e.message);
        }
    };

    const sendByHand = (row) => {
        window.open(waLink(row.phone, assistedText(row)), '_blank', 'noopener,noreferrer');
        setStatus(row, 'sent');
    };

    const sendAllAuto = async () => {
        setBusy(true);
        const ids = pending.map((r) => r.id);
        try {
            let sent = 0;
            let failed = 0;
            for (let i = 0; i < 50; i += 1) {
                const r = await waApi.dispatch(ids);
                sent += r.sent;
                failed += r.failed;
                if (!r.remaining || (!r.sent && !r.failed)) break;
            }
            // Pull real per-message outcomes (some may have failed).
            try {
                const today = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' });
                const fresh = await waApi.queue({ status: 'all', date: today });
                const byId = new Map((fresh.rows || []).map((m) => [m.id, m.status]));
                setRows((rs) => rs.map((r) => (byId.has(r.id) ? { ...r, status: byId.get(r.id) } : r)));
            } catch { /* counts in the toast are still accurate */ }
            toast.success(`Sent ${sent}${failed ? ` · ${failed} failed (see Today's queue → Failed)` : ''}`);
        } catch (e) {
            toast.error(e.message);
        } finally {
            setBusy(false);
        }
    };

    const finish = () => {
        if (pending.length) toast.info(`${pending.length} unsent message${pending.length === 1 ? '' : 's'} kept in Today's queue.`, 5000);
        onSent?.();
        onClose();
    };

    const discardUnsent = async () => {
        if (pending.length) {
            try { await waApi.skipQueue(pending.map((r) => r.id)); } catch { /* best effort */ }
        }
        onSent?.();
        onClose();
    };

    return (
        <div className="fixed inset-0 z-[60] flex items-start justify-center p-3 sm:p-6 overflow-y-auto" style={{ background: 'rgba(0,0,0,0.65)' }}
            onMouseDown={(e) => { if (e.target === e.currentTarget && phase === 'compose') onClose(); }}>
            <div role="dialog" aria-modal="true" aria-label={`Message ${target.label}`} className="w-full max-w-5xl rounded-2xl my-auto" style={{ background: '#111', border: '1px solid rgba(255,255,255,0.1)' }}>
                <header className="flex items-center justify-between gap-3 px-5 py-4" style={{ borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
                    <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: 'rgba(37,211,102,0.12)' }}>
                            <MessageCircle className="w-4 h-4" style={{ color: WA_GREEN }} />
                        </div>
                        <div className="min-w-0">
                            <h3 className="text-base font-bold text-white truncate">Message {target.label}</h3>
                            <p className="text-xs text-white/40">{target.count} {target.count === 1 ? 'person' : 'people'} · a personal message, not a broadcast</p>
                        </div>
                    </div>
                    <button onClick={phase === 'compose' ? onClose : finish} aria-label="Close" className="p-1.5 rounded-lg text-white/40 hover:text-white hover:bg-white/5"><X className="w-4 h-4" /></button>
                </header>

                {phase === 'compose' ? (
                    <div className="grid lg:grid-cols-[1fr_320px] gap-6 p-5">
                        <div className="space-y-4 min-w-0">
                            <ComposerWithTemplates value={msg} onChange={setMsg} />
                            <div className="flex items-center justify-end gap-2 pt-2">
                                <button onClick={onClose} className={btnGhost}>Cancel</button>
                                <button onClick={prepare} disabled={busy || !msg.body.trim() || blanks.length > 0} className={btnPrimary} style={{ background: PINK }}>
                                    {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                                    {target.count === 1 ? 'Continue to send' : `Prepare ${target.count} messages`}
                                </button>
                            </div>
                        </div>
                        <aside className="lg:sticky lg:top-6"><PreviewPanel msg={msg} /></aside>
                    </div>
                ) : (
                    <div className="p-5 space-y-4">
                        <div className="flex flex-wrap items-center gap-3">
                            <button onClick={() => setPhase('compose')} disabled={sentCount > 0} className={btnGhost} title={sentCount ? 'Some messages are already sent' : undefined}>
                                <ArrowLeft className="w-4 h-4" /> Edit message
                            </button>
                            <div className="flex-1 min-w-[160px]">
                                <div className="flex justify-between text-xs text-white/50 mb-1"><span>{sentCount} of {rows.length} sent</span></div>
                                <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.06)' }}>
                                    <div className="h-full rounded-full transition-[width] duration-300" style={{ width: `${rows.length ? (sentCount / rows.length) * 100 : 0}%`, background: WA_GREEN }} />
                                </div>
                            </div>
                            {apiConfigured && pending.length > 0 && (
                                <button onClick={sendAllAuto} disabled={busy} className={btnPrimary} style={{ background: WA_GREEN, color: '#05210f' }}>
                                    {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />} Send all automatically
                                </button>
                            )}
                            {pending[0] && (
                                <button onClick={() => sendByHand(pending[0])} className={btnPrimary} style={{ background: PINK }}>
                                    <Send className="w-4 h-4" /> Send next · {pending[0].name?.split(' ')[0] || formatPhone(pending[0].phone)}
                                </button>
                            )}
                        </div>

                        {!apiConfigured && pending.length > 0 && (
                            <p className="text-xs text-white/40">Each <b className="text-white/70">Send</b> opens WhatsApp with the message ready. Press send there, then come back for the next one.</p>
                        )}

                        <div className="rounded-xl overflow-hidden max-h-[50vh] overflow-y-auto" style={{ border: '1px solid rgba(255,255,255,0.07)' }}>
                            {rows.map((r) => (
                                <div key={r.id} className="flex items-center gap-3 px-4 py-2.5" style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-semibold text-white truncate">{r.name || 'Unnamed'} <span className="text-xs font-normal text-white/35">{formatPhone(r.phone)}</span></p>
                                        <p className="text-xs text-white/40 truncate">{r.body}</p>
                                    </div>
                                    {r.status === 'pending' ? (
                                        <>
                                            <button onClick={() => setStatus(r, 'skipped')} className="text-xs text-white/40 hover:text-white px-2 py-1">Skip</button>
                                            <button onClick={() => sendByHand(r)} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold" style={{ background: WA_GREEN, color: '#05210f' }}>
                                                <Send className="w-3.5 h-3.5" /> Send
                                            </button>
                                        </>
                                    ) : (
                                        <button onClick={() => setStatus(r, 'pending')} className="inline-flex items-center gap-1.5 text-xs px-2 py-1 rounded-lg"
                                            style={{ color: r.status === 'sent' ? WA_GREEN : 'rgba(255,255,255,0.4)' }} title="Undo">
                                            {r.status === 'sent' ? <Check className="w-3.5 h-3.5" /> : <Undo2 className="w-3.5 h-3.5" />}
                                            {r.status === 'sent' ? 'Sent' : 'Skipped'}
                                        </button>
                                    )}
                                </div>
                            ))}
                        </div>

                        <div className="flex flex-wrap items-center justify-end gap-2">
                            {pending.length > 0 && (
                                <button onClick={discardUnsent} className="text-xs text-white/40 hover:text-white px-2">Discard {pending.length} unsent</button>
                            )}
                            <button onClick={finish} className={btnPrimary} style={{ background: pending.length ? 'rgba(255,255,255,0.08)' : WA_GREEN, color: pending.length ? '#fff' : '#05210f' }}>
                                {pending.length ? 'Finish later' : 'Done'}
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

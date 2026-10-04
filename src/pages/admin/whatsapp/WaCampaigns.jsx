/**
 * Broadcasts — one-off promotional messages to groups / tags / everyone.
 */
import { useCallback, useEffect, useState } from 'react';
import { Plus, Megaphone, Loader2, Send, CalendarClock, Trash2, ArrowLeft, Copy, Ban, Save } from 'lucide-react';
import { waApi } from '../adminApi';
import { useToast } from '../ToastProvider';
import { card, btnGhost, btnPrimary, labelCls, inputCls, MessageComposer, AudiencePicker, WhatsAppPreview, EmptyState, PINK } from './waShared';

const STATUS_STYLE = {
    draft: { label: 'Draft', bg: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.6)' },
    scheduled: { label: 'Scheduled', bg: 'rgba(96,165,250,0.12)', color: '#60a5fa' },
    queued: { label: 'Sending', bg: 'rgba(37,211,102,0.12)', color: '#25d366' },
    cancelled: { label: 'Cancelled', bg: 'rgba(248,113,113,0.1)', color: '#f87171' },
};

const BLANK = {
    name: '',
    body: '',
    image_url: '',
    cta_label: '',
    cta_url: '',
    audience: { groupIds: [], tags: [], contactIds: [], excludeContactIds: [] },
    scheduleDate: '',
};

function istDateOnly(ts) {
    return ts ? new Date(ts).toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' }) : '';
}

export default function WaCampaigns({ groups, tags, onChanged }) {
    const toast = useToast();
    const [campaigns, setCampaigns] = useState([]);
    const [loading, setLoading] = useState(true);
    const [editing, setEditing] = useState(null); // null | campaign draft object
    const [busy, setBusy] = useState(false);

    const load = useCallback(async () => {
        setLoading(true);
        try {
            setCampaigns((await waApi.campaigns()).campaigns || []);
        } catch (e) {
            toast.error(e.message);
        } finally {
            setLoading(false);
        }
    }, [toast]);

    useEffect(() => { load(); }, [load]);

    const toPayload = (c) => ({
        name: c.name,
        body: c.body,
        image_url: c.image_url,
        cta_label: c.cta_label,
        cta_url: c.cta_url,
        meta_template_name: c.meta_template_name,
        meta_template_lang: c.meta_template_lang,
        audience: c.audience,
        // Day-level scheduling: the daily job (≈9 AM IST) queues it that day.
        scheduled_for: c.scheduleDate ? `${c.scheduleDate}T00:00:00+05:30` : null,
    });

    const save = async (launch) => {
        if (!editing.name.trim()) return toast.error('Give the broadcast a name.');
        if (!editing.body.trim()) return toast.error('Write a message first.');
        setBusy(true);
        try {
            const saved = editing.id
                ? (await waApi.updateCampaign(editing.id, toPayload(editing))).campaign
                : (await waApi.createCampaign(toPayload(editing))).campaign;
            if (launch) {
                const r = await waApi.launchCampaign(saved.id);
                toast.success(r.scheduled
                    ? `Scheduled for ${istDateOnly(r.scheduled_for)}. It will appear in Today's queue that morning.`
                    : `Queued for ${r.queued} people. Open Today's queue to send.`, 6000);
            } else {
                toast.success('Draft saved');
            }
            setEditing(null);
            load();
            onChanged?.();
        } catch (e) {
            toast.error(e.message);
        } finally {
            setBusy(false);
        }
    };

    const remove = async (c) => {
        if (!window.confirm(`Delete "${c.name}"? Its queued messages are removed too.`)) return;
        try {
            await waApi.deleteCampaign(c.id);
            setCampaigns((cs) => cs.filter((x) => x.id !== c.id));
            onChanged?.();
        } catch (e) {
            toast.error(e.message);
        }
    };

    const cancel = async (c) => {
        if (!window.confirm(`Stop "${c.name}"? Messages not yet sent will be skipped.`)) return;
        try {
            const r = await waApi.cancelCampaign(c.id);
            toast.success(`Stopped. ${r.skipped} unsent message${r.skipped === 1 ? '' : 's'} skipped.`);
            load();
            onChanged?.();
        } catch (e) {
            toast.error(e.message);
        }
    };

    if (editing) {
        const locked = editing.status === 'queued';
        const set = (patch) => setEditing((e) => ({ ...e, ...patch }));
        return (
            <div className="space-y-5">
                <button onClick={() => setEditing(null)} className="inline-flex items-center gap-1.5 text-sm text-white/50 hover:text-white">
                    <ArrowLeft className="w-4 h-4" /> All broadcasts
                </button>
                <div className="grid lg:grid-cols-[1fr_340px] gap-5 items-start">
                    <div className="space-y-5">
                        <section className="rounded-2xl p-5 space-y-4" style={card}>
                            <div>
                                <label className={labelCls}>Broadcast name (only you see this)</label>
                                <input className={inputCls} value={editing.name} onChange={(e) => set({ name: e.target.value })} placeholder="Diwali offer — leads" disabled={locked} />
                            </div>
                            <MessageComposer value={editing} onChange={(v) => set(v)} showAdvanced />
                        </section>
                        <section className="rounded-2xl p-5" style={card}>
                            <AudiencePicker value={editing.audience} onChange={(audience) => set({ audience })} groups={groups} tags={tags} body={editing.body} />
                        </section>
                        <section className="rounded-2xl p-5" style={card}>
                            <label className={labelCls}>When</label>
                            <div className="flex flex-wrap gap-2 mb-3">
                                {[['', 'Send today'], ['later', 'Schedule a day']].map(([mode, label]) => {
                                    const active = mode ? !!editing.scheduleDate : !editing.scheduleDate;
                                    return (
                                        <button key={label} type="button"
                                            onClick={() => set({ scheduleDate: mode ? (editing.scheduleDate || new Date(Date.now() + 86400000).toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' })) : '' })}
                                            className="px-3 py-1.5 rounded-lg text-xs font-semibold"
                                            style={{ background: active ? 'rgba(231,23,99,0.14)' : 'rgba(255,255,255,0.03)', border: `1px solid ${active ? 'rgba(231,23,99,0.45)' : 'rgba(255,255,255,0.09)'}`, color: active ? '#fff' : 'rgba(255,255,255,0.6)' }}>
                                            {label}
                                        </button>
                                    );
                                })}
                            </div>
                            {editing.scheduleDate && (
                                <div className="max-w-xs">
                                    <input type="date" className={inputCls} value={editing.scheduleDate}
                                        min={new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' })}
                                        onChange={(e) => set({ scheduleDate: e.target.value })} />
                                    <p className="text-[11px] text-white/30 mt-1">Prepared around 9:00 AM IST that day and added to Today's queue.</p>
                                </div>
                            )}
                        </section>
                    </div>

                    <aside className="lg:sticky lg:top-20 space-y-3">
                        <WhatsAppPreview msg={editing} />
                        {!locked && (
                            <div className="grid gap-2">
                                <button onClick={() => save(true)} disabled={busy} className={btnPrimary} style={{ background: PINK }}>
                                    {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : editing.scheduleDate ? <CalendarClock className="w-4 h-4" /> : <Send className="w-4 h-4" />}
                                    {editing.scheduleDate ? 'Schedule broadcast' : 'Queue for today'}
                                </button>
                                <button onClick={() => save(false)} disabled={busy} className={btnGhost}><Save className="w-4 h-4" /> Save as draft</button>
                            </div>
                        )}
                        {locked && <p className="text-xs text-white/40">This broadcast is already queued. Duplicate it to make changes.</p>}
                    </aside>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between gap-3">
                <p className="text-sm text-white/45">One-off promotional messages: festival offers, new batches, challenges.</p>
                <button onClick={() => setEditing({ ...BLANK })} className={btnPrimary} style={{ background: PINK }}>
                    <Plus className="w-4 h-4" /> New broadcast
                </button>
            </div>

            {loading ? (
                <div className="flex justify-center py-16"><Loader2 className="w-5 h-5 text-white/30 animate-spin" /></div>
            ) : campaigns.length === 0 ? (
                <EmptyState icon={Megaphone} title="No broadcasts yet"
                    text="Send a festival offer or challenge invite to a group, a tag like “lead”, or everyone."
                    action={<button onClick={() => setEditing({ ...BLANK })} className={btnPrimary} style={{ background: PINK }}><Plus className="w-4 h-4" /> Create your first broadcast</button>} />
            ) : (
                <div className="grid gap-3">
                    {campaigns.map((c) => {
                        const st = STATUS_STYLE[c.status] || STATUS_STYLE.draft;
                        const s = c.stats;
                        const total = s ? s.pending + s.sent + s.skipped + s.failed : 0;
                        return (
                            <div key={c.id} className="rounded-2xl p-4 flex flex-wrap items-center gap-4" style={card}>
                                {c.image_url
                                    ? <img src={c.image_url} alt="" className="w-12 h-12 rounded-xl object-cover flex-shrink-0" />
                                    : <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: 'rgba(231,23,99,0.1)' }}><Megaphone className="w-5 h-5" style={{ color: PINK }} /></div>}
                                <div className="flex-1 min-w-[180px]">
                                    <div className="flex items-center gap-2">
                                        <p className="font-semibold text-white truncate">{c.name}</p>
                                        <span className="text-[10px] font-bold uppercase px-1.5 py-0.5 rounded" style={{ background: st.bg, color: st.color }}>{st.label}</span>
                                    </div>
                                    <p className="text-xs text-white/40 truncate mt-0.5">{c.body}</p>
                                    {c.status === 'scheduled' && <p className="text-xs text-blue-400 mt-0.5">Goes out {istDateOnly(c.scheduled_for)}</p>}
                                </div>
                                {s && total > 0 && (
                                    <div className="flex items-center gap-3 text-xs">
                                        <div className="w-28 h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.06)' }}>
                                            <div className="h-full rounded-full" style={{ width: `${Math.round((s.sent / total) * 100)}%`, background: '#25d366' }} />
                                        </div>
                                        <span className="text-white/60 tabular-nums">{s.sent}/{total} sent</span>
                                    </div>
                                )}
                                <div className="flex items-center gap-1">
                                    {c.status !== 'queued' && c.status !== 'cancelled' && (
                                        <button onClick={() => setEditing({ ...c, scheduleDate: istDateOnly(c.scheduled_for) })} className={btnGhost}>Edit</button>
                                    )}
                                    <button title="Duplicate" aria-label="Duplicate" onClick={() => setEditing({ ...c, id: undefined, status: 'draft', name: `${c.name} (copy)`, scheduleDate: '' })} className="p-2 rounded-lg text-white/40 hover:text-white hover:bg-white/5"><Copy className="w-4 h-4" /></button>
                                    {(c.status === 'queued' || c.status === 'scheduled') && (
                                        <button title="Stop" aria-label="Stop broadcast" onClick={() => cancel(c)} className="p-2 rounded-lg text-white/40 hover:text-amber-400 hover:bg-white/5"><Ban className="w-4 h-4" /></button>
                                    )}
                                    <button title="Delete" aria-label="Delete" onClick={() => remove(c)} className="p-2 rounded-lg text-white/40 hover:text-red-400 hover:bg-white/5"><Trash2 className="w-4 h-4" /></button>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}

/**
 * Day-wise sequences — Day 1 / Day 2 / … messages sent automatically to
 * every member of a group, counted from when they joined (or a fixed date).
 */
import { useCallback, useEffect, useState } from 'react';
import { Plus, CalendarDays, Loader2, ArrowLeft, Trash2, Save, Pause, Play, ChevronUp, ChevronDown } from 'lucide-react';
import { waApi } from '../adminApi';
import { useToast } from '../ToastProvider';
import { card, btnGhost, btnPrimary, labelCls, inputCls, ContactPicker, EmptyState, PINK } from './waShared';
import { ComposerWithTemplates } from './TemplateGallery';
import PreviewPanel from './PreviewPanel';
import { SEQUENCE_PRESETS, findPlaceholders } from './waTemplates';

const BLANK = {
    name: '',
    description: '',
    group_id: '',
    start_mode: 'joined',
    start_date: '',
    excluded_contact_ids: [],
    active: true,
    steps: [{ day_number: 1, body: '', image_url: '', cta_label: '', cta_url: '' }],
};

export default function WaSequences({ groups, onChanged }) {
    const toast = useToast();
    const [sequences, setSequences] = useState([]);
    const [loading, setLoading] = useState(true);
    const [editing, setEditing] = useState(null);
    const [activeStep, setActiveStep] = useState(0);
    const [preview, setPreview] = useState(null);
    const [busy, setBusy] = useState(false);

    const load = useCallback(async () => {
        setLoading(true);
        try {
            setSequences((await waApi.sequences()).sequences || []);
        } catch (e) {
            toast.error(e.message);
        } finally {
            setLoading(false);
        }
    }, [toast]);

    useEffect(() => { load(); }, [load]);

    useEffect(() => {
        setPreview(null);
        if (!editing?.id) return;
        waApi.sequencePreview(editing.id).then((r) => setPreview(r.days)).catch(() => {});
    }, [editing?.id]);

    const open = (seq) => {
        setActiveStep(0);
        setEditing(seq
            ? { ...seq, group_id: seq.group_id || '', start_date: seq.start_date || '', steps: seq.steps.length ? seq.steps : BLANK.steps }
            : { ...BLANK, presetId: SEQUENCE_PRESETS[0].id, steps: SEQUENCE_PRESETS[0].steps.map((s) => ({ image_url: '', ...s })) });
    };

    const setStep = (i, patch) => setEditing((e) => ({ ...e, steps: e.steps.map((s, idx) => (idx === i ? { ...s, ...patch } : s)) }));

    const addStep = () => {
        setEditing((e) => {
            const last = e.steps.reduce((m, s) => Math.max(m, Number(s.day_number) || 0), 0);
            return { ...e, steps: [...e.steps, { day_number: last + 1, body: '', image_url: '', cta_label: '', cta_url: '' }] };
        });
        setActiveStep(editing.steps.length);
    };

    const removeStep = (i) => {
        setEditing((e) => ({ ...e, steps: e.steps.filter((_, idx) => idx !== i) }));
        setActiveStep(0);
    };

    const save = async () => {
        if (!editing.name.trim()) return toast.error('Give the sequence a name.');
        if (!editing.group_id) return toast.error('Pick which group receives this sequence.');
        if (editing.steps.some((s) => !s.body.trim())) return toast.error('Every day needs a message (or remove the empty day).');
        const blanks = editing.steps.flatMap((s) => findPlaceholders(s.body, s.cta_url).map((p) => `Day ${s.day_number}: ${p}`));
        if (blanks.length) return toast.error(`Fill in ${blanks.slice(0, 3).join(', ')}${blanks.length > 3 ? '…' : ''} before saving.`);
        setBusy(true);
        try {
            const payload = { ...editing, steps: [...editing.steps].sort((a, b) => a.day_number - b.day_number) };
            if (editing.id) await waApi.updateSequence(editing.id, payload);
            else await waApi.createSequence(payload);
            toast.success('Sequence saved. Messages are queued each morning for whoever is due.');
            setEditing(null);
            load();
            onChanged?.();
        } catch (e) {
            toast.error(e.message);
        } finally {
            setBusy(false);
        }
    };

    const toggle = async (seq) => {
        try {
            await waApi.toggleSequence(seq.id, !seq.active);
            setSequences((ss) => ss.map((s) => (s.id === seq.id ? { ...s, active: !s.active } : s)));
        } catch (e) {
            toast.error(e.message);
        }
    };

    const remove = async (seq) => {
        if (!window.confirm(`Delete "${seq.name}"? Unsent messages from it are removed too.`)) return;
        try {
            await waApi.deleteSequence(seq.id);
            setSequences((ss) => ss.filter((s) => s.id !== seq.id));
            onChanged?.();
        } catch (e) {
            toast.error(e.message);
        }
    };

    if (editing) {
        const set = (patch) => setEditing((e) => ({ ...e, ...patch }));
        const sortedIdx = editing.steps.map((s, i) => [s, i]).sort((a, b) => a[0].day_number - b[0].day_number);
        const step = editing.steps[activeStep] || editing.steps[0];
        return (
            <div className="space-y-5">
                <button onClick={() => setEditing(null)} className="inline-flex items-center gap-1.5 text-sm text-white/50 hover:text-white">
                    <ArrowLeft className="w-4 h-4" /> All sequences
                </button>

                {!editing.id && (
                    <section className="rounded-2xl p-4" style={card}>
                        <p className={labelCls}>Start from a ready-made set</p>
                        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-2">
                            {SEQUENCE_PRESETS.map((p) => {
                                const on = editing.presetId === p.id;
                                return (
                                    <button key={p.id} type="button"
                                        onClick={() => { setEditing((e) => ({ ...e, presetId: p.id, name: e.name || p.name, steps: p.steps.map((s) => ({ image_url: '', ...s })) })); setActiveStep(0); }}
                                        className="rounded-xl p-3 text-left"
                                        style={on ? { background: 'rgba(231,23,99,0.12)', border: '1.5px solid rgba(231,23,99,0.5)' } : { background: 'rgba(255,255,255,0.02)', border: '1.5px solid rgba(255,255,255,0.07)' }}>
                                        <p className="text-sm font-semibold text-white">{p.name}</p>
                                        <p className="text-[11px] text-white/40 mt-0.5">{p.description}</p>
                                    </button>
                                );
                            })}
                        </div>
                    </section>
                )}

                <section className="rounded-2xl p-5 grid sm:grid-cols-2 gap-4" style={card}>
                    <div>
                        <label className={labelCls}>Sequence name</label>
                        <input className={inputCls} value={editing.name} onChange={(e) => set({ name: e.target.value })} placeholder="30-day challenge onboarding" />
                    </div>
                    <div>
                        <label className={labelCls}>Send to group</label>
                        <select className={inputCls} value={editing.group_id} onChange={(e) => set({ group_id: e.target.value })}>
                            <option value="">Choose a group…</option>
                            {groups.map((g) => <option key={g.id} value={g.id}>{g.name} ({g.memberCount})</option>)}
                        </select>
                        {!groups.length && <p className="text-[11px] text-amber-400 mt-1">Create a group under Contacts first.</p>}
                    </div>
                    <div>
                        <label className={labelCls}>Day 1 is…</label>
                        <select className={inputCls} value={editing.start_mode} onChange={(e) => set({ start_mode: e.target.value })}>
                            <option value="joined">The day each person was added to the group</option>
                            <option value="fixed">A fixed date for everyone (a batch)</option>
                        </select>
                    </div>
                    {editing.start_mode === 'fixed' ? (
                        <div>
                            <label className={labelCls}>Batch start date (Day 1)</label>
                            <input type="date" className={inputCls} value={editing.start_date} onChange={(e) => set({ start_date: e.target.value })} />
                        </div>
                    ) : (
                        <p className="text-xs text-white/35 self-end pb-2 leading-relaxed">
                            New people added to the group later start from Day 1 on their own. Ideal for leads and new clients.
                        </p>
                    )}
                    <div className="sm:col-span-2">
                        <ContactPicker label="Skip these people" value={editing.excluded_contact_ids || []} onChange={(ids) => set({ excluded_contact_ids: ids })} groupId={editing.group_id || undefined}
                            hint="They stay in the group but won't get this sequence." />
                    </div>
                </section>

                {preview && (
                    <section className="rounded-2xl p-4" style={card}>
                        <p className={labelCls}>Next 7 days</p>
                        <div className="grid grid-cols-7 gap-1.5">
                            {preview.map((d) => (
                                <div key={d.date} className="rounded-lg px-2 py-2 text-center" style={{ background: d.count ? 'rgba(37,211,102,0.08)' : 'rgba(255,255,255,0.02)' }}>
                                    <p className="text-[10px] text-white/35">{new Date(`${d.date}T00:00:00`).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric' })}</p>
                                    <p className="text-sm font-bold tabular-nums" style={{ color: d.count ? '#25d366' : 'rgba(255,255,255,0.2)' }}>{d.count}</p>
                                </div>
                            ))}
                        </div>
                    </section>
                )}

                <div className="grid lg:grid-cols-[200px_1fr_320px] gap-5 items-start">
                    {/* Day timeline */}
                    <nav className="rounded-2xl p-2 space-y-1" style={card} aria-label="Days">
                        {sortedIdx.map(([s, i]) => (
                            <button key={i} onClick={() => setActiveStep(i)}
                                className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-left"
                                style={i === activeStep ? { background: 'rgba(231,23,99,0.12)', border: '1px solid rgba(231,23,99,0.3)' } : { border: '1px solid transparent' }}>
                                <span className="w-9 h-9 rounded-lg flex flex-col items-center justify-center flex-shrink-0" style={{ background: 'rgba(255,255,255,0.05)' }}>
                                    <span className="text-[8px] uppercase text-white/40 leading-none">Day</span>
                                    <span className="text-sm font-bold text-white leading-none mt-0.5">{s.day_number}</span>
                                </span>
                                <span className="text-xs text-white/55 truncate">{s.body || 'Empty message'}</span>
                            </button>
                        ))}
                        <button onClick={addStep} className="w-full flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl text-xs font-semibold text-white/50 hover:text-white hover:bg-white/5">
                            <Plus className="w-3.5 h-3.5" /> Add a day
                        </button>
                    </nav>

                    {/* Step editor */}
                    {step && (
                        <section className="rounded-2xl p-5 space-y-4" style={card}>
                            <div className="flex items-center gap-3">
                                <label className={labelCls + ' mb-0'}>Send on day</label>
                                <div className="flex items-center rounded-xl border border-white/10">
                                    <button type="button" aria-label="Earlier day" onClick={() => setStep(activeStep, { day_number: Math.max(1, step.day_number - 1) })} className="p-2 text-white/50 hover:text-white"><ChevronDown className="w-4 h-4" /></button>
                                    <input type="number" min={1} max={365} value={step.day_number}
                                        onChange={(e) => setStep(activeStep, { day_number: Math.max(1, parseInt(e.target.value, 10) || 1) })}
                                        className="w-14 text-center bg-transparent text-white font-bold !border-0" />
                                    <button type="button" aria-label="Later day" onClick={() => setStep(activeStep, { day_number: step.day_number + 1 })} className="p-2 text-white/50 hover:text-white"><ChevronUp className="w-4 h-4" /></button>
                                </div>
                                <div className="flex-1" />
                                {editing.steps.length > 1 && (
                                    <button onClick={() => removeStep(activeStep)} className="inline-flex items-center gap-1.5 text-xs text-white/40 hover:text-red-400">
                                        <Trash2 className="w-3.5 h-3.5" /> Remove day
                                    </button>
                                )}
                            </div>
                            <ComposerWithTemplates value={step} onChange={(v) => setStep(activeStep, v)} showAdvanced />
                        </section>
                    )}

                    <aside className="lg:sticky lg:top-20 space-y-3">
                        {step && <PreviewPanel msg={step} />}
                        <button onClick={save} disabled={busy} className={btnPrimary + ' w-full'} style={{ background: PINK }}>
                            {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} Save sequence
                        </button>
                    </aside>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between gap-3">
                <p className="text-sm text-white/45">Automatic day-by-day follow-ups: onboarding, challenges, lead nurturing.</p>
                <button onClick={() => open(null)} className={btnPrimary} style={{ background: PINK }}>
                    <Plus className="w-4 h-4" /> New sequence
                </button>
            </div>

            {loading ? (
                <div className="flex justify-center py-16"><Loader2 className="w-5 h-5 text-white/30 animate-spin" /></div>
            ) : sequences.length === 0 ? (
                <EmptyState icon={CalendarDays} title="No day-wise sequences yet"
                    text="E.g. Day 1: welcome + form link, Day 2: reminder, Day 4: a client transformation. Everyone added to the group gets them in order."
                    action={<button onClick={() => open(null)} className={btnPrimary} style={{ background: PINK }}><Plus className="w-4 h-4" /> Start from a template</button>} />
            ) : (
                <div className="grid gap-3">
                    {sequences.map((s) => (
                        <div key={s.id} className="rounded-2xl p-4 flex flex-wrap items-center gap-4" style={card}>
                            <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: 'rgba(231,23,99,0.1)' }}>
                                <CalendarDays className="w-5 h-5" style={{ color: PINK }} />
                            </div>
                            <div className="flex-1 min-w-[180px]">
                                <div className="flex items-center gap-2">
                                    <p className="font-semibold text-white truncate">{s.name}</p>
                                    <span className="text-[10px] font-bold uppercase px-1.5 py-0.5 rounded"
                                        style={s.active ? { background: 'rgba(37,211,102,0.12)', color: '#25d366' } : { background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.5)' }}>
                                        {s.active ? 'Running' : 'Paused'}
                                    </span>
                                </div>
                                <p className="text-xs text-white/40 mt-0.5">
                                    {s.group?.name || 'No group'} · {s.steps.length} message{s.steps.length === 1 ? '' : 's'} over {s.steps.at(-1)?.day_number || 0} days
                                    {s.start_mode === 'fixed' && s.start_date ? ` · batch from ${s.start_date}` : ''}
                                </p>
                                <div className="flex gap-1 mt-2 flex-wrap">
                                    {s.steps.map((st) => (
                                        <span key={st.id} className="text-[10px] px-1.5 py-0.5 rounded text-white/50" style={{ background: 'rgba(255,255,255,0.05)' }}>D{st.day_number}</span>
                                    ))}
                                </div>
                            </div>
                            <div className="flex items-center gap-1">
                                <button onClick={() => open(s)} className={btnGhost}>Edit</button>
                                <button onClick={() => toggle(s)} title={s.active ? 'Pause' : 'Resume'} aria-label={s.active ? 'Pause' : 'Resume'} className="p-2 rounded-lg text-white/40 hover:text-white hover:bg-white/5">
                                    {s.active ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                                </button>
                                <button onClick={() => remove(s)} title="Delete" aria-label="Delete" className="p-2 rounded-lg text-white/40 hover:text-red-400 hover:bg-white/5"><Trash2 className="w-4 h-4" /></button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

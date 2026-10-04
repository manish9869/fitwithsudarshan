/**
 * Template gallery (built-in + "My templates"), the fill-in-the-blanks
 * editor for [PLACEHOLDERS], and a modal wrapper for use inside composers.
 */
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Search, X, Sparkles, Bookmark, Trash2, CalendarHeart, Loader2 } from 'lucide-react';
import { getSiteContentKey, putSiteContentKey } from '../content/cmsApi';
import { useToast } from '../ToastProvider';
import { WA_TEMPLATES, TEMPLATE_CATEGORIES, upcomingTemplates, PLACEHOLDER_RE } from './waTemplates';
import { inputCls, labelCls, PINK, personalizePreview, MessageComposer } from './waShared';

// ── "My templates" (stored in site_content.wa_templates) ─────────────────
export function useMyTemplates() {
    const toast = useToast();
    const [mine, setMine] = useState([]);
    const [loaded, setLoaded] = useState(false);

    useEffect(() => {
        getSiteContentKey('wa_templates')
            .then((v) => setMine(Array.isArray(v) ? v : []))
            .catch(() => setMine([]))
            .finally(() => setLoaded(true));
    }, []);

    const persist = useCallback(async (next) => {
        const prev = mine;
        setMine(next);
        try {
            await putSiteContentKey('wa_templates', next);
            return true;
        } catch (e) {
            setMine(prev);
            toast.error(e.message || 'Could not save template');
            return false;
        }
    }, [mine, toast]);

    const save = useCallback(async (msg, title) => {
        const t = {
            id: `mine-${Date.now()}`,
            category: 'mine',
            months: [],
            title: title || 'My template',
            body: msg.body || '',
            image_url: msg.image_url || '',
            cta_label: msg.cta_label || '',
            cta_url: msg.cta_url || '',
        };
        if (await persist([t, ...mine])) toast.success(`Saved “${t.title}” to My templates`);
    }, [mine, persist, toast]);

    const remove = useCallback((id) => persist(mine.filter((t) => t.id !== id)), [mine, persist]);

    return { mine, loaded, save, remove };
}

/** Button + inline prompt to save the current message as a template. */
export function SaveTemplateButton({ msg, onSave }) {
    const [naming, setNaming] = useState(false);
    const [title, setTitle] = useState('');
    if (!naming) {
        return (
            <button type="button" disabled={!msg.body?.trim()} onClick={() => setNaming(true)}
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-white/50 hover:text-white disabled:opacity-40">
                <Bookmark className="w-3.5 h-3.5" /> Save as my template
            </button>
        );
    }
    return (
        <form className="flex items-center gap-2" onSubmit={(e) => { e.preventDefault(); onSave(msg, title.trim()); setNaming(false); setTitle(''); }}>
            <input autoFocus value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Template name" className={inputCls + ' !py-1.5 !text-xs'} />
            <button className="px-3 py-1.5 rounded-lg text-xs font-bold text-white" style={{ background: PINK }}>Save</button>
            <button type="button" onClick={() => setNaming(false)} className="text-xs text-white/40">Cancel</button>
        </form>
    );
}

// ── Gallery ──────────────────────────────────────────────────────────────
function TemplateCard({ t, onPick, onDelete }) {
    const preview = personalizePreview(t.body, 'Rahul').replace(/\*/g, '');
    return (
        <div className="group relative rounded-2xl p-4 flex flex-col text-left transition-colors hover:border-[rgba(231,23,99,0.45)]"
            style={{ background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.08)' }}>
            <button type="button" onClick={() => onPick(t)} className="absolute inset-0 rounded-2xl" aria-label={`Use template ${t.title}`} />
            <div className="flex items-start justify-between gap-2 mb-2">
                <p className="font-semibold text-white text-sm leading-tight">{t.title}</p>
                {t.when && <span className="text-[10px] font-semibold text-white/40 whitespace-nowrap">{t.when}</span>}
            </div>
            <p className="text-xs text-white/45 leading-relaxed line-clamp-4 whitespace-pre-line flex-1">{preview}</p>
            <div className="flex items-center justify-between mt-3">
                <span className="text-xs font-bold opacity-0 group-hover:opacity-100 transition-opacity" style={{ color: PINK }}>Use this →</span>
                {onDelete && (
                    <button type="button" onClick={() => onDelete(t.id)} aria-label={`Delete ${t.title}`}
                        className="relative z-10 p-1.5 rounded-lg text-white/30 hover:text-red-400 hover:bg-white/5">
                        <Trash2 className="w-3.5 h-3.5" />
                    </button>
                )}
            </div>
        </div>
    );
}

export function TemplateGallery({ onPick, my, compact }) {
    const [cat, setCat] = useState('upcoming');
    const [q, setQ] = useState('');
    const upcoming = useMemo(() => upcomingTemplates(), []);

    const list = useMemo(() => {
        const query = q.trim().toLowerCase();
        let base;
        if (query) base = [...my.mine, ...WA_TEMPLATES];
        else if (cat === 'upcoming') base = upcoming;
        else if (cat === 'mine') base = my.mine;
        else base = WA_TEMPLATES.filter((t) => t.category === cat);
        if (!query) return base;
        return base.filter((t) => `${t.title} ${t.body} ${t.when || ''}`.toLowerCase().includes(query));
    }, [cat, q, upcoming, my.mine]);

    const chips = [
        { id: 'upcoming', label: 'Coming up', emoji: '📅' },
        ...TEMPLATE_CATEGORIES,
        { id: 'mine', label: `My templates${my.mine.length ? ` (${my.mine.length})` : ''}`, emoji: '⭐' },
    ];

    return (
        <div className="space-y-4">
            <div className="flex flex-wrap items-center gap-2">
                <div className="relative flex-1 min-w-[200px] max-w-sm">
                    <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-white/30" />
                    <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search: Diwali, referral, birthday…" className={inputCls + ' pl-8'} />
                </div>
            </div>
            {!q && (
                <div className="flex gap-1.5 overflow-x-auto pb-1 -mx-1 px-1">
                    {chips.map((c) => {
                        const active = cat === c.id;
                        return (
                            <button key={c.id} type="button" onClick={() => setCat(c.id)}
                                className="flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap"
                                style={active
                                    ? { background: 'rgba(231,23,99,0.15)', border: '1px solid rgba(231,23,99,0.45)', color: '#fff' }
                                    : { background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.55)' }}>
                                <span aria-hidden="true">{c.emoji}</span> {c.label}
                            </button>
                        );
                    })}
                </div>
            )}

            {cat === 'upcoming' && !q && (
                <p className="flex items-center gap-1.5 text-xs text-white/40">
                    <CalendarHeart className="w-3.5 h-3.5" /> Festivals and occasions this month and next. Lunar festival dates shift each year, so check the date.
                </p>
            )}

            {cat === 'mine' && !q && !my.loaded ? (
                <div className="flex justify-center py-10"><Loader2 className="w-5 h-5 text-white/30 animate-spin" /></div>
            ) : list.length === 0 ? (
                <div className="rounded-2xl px-6 py-10 text-center text-sm text-white/40" style={{ border: '1px dashed rgba(255,255,255,0.1)' }}>
                    {cat === 'mine' && !q
                        ? 'No saved templates yet. Write a message and tap “Save as my template” to reuse it later.'
                        : 'No templates match. Try another word or category.'}
                </div>
            ) : (
                <div className={`grid gap-3 ${compact ? 'sm:grid-cols-2' : 'sm:grid-cols-2 lg:grid-cols-3'}`}>
                    {list.map((t) => (
                        <TemplateCard key={t.id} t={t} onPick={onPick} onDelete={t.category === 'mine' ? my.remove : undefined} />
                    ))}
                </div>
            )}
        </div>
    );
}

/** Modal wrapper used from the Broadcast / Day-wise composers. */
export function TemplateModal({ open, onClose, onPick }) {
    const my = useMyTemplates();
    useEffect(() => {
        if (!open) return;
        const onKey = (e) => e.key === 'Escape' && onClose();
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, [open, onClose]);
    if (!open) return null;
    return (
        <div className="fixed inset-0 z-[60] flex items-start justify-center p-3 sm:p-6 overflow-y-auto" style={{ background: 'rgba(0,0,0,0.65)' }}
            onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
            <div role="dialog" aria-modal="true" aria-label="Message templates" className="w-full max-w-3xl rounded-2xl p-5 my-auto" style={{ background: '#111', border: '1px solid rgba(255,255,255,0.1)' }}>
                <div className="flex items-center justify-between mb-4">
                    <h3 className="flex items-center gap-2 text-base font-bold text-white"><Sparkles className="w-4 h-4" style={{ color: PINK }} /> Message templates</h3>
                    <button onClick={onClose} aria-label="Close" className="p-1.5 rounded-lg text-white/40 hover:text-white hover:bg-white/5"><X className="w-4 h-4" /></button>
                </div>
                <TemplateGallery compact my={my} onPick={(t) => { onPick(t); onClose(); }} />
            </div>
        </div>
    );
}

// ── Fill-in-the-blanks ───────────────────────────────────────────────────
function prettyLabel(ph) {
    // "[OFFER, e.g. 20% off any 3-month plan]" → label "Offer", hint "20% off any 3-month plan"
    const inner = ph.slice(1, -1);
    const [main, ...rest] = inner.split(/,\s*e\.g\.\s*/i);
    const label = main.trim().toLowerCase().replace(/^\w/, (c) => c.toUpperCase());
    return { label, hint: rest.join(', ').trim() };
}

/**
 * One input per [PLACEHOLDER] found in the message. Typing replaces every
 * occurrence of that placeholder in body / button link.
 */
export function PlaceholderFields({ value, onChange }) {
    const placeholders = useMemo(() => {
        const found = [`${value.body || ''}`, `${value.cta_url || ''}`].flatMap((t) => t.match(PLACEHOLDER_RE) || []);
        return [...new Set(found)];
    }, [value.body, value.cta_url]);

    const [drafts, setDrafts] = useState({});

    if (!placeholders.length) return null;

    const apply = (ph) => {
        const val = (drafts[ph] || '').trim();
        if (!val) return;
        const rep = (s) => (s ? s.split(ph).join(val) : s);
        onChange({ ...value, body: rep(value.body), cta_url: rep(value.cta_url) });
        setDrafts((d) => { const n = { ...d }; delete n[ph]; return n; });
    };

    return (
        <div className="rounded-2xl p-4 space-y-3" style={{ background: 'rgba(251,191,36,0.05)', border: '1px solid rgba(251,191,36,0.25)' }}>
            <p className="text-xs font-bold text-amber-300">Fill in {placeholders.length} detail{placeholders.length === 1 ? '' : 's'} before sending</p>
            <div className="grid sm:grid-cols-2 gap-3">
                {placeholders.map((ph) => {
                    const { label, hint } = prettyLabel(ph);
                    return (
                        <div key={ph}>
                            <label className={labelCls}>{label}</label>
                            <div className="flex gap-1.5">
                                <input className={inputCls} value={drafts[ph] || ''} placeholder={hint || label}
                                    onChange={(e) => setDrafts((d) => ({ ...d, [ph]: e.target.value }))}
                                    onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); apply(ph); } }}
                                    onBlur={() => apply(ph)} />
                            </div>
                        </div>
                    );
                })}
            </div>
            <p className="text-[11px] text-white/35">Each value is placed into the message when you press Enter or click away.</p>
        </div>
    );
}

/**
 * MessageComposer + "Templates" button + fill-in-the-blanks + save-as-template.
 * Drop-in replacement for MessageComposer in the Broadcast / Day-wise editors.
 */
export function ComposerWithTemplates({ value, onChange, showAdvanced }) {
    const [open, setOpen] = useState(false);
    const my = useMyTemplates();
    const v = value || {};
    const pick = (t) => onChange({ ...v, body: t.body || '', image_url: t.image_url || v.image_url || '', cta_label: t.cta_label || '', cta_url: t.cta_url || '' });
    return (
        <div className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
                <button type="button" onClick={() => setOpen(true)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold"
                    style={{ background: 'rgba(231,23,99,0.12)', color: '#ff7aa8', border: '1px solid rgba(231,23,99,0.3)' }}>
                    <Sparkles className="w-3.5 h-3.5" /> Use a template
                </button>
                <SaveTemplateButton msg={v} onSave={my.save} />
            </div>
            <PlaceholderFields value={v} onChange={onChange} />
            <MessageComposer value={v} onChange={onChange} showAdvanced={showAdvanced} />
            <TemplateModal open={open} onClose={() => setOpen(false)} onPick={pick} />
        </div>
    );
}

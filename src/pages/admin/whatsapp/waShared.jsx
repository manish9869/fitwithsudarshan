/**
 * Shared building blocks for the WhatsApp marketing screens.
 */
import { useEffect, useRef, useState } from 'react';
import { ExternalLink, Users, Tag as TagIcon, X, Search, Globe } from 'lucide-react';
import { ImageField } from '../content/SettingsFields';
import { waApi } from '../adminApi';
import { useDebounce } from '../useDebounce';

export const card = {
    background: 'rgba(255,255,255,0.025)',
    border: '1px solid rgba(255,255,255,0.07)',
};
export const inputCls = 'w-full px-3 py-2.5 rounded-xl text-sm text-white placeholder:text-white/25 bg-white/[0.04] border border-white/10';
export const labelCls = 'block text-[11px] font-bold uppercase tracking-wider text-white/40 mb-1.5';
export const btnPrimary = 'inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold text-white disabled:opacity-50 transition-transform active:scale-[0.97]';
export const btnGhost = 'inline-flex items-center justify-center gap-2 px-3.5 py-2 rounded-xl text-sm font-semibold text-white/70 hover:text-white hover:bg-white/5 border border-white/10 disabled:opacity-50 transition-transform active:scale-[0.97]';
export const PINK = '#e71763';
export const WA_GREEN = '#25d366';

export function formatPhone(p) {
    const d = String(p || '');
    if (d.startsWith('91') && d.length === 12) return `+91 ${d.slice(2, 7)} ${d.slice(7)}`;
    return `+${d}`;
}

export function personalizePreview(body, name) {
    const full = String(name || '').trim().toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase()) || 'there';
    const first = full.split(/\s+/)[0];
    return String(body || '')
        .replace(/\{\{\s*first_name\s*\}\}/gi, first)
        .replace(/\{\{\s*name\s*\}\}/gi, full);
}

/** Text that goes into WhatsApp in assisted mode (button → link line). */
export function assistedText(msg) {
    let t = msg.body || '';
    if (msg.cta_url) t += `\n\n👉 ${msg.cta_label || 'Details'}: ${msg.cta_url}`;
    if (msg.image_url) t += `\n\n${msg.image_url}`;
    return t;
}

export function waLink(phone, text) {
    return `https://wa.me/${phone}?text=${encodeURIComponent(text)}`;
}

// ── Live WhatsApp-style preview (mirrors the poster + text + button look) ──
export function WhatsAppPreview({ msg, name = 'Rahul Sharma', brand = 'FitWithSudarshan' }) {
    const body = personalizePreview(msg.body, name);
    return (
        <div className="rounded-2xl p-4" style={{ background: '#0b141a', border: '1px solid rgba(255,255,255,0.06)' }}>
            <p className="text-[10px] text-center text-white/40 mb-3">
                <span className="px-2 py-0.5 rounded-md" style={{ background: '#182229' }}>Preview · as {name.split(' ')[0]} sees it</span>
            </p>
            <div className="max-w-[300px] rounded-xl rounded-tl-none overflow-hidden" style={{ background: '#202c33' }}>
                {msg.image_url && <img src={msg.image_url} alt="" className="w-full max-h-64 object-cover" />}
                <div className="px-3 py-2">
                    <p className="text-[13px] text-white/90 whitespace-pre-wrap break-words leading-snug">
                        {body || <span className="text-white/30">Your message will appear here…</span>}
                    </p>
                    <p className="text-[11px] text-white/35 mt-1.5 flex justify-between gap-2">
                        <span>{brand}</span><span>10:34 AM</span>
                    </p>
                </div>
                {msg.cta_label && (
                    <div className="flex items-center justify-center gap-1.5 py-2.5 text-[13px] font-medium" style={{ borderTop: '1px solid rgba(255,255,255,0.08)', color: '#53bdeb' }}>
                        <ExternalLink className="w-3.5 h-3.5" /> {msg.cta_label}
                    </div>
                )}
            </div>
        </div>
    );
}

// ── Message composer ──────────────────────────────────────────────────────
export function MessageComposer({ value, onChange, showAdvanced }) {
    const v = value || {};
    const set = (k) => (val) => onChange({ ...v, [k]: val });
    const taRef = useRef(null);

    const insert = (token) => {
        const el = taRef.current;
        const body = v.body || '';
        const start = el?.selectionStart ?? body.length;
        const end = el?.selectionEnd ?? body.length;
        const next = body.slice(0, start) + token + body.slice(end);
        onChange({ ...v, body: next });
        requestAnimationFrame(() => {
            el?.focus();
            el?.setSelectionRange(start + token.length, start + token.length);
        });
    };

    return (
        <div className="space-y-4">
            <div>
                <div className="flex items-center justify-between mb-1.5">
                    <label className={labelCls + ' mb-0'}>Message</label>
                    <div className="flex gap-1.5">
                        {[['{{first_name}}', 'First name'], ['{{name}}', 'Full name']].map(([tok, label]) => (
                            <button key={tok} type="button" onClick={() => insert(tok)}
                                className="text-[11px] px-2 py-0.5 rounded-md text-white/60 hover:text-white border border-white/10 hover:border-white/25">
                                + {label}
                            </button>
                        ))}
                    </div>
                </div>
                <textarea ref={taRef} rows={6} value={v.body || ''} onChange={(e) => set('body')(e.target.value)}
                    placeholder={'Hey {{first_name}} 👋, Diwali is over, the sweets are done. But the excuses? 😄\n\nStart the 30-day RECODE challenge this Monday.'}
                    className={inputCls + ' resize-y leading-relaxed'} />
                <p className="text-[11px] text-white/30 mt-1">
                    {(v.body || '').length}/4000 · *bold*, _italic_ and emojis work like in WhatsApp.
                </p>
            </div>

            <ImageField label="Poster / image (optional)" value={v.image_url} onChange={set('image_url')} folder="whatsapp"
                hint="A transformation photo or offer poster. In hand-send mode the image link is added to the message." />

            <div className="grid sm:grid-cols-2 gap-3">
                <div>
                    <label className={labelCls}>Button text (optional)</label>
                    <input className={inputCls} value={v.cta_label || ''} maxLength={40} onChange={(e) => set('cta_label')(e.target.value)} placeholder="Join Now" />
                </div>
                <div>
                    <label className={labelCls}>Button link</label>
                    <input className={inputCls} value={v.cta_url || ''} onChange={(e) => set('cta_url')(e.target.value)} placeholder="https://fitwithsudarshan.com/#pricing" />
                </div>
            </div>

            {showAdvanced && (
                <details className="rounded-xl px-3 py-2" style={card}>
                    <summary className="text-xs font-semibold text-white/50 cursor-pointer">Automatic sending (Meta template)</summary>
                    <div className="grid sm:grid-cols-[1fr_90px] gap-3 mt-3">
                        <div>
                            <label className={labelCls}>Approved template name</label>
                            <input className={inputCls} value={v.meta_template_name || ''} onChange={(e) => set('meta_template_name')(e.target.value)} placeholder="festive_offer_v1" />
                        </div>
                        <div>
                            <label className={labelCls}>Language</label>
                            <input className={inputCls} value={v.meta_template_lang || 'en'} onChange={(e) => set('meta_template_lang')(e.target.value)} />
                        </div>
                    </div>
                    <p className="text-[11px] text-white/30 mt-2 leading-relaxed">
                        Only needed once the WhatsApp Cloud API is connected. Meta requires an approved template for promotional messages; its body variable {'{{1}}'} gets the person's first name and the image above is used as the header. Leave blank for hand-send mode.
                    </p>
                </details>
            )}
        </div>
    );
}

// ── Contact search picker (used for "skip these people" and "add extra") ──
export function ContactPicker({ label, value = [], onChange, groupId, hint }) {
    const [query, setQuery] = useState('');
    const [results, setResults] = useState([]);
    const [known, setKnown] = useState({}); // id → contact, so chips keep names
    const dq = useDebounce(query.trim(), 250);

    useEffect(() => {
        if (dq.length < 2) { setResults([]); return; }
        let live = true;
        waApi.contacts({ search: dq, groupId, size: 10 }).then((r) => live && setResults(r.rows || [])).catch(() => live && setResults([]));
        return () => { live = false; };
    }, [dq, groupId]);

    const add = (c) => {
        setKnown((k) => ({ ...k, [c.id]: c }));
        if (!value.includes(c.id)) onChange([...value, c.id]);
        setQuery('');
        setResults([]);
    };

    return (
        <div>
            {label && <label className={labelCls}>{label}</label>}
            {value.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mb-2">
                    {value.map((id) => (
                        <span key={id} className="inline-flex items-center gap-1 pl-2.5 pr-1 py-1 rounded-lg text-xs text-white/80" style={{ background: 'rgba(255,255,255,0.06)' }}>
                            {known[id]?.name || known[id]?.phone || 'Contact'}
                            <button type="button" aria-label="Remove" onClick={() => onChange(value.filter((x) => x !== id))} className="p-0.5 rounded hover:bg-white/10">
                                <X className="w-3 h-3" />
                            </button>
                        </span>
                    ))}
                </div>
            )}
            <div className="relative">
                <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-white/30" />
                <input className={inputCls + ' pl-8'} value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search by name or phone…" />
                {results.length > 0 && (
                    <div className="absolute z-20 left-0 right-0 mt-1 rounded-xl overflow-hidden" style={{ background: '#151515', border: '1px solid rgba(255,255,255,0.1)' }}>
                        {results.map((c) => (
                            <button key={c.id} type="button" onClick={() => add(c)}
                                className="w-full flex items-center justify-between px-3 py-2 text-left text-sm hover:bg-white/5">
                                <span className="text-white/85">{c.name || 'Unnamed'}</span>
                                <span className="text-xs text-white/35">{formatPhone(c.phone)}</span>
                            </button>
                        ))}
                    </div>
                )}
            </div>
            {hint && <p className="text-[11px] text-white/30 mt-1">{hint}</p>}
        </div>
    );
}

// ── Audience picker: everyone / groups / tags, plus extras and skips ──────
export function AudiencePicker({ value, onChange, groups, tags, body }) {
    const a = value || {};
    const set = (k) => (val) => onChange({ ...a, [k]: val });
    const toggle = (k, item) => {
        const list = a[k] || [];
        set(k)(list.includes(item) ? list.filter((x) => x !== item) : [...list, item]);
    };

    const [preview, setPreview] = useState(null);
    const key = JSON.stringify(a);
    const dKey = useDebounce(key, 400);
    useEffect(() => {
        let live = true;
        const aud = JSON.parse(dKey);
        if (!aud.all && !aud.groupIds?.length && !aud.tags?.length && !aud.contactIds?.length) { setPreview({ count: 0, sample: [] }); return; }
        setPreview(null);
        waApi.previewAudience(aud, body).then((r) => live && setPreview(r)).catch(() => live && setPreview({ count: 0, sample: [], error: true }));
        return () => { live = false; };
    }, [dKey, body]);

    const chip = (active) => ({
        background: active ? 'rgba(231,23,99,0.14)' : 'rgba(255,255,255,0.03)',
        border: `1px solid ${active ? 'rgba(231,23,99,0.45)' : 'rgba(255,255,255,0.09)'}`,
        color: active ? '#fff' : 'rgba(255,255,255,0.6)',
    });

    return (
        <div className="space-y-4">
            <div>
                <label className={labelCls}>Send to</label>
                <div className="flex flex-wrap gap-2">
                    <button type="button" onClick={() => set('all')(!a.all)} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold" style={chip(a.all)}>
                        <Globe className="w-3.5 h-3.5" /> All contacts
                    </button>
                    {groups.map((g) => (
                        <button key={g.id} type="button" onClick={() => toggle('groupIds', g.id)} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold" style={chip(a.groupIds?.includes(g.id))}>
                            <Users className="w-3.5 h-3.5" /> {g.name} <span className="text-white/35">{g.memberCount}</span>
                        </button>
                    ))}
                </div>
            </div>
            {tags.length > 0 && (
                <div>
                    <label className={labelCls}>Or everyone tagged</label>
                    <div className="flex flex-wrap gap-2">
                        {tags.map((t) => (
                            <button key={t.tag} type="button" onClick={() => toggle('tags', t.tag)} className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs" style={chip(a.tags?.includes(t.tag))}>
                                <TagIcon className="w-3 h-3" /> {t.tag} <span className="text-white/35">{t.count}</span>
                            </button>
                        ))}
                    </div>
                </div>
            )}
            <div className="grid sm:grid-cols-2 gap-4">
                <ContactPicker label="Also include" value={a.contactIds || []} onChange={set('contactIds')} />
                <ContactPicker label="Skip these people" value={a.excludeContactIds || []} onChange={set('excludeContactIds')} hint="Opted-out contacts are always skipped." />
            </div>
            <div className="rounded-xl px-4 py-3 text-sm" style={{ background: 'rgba(37,211,102,0.06)', border: '1px solid rgba(37,211,102,0.2)' }}>
                {preview === null ? (
                    <span className="text-white/50">Counting recipients…</span>
                ) : preview.error ? (
                    <span className="text-red-400">Couldn't count recipients. Check your connection.</span>
                ) : (
                    <span className="text-white/80">
                        <b className="text-white">{preview.count}</b> {preview.count === 1 ? 'person' : 'people'} will get this
                        {preview.sample?.length > 0 && <span className="text-white/40"> · {preview.sample.map((s) => s.name || formatPhone(s.phone)).join(', ')}{preview.count > preview.sample.length ? '…' : ''}</span>}
                    </span>
                )}
            </div>
        </div>
    );
}

export function EmptyState({ icon: Icon, title, text, action }) {
    return (
        <div className="rounded-2xl px-6 py-14 text-center" style={card}>
            <div className="mx-auto mb-4 w-12 h-12 rounded-2xl flex items-center justify-center" style={{ background: 'rgba(231,23,99,0.1)', border: '1px solid rgba(231,23,99,0.25)' }}>
                <Icon className="w-5 h-5" style={{ color: PINK }} />
            </div>
            <p className="text-white font-semibold mb-1">{title}</p>
            <p className="text-sm text-white/40 max-w-sm mx-auto mb-5">{text}</p>
            {action}
        </div>
    );
}

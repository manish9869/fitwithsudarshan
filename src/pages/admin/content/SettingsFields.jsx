// src/pages/admin/SettingsFields.jsx
// Small, reusable "plain form" building blocks for AdminSiteSettings — no
// JSON, no code — so a non-technical user can edit everything with normal
// text boxes, toggles, and "Add" buttons.
import { Plus, X, GripVertical } from 'lucide-react';

const labelCls = 'text-[11px] font-bold text-white/45 uppercase tracking-widest mb-1.5 block';
const inputCls = 'w-full rounded-lg px-3 py-2.5 text-sm text-white bg-white/5 border border-white/10 placeholder:text-white/25 outline-none focus:border-[rgba(231,23,99,0.5)]';

export function FieldGroup({ title, description, children }) {
    return (
        <div className="rounded-2xl p-5 space-y-4" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.07)' }}>
            {title && (
                <div>
                    <p className="text-sm font-black text-white">{title}</p>
                    {description && <p className="text-xs text-white/35 mt-0.5">{description}</p>}
                </div>
            )}
            <div className="space-y-4">{children}</div>
        </div>
    );
}

export function TextInput({ label, value, onChange, placeholder, hint }) {
    return (
        <div>
            {label && <label className={labelCls}>{label}</label>}
            <input
                type="text"
                value={value ?? ''}
                onChange={(e) => onChange(e.target.value)}
                placeholder={placeholder}
                className={inputCls}
            />
            {hint && <p className="text-[11px] text-white/25 mt-1">{hint}</p>}
        </div>
    );
}

export function TextArea({ label, value, onChange, placeholder, rows = 3, hint }) {
    return (
        <div>
            {label && <label className={labelCls}>{label}</label>}
            <textarea
                value={value ?? ''}
                onChange={(e) => onChange(e.target.value)}
                placeholder={placeholder}
                rows={rows}
                className={`${inputCls} resize-none`}
            />
            {hint && <p className="text-[11px] text-white/25 mt-1">{hint}</p>}
        </div>
    );
}

export function ToggleField({ label, checked, onChange, hint }) {
    return (
        <div>
            <label className="flex items-center gap-2.5 text-sm text-white/80 cursor-pointer">
                <input type="checkbox" checked={!!checked} onChange={(e) => onChange(e.target.checked)} className="accent-primary w-4 h-4" />
                {label}
            </label>
            {hint && <p className="text-[11px] text-white/25 mt-1 ml-6">{hint}</p>}
        </div>
    );
}

export function SelectField({ label, value, onChange, options }) {
    return (
        <div>
            {label && <label className={labelCls}>{label}</label>}
            <select value={value ?? ''} onChange={(e) => onChange(e.target.value)} className={inputCls}>
                {options.map((o) => (
                    <option key={o} value={o} style={{ background: '#0a0a0a' }}>{o}</option>
                ))}
            </select>
        </div>
    );
}

// ── Pill-based list editor for simple string arrays ─────────────────────────
export function TagListEditor({ label, value, onChange, placeholder, hint }) {
    const items = Array.isArray(value) ? value : [];

    const updateAt = (i, text) => {
        const next = [...items];
        next[i] = text;
        onChange(next);
    };
    const removeAt = (i) => onChange(items.filter((_, idx) => idx !== i));
    const add = () => onChange([...items, '']);

    return (
        <div>
            {label && <label className={labelCls}>{label}</label>}
            <div className="space-y-2">
                {items.map((item, i) => (
                    <div key={i} className="flex items-center gap-2">
                        <input
                            type="text"
                            value={item}
                            onChange={(e) => updateAt(i, e.target.value)}
                            placeholder={placeholder}
                            className={inputCls}
                        />
                        <button type="button" onClick={() => removeAt(i)} className="w-8 h-8 flex-shrink-0 rounded-lg flex items-center justify-center text-white/30 hover:text-red-400 hover:bg-red-500/8">
                            <X className="w-3.5 h-3.5" />
                        </button>
                    </div>
                ))}
            </div>
            <button
                type="button"
                onClick={add}
                className="mt-2 flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold"
                style={{ background: 'rgba(231,23,99,0.1)', border: '1px solid rgba(231,23,99,0.25)', color: '#e71763' }}
            >
                <Plus className="w-3 h-3" /> Add
            </button>
            {hint && <p className="text-[11px] text-white/25 mt-1.5">{hint}</p>}
        </div>
    );
}

// ── Repeatable list of small objects (e.g. nav links, stat cards) ───────────
// `fields`: [{ key, label, placeholder?, type?: 'text' | 'select', options? }]
export function Repeater({ label, value, onChange, fields, emptyItem, addLabel = 'Add', hint }) {
    const items = Array.isArray(value) ? value : [];

    const updateItem = (i, key, val) => {
        const next = items.map((it, idx) => (idx === i ? { ...it, [key]: val } : it));
        onChange(next);
    };
    const removeAt = (i) => onChange(items.filter((_, idx) => idx !== i));
    const add = () => onChange([...items, { ...emptyItem }]);
    const move = (i, dir) => {
        const j = i + dir;
        if (j < 0 || j >= items.length) return;
        const next = [...items];
        [next[i], next[j]] = [next[j], next[i]];
        onChange(next);
    };

    return (
        <div>
            {label && <label className={labelCls}>{label}</label>}
            <div className="space-y-3">
                {items.map((item, i) => (
                    <div key={i} className="rounded-xl p-3.5" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }}>
                        <div className="flex items-start gap-2">
                            <div className="flex flex-col gap-1 pt-1.5 flex-shrink-0 text-white/20">
                                <button type="button" onClick={() => move(i, -1)} disabled={i === 0} className="disabled:opacity-20 hover:text-white/50">
                                    <GripVertical className="w-3.5 h-3.5" />
                                </button>
                            </div>
                            <div className="flex-1 grid gap-2.5" style={{ gridTemplateColumns: `repeat(${Math.min(fields.length, 2)}, minmax(0,1fr))` }}>
                                {fields.map((f) => (
                                    <div key={f.key}>
                                        <label className="text-[10px] text-white/30 uppercase tracking-widest mb-1 block">{f.label}</label>
                                        {f.type === 'select' ? (
                                            <select
                                                value={item[f.key] ?? ''}
                                                onChange={(e) => updateItem(i, f.key, e.target.value)}
                                                className={inputCls}
                                            >
                                                {f.options.map((o) => (
                                                    <option key={o} value={o} style={{ background: '#0a0a0a' }}>{o}</option>
                                                ))}
                                            </select>
                                        ) : (
                                            <input
                                                type="text"
                                                value={item[f.key] ?? ''}
                                                onChange={(e) => updateItem(i, f.key, e.target.value)}
                                                placeholder={f.placeholder}
                                                className={inputCls}
                                            />
                                        )}
                                    </div>
                                ))}
                            </div>
                            <button type="button" onClick={() => removeAt(i)} className="w-8 h-8 flex-shrink-0 rounded-lg flex items-center justify-center text-white/30 hover:text-red-400 hover:bg-red-500/8">
                                <X className="w-3.5 h-3.5" />
                            </button>
                        </div>
                    </div>
                ))}
            </div>
            <button
                type="button"
                onClick={add}
                className="mt-2 flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold"
                style={{ background: 'rgba(231,23,99,0.1)', border: '1px solid rgba(231,23,99,0.25)', color: '#e71763' }}
            >
                <Plus className="w-3 h-3" /> {addLabel}
            </button>
            {hint && <p className="text-[11px] text-white/25 mt-1.5">{hint}</p>}
        </div>
    );
}

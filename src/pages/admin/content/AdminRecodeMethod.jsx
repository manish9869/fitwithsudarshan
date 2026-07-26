// src/pages/admin/content/AdminRecodeMethod.jsx
//
// Dedicated editor for the RECODE Method steps shown on the homepage — same
// simplified, card-per-item approach as Coaching Types / Services. `color`
// was dropped: FeaturesSection.jsx never actually reads it, only `accent`
// (the step title's text color) — shown here as a color picker instead of
// a raw Tailwind class name.
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Loader2, ChevronDown, Save, X } from 'lucide-react';
import { listCmsRows, updateCmsRow } from './cmsApi';
import { TextInput, TextArea, SwatchPicker } from './SettingsFields';
import { useToast } from '../ToastProvider';

// The only accent classes actually present in the frontend build (Tailwind
// only generates CSS for classes it can see literally in source files) —
// picking outside this set would silently render as plain white text.
const ACCENT_OPTIONS = [
    { value: 'text-primary', name: 'Brand Pink', swatch: '#e71763' },
    { value: 'text-emerald-400', name: 'Emerald', swatch: '#34d399' },
    { value: 'text-blue-400', name: 'Blue', swatch: '#60a5fa' },
    { value: 'text-violet-400', name: 'Violet', swatch: '#a78bfa' },
    { value: 'text-orange-400', name: 'Orange', swatch: '#fb923c' },
    { value: 'text-rose-400', name: 'Rose', swatch: '#fb7185' },
];

function rowToForm(row) {
    return {
        step: row.step || '',
        title: row.title || '',
        description: row.description || '',
        accent: row.accent || 'text-primary',
        sort_order: row.sort_order ?? 0,
    };
}

function SectionLabel({ children }) {
    return (
        <p className="text-[10px] font-black uppercase tracking-[0.15em] mb-3 pt-1" style={{ color: 'rgba(231,23,99,0.65)' }}>
            {children}
        </p>
    );
}

function StepCard({ row, index, onSaved }) {
    const [open, setOpen] = useState(false);
    const [form, setForm] = useState(() => rowToForm(row));
    const [saving, setSaving] = useState(false);
    const toast = useToast();
    const accentSwatch = ACCENT_OPTIONS.find((o) => o.value === row.accent)?.swatch || '#e71763';

    const set = (key) => (val) => setForm((f) => ({ ...f, [key]: val }));

    const handleSave = async () => {
        setSaving(true);
        try {
            const saved = await updateCmsRow('recode_method', row.id, {
                ...form,
                sort_order: Number(form.sort_order) || 0,
            });
            toast.success('Saved — live on the site shortly.');
            onSaved(saved);
            setOpen(false);
        } catch (e) { toast.error(e.message); }
        finally { setSaving(false); }
    };

    const handleCancel = () => {
        setForm(rowToForm(row));
        setOpen(false);
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.05 }}
            className="rounded-2xl overflow-hidden transition-colors"
            style={{
                background: open ? 'rgba(231,23,99,0.03)' : 'rgba(255,255,255,0.02)',
                border: `1px solid ${open ? 'rgba(231,23,99,0.3)' : 'rgba(255,255,255,0.07)'}`,
            }}
        >
            <button type="button" onClick={() => setOpen((o) => !o)} className="w-full flex items-center gap-4 p-5 text-left">
                <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 text-xs font-black"
                    style={{ background: 'rgba(231,23,99,0.12)', border: '1px solid rgba(231,23,99,0.25)', color: accentSwatch }}>
                    {row.step || '—'}
                </div>
                <div className="flex-1 min-w-0">
                    <p className="font-black text-white text-[15px] mb-0.5">{row.title}</p>
                    <p className="text-xs text-white/40 truncate">{row.description || 'No description set — tap to add one'}</p>
                </div>
                <div className="flex items-center gap-3 flex-shrink-0">
                    <span className="hidden sm:inline text-[11px] font-bold text-white/25">{open ? 'Editing' : 'Tap to edit'}</span>
                    <ChevronDown className={`w-4 h-4 text-white/30 transition-transform ${open ? 'rotate-180' : ''}`} />
                </div>
            </button>

            {open && (
                <div className="px-5 pb-6 border-t" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
                    <SectionLabel>Basic Info</SectionLabel>
                    <div className="grid sm:grid-cols-2 gap-4 mb-4">
                        <TextInput label="Step Number" value={form.step} onChange={set('step')} placeholder="01" />
                        <TextInput label="Title" value={form.title} onChange={set('title')} placeholder="Assess" />
                    </div>
                    <div className="mb-6">
                        <TextArea label="Description" value={form.description} onChange={set('description')} rows={3} placeholder="What happens in this step" />
                    </div>

                    <SectionLabel>Appearance</SectionLabel>
                    <div className="mb-6">
                        <SwatchPicker label="Accent Color" value={form.accent} onChange={set('accent')} options={ACCENT_OPTIONS}
                            hint="Color used for this step's title on the homepage" />
                    </div>

                    <SectionLabel>Advanced (optional)</SectionLabel>
                    <div className="mb-6 max-w-[200px]">
                        <TextInput label="Order" value={String(form.sort_order)} onChange={set('sort_order')} hint="Lower numbers appear first" />
                    </div>

                    <div className="flex items-center gap-3 pt-1">
                        <button onClick={handleSave} disabled={saving}
                            className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl text-xs font-black text-white disabled:opacity-50"
                            style={{ background: '#e71763', boxShadow: '0 0 20px rgba(231,23,99,0.3)' }}>
                            {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                            Save Changes
                        </button>
                        <button onClick={handleCancel} disabled={saving}
                            className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-bold text-white/50 hover:text-white/80">
                            <X className="w-3.5 h-3.5" /> Cancel
                        </button>
                    </div>
                </div>
            )}
        </motion.div>
    );
}

export default function AdminRecodeMethod() {
    const [rows, setRows] = useState([]);
    const [loading, setLoading] = useState(true);
    const toast = useToast();

    const load = async () => {
        setLoading(true);
        try {
            const data = await listCmsRows('recode_method');
            setRows([...data].sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0)));
        } catch (e) { toast.error(e.message); }
        finally { setLoading(false); }
    };
    useEffect(() => { load(); }, []);

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-xl font-black text-white">RECODE Method Steps</h1>
                <p className="text-xs text-white/35 mt-1 max-w-lg leading-relaxed">
                    These are the numbered steps shown in the "How RECODE Works" section on the homepage. Tap a card below to edit it.
                </p>
            </div>

            {loading ? (
                <div className="py-24 flex justify-center"><Loader2 className="w-6 h-6 animate-spin text-white/25" /></div>
            ) : (
                <div className="space-y-3">
                    {rows.map((row, i) => (
                        <StepCard
                            key={row.id}
                            row={row}
                            index={i}
                            onSaved={(saved) => setRows((r) => r.map((x) => (x.id === saved.id ? saved : x)))}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}

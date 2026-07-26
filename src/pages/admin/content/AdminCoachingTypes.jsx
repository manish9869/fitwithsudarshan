// src/pages/admin/content/AdminCoachingTypes.jsx
//
// A dedicated, simple editor for the (small, fixed) set of coaching types —
// Online, Video, In-Person, etc. The generic table+modal CMS editor (used
// for testimonials, blog posts, ...) is built for lists that grow; this list
// never really does, and it drives core site behavior (pricing, routing), so
// editing it inline as plain cards — no search bar, no delete button, no
// raw comma-separated text — is both simpler and safer for a non-technical
// admin to work with.
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Loader2, Globe, Video, MapPin, Compass, ChevronDown, Save, X, Info } from 'lucide-react';
import { listCmsRows, updateCmsRow } from './cmsApi';
import { TextInput, TextArea, ToggleField, ChipInput } from './SettingsFields';
import { useToast } from '../ToastProvider';

const ICONS = { online: Globe, video: Video, personal: MapPin };

function rowToForm(row) {
    return {
        name: row.name || '',
        short_name: row.short_name || '',
        tagline: row.tagline || '',
        description: row.description || '',
        features: Array.isArray(row.features) ? row.features : [],
        note: row.note || '',
        cta: row.cta || '',
        sort_order: row.sort_order ?? 0,
        active: !!row.active,
    };
}

function SectionLabel({ children }) {
    return (
        <p className="text-[10px] font-black uppercase tracking-[0.15em] mb-3 pt-1" style={{ color: 'rgba(231,23,99,0.65)' }}>
            {children}
        </p>
    );
}

function CoachingTypeCard({ row, index, onSaved }) {
    const [open, setOpen] = useState(false);
    const [form, setForm] = useState(() => rowToForm(row));
    const [saving, setSaving] = useState(false);
    const toast = useToast();
    const Icon = ICONS[row.id] || Compass;

    const set = (key) => (val) => setForm((f) => ({ ...f, [key]: val }));

    const handleSave = async () => {
        setSaving(true);
        try {
            const saved = await updateCmsRow('coaching_types', row.id, {
                ...form,
                features: form.features.map((f) => f.trim()).filter(Boolean),
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
            <button
                type="button"
                onClick={() => setOpen((o) => !o)}
                className="w-full flex items-center gap-4 p-5 text-left"
            >
                <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
                    style={{ background: 'rgba(231,23,99,0.12)', border: '1px solid rgba(231,23,99,0.25)' }}>
                    <Icon className="w-5 h-5" style={{ color: '#e71763' }} />
                </div>
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-0.5">
                        <p className="font-black text-white text-[15px]">{row.name}</p>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                            style={row.active
                                ? { background: 'rgba(52,211,153,0.1)', color: '#34d399' }
                                : { background: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.35)' }}>
                            {row.active ? 'Live on site' : 'Hidden'}
                        </span>
                    </div>
                    <p className="text-xs text-white/40 truncate">{row.tagline || 'No tagline set — tap to add one'}</p>
                </div>
                <div className="flex items-center gap-3 flex-shrink-0">
                    <span className="hidden sm:inline text-[11px] font-bold text-white/25">{open ? 'Editing' : 'Tap to edit'}</span>
                    <ChevronDown className={`w-4 h-4 text-white/30 transition-transform ${open ? 'rotate-180' : ''}`} />
                </div>
            </button>

            {open && (
                <div className="px-5 pb-6 border-t" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
                    <SectionLabel>Basic Info</SectionLabel>
                    <div className="grid sm:grid-cols-2 gap-4 mb-5">
                        <TextInput label="Full Name" value={form.name} onChange={set('name')} placeholder="RECODE Online Coaching" />
                        <TextInput label="Tab Label" value={form.short_name} onChange={set('short_name')} placeholder="Online" hint="Shown on the pricing page tab button" />
                    </div>
                    <div className="mb-5">
                        <TextInput label="Tagline" value={form.tagline} onChange={set('tagline')} placeholder="One-line summary shown under the tab" />
                    </div>
                    <div className="mb-6">
                        <TextArea label="Description" value={form.description} onChange={set('description')} rows={3} placeholder="Longer description shown on the pricing page" />
                    </div>

                    <SectionLabel>What's Included</SectionLabel>
                    <div className="mb-6">
                        <ChipInput label="Features" value={form.features} onChange={set('features')}
                            placeholder="Type a feature and press Enter…"
                            hint="Each one appears as a checklist item under the description" />
                    </div>

                    <SectionLabel>Advanced (optional)</SectionLabel>
                    <div className="mb-4">
                        <TextArea label="Note" value={form.note} onChange={set('note')} rows={2} placeholder="Small note shown for this plan — leave blank to hide" />
                    </div>
                    <div className="grid sm:grid-cols-2 gap-4 mb-5">
                        <TextInput label="Button Text" value={form.cta} onChange={set('cta')} placeholder="Leave blank to use the default" />
                        <TextInput label="Tab Order" value={String(form.sort_order)} onChange={set('sort_order')} hint="Lower numbers appear first" />
                    </div>
                    <div className="flex items-start gap-2 mb-6 p-3 rounded-lg" style={{ background: 'rgba(255,255,255,0.02)' }}>
                        <Info className="w-3.5 h-3.5 text-white/25 flex-shrink-0 mt-0.5" />
                        <ToggleField label="Active" checked={form.active} onChange={set('active')} hint="Turn off to hide this coaching type from the site entirely" />
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

export default function AdminCoachingTypes() {
    const [rows, setRows] = useState([]);
    const [loading, setLoading] = useState(true);
    const toast = useToast();

    const load = async () => {
        setLoading(true);
        try {
            const data = await listCmsRows('coaching_types');
            setRows([...data].sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0)));
        } catch (e) { toast.error(e.message); }
        finally { setLoading(false); }
    };
    useEffect(() => { load(); }, []);

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-xl font-black text-white">Coaching Types</h1>
                <p className="text-xs text-white/35 mt-1 max-w-lg leading-relaxed">
                    These are the tabs customers see on the pricing page — Online, Video, In-Person. Tap a card below to edit it. Prices are set separately on the Pricing page.
                </p>
            </div>

            {loading ? (
                <div className="py-24 flex justify-center"><Loader2 className="w-6 h-6 animate-spin text-white/25" /></div>
            ) : (
                <div className="space-y-3">
                    {rows.map((row, i) => (
                        <CoachingTypeCard
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

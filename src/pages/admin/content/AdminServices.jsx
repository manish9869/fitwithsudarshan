// src/pages/admin/content/AdminServices.jsx
//
// Dedicated editor for the "Choose Your Path" service cards on the homepage
// — same simplified, card-per-item approach as Coaching Types, instead of
// the generic table+modal CMS editor. `color`/`accent` were dropped: the
// frontend (ProgramsSection.jsx) never actually reads them, so showing them
// as editable fields would just confuse a non-technical admin with a
// control that visibly does nothing.
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Loader2, Globe, Video, MapPin, Crown, ChevronDown, Save, X } from 'lucide-react';
import { listCmsRows, updateCmsRow } from './cmsApi';
import { TextInput, ChipInput, ToggleField } from './SettingsFields';
import { useToast } from '../ToastProvider';

const ICONS = { online: Globe, consult: Video, personal: MapPin, elite: Crown };

function rowToForm(row) {
    return {
        title: row.title || '',
        subtitle: row.subtitle || '',
        features: Array.isArray(row.features) ? row.features : [],
        badge: row.badge || '',
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

function ServiceCard({ row, index, onSaved }) {
    const [open, setOpen] = useState(false);
    const [form, setForm] = useState(() => rowToForm(row));
    const [saving, setSaving] = useState(false);
    const toast = useToast();
    const Icon = ICONS[row.id] || Globe;

    const set = (key) => (val) => setForm((f) => ({ ...f, [key]: val }));

    const handleSave = async () => {
        setSaving(true);
        try {
            const saved = await updateCmsRow('services', row.id, {
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
            <button type="button" onClick={() => setOpen((o) => !o)} className="w-full flex items-center gap-4 p-5 text-left">
                <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
                    style={{ background: 'rgba(231,23,99,0.12)', border: '1px solid rgba(231,23,99,0.25)' }}>
                    <Icon className="w-5 h-5" style={{ color: '#e71763' }} />
                </div>
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-0.5">
                        <p className="font-black text-white text-[15px]">{row.title}</p>
                        {row.badge && (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ background: 'rgba(231,23,99,0.15)', color: '#e71763' }}>
                                {row.badge}
                            </span>
                        )}
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                            style={row.active
                                ? { background: 'rgba(52,211,153,0.1)', color: '#34d399' }
                                : { background: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.35)' }}>
                            {row.active ? 'Live on site' : 'Hidden'}
                        </span>
                    </div>
                    <p className="text-xs text-white/40 truncate">{row.subtitle || 'No subtitle set — tap to add one'}</p>
                </div>
                <div className="flex items-center gap-3 flex-shrink-0">
                    <span className="hidden sm:inline text-[11px] font-bold text-white/25">{open ? 'Editing' : 'Tap to edit'}</span>
                    <ChevronDown className={`w-4 h-4 text-white/30 transition-transform ${open ? 'rotate-180' : ''}`} />
                </div>
            </button>

            {open && (
                <div className="px-5 pb-6 border-t" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
                    <SectionLabel>Basic Info</SectionLabel>
                    <div className="mb-4">
                        <TextInput label="Title" value={form.title} onChange={set('title')} placeholder="Online Coaching" />
                    </div>
                    <div className="mb-6">
                        <TextInput label="Subtitle" value={form.subtitle} onChange={set('subtitle')} placeholder="Short one-line description" />
                    </div>

                    <SectionLabel>What's Included</SectionLabel>
                    <div className="mb-6">
                        <ChipInput label="Features" value={form.features} onChange={set('features')}
                            placeholder="Type a feature and press Enter…"
                            hint="Each one appears as a checklist item on the card" />
                    </div>

                    <SectionLabel>Advanced (optional)</SectionLabel>
                    <div className="grid sm:grid-cols-2 gap-4 mb-5">
                        <TextInput label="Badge Text" value={form.badge} onChange={set('badge')} placeholder="e.g. Most Popular — leave blank to hide" />
                        <TextInput label="Card Order" value={String(form.sort_order)} onChange={set('sort_order')} hint="Lower numbers appear first" />
                    </div>
                    <div className="mb-6">
                        <ToggleField label="Active" checked={form.active} onChange={set('active')} hint="Turn off to hide this card from the site entirely" />
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

export default function AdminServices() {
    const [rows, setRows] = useState([]);
    const [loading, setLoading] = useState(true);
    const toast = useToast();

    const load = async () => {
        setLoading(true);
        try {
            const data = await listCmsRows('services');
            setRows([...data].sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0)));
        } catch (e) { toast.error(e.message); }
        finally { setLoading(false); }
    };
    useEffect(() => { load(); }, []);

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-xl font-black text-white">Services</h1>
                <p className="text-xs text-white/35 mt-1 max-w-lg leading-relaxed">
                    These are the "Choose Your Path" cards on the homepage. Tap a card below to edit it.
                </p>
            </div>

            {loading ? (
                <div className="py-24 flex justify-center"><Loader2 className="w-6 h-6 animate-spin text-white/25" /></div>
            ) : (
                <div className="space-y-3">
                    {rows.map((row, i) => (
                        <ServiceCard
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

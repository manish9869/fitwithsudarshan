// src/pages/admin/AdminLegalPages.jsx
import { useState, useEffect } from 'react';
import { Loader2, Save, Plus, Trash2, FileText, Lock, RefreshCw, GripVertical } from 'lucide-react';
import { listCmsRows } from './cmsApi';
import { useToast } from '../ToastProvider';
import { FieldGroup, TextInput, TextArea } from './SettingsFields';

const API_BASE = import.meta.env.VITE_API_URL ?? '';
import { getToken } from '../adminApi';
async function putLegalPage(slug, payload) {
    const token = getToken();
    const res = await fetch(`${API_BASE}/api/admin/content/legal-pages/${slug}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to save');
    return data.row;
}

const PAGES = [
    { slug: 'terms', label: 'Terms & Conditions', icon: FileText },
    { slug: 'privacy-policy', label: 'Privacy Policy', icon: Lock },
    { slug: 'refund-policy', label: 'Refund Policy', icon: RefreshCw },
];

const EMPTY_PAGE = { title: '', last_updated: '', intro: '', sections: [] };

export default function AdminLegalPages() {
    const [active, setActive] = useState('terms');
    const [page, setPage] = useState(EMPTY_PAGE);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const toast = useToast();

    const load = async () => {
        setLoading(true);
        try {
            const rows = await listCmsRows('legal_pages');
            const found = rows.find((r) => r.slug === active);
            setPage(found || EMPTY_PAGE);
        } catch (e) { toast.error(e.message); }
        finally { setLoading(false); }
    };
    useEffect(() => { load(); }, [active]);

    const updateSection = (i, key, val) => setPage((p) => ({
        ...p, sections: p.sections.map((s, idx) => idx === i ? { ...s, [key]: val } : s),
    }));
    const addSection = () => setPage((p) => ({ ...p, sections: [...p.sections, { title: '', content: '' }] }));
    const removeSection = (i) => setPage((p) => ({ ...p, sections: p.sections.filter((_, idx) => idx !== i) }));
    const moveSection = (i, dir) => setPage((p) => {
        const j = i + dir;
        if (j < 0 || j >= p.sections.length) return p;
        const next = [...p.sections];
        [next[i], next[j]] = [next[j], next[i]];
        return { ...p, sections: next };
    });

    const handleSave = async () => {
        setSaving(true);
        try {
            const saved = await putLegalPage(active, page);
            setPage(saved);
            toast.success('Saved — live on the site now.');
        } catch (e) { toast.error(e.message); }
        finally { setSaving(false); }
    };

    const activeMeta = PAGES.find((p) => p.slug === active);

    return (
        <div>
            <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
                <div>
                    <h1 className="text-xl font-black text-white">Legal Pages</h1>
                    <p className="text-xs text-white/35 mt-1">Terms, Privacy Policy, and Refund Policy — shown as full pages linked from the footer.</p>
                </div>
                <button onClick={handleSave} disabled={saving}
                    className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-black text-white disabled:opacity-50"
                    style={{ background: '#e71763' }}>
                    {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                    Save
                </button>
            </div>

            <div className="flex gap-2 mb-6 flex-wrap">
                {PAGES.map((p) => (
                    <button key={p.slug} onClick={() => setActive(p.slug)}
                        className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all"
                        style={active === p.slug
                            ? { background: '#e71763', color: 'white', boxShadow: '0 0 20px rgba(231,23,99,0.35)' }
                            : { background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.5)' }}>
                        <p.icon className="w-3.5 h-3.5" /> {p.label}
                    </button>
                ))}
            </div>

            {loading ? (
                <div className="py-24 flex justify-center"><Loader2 className="w-6 h-6 animate-spin text-white/25" /></div>
            ) : (
                <div className="space-y-4">
                    <FieldGroup title="Page Header" description="Shown at the top of the page, above the sections below.">
                        <div className="grid sm:grid-cols-2 gap-4">
                            <TextInput label="Page Title" value={page.title} onChange={(v) => setPage((p) => ({ ...p, title: v }))} placeholder={activeMeta?.label} />
                            <TextInput label="Last Updated" value={page.last_updated} onChange={(v) => setPage((p) => ({ ...p, last_updated: v }))} placeholder="January 2025" />
                        </div>
                        <TextArea label="Introduction" value={page.intro} onChange={(v) => setPage((p) => ({ ...p, intro: v }))} rows={3} placeholder="A short opening paragraph before the numbered sections." />
                    </FieldGroup>

                    <div className="flex items-center justify-between px-1">
                        <p className="text-xs font-black uppercase tracking-widest text-white/40">
                            Sections ({page.sections.length})
                        </p>
                        <button onClick={addSection}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold"
                            style={{ background: 'rgba(231,23,99,0.1)', border: '1px solid rgba(231,23,99,0.25)', color: '#e71763' }}>
                            <Plus className="w-3 h-3" /> Add Section
                        </button>
                    </div>

                    {page.sections.length === 0 && (
                        <div className="rounded-2xl p-8 text-center" style={{ background: 'rgba(255,255,255,0.02)', border: '1px dashed rgba(255,255,255,0.1)' }}>
                            <p className="text-sm text-white/25">No sections yet — click "Add Section" to write the first one.</p>
                        </div>
                    )}

                    {page.sections.map((sec, i) => (
                        <div key={i} className="rounded-2xl p-4 space-y-3" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.07)' }}>
                            <div className="flex items-center gap-2">
                                <div className="flex flex-col text-white/20 flex-shrink-0">
                                    <button type="button" onClick={() => moveSection(i, -1)} disabled={i === 0} className="disabled:opacity-20 hover:text-white/50">
                                        <GripVertical className="w-3.5 h-3.5" />
                                    </button>
                                </div>
                                <span className="text-xs font-black text-white/25 flex-shrink-0 w-6">{i + 1}.</span>
                                <input value={sec.title} onChange={(e) => updateSection(i, 'title', e.target.value)} placeholder="Section title"
                                    className="flex-1 rounded-lg px-3 py-2 text-sm font-semibold text-white bg-white/5 border border-white/10" />
                                <button onClick={() => removeSection(i)} className="w-8 h-8 flex-shrink-0 rounded-lg flex items-center justify-center text-white/40 hover:text-red-400 hover:bg-red-500/8">
                                    <Trash2 className="w-3.5 h-3.5" />
                                </button>
                            </div>
                            <textarea rows={4} value={sec.content} onChange={(e) => updateSection(i, 'content', e.target.value)}
                                placeholder="Section content — leave a blank line between paragraphs."
                                className="w-full rounded-lg px-3 py-2.5 text-sm text-white bg-white/5 border border-white/10 resize-none" />
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

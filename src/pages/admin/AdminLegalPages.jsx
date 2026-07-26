// src/pages/admin/AdminLegalPages.jsx
import { useState, useEffect } from 'react';
import { Loader2, Save, Plus, Trash2 } from 'lucide-react';
import { listCmsRows } from './cmsApi';
import { useToast } from './ToastProvider';

const API_BASE = import.meta.env.VITE_API_URL ?? '';
import { getToken } from './adminApi';
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
    { slug: 'terms', label: 'Terms & Conditions' },
    { slug: 'privacy-policy', label: 'Privacy Policy' },
    { slug: 'refund-policy', label: 'Refund Policy' },
];

export default function AdminLegalPages() {
    const [active, setActive] = useState('terms');
    const [page, setPage] = useState({ title: '', last_updated: '', intro: '', sections: [] });
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const toast = useToast();

    const load = async () => {
        setLoading(true);
        try {
            const rows = await listCmsRows('legal_pages');
            const found = rows.find((r) => r.slug === active);
            setPage(found || { title: '', last_updated: '', intro: '', sections: [] });
        } catch (e) { toast.error(e.message); }
        finally { setLoading(false); }
    };
    useEffect(() => { load(); }, [active]);

    const updateSection = (i, key, val) => setPage((p) => ({
        ...p, sections: p.sections.map((s, idx) => idx === i ? { ...s, [key]: val } : s),
    }));
    const addSection = () => setPage((p) => ({ ...p, sections: [...p.sections, { title: '', content: '' }] }));
    const removeSection = (i) => setPage((p) => ({ ...p, sections: p.sections.filter((_, idx) => idx !== i) }));

    const handleSave = async () => {
        setSaving(true);
        try {
            const saved = await putLegalPage(active, page);
            setPage(saved);
            toast.success('Saved');
        } catch (e) { toast.error(e.message); }
        finally { setSaving(false); }
    };

    return (
        <div>
            <div className="flex items-center justify-between mb-6">
                <h1 className="text-xl font-black text-white">Legal Pages</h1>
                <button onClick={handleSave} disabled={saving} className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-black text-white disabled:opacity-50" style={{ background: '#e71763' }}>
                    <Save className="w-3.5 h-3.5" /> Save
                </button>
            </div>

            <div className="flex gap-2 mb-6">
                {PAGES.map((p) => (
                    <button key={p.slug} onClick={() => setActive(p.slug)}
                        className="px-4 py-2 rounded-xl text-xs font-bold"
                        style={active === p.slug ? { background: '#e71763', color: 'white' } : { background: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.5)' }}>
                        {p.label}
                    </button>
                ))}
            </div>

            {loading ? <div className="py-24 flex justify-center"><Loader2 className="w-6 h-6 animate-spin text-white/25" /></div> : (
                <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="text-[10px] text-white/35 uppercase tracking-widest mb-1.5 block">Title</label>
                            <input value={page.title} onChange={(e) => setPage((p) => ({ ...p, title: e.target.value }))}
                                className="w-full rounded-lg px-3 py-2.5 text-sm text-white bg-white/5 border border-white/10" />
                        </div>
                        <div>
                            <label className="text-[10px] text-white/35 uppercase tracking-widest mb-1.5 block">Last Updated</label>
                            <input value={page.last_updated || ''} onChange={(e) => setPage((p) => ({ ...p, last_updated: e.target.value }))}
                                className="w-full rounded-lg px-3 py-2.5 text-sm text-white bg-white/5 border border-white/10" />
                        </div>
                    </div>
                    <div>
                        <label className="text-[10px] text-white/35 uppercase tracking-widest mb-1.5 block">Intro</label>
                        <textarea rows={3} value={page.intro || ''} onChange={(e) => setPage((p) => ({ ...p, intro: e.target.value }))}
                            className="w-full rounded-lg px-3 py-2.5 text-sm text-white bg-white/5 border border-white/10 resize-none" />
                    </div>

                    <div className="flex items-center justify-between mt-6 mb-2">
                        <p className="text-xs font-bold text-white/50 uppercase tracking-widest">Sections</p>
                        <button onClick={addSection} className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold text-white" style={{ background: 'rgba(231,23,99,0.15)', color: '#e71763' }}>
                            <Plus className="w-3 h-3" /> Add Section
                        </button>
                    </div>

                    {page.sections.map((sec, i) => (
                        <div key={i} className="rounded-xl p-4 space-y-2" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.07)' }}>
                            <div className="flex items-center gap-2">
                                <input value={sec.title} onChange={(e) => updateSection(i, 'title', e.target.value)} placeholder="Section title"
                                    className="flex-1 rounded-lg px-3 py-2 text-sm text-white bg-white/5 border border-white/10" />
                                <button onClick={() => removeSection(i)} className="w-8 h-8 rounded-lg flex items-center justify-center text-white/40 hover:text-red-400">
                                    <Trash2 className="w-3.5 h-3.5" />
                                </button>
                            </div>
                            <textarea rows={4} value={sec.content} onChange={(e) => updateSection(i, 'content', e.target.value)} placeholder="Section content (use blank lines for paragraphs)"
                                className="w-full rounded-lg px-3 py-2 text-sm text-white bg-white/5 border border-white/10 resize-none" />
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
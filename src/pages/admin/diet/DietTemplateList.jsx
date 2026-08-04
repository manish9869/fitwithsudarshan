// src/pages/admin/diet/DietTemplateList.jsx
// List page for diet_templates — mirrors DietPlanList.jsx's table/search/
// pagination conventions. Editing happens on a dedicated visual page
// (DietTemplateEditor.jsx), not the generic JSON-textarea CMS form, since
// the admin using this isn't from a technical background.
import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Search, Loader2, Edit2, Trash2, CalendarRange } from 'lucide-react';
import { listCmsRows, deleteCmsRow } from '../content/cmsApi';
import { useToast } from '../ToastProvider';
import PaginationBar from '../PaginationBar';

export default function DietTemplateList() {
    const navigate = useNavigate();
    const toast = useToast();
    const [rows, setRows] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(25);
    const [deleteTarget, setDeleteTarget] = useState(null);

    const load = async () => {
        setLoading(true);
        try { setRows(await listCmsRows('diet_templates')); }
        catch (e) { toast.error(e.message); }
        finally { setLoading(false); }
    };
    useEffect(() => { load(); }, []);
    useEffect(() => { setPage(1); }, [search]);

    const filtered = useMemo(() => {
        if (!search.trim()) return rows;
        const q = search.trim().toLowerCase();
        return rows.filter((r) => [r.name, r.description, r.goal, r.diet_preference, r.region]
            .some((v) => String(v || '').toLowerCase().includes(q)));
    }, [rows, search]);

    const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
    const pageSafe = Math.min(page, totalPages);
    const paged = useMemo(() => {
        const start = (pageSafe - 1) * pageSize;
        return filtered.slice(start, start + pageSize);
    }, [filtered, pageSafe, pageSize]);

    const handleDelete = async () => {
        try {
            await deleteCmsRow('diet_templates', deleteTarget.id);
            setRows((r) => r.filter((row) => row.id !== deleteTarget.id));
            toast.success('Deleted');
        } catch (e) { toast.error(e.message); }
        finally { setDeleteTarget(null); }
    };

    return (
        <div>
            <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
                <div>
                    <h1 className="text-xl font-black text-white">Diet Plan Templates</h1>
                    <p className="text-xs text-white/35 mt-0.5">{rows.length} {rows.length === 1 ? 'template' : 'templates'} — quick-start starting points for Diet Plans</p>
                </div>
                <button onClick={() => navigate('/admin/diet-templates/new')}
                    className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-black text-white"
                    style={{ background: '#e71763' }}>
                    <Plus className="w-3.5 h-3.5" /> New Template
                </button>
            </div>

            <div className="relative mb-4 max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/30" />
                <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search templates…"
                    className="w-full rounded-xl pl-9 pr-4 py-2.5 text-sm text-white placeholder:text-white/25 outline-none"
                    style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }} />
            </div>

            {loading ? (
                <div className="py-24 flex justify-center"><Loader2 className="w-6 h-6 animate-spin text-white/25" /></div>
            ) : (
                <div className="rounded-2xl overflow-hidden" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.07)' }}>
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                                    <th className="w-10 px-4 py-3"></th>
                                    <th className="px-4 py-3 text-left text-[10px] font-black uppercase tracking-widest text-white/35">Template</th>
                                    <th className="px-4 py-3 text-left text-[10px] font-black uppercase tracking-widest text-white/35 hidden sm:table-cell">Goal / Diet / Cuisine</th>
                                    <th className="px-4 py-3 text-left text-[10px] font-black uppercase tracking-widest text-white/35 hidden md:table-cell">Days</th>
                                    <th className="px-4 py-3 text-left text-[10px] font-black uppercase tracking-widest text-white/35">Status</th>
                                    <th className="px-4 py-3 text-right text-[10px] font-black uppercase tracking-widest text-white/35">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {paged.map((row) => (
                                    <tr key={row.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                                        <td className="px-4 py-3">
                                            <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'rgba(231,23,99,0.1)' }}>
                                                <CalendarRange className="w-3.5 h-3.5" style={{ color: '#e71763' }} />
                                            </div>
                                        </td>
                                        <td className="px-4 py-3">
                                            <p className="text-sm font-bold text-white">{row.name}</p>
                                            <p className="text-xs text-white/35 truncate max-w-xs">{row.description}</p>
                                        </td>
                                        <td className="px-4 py-3 hidden sm:table-cell">
                                            <span className="text-xs text-white/50">{row.goal} · {row.diet_preference} · {row.region}</span>
                                        </td>
                                        <td className="px-4 py-3 hidden md:table-cell">
                                            <span className="text-xs text-white/50">{(row.days || []).length} day{(row.days || []).length === 1 ? '' : 's'}</span>
                                        </td>
                                        <td className="px-4 py-3">
                                            <span className="text-[10px] font-bold px-2 py-1 rounded-full"
                                                style={row.active
                                                    ? { background: 'rgba(52,211,153,0.1)', color: '#34d399' }
                                                    : { background: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.35)' }}>
                                                {row.active ? 'Active' : 'Hidden'}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="flex items-center gap-1 justify-end">
                                                <button onClick={() => navigate(`/admin/diet-templates/${row.id}`)} title="Edit" className="w-8 h-8 rounded-lg flex items-center justify-center text-white/40 hover:text-white hover:bg-white/8"><Edit2 className="w-3.5 h-3.5" /></button>
                                                <button onClick={() => setDeleteTarget(row)} title="Delete" className="w-8 h-8 rounded-lg flex items-center justify-center text-white/40 hover:text-red-400 hover:bg-red-500/8"><Trash2 className="w-3.5 h-3.5" /></button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                    {filtered.length === 0 && (
                        <p className="text-center py-12 text-sm text-white/25">{rows.length === 0 ? 'No templates yet — create your first one.' : 'No templates match your search.'}</p>
                    )}
                    {filtered.length > 0 && (
                        <PaginationBar page={pageSafe} totalPages={totalPages} totalItems={filtered.length} pageSize={pageSize}
                            onPageChange={setPage} onPageSizeChange={(n) => { setPageSize(n); setPage(1); }} />
                    )}
                </div>
            )}

            {deleteTarget && (
                <div className="fixed inset-0 z-[70] flex items-center justify-center p-4" onClick={() => setDeleteTarget(null)}>
                    <div className="absolute inset-0 bg-black/65 backdrop-blur-sm" />
                    <div className="relative w-full max-w-sm rounded-2xl p-6 text-center" style={{ background: '#0e0e16', border: '1px solid rgba(239,68,68,0.25)' }} onClick={(e) => e.stopPropagation()}>
                        <p className="font-bold text-white text-sm mb-4">Delete "{deleteTarget.name}" permanently?</p>
                        <p className="text-xs text-white/35 mb-4">Plans already built from this template are not affected.</p>
                        <div className="flex gap-3">
                            <button onClick={() => setDeleteTarget(null)} className="flex-1 py-2.5 rounded-xl text-sm text-white/50" style={{ border: '1px solid rgba(255,255,255,0.08)' }}>Cancel</button>
                            <button onClick={handleDelete} className="flex-1 py-2.5 rounded-xl text-sm font-bold text-white" style={{ background: '#ef4444' }}>Delete</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

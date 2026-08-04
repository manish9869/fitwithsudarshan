// src/pages/admin/diet/DietFoodList.jsx
// Dedicated, richer list view for diet_foods — the generic AdminCMSList
// table only shows Name + Category + Active, which isn't enough to browse
// a 1200-row food library. Adds Category/Cuisine/Diet-Type/Budget/Status
// filters and more columns (region, macros, diet-type, budget) so a coach
// can actually find/compare foods, while still reusing AdminCMSList's own
// add/edit form (RowModal + cmsConfigs) instead of building a second one.
import { useState, useEffect, useMemo } from 'react';
import { Plus, Search, Loader2, Edit2, Trash2, Apple } from 'lucide-react';
import { CMS_CONFIGS } from '../content/cmsConfigs';
import { RowModal } from '../content/AdminCMSList';
import { listCmsRows, deleteCmsRow } from '../content/cmsApi';
import { useToast } from '../ToastProvider';
import PaginationBar from '../PaginationBar';
import { FOOD_CATEGORIES } from './dietCategories';
import { FOOD_REGIONS } from './dietRegions';

const config = { ...CMS_CONFIGS.diet_foods, table: 'diet_foods' };
const DIET_TYPES = ['Vegetarian', 'Eggetarian', 'Non-Vegetarian'];

function dietType(f) {
    if (f.is_veg) return 'Vegetarian';
    if (f.is_eggetarian) return 'Eggetarian';
    return 'Non-Vegetarian';
}
const DIET_TYPE_COLOR = {
    Vegetarian: { background: 'rgba(52,211,153,0.1)', color: '#34d399' },
    Eggetarian: { background: 'rgba(251,191,36,0.1)', color: '#fbbf24' },
    'Non-Vegetarian': { background: 'rgba(248,113,113,0.1)', color: '#f87171' },
};

const selectCls = 'rounded-lg px-3 py-2 text-xs font-semibold text-white bg-white/5 border border-white/10 outline-none';

export default function DietFoodList() {
    const toast = useToast();
    const [rows, setRows] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [categoryFilter, setCategoryFilter] = useState('All');
    const [regionFilter, setRegionFilter] = useState('Any');
    const [dietTypeFilter, setDietTypeFilter] = useState('All');
    const [budgetFilter, setBudgetFilter] = useState(false);
    const [statusFilter, setStatusFilter] = useState('All');
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(50);
    const [editing, setEditing] = useState(null);
    const [creating, setCreating] = useState(false);
    const [deleteTarget, setDeleteTarget] = useState(null);

    const load = async () => {
        setLoading(true);
        try { setRows(await listCmsRows('diet_foods')); }
        catch (e) { toast.error(e.message); }
        finally { setLoading(false); }
    };
    useEffect(() => { load(); }, []);
    useEffect(() => { setPage(1); }, [search, categoryFilter, regionFilter, dietTypeFilter, budgetFilter, statusFilter]);

    const filtered = useMemo(() => {
        let list = rows;
        if (categoryFilter !== 'All') list = list.filter((r) => r.category === categoryFilter);
        if (regionFilter !== 'Any') list = list.filter((r) => r.region === regionFilter);
        if (dietTypeFilter !== 'All') list = list.filter((r) => dietType(r) === dietTypeFilter);
        if (budgetFilter) list = list.filter((r) => r.is_budget_friendly);
        if (statusFilter !== 'All') list = list.filter((r) => (statusFilter === 'Active' ? r.active : !r.active));
        if (search.trim()) {
            const q = search.trim().toLowerCase();
            list = list.filter((r) => [r.name, r.category, r.region].some((v) => String(v || '').toLowerCase().includes(q)));
        }
        return list;
    }, [rows, search, categoryFilter, regionFilter, dietTypeFilter, budgetFilter, statusFilter]);

    const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
    const pageSafe = Math.min(page, totalPages);
    const paged = useMemo(() => filtered.slice((pageSafe - 1) * pageSize, (pageSafe - 1) * pageSize + pageSize), [filtered, pageSafe, pageSize]);

    const handleDelete = async () => {
        try {
            await deleteCmsRow('diet_foods', deleteTarget.id);
            setRows((r) => r.filter((row) => row.id !== deleteTarget.id));
            toast.success('Deleted');
        } catch (e) { toast.error(e.message); }
        finally { setDeleteTarget(null); }
    };

    return (
        <div>
            <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
                <div>
                    <h1 className="text-xl font-black text-white">Diet Plan Foods</h1>
                    <p className="text-xs text-white/35 mt-0.5">{rows.length} foods{filtered.length !== rows.length ? ` — ${filtered.length} match filters` : ''}</p>
                </div>
                <button onClick={() => setCreating(true)}
                    className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-black text-white"
                    style={{ background: '#e71763' }}>
                    <Plus className="w-3.5 h-3.5" /> New Food
                </button>
            </div>

            <div className="space-y-2.5 mb-4">
                <div className="relative max-w-sm">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/30" />
                    <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search foods…"
                        className="w-full rounded-xl pl-9 pr-4 py-2.5 text-sm text-white placeholder:text-white/25 outline-none"
                        style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }} />
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                    <select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)} className={selectCls} style={{ background: '#0e0e16' }}>
                        <option value="All">All Categories</option>
                        {FOOD_CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                    </select>
                    <select value={regionFilter} onChange={(e) => setRegionFilter(e.target.value)} className={selectCls} style={{ background: '#0e0e16' }}>
                        <option value="Any">All Cuisines</option>
                        {FOOD_REGIONS.map((r) => <option key={r} value={r}>{r}</option>)}
                    </select>
                    <select value={dietTypeFilter} onChange={(e) => setDietTypeFilter(e.target.value)} className={selectCls} style={{ background: '#0e0e16' }}>
                        <option value="All">All Diet Types</option>
                        {DIET_TYPES.map((d) => <option key={d} value={d}>{d}</option>)}
                    </select>
                    <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className={selectCls} style={{ background: '#0e0e16' }}>
                        <option value="All">All Status</option>
                        <option value="Active">Active</option>
                        <option value="Hidden">Hidden</option>
                    </select>
                    <button type="button" onClick={() => setBudgetFilter((v) => !v)}
                        className="flex items-center gap-2 pl-1 pr-3 py-1 rounded-full text-xs font-bold transition-colors"
                        style={budgetFilter
                            ? { background: 'rgba(52,211,153,0.12)', border: '1px solid rgba(52,211,153,0.35)', color: '#34d399' }
                            : { background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.45)' }}>
                        <span className="relative inline-flex items-center w-7 h-4 rounded-full transition-colors flex-shrink-0"
                            style={{ background: budgetFilter ? '#34d399' : 'rgba(255,255,255,0.15)' }}>
                            <span className="absolute w-3 h-3 rounded-full bg-white transition-transform"
                                style={{ transform: budgetFilter ? 'translateX(14px)' : 'translateX(2px)' }} />
                        </span>
                        ₹ Budget-Friendly Only
                    </button>
                </div>
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
                                    <th className="px-4 py-3 text-left text-[10px] font-black uppercase tracking-widest text-white/35">Food</th>
                                    <th className="px-4 py-3 text-left text-[10px] font-black uppercase tracking-widest text-white/35">Category</th>
                                    <th className="px-4 py-3 text-left text-[10px] font-black uppercase tracking-widest text-white/35 hidden md:table-cell">Cuisine</th>
                                    <th className="px-4 py-3 text-left text-[10px] font-black uppercase tracking-widest text-white/35 hidden lg:table-cell">Macros (per serving)</th>
                                    <th className="px-4 py-3 text-left text-[10px] font-black uppercase tracking-widest text-white/35">Diet</th>
                                    <th className="px-4 py-3 text-left text-[10px] font-black uppercase tracking-widest text-white/35">Status</th>
                                    <th className="px-4 py-3 text-right text-[10px] font-black uppercase tracking-widest text-white/35">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {paged.map((row) => (
                                    <tr key={row.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                                        <td className="px-4 py-3">
                                            <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'rgba(231,23,99,0.1)' }}>
                                                <Apple className="w-3.5 h-3.5" style={{ color: '#e71763' }} />
                                            </div>
                                        </td>
                                        <td className="px-4 py-3">
                                            <p className="text-sm font-bold text-white">{row.name}</p>
                                            {row.is_budget_friendly && <p className="text-[11px]" style={{ color: '#34d399' }}>₹ Budget-Friendly</p>}
                                        </td>
                                        <td className="px-4 py-3"><span className="text-xs text-white/50">{row.category}</span></td>
                                        <td className="px-4 py-3 hidden md:table-cell">
                                            <span className="text-xs text-white/50">{row.region || 'Generic / Pan-Indian'}</span>
                                        </td>
                                        <td className="px-4 py-3 hidden lg:table-cell">
                                            <span className="text-xs text-white/50">{row.calories} kcal · P{row.protein} C{row.carbs} F{row.fats}</span>
                                        </td>
                                        <td className="px-4 py-3">
                                            <span className="text-[10px] font-bold px-2 py-1 rounded-full whitespace-nowrap" style={DIET_TYPE_COLOR[dietType(row)]}>
                                                {dietType(row)}
                                            </span>
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
                                                <button onClick={() => setEditing(row)} title="Edit" className="w-8 h-8 rounded-lg flex items-center justify-center text-white/40 hover:text-white hover:bg-white/8"><Edit2 className="w-3.5 h-3.5" /></button>
                                                <button onClick={() => setDeleteTarget(row)} title="Delete" className="w-8 h-8 rounded-lg flex items-center justify-center text-white/40 hover:text-red-400 hover:bg-red-500/8"><Trash2 className="w-3.5 h-3.5" /></button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                    {filtered.length === 0 && (
                        <p className="text-center py-12 text-sm text-white/25">{rows.length === 0 ? 'No foods yet — add your first one.' : 'No foods match your search/filters.'}</p>
                    )}
                    {filtered.length > 0 && (
                        <PaginationBar page={pageSafe} totalPages={totalPages} totalItems={filtered.length} pageSize={pageSize}
                            onPageChange={setPage} onPageSizeChange={(n) => { setPageSize(n); setPage(1); }} />
                    )}
                </div>
            )}

            {(creating || editing) && (
                <RowModal
                    config={config}
                    editing={editing}
                    rows={rows}
                    onClose={() => { setCreating(false); setEditing(null); }}
                    onSaved={(saved) => {
                        setRows((r) => {
                            const exists = r.some((row) => row.id === saved.id);
                            return exists ? r.map((row) => (row.id === saved.id ? saved : row)) : [...r, saved];
                        });
                        setCreating(false); setEditing(null);
                    }}
                />
            )}

            {deleteTarget && (
                <div className="fixed inset-0 z-[70] flex items-center justify-center p-4" onClick={() => setDeleteTarget(null)}>
                    <div className="absolute inset-0 bg-black/65 backdrop-blur-sm" />
                    <div className="relative w-full max-w-sm rounded-2xl p-6 text-center" style={{ background: '#0e0e16', border: '1px solid rgba(239,68,68,0.25)' }} onClick={(e) => e.stopPropagation()}>
                        <p className="font-bold text-white text-sm mb-4">Delete "{deleteTarget.name}" permanently?</p>
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

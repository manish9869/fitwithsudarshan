// src/pages/admin/diet/DietExerciseList.jsx
// Dedicated, richer list view for diet_exercises — same rationale as
// DietFoodList.jsx: more filters (muscle group/difficulty/location/status)
// and more columns than the generic AdminCMSList table shows, while still
// reusing its add/edit form (RowModal + cmsConfigs).
import { useState, useEffect, useMemo } from 'react';
import { Plus, Search, Loader2, Edit2, Trash2, Dumbbell } from 'lucide-react';
import { CMS_CONFIGS } from '../content/cmsConfigs';
import { RowModal } from '../content/AdminCMSList';
import { listCmsRows, deleteCmsRow } from '../content/cmsApi';
import { useToast } from '../ToastProvider';
import PaginationBar from '../PaginationBar';
import { MUSCLE_GROUPS, DIFFICULTY_LEVELS, EXERCISE_LOCATIONS } from './dietExerciseOptions';

const config = { ...CMS_CONFIGS.diet_exercises, table: 'diet_exercises' };

const selectCls = 'rounded-lg px-3 py-2 text-xs font-semibold text-white bg-white/5 border border-white/10 outline-none';

export default function DietExerciseList() {
    const toast = useToast();
    const [rows, setRows] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [muscleFilter, setMuscleFilter] = useState('All');
    const [difficultyFilter, setDifficultyFilter] = useState('All');
    const [locationFilter, setLocationFilter] = useState('All');
    const [statusFilter, setStatusFilter] = useState('All');
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(50);
    const [editing, setEditing] = useState(null);
    const [creating, setCreating] = useState(false);
    const [deleteTarget, setDeleteTarget] = useState(null);

    const load = async () => {
        setLoading(true);
        try { setRows(await listCmsRows('diet_exercises')); }
        catch (e) { toast.error(e.message); }
        finally { setLoading(false); }
    };
    useEffect(() => { load(); }, []);
    useEffect(() => { setPage(1); }, [search, muscleFilter, difficultyFilter, locationFilter, statusFilter]);

    const filtered = useMemo(() => {
        let list = rows;
        if (muscleFilter !== 'All') list = list.filter((r) => r.muscle_group === muscleFilter);
        if (difficultyFilter !== 'All') list = list.filter((r) => r.difficulty === difficultyFilter);
        if (locationFilter !== 'All') list = list.filter((r) => r.location === locationFilter);
        if (statusFilter !== 'All') list = list.filter((r) => (statusFilter === 'Active' ? r.active : !r.active));
        if (search.trim()) {
            const q = search.trim().toLowerCase();
            list = list.filter((r) => [r.name, r.muscle_group].some((v) => String(v || '').toLowerCase().includes(q)));
        }
        return list;
    }, [rows, search, muscleFilter, difficultyFilter, locationFilter, statusFilter]);

    const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
    const pageSafe = Math.min(page, totalPages);
    const paged = useMemo(() => filtered.slice((pageSafe - 1) * pageSize, (pageSafe - 1) * pageSize + pageSize), [filtered, pageSafe, pageSize]);

    const handleDelete = async () => {
        try {
            await deleteCmsRow('diet_exercises', deleteTarget.id);
            setRows((r) => r.filter((row) => row.id !== deleteTarget.id));
            toast.success('Deleted');
        } catch (e) { toast.error(e.message); }
        finally { setDeleteTarget(null); }
    };

    return (
        <div>
            <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
                <div>
                    <h1 className="text-xl font-black text-white">Diet Plan Exercises</h1>
                    <p className="text-xs text-white/35 mt-0.5">{rows.length} exercises{filtered.length !== rows.length ? ` — ${filtered.length} match filters` : ''}</p>
                </div>
                <button onClick={() => setCreating(true)}
                    className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-black text-white"
                    style={{ background: '#e71763' }}>
                    <Plus className="w-3.5 h-3.5" /> New Exercise
                </button>
            </div>

            <div className="space-y-2.5 mb-4">
                <div className="relative max-w-sm">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/30" />
                    <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search exercises…"
                        className="w-full rounded-xl pl-9 pr-4 py-2.5 text-sm text-white placeholder:text-white/25 outline-none"
                        style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }} />
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                    <select value={muscleFilter} onChange={(e) => setMuscleFilter(e.target.value)} className={selectCls} style={{ background: '#0e0e16' }}>
                        <option value="All">All Muscle Groups</option>
                        {MUSCLE_GROUPS.map((m) => <option key={m} value={m}>{m}</option>)}
                    </select>
                    <select value={difficultyFilter} onChange={(e) => setDifficultyFilter(e.target.value)} className={selectCls} style={{ background: '#0e0e16' }}>
                        <option value="All">All Difficulty</option>
                        {DIFFICULTY_LEVELS.map((d) => <option key={d} value={d}>{d}</option>)}
                    </select>
                    <select value={locationFilter} onChange={(e) => setLocationFilter(e.target.value)} className={selectCls} style={{ background: '#0e0e16' }}>
                        <option value="All">All Locations</option>
                        {EXERCISE_LOCATIONS.map((l) => <option key={l} value={l}>{l}</option>)}
                    </select>
                    <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className={selectCls} style={{ background: '#0e0e16' }}>
                        <option value="All">All Status</option>
                        <option value="Active">Active</option>
                        <option value="Hidden">Hidden</option>
                    </select>
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
                                    <th className="px-4 py-3 text-left text-[10px] font-black uppercase tracking-widest text-white/35">Exercise</th>
                                    <th className="px-4 py-3 text-left text-[10px] font-black uppercase tracking-widest text-white/35">Muscle Group</th>
                                    <th className="px-4 py-3 text-left text-[10px] font-black uppercase tracking-widest text-white/35 hidden md:table-cell">Volume</th>
                                    <th className="px-4 py-3 text-left text-[10px] font-black uppercase tracking-widest text-white/35 hidden lg:table-cell">Difficulty</th>
                                    <th className="px-4 py-3 text-left text-[10px] font-black uppercase tracking-widest text-white/35 hidden lg:table-cell">Location</th>
                                    <th className="px-4 py-3 text-left text-[10px] font-black uppercase tracking-widest text-white/35">Status</th>
                                    <th className="px-4 py-3 text-right text-[10px] font-black uppercase tracking-widest text-white/35">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {paged.map((row) => (
                                    <tr key={row.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                                        <td className="px-4 py-3">
                                            <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'rgba(231,23,99,0.1)' }}>
                                                <Dumbbell className="w-3.5 h-3.5" style={{ color: '#e71763' }} />
                                            </div>
                                        </td>
                                        <td className="px-4 py-3">
                                            <p className="text-sm font-bold text-white">{row.name}</p>
                                            <p className="text-[11px] text-white/35">~{row.calories_burned} kcal burned</p>
                                        </td>
                                        <td className="px-4 py-3"><span className="text-xs text-white/50">{row.muscle_group}</span></td>
                                        <td className="px-4 py-3 hidden md:table-cell">
                                            <span className="text-xs text-white/50">{row.duration || `${row.sets} x ${row.reps}`}</span>
                                        </td>
                                        <td className="px-4 py-3 hidden lg:table-cell"><span className="text-xs text-white/50">{row.difficulty}</span></td>
                                        <td className="px-4 py-3 hidden lg:table-cell"><span className="text-xs text-white/50">{row.location}</span></td>
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
                        <p className="text-center py-12 text-sm text-white/25">{rows.length === 0 ? 'No exercises yet — add your first one.' : 'No exercises match your search/filters.'}</p>
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

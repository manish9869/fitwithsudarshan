// src/pages/admin/diet/DietPlanList.jsx
// Replaces the reference app's capped "Load Plan" dialog with a proper
// searchable list page, following AdminCMSList.jsx's table conventions.
import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Search, Loader2, Edit2, Copy, Trash2, FileDown, Salad } from 'lucide-react';
import { listDietPlans, getDietPlan, createDietPlan, deleteDietPlan } from './dietPlanApi';
import { generateDietPlanPDF } from './dietPdfGenerator';
import { useToast } from '../ToastProvider';
import { fmtName, fmtDateTime } from '../adminUtils';

export default function DietPlanList() {
    const navigate = useNavigate();
    const toast = useToast();
    const [plans, setPlans] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [deleteTarget, setDeleteTarget] = useState(null);
    const [busyId, setBusyId] = useState(null);

    const load = async () => {
        setLoading(true);
        try { setPlans(await listDietPlans()); }
        catch (e) { toast.error(e.message); }
        finally { setLoading(false); }
    };
    useEffect(() => { load(); }, []);

    const filtered = useMemo(() => {
        if (!search.trim()) return plans;
        const q = search.trim().toLowerCase();
        return plans.filter((p) => p.client_name?.toLowerCase().includes(q) || p.goal?.toLowerCase().includes(q));
    }, [plans, search]);

    const handleDelete = async () => {
        try {
            await deleteDietPlan(deleteTarget.id);
            setPlans((p) => p.filter((x) => x.id !== deleteTarget.id));
            toast.success('Deleted');
        } catch (e) { toast.error(e.message); }
        finally { setDeleteTarget(null); }
    };

    const handleDuplicate = async (id) => {
        setBusyId(id);
        try {
            const plan = await getDietPlan(id);
            const days = (plan.days || []).map((d) => ({
                dayNumber: d.day_number, meals: d.meals, exercises: d.exercises, restDay: d.rest_day, notes: d.notes,
            }));
            const copy = await createDietPlan({
                enrollment_id: plan.enrollment_id, client_name: `${plan.client_name} (Copy)`,
                client_age: plan.client_age, client_gender: plan.client_gender, client_height: plan.client_height,
                client_weight: plan.client_weight, target_weight: plan.target_weight, goal: plan.goal,
                diet_preference: plan.diet_preference, activity_level: plan.activity_level, allergies: plan.allergies,
                client_notes: plan.client_notes, client_cuisine: plan.client_cuisine, client_budget_conscious: plan.client_budget_conscious,
                trainer_name: plan.trainer_name, trainer_qualification: plan.trainer_qualification,
                trainer_contact: plan.trainer_contact, plan_duration: plan.plan_duration, include_exercise: plan.include_exercise,
                repeat_daily: plan.repeat_daily, target_calories: plan.target_calories, target_calories_manual: plan.target_calories_manual,
                guidelines: plan.guidelines,
                status: 'draft', days,
            });
            toast.success('Plan duplicated');
            navigate(`/admin/diet-plans/${copy.id}`);
        } catch (e) { toast.error(e.message); }
        finally { setBusyId(null); }
    };

    const handleDownload = async (id) => {
        setBusyId(id);
        try {
            const plan = await getDietPlan(id);
            await generateDietPlanPDF(plan, { mode: 'full', includeInstructions: true });
        } catch (e) { toast.error(e.message); }
        finally { setBusyId(null); }
    };

    return (
        <div>
            <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
                <div>
                    <h1 className="text-xl font-black text-white">Diet Plans</h1>
                    <p className="text-xs text-white/35 mt-0.5">{plans.length} {plans.length === 1 ? 'plan' : 'plans'}</p>
                </div>
                <button onClick={() => navigate('/admin/diet-plans/new')}
                    className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-black text-white"
                    style={{ background: '#e71763' }}>
                    <Plus className="w-3.5 h-3.5" /> New Plan
                </button>
            </div>

            <div className="relative mb-4 max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/30" />
                <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by client or goal…"
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
                                    <th className="px-4 py-3 text-left text-[10px] font-black uppercase tracking-widest text-white/35">Client</th>
                                    <th className="px-4 py-3 text-left text-[10px] font-black uppercase tracking-widest text-white/35 hidden sm:table-cell">Goal / Diet</th>
                                    <th className="px-4 py-3 text-left text-[10px] font-black uppercase tracking-widest text-white/35 hidden md:table-cell">Duration</th>
                                    <th className="px-4 py-3 text-left text-[10px] font-black uppercase tracking-widest text-white/35 hidden md:table-cell">Updated</th>
                                    <th className="px-4 py-3 text-right text-[10px] font-black uppercase tracking-widest text-white/35">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filtered.map((p) => (
                                    <tr key={p.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                                        <td className="px-4 py-3">
                                            <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'rgba(231,23,99,0.1)' }}>
                                                <Salad className="w-3.5 h-3.5" style={{ color: '#e71763' }} />
                                            </div>
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="flex items-center gap-2 flex-wrap">
                                                <p className="text-sm font-bold text-white">{fmtName(p.client_name)}</p>
                                                <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full leading-none"
                                                    style={p.enrollment_id
                                                        ? { background: 'rgba(52,211,153,0.1)', color: '#34d399' }
                                                        : { background: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.35)' }}>
                                                    {p.enrollment_id ? 'ENROLLED' : 'CUSTOM'}
                                                </span>
                                            </div>
                                            <p className="text-xs text-white/35 sm:hidden">{p.goal}</p>
                                        </td>
                                        <td className="px-4 py-3 hidden sm:table-cell">
                                            <span className="text-xs text-white/50">{p.goal} · {p.diet_preference}</span>
                                        </td>
                                        <td className="px-4 py-3 hidden md:table-cell"><span className="text-xs text-white/50">{p.plan_duration} days</span></td>
                                        <td className="px-4 py-3 hidden md:table-cell"><span className="text-xs text-white/35">{fmtDateTime(p.updated_at)}</span></td>
                                        <td className="px-4 py-3">
                                            <div className="flex items-center gap-1 justify-end">
                                                {busyId === p.id ? <Loader2 className="w-4 h-4 animate-spin text-white/30 mr-1" /> : (
                                                    <>
                                                        <button onClick={() => handleDownload(p.id)} title="Download PDF" className="w-8 h-8 rounded-lg flex items-center justify-center text-white/40 hover:text-white hover:bg-white/8"><FileDown className="w-3.5 h-3.5" /></button>
                                                        <button onClick={() => handleDuplicate(p.id)} title="Duplicate" className="w-8 h-8 rounded-lg flex items-center justify-center text-white/40 hover:text-white hover:bg-white/8"><Copy className="w-3.5 h-3.5" /></button>
                                                    </>
                                                )}
                                                <button onClick={() => navigate(`/admin/diet-plans/${p.id}`)} title="Edit" className="w-8 h-8 rounded-lg flex items-center justify-center text-white/40 hover:text-white hover:bg-white/8"><Edit2 className="w-3.5 h-3.5" /></button>
                                                <button onClick={() => setDeleteTarget(p)} title="Delete" className="w-8 h-8 rounded-lg flex items-center justify-center text-white/40 hover:text-red-400 hover:bg-red-500/8"><Trash2 className="w-3.5 h-3.5" /></button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                    {filtered.length === 0 && (
                        <p className="text-center py-12 text-sm text-white/25">{plans.length === 0 ? 'No diet plans yet — create your first one.' : 'No plans match your search.'}</p>
                    )}
                </div>
            )}

            {deleteTarget && (
                <div className="fixed inset-0 z-[70] flex items-center justify-center p-4" onClick={() => setDeleteTarget(null)}>
                    <div className="absolute inset-0 bg-black/65 backdrop-blur-sm" />
                    <div className="relative w-full max-w-sm rounded-2xl p-6 text-center" style={{ background: '#0e0e16', border: '1px solid rgba(239,68,68,0.25)' }} onClick={(e) => e.stopPropagation()}>
                        <p className="font-bold text-white text-sm mb-4">Delete {fmtName(deleteTarget.client_name)}'s plan permanently?</p>
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

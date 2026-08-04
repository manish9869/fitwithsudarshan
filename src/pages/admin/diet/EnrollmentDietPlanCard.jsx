// src/pages/admin/diet/EnrollmentDietPlanCard.jsx
// The "Diet Plan" section embedded in the Enrollment detail drawer
// (AdminEnrollments.jsx's DetailDrawer) — shows the plan already linked to
// this enrollment (if any) with Edit/Download/Delete, or a "Create Diet
// Plan" CTA that jumps into the wizard pre-filled with this client's data.
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Loader2, Salad, Edit2, FileDown, Trash2, Plus } from 'lucide-react';
import { getDietPlanByEnrollment, deleteDietPlan } from './dietPlanApi';
import { buildDietPrefillFromEnrollment } from './dietPrefill';
import { useToast } from '../ToastProvider';
import { fmtDateTime } from '../adminUtils';

export default function EnrollmentDietPlanCard({ enrollment }) {
    const navigate = useNavigate();
    const toast = useToast();
    const [loading, setLoading] = useState(true);
    const [plan, setPlan] = useState(null);
    const [busy, setBusy] = useState(false);
    const [confirmDelete, setConfirmDelete] = useState(false);

    useEffect(() => {
        let cancelled = false;
        setLoading(true);
        getDietPlanByEnrollment(enrollment.id)
            .then((p) => { if (!cancelled) setPlan(p); })
            .catch(() => { if (!cancelled) setPlan(null); })
            .finally(() => { if (!cancelled) setLoading(false); });
        return () => { cancelled = true; };
    }, [enrollment.id]);

    const handleCreate = () => {
        navigate('/admin/diet-plans/new', { state: buildDietPrefillFromEnrollment(enrollment) });
    };

    const handleDownload = async () => {
        if (!plan) return;
        setBusy(true);
        try {
            // Dynamic import: the PDF generator is fairly heavy, and this
            // card is embedded in AdminEnrollments.jsx, which is part of the
            // always-eager 'admin' bundle — a static import here would pull
            // PDF-drawing code into every admin page load, not just the ones
            // that actually download a plan.
            const { generateDietPlanPDF } = await import('./dietPdfGenerator');
            await generateDietPlanPDF(plan, { mode: 'full', includeInstructions: true });
        } catch (e) { toast.error(e.message); }
        finally { setBusy(false); }
    };

    const handleDelete = async () => {
        setBusy(true);
        try {
            await deleteDietPlan(plan.id);
            setPlan(null);
            toast.success('Diet plan deleted');
        } catch (e) { toast.error(e.message); }
        finally { setBusy(false); setConfirmDelete(false); }
    };

    return (
        <section>
            <p className="text-[10px] font-black uppercase tracking-widest mb-3" style={{ color: '#e71763' }}>Diet Plan</p>
            <div className="rounded-xl overflow-hidden p-4" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}>
                {loading ? (
                    <div className="flex justify-center py-3"><Loader2 className="w-4 h-4 animate-spin text-white/25" /></div>
                ) : plan ? (
                    <div>
                        <div className="flex items-center gap-3 mb-3">
                            <div className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: 'rgba(231,23,99,0.12)' }}>
                                <Salad className="w-4 h-4" style={{ color: '#e71763' }} />
                            </div>
                            <div className="min-w-0">
                                <p className="text-xs font-bold text-white">{plan.goal} · {plan.plan_duration} Days</p>
                                <p className="text-[11px] text-white/35">Updated {fmtDateTime(plan.updated_at)}</p>
                            </div>
                        </div>
                        {!confirmDelete ? (
                            <div className="flex items-center gap-2 flex-wrap">
                                <button onClick={() => navigate(`/admin/diet-plans/${plan.id}`)}
                                    className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-[11px] font-bold text-white/70 hover:text-white"
                                    style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}>
                                    <Edit2 className="w-3 h-3" /> Edit
                                </button>
                                <button onClick={handleDownload} disabled={busy}
                                    className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-[11px] font-bold disabled:opacity-50"
                                    style={{ background: 'rgba(231,23,99,0.12)', border: '1px solid rgba(231,23,99,0.25)', color: '#e71763' }}>
                                    <FileDown className="w-3 h-3" /> Download PDF
                                </button>
                                <button onClick={() => setConfirmDelete(true)}
                                    className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-[11px] font-bold text-white/35 hover:text-red-400 hover:bg-red-500/8">
                                    <Trash2 className="w-3 h-3" /> Delete
                                </button>
                            </div>
                        ) : (
                            <div className="flex items-center gap-2 text-[11px]">
                                <span className="text-white/50">Delete this plan?</span>
                                <button onClick={handleDelete} disabled={busy} className="font-bold text-red-400 disabled:opacity-50">{busy ? 'Deleting…' : 'Yes, delete'}</button>
                                <button onClick={() => setConfirmDelete(false)} className="font-bold text-white/40">Cancel</button>
                            </div>
                        )}
                    </div>
                ) : (
                    <div className="flex items-center justify-between gap-3">
                        <p className="text-xs text-white/35">No diet plan created yet.</p>
                        <button onClick={handleCreate}
                            className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-[11px] font-black text-white flex-shrink-0"
                            style={{ background: '#e71763' }}>
                            <Plus className="w-3 h-3" /> Create Diet Plan
                        </button>
                    </div>
                )}
            </div>
        </section>
    );
}

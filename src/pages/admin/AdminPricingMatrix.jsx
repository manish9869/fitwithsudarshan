// src/pages/admin/AdminPricingMatrix.jsx
import { useState, useEffect } from 'react';
import { Loader2, Save } from 'lucide-react';
import { listCmsRows, getPricingAdmin, putPricingAdmin, getBasicConsultationAdmin, putBasicConsultationAdmin } from './cmsApi';
import { useToast } from './ToastProvider';

export default function AdminPricingMatrix() {
    const [coachingTypes, setCoachingTypes] = useState([]);
    const [durations, setDurations] = useState([]);
    const [pricing, setPricing] = useState({});
    const [basic, setBasic] = useState(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const toast = useToast();

    const load = async () => {
        setLoading(true);
        try {
            const [types, durs, table, bc] = await Promise.all([
                listCmsRows('coaching_types'), listCmsRows('durations'), getPricingAdmin(), getBasicConsultationAdmin(),
            ]);
            setCoachingTypes(types); setDurations(durs); setPricing(table); setBasic(bc);
        } catch (e) { toast.error(e.message); }
        finally { setLoading(false); }
    };
    useEffect(() => { load(); }, []);

    const setPrice = (coachingId, planType, months, value) => {
        setPricing((p) => ({
            ...p,
            [coachingId]: { ...(p[coachingId] || {}), [planType]: { ...(p[coachingId]?.[planType] || {}), [months]: value } },
        }));
    };

    const handleSavePricing = async () => {
        setSaving(true);
        try {
            const rows = [];
            for (const [coachingTypeId, plans] of Object.entries(pricing)) {
                for (const [planType, months] of Object.entries(plans)) {
                    for (const [durationMonths, price] of Object.entries(months)) {
                        if (price !== '' && price != null) rows.push({ coachingTypeId, planType, durationMonths, price });
                    }
                }
            }
            await putPricingAdmin(rows);
            toast.success('Pricing saved');
        } catch (e) { toast.error(e.message); }
        finally { setSaving(false); }
    };

    const handleSaveBasic = async () => {
        setSaving(true);
        try { setBasic(await putBasicConsultationAdmin(basic)); toast.success('Basic consultation saved'); }
        catch (e) { toast.error(e.message); }
        finally { setSaving(false); }
    };

    if (loading) return <div className="py-24 flex justify-center"><Loader2 className="w-6 h-6 animate-spin text-white/25" /></div>;

    return (
        <div className="space-y-8">
            <div className="flex items-center justify-between">
                <h1 className="text-xl font-black text-white">Pricing</h1>
                <button onClick={handleSavePricing} disabled={saving}
                    className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-black text-white disabled:opacity-50"
                    style={{ background: '#e71763' }}>
                    <Save className="w-3.5 h-3.5" /> Save Pricing
                </button>
            </div>

            {coachingTypes.map((ct) => (
                <div key={ct.id} className="rounded-2xl p-5" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.07)' }}>
                    <p className="font-bold text-white mb-4">{ct.name}</p>
                    {['individual', 'couple'].map((planType) => (
                        <div key={planType} className="mb-4">
                            <p className="text-xs text-white/40 uppercase tracking-widest mb-2">{planType}</p>
                            <div className="grid grid-cols-4 gap-3">
                                {durations.map((d) => (
                                    <div key={d.months}>
                                        <label className="text-[10px] text-white/30 block mb-1">{d.label}</label>
                                        <input type="number"
                                            value={pricing[ct.id]?.[planType]?.[d.months] ?? ''}
                                            onChange={(e) => setPrice(ct.id, planType, d.months, e.target.value)}
                                            className="w-full rounded-lg px-2.5 py-2 text-sm text-white bg-white/5 border border-white/10" />
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            ))}

            {basic && (
                <div className="rounded-2xl p-5" style={{ background: 'rgba(231,23,99,0.05)', border: '1px solid rgba(231,23,99,0.18)' }}>
                    <div className="flex items-center justify-between mb-4">
                        <p className="font-bold text-white">Basic Consultation (Comeback Blueprint)</p>
                        <button onClick={handleSaveBasic} disabled={saving} className="px-3 py-2 rounded-lg text-xs font-bold text-white" style={{ background: '#e71763' }}>Save</button>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                        {[
                            ['price_individual', 'Price (Individual)'], ['price_couple', 'Price (Couple)'],
                            ['original_price_individual', 'Original Price (Individual)'], ['original_price_couple', 'Original Price (Couple)'],
                        ].map(([key, label]) => (
                            <div key={key}>
                                <label className="text-[10px] text-white/30 block mb-1">{label}</label>
                                <input type="number" value={basic[key] ?? ''} onChange={(e) => setBasic((b) => ({ ...b, [key]: e.target.value }))}
                                    className="w-full rounded-lg px-2.5 py-2 text-sm text-white bg-white/5 border border-white/10" />
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
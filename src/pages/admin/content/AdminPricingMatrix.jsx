// src/pages/admin/content/AdminPricingMatrix.jsx
import { useState, useEffect } from 'react';
import { Loader2, Save, Globe, Video, MapPin, Flame, User, Users } from 'lucide-react';
import { listCmsRows, getPricingAdmin, putPricingAdmin, getBasicConsultationAdmin, putBasicConsultationAdmin, getSiteContentKey, putSiteContentKey } from './cmsApi';
import { useToast } from '../ToastProvider';

const TAB_ICONS = { online: Globe, video: Video, personal: MapPin };

const formatPrice = (p) =>
    new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(Number(p) || 0);

function saleKey(coachingId, planType, months) {
    return `${coachingId}:${planType}:${months}`;
}

// One duration's price + sale-toggle for one plan type (individual/couple).
function PriceCell({ value, onChange, onSale, onToggleSale }) {
    return (
        <div className="flex items-center gap-2">
            <div className="relative flex-1">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-white/30">₹</span>
                <input
                    type="number"
                    value={value ?? ''}
                    onChange={(e) => onChange(e.target.value)}
                    className="w-full rounded-lg pl-7 pr-2 py-2 text-sm text-white bg-white/5 border border-white/10"
                />
            </div>
            <button
                type="button"
                onClick={onToggleSale}
                title={onSale ? 'On sale — click to remove' : 'Mark this price as on sale'}
                className="w-8 h-8 flex-shrink-0 rounded-lg flex items-center justify-center transition-all"
                style={onSale
                    ? { background: '#e71763', color: 'white', boxShadow: '0 0 12px rgba(231,23,99,0.5)' }
                    : { background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.3)' }}
            >
                <Flame className="w-3.5 h-3.5" />
            </button>
        </div>
    );
}

export default function AdminPricingMatrix() {
    const [coachingTypes, setCoachingTypes] = useState([]);
    const [durations, setDurations] = useState([]);
    const [pricing, setPricing] = useState({});
    const [saleFlags, setSaleFlags] = useState([]);
    const [basic, setBasic] = useState(null);
    const [activeTab, setActiveTab] = useState(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const toast = useToast();

    const load = async () => {
        setLoading(true);
        try {
            const [types, durs, table, bc, flags] = await Promise.all([
                listCmsRows('coaching_types'),
                listCmsRows('durations'),
                getPricingAdmin(),
                getBasicConsultationAdmin(),
                getSiteContentKey('pricing_sale_flags'),
            ]);
            setCoachingTypes(types);
            setDurations(durs);
            setPricing(table);
            setBasic(bc);
            setSaleFlags(Array.isArray(flags) ? flags : []);
            setActiveTab((prev) => prev || types[0]?.id || null);
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

    const toggleSale = (coachingId, planType, months) => {
        const key = saleKey(coachingId, planType, months);
        setSaleFlags((f) => (f.includes(key) ? f.filter((k) => k !== key) : [...f, key]));
    };

    const handleSaveAll = async () => {
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
            await Promise.all([
                putPricingAdmin(rows),
                putSiteContentKey('pricing_sale_flags', saleFlags),
                basic ? putBasicConsultationAdmin(basic) : Promise.resolve(),
            ]);
            toast.success('Saved — live on the site now.');
        } catch (e) { toast.error(e.message); }
        finally { setSaving(false); }
    };

    if (loading) {
        return <div className="py-24 flex justify-center"><Loader2 className="w-6 h-6 animate-spin text-white/25" /></div>;
    }

    const activeCoaching = coachingTypes.find((c) => c.id === activeTab) || coachingTypes[0];

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between flex-wrap gap-3">
                <div>
                    <h1 className="text-xl font-black text-white">Pricing</h1>
                    <p className="text-xs text-white/35 mt-1">
                        Set prices for each plan and duration. Tap the <Flame className="inline w-3 h-3 -mt-0.5" style={{ color: '#e71763' }} /> icon to flash a "SALE" badge on that exact price on the homepage.
                    </p>
                </div>
                <button onClick={handleSaveAll} disabled={saving}
                    className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl text-xs font-black text-white disabled:opacity-50"
                    style={{ background: '#e71763', boxShadow: '0 0 20px rgba(231,23,99,0.3)' }}>
                    {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                    Save Everything
                </button>
            </div>

            {/* Coaching type tabs */}
            <div className="flex gap-2 flex-wrap">
                {coachingTypes.map((ct) => {
                    const Icon = TAB_ICONS[ct.id] || Globe;
                    const active = activeTab === ct.id;
                    return (
                        <button key={ct.id} onClick={() => setActiveTab(ct.id)}
                            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold transition-all"
                            style={active
                                ? { background: '#e71763', color: 'white', boxShadow: '0 0 20px rgba(231,23,99,0.35)' }
                                : { background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.5)' }}>
                            <Icon className="w-4 h-4" /> {ct.short_name || ct.name}
                        </button>
                    );
                })}
            </div>

            {/* Price table for the active coaching type */}
            {activeCoaching && (
                <div className="rounded-2xl overflow-hidden" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.07)' }}>
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                                    <th className="px-5 py-3.5 text-left text-[10px] font-black uppercase tracking-widest text-white/35">Duration</th>
                                    <th className="px-5 py-3.5 text-left text-[10px] font-black uppercase tracking-widest text-white/35">
                                        <span className="flex items-center gap-1.5"><User className="w-3 h-3" /> Individual</span>
                                    </th>
                                    <th className="px-5 py-3.5 text-left text-[10px] font-black uppercase tracking-widest text-white/35">
                                        <span className="flex items-center gap-1.5"><Users className="w-3 h-3" /> Couple</span>
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {durations.map((d) => (
                                    <tr key={d.months} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                                        <td className="px-5 py-3.5">
                                            <p className="text-sm font-bold text-white">{d.label}</p>
                                            <p className="text-[11px] text-white/30">{d.sublabel}</p>
                                        </td>
                                        <td className="px-5 py-3 w-56">
                                            <PriceCell
                                                value={pricing[activeCoaching.id]?.individual?.[d.months]}
                                                onChange={(v) => setPrice(activeCoaching.id, 'individual', d.months, v)}
                                                onSale={saleFlags.includes(saleKey(activeCoaching.id, 'individual', d.months))}
                                                onToggleSale={() => toggleSale(activeCoaching.id, 'individual', d.months)}
                                            />
                                        </td>
                                        <td className="px-5 py-3 w-56">
                                            <PriceCell
                                                value={pricing[activeCoaching.id]?.couple?.[d.months]}
                                                onChange={(v) => setPrice(activeCoaching.id, 'couple', d.months, v)}
                                                onSale={saleFlags.includes(saleKey(activeCoaching.id, 'couple', d.months))}
                                                onToggleSale={() => toggleSale(activeCoaching.id, 'couple', d.months)}
                                            />
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Basic consultation — same Save Everything button above covers this too */}
            {basic && (
                <div className="rounded-2xl p-5" style={{ background: 'rgba(231,23,99,0.05)', border: '1px solid rgba(231,23,99,0.18)' }}>
                    <p className="font-bold text-white mb-1">{basic.name || 'Basic Consultation'}</p>
                    <p className="text-xs text-white/35 mb-4">One-time offer shown as "RECODE Blueprint" under the Online tab. Saved together with the button above.</p>
                    <div className="grid sm:grid-cols-2 gap-4">
                        {[
                            ['price_individual', 'Sale Price (Individual)'],
                            ['price_couple', 'Sale Price (Couple)'],
                            ['original_price_individual', 'Original Price (Individual)'],
                            ['original_price_couple', 'Original Price (Couple)'],
                        ].map(([key, label]) => (
                            <div key={key}>
                                <label className="text-[10px] text-white/30 uppercase tracking-widest block mb-1.5">{label}</label>
                                <div className="relative">
                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-white/30">₹</span>
                                    <input type="number" value={basic[key] ?? ''} onChange={(e) => setBasic((b) => ({ ...b, [key]: e.target.value }))}
                                        className="w-full rounded-lg pl-7 pr-3 py-2.5 text-sm text-white bg-white/5 border border-white/10" />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            <p className="text-[11px] text-white/25 text-center">
                Changes appear on the live site within a few seconds of saving.
            </p>
        </div>
    );
}

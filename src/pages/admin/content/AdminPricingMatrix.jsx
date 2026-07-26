// src/pages/admin/content/AdminPricingMatrix.jsx
import { useState, useEffect } from 'react';
import { Loader2, Save, Globe, Video, MapPin, Flame, Star, User, Users } from 'lucide-react';
import { listCmsRows, getPricingAdmin, putPricingAdmin, getSiteContentKey, putSiteContentKey } from './cmsApi';
import { useToast } from '../ToastProvider';

const TAB_ICONS = { online: Globe, video: Video, personal: MapPin };

const formatPrice = (p) =>
    new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(Number(p) || 0);

function cellKey(coachingId, planType, months) {
    return `${coachingId}:${planType}:${months}`;
}

// One duration's price for one plan type (individual/couple) — price input,
// a sale toggle (with the "was" price once on), and a "Most Popular" toggle.
// Every plan uses this exact same control, including Basic — there's no
// separate mechanism for it anymore, and any combination of cells can be on
// sale and/or popular at the same time.
function PriceCell({ value, onChange, sale, onToggleSale, onOriginalPriceChange, popular, onTogglePopular, saleError }) {
    const onSale = !!sale?.onSale;
    return (
        <div>
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
                <button
                    type="button"
                    onClick={onTogglePopular}
                    title={popular ? 'Marked Most Popular — click to remove' : 'Mark this plan as Most Popular'}
                    className="w-8 h-8 flex-shrink-0 rounded-lg flex items-center justify-center transition-all"
                    style={popular
                        ? { background: '#f59e0b', color: 'white', boxShadow: '0 0 12px rgba(245,158,11,0.5)' }
                        : { background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.3)' }}
                >
                    <Star className="w-3.5 h-3.5" />
                </button>
            </div>
            {onSale && (
                <div>
                    <div className="relative mt-1.5">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[10px] text-white/25">was ₹</span>
                        <input
                            type="number"
                            value={sale?.originalPrice ?? ''}
                            onChange={(e) => onOriginalPriceChange(e.target.value)}
                            placeholder="Original price"
                            className="w-full rounded-lg pl-14 pr-2 py-1.5 text-xs text-white/70 bg-white/5 border border-white/10"
                        />
                    </div>
                    {saleError && <p className="text-[10px] font-bold mt-1" style={{ color: '#f87171' }}>{saleError}</p>}
                </div>
            )}
        </div>
    );
}

export default function AdminPricingMatrix() {
    const [coachingTypes, setCoachingTypes] = useState([]);
    const [durations, setDurations] = useState([]);
    const [pricing, setPricing] = useState({});
    const [saleFlags, setSaleFlags] = useState({});
    const [popularFlags, setPopularFlags] = useState({});
    const [activeTab, setActiveTab] = useState(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const toast = useToast();

    const load = async () => {
        setLoading(true);
        try {
            const [types, durs, table, flags, popular] = await Promise.all([
                listCmsRows('coaching_types'),
                listCmsRows('durations'),
                getPricingAdmin(),
                getSiteContentKey('pricing_sale_flags'),
                getSiteContentKey('pricing_popular_flags'),
            ]);
            setCoachingTypes(types);
            setDurations(durs);
            setPricing(table);
            setSaleFlags(flags && typeof flags === 'object' && !Array.isArray(flags) ? flags : {});
            setPopularFlags(popular && typeof popular === 'object' && !Array.isArray(popular) ? popular : {});
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
        const key = cellKey(coachingId, planType, months);
        setSaleFlags((f) => {
            const current = f[key];
            if (current?.onSale) {
                const { [key]: _drop, ...rest } = f;
                return rest;
            }
            return { ...f, [key]: { onSale: true, originalPrice: current?.originalPrice ?? '' } };
        });
    };

    const setOriginalPrice = (coachingId, planType, months, value) => {
        const key = cellKey(coachingId, planType, months);
        setSaleFlags((f) => ({ ...f, [key]: { ...(f[key] || { onSale: true }), originalPrice: value } }));
    };

    const togglePopular = (coachingId, planType, months) => {
        const key = cellKey(coachingId, planType, months);
        setPopularFlags((f) => {
            if (f[key]) {
                const { [key]: _drop, ...rest } = f;
                return rest;
            }
            return { ...f, [key]: true };
        });
    };

    // A sale toggled on with no valid "was" price (blank, or not actually
    // higher than the current price) can't show a badge — better to block
    // the save and say so than silently drop it, which is what used to
    // happen and made sales vanish with no explanation.
    const findSaleErrors = () => {
        const errors = {};
        for (const [key, v] of Object.entries(saleFlags)) {
            if (!v?.onSale) continue;
            const [coachingId, planType, months] = key.split(':');
            const currentPrice = Number(pricing[coachingId]?.[planType]?.[months]) || 0;
            const original = Number(v.originalPrice);
            if (!v.originalPrice || v.originalPrice === '' || !(original > currentPrice)) {
                errors[key] = !v.originalPrice || v.originalPrice === ''
                    ? 'Enter the original price to show this sale.'
                    : 'Original price must be higher than the current price.';
            }
        }
        return errors;
    };
    const saleErrors = findSaleErrors();

    const handleSaveAll = async () => {
        const errors = findSaleErrors();
        if (Object.keys(errors).length > 0) {
            toast.error(`Fix ${Object.keys(errors).length} sale price issue(s) below before saving — each is highlighted in red.`);
            return;
        }
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
            const cleanedFlags = {};
            for (const [key, v] of Object.entries(saleFlags)) {
                if (v?.onSale) cleanedFlags[key] = { onSale: true, originalPrice: Number(v.originalPrice) };
            }
            await Promise.all([
                putPricingAdmin(rows),
                putSiteContentKey('pricing_sale_flags', cleanedFlags),
                putSiteContentKey('pricing_popular_flags', popularFlags),
            ]);
            setSaleFlags(cleanedFlags);
            toast.success('Saved — live on the site now.');
        } catch (e) { toast.error(e.message); }
        finally { setSaving(false); }
    };

    if (loading) {
        return <div className="py-24 flex justify-center"><Loader2 className="w-6 h-6 animate-spin text-white/25" /></div>;
    }

    const activeCoaching = coachingTypes.find((c) => c.id === activeTab) || coachingTypes[0];
    // Basic Consultation is Online-only and always 1-month/one-time — shown
    // as one more row in the same table, not a separate section.
    const showBasicRow = activeCoaching?.id === 'online';

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between flex-wrap gap-3">
                <div>
                    <h1 className="text-xl font-black text-white">Pricing</h1>
                    <p className="text-xs text-white/35 mt-1">
                        Set the price for every plan here. Tap <Flame className="inline w-3 h-3 -mt-0.5" style={{ color: '#e71763' }} /> to run a sale (enter what the price used to be) and <Star className="inline w-3 h-3 -mt-0.5" style={{ color: '#f59e0b' }} /> to mark a plan Most Popular. Any number of plans can carry either badge at once.
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
                                    <th className="px-5 py-3.5 text-left text-[10px] font-black uppercase tracking-widest text-white/35">Plan</th>
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
                                        <td className="px-5 py-3.5 align-top">
                                            <p className="text-sm font-bold text-white">{d.label}</p>
                                            <p className="text-[11px] text-white/30">{d.sublabel}</p>
                                        </td>
                                        <td className="px-5 py-3 w-56 align-top">
                                            <PriceCell
                                                value={pricing[activeCoaching.id]?.individual?.[d.months]}
                                                onChange={(v) => setPrice(activeCoaching.id, 'individual', d.months, v)}
                                                sale={saleFlags[cellKey(activeCoaching.id, 'individual', d.months)]}
                                                onToggleSale={() => toggleSale(activeCoaching.id, 'individual', d.months)}
                                                onOriginalPriceChange={(v) => setOriginalPrice(activeCoaching.id, 'individual', d.months, v)}
                                                popular={!!popularFlags[cellKey(activeCoaching.id, 'individual', d.months)]}
                                                onTogglePopular={() => togglePopular(activeCoaching.id, 'individual', d.months)}
                                                saleError={saleErrors[cellKey(activeCoaching.id, 'individual', d.months)]}
                                            />
                                        </td>
                                        <td className="px-5 py-3 w-56 align-top">
                                            <PriceCell
                                                value={pricing[activeCoaching.id]?.couple?.[d.months]}
                                                onChange={(v) => setPrice(activeCoaching.id, 'couple', d.months, v)}
                                                sale={saleFlags[cellKey(activeCoaching.id, 'couple', d.months)]}
                                                onToggleSale={() => toggleSale(activeCoaching.id, 'couple', d.months)}
                                                onOriginalPriceChange={(v) => setOriginalPrice(activeCoaching.id, 'couple', d.months, v)}
                                                popular={!!popularFlags[cellKey(activeCoaching.id, 'couple', d.months)]}
                                                onTogglePopular={() => togglePopular(activeCoaching.id, 'couple', d.months)}
                                                saleError={saleErrors[cellKey(activeCoaching.id, 'couple', d.months)]}
                                            />
                                        </td>
                                    </tr>
                                ))}

                                {showBasicRow && (
                                    <tr style={{ background: 'rgba(231,23,99,0.03)' }}>
                                        <td className="px-5 py-3.5 align-top">
                                            <p className="text-sm font-bold text-white">RECODE Blueprint</p>
                                            <p className="text-[11px] text-white/30">One-Time · Basic Consultation</p>
                                        </td>
                                        <td className="px-5 py-3 w-56 align-top">
                                            <PriceCell
                                                value={pricing.online?.basic_individual?.['1']}
                                                onChange={(v) => setPrice('online', 'basic_individual', '1', v)}
                                                sale={saleFlags[cellKey('online', 'basic_individual', '1')]}
                                                onToggleSale={() => toggleSale('online', 'basic_individual', '1')}
                                                onOriginalPriceChange={(v) => setOriginalPrice('online', 'basic_individual', '1', v)}
                                                popular={!!popularFlags[cellKey('online', 'basic_individual', '1')]}
                                                onTogglePopular={() => togglePopular('online', 'basic_individual', '1')}
                                                saleError={saleErrors[cellKey('online', 'basic_individual', '1')]}
                                            />
                                        </td>
                                        <td className="px-5 py-3 w-56 align-top">
                                            <PriceCell
                                                value={pricing.online?.basic_couple?.['1']}
                                                onChange={(v) => setPrice('online', 'basic_couple', '1', v)}
                                                sale={saleFlags[cellKey('online', 'basic_couple', '1')]}
                                                onToggleSale={() => toggleSale('online', 'basic_couple', '1')}
                                                onOriginalPriceChange={(v) => setOriginalPrice('online', 'basic_couple', '1', v)}
                                                popular={!!popularFlags[cellKey('online', 'basic_couple', '1')]}
                                                onTogglePopular={() => togglePopular('online', 'basic_couple', '1')}
                                                saleError={saleErrors[cellKey('online', 'basic_couple', '1')]}
                                            />
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            <p className="text-[11px] text-white/25 text-center">
                Changes appear on the live site within a few seconds of saving.
            </p>
        </div>
    );
}

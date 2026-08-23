import { useState, useRef } from "react";
import { motion, useInView, AnimatePresence } from "framer-motion";
import { Check, Globe, Video, MapPin, Zap, Users, User, ArrowRight, Flame } from "lucide-react";
import { Link } from "react-router-dom";
import { wa } from "@/utils/whatsapp";
import { useSiteData } from "@/contexts/SiteDataContext";
import SectionSkeleton from "./SectionSkeleton";

const tabIcons = { online: Globe, video: Video, personal: MapPin };
const formatPrice = (p) =>
    new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(p);

// A cell is "on sale" purely from admin-set data — no plan is special-cased.
function isCellOnSale(pricingTable, saleFlags, coachingId, planType, months) {
    const price = pricingTable[coachingId]?.[planType]?.[months] || 0;
    const sale = saleFlags[`${coachingId}:${planType}:${months}`];
    return !!sale?.onSale && sale.originalPrice > price;
}

function isCellPopular(popularFlags, coachingId, planType, months) {
    return !!popularFlags[`${coachingId}:${planType}:${months}`];
}

// Small pulsing "Hot Sale" ribbon for the Individual/Couple/Basic tab
// buttons — flags "there's an offer in here" before the user even clicks
// in, independent of the card-level badge.
function TabSaleDot() {
    return (
        <motion.span
            className="absolute -top-2.5 -right-2 z-10 flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[8px] font-black text-white whitespace-nowrap"
            style={{ background: '#e71763', boxShadow: '0 0 10px rgba(231,23,99,0.85)' }}
            animate={{ scale: [1, 1.12, 1], opacity: [1, 0.75, 1] }}
            transition={{ duration: 1.1, repeat: Infinity, ease: 'easeInOut' }}
        >
            <Flame className="w-2 h-2" /> Hot Sale
        </motion.span>
    );
}

// One card, used for every plan — regular durations AND the one-time Basic
// offer alike. Which cell it reads (price + sale + popular state) is
// entirely driven by coachingId/planType/months, so Basic isn't a special
// case anymore — it's just another cell in the same pricing table.
function PricingCard({ pricingTable, saleFlags, popularFlags, coachingId, planType, duration, isCouple, index }) {
    const price = pricingTable[coachingId]?.[planType]?.[duration.months] || 0;
    const [hovered, setHovered] = useState(false);

    const cellKey = `${coachingId}:${planType}:${duration.months}`;
    const sale = saleFlags[cellKey];
    const isOnSale = !!sale?.onSale && sale.originalPrice > price;
    const originalPrice = sale?.originalPrice;
    const isPopular = !!popularFlags[cellKey];

    return (
        <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: isPopular ? 1.04 : 1 }}
            transition={{ duration: 0.55, delay: index * 0.09, ease: [0.22, 1, 0.36, 1] }}
            whileHover={{ y: -10, scale: isPopular ? 1.07 : 1.04 }}
            onHoverStart={() => setHovered(true)}
            onHoverEnd={() => setHovered(false)}
            className="relative rounded-2xl flex flex-col"
            style={isPopular
                ? { background: 'linear-gradient(135deg, rgba(231,23,99,0.18) 0%, rgba(231,23,99,0.06) 100%)', border: '1px solid rgba(231,23,99,0.65)', boxShadow: hovered ? '0 0 70px rgba(231,23,99,0.4), 0 25px 60px rgba(0,0,0,0.6)' : '0 0 40px rgba(231,23,99,0.25), 0 10px 30px rgba(0,0,0,0.4)' }
                : isOnSale
                    ? { background: 'linear-gradient(135deg, rgba(231,23,99,0.14) 0%, rgba(231,23,99,0.04) 100%)', border: '1px solid rgba(231,23,99,0.5)', boxShadow: hovered ? '0 0 60px rgba(231,23,99,0.35)' : '0 0 30px rgba(231,23,99,0.18)' }
                    : { background: 'rgba(255,255,255,0.03)', border: `1px solid ${hovered ? 'rgba(231,23,99,0.4)' : 'rgba(255,255,255,0.07)'}`, boxShadow: hovered ? '0 25px 60px rgba(0,0,0,0.5)' : 'none' }
            }
        >
            {isPopular && (
                <motion.div className="absolute top-0 left-0 right-0 h-0.5"
                    style={{ background: 'linear-gradient(90deg, transparent, #e71763, transparent)' }}
                    animate={{ opacity: [0.5, 1, 0.5] }} transition={{ duration: 1.8, repeat: Infinity }} />
            )}
            {isPopular && (
                <div className="absolute -top-px left-1/2 -translate-x-1/2">
                    <div className="flex items-center gap-1.5 px-4 py-1 text-xs font-black text-white"
                        style={{ background: '#e71763', borderRadius: '0 0 12px 12px' }}>
                        <Flame className="w-3 h-3" /> Most Popular
                    </div>
                </div>
            )}
            {/* Single flashing SALE badge on every on-sale card, popular or not —
                the one "eye catchy" indicator. No separate static ribbon, so a
                sale never shows two competing badges at once. */}
            {isOnSale && (
                <motion.span
                    className="absolute -top-3 -right-3 z-10 flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black text-white whitespace-nowrap"
                    style={{ background: '#e71763', boxShadow: '0 0 14px rgba(231,23,99,0.8)' }}
                    animate={{ scale: [1, 1.18, 1], opacity: [1, 0.7, 1] }}
                    transition={{ duration: 1.1, repeat: Infinity, ease: 'easeInOut' }}
                >
                    <Flame className="w-3 h-3" /> SALE
                </motion.span>
            )}

            <div className="p-6 flex flex-col flex-1 pt-8">
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white/35 mb-1">{duration.sublabel}</p>
                <p className="text-lg font-black text-white mb-4">{duration.label}</p>

                <div className="mb-5">
                    <div className="flex items-baseline gap-2 flex-wrap">
                        <motion.p className="text-4xl font-black leading-none"
                            style={{ color: isPopular || isOnSale ? '#e71763' : 'white' }}
                            animate={hovered ? { scale: 1.06 } : { scale: 1 }} transition={{ duration: 0.2 }}>
                            {formatPrice(price)}
                        </motion.p>
                        {isOnSale && (
                            <span className="text-lg font-bold text-white/30 line-through">{formatPrice(originalPrice)}</span>
                        )}
                    </div>
                    {isCouple && <p className="text-[11px] text-white/35 mt-1.5">for 2 people · {formatPrice(Math.round(price / 2))}/person</p>}
                    {isOnSale && (
                        <p className="text-[11px] font-bold mt-1.5" style={{ color: '#34d399' }}>
                            Save {formatPrice(originalPrice - price)} · Limited-time offer
                        </p>
                    )}
                </div>

                <p className="text-xs text-white/45 mb-5 leading-relaxed flex-1">{duration.description}</p>

                <div className="space-y-2 mb-6">
                    {(duration.features || ["Personalized plan", "WhatsApp check-ins", "Progress tracking", "Expert guidance"]).map((b) => (
                        <div key={b} className="flex items-center gap-2">
                            <div className="w-3.5 h-3.5 rounded-full flex items-center justify-center flex-shrink-0"
                                style={{ background: 'rgba(231,23,99,0.15)' }}>
                                <Check className="w-2 h-2" style={{ color: '#e71763' }} />
                            </div>
                            <span className="text-xs text-white/55">{b}</span>
                        </div>
                    ))}
                </div>

                <Link to="/enroll" state={{ coachingId, planType, duration: duration.months }}>
                    <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                        className="w-full py-3 rounded-xl font-black text-sm text-white"
                        style={isPopular || isOnSale
                            ? { background: '#e71763', boxShadow: '0 0 25px rgba(231,23,99,0.45)' }
                            : { border: `1px solid ${hovered ? 'rgba(231,23,99,0.5)' : 'rgba(255,255,255,0.15)'}`, background: hovered ? 'rgba(231,23,99,0.08)' : 'transparent' }}>
                        Enroll Now <ArrowRight className="inline w-3.5 h-3.5 ml-1" />
                    </motion.button>
                </Link>
            </div>
        </motion.div>
    );
}

export function PricingSection() {
    const { coachingTypes, pricingTable, durations, planInclusions, basicConsultation, saleFlags, popularFlags, loading, error } = useSiteData();
    const [activeTab, setActiveTab] = useState("online");
    // Three independent plan tabs — individual, couple, and (online-only) basic.
    // Each can be on sale at the same time as any other; nothing here is special-cased.
    const [planType, setPlanType] = useState("individual");
    const [basicVariant, setBasicVariant] = useState("individual");
    const ref = useRef(null);
    const isInView = useInView(ref, { once: true, margin: "-60px" });

    if (loading) {
        return <SectionSkeleton minHeight={640} />;
    }

    if (!coachingTypes.length) {
        // loading has actually finished by this point (the branch above
        // handles the in-progress state) — this is either a genuine fetch
        // failure after all retries, or no pricing configured yet.
        return (
            <section className="relative py-28 text-center text-white/30 text-sm">
                {error ? "Couldn't load pricing right now. Please refresh the page." : "Pricing is being set up — check back soon."}
            </section>
        );
    }

    const activeCoaching = coachingTypes.find((c) => c.id === activeTab) || coachingTypes[0];
    const Icon = tabIcons[activeCoaching.id] || Globe;
    const basicAvailable = activeTab === "online" && !!basicConsultation;
    const effectivePlanType = planType === "basic" && !basicAvailable ? "individual" : planType;

    const planTabHasSale = (pt) => {
        if (pt === "basic") {
            return isCellOnSale(pricingTable, saleFlags, "online", "basic_individual", "1") ||
                isCellOnSale(pricingTable, saleFlags, "online", "basic_couple", "1");
        }
        return durations.some((d) => isCellOnSale(pricingTable, saleFlags, activeTab, pt, d.months));
    };

    const basicPseudoDuration = basicAvailable
        ? {
            months: "1",
            label: basicConsultation.name || "RECODE Blueprint",
            sublabel: "One-Time",
            description: `One-time session · ${basicConsultation.description || ""}`,
            features: basicConsultation.features,
        }
        : null;
    const basicPlanType = basicVariant === "couple" ? "basic_couple" : "basic_individual";

    const planTabs = [
        { id: "individual", icon: User, label: "Individual" },
        { id: "couple", icon: Users, label: "Couple" },
        ...(basicAvailable ? [{ id: "basic", icon: Zap, label: "Basic" }] : []),
    ];

    return (
        <section className="relative py-28 overflow-hidden">
            <div className="absolute inset-0 pointer-events-none">
                <motion.div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[1000px] h-[700px] rounded-full blur-[140px]"
                    style={{ background: 'radial-gradient(ellipse, rgba(231,23,99,0.1) 0%, transparent 70%)' }}
                    animate={{ scale: [1, 1.2, 1], opacity: [0.5, 1, 0.5] }}
                    transition={{ duration: 7, repeat: Infinity, ease: "easeInOut" }} />
            </div>

            <div ref={ref} className="relative container mx-auto px-4 max-w-6xl">
                <motion.div initial={{ opacity: 0, y: 40 }} animate={isInView ? { opacity: 1, y: 0 } : {}}
                    transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }} className="text-center mb-16">
                    <motion.span className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-[0.25em] px-4 py-2 rounded-full mb-6"
                        style={{ color: '#e71763', border: '1px solid rgba(231,23,99,0.3)', background: 'rgba(231,23,99,0.08)' }}>
                        <Zap className="w-3 h-3" /> Programs & Pricing
                    </motion.span>
                    <h2 className="text-5xl md:text-7xl font-black leading-[0.92] text-white mb-6">
                        Choose Your<br />
                        <span style={{ color: '#e71763', textShadow: '0 0 70px rgba(231,23,99,0.55)' }}>RECODE Path</span>
                    </h2>
                    <p className="text-white/45 max-w-xl mx-auto text-sm leading-relaxed">
                        Every plan includes personalized training, nutrition, recovery, and WhatsApp accountability — built around your life.
                    </p>
                </motion.div>

                {planInclusions.length > 0 && (
                    <motion.div initial={{ opacity: 0, y: 24 }} animate={isInView ? { opacity: 1, y: 0 } : {}}
                        transition={{ duration: 0.6, delay: 0.1 }}
                        className="relative rounded-2xl p-6 mb-14 overflow-hidden"
                        style={{ background: 'rgba(231,23,99,0.04)', border: '1px solid rgba(231,23,99,0.18)' }}>
                        <p className="text-[10px] font-black uppercase tracking-widest text-center mb-4" style={{ color: '#e71763' }}>Every Plan Includes</p>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                            {planInclusions.slice(0, 8).map((item) => (
                                <div key={item} className="flex items-center gap-2 px-3 py-2 rounded-lg" style={{ background: 'rgba(255,255,255,0.025)' }}>
                                    <Check className="w-3 h-3 flex-shrink-0" style={{ color: '#e71763' }} />
                                    <span className="text-xs text-white/65">{item}</span>
                                </div>
                            ))}
                        </div>
                    </motion.div>
                )}

                <div className="flex gap-3 justify-center mb-6 flex-wrap">
                    {coachingTypes.map((ct) => {
                        const TabIcon = tabIcons[ct.id] || Globe;
                        const active = activeTab === ct.id;
                        return (
                            <motion.button key={ct.id}
                                onClick={() => {
                                    setActiveTab(ct.id);
                                    if (ct.id !== "online" && planType === "basic") setPlanType("individual");
                                }}
                                whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.97 }}
                                className="flex items-center gap-2 px-6 py-3 rounded-full font-black text-sm transition-all"
                                style={active
                                    ? { background: '#e71763', color: 'white', boxShadow: '0 0 30px rgba(231,23,99,0.55)' }
                                    : { background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.55)' }}>
                                <TabIcon className="w-4 h-4" />
                                {ct.shortName}
                            </motion.button>
                        );
                    })}
                </div>

                <AnimatePresence mode="wait">
                    <motion.div key={activeCoaching.id}
                        initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -14 }}
                        transition={{ duration: 0.3 }}
                        className="max-w-4xl mx-auto mb-8 rounded-2xl p-6 grid md:grid-cols-2 gap-6 items-start"
                        style={{ background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.07)' }}>
                        <div>
                            <div className="flex items-center gap-3 mb-3">
                                <div className="w-9 h-9 rounded-xl flex items-center justify-center"
                                    style={{ background: 'rgba(231,23,99,0.12)', border: '1px solid rgba(231,23,99,0.25)' }}>
                                    <Icon className="w-4 h-4" style={{ color: '#e71763' }} />
                                </div>
                                <h3 className="font-black text-white">{activeCoaching.name}</h3>
                            </div>
                            <p className="text-white/45 text-sm leading-relaxed">{activeCoaching.description}</p>
                        </div>
                        <div className="space-y-1.5">
                            {(activeCoaching.features || []).slice(0, 6).map((f) => (
                                <div key={f} className="flex items-start gap-2">
                                    <Check className="w-3 h-3 text-primary flex-shrink-0 mt-0.5" />
                                    <span className="text-xs text-white/60">{f}</span>
                                </div>
                            ))}
                        </div>
                    </motion.div>
                </AnimatePresence>

                <div className="flex justify-center gap-3 mb-6 flex-wrap">
                    {planTabs.map(({ id, icon: Ic, label }) => (
                        <motion.button key={id} onClick={() => setPlanType(id)}
                            whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.97 }}
                            className="relative flex items-center gap-2 px-6 py-2.5 rounded-full font-black text-sm"
                            style={effectivePlanType === id
                                ? { background: '#e71763', color: 'white', boxShadow: '0 0 22px rgba(231,23,99,0.45)' }
                                : { background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.5)' }}>
                            <Ic className="w-4 h-4" /> {label}
                            {planTabHasSale(id) && <TabSaleDot />}
                        </motion.button>
                    ))}
                </div>

                {effectivePlanType === "basic" && (
                    <div className="flex justify-center gap-2 mb-8">
                        {[{ id: "individual", label: "For Yourself" }, { id: "couple", label: "For a Couple" }].map((v) => (
                            <button key={v.id} onClick={() => setBasicVariant(v.id)}
                                className="px-4 py-1.5 rounded-full text-xs font-bold transition-all"
                                style={basicVariant === v.id
                                    ? { background: 'rgba(231,23,99,0.18)', color: '#e71763', border: '1px solid rgba(231,23,99,0.4)' }
                                    : { background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.4)' }}>
                                {v.label}
                            </button>
                        ))}
                    </div>
                )}

                <AnimatePresence mode="wait">
                    <motion.div key={`${activeTab}-${effectivePlanType}-${effectivePlanType === "basic" ? basicVariant : ""}`}
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        className={effectivePlanType === "basic" ? "max-w-sm mx-auto mb-14" : "grid sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-14"}>
                        {effectivePlanType === "basic" ? (
                            <PricingCard pricingTable={pricingTable} saleFlags={saleFlags} popularFlags={popularFlags}
                                coachingId="online" planType={basicPlanType} duration={basicPseudoDuration}
                                isCouple={basicVariant === "couple"} index={0} />
                        ) : (
                            durations.map((dur, i) => (
                                <PricingCard key={dur.months} pricingTable={pricingTable} saleFlags={saleFlags} popularFlags={popularFlags}
                                    coachingId={activeTab} planType={effectivePlanType} duration={dur}
                                    isCouple={effectivePlanType === "couple"} index={i} />
                            ))
                        )}
                    </motion.div>
                </AnimatePresence>

                <motion.div initial={{ opacity: 0, y: 20 }} animate={isInView ? { opacity: 1, y: 0 } : {}}
                    transition={{ duration: 0.6, delay: 0.4 }} className="text-center">
                    <p className="text-white/35 text-sm mb-6">Not sure which plan fits you? Chat directly with Sudarshan.</p>
                    <motion.a href={wa.pricing} target="_blank" rel="noopener noreferrer"
                        whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.97 }}
                        className="relative inline-flex items-center gap-3 px-8 py-4 rounded-full font-black text-white"
                        style={{ background: '#e71763', boxShadow: '0 0 45px rgba(231,23,99,0.5)' }}>
                        Chat With Sudarshan on WhatsApp <ArrowRight className="w-4 h-4" />
                    </motion.a>
                </motion.div>
            </div>
        </section>
    );
}

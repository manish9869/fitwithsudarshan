import { useState, useRef } from "react";
import { motion, useInView, AnimatePresence } from "framer-motion";
import { Check, Globe, Video, MapPin, Zap, Users, User, ArrowRight, Flame } from "lucide-react";
import { Link } from "react-router-dom";
import { wa } from "@/utils/whatsapp";
import { useSiteData } from "@/contexts/SiteDataContext";

const tabIcons = { online: Globe, video: Video, personal: MapPin };
const formatPrice = (p) =>
    new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(p);

function PricingCard({ pricingTable, coachingId, planType, duration, isPopular, index }) {
    const price = pricingTable[coachingId]?.[planType]?.[duration.months] || 0;
    const [hovered, setHovered] = useState(false);
    // NEW: sale flag comes from the duration record (admin-toggleable, same
    // pattern as `popular`). When true, this card shows a SALE ribbon
    // regardless of which coaching type / plan it's rendered under.
    const onSale = !!duration.onSale;

    return (
        <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: isPopular ? 1.04 : 1 }}
            transition={{ duration: 0.55, delay: index * 0.09, ease: [0.22, 1, 0.36, 1] }}
            whileHover={{ y: -10, scale: isPopular ? 1.07 : 1.04 }}
            onHoverStart={() => setHovered(true)}
            onHoverEnd={() => setHovered(false)}
            className="relative rounded-2xl flex flex-col overflow-hidden"
            style={isPopular
                ? { background: 'linear-gradient(135deg, rgba(231,23,99,0.18) 0%, rgba(231,23,99,0.06) 100%)', border: '1px solid rgba(231,23,99,0.65)', boxShadow: hovered ? '0 0 70px rgba(231,23,99,0.4), 0 25px 60px rgba(0,0,0,0.6)' : '0 0 40px rgba(231,23,99,0.25), 0 10px 30px rgba(0,0,0,0.4)' }
                : onSale
                    ? { background: 'linear-gradient(135deg, rgba(245,158,11,0.14) 0%, rgba(255,255,255,0.03) 100%)', border: '1px solid rgba(245,158,11,0.5)', boxShadow: hovered ? '0 0 60px rgba(245,158,11,0.3)' : '0 0 30px rgba(245,158,11,0.15)' }
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
            {/* NEW: sale ribbon — only shown when not already showing the
                "Most Popular" ribbon, so they never collide on the same card */}
            {!isPopular && onSale && (
                <motion.div
                    className="absolute -top-px left-1/2 -translate-x-1/2 z-10"
                    animate={{ scale: [1, 1.06, 1] }}
                    transition={{ duration: 1.4, repeat: Infinity, ease: 'easeInOut' }}
                >
                    <div className="flex items-center gap-1.5 px-4 py-1 text-xs font-black text-white"
                        style={{ background: '#f59e0b', borderRadius: '0 0 12px 12px', boxShadow: '0 0 14px rgba(245,158,11,0.6)' }}>
                        <Zap className="w-3 h-3" /> Sale
                    </div>
                </motion.div>
            )}

            <div className="p-6 flex flex-col flex-1 pt-8">
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white/35 mb-1">{duration.sublabel}</p>
                <p className="text-lg font-black text-white mb-4">{duration.label}</p>

                <div className="mb-5">
                    <motion.p className="text-4xl font-black leading-none"
                        style={{ color: isPopular ? '#e71763' : onSale ? '#fbbf24' : 'white' }}
                        animate={hovered ? { scale: 1.06 } : { scale: 1 }} transition={{ duration: 0.2 }}>
                        {formatPrice(price)}
                    </motion.p>
                    {planType === "couple" && <p className="text-[11px] text-white/35 mt-1.5">for 2 people · {formatPrice(Math.round(price / 2))}/person</p>}
                </div>

                <p className="text-xs text-white/45 mb-5 leading-relaxed flex-1">{duration.description}</p>

                <div className="space-y-2 mb-6">
                    {["Personalized plan", "WhatsApp check-ins", "Progress tracking", "Expert guidance"].map((b) => (
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
                        style={isPopular
                            ? { background: '#e71763', boxShadow: '0 0 25px rgba(231,23,99,0.45)' }
                            : onSale
                                ? { background: '#f59e0b', boxShadow: '0 0 25px rgba(245,158,11,0.4)' }
                                : { border: `1px solid ${hovered ? 'rgba(231,23,99,0.5)' : 'rgba(255,255,255,0.15)'}`, background: hovered ? 'rgba(231,23,99,0.08)' : 'transparent' }}>
                        Enroll Now <ArrowRight className="inline w-3.5 h-3.5 ml-1" />
                    </motion.button>
                </Link>
            </div>
        </motion.div>
    );
}

function BasicCard({ basicConsultation, variant, index }) {
    if (!basicConsultation) return null;
    const isCouple = variant === 'couple';
    const price = isCouple ? basicConsultation.priceCouple : basicConsultation.priceIndividual;
    const originalPrice = isCouple ? basicConsultation.originalPriceCouple : basicConsultation.originalPriceIndividual;
    const [hovered, setHovered] = useState(false);

    return (
        <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.55, delay: index * 0.09, ease: [0.22, 1, 0.36, 1] }}
            whileHover={{ y: -10, scale: 1.04 }}
            onHoverStart={() => setHovered(true)}
            onHoverEnd={() => setHovered(false)}
            className="relative rounded-2xl flex flex-col overflow-hidden"
            style={{ background: 'linear-gradient(135deg, rgba(231,23,99,0.14) 0%, rgba(231,23,99,0.04) 100%)', border: '1px solid rgba(231,23,99,0.5)', boxShadow: hovered ? '0 0 60px rgba(231,23,99,0.35)' : '0 0 30px rgba(231,23,99,0.18)' }}
        >
            <div className="absolute -top-px left-1/2 -translate-x-1/2">
                <div className="flex items-center gap-1.5 px-4 py-1 text-xs font-black text-white"
                    style={{ background: '#e71763', borderRadius: '0 0 12px 12px' }}>
                    <Flame className="w-3 h-3" /> Hot Sale
                </div>
            </div>

            <div className="p-6 flex flex-col flex-1 pt-8">
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white/35 mb-1">{isCouple ? 'Couple' : 'Individual'}</p>
                <p className="text-lg font-black text-white mb-4">RECODE Blueprint</p>

                <div className="mb-5">
                    <div className="flex items-baseline gap-2 flex-wrap">
                        <motion.p className="text-4xl font-black leading-none" style={{ color: '#e71763' }}
                            animate={hovered ? { scale: 1.06 } : { scale: 1 }} transition={{ duration: 0.2 }}>
                            {formatPrice(price)}
                        </motion.p>
                        <span className="text-lg font-bold text-white/30 line-through">{formatPrice(originalPrice)}</span>
                    </div>
                    <p className="text-[11px] font-bold mt-1.5" style={{ color: '#34d399' }}>
                        Save {formatPrice(originalPrice - price)} · Limited-time offer
                    </p>
                    {isCouple && <p className="text-[11px] text-white/35 mt-1">for 2 people · {formatPrice(Math.round(price / 2))}/person</p>}
                </div>

                <p className="text-xs text-white/45 mb-5 leading-relaxed flex-1">One-time session · {basicConsultation.description}</p>

                <div className="space-y-2 mb-6">
                    {basicConsultation.features.map((b) => (
                        <div key={b} className="flex items-center gap-2">
                            <div className="w-3.5 h-3.5 rounded-full flex items-center justify-center flex-shrink-0"
                                style={{ background: 'rgba(231,23,99,0.15)' }}>
                                <Check className="w-2 h-2" style={{ color: '#e71763' }} />
                            </div>
                            <span className="text-xs text-white/55">{b}</span>
                        </div>
                    ))}
                </div>

                <Link to="/enroll" state={{ coachingId: 'online', planType: isCouple ? 'basic_couple' : 'basic_individual', duration: '1' }}>
                    <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                        className="w-full py-3 rounded-xl font-black text-sm text-white"
                        style={{ background: '#e71763', boxShadow: '0 0 25px rgba(231,23,99,0.45)' }}>
                        RECODE Blueprint <ArrowRight className="inline w-3.5 h-3.5 ml-1" />
                    </motion.button>
                </Link>
            </div>
        </motion.div>
    );
}

export function PricingSection() {
    const { coachingTypes, pricingTable, durations, planInclusions, basicConsultation, loading } = useSiteData();
    const [activeTab, setActiveTab] = useState("online");
    const [planType, setPlanType] = useState("individual");
    const [basicVariant, setBasicVariant] = useState("individual");
    const ref = useRef(null);
    const isInView = useInView(ref, { once: true, margin: "-60px" });

    if (loading || !coachingTypes.length) {
        return <section id="pricing" className="relative py-28 text-center text-white/30 text-sm">Loading pricing…</section>;
    }

    const activeCoaching = coachingTypes.find((c) => c.id === activeTab) || coachingTypes[0];
    const Icon = tabIcons[activeCoaching.id] || Globe;
    const isBasicSelected = planType === "basic";

    const handleTabChange = (id) => {
        setActiveTab(id);
        if (id !== 'online' && isBasicSelected) setPlanType('individual');
    };

    return (
        <section id="pricing" className="relative py-28 overflow-hidden">
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
                            <motion.button key={ct.id} onClick={() => handleTabChange(ct.id)}
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
                    {[
                        { id: "individual", icon: User, label: "Individual" },
                        { id: "couple", icon: Users, label: "Couple" },
                    ].map(({ id, icon: Ic, label }) => (
                        <motion.button key={id} onClick={() => setPlanType(id)}
                            whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.97 }}
                            className="flex items-center gap-2 px-6 py-2.5 rounded-full font-black text-sm"
                            style={planType === id
                                ? { background: '#e71763', color: 'white', boxShadow: '0 0 22px rgba(231,23,99,0.45)' }
                                : { background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.5)' }}>
                            <Ic className="w-4 h-4" /> {label}
                        </motion.button>
                    ))}

                    {activeTab === "online" && basicConsultation && (
                        <motion.button onClick={() => setPlanType("basic")}
                            whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.97 }}
                            className="relative flex items-center gap-2 px-6 py-2.5 rounded-full font-black text-sm"
                            style={planType === "basic"
                                ? { background: '#e71763', color: 'white', boxShadow: '0 0 22px rgba(231,23,99,0.45)' }
                                : { background: 'rgba(255,255,255,0.04)', border: '1.5px solid rgba(231,23,99,0.45)', color: 'rgba(255,255,255,0.75)' }}>
                            <Zap className="w-4 h-4" /> Basic
                            <motion.span className="absolute -top-3 -right-3 flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-black text-white whitespace-nowrap"
                                style={{ background: '#e71763', boxShadow: '0 0 12px rgba(231,23,99,0.8)' }}
                                animate={{ scale: [1, 1.18, 1], opacity: [1, 0.7, 1] }}
                                transition={{ duration: 1.1, repeat: Infinity, ease: 'easeInOut' }}>
                                <Flame className="w-2.5 h-2.5" /> SALE
                            </motion.span>
                        </motion.button>
                    )}
                </div>

                {isBasicSelected && (
                    <div className="flex justify-center gap-2 mb-10">
                        {[
                            { id: "individual", icon: User, label: "Individual" },
                            { id: "couple", icon: Users, label: "Couple" },
                        ].map(({ id, icon: Ic, label }) => (
                            <motion.button key={id} onClick={() => setBasicVariant(id)}
                                whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.97 }}
                                className="flex items-center gap-1.5 px-5 py-2 rounded-full font-bold text-xs"
                                style={basicVariant === id
                                    ? { background: 'rgba(231,23,99,0.18)', color: 'white', border: '1px solid rgba(231,23,99,0.5)' }
                                    : { background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.45)' }}>
                                <Ic className="w-3.5 h-3.5" /> {label}
                            </motion.button>
                        ))}
                    </div>
                )}
                {!isBasicSelected && <div className="mb-10" />}

                <AnimatePresence mode="wait">
                    {isBasicSelected ? (
                        <motion.div key={`basic-${basicVariant}`} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                            className="grid max-w-sm mx-auto gap-5 mb-14">
                            <BasicCard basicConsultation={basicConsultation} variant={basicVariant} index={0} />
                        </motion.div>
                    ) : (
                        <motion.div key={`${activeTab}-${planType}`} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                            className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-14">
                            {durations.map((dur, i) => (
                                <PricingCard key={dur.months} pricingTable={pricingTable} coachingId={activeTab} planType={planType} duration={dur} isPopular={!!dur.popular} index={i} />
                            ))}
                        </motion.div>
                    )}
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

// NEW: default export so pages that do
// `import ProgramsSection from '@/components/landing/ProgramsSection'`
// (e.g. src/pages/Programs.jsx) don't render `undefined` and crash.
export default PricingSection;
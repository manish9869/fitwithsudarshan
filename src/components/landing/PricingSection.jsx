import { useState, useRef } from "react";
import { motion, useInView, AnimatePresence } from "framer-motion";
import { Check, Globe, Video, MapPin, Zap, Users, User, ArrowRight, Flame } from "lucide-react";
import { coachingTypes, pricingTable, durations, planInclusions, basicConsultation } from "@/data/SiteData";
import { Link } from "react-router-dom";

const tabIcons = { online: Globe, video: Video, personal: MapPin };
const formatPrice = (p) =>
    new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(p);

function PricingCard({ coachingId, planType, duration, isPopular, index }) {
    const price = pricingTable[coachingId]?.[planType]?.[duration.months] || 0;
    const [hovered, setHovered] = useState(false);

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
                : { background: 'rgba(255,255,255,0.03)', border: `1px solid ${hovered ? 'rgba(231,23,99,0.4)' : 'rgba(255,255,255,0.07)'}`, boxShadow: hovered ? '0 25px 60px rgba(0,0,0,0.5)' : 'none' }
            }
        >
            {/* Top glow line on popular */}
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

            <div className="p-6 flex flex-col flex-1 pt-8">
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white/35 mb-1">{duration.sublabel}</p>
                <p className="text-lg font-black text-white mb-4">{duration.label}</p>

                <div className="mb-5">
                    <motion.p className="text-4xl font-black leading-none"
                        style={{ color: isPopular ? '#e71763' : 'white' }}
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
                            : { border: `1px solid ${hovered ? 'rgba(231,23,99,0.5)' : 'rgba(255,255,255,0.15)'}`, background: hovered ? 'rgba(231,23,99,0.08)' : 'transparent' }}>
                        Enroll Now <ArrowRight className="inline w-3.5 h-3.5 ml-1" />
                    </motion.button>
                </Link>
            </div>
        </motion.div>
    );
}

// ── Basic consultation card ─────────────────────────────────────────────────
// "One-time" only appears inside the description text now, not as a tab/badge,
// so the plan-type row stays clean: Individual / Couple / Basic.
function BasicCard({ variant, index }) {
    // variant: 'individual' | 'couple'
    const isCouple = variant === 'couple';
    const price = isCouple ? basicConsultation.priceCouple : basicConsultation.priceIndividual;
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
            style={{ background: 'rgba(255,255,255,0.03)', border: `1px solid ${hovered ? 'rgba(231,23,99,0.4)' : 'rgba(255,255,255,0.07)'}`, boxShadow: hovered ? '0 25px 60px rgba(0,0,0,0.5)' : 'none' }}
        >
            <div className="p-6 flex flex-col flex-1 pt-8">
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white/35 mb-1">{isCouple ? 'Couple' : 'Individual'}</p>
                <p className="text-lg font-black text-white mb-4">Basic Consultation</p>

                <div className="mb-5">
                    <motion.p className="text-4xl font-black leading-none" style={{ color: 'white' }}
                        animate={hovered ? { scale: 1.06 } : { scale: 1 }} transition={{ duration: 0.2 }}>
                        {formatPrice(price)}
                    </motion.p>
                    {isCouple && <p className="text-[11px] text-white/35 mt-1.5">for 2 people · {formatPrice(Math.round(price / 2))}/person</p>}
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
                        style={{ border: `1px solid ${hovered ? 'rgba(231,23,99,0.5)' : 'rgba(255,255,255,0.15)'}`, background: hovered ? 'rgba(231,23,99,0.08)' : 'transparent' }}>
                        Book Consultation <ArrowRight className="inline w-3.5 h-3.5 ml-1" />
                    </motion.button>
                </Link>
            </div>
        </motion.div>
    );
}

export function PricingSection() {
    const [activeTab, setActiveTab] = useState("online");
    const [planType, setPlanType] = useState("individual");
    // 'basic' is its own top-level category now; basicVariant tracks individual/couple within it
    const [basicVariant, setBasicVariant] = useState("individual");
    const ref = useRef(null);
    const isInView = useInView(ref, { once: true, margin: "-60px" });
    const activeCoaching = coachingTypes.find((c) => c.id === activeTab);
    const Icon = tabIcons[activeTab];

    const isBasicSelected = planType === "basic";

    const handleTabChange = (id) => {
        setActiveTab(id);
        // Basic only exists under Online — reset plan type if leaving online while on basic
        if (id !== 'online' && isBasicSelected) {
            setPlanType('individual');
        }
    };

    return (
        <section id="pricing" className="relative py-28 overflow-hidden">
            {/* Background atmosphere */}
            <div className="absolute inset-0 pointer-events-none">
                <motion.div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[1000px] h-[700px] rounded-full blur-[140px]"
                    style={{ background: 'radial-gradient(ellipse, rgba(231,23,99,0.1) 0%, transparent 70%)' }}
                    animate={{ scale: [1, 1.2, 1], opacity: [0.5, 1, 0.5] }}
                    transition={{ duration: 7, repeat: Infinity, ease: "easeInOut" }} />
                <motion.div className="absolute top-10 left-10 w-64 h-64 rounded-full blur-3xl"
                    style={{ background: 'rgba(231,23,99,0.06)' }}
                    animate={{ scale: [1, 1.4, 1], opacity: [0.4, 0.8, 0.4] }}
                    transition={{ duration: 9, repeat: Infinity, delay: 1 }} />
                <motion.div className="absolute bottom-10 right-10 w-80 h-80 rounded-full blur-3xl"
                    style={{ background: 'rgba(231,23,99,0.05)' }}
                    animate={{ scale: [1, 1.3, 1], opacity: [0.3, 0.7, 0.3] }}
                    transition={{ duration: 11, repeat: Infinity, delay: 3 }} />
                {/* Diagonal line texture */}
                <svg className="absolute inset-0 w-full h-full" style={{ opacity: 0.025 }} xmlns="http://www.w3.org/2000/svg">
                    <defs>
                        <pattern id="priceDiag" patternUnits="userSpaceOnUse" width="60" height="60" patternTransform="rotate(45)">
                            <line x1="0" y1="0" x2="0" y2="60" stroke="#e71763" strokeWidth="1" />
                        </pattern>
                    </defs>
                    <rect width="100%" height="100%" fill="url(#priceDiag)" />
                </svg>
            </div>

            <div ref={ref} className="relative container mx-auto px-4 max-w-6xl">

                {/* Header */}
                <motion.div initial={{ opacity: 0, y: 40 }} animate={isInView ? { opacity: 1, y: 0 } : {}}
                    transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }} className="text-center mb-16">
                    <motion.span className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-[0.25em] px-4 py-2 rounded-full mb-6"
                        style={{ color: '#e71763', border: '1px solid rgba(231,23,99,0.3)', background: 'rgba(231,23,99,0.08)' }}
                        animate={{ boxShadow: ['0 0 0px rgba(231,23,99,0)', '0 0 25px rgba(231,23,99,0.35)', '0 0 0px rgba(231,23,99,0)'] }}
                        transition={{ duration: 3, repeat: Infinity }}>
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

                {/* Inclusions bar */}
                <motion.div initial={{ opacity: 0, y: 24 }} animate={isInView ? { opacity: 1, y: 0 } : {}}
                    transition={{ duration: 0.6, delay: 0.1 }}
                    className="relative rounded-2xl p-6 mb-14 overflow-hidden"
                    style={{ background: 'rgba(231,23,99,0.04)', border: '1px solid rgba(231,23,99,0.18)' }}>
                    <motion.div className="absolute inset-0 pointer-events-none rounded-2xl"
                        style={{ background: 'linear-gradient(135deg, rgba(231,23,99,0.07) 0%, transparent 60%)' }}
                        animate={{ opacity: [0.4, 1, 0.4] }} transition={{ duration: 4, repeat: Infinity }} />
                    <p className="text-[10px] font-black uppercase tracking-widest text-center mb-4" style={{ color: '#e71763' }}>Every Plan Includes</p>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                        {planInclusions.slice(0, 8).map((item, i) => (
                            <motion.div key={item}
                                initial={{ opacity: 0, scale: 0.85 }} animate={isInView ? { opacity: 1, scale: 1 } : {}}
                                transition={{ delay: 0.15 + i * 0.05 }}
                                className="flex items-center gap-2 px-3 py-2 rounded-lg"
                                style={{ background: 'rgba(255,255,255,0.025)' }}>
                                <Check className="w-3 h-3 flex-shrink-0" style={{ color: '#e71763' }} />
                                <span className="text-xs text-white/65">{item}</span>
                            </motion.div>
                        ))}
                    </div>
                </motion.div>

                {/* Coaching type tabs */}
                <motion.div initial={{ opacity: 0, y: 20 }} animate={isInView ? { opacity: 1, y: 0 } : {}}
                    transition={{ duration: 0.6, delay: 0.15 }}
                    className="flex gap-3 justify-center mb-6 flex-wrap">
                    {coachingTypes.map((ct) => {
                        const TabIcon = tabIcons[ct.id];
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
                                {active && <motion.span layoutId="tabDot" className="w-1.5 h-1.5 rounded-full bg-white" />}
                            </motion.button>
                        );
                    })}
                </motion.div>

                {/* Coaching info panel */}
                <AnimatePresence mode="wait">
                    <motion.div key={activeTab}
                        initial={{ opacity: 0, y: 14, scale: 0.97 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -14, scale: 0.97 }}
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
                            {activeCoaching.features.slice(0, 6).map((f, i) => (
                                <motion.div key={f} initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }}
                                    className="flex items-start gap-2">
                                    <Check className="w-3 h-3 text-primary flex-shrink-0 mt-0.5" />
                                    <span className="text-xs text-white/60">{f}</span>
                                </motion.div>
                            ))}
                        </div>
                    </motion.div>
                </AnimatePresence>

                {/* Individual / Couple / Basic — clean 3-way toggle (no "one-time" or price text in the tab itself) */}
                <div className="flex justify-center gap-3 mb-6 flex-wrap">
                    {[
                        { id: "individual", icon: User, label: "Individual" },
                        { id: "couple", icon: Users, label: "Couple" },
                        ...(activeTab === "online" ? [{ id: "basic", icon: Zap, label: "Basic" }] : []),
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
                </div>

                {/* Basic sub-toggle — only shown once "Basic" is selected. Simple Individual/Couple choice. */}
                <AnimatePresence>
                    {isBasicSelected && (
                        <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            transition={{ duration: 0.2 }}
                            className="overflow-hidden"
                        >
                            <div className="flex justify-center mb-2">
                                <p className="text-xs text-white/30 mb-3 text-center max-w-sm">
                                    One-time consultation — pick who it's for.
                                </p>
                            </div>
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
                        </motion.div>
                    )}
                </AnimatePresence>

                {!isBasicSelected && <div className="mb-10" />}

                {/* Pricing cards */}
                <AnimatePresence mode="wait">
                    {isBasicSelected ? (
                        <motion.div key={`basic-${basicVariant}`}
                            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                            transition={{ duration: 0.2 }}
                            className="grid max-w-sm mx-auto gap-5 mb-14">
                            <BasicCard variant={basicVariant} index={0} />
                        </motion.div>
                    ) : (
                        <motion.div key={`${activeTab}-${planType}`}
                            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                            transition={{ duration: 0.2 }}
                            className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-14">
                            {durations.map((dur, i) => (
                                <PricingCard key={dur.months} coachingId={activeTab} planType={planType} duration={dur} isPopular={!!dur.popular} index={i} />
                            ))}
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* CTA */}
                <motion.div initial={{ opacity: 0, y: 20 }} animate={isInView ? { opacity: 1, y: 0 } : {}}
                    transition={{ duration: 0.6, delay: 0.4 }} className="text-center">
                    <p className="text-white/35 text-sm mb-6">Not sure which plan fits you? Chat directly with Sudarshan.</p>
                    <div className="relative inline-flex">
                        <motion.span className="absolute inset-0 rounded-full"
                            animate={{ scale: [1, 1.7, 2.4], opacity: [0.5, 0.2, 0] }}
                            transition={{ duration: 2.5, repeat: Infinity, ease: "easeOut" }}
                            style={{ background: 'rgba(231,23,99,0.28)' }} />
                        <motion.a href="https://wa.me/919619708124" target="_blank" rel="noopener noreferrer"
                            whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.97 }}
                            className="relative flex items-center gap-3 px-8 py-4 rounded-full font-black text-white"
                            style={{ background: '#e71763', boxShadow: '0 0 45px rgba(231,23,99,0.5)' }}>
                            Chat With Sudarshan on WhatsApp <ArrowRight className="w-4 h-4" />
                        </motion.a>
                    </div>
                </motion.div>
            </div>
        </section>
    );
}
import { useRef } from "react";
import { motion, useInView } from "framer-motion";
import { coach, recodeMethod, targetAudience, whyRecode } from "@/data/SiteData";
import { CheckCircle2, XCircle, Zap, ArrowRight, Sparkles, Target, Dumbbell, Activity, Flame, Heart, Timer, Scale } from "lucide-react";

// Tiny scattered fitness icons for blank space atmosphere
const fitnessIconSet = [Dumbbell, Activity, Flame, Heart, Timer, Scale, Target];
function ScatteredIcons({ count = 8, sectionSeed = 0 }) {
    return (
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
            {Array.from({ length: count }).map((_, i) => {
                const Icon = fitnessIconSet[(i + sectionSeed) % fitnessIconSet.length];
                const leftPos = 5 + ((i * 13 + sectionSeed * 7) % 90);
                const topPos = 5 + ((i * 17 + sectionSeed * 5) % 85);
                return (
                    <motion.div key={i} className="absolute"
                        style={{ left: `${leftPos}%`, top: `${topPos}%`, opacity: 0.04 }}
                        animate={{ y: [0, -14, 0], rotate: [0, i % 2 === 0 ? 12 : -12, 0], scale: [0.9, 1.1, 0.9] }}
                        transition={{ duration: 8 + i * 0.7, repeat: Infinity, delay: i * 0.6, ease: "easeInOut" }}>
                        <Icon className="w-8 h-8 text-primary" />
                    </motion.div>
                );
            })}
        </div>
    );
}

function SectionAtmosphere({ children }) {
    return (
        <div className="relative">
            <div className="absolute inset-0 pointer-events-none overflow-hidden">
                {Array.from({ length: 6 }).map((_, i) => (
                    <motion.div key={i} className="absolute top-0 bottom-0 w-px"
                        style={{ left: `${(i + 1) * 14.28}%`, background: 'linear-gradient(to bottom, transparent 0%, rgba(231,23,99,0.08) 40%, rgba(231,23,99,0.12) 50%, rgba(231,23,99,0.08) 60%, transparent 100%)' }}
                        animate={{ opacity: [0, 1, 0] }}
                        transition={{ duration: 5 + i, repeat: Infinity, delay: i * 0.7, ease: "easeInOut" }} />
                ))}
            </div>
            {children}
        </div>
    );
}

function Orb({ style, delay = 0, duration = 8 }) {
    return (
        <motion.div className="absolute rounded-full blur-3xl pointer-events-none"
            style={style}
            animate={{ scale: [1, 1.25, 1], opacity: [0.4, 0.9, 0.4] }}
            transition={{ duration, repeat: Infinity, ease: "easeInOut", delay }} />
    );
}

function MagneticCard({ children, className, style, hoverStyle }) {
    const ref = useRef(null);

    const handleMove = (e) => {
        const el = ref.current;
        if (!el) return;
        const rect = el.getBoundingClientRect();
        const x = e.clientX - rect.left - rect.width / 2;
        const y = e.clientY - rect.top - rect.height / 2;
        el.style.transform = `perspective(800px) rotateY(${x / 22}deg) rotateX(${-y / 22}deg) translateZ(8px)`;
        el.style.transition = 'transform 0.1s ease';
    };
    const handleLeave = (e) => {
        const el = ref.current;
        if (!el) return;
        el.style.transform = 'perspective(800px) rotateY(0deg) rotateX(0deg) translateZ(0px)';
        el.style.transition = 'transform 0.5s ease';
    };

    return (
        <div ref={ref} className={className} style={style}
            onMouseMove={handleMove} onMouseLeave={handleLeave}>
            {children}
        </div>
    );
}

export default function FeaturesSection() {
    const coachRef = useRef(null);
    const recodeRef = useRef(null);
    const whyRef = useRef(null);
    const audienceRef = useRef(null);

    const coachInView = useInView(coachRef, { once: true, margin: "-60px" });
    const recodeInView = useInView(recodeRef, { once: true, margin: "-60px" });
    const whyInView = useInView(whyRef, { once: true, margin: "-60px" });
    const audienceInView = useInView(audienceRef, { once: true, margin: "-60px" });

    return (
        <section id="about" className="relative overflow-hidden bg-background">

            {/* ═══ MEET SUDARSHAN ═══ */}
            <SectionAtmosphere>
                <div className="absolute inset-0 pointer-events-none">
                    <Orb style={{ left: '-10%', top: '20%', width: 500, height: 500, background: 'rgba(231,23,99,0.07)' }} delay={0} />
                    <Orb style={{ right: '-5%', top: '60%', width: 350, height: 350, background: 'rgba(231,23,99,0.05)' }} delay={3} />
                    <ScatteredIcons count={5} sectionSeed={0} />
                </div>

                {/* FIX: py-12 sm:py-20 md:py-32 instead of py-24 md:py-32 */}
                <div ref={coachRef} className="relative py-12 sm:py-20 md:py-32">
                    <div className="container mx-auto px-4 max-w-6xl">

                        <motion.div initial={{ opacity: 0, y: 20 }} animate={coachInView ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.6 }}
                            className="mb-10 sm:mb-14">
                            <motion.span className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-[0.25em] px-4 py-2 rounded-full"
                                style={{ color: '#e71763', border: '1px solid rgba(231,23,99,0.28)', background: 'rgba(231,23,99,0.07)' }}
                                animate={{ boxShadow: ['0 0 0px transparent', '0 0 20px rgba(231,23,99,0.3)', '0 0 0px transparent'] }}
                                transition={{ duration: 3, repeat: Infinity }}>
                                <Zap className="w-3 h-3" /> About The Coach
                            </motion.span>
                        </motion.div>

                        <div className="grid lg:grid-cols-[420px_1fr] gap-10 sm:gap-14 items-start">

                            {/* Photo */}
                            <motion.div initial={{ opacity: 0, x: -60 }} animate={coachInView ? { opacity: 1, x: 0 } : {}}
                                transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }} className="relative">
                                <div className="absolute -inset-6 rounded-[32px] blur-3xl pointer-events-none"
                                    style={{ background: 'radial-gradient(ellipse at 40% 50%, rgba(231,23,99,0.22) 0%, transparent 70%)' }} />
                                {/* FIX: added maxHeight to prevent excessively tall image on mobile */}
                                <MagneticCard className="relative rounded-3xl overflow-hidden cursor-default"
                                    style={{ aspectRatio: '3/4', maxHeight: '420px', border: '1px solid rgba(231,23,99,0.3)', boxShadow: '0 0 60px rgba(231,23,99,0.15), 0 40px 80px rgba(0,0,0,0.6)' }}>
                                    <img src="https://vducmiggraxtqdgt.public.blob.vercel-storage.com/sudarshan.jpeg"
                                        alt={coach.name} className="absolute inset-0 w-full h-full object-cover object-center" />
                                    <div className="absolute inset-0" style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.95) 0%, rgba(0,0,0,0.15) 45%, transparent 70%)' }} />
                                    <div className="absolute bottom-0 left-0 right-0 p-6">
                                        <h3 className="text-2xl font-black text-white">{coach.name}</h3>
                                        <p className="text-sm font-bold mt-0.5" style={{ color: '#e71763' }}>Founder, RECODE™</p>
                                        <p className="text-xs mt-1 text-white/40">{coach.certifications?.[0]}</p>
                                    </div>
                                    <motion.div initial={{ opacity: 0, scale: 0.7 }} animate={coachInView ? { opacity: 1, scale: 1 } : {}} transition={{ delay: 0.7, type: 'spring' }}
                                        className="absolute top-4 right-4 rounded-xl px-3 py-2"
                                        style={{ background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(16px)', border: '1px solid rgba(231,23,99,0.45)' }}>
                                        <p className="text-[10px] text-white/40 leading-none mb-0.5">Transformation</p>
                                        <p className="font-black text-sm" style={{ color: '#e71763' }}>85kg → 56kg</p>
                                    </motion.div>
                                    <motion.div initial={{ opacity: 0, scale: 0.7 }} animate={coachInView ? { opacity: 1, scale: 1 } : {}} transition={{ delay: 0.8, type: 'spring' }}
                                        className="absolute top-4 left-4 rounded-xl px-3 py-2"
                                        style={{ background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(16px)', border: '1px solid rgba(231,23,99,0.45)' }}>
                                        <p className="text-[10px] text-white/40 leading-none mb-0.5">Clients Guided</p>
                                        <p className="font-black text-sm" style={{ color: '#e71763' }}>200+</p>
                                    </motion.div>
                                </MagneticCard>

                                <div className="grid grid-cols-2 gap-3 mt-4">
                                    {(coach.stats || []).slice(0, 2).map((s, i) => (
                                        <motion.div key={s.label}
                                            initial={{ opacity: 0, y: 16 }} animate={coachInView ? { opacity: 1, y: 0 } : {}}
                                            transition={{ delay: 0.9 + i * 0.1 }}
                                            whileHover={{ scale: 1.05, borderColor: 'rgba(231,23,99,0.5)' }}
                                            className="rounded-xl p-4 text-center cursor-default"
                                            style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', transition: 'all 0.3s' }}>
                                            <p className="text-2xl font-black" style={{ color: '#e71763' }}>{s.value}</p>
                                            <p className="text-[10px] text-white/35 mt-0.5">{s.label}</p>
                                        </motion.div>
                                    ))}
                                </div>
                            </motion.div>

                            {/* Bio */}
                            <motion.div initial={{ opacity: 0, x: 60 }} animate={coachInView ? { opacity: 1, x: 0 } : {}}
                                transition={{ duration: 0.8, delay: 0.15, ease: [0.22, 1, 0.36, 1] }} className="space-y-8 pt-2">
                                <div>
                                    {/* FIX: text-3xl sm:text-5xl md:text-7xl — was text-5xl md:text-7xl (too big at 320px) */}
                                    <h2 className="text-3xl sm:text-5xl md:text-7xl font-black leading-[0.92] text-white mb-6">
                                        Meet<br />
                                        <motion.span style={{ color: '#e71763' }}
                                            animate={{ textShadow: ['0 0 20px rgba(231,23,99,0.3)', '0 0 50px rgba(231,23,99,0.6)', '0 0 20px rgba(231,23,99,0.3)'] }}
                                            transition={{ duration: 3, repeat: Infinity }}>
                                            Sudarshan
                                        </motion.span>
                                        <br />Chavan
                                    </h2>
                                    <div className="flex items-center gap-3 mb-6">
                                        <div className="h-0.5 w-12 rounded-full" style={{ background: '#e71763' }} />
                                        <span className="text-xs text-white/30 font-semibold tracking-widest uppercase">ACSM Certified · 8+ Years</span>
                                    </div>
                                    <p className="text-white/65 leading-relaxed text-base mb-3">{coach.shortBio}</p>
                                    <p className="text-white/40 leading-relaxed text-sm">{coach.longBio}</p>
                                </div>

                                <div className="space-y-2.5">
                                    {[
                                        "ACSM Certified with 8+ years of real-world coaching experience",
                                        "Lost 29kg himself — trained from 85kg down to 56kg",
                                        "Guided 200+ clients across India to sustainable transformation",
                                        "Creator of RECODE™ — a 5-pillar recovery-first system",
                                        "Coaches professionals, students, couples & families online & in-person",
                                    ].map((point, i) => (
                                        <motion.div key={i}
                                            initial={{ opacity: 0, x: 24 }} animate={coachInView ? { opacity: 1, x: 0 } : {}}
                                            transition={{ delay: 0.35 + i * 0.09, ease: [0.22, 1, 0.36, 1] }}
                                            whileHover={{ x: 6, borderColor: 'rgba(231,23,99,0.35)' }}
                                            className="flex items-start gap-3 rounded-xl px-4 py-3 cursor-default"
                                            style={{ background: 'rgba(231,23,99,0.035)', border: '1px solid rgba(231,23,99,0.1)', transition: 'all 0.25s' }}>
                                            <ArrowRight className="w-4 h-4 flex-shrink-0 mt-0.5" style={{ color: '#e71763' }} />
                                            <p className="text-sm text-white/75">{point}</p>
                                        </motion.div>
                                    ))}
                                </div>
                            </motion.div>
                        </div>
                    </div>
                </div>
            </SectionAtmosphere>

            {/* ═══ WHAT IS RECODE™ ═══ */}
            <SectionAtmosphere>
                <div className="absolute inset-0 pointer-events-none">
                    <motion.div className="absolute inset-0"
                        style={{ background: 'radial-gradient(ellipse 80% 50% at 50% 50%, rgba(231,23,99,0.07) 0%, transparent 70%)' }}
                        animate={{ opacity: [0.5, 1, 0.5] }} transition={{ duration: 6, repeat: Infinity }} />
                    <Orb style={{ left: '55%', top: '10%', width: 400, height: 400, background: 'rgba(231,23,99,0.06)' }} delay={2} />
                    <Orb style={{ left: '5%', bottom: '5%', width: 300, height: 300, background: 'rgba(231,23,99,0.04)' }} delay={4} />
                    <ScatteredIcons count={4} sectionSeed={1} />
                </div>

                {/* FIX: py-12 sm:py-20 md:py-32 */}
                <div ref={recodeRef} className="relative py-12 sm:py-20 md:py-32">
                    <div className="container mx-auto px-4 max-w-6xl">
                        <div className="grid lg:grid-cols-2 gap-12 sm:gap-20 items-start">

                            {/* Left */}
                            <motion.div initial={{ opacity: 0, y: 40 }} animate={recodeInView ? { opacity: 1, y: 0 } : {}}
                                transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}>
                                <motion.span className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-[0.25em] px-4 py-2 rounded-full mb-8"
                                    style={{ color: '#e71763', border: '1px solid rgba(231,23,99,0.28)', background: 'rgba(231,23,99,0.07)' }}
                                    animate={{ boxShadow: ['0 0 0px transparent', '0 0 20px rgba(231,23,99,0.3)', '0 0 0px transparent'] }}
                                    transition={{ duration: 3, repeat: Infinity }}>
                                    <Sparkles className="w-3 h-3" /> The System
                                </motion.span>

                                {/* FIX: text-3xl sm:text-5xl md:text-7xl */}
                                <h2 className="text-3xl sm:text-5xl md:text-7xl font-black leading-[0.92] text-white mb-6">
                                    What is<br />
                                    <motion.span style={{ color: '#e71763' }}
                                        animate={{ textShadow: ['0 0 20px rgba(231,23,99,0.3)', '0 0 60px rgba(231,23,99,0.65)', '0 0 20px rgba(231,23,99,0.3)'] }}
                                        transition={{ duration: 3.5, repeat: Infinity }}>
                                        RECODE™
                                    </motion.span>
                                    <span className="text-white">?</span>
                                </h2>
                                <div className="flex items-center gap-3 mb-6">
                                    <div className="h-0.5 w-12 rounded-full" style={{ background: '#e71763' }} />
                                    <span className="text-xs text-white/30 font-semibold tracking-widest uppercase">Recovery-First Transformation</span>
                                </div>
                                <p className="text-white/55 leading-relaxed text-sm mb-10">
                                    RECODE™ is a recovery-based transformation system designed to restore structure, regulate the body, and create sustainable physical transformation — without extreme dieting or unsustainable training.
                                </p>

                                {/* RECODE acronym */}
                                <div className="space-y-2.5">
                                    {[
                                        { letter: "R", word: "Recovery", desc: "Rest, sleep and stress regulation first" },
                                        { letter: "E", word: "Energy", desc: "Restore metabolic health and vitality" },
                                        { letter: "C", word: "Control", desc: "Build sustainable habits and discipline" },
                                        { letter: "O", word: "Optimisation", desc: "Dial in training, nutrition, performance" },
                                        { letter: "D", word: "Direction", desc: "Personalized roadmap for your goals" },
                                        { letter: "E", word: "Evolution", desc: "Long-term growth beyond the program" },
                                    ].map((item, i) => (
                                        <motion.div key={i}
                                            initial={{ opacity: 0, x: -20 }} animate={recodeInView ? { opacity: 1, x: 0 } : {}}
                                            transition={{ delay: 0.1 + i * 0.08, ease: [0.22, 1, 0.36, 1] }}
                                            whileHover={{ x: 6, background: 'rgba(231,23,99,0.07)' }}
                                            className="flex items-center gap-4 rounded-xl px-3 py-2.5 cursor-default"
                                            style={{ transition: 'all 0.25s' }}>
                                            <span className="w-8 h-8 rounded-lg flex items-center justify-center text-sm font-black flex-shrink-0"
                                                style={{ background: 'rgba(231,23,99,0.14)', color: '#e71763', border: '1px solid rgba(231,23,99,0.3)' }}>
                                                {item.letter}
                                            </span>
                                            <span className="font-bold text-white/90 text-sm w-24">{item.word}</span>
                                            <span className="text-xs text-white/35">{item.desc}</span>
                                        </motion.div>
                                    ))}
                                </div>
                            </motion.div>

                            {/* Right — 5R timeline */}
                            <motion.div initial={{ opacity: 0, x: 40 }} animate={recodeInView ? { opacity: 1, x: 0 } : {}}
                                transition={{ duration: 0.7, delay: 0.15, ease: [0.22, 1, 0.36, 1] }} className="relative">
                                <motion.div className="absolute top-0 bottom-6 w-0.5 rounded-full"
                                    style={{ background: 'linear-gradient(to bottom, #e71763 0%, rgba(231,23,99,0.2) 100%)' }}
                                    initial={{ scaleY: 0, originY: 0 }}
                                    animate={recodeInView ? { scaleY: 1 } : {}}
                                    transition={{ duration: 1.2, delay: 0.4 }} />

                                <div className="space-y-4">
                                    {recodeMethod.map((r, i) => (
                                        <MagneticCard key={r.title}
                                            className="relative flex items-start gap-4 p-5 rounded-2xl cursor-default"
                                            style={{ background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.06)' }}>
                                            <motion.div
                                                initial={{ opacity: 0, scale: 0.5 }} animate={recodeInView ? { opacity: 1, scale: 1 } : {}}
                                                transition={{ delay: 0.5 + i * 0.1, type: 'spring', stiffness: 200 }}
                                                className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 z-10"
                                                style={{ background: 'linear-gradient(135deg, rgba(231,23,99,0.3), rgba(231,23,99,0.08))', border: '1px solid rgba(231,23,99,0.5)' }}>
                                                <span className="text-xs font-black" style={{ color: '#e71763' }}>{r.step}</span>
                                            </motion.div>
                                            <motion.div initial={{ opacity: 0, x: 12 }} animate={recodeInView ? { opacity: 1, x: 0 } : {}}
                                                transition={{ delay: 0.55 + i * 0.1 }}>
                                                <h3 className={`text-sm font-black mb-1 tracking-wide ${r.accent || 'text-primary'}`}>{r.title}</h3>
                                                <p className="text-xs text-white/45 leading-relaxed">{r.description}</p>
                                            </motion.div>
                                        </MagneticCard>
                                    ))}
                                </div>
                            </motion.div>
                        </div>
                    </div>
                </div>
            </SectionAtmosphere>

            {/* ═══ WHY RECODE IS DIFFERENT ═══ */}
            <SectionAtmosphere>
                <div className="absolute inset-0 pointer-events-none">
                    <Orb style={{ left: '50%', top: '50%', transform: 'translate(-50%,-50%)', width: 700, height: 500, background: 'rgba(231,23,99,0.06)' }} delay={0} />
                    <ScatteredIcons count={4} sectionSeed={3} />
                </div>

                {/* FIX: py-12 sm:py-20 md:py-28 */}
                <div ref={whyRef} className="relative py-12 sm:py-20 md:py-28 overflow-hidden">
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none select-none overflow-hidden">
                        <span className="text-[18vw] font-black tracking-tighter whitespace-nowrap"
                            style={{ color: 'rgba(231,23,99,0.03)', transform: 'rotate(-8deg)' }}>
                            RECODE™
                        </span>
                    </div>

                    <div className="container mx-auto px-4 max-w-5xl relative">
                        <motion.div initial={{ opacity: 0, y: 30 }} animate={whyInView ? { opacity: 1, y: 0 } : {}}
                            transition={{ duration: 0.7 }} className="text-center mb-10 sm:mb-16">
                            <motion.span className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-[0.25em] px-4 py-2 rounded-full mb-6"
                                style={{ color: '#e71763', border: '1px solid rgba(231,23,99,0.28)', background: 'rgba(231,23,99,0.07)' }}>
                                <Target className="w-3 h-3" /> Why It Works
                            </motion.span>
                            {/* FIX: text-2xl sm:text-4xl md:text-6xl */}
                            <h3 className="text-2xl sm:text-4xl md:text-6xl font-black text-white">
                                Why <motion.span style={{ color: '#e71763' }}
                                    animate={{ textShadow: ['0 0 20px rgba(231,23,99,0.3)', '0 0 60px rgba(231,23,99,0.7)', '0 0 20px rgba(231,23,99,0.3)'] }}
                                    transition={{ duration: 3, repeat: Infinity }}>RECODE</motion.span> is different
                            </h3>
                        </motion.div>

                        <div className="space-y-4">
                            {[
                                ...(whyRecode.others || []).map((other, i) => ({
                                    bad: other,
                                    good: (whyRecode.recode || [])[i] || "Personalised recovery-first approach",
                                })),
                                { bad: "One-size-fits-all templates", good: "Recovery-led transformation approach" },
                                { bad: "Short-term calorie cutting", good: "Sustainable long-term lifestyle change" },
                            ].map((row, i) => (
                                <motion.div key={i}
                                    initial={{ opacity: 0, x: i % 2 === 0 ? -40 : 40 }}
                                    animate={whyInView ? { opacity: 1, x: 0 } : {}}
                                    transition={{ duration: 0.6, delay: 0.08 + i * 0.09, ease: [0.22, 1, 0.36, 1] }}
                                    className="grid grid-cols-[1fr_auto_1fr] gap-0 rounded-2xl overflow-hidden"
                                    style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}>

                                    {/* Bad side */}
                                    <div className="p-3 sm:p-4 flex items-center gap-2 sm:gap-3 group"
                                        style={{ background: 'rgba(239,68,68,0.04)' }}>
                                        <div className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0"
                                            style={{ background: 'rgba(239,68,68,0.1)' }}>
                                            <XCircle className="w-3.5 h-3.5" style={{ color: 'rgba(239,68,68,0.7)' }} />
                                        </div>
                                        {/* FIX: text-xs sm:text-sm */}
                                        <span className="text-xs sm:text-sm text-white/30 line-through decoration-red-500/30 leading-snug">{row.bad}</span>
                                    </div>

                                    {/* Center VS pill */}
                                    <div className="flex items-center justify-center px-2 sm:px-3"
                                        style={{ background: 'rgba(0,0,0,0.3)' }}>
                                        <motion.div
                                            className="w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center text-[8px] sm:text-[9px] font-black text-white flex-shrink-0"
                                            style={{ background: i === 0 ? '#e71763' : 'rgba(231,23,99,0.7)' }}
                                            animate={i === 0 ? { boxShadow: ['0 0 0px rgba(231,23,99,0)', '0 0 20px rgba(231,23,99,0.8)', '0 0 0px rgba(231,23,99,0)'] } : {}}
                                            transition={{ duration: 2, repeat: Infinity, delay: i * 0.3 }}>
                                            VS
                                        </motion.div>
                                    </div>

                                    {/* Good side */}
                                    <div className="p-3 sm:p-4 flex items-center gap-2 sm:gap-3"
                                        style={{ background: 'rgba(231,23,99,0.04)' }}>
                                        <div className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0"
                                            style={{ background: 'rgba(231,23,99,0.15)' }}>
                                            <CheckCircle2 className="w-3.5 h-3.5" style={{ color: '#e71763' }} />
                                        </div>
                                        {/* FIX: text-xs sm:text-sm */}
                                        <span className="text-xs sm:text-sm text-white/85 font-medium leading-snug">{row.good}</span>
                                    </div>
                                </motion.div>
                            ))}
                        </div>

                        <motion.div initial={{ opacity: 0, y: 20, scale: 0.9 }} animate={whyInView ? { opacity: 1, y: 0, scale: 1 } : {}}
                            transition={{ duration: 0.6, delay: 0.7 }}
                            className="mt-8 sm:mt-10 text-center">
                            <div className="inline-flex items-center gap-2 sm:gap-3 px-4 sm:px-6 py-3 sm:py-4 rounded-2xl"
                                style={{ background: 'rgba(231,23,99,0.08)', border: '1px solid rgba(231,23,99,0.3)', boxShadow: '0 0 40px rgba(231,23,99,0.1)' }}>
                                <Sparkles className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" style={{ color: '#e71763' }} />
                                <span className="text-xs sm:text-sm font-black text-white">RECODE™ — Recovery-based. Science-backed. Built for <span style={{ color: '#e71763' }}>real life.</span></span>
                                <Sparkles className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" style={{ color: '#e71763' }} />
                            </div>
                        </motion.div>
                    </div>
                </div>
            </SectionAtmosphere>

            {/* ═══ RECODE IS BUILT FOR YOU ═══ */}
            {/* FIX: py-12 sm:py-20 md:py-28 */}
            <div ref={audienceRef} className="relative py-12 sm:py-20 md:py-28 overflow-hidden">
                <div className="absolute inset-0 flex flex-col justify-center gap-8 pointer-events-none overflow-hidden select-none">
                    {[0, 1].map((row) => (
                        <motion.div key={row} className="flex gap-20 whitespace-nowrap"
                            animate={{ x: row === 0 ? ["0%", "-50%"] : ["-50%", "0%"] }}
                            transition={{ duration: 25, repeat: Infinity, ease: "linear" }}>
                            {Array.from({ length: 8 }).map((_, i) => (
                                <span key={i} className="text-[80px] font-black tracking-widest"
                                    style={{ color: 'rgba(231,23,99,0.04)' }}>
                                    RECODE™
                                </span>
                            ))}
                        </motion.div>
                    ))}
                </div>

                <Orb style={{ left: '10%', top: '20%', width: 300, height: 300, background: 'rgba(231,23,99,0.05)' }} delay={1} />
                <Orb style={{ right: '5%', bottom: '10%', width: 250, height: 250, background: 'rgba(231,23,99,0.04)' }} delay={3} />
                <ScatteredIcons count={4} sectionSeed={5} />

                <div className="container mx-auto px-4 max-w-5xl relative">
                    <motion.div initial={{ opacity: 0, y: 30 }} animate={audienceInView ? { opacity: 1, y: 0 } : {}}
                        transition={{ duration: 0.7 }} className="text-center mb-10 sm:mb-12">
                        <motion.span className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-[0.25em] px-4 py-2 rounded-full mb-6"
                            style={{ color: '#e71763', border: '1px solid rgba(231,23,99,0.28)', background: 'rgba(231,23,99,0.07)' }}>
                            Who It's For
                        </motion.span>
                        {/* FIX: text-2xl sm:text-4xl md:text-6xl */}
                        <h3 className="text-2xl sm:text-4xl md:text-6xl font-black text-white mt-4">
                            RECODE is built for{" "}
                            <motion.span style={{ color: '#e71763' }}
                                animate={{ textShadow: ['0 0 20px rgba(231,23,99,0.3)', '0 0 60px rgba(231,23,99,0.7)', '0 0 20px rgba(231,23,99,0.3)'] }}
                                transition={{ duration: 2.5, repeat: Infinity }}>
                                you
                            </motion.span>
                        </h3>
                    </motion.div>

                    <div className="flex flex-wrap justify-center gap-3">
                        {targetAudience.map((audience, i) => (
                            <motion.span key={audience}
                                initial={{ opacity: 0, scale: 0.7, y: 14 }}
                                animate={audienceInView ? { opacity: 1, scale: 1, y: 0 } : {}}
                                transition={{ duration: 0.4, delay: 0.05 + i * 0.07, ease: [0.22, 1, 0.36, 1] }}
                                whileHover={{ scale: 1.1, y: -4 }}
                                className="px-5 py-2.5 rounded-full text-sm font-black text-white cursor-default"
                                style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', transition: 'box-shadow 0.3s' }}
                                onMouseEnter={e => { e.currentTarget.style.border = '1px solid rgba(231,23,99,0.5)'; e.currentTarget.style.background = 'rgba(231,23,99,0.08)'; e.currentTarget.style.boxShadow = '0 0 20px rgba(231,23,99,0.25)'; }}
                                onMouseLeave={e => { e.currentTarget.style.border = '1px solid rgba(255,255,255,0.1)'; e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; e.currentTarget.style.boxShadow = 'none'; }}>
                                {audience}
                            </motion.span>
                        ))}
                    </div>
                </div>
            </div>
        </section>
    );
}
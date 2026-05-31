import { useRef } from "react";
import { motion, useInView } from "framer-motion";
import { coach, recodeMethod, targetAudience, whyRecode } from "@/data/siteData";
import { CheckCircle2, XCircle } from "lucide-react";

export default function FeaturesSection() {
    const ref = useRef(null);
    const isInView = useInView(ref, { once: true, margin: "-100px" });

    return (
        <section id="about" className="relative py-24 overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-b from-background via-muted/20 to-background" />

            <div ref={ref} className="relative container mx-auto px-4">

                {/* ── ABOUT SUDARSHAN ── */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={isInView ? { opacity: 1, y: 0 } : {}}
                    transition={{ duration: 0.5 }}
                    className="text-center mb-16"
                >
                    <span className="text-primary text-sm font-semibold uppercase tracking-widest">About The Coach</span>
                    <h2 className="text-3xl md:text-5xl font-bold mt-4 mb-6">
                        Meet <span className="text-primary">Sudarshan Chavan</span>
                    </h2>
                </motion.div>

                <div className="grid lg:grid-cols-2 gap-12 items-center mb-24">
                    {/* Avatar side */}
                    <motion.div
                        initial={{ opacity: 0, x: -50 }}
                        animate={isInView ? { opacity: 1, x: 0 } : {}}
                        transition={{ duration: 0.6, delay: 0.2 }}
                        className="relative"
                    >
                        <div className="relative aspect-[4/5] rounded-3xl overflow-hidden glass-card">
                            <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-transparent to-transparent" />
                            <div className="absolute inset-0 flex items-center justify-center">
                                <div className="text-center p-8">
                                    <div className="w-36 h-36 rounded-full bg-primary/20 mx-auto mb-6 flex items-center justify-center border-2 border-primary/30">
                                        <span className="text-6xl font-bold text-primary">S</span>
                                    </div>
                                    <h3 className="text-2xl font-bold mb-1">{coach.name}</h3>
                                    <p className="text-primary text-sm font-semibold mb-1">Founder, RECODE™</p>
                                    <p className="text-muted-foreground text-sm">{coach.certifications[0]}</p>
                                </div>
                            </div>
                            {/* Floating cards */}
                            <motion.div
                                initial={{ opacity: 0, scale: 0.8 }}
                                animate={isInView ? { opacity: 1, scale: 1 } : {}}
                                transition={{ duration: 0.5, delay: 0.6 }}
                                className="absolute top-6 right-6 glass-card rounded-xl p-4"
                            >
                                <p className="text-xs text-muted-foreground">Personal Transformation</p>
                                <p className="font-bold text-primary text-lg">85kg → 56kg</p>
                            </motion.div>
                            <motion.div
                                initial={{ opacity: 0, scale: 0.8 }}
                                animate={isInView ? { opacity: 1, scale: 1 } : {}}
                                transition={{ duration: 0.5, delay: 0.7 }}
                                className="absolute bottom-6 left-6 glass-card rounded-xl p-4"
                            >
                                <p className="text-xs text-muted-foreground">Clients Guided</p>
                                <p className="font-bold text-primary text-lg">200+</p>
                            </motion.div>
                        </div>
                    </motion.div>

                    {/* Bio side */}
                    <motion.div
                        initial={{ opacity: 0, x: 50 }}
                        animate={isInView ? { opacity: 1, x: 0 } : {}}
                        transition={{ duration: 0.6, delay: 0.3 }}
                        className="space-y-6"
                    >
                        <div>
                            <p className="text-muted-foreground leading-relaxed text-lg mb-4">{coach.shortBio}</p>
                            <p className="text-muted-foreground leading-relaxed">{coach.longBio}</p>
                        </div>

                        {/* Stats row */}
                        <div className="grid grid-cols-2 gap-4 pt-4">
                            {coach.stats.map((s, i) => (
                                <motion.div
                                    key={s.label}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={isInView ? { opacity: 1, y: 0 } : {}}
                                    transition={{ duration: 0.4, delay: 0.5 + i * 0.1 }}
                                    className="glass-card rounded-xl p-4 text-center hover:border-primary/30 transition-all"
                                >
                                    <p className="text-2xl font-bold text-primary">{s.value}</p>
                                    <p className="text-xs text-muted-foreground mt-1">{s.label}</p>
                                </motion.div>
                            ))}
                        </div>
                    </motion.div>
                </div>

                {/* ── WHAT IS RECODE ── */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={isInView ? { opacity: 1, y: 0 } : {}}
                    transition={{ duration: 0.5, delay: 0.2 }}
                    className="text-center mb-16"
                >
                    <span className="text-primary text-sm font-semibold uppercase tracking-widest">The System</span>
                    <h2 className="text-3xl md:text-5xl font-bold mt-4 mb-6">
                        What is <span className="text-primary">RECODE™?</span>
                    </h2>
                    <p className="text-muted-foreground max-w-3xl mx-auto text-lg leading-relaxed">
                        RECODE™ is a recovery-based transformation system designed to restore structure, regulate the body, and create sustainable physical transformation — without extreme dieting or unsustainable training.
                    </p>
                </motion.div>

                {/* ── 5R METHOD ── */}
                <div className="grid md:grid-cols-5 gap-4 mb-24">
                    {recodeMethod.map((r, i) => (
                        <motion.div
                            key={r.title}
                            initial={{ opacity: 0, y: 30 }}
                            animate={isInView ? { opacity: 1, y: 0 } : {}}
                            transition={{ duration: 0.4, delay: 0.3 + i * 0.1 }}
                            className="glass-card rounded-2xl p-6 text-center hover:border-primary/30 transition-all group"
                        >
                            <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${r.color} flex items-center justify-center mb-4 mx-auto group-hover:scale-110 transition-transform`}>
                                <span className="text-xs font-bold text-white/80">{r.step}</span>
                            </div>
                            <h3 className={`text-sm font-bold mb-2 ${r.accent}`}>{r.title}</h3>
                            <p className="text-xs text-muted-foreground leading-relaxed">{r.description}</p>
                        </motion.div>
                    ))}
                </div>

                {/* ── WHY RECODE ── */}
                <div className="grid md:grid-cols-2 gap-8 mb-24 max-w-4xl mx-auto">
                    <motion.div
                        initial={{ opacity: 0, x: -30 }}
                        animate={isInView ? { opacity: 1, x: 0 } : {}}
                        transition={{ duration: 0.5, delay: 0.3 }}
                        className="glass-card rounded-2xl p-8 border border-destructive/20"
                    >
                        <h3 className="text-lg font-bold mb-6 text-muted-foreground">Most fitness plans focus on:</h3>
                        <ul className="space-y-3">
                            {whyRecode.others.map((item) => (
                                <li key={item} className="flex items-center gap-3 text-muted-foreground">
                                    <XCircle className="w-4 h-4 text-destructive flex-shrink-0" />
                                    <span className="text-sm">{item}</span>
                                </li>
                            ))}
                        </ul>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, x: 30 }}
                        animate={isInView ? { opacity: 1, x: 0 } : {}}
                        transition={{ duration: 0.5, delay: 0.4 }}
                        className="glass-card rounded-2xl p-8 border border-primary/20"
                    >
                        <h3 className="text-lg font-bold mb-6 text-primary">RECODE focuses on:</h3>
                        <ul className="space-y-3">
                            {whyRecode.recode.map((item) => (
                                <li key={item} className="flex items-center gap-3">
                                    <CheckCircle2 className="w-4 h-4 text-primary flex-shrink-0" />
                                    <span className="text-sm">{item}</span>
                                </li>
                            ))}
                        </ul>
                    </motion.div>
                </div>

                {/* ── WHO IT'S FOR ── */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={isInView ? { opacity: 1, y: 0 } : {}}
                    transition={{ duration: 0.5, delay: 0.3 }}
                    className="text-center"
                >
                    <span className="text-primary text-sm font-semibold uppercase tracking-widest">Who It's For</span>
                    <h3 className="text-2xl md:text-4xl font-bold mt-4 mb-10">
                        RECODE is built for <span className="text-primary">you</span>
                    </h3>
                    <div className="flex flex-wrap justify-center gap-3 max-w-3xl mx-auto">
                        {targetAudience.map((audience, i) => (
                            <motion.span
                                key={audience}
                                initial={{ opacity: 0, scale: 0.8 }}
                                animate={isInView ? { opacity: 1, scale: 1 } : {}}
                                transition={{ duration: 0.3, delay: 0.4 + i * 0.05 }}
                                className="px-4 py-2 glass-card rounded-full text-sm font-medium border border-primary/20 hover:border-primary/50 transition-all"
                            >
                                {audience}
                            </motion.span>
                        ))}
                    </div>
                </motion.div>
            </div>
        </section>
    );
}
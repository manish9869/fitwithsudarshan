import { useRef, useEffect, useState } from "react";
import { motion, useInView, AnimatePresence } from "framer-motion";
import { Star, ChevronLeft, ChevronRight, Quote } from "lucide-react";
import { testimonials } from "@/data/SiteData";

function Orb({ style, delay = 0 }) {
    return (
        <motion.div className="absolute rounded-full blur-3xl pointer-events-none" style={style}
            animate={{ scale: [1, 1.3, 1], opacity: [0.3, 0.7, 0.3] }}
            transition={{ duration: 9, repeat: Infinity, ease: "easeInOut", delay }} />
    );
}

export default function TestimonialsSection() {
    const ref = useRef(null);
    const isInView = useInView(ref, { once: true, margin: "-60px" });
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isAutoPlaying, setIsAutoPlaying] = useState(true);

    useEffect(() => {
        if (!isAutoPlaying) return;
        const timer = setInterval(() => setCurrentIndex((p) => (p + 1) % testimonials.length), 5000);
        return () => clearInterval(timer);
    }, [isAutoPlaying]);

    const next = () => { setIsAutoPlaying(false); setCurrentIndex((p) => (p + 1) % testimonials.length); };
    const prev = () => { setIsAutoPlaying(false); setCurrentIndex((p) => (p - 1 + testimonials.length) % testimonials.length); };
    const t = testimonials[currentIndex];

    return (
        <section id="testimonials" className="relative py-28 overflow-hidden">
            {/* Atmosphere */}
            <div className="absolute inset-0 pointer-events-none">
                <motion.div className="absolute inset-0"
                    style={{ background: 'radial-gradient(ellipse 70% 50% at 50% 50%, rgba(231,23,99,0.06) 0%, transparent 70%)' }}
                    animate={{ opacity: [0.4, 1, 0.4] }} transition={{ duration: 6, repeat: Infinity }} />
                <Orb style={{ left: '-8%', top: '20%', width: 400, height: 400, background: 'rgba(231,23,99,0.06)' }} delay={0} />
                <Orb style={{ right: '-5%', bottom: '15%', width: 350, height: 350, background: 'rgba(231,23,99,0.04)' }} delay={3} />
                {/* Vertical light lines */}
                {[25, 50, 75].map((pos, i) => (
                    <motion.div key={i} className="absolute top-0 bottom-0 w-px"
                        style={{ left: `${pos}%`, background: 'linear-gradient(to bottom, transparent, rgba(231,23,99,0.07), transparent)' }}
                        animate={{ opacity: [0, 1, 0] }} transition={{ duration: 6 + i * 2, repeat: Infinity, delay: i * 1.5 }} />
                ))}
            </div>

            <div ref={ref} className="relative container mx-auto px-4 max-w-6xl">

                {/* Header */}
                <motion.div initial={{ opacity: 0, y: 30 }} animate={isInView ? { opacity: 1, y: 0 } : {}}
                    transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }} className="text-center mb-16">
                    <motion.span className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-[0.25em] px-4 py-2 rounded-full mb-6"
                        style={{ color: '#e71763', border: '1px solid rgba(231,23,99,0.28)', background: 'rgba(231,23,99,0.07)' }}
                        animate={{ boxShadow: ['0 0 0px transparent', '0 0 22px rgba(231,23,99,0.35)', '0 0 0px transparent'] }}
                        transition={{ duration: 3, repeat: Infinity }}>
                        Results
                    </motion.span>
                    <h2 className="text-5xl md:text-6xl font-black text-white mb-4">
                        Real People.<br />
                        <motion.span style={{ color: '#e71763' }}
                            animate={{ textShadow: ['0 0 20px rgba(231,23,99,0.3)', '0 0 60px rgba(231,23,99,0.65)', '0 0 20px rgba(231,23,99,0.3)'] }}
                            transition={{ duration: 3, repeat: Infinity }}>
                            Real Transformations.
                        </motion.span>
                    </h2>
                    <p className="text-white/40 max-w-lg mx-auto text-sm">RECODE clients achieve sustainable results — not quick fixes that fade away.</p>
                </motion.div>

                {/* Hero testimonial */}
                <motion.div initial={{ opacity: 0, y: 40 }} animate={isInView ? { opacity: 1, y: 0 } : {}}
                    transition={{ duration: 0.7, delay: 0.15, ease: [0.22, 1, 0.36, 1] }} className="max-w-4xl mx-auto mb-14">
                    <div className="relative rounded-3xl p-8 md:p-12 overflow-hidden"
                        style={{ background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.07)', boxShadow: '0 40px 80px rgba(0,0,0,0.5)' }}>
                        {/* Corner glow */}
                        <div className="absolute top-0 right-0 w-64 h-64 rounded-full blur-3xl pointer-events-none"
                            style={{ background: 'rgba(231,23,99,0.08)', transform: 'translate(30%, -30%)' }} />
                        <motion.div className="absolute inset-0 rounded-3xl pointer-events-none"
                            style={{ background: 'linear-gradient(135deg, rgba(231,23,99,0.04) 0%, transparent 50%)' }}
                            animate={{ opacity: [0.5, 1, 0.5] }} transition={{ duration: 5, repeat: Infinity }} />

                        <Quote className="absolute top-6 left-6 h-14 w-14" style={{ color: 'rgba(231,23,99,0.12)' }} />

                        <div className="relative z-10">
                            <div className="flex items-center gap-1 mb-6">
                                {[...Array(t.rating)].map((_, i) => (
                                    <motion.div key={i} initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: i * 0.07, type: 'spring' }}>
                                        <Star className="h-5 w-5" style={{ fill: '#e71763', color: '#e71763' }} />
                                    </motion.div>
                                ))}
                            </div>

                            <AnimatePresence mode="wait">
                                <motion.blockquote key={currentIndex}
                                    initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -16 }}
                                    transition={{ duration: 0.35 }}
                                    className="text-xl md:text-2xl leading-relaxed text-white mb-8 font-medium">
                                    "{t.quote}"
                                </motion.blockquote>
                            </AnimatePresence>

                            <AnimatePresence mode="wait">
                                <motion.div key={`info-${currentIndex}`}
                                    initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                                    className="flex items-center justify-between flex-wrap gap-4">
                                    <div className="flex items-center gap-4">
                                        <div className="w-14 h-14 rounded-full flex items-center justify-center"
                                            style={{ background: 'rgba(231,23,99,0.12)', border: '2px solid rgba(231,23,99,0.35)' }}>
                                            <span className="text-xl font-black" style={{ color: '#e71763' }}>{t.name.charAt(0)}</span>
                                        </div>
                                        <div>
                                            <p className="font-black text-white">{t.name}</p>
                                            <p className="text-sm text-white/40">{t.role}</p>
                                        </div>
                                    </div>
                                    <div className="px-4 py-2 rounded-xl text-center"
                                        style={{ background: 'rgba(231,23,99,0.1)', border: '1px solid rgba(231,23,99,0.25)' }}>
                                        <p className="font-black text-sm" style={{ color: '#e71763' }}>{t.transformation}</p>
                                        <p className="text-[10px] text-white/35 mt-0.5">Transformation</p>
                                    </div>
                                </motion.div>
                            </AnimatePresence>

                            {/* Controls */}
                            <div className="flex items-center justify-center gap-4 mt-8">
                                <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }} onClick={prev}
                                    className="w-10 h-10 rounded-full flex items-center justify-center"
                                    style={{ border: '1px solid rgba(255,255,255,0.12)', background: 'rgba(255,255,255,0.04)' }}>
                                    <ChevronLeft className="h-5 w-5 text-white" />
                                </motion.button>
                                <div className="flex items-center gap-2">
                                    {testimonials.map((_, i) => (
                                        <button key={i} onClick={() => { setIsAutoPlaying(false); setCurrentIndex(i); }}
                                            className="rounded-full transition-all"
                                            style={{ width: i === currentIndex ? '28px' : '6px', height: '6px', background: i === currentIndex ? '#e71763' : 'rgba(255,255,255,0.15)' }} />
                                    ))}
                                </div>
                                <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }} onClick={next}
                                    className="w-10 h-10 rounded-full flex items-center justify-center"
                                    style={{ border: '1px solid rgba(255,255,255,0.12)', background: 'rgba(255,255,255,0.04)' }}>
                                    <ChevronRight className="h-5 w-5 text-white" />
                                </motion.button>
                            </div>
                        </div>
                    </div>
                </motion.div>

                {/* Cards row */}
                <div className="grid md:grid-cols-3 gap-5">
                    {testimonials.slice(0, 3).map((item, index) => (
                        <motion.div key={item.id}
                            initial={{ opacity: 0, y: 40, scale: 0.92 }}
                            animate={isInView ? { opacity: 1, y: 0, scale: 1 } : {}}
                            transition={{ duration: 0.6, delay: 0.3 + index * 0.1, ease: [0.22, 1, 0.36, 1] }}
                            whileHover={{ y: -8, scale: 1.02 }}
                            className="rounded-2xl p-6 cursor-default relative overflow-hidden"
                            style={{ background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.07)', transition: 'box-shadow 0.3s' }}
                            onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(231,23,99,0.35)'; e.currentTarget.style.boxShadow = '0 0 40px rgba(231,23,99,0.12), 0 20px 40px rgba(0,0,0,0.4)'; }}
                            onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.07)'; e.currentTarget.style.boxShadow = 'none'; }}>
                            {/* Top accent line */}
                            <div className="absolute top-0 left-0 right-0 h-0.5 opacity-0 hover:opacity-100 transition-opacity"
                                style={{ background: 'linear-gradient(90deg, transparent, #e71763, transparent)' }} />
                            <div className="flex items-center gap-1 mb-4">
                                {[...Array(item.rating)].map((_, i) => <Star key={i} className="h-3.5 w-3.5" style={{ fill: '#e71763', color: '#e71763' }} />)}
                            </div>
                            <p className="text-white/45 text-sm leading-relaxed mb-5 line-clamp-4">"{item.quote}"</p>
                            <div className="flex items-center gap-3">
                                <div className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0"
                                    style={{ background: 'rgba(231,23,99,0.12)', border: '1px solid rgba(231,23,99,0.25)' }}>
                                    <span className="text-sm font-black" style={{ color: '#e71763' }}>{item.name.charAt(0)}</span>
                                </div>
                                <div>
                                    <p className="font-black text-sm text-white">{item.name}</p>
                                    <p className="text-xs font-bold" style={{ color: '#e71763' }}>{item.transformation}</p>
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    );
}
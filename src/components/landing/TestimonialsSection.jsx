import { useRef, useEffect, useState } from "react";
import { motion, useInView } from "framer-motion";
import { Star, ChevronLeft, ChevronRight, Quote } from "lucide-react";
import { Button } from "@/components/ui/button";
import { testimonials } from "@/data/siteData";

export default function TestimonialsSection() {
    const ref = useRef(null);
    const isInView = useInView(ref, { once: true, margin: "-100px" });
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
        <section id="testimonials" className="relative py-24 overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-b from-background via-muted/20 to-background" />

            <div ref={ref} className="relative container mx-auto px-4">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={isInView ? { opacity: 1, y: 0 } : {}}
                    transition={{ duration: 0.5 }}
                    className="text-center mb-16"
                >
                    <span className="text-primary text-sm font-semibold uppercase tracking-widest">Results</span>
                    <h2 className="text-3xl md:text-5xl font-bold mt-4 mb-6">
                        Real People. <span className="text-primary">Real Transformations.</span>
                    </h2>
                    <p className="text-muted-foreground max-w-2xl mx-auto text-lg leading-relaxed">
                        RECODE clients achieve sustainable transformations — not quick fixes that fade.
                    </p>
                </motion.div>

                {/* Featured */}
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={isInView ? { opacity: 1, y: 0 } : {}}
                    transition={{ duration: 0.5, delay: 0.2 }}
                    className="max-w-4xl mx-auto mb-12"
                >
                    <div className="glass-card rounded-3xl p-8 md:p-12 relative">
                        <Quote className="absolute top-6 left-6 h-12 w-12 text-primary/20" />
                        <div className="relative z-10">
                            <div className="flex items-center gap-1 mb-6">
                                {[...Array(t.rating)].map((_, i) => (
                                    <Star key={i} className="h-5 w-5 fill-primary text-primary" />
                                ))}
                            </div>
                            <blockquote className="text-xl md:text-2xl leading-relaxed mb-8">
                                &quot;{t.quote}&quot;
                            </blockquote>
                            <div className="flex items-center justify-between flex-wrap gap-4">
                                <div className="flex items-center gap-4">
                                    <div className="w-14 h-14 rounded-full bg-primary/20 flex items-center justify-center border-2 border-primary/30">
                                        <span className="text-xl font-bold text-primary">{t.name.charAt(0)}</span>
                                    </div>
                                    <div>
                                        <p className="font-semibold">{t.name}</p>
                                        <p className="text-sm text-muted-foreground">{t.role}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-4">
                                    <div className="text-center">
                                        <p className="text-primary font-bold">{t.transformation}</p>
                                        <p className="text-xs text-muted-foreground">Transformation</p>
                                    </div>
                                </div>
                            </div>

                            {/* Nav */}
                            <div className="flex items-center justify-center gap-4 mt-8">
                                <Button variant="outline" size="icon" onClick={prev} className="rounded-full">
                                    <ChevronLeft className="h-5 w-5" />
                                </Button>
                                <div className="flex items-center gap-2">
                                    {testimonials.map((_, i) => (
                                        <button
                                            key={i}
                                            onClick={() => { setIsAutoPlaying(false); setCurrentIndex(i); }}
                                            className={`w-2 h-2 rounded-full transition-all ${i === currentIndex ? "w-8 bg-primary" : "bg-muted hover:bg-muted-foreground"}`}
                                        />
                                    ))}
                                </div>
                                <Button variant="outline" size="icon" onClick={next} className="rounded-full">
                                    <ChevronRight className="h-5 w-5" />
                                </Button>
                            </div>
                        </div>
                    </div>
                </motion.div>

                {/* Grid */}
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={isInView ? { opacity: 1, y: 0 } : {}}
                    transition={{ duration: 0.5, delay: 0.4 }}
                    className="grid md:grid-cols-2 lg:grid-cols-3 gap-6"
                >
                    {testimonials.slice(0, 3).map((item, index) => (
                        <motion.div
                            key={item.id}
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={isInView ? { opacity: 1, scale: 1 } : {}}
                            transition={{ duration: 0.4, delay: 0.5 + index * 0.1 }}
                            className="border border-white/10 bg-white/5 rounded-2xl p-6 hover:border-primary/30 transition-all"
                        >
                            <div className="flex items-center gap-1 mb-4">
                                {[...Array(item.rating)].map((_, i) => (
                                    <Star key={i} className="h-4 w-4 fill-primary text-primary" />
                                ))}
                            </div>
                            <p className="text-muted-foreground text-sm leading-relaxed mb-4 line-clamp-4">
                                &quot;{item.quote}&quot;
                            </p>
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center border border-primary/20">
                                    <span className="text-sm font-bold text-primary">{item.name.charAt(0)}</span>
                                </div>
                                <div>
                                    <p className="font-semibold text-sm">{item.name}</p>
                                    <p className="text-xs text-primary">{item.transformation}</p>
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </motion.div>
            </div>
        </section>
    );
}
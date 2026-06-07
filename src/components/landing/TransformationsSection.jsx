import { useState, useRef } from "react"
import { motion, useInView } from "framer-motion"
import { ChevronLeft, ChevronRight, Scale, Clock, TrendingDown, Quote } from "lucide-react"
import { Button } from "@/components/ui/button"

const transformations = [
    {
        id: 1, name: "Prajvati", role: "Anesthetist", duration: "1 Month",
        weightLost: "Lifestyle Transformation", category: "Lifestyle",
        quote: "As an anesthetist, maintaining my own health while caring for others can be challenging. What stood out about RECODE was its focus on sustainability and lifestyle integration. It wasn't about following a strict diet — it was about building habits that fit my routine and delivered lasting results.",
        stats: { before: "82kg", after: "71kg", bodyFat: "-9%" }, photoBefore: null, photoAfter: null,
    },
    {
        id: 2, name: "Aayush", role: "Finance Professional", duration: "3 Months",
        weightLost: "11kg Lost", category: "Fat Loss",
        quote: "As someone working in finance, consistency was always my biggest challenge. RECODE helped me build sustainable habits around nutrition and training, leading to an 11kg transformation without extreme dieting.",
        stats: { before: "82kg", after: "71kg", bodyFat: "-9%" }, photoBefore: null, photoAfter: null,
    },
    {
        id: 3, name: "Joshua", role: "Producer", duration: "3 Months",
        weightLost: "15kg Lost", category: "Fat Loss",
        quote: "As a producer, my schedule is fast-paced, stressful, and constantly changing. RECODE gave me a practical structure that fit my lifestyle instead of forcing me into a restrictive diet. Over 3 months, I lost 15kg while building habits that I could realistically maintain long-term.",
        stats: { before: "82kg", after: "71kg", bodyFat: "-9%" }, photoBefore: null, photoAfter: null,
    },
    {
        id: 4, name: "Raj", role: "Actor", duration: "3 Months",
        weightLost: "15kg Lost", category: "Transformation",
        quote: "As an actor, staying camera-ready is part of the profession. RECODE gave me a structured and sustainable approach to nutrition and training that fit my schedule. In just 3 months, I transformed from 85kg to 70kg while improving my energy, confidence, and overall physique.",
        stats: { before: "85kg", after: "70kg", bodyFat: "-10%" }, photoBefore: null, photoAfter: null,
    },
    {
        id: 5, name: "Sudarshan Chavan", role: "Founder, RECODE™", duration: "4 Months",
        weightLost: "29kg Lost", category: "Founder's Journey",
        quote: "RECODE was born from my own transformation journey. After struggling with inconsistency, extreme approaches, and the cycle of starting over, I realized that lasting results come from structure, not restriction. I transformed from 85kg to 56kg and built a lifestyle I could actually sustain.",
        stats: { before: "85kg", after: "56kg", bodyFat: "-18%" },
        photoBefore: "https://vducmiggraxtqdgt.public.blob.vercel-storage.com/sudarshan-before.png",
        photoAfter: "https://vducmiggraxtqdgt.public.blob.vercel-storage.com/sudarshan-after.jpeg",
    },
];

function getInitials(name) {
    return name.split(" ").map((n) => n[0]).slice(0, 2).join("").toUpperCase();
}

function NoImageCard({ transformation }) {
    return (
        <div className="rounded-2xl overflow-hidden aspect-[3/4] flex flex-col"
            style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(231,23,99,0.15)' }}>
            <div className="h-1 w-full flex-shrink-0" style={{ background: 'rgba(231,23,99,0.6)' }} />
            <div className="flex flex-col flex-1 p-8 justify-between">
                <div>
                    <span className="text-xs font-semibold uppercase tracking-widest" style={{ color: '#e71763' }}>
                        {transformation.category}
                    </span>
                </div>
                <div className="flex flex-col items-center text-center gap-4">
                    <div className="w-20 h-20 rounded-full flex items-center justify-center"
                        style={{ background: 'rgba(231,23,99,0.1)', border: '2px solid rgba(231,23,99,0.3)' }}>
                        <span className="text-2xl font-bold" style={{ color: '#e71763' }}>{getInitials(transformation.name)}</span>
                    </div>
                    <div>
                        <p className="text-lg font-bold text-white">{transformation.name}</p>
                        <p className="text-sm text-muted-foreground mt-0.5">{transformation.role}</p>
                    </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                    <div className="rounded-xl p-3 text-center" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}>
                        <p className="text-xs text-muted-foreground mb-1">Result</p>
                        <p className="text-sm font-bold leading-tight" style={{ color: '#e71763' }}>{transformation.weightLost}</p>
                    </div>
                    <div className="rounded-xl p-3 text-center" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}>
                        <p className="text-xs text-muted-foreground mb-1">Duration</p>
                        <p className="text-sm font-bold text-white leading-tight">{transformation.duration}</p>
                    </div>
                </div>
                <div className="flex justify-center">
                    <span className="px-3 py-1 rounded-full text-xs text-muted-foreground" style={{ border: '1px solid rgba(255,255,255,0.1)' }}>
                        📸 Photos coming soon
                    </span>
                </div>
            </div>
        </div>
    );
}

function BeforeAfterSlider({ transformation }) {
    const [sliderPosition, setSliderPosition] = useState(50);
    const containerRef = useRef(null);
    const hasBefore = Boolean(transformation.photoBefore);
    const hasAfter = Boolean(transformation.photoAfter);

    if (!hasBefore && !hasAfter) return <NoImageCard transformation={transformation} />;

    const handleMouseMove = (e) => {
        if (!containerRef.current) return;
        const rect = containerRef.current.getBoundingClientRect();
        const x = Math.max(0, Math.min(e.clientX - rect.left, rect.width));
        setSliderPosition((x / rect.width) * 100);
    };

    const handleTouchMove = (e) => {
        if (!containerRef.current) return;
        const rect = containerRef.current.getBoundingClientRect();
        const x = Math.max(0, Math.min(e.touches[0].clientX - rect.left, rect.width));
        setSliderPosition((x / rect.width) * 100);
    };

    if (!hasBefore || !hasAfter) {
        const src = hasAfter ? transformation.photoAfter : transformation.photoBefore;
        const label = hasAfter ? "AFTER" : "BEFORE";
        return (
            <div className="relative aspect-[3/4] rounded-2xl overflow-hidden" style={{ border: '1px solid rgba(255,255,255,0.08)' }}>
                <img src={src} alt={label} className="absolute inset-0 w-full h-full object-cover object-top" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                <div className="absolute top-4 left-4 px-3 py-1 rounded-full text-xs font-bold text-white"
                    style={{ background: 'rgba(231,23,99,0.8)', backdropFilter: 'blur(8px)' }}>
                    {label}
                </div>
            </div>
        );
    }

    return (
        <div ref={containerRef} className="relative aspect-[3/4] rounded-2xl overflow-hidden select-none cursor-ew-resize"
            style={{ border: '1px solid rgba(255,255,255,0.08)' }}
            onMouseMove={handleMouseMove} onTouchMove={handleTouchMove}>
            <img src={transformation.photoAfter} alt="After" className="absolute inset-0 w-full h-full object-cover object-top" draggable={false} />
            <div className="absolute inset-0 overflow-hidden" style={{ width: `${sliderPosition}%` }}>
                <img src={transformation.photoBefore} alt="Before" className="absolute inset-0 h-full object-cover object-top"
                    style={{ width: `${(100 / sliderPosition) * 100}%`, maxWidth: "none" }} draggable={false} />
            </div>
            <div className="absolute top-0 bottom-0 w-0.5 bg-white z-10" style={{ left: `${sliderPosition}%`, boxShadow: '0 0 8px rgba(0,0,0,0.8)' }} />
            <div className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 z-20 w-10 h-10 rounded-full bg-white shadow-lg flex items-center justify-center"
                style={{ left: `${sliderPosition}%` }}>
                <ChevronLeft className="h-3.5 w-3.5 text-black" />
                <ChevronRight className="h-3.5 w-3.5 text-black" />
            </div>
            <div className="absolute top-4 left-4 z-10 px-3 py-1 rounded-full text-xs font-bold text-white" style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(8px)' }}>BEFORE</div>
            <div className="absolute top-4 right-4 z-10 px-3 py-1 rounded-full text-xs font-bold text-white" style={{ background: 'rgba(231,23,99,0.8)', backdropFilter: 'blur(8px)' }}>AFTER</div>
            <input type="range" min="0" max="100" value={sliderPosition} onChange={(e) => setSliderPosition(Number(e.target.value))}
                className="absolute inset-0 w-full h-full opacity-0 cursor-ew-resize z-30" />
        </div>
    );
}

export function TransformationsSection() {
    const ref = useRef(null);
    const isInView = useInView(ref, { once: true, margin: "-100px" });
    const [selectedIndex, setSelectedIndex] = useState(0);
    const selected = transformations[selectedIndex];
    const nextSlide = () => setSelectedIndex((prev) => (prev + 1) % transformations.length);
    const prevSlide = () => setSelectedIndex((prev) => (prev - 1 + transformations.length) % transformations.length);

    return (
        <section id="transformations" className="relative py-24 overflow-hidden">
            <div ref={ref} className="relative container mx-auto px-4">
                <motion.div initial={{ opacity: 0, y: 20 }} animate={isInView ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.5 }} className="text-center mb-16">
                    <span className="text-sm font-semibold uppercase tracking-widest" style={{ color: '#e71763' }}>Real Results</span>
                    <h2 className="text-3xl md:text-5xl font-bold mt-4 mb-6">Client <span style={{ color: '#e71763' }}>Transformations</span></h2>
                    <p className="text-muted-foreground max-w-2xl mx-auto text-lg leading-relaxed">Real people, real results. Sustainable transformations built through structure, not restriction.</p>
                </motion.div>

                <motion.div initial={{ opacity: 0, y: 30 }} animate={isInView ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.5, delay: 0.2 }}
                    className="grid lg:grid-cols-2 gap-8 items-center max-w-5xl mx-auto mb-16">
                    <BeforeAfterSlider transformation={selected} />
                    <div className="space-y-6">
                        <div>
                            <span className="text-xs font-semibold uppercase tracking-widest" style={{ color: '#e71763' }}>{selected.category}</span>
                            <h3 className="text-3xl font-bold mt-1 text-white">{selected.name}</h3>
                            <p className="text-muted-foreground text-sm mt-1">{selected.role}</p>
                        </div>
                        <div className="relative">
                            <Quote className="absolute -top-2 -left-1 h-7 w-7" style={{ color: 'rgba(231,23,99,0.2)' }} />
                            <blockquote className="text-muted-foreground italic leading-relaxed pl-5">"{selected.quote}"</blockquote>
                        </div>
                        <div className="grid grid-cols-3 gap-3">
                            {[
                                { icon: Scale, label: "Result", value: selected.weightLost },
                                { icon: Clock, label: "Duration", value: selected.duration },
                                { icon: TrendingDown, label: "Body Fat", value: selected.stats.bodyFat, highlight: true },
                            ].map(({ icon: Icon, label, value, highlight }) => (
                                <div key={label} className="rounded-xl p-4 text-center" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }}>
                                    <Icon className="h-4 w-4 mx-auto mb-2" style={{ color: '#e71763' }} />
                                    <p className="text-xs text-muted-foreground">{label}</p>
                                    <p className={`text-sm font-bold mt-0.5 ${highlight ? '' : 'text-white'}`} style={highlight ? { color: '#e71763' } : {}}>{value}</p>
                                </div>
                            ))}
                        </div>
                        {selected.stats.before && selected.stats.after && (
                            <div className="flex items-center gap-3">
                                <div className="flex-1 rounded-xl p-3 text-center" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }}>
                                    <p className="text-xs text-muted-foreground">Before</p>
                                    <p className="text-xl font-bold text-muted-foreground">{selected.stats.before}</p>
                                </div>
                                <ChevronRight className="h-5 w-5 flex-shrink-0" style={{ color: '#e71763' }} />
                                <div className="flex-1 rounded-xl p-3 text-center" style={{ background: 'rgba(231,23,99,0.05)', border: '1px solid rgba(231,23,99,0.2)' }}>
                                    <p className="text-xs text-muted-foreground">After</p>
                                    <p className="text-xl font-bold" style={{ color: '#e71763' }}>{selected.stats.after}</p>
                                </div>
                            </div>
                        )}
                        <div className="flex items-center gap-4">
                            <Button variant="outline" size="icon" onClick={prevSlide} className="rounded-full border-white/10 text-white hover:bg-white/5">
                                <ChevronLeft className="h-5 w-5" />
                            </Button>
                            <div className="flex-1 flex items-center justify-center gap-2">
                                {transformations.map((_, index) => (
                                    <button key={index} onClick={() => setSelectedIndex(index)}
                                        className="h-2 rounded-full transition-all"
                                        style={{ width: index === selectedIndex ? '32px' : '8px', background: index === selectedIndex ? '#e71763' : 'rgba(255,255,255,0.2)' }} />
                                ))}
                            </div>
                            <Button variant="outline" size="icon" onClick={nextSlide} className="rounded-full border-white/10 text-white hover:bg-white/5">
                                <ChevronRight className="h-5 w-5" />
                            </Button>
                        </div>
                    </div>
                </motion.div>

                <motion.div initial={{ opacity: 0, y: 30 }} animate={isInView ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.5, delay: 0.4 }}
                    className="grid grid-cols-5 gap-3 max-w-2xl mx-auto">
                    {transformations.map((t, index) => (
                        <motion.button key={t.id} onClick={() => setSelectedIndex(index)}
                            initial={{ opacity: 0, scale: 0.9 }} animate={isInView ? { opacity: 1, scale: 1 } : {}}
                            transition={{ duration: 0.3, delay: 0.5 + index * 0.05 }}
                            className="relative aspect-square rounded-xl overflow-hidden border-2 transition-all"
                            style={{ borderColor: index === selectedIndex ? '#e71763' : 'rgba(255,255,255,0.1)', boxShadow: index === selectedIndex ? '0 0 12px rgba(231,23,99,0.4)' : 'none' }}>
                            {t.photoAfter ? (
                                <>
                                    <img src={t.photoAfter} alt={t.name} className="w-full h-full object-cover object-top" />
                                    <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent pt-4 pb-1.5 px-1">
                                        <p className="text-[9px] text-white font-semibold text-center leading-tight truncate">{t.name.split(" ")[0]}</p>
                                    </div>
                                </>
                            ) : (
                                <div className="w-full h-full flex flex-col items-center justify-center gap-1" style={{ background: 'rgba(255,255,255,0.05)' }}>
                                    <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ background: 'rgba(231,23,99,0.2)', border: '1px solid rgba(231,23,99,0.3)' }}>
                                        <span className="text-[10px] font-bold" style={{ color: '#e71763' }}>{getInitials(t.name)}</span>
                                    </div>
                                    <p className="text-[8px] text-white/50 font-medium leading-tight px-1 text-center truncate w-full">{t.name.split(" ")[0]}</p>
                                </div>
                            )}
                        </motion.button>
                    ))}
                </motion.div>

                <motion.div initial={{ opacity: 0, y: 20 }} animate={isInView ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.5, delay: 0.6 }} className="text-center mt-16">
                    <p className="text-muted-foreground mb-4">Ready to write your own success story?</p>
                    <a href="https://wa.me/919619708124" target="_blank" rel="noopener noreferrer">
                        <Button size="lg" className="text-white font-bold" style={{ background: '#e71763', boxShadow: '0 0 25px rgba(231,23,99,0.35)' }}>
                            Start Your Transformation
                        </Button>
                    </a>
                </motion.div>
            </div>
        </section>
    );
}
import { useState, useRef } from "react"
import { motion, useInView } from "framer-motion"
import { ChevronLeft, ChevronRight, Scale, Clock, TrendingDown, Quote } from "lucide-react"
import { Button } from "@/components/ui/button"

const transformations = [
    {
        id: 1,
        name: "Prajvati",
        role: "Anesthetist",
        duration: "1 Month",
        weightLost: "Lifestyle Transformation",
        category: "Lifestyle",
        quote: "As an anesthetist, maintaining my own health while caring for others can be challenging. What stood out about RECODE was its focus on sustainability and lifestyle integration. It wasn't about following a strict diet — it was about building habits that fit my routine and delivered lasting results.",
        stats: { before: "82kg", after: "71kg", bodyFat: "-9%" },
        photoBefore: null,
        photoAfter: null
    },
    {
        id: 2,
        name: "Aayush",
        role: "Finance Professional",
        duration: "3 Months",
        weightLost: "11kg Lost",
        category: "Fat Loss",
        quote: "As someone working in finance, consistency was always my biggest challenge. RECODE helped me build sustainable habits around nutrition and training, leading to an 11kg transformation without extreme dieting.",
        stats: { before: "82kg", after: "71kg", bodyFat: "-9%" },
        photoBefore: null,
        photoAfter: null
    },
    {
        id: 3,
        name: "Joshua",
        role: "Producer",
        duration: "3 Months",
        weightLost: "15kg Lost",
        category: "Fat Loss",
        quote: "As a producer, my schedule is fast-paced, stressful, and constantly changing. RECODE gave me a practical structure that fit my lifestyle instead of forcing me into a restrictive diet. Over 3 months, I lost 15kg while building habits that I could realistically maintain long-term.",
        stats: { before: "82kg", after: "71kg", bodyFat: "-9%" },
        photoBefore: null,
        photoAfter: null,
    },
    {
        id: 4,
        name: "Raj",
        role: "Actor",
        duration: "3 Months",
        weightLost: "15kg Lost",
        category: "Transformation",
        quote: "As an actor, staying camera-ready is part of the profession. RECODE gave me a structured and sustainable approach to nutrition and training that fit my schedule. In just 3 months, I transformed from 85kg to 70kg while improving my energy, confidence, and overall physique without relying on extreme dieting.",
        stats: { before: "85kg", after: "70kg", bodyFat: "-10%" },
        photoBefore: null,
        photoAfter: null
    },
    {
        id: 5,
        name: "Sudarshan Chavan",
        role: "Founder, RECODE™",
        duration: "4 Months",
        weightLost: "29kg Lost",
        category: "Founder's Journey",
        quote: "RECODE was born from my own transformation journey. After struggling with inconsistency, extreme approaches, and the cycle of starting over, I realized that lasting results come from structure, not restriction. Through a system focused on nutrition, movement, recovery, and lifestyle habits, I transformed from 85kg to 56kg and built a physique and lifestyle I could actually sustain.",
        stats: { before: "85kg", after: "56kg", bodyFat: "-18%" },
        photoBefore: "Testimonials/sudarshan-before.png",
        photoAfter: "Testimonials/sudarshan-after.jpeg",
    },
]

function BeforeAfterSlider({ transformation }) {
    const [sliderPosition, setSliderPosition] = useState(50)
    const containerRef = useRef(null)

    const handleMouseMove = (e) => {
        if (!containerRef.current) return
        const rect = containerRef.current.getBoundingClientRect()
        const x = Math.max(0, Math.min(e.clientX - rect.left, rect.width))
        setSliderPosition((x / rect.width) * 100)
    }

    const handleTouchMove = (e) => {
        if (!containerRef.current) return
        const rect = containerRef.current.getBoundingClientRect()
        const x = Math.max(0, Math.min(e.touches[0].clientX - rect.left, rect.width))
        setSliderPosition((x / rect.width) * 100)
    }

    return (
        <div
            ref={containerRef}
            className="relative aspect-[3/4] rounded-2xl overflow-hidden glass-card select-none cursor-ew-resize"
            onMouseMove={handleMouseMove}
            onTouchMove={handleTouchMove}
        >
            {/* AFTER photo — full width base layer */}
            <img
                src={transformation.photoAfter}
                alt="After"
                className="absolute inset-0 w-full h-full object-cover object-top"
                draggable={false}
            />

            {/* BEFORE photo — clipped to left of slider */}
            <div
                className="absolute inset-0 overflow-hidden"
                style={{ width: `${sliderPosition}%` }}
            >
                <img
                    src={transformation.photoBefore}
                    alt="Before"
                    className="absolute inset-0 h-full object-cover object-top"
                    style={{ width: `${(100 / sliderPosition) * 100}%`, maxWidth: "none" }}
                    draggable={false}
                />
            </div>

            {/* Divider line */}
            <div
                className="absolute top-0 bottom-0 w-0.5 bg-white z-10 shadow-[0_0_8px_rgba(0,0,0,0.8)]"
                style={{ left: `${sliderPosition}%` }}
            />

            {/* Drag handle */}
            <div
                className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 z-20 w-10 h-10 rounded-full bg-white shadow-lg flex items-center justify-center"
                style={{ left: `${sliderPosition}%` }}
            >
                <ChevronLeft className="h-3.5 w-3.5 text-black" />
                <ChevronRight className="h-3.5 w-3.5 text-black" />
            </div>

            {/* Labels */}
            <div className="absolute top-4 left-4 z-10 bg-black/60 backdrop-blur-sm px-3 py-1 rounded-full text-xs font-bold text-white">
                BEFORE
            </div>
            <div className="absolute top-4 right-4 z-10 bg-primary/80 backdrop-blur-sm px-3 py-1 rounded-full text-xs font-bold text-white">
                AFTER
            </div>

            {/* Range input for accessibility & fine control */}
            <input
                type="range"
                min="0"
                max="100"
                value={sliderPosition}
                onChange={(e) => setSliderPosition(Number(e.target.value))}
                className="absolute inset-0 w-full h-full opacity-0 cursor-ew-resize z-30"
            />
        </div>
    )
}

export function TransformationsSection() {
    const ref = useRef(null)
    const isInView = useInView(ref, { once: true, margin: "-100px" })
    const [selectedIndex, setSelectedIndex] = useState(0)

    const selected = transformations[selectedIndex]

    const nextSlide = () => setSelectedIndex((prev) => (prev + 1) % transformations.length)
    const prevSlide = () => setSelectedIndex((prev) => (prev - 1 + transformations.length) % transformations.length)

    return (
        <section id="transformations" className="relative py-24 overflow-hidden">
            <div className="absolute inset-0 bg-grid opacity-30" />

            <div ref={ref} className="relative container mx-auto px-4">
                {/* Header */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={isInView ? { opacity: 1, y: 0 } : {}}
                    transition={{ duration: 0.5 }}
                    className="text-center mb-16"
                >
                    <span className="text-primary text-sm font-semibold uppercase tracking-widest">Real Results</span>
                    <h2 className="text-3xl md:text-5xl font-bold mt-4 mb-6">
                        Client <span className="text-primary">Transformations</span>
                    </h2>
                    <p className="text-muted-foreground max-w-2xl mx-auto text-lg leading-relaxed">
                        Real people, real results. Sustainable transformations built through structure, not restriction.
                    </p>
                </motion.div>

                {/* Featured */}
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={isInView ? { opacity: 1, y: 0 } : {}}
                    transition={{ duration: 0.5, delay: 0.2 }}
                    className="grid lg:grid-cols-2 gap-8 items-center max-w-5xl mx-auto mb-16"
                >
                    <BeforeAfterSlider transformation={selected} />

                    {/* Details */}
                    <div className="space-y-6">
                        <div>
                            <span className="text-primary text-sm font-semibold uppercase tracking-widest">
                                {selected.category}
                            </span>
                            <h3 className="text-3xl font-bold mt-1">{selected.name}</h3>
                            <p className="text-muted-foreground text-sm mt-1">{selected.role}</p>
                        </div>

                        <div className="relative">
                            <Quote className="absolute -top-2 -left-1 h-7 w-7 text-primary/20" />
                            <blockquote className="text-muted-foreground italic leading-relaxed pl-5">
                                "{selected.quote}"
                            </blockquote>
                        </div>

                        {/* Stats */}
                        <div className="grid grid-cols-3 gap-3">
                            <div className="glass-card rounded-xl p-4 text-center">
                                <Scale className="h-4 w-4 text-primary mx-auto mb-2" />
                                <p className="text-xs text-muted-foreground">Result</p>
                                <p className="text-sm font-bold mt-0.5">{selected.weightLost}</p>
                            </div>
                            <div className="glass-card rounded-xl p-4 text-center">
                                <Clock className="h-4 w-4 text-primary mx-auto mb-2" />
                                <p className="text-xs text-muted-foreground">Duration</p>
                                <p className="text-sm font-bold mt-0.5">{selected.duration}</p>
                            </div>
                            <div className="glass-card rounded-xl p-4 text-center">
                                <TrendingDown className="h-4 w-4 text-primary mx-auto mb-2" />
                                <p className="text-xs text-muted-foreground">Body Fat</p>
                                <p className="text-sm font-bold mt-0.5 text-primary">{selected.stats.bodyFat}</p>
                            </div>
                        </div>

                        {/* Before / After weight if available */}
                        {selected.stats.before && selected.stats.after && (
                            <div className="flex items-center gap-3">
                                <div className="flex-1 glass-card rounded-xl p-3 text-center">
                                    <p className="text-xs text-muted-foreground">Before</p>
                                    <p className="text-xl font-bold text-muted-foreground">{selected.stats.before}</p>
                                </div>
                                <ChevronRight className="h-5 w-5 text-primary flex-shrink-0" />
                                <div className="flex-1 glass-card rounded-xl p-3 text-center border border-primary/20">
                                    <p className="text-xs text-muted-foreground">After</p>
                                    <p className="text-xl font-bold text-primary">{selected.stats.after}</p>
                                </div>
                            </div>
                        )}

                        {/* Navigation */}
                        <div className="flex items-center gap-4">
                            <Button variant="outline" size="icon" onClick={prevSlide} className="rounded-full text-white">
                                <ChevronLeft className="h-5 w-5" />
                            </Button>
                            <div className="flex-1 flex items-center justify-center gap-2">
                                {transformations.map((_, index) => (
                                    <button
                                        key={index}
                                        onClick={() => setSelectedIndex(index)}
                                        className={`h-2 rounded-full transition-all ${index === selectedIndex ? "w-8 bg-primary" : "w-2 bg-muted hover:bg-muted-foreground"}`}
                                    />
                                ))}
                            </div>
                            <Button variant="outline" size="icon" onClick={nextSlide} className="rounded-full text-white">
                                <ChevronRight className="h-5 w-5" />
                            </Button>
                        </div>
                    </div>
                </motion.div>

                {/* Thumbnail grid */}
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={isInView ? { opacity: 1, y: 0 } : {}}
                    transition={{ duration: 0.5, delay: 0.4 }}
                    className="grid grid-cols-5 gap-3 max-w-2xl mx-auto"
                >
                    {transformations.map((t, index) => (
                        <motion.button
                            key={t.id}
                            onClick={() => setSelectedIndex(index)}
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={isInView ? { opacity: 1, scale: 1 } : {}}
                            transition={{ duration: 0.3, delay: 0.5 + index * 0.05 }}
                            className={`relative aspect-square rounded-xl overflow-hidden border-2 transition-all ${index === selectedIndex
                                ? "border-primary shadow-[0_0_12px_hsl(var(--primary)/0.4)]"
                                : "border-white/10 hover:border-primary/40"
                                }`}
                        >
                            <img
                                src={t.photoAfter}
                                alt={t.name}
                                className="w-full h-full object-cover object-top"
                            />
                            <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent pt-4 pb-1.5 px-1">
                                <p className="text-[9px] text-white font-semibold text-center leading-tight truncate">
                                    {t.name.split(" ")[0]}
                                </p>
                            </div>
                        </motion.button>
                    ))}
                </motion.div>

                {/* CTA */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={isInView ? { opacity: 1, y: 0 } : {}}
                    transition={{ duration: 0.5, delay: 0.6 }}
                    className="text-center mt-16"
                >
                    <p className="text-muted-foreground mb-4">Ready to write your own success story?</p>
                    <a href="https://wa.me/919619708124" target="_blank" rel="noopener noreferrer">
                        <Button size="lg" className="glow-lime text-white">Start Your Transformation</Button>
                    </a>
                </motion.div>
            </div>
        </section>
    )
}

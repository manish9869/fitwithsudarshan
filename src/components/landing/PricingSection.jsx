"use client"
import { useState, useRef } from "react";
import { motion, useInView } from "framer-motion";
import { Check, Sparkles, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { pricing } from "@/data/siteData";

function Toggle({ checked, onCheckedChange }) {
    return (
        <button
            role="switch"
            aria-checked={checked}
            onClick={() => onCheckedChange(!checked)}
            className="relative inline-flex items-center rounded-full transition-colors duration-200 focus:outline-none"
            style={{ width: "48px", height: "26px", background: checked ? "#beff00" : "rgba(255,255,255,0.15)", border: "1px solid rgba(255,255,255,0.15)" }}
        >
            <span
                className="inline-block rounded-full transition-transform duration-200"
                style={{ width: "20px", height: "20px", background: checked ? "#0a0a0a" : "#ffffff", transform: checked ? "translateX(24px)" : "translateX(3px)" }}
            />
        </button>
    );
}

export function PricingSection() {
    const [showFounding, setShowFounding] = useState(true);
    const ref = useRef(null);
    const isInView = useInView(ref, { once: true, margin: "-100px" });

    const formatPrice = (price) =>
        new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(price);

    return (
        <section id="pricing" className="relative py-24 overflow-hidden">
            <div className="absolute inset-0 bg-grid opacity-30" />

            <div ref={ref} className="relative container mx-auto px-4">
                {/* Header */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={isInView ? { opacity: 1, y: 0 } : {}}
                    transition={{ duration: 0.5 }}
                    className="text-center mb-12"
                >
                    <span className="text-primary text-sm font-semibold uppercase tracking-widest">Pricing</span>
                    <h2 className="text-3xl md:text-5xl font-bold mt-4 mb-4">
                        Invest in Your <span className="text-primary">Transformation</span>
                    </h2>

                    {/* Founding Member Banner */}
                    <div className="inline-flex items-center gap-2 px-5 py-3 rounded-full glass-card border border-primary/30 mb-8 mt-2">
                        <Lock className="w-4 h-4 text-primary" />
                        <span className="text-sm font-semibold text-primary">Founding Member Pricing — Limited to First 50 Members. Lock Your Price Forever.</span>
                    </div>

                    {/* Toggle */}
                    <div className="flex items-center justify-center gap-4">
                        <span className={`text-sm ${!showFounding ? "text-foreground font-medium" : "text-muted-foreground"}`}>Regular Price</span>
                        <Toggle checked={showFounding} onCheckedChange={setShowFounding} />
                        <span className={`text-sm ${showFounding ? "text-foreground font-medium" : "text-muted-foreground"}`}>Founding Price</span>
                        {showFounding && (
                            <span className="text-xs font-bold px-2 py-1 rounded-full text-primary bg-primary/10 border border-primary/20">
                                Save up to 40%
                            </span>
                        )}
                    </div>
                </motion.div>

                {/* Cards */}
                <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4 max-w-7xl mx-auto">
                    {pricing.map((plan, index) => (
                        <motion.div
                            key={plan.name}
                            initial={{ opacity: 0, y: 30 }}
                            animate={isInView ? { opacity: 1, y: 0 } : {}}
                            transition={{ duration: 0.4, delay: 0.1 + index * 0.08 }}
                            className={`relative glass-card rounded-2xl p-5 flex flex-col transition-all ${plan.popular ? "scale-[1.03] z-10" : "hover:border-primary/30"}`}
                            style={plan.popular ? { border: "1px solid #beff00", boxShadow: "0 0 20px rgba(190,255,0,0.15)" } : {}}
                        >
                            {/* Badges */}
                            {plan.badge && (
                                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                                    <div className="flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold"
                                        style={{ background: plan.popular ? "#beff00" : "rgba(190,255,0,0.15)", color: plan.popular ? "#0a0a0a" : "#beff00" }}>
                                        {plan.popular && <Sparkles className="h-3 w-3" />}
                                        {plan.badge}
                                    </div>
                                </div>
                            )}

                            {/* Plan name */}
                            <div className="pt-2 mb-4">
                                <h3 className="text-sm font-bold mb-1">{plan.name}</h3>
                                <p className="text-xs text-muted-foreground">{plan.duration}</p>
                            </div>

                            {/* Price */}
                            <div className="mb-4">
                                {showFounding && plan.isFoundingDifferent && (
                                    <p className="text-xs text-muted-foreground line-through mb-1">{formatPrice(plan.regularPrice)}</p>
                                )}
                                <div className="flex items-baseline gap-1">
                                    <span className="text-2xl font-bold">
                                        {formatPrice(showFounding ? plan.foundingPrice : plan.regularPrice)}
                                    </span>
                                </div>
                                {showFounding && plan.isFoundingDifferent && (
                                    <p className="text-xs text-primary mt-1 font-medium">
                                        Save {formatPrice(plan.regularPrice - plan.foundingPrice)}
                                    </p>
                                )}
                            </div>

                            {/* Features */}
                            <ul className="space-y-2 mb-5 flex-1">
                                {plan.features.map((f) => (
                                    <li key={f} className="flex items-start gap-2">
                                        <div className="w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5" style={{ background: "rgba(190,255,0,0.15)" }}>
                                            <Check className="h-2.5 w-2.5" style={{ color: "#beff00" }} />
                                        </div>
                                        <span className="text-xs text-muted-foreground leading-relaxed">{f}</span>
                                    </li>
                                ))}
                            </ul>

                            {/* CTA */}
                            <a href="https://wa.me/919619708124" target="_blank" rel="noopener noreferrer" className="w-full">
                                <Button
                                    className="w-full text-sm font-semibold"
                                    variant={plan.popular ? "default" : "outline"}
                                    size="sm"
                                    style={plan.popular ? { background: "#beff00", color: "#0a0a0a", boxShadow: "0 0 20px rgba(190,255,0,0.3)" } : {}}
                                >
                                    {plan.cta}
                                </Button>
                            </a>
                        </motion.div>
                    ))}
                </div>

                {/* Consult add-on */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={isInView ? { opacity: 1, y: 0 } : {}}
                    transition={{ duration: 0.5, delay: 0.6 }}
                    className="mt-10 max-w-2xl mx-auto glass-card rounded-2xl p-6 border border-primary/20 text-center"
                >
                    <h3 className="font-bold text-lg mb-2">RECODE CONSULT</h3>
                    <p className="text-muted-foreground text-sm mb-3">Single 60-minute one-on-one session — movement assessment, lifestyle review, nutrition guidance, recovery analysis & action plan.</p>
                    <p className="text-2xl font-bold text-primary mb-4">₹1,999 <span className="text-sm text-muted-foreground font-normal">/ session</span></p>
                    <a href="https://wa.me/919619708124" target="_blank" rel="noopener noreferrer">
                        <Button variant="outline" className="hover:border-primary/50">Book a Session</Button>
                    </a>
                </motion.div>

                <motion.p
                    initial={{ opacity: 0 }}
                    animate={isInView ? { opacity: 1 } : {}}
                    transition={{ duration: 0.5, delay: 0.7 }}
                    className="text-center text-muted-foreground text-sm mt-8"
                >
                    100% satisfaction commitment. Questions? <a href="https://wa.me/919619708124" className="text-primary hover:underline">Message on WhatsApp</a>
                </motion.p>
            </div>
        </section>
    );
}
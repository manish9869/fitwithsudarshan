import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { ChevronDown, ArrowRight, Users, Award, Clock, TrendingUp } from "lucide-react";
import { Link } from "react-router-dom";
import { coach, brand } from "@/data/SiteData";

const stats = [
    { icon: TrendingUp, value: "29kg", label: "Personal Transformation" },
    { icon: Users, value: "200+", label: "Clients Guided" },
    { icon: Clock, value: "8+", label: "Years Experience" },
    { icon: Award, value: "ACSM", label: "Certified Coach" },
];

function AnimatedCounter({ value, suffix = "" }) {
    const numeric = parseInt(value);
    const isNumeric = !isNaN(numeric);
    const [count, setCount] = useState(0);

    useEffect(() => {
        if (!isNumeric) return;
        const duration = 2000;
        const steps = 60;
        const increment = numeric / steps;
        let current = 0;
        const timer = setInterval(() => {
            current += increment;
            if (current >= numeric) { setCount(numeric); clearInterval(timer); }
            else setCount(Math.floor(current));
        }, duration / steps);
        return () => clearInterval(timer);
    }, [numeric, isNumeric]);

    if (!isNumeric) return <span className="text-3xl md:text-4xl font-bold text-primary">{value}</span>;
    return <span className="text-3xl md:text-4xl font-bold text-primary">{count}{suffix}</span>;
}


const heroBg = "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=1920&h=1080&fit=crop&q=80";

export default function HeroSection() {
    return (
        <section id="home" className="relative min-h-screen flex items-center justify-center overflow-hidden">
            {/* Full-bleed background image */}
            <img
                src={heroBg}
                alt="Fitness training background"
                className="absolute inset-0 w-full h-full object-cover object-center"
            />

            {/* Background Elements */}
            <div className="absolute inset-0 bg-grid opacity-20" />
            <div className="absolute inset-0 bg-gradient-to-b from-background via-background/70 to-background" />

            {/* Animated Background Orbs */}
            <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl animate-pulse" />
            <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-primary/5 rounded-full blur-3xl animate-pulse delay-1000" />

            <div className="relative container mx-auto px-4 pt-24 pb-20">
                <div className="max-w-5xl mx-auto text-center">

                    {/* Founding badge */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5 }}
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass-card mb-8"
                        style={{ border: '1px solid rgba(231,23,99,0.2)' }}
                    >
                        <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                        <span className="text-sm font-medium text-muted-foreground">
                            Founding Member Pricing · Limited to First 50 Members
                        </span>
                    </motion.div>

                    {/* System name */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: 0.05 }}
                        className="mb-4"
                    >
                        <span className="text-primary text-sm font-bold uppercase tracking-[0.3em]">
                            {brand.system} · {brand.positioning}
                        </span>
                    </motion.div>

                    {/* Main headline */}
                    <motion.h1
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, delay: 0.1 }}
                        className="text-5xl md:text-7xl lg:text-8xl font-bold leading-[1.05] mb-6 text-white"
                    >
                        Recover.{" "}
                        <span className="text-primary text-glow-lime">Regulate.</span>
                        <br />
                        Rebuild Your Life.
                    </motion.h1>

                    <motion.p
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, delay: 0.2 }}
                        className="text-lg md:text-xl text-muted-foreground max-w-3xl mx-auto mb-4 leading-relaxed"
                    >
                        A recovery-based transformation system designed to restore structure, regulate the body, and create sustainable physical transformation.
                    </motion.p>

                    <motion.p
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: 0.25 }}
                        className="text-sm text-muted-foreground/70 max-w-2xl mx-auto mb-10"
                    >
                        Helping professionals, entrepreneurs, students & families through Online Coaching, Video Consultation & Personal Training in Mumbai.
                    </motion.p>

                    {/* CTAs */}
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, delay: 0.3 }}
                        className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16"
                    >
                        <a href="https://wa.me/919619708124" target="_blank" rel="noopener noreferrer">
                            <Button
                                size="lg"
                                className="glow-lime text-lg px-8 py-6 text-white font-bold group"
                                style={{ background: '#e71763' }}
                            >
                                Apply For Coaching
                                <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                            </Button>
                        </a>
                        <a href="#transformations">
                            <Button size="lg" variant="outline" className="text-lg px-8 py-6 hover:bg-white/5 hover:text-white hover:border-white/20">
                                View Transformations
                            </Button>
                        </a>
                    </motion.div>

                    {/* Stats */}
                    <motion.div
                        initial={{ opacity: 0, y: 40 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, delay: 0.4 }}
                        className="grid grid-cols-2 md:grid-cols-4 gap-4"
                    >
                        {stats.map((stat, index) => (
                            <motion.div
                                key={stat.label}
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ duration: 0.4, delay: 0.5 + index * 0.1 }}
                                className="glass-card rounded-2xl p-6 hover:border-primary/30 transition-all group"
                            >
                                <div className="flex flex-col items-center gap-2">
                                    <stat.icon className="h-5 w-5 text-primary mb-1 group-hover:scale-110 transition-transform" />
                                    <AnimatedCounter
                                        value={stat.value.replace("+", "").replace("kg", "")}
                                        suffix={stat.value.includes("+") ? "+" : stat.value.includes("kg") ? "kg" : ""}
                                    />
                                    <span className="text-xs text-muted-foreground text-center">{stat.label}</span>
                                </div>
                            </motion.div>
                        ))}
                    </motion.div>
                </div>

                {/* Scroll indicator */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 1.5 }}
                    className="absolute bottom-8 left-1/2 -translate-x-1/2"
                >
                    <motion.div
                        animate={{ y: [0, 10, 0] }}
                        transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
                        className="flex flex-col items-center gap-2 text-muted-foreground"
                    >
                        <span className="text-xs uppercase tracking-widest">Scroll to explore</span>
                        <ChevronDown className="h-4 w-4" />
                    </motion.div>
                </motion.div>
            </div>
        </section>
    );
}
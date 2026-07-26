import React from 'react';
import HeroSection from '@/components/landing/HeroSection';
import FeaturesSection from '@/components/landing/FeaturesSection';
import TestimonialsSection from '@/components/landing/TestimonialsSection';
import FooterSection from '@/components/landing/FooterSection';
import { TransformationsSection } from '@/components/landing/TransformationsSection';
import { ToolsSection } from '@/components/landing/ToolsSection';
// FIX: was importing the static PricingSection.jsx (hardcoded @/data/SiteData).
// Import the dynamic one so admin edits (pricing, sale flag) actually show up.
import { PricingSection } from '@/components/landing/ProgramsSection';
import { ContactSection } from '@/components/landing/ContactSection';
import BlogSection from '@/components/landing/BlogSection';
import FloatingWhatsApp from '@/components/landing/FloatingWhatsApp';
import StickyCTABar from '@/components/landing/StickyCTABar';

import { Button } from '@/components/ui/button';
import { motion, useInView } from 'framer-motion';
import { useRef } from 'react';
import { Navbar } from '@/components/landing/Navbar';
import { wa } from "@/utils/whatsapp";

function Reveal({ children, delay = 0 }) {
    const ref = useRef(null);
    const isInView = useInView(ref, { once: true, margin: "-80px" });
    return (
        <motion.div
            ref={ref}
            initial={{ opacity: 0, y: 48 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6, delay, ease: [0.22, 1, 0.36, 1] }}
        >
            {children}
        </motion.div>
    );
}

export default function Landing() {
    return (
        <div className="min-h-screen bg-background text-foreground">
            <Navbar />
            <HeroSection />

            <Reveal><div id="features"><FeaturesSection /></div></Reveal>
            <Reveal delay={0.05}><div id="transformations"><TransformationsSection /></div></Reveal>
            <Reveal delay={0.05}><div id="tools"><ToolsSection /></div></Reveal>
            <Reveal delay={0.05}><div id="testimonials"><TestimonialsSection /></div></Reveal>
            <Reveal delay={0.05}><div id="pricing"><PricingSection /></div></Reveal>
            <Reveal delay={0.05}><div id="blog"><BlogSection /></div></Reveal>

            <section className="py-12 sm:py-24 px-3 sm:px-4 relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-t from-primary/5 to-transparent pointer-events-none" />
                <motion.div
                    className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] rounded-full blur-3xl pointer-events-none"
                    style={{ background: 'rgba(231,23,99,0.06)' }}
                    animate={{ scale: [1, 1.15, 1], opacity: [0.5, 0.9, 0.5] }}
                    transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
                />
                <Reveal>
                    <div className="max-w-3xl mx-auto text-center relative z-10">
                        <motion.span
                            className="inline-block text-xs font-bold uppercase tracking-widest mb-3 sm:mb-4"
                            style={{ color: '#e71763' }}
                            animate={{ opacity: [0.6, 1, 0.6] }}
                            transition={{ duration: 2.5, repeat: Infinity }}
                        >
                            Your Transformation Starts Now
                        </motion.span>

                        <h2 className="text-2xl sm:text-3xl md:text-5xl font-bold mb-4 sm:mb-6 text-white">
                            Ready to{' '}
                            <span style={{ color: '#e71763', textShadow: '0 0 30px rgba(231,23,99,0.4)' }}>RECODE?</span>
                        </h2>

                        <p className="text-sm sm:text-lg text-muted-foreground mb-6 sm:mb-8 px-2">
                            Join hundreds who've already started their transformation with Sudarshan. Your RECODE journey begins today.
                        </p>

                        <div className="flex justify-center">
                            <div className="relative">
                                <motion.span
                                    className="absolute inset-0 rounded-full"
                                    animate={{ scale: [1, 1.6, 2.2], opacity: [0.4, 0.15, 0] }}
                                    transition={{ duration: 2.5, repeat: Infinity, ease: "easeOut" }}
                                    style={{ background: 'rgba(231,23,99,0.35)' }}
                                />
                                <motion.span
                                    className="absolute inset-0 rounded-full"
                                    animate={{ scale: [1, 1.35, 1.7], opacity: [0.3, 0.1, 0] }}
                                    transition={{ duration: 2.5, repeat: Infinity, ease: "easeOut", delay: 0.7 }}
                                    style={{ background: 'rgba(231,23,99,0.2)' }}
                                />
                                <a href={wa.coaching} target="_blank" rel="noopener noreferrer">
                                    <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.97 }}>
                                        <Button
                                            size="lg"
                                            className="relative text-white rounded-full py-4 sm:py-7 text-sm sm:text-lg font-bold px-6 sm:px-12"
                                            style={{ background: '#e71763', boxShadow: '0 0 40px rgba(231,23,99,0.5)' }}
                                        >
                                            Start My Transformation
                                        </Button>
                                    </motion.div>
                                </a>
                            </div>
                        </div>
                    </div>
                </Reveal>
            </section>

            <Reveal><div id="contact"><ContactSection /></div></Reveal>
            <FooterSection />

            <FloatingWhatsApp />
            <StickyCTABar />
        </div>
    );
}
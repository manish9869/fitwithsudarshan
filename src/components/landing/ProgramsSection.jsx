import { useRef } from "react";
import { motion, useInView } from "framer-motion";
import { Globe, Video, MapPin, Crown, Check, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { services } from "@/data/SiteData";

const icons = { online: Globe, consult: Video, personal: MapPin, elite: Crown };

export default function ProgramsSection() {
    const ref = useRef(null);
    const isInView = useInView(ref, { once: true, margin: "-100px" });

    return (
        <section id="programs" className="relative py-24 overflow-hidden">
            <div className="absolute inset-0 bg-grid opacity-30" />

            <div ref={ref} className="relative container mx-auto px-4">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={isInView ? { opacity: 1, y: 0 } : {}}
                    transition={{ duration: 0.5 }}
                    className="text-center mb-16"
                >
                    <span className="text-primary text-sm font-semibold uppercase tracking-widest">Services</span>
                    <h2 className="text-3xl md:text-5xl font-bold mt-4 mb-6">
                        Choose Your <span className="text-primary">RECODE Path</span>
                    </h2>
                    <p className="text-muted-foreground max-w-2xl mx-auto text-lg leading-relaxed">
                        Four ways to work with Sudarshan — online, via consultation, in-person in Mumbai, or as an elite client. Every path uses the RECODE™ system.
                    </p>
                </motion.div>

                <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {services.map((service, index) => {
                        const Icon = icons[service.id];
                        return (
                            <motion.div
                                key={service.id}
                                initial={{ opacity: 0, y: 30 }}
                                animate={isInView ? { opacity: 1, y: 0 } : {}}
                                transition={{ duration: 0.4, delay: 0.1 + index * 0.1 }}
                                className="group relative"
                            >
                                <div className="h-full glass-card rounded-2xl p-6 hover:border-primary/30 transition-all duration-300 hover:-translate-y-1 flex flex-col">
                                    {/* Badge */}
                                    {service.badge && (
                                        <div className="absolute -top-3 left-6">
                                            <span className="px-3 py-1 rounded-full text-xs font-bold bg-primary text-white">
                                                {service.badge}
                                            </span>
                                        </div>
                                    )}

                                    {/* Icon */}
                                    <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${service.color} flex items-center justify-center mb-5 group-hover:scale-110 transition-transform`}>
                                        <Icon className="h-6 w-6 text-foreground" />
                                    </div>

                                    {/* Title */}
                                    <h3 className={`text-lg font-bold mb-1 group-hover:${service.accent} transition-colors`}>
                                        {service.title}
                                    </h3>
                                    <p className="text-sm text-muted-foreground mb-5 leading-relaxed">{service.subtitle}</p>

                                    {/* Features */}
                                    <ul className="space-y-2 mb-6 flex-1">
                                        {service.features.map((f) => (
                                            <li key={f} className="flex items-center gap-2 text-sm">
                                                <Check className={`w-3.5 h-3.5 flex-shrink-0 ${service.accent}`} />
                                                <span className="text-muted-foreground">{f}</span>
                                            </li>
                                        ))}
                                    </ul>

                                    {/* CTA */}
                                    <a href="https://wa.me/919619708124" target="_blank" rel="noopener noreferrer">
                                        <Button variant="ghost" className={`w-full group/btn hover:bg-primary/10 hover:text-primary`}>
                                            Apply Now
                                            <ArrowRight className="ml-2 h-4 w-4 group-hover/btn:translate-x-1 transition-transform" />
                                        </Button>
                                    </a>
                                </div>
                            </motion.div>
                        );
                    })}
                </div>

                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={isInView ? { opacity: 1, y: 0 } : {}}
                    transition={{ duration: 0.5, delay: 0.6 }}
                    className="text-center mt-16"
                >
                    <p className="text-muted-foreground mb-6">Not sure which path is right for you?</p>
                    <a href="https://wa.me/919619708124" target="_blank" rel="noopener noreferrer">
                        <Button size="lg" className="glow-lime text-white font-bold">Book a Free Consultation</Button>
                    </a>
                </motion.div>
            </div>
        </section>
    );
}
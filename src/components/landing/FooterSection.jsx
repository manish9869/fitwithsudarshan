import { useState } from "react";
import { motion } from "framer-motion";
import { Instagram, Youtube, MessageCircle, Mail, Dumbbell, Heart, Zap, ArrowRight, Activity, Target, Flame } from "lucide-react";
import { contact, brand } from "@/data/SiteData";

const navSections = [
    { name: "Home", href: "#home" },
    { name: "About", href: "#about" },
    { name: "Transformations", href: "#transformations" },
    { name: "Testimonials", href: "#testimonials" },
    { name: "Programs & Pricing", href: "#pricing" },
    { name: "Blog", href: "#blog" },
    { name: "Contact", href: "#contact" },
];

const programs = [
    { name: "RECODE ONLINE", href: "#pricing" },
    { name: "RECODE CONSULT", href: "#pricing" },
    { name: "RECODE PERSONAL", href: "#pricing" },
];

const resources = [
    { name: "Free Fitness Blog", href: "#blog" },
    { name: "Before & After Results", href: "#transformations" },
    { name: "Free Consultation", href: contact.social.whatsapp, external: true },
    { name: "Apply for Coaching", href: contact.social.whatsapp, external: true },
];

const socialLinks = [
    { icon: Instagram, label: "Instagram", href: contact.social.instagram },
    { icon: Youtube, label: "YouTube", href: contact.social.youtube },
    { icon: MessageCircle, label: "WhatsApp", href: contact.social.whatsapp },
    { icon: Mail, label: "Email", href: `mailto:${contact.email}` },
];

// Tiny floating fitness icons scattered in bg
const bgIcons = [Activity, Flame, Target, Heart, Zap, Dumbbell];

export default function FooterSection() {
    const [email, setEmail] = useState("");
    const [subscribed, setSubscribed] = useState(false);
    const currentYear = new Date().getFullYear();

    const handleSubscribe = (e) => {
        e.preventDefault();
        if (email) setSubscribed(true);
    };

    return (
        <footer className="relative pt-24 pb-8 overflow-hidden" style={{ background: 'linear-gradient(to bottom, hsl(var(--background)), #000)' }}>
            {/* Scattered bg icons */}
            <div className="absolute inset-0 pointer-events-none overflow-hidden">
                {bgIcons.map((Icon, i) => (
                    <motion.div key={i} className="absolute"
                        style={{ left: `${10 + i * 15}%`, top: `${15 + (i % 3) * 25}%`, opacity: 0.04 }}
                        animate={{ y: [0, -18, 0], rotate: [0, 15, 0] }}
                        transition={{ duration: 7 + i * 1.2, repeat: Infinity, delay: i * 0.8, ease: "easeInOut" }}>
                        <Icon className="w-12 h-12 text-primary" />
                    </motion.div>
                ))}
                {/* Top border glow line */}
                <div className="absolute top-0 left-0 right-0 h-px"
                    style={{ background: 'linear-gradient(90deg, transparent 0%, rgba(231,23,99,0.6) 30%, rgba(231,23,99,1) 50%, rgba(231,23,99,0.6) 70%, transparent 100%)' }} />
                {/* Radial glow */}
                <motion.div className="absolute top-0 left-1/2 -translate-x-1/2 w-[700px] h-[300px] rounded-full blur-[100px]"
                    style={{ background: 'rgba(231,23,99,0.07)' }}
                    animate={{ opacity: [0.5, 1, 0.5] }} transition={{ duration: 5, repeat: Infinity }} />
            </div>

            <div className="relative container mx-auto px-4 max-w-6xl">

                {/* ── Newsletter CTA ── */}
                <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
                    transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
                    className="relative rounded-3xl p-8 md:p-12 mb-20 overflow-hidden"
                    style={{ background: 'linear-gradient(135deg, rgba(231,23,99,0.12) 0%, rgba(231,23,99,0.04) 50%, rgba(0,0,0,0.4) 100%)', border: '1px solid rgba(231,23,99,0.25)' }}>
                    {/* Inner glow */}
                    <motion.div className="absolute inset-0 rounded-3xl pointer-events-none"
                        style={{ background: 'radial-gradient(ellipse at 20% 50%, rgba(231,23,99,0.12) 0%, transparent 60%)' }}
                        animate={{ opacity: [0.5, 1, 0.5] }} transition={{ duration: 4, repeat: Infinity }} />
                    <div className="grid md:grid-cols-2 gap-8 items-center relative">
                        <div>
                            <div className="flex items-center gap-2 mb-3">
                                <Zap className="w-4 h-4" style={{ color: '#e71763' }} />
                                <span className="text-xs font-black uppercase tracking-widest" style={{ color: '#e71763' }}>Free Weekly Tips</span>
                            </div>
                            <h3 className="text-2xl md:text-3xl font-black text-white mb-2">Get Free RECODE™ Insights</h3>
                            <p className="text-white/45 text-sm leading-relaxed">Weekly recovery, nutrition &amp; transformation tips delivered to your inbox. No spam, ever.</p>
                        </div>
                        <form onSubmit={handleSubscribe} className="flex flex-col sm:flex-row gap-3">
                            {subscribed ? (
                                <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
                                    className="flex items-center gap-2 px-5 py-3 rounded-xl font-bold text-white"
                                    style={{ background: 'rgba(231,23,99,0.15)', border: '1px solid rgba(231,23,99,0.3)' }}>
                                    <Heart className="w-4 h-4" style={{ color: '#e71763' }} /> You're subscribed!
                                </motion.div>
                            ) : (
                                <>
                                    <input type="email" required placeholder="Enter your email"
                                        value={email} onChange={e => setEmail(e.target.value)}
                                        className="flex-1 px-4 py-3 rounded-xl text-sm text-white placeholder:text-white/30 outline-none"
                                        style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)' }} />
                                    <motion.button type="submit" whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.97 }}
                                        className="px-6 py-3 rounded-xl font-black text-sm text-white whitespace-nowrap flex items-center gap-2"
                                        style={{ background: '#e71763', boxShadow: '0 0 25px rgba(231,23,99,0.45)' }}>
                                        Subscribe <ArrowRight className="w-4 h-4" />
                                    </motion.button>
                                </>
                            )}
                        </form>
                    </div>
                </motion.div>

                {/* ── Main footer grid ── */}
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-8 md:gap-10 mb-14">

                    {/* Brand col */}
                    <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
                        transition={{ duration: 0.6 }} className="col-span-2 lg:col-span-1">
                        <a href="#home" className="flex items-center gap-2 mb-4 group">
                            <img src="https://vducmiggraxtqdgt.public.blob.vercel-storage.com/logo.png"
                                alt="FitWithSudarshan" className="h-10 group-hover:scale-105 transition-transform" />
                        </a>
                        <div className="flex items-center gap-1.5 mb-3">
                            <div className="w-1.5 h-1.5 rounded-full" style={{ background: '#e71763' }} />
                            <span className="text-xs font-black tracking-widest" style={{ color: '#e71763' }}>RECODE™</span>
                        </div>
                        <p className="text-sm text-white/35 mb-6 leading-relaxed">{brand.tagline}</p>
                        <div className="flex items-center gap-2">
                            {socialLinks.map((s) => (
                                <motion.a key={s.label} href={s.href} target="_blank" rel="noopener noreferrer"
                                    whileHover={{ scale: 1.15, y: -2 }}
                                    className="w-9 h-9 rounded-xl flex items-center justify-center text-white/40 transition-colors"
                                    style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}
                                    onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(231,23,99,0.5)'; e.currentTarget.style.color = '#e71763'; e.currentTarget.style.background = 'rgba(231,23,99,0.1)'; }}
                                    onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)'; e.currentTarget.style.color = ''; e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; }}
                                    aria-label={s.label}>
                                    <s.icon className="h-4 w-4" />
                                </motion.a>
                            ))}
                        </div>
                    </motion.div>

                    {/* Links cols */}
                    {[
                        { title: "Navigate", links: navSections },
                        { title: "Programs", links: programs },
                        { title: "Resources", links: resources },
                    ].map(({ title, links }, ci) => (
                        <motion.div key={title} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }} transition={{ duration: 0.6, delay: ci * 0.08 }}>
                            <h4 className="text-xs font-black uppercase tracking-[0.2em] text-white/50 mb-5">{title}</h4>
                            <ul className="space-y-2.5">
                                {links.map((link) => (
                                    <li key={link.name}>
                                        <a href={link.href}
                                            target={link.external ? "_blank" : undefined}
                                            rel={link.external ? "noopener noreferrer" : undefined}
                                            className="text-sm text-white/35 transition-all hover:text-white flex items-center gap-1.5 group">
                                            <span className="w-0 group-hover:w-3 h-px transition-all duration-300" style={{ background: '#e71763' }} />
                                            {link.name}
                                        </a>
                                    </li>
                                ))}
                            </ul>
                        </motion.div>
                    ))}
                </div>

                {/* ── Divider + bottom ── */}
                <div className="relative pt-8" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                    {/* Glow on divider */}
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 w-48 h-px"
                        style={{ background: 'linear-gradient(90deg, transparent, rgba(231,23,99,0.6), transparent)' }} />

                    <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                        <p className="text-xs text-white/25">
                            © {currentYear} FitWithSudarshan. All rights reserved. Built with <Heart className="inline w-3 h-3 mx-0.5" style={{ color: '#e71763' }} /> in Mumbai.
                        </p>
                        <div className="flex items-center gap-2 text-xs text-white/25">
                            <Dumbbell className="w-3 h-3" style={{ color: '#e71763' }} />
                            <span>Powered by RECODE™ System</span>
                        </div>
                        <div className="flex items-center gap-5 text-xs text-white/25">
                            <a href="#" className="hover:text-white/60 transition-colors">Privacy Policy</a>
                            <a href="#" className="hover:text-white/60 transition-colors">Terms of Service</a>
                        </div>
                    </div>
                </div>
            </div>
        </footer>
    );
}
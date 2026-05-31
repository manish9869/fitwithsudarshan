import { motion } from "framer-motion";
import { Instagram, Youtube, MessageCircle, Mail, Heart, Dumbbell } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { contact, brand } from "@/data/SiteData";

const footerLinks = {
    quickLinks: [
        { name: "Home", href: "#home" },
        { name: "About", href: "#about" },
        { name: "Programs", href: "#programs" },
        { name: "Transformations", href: "#transformations" },
        { name: "Pricing", href: "#pricing" },
        { name: "Contact", href: "#contact" },
    ],
    programs: [
        { name: "RECODE ONLINE", href: "#programs" },
        { name: "RECODE CONSULT", href: "#programs" },
        { name: "RECODE PERSONAL", href: "#programs" },
        { name: "RECODE ELITE", href: "#programs" },
    ],
    resources: [
        { name: "Fitness Blog", href: "/blog" },
        { name: "Transformations", href: "#transformations" },
        { name: "Free Consultation", href: contact.social.whatsapp },
        { name: "Apply for Coaching", href: contact.social.whatsapp },
    ],
};

const socialLinks = [
    { icon: Instagram, label: "Instagram", href: contact.social.instagram },
    { icon: Youtube, label: "YouTube", href: contact.social.youtube },
    { icon: MessageCircle, label: "WhatsApp", href: contact.social.whatsapp },
    { icon: Mail, label: "Email", href: `mailto:${contact.email}` },
];

export default function FooterSection() {
    const currentYear = new Date().getFullYear();

    return (
        <footer className="relative pt-20 pb-8 overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-t from-muted/50 to-background" />
            <div className="absolute inset-0 bg-grid opacity-20" />

            <div className="relative container mx-auto px-4">
                {/* Newsletter */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5 }}
                    className="glass-card rounded-2xl p-8 md:p-12 mb-16"
                    style={{ border: '1px solid rgba(231,23,99,0.2)' }}
                >
                    <div className="grid md:grid-cols-2 gap-8 items-center">
                        <div>
                            <h3 className="text-2xl md:text-3xl font-bold mb-2">Get Free RECODE™ Tips</h3>
                            <p className="text-muted-foreground">
                                Subscribe for weekly recovery, nutrition, and transformation insights delivered to your inbox.
                            </p>
                        </div>
                        <div className="flex flex-col sm:flex-row gap-3">
                            <Input type="email" placeholder="Enter your email" className="bg-muted/50 flex-1" />
                            <Button className="glow-lime text-white font-bold whitespace-nowrap">Subscribe</Button>
                        </div>
                    </div>
                </motion.div>

                {/* Links */}
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-8 mb-12">
                    {/* Brand */}
                    <div className="col-span-2 md:col-span-4 lg:col-span-1">
                        <a href="#home" className="group flex items-center gap-2 mb-4">
                            <div className="relative">
                                <Dumbbell
                                    className="h-7 w-7 transition-transform group-hover:scale-110"
                                    style={{ color: '#e71763', filter: 'drop-shadow(0 0 6px rgba(231,23,99,0.7))' }}
                                />
                            </div>
                            <span className="text-lg font-bold">
                                FitWith<span style={{ color: '#e71763' }}>Sudarshan</span>
                            </span>
                        </a>
                        <p className="text-xs font-semibold mb-1" style={{ color: '#e71763' }}>RECODE™</p>
                        <p className="text-sm text-muted-foreground mb-4 leading-relaxed">
                            {brand.tagline}
                        </p>
                        <div className="flex items-center gap-3">
                            {socialLinks.map((s) => (
                                <a
                                    key={s.label}
                                    href={s.href}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="w-9 h-9 rounded-full glass flex items-center justify-center transition-all"
                                    style={{ border: '1px solid rgba(255,255,255,0.08)' }}
                                    onMouseEnter={e => {
                                        e.currentTarget.style.borderColor = 'rgba(231,23,99,0.5)';
                                        e.currentTarget.style.color = '#e71763';
                                        e.currentTarget.style.boxShadow = '0 0 12px rgba(231,23,99,0.25)';
                                    }}
                                    onMouseLeave={e => {
                                        e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)';
                                        e.currentTarget.style.color = '';
                                        e.currentTarget.style.boxShadow = '';
                                    }}
                                    aria-label={s.label}
                                >
                                    <s.icon className="h-4 w-4" />
                                </a>
                            ))}
                        </div>
                    </div>

                    <div>
                        <h4 className="font-semibold mb-4 text-sm">Quick Links</h4>
                        <ul className="space-y-2">
                            {footerLinks.quickLinks.map((link) => (
                                <li key={link.name}>
                                    <a href={link.href} className="text-sm text-muted-foreground hover:text-primary transition-colors">{link.name}</a>
                                </li>
                            ))}
                        </ul>
                    </div>

                    <div>
                        <h4 className="font-semibold mb-4 text-sm">Programs</h4>
                        <ul className="space-y-2">
                            {footerLinks.programs.map((link) => (
                                <li key={link.name}>
                                    <a href={link.href} className="text-sm text-muted-foreground hover:text-primary transition-colors">{link.name}</a>
                                </li>
                            ))}
                        </ul>
                    </div>

                    <div>
                        <h4 className="font-semibold mb-4 text-sm">Resources</h4>
                        <ul className="space-y-2">
                            {footerLinks.resources.map((link) => (
                                <li key={link.name}>
                                    <a href={link.href} target={link.href.startsWith("http") ? "_blank" : undefined} rel="noopener noreferrer" className="text-sm text-muted-foreground hover:text-primary transition-colors">{link.name}</a>
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>

                {/* Bottom bar */}
                <div className="border-t border-border pt-8">
                    <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                        <p className="text-sm text-muted-foreground">
                            © {currentYear} FitWithSudarshan. All rights reserved.
                        </p>
                        <div className="flex items-center gap-6 text-sm text-muted-foreground">
                            <a href="#" className="hover:text-primary transition-colors">Privacy Policy</a>
                            <a href="#" className="hover:text-primary transition-colors">Terms of Service</a>
                        </div>
                        <p className="text-sm text-muted-foreground flex items-center gap-1">
                            Built with <Heart className="h-3 w-3 mx-1" style={{ color: '#e71763', fill: '#e71763' }} /> for transformation
                        </p>
                    </div>
                </div>
            </div>
        </footer>
    );
}
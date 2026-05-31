"use client"
import { useRef, useState } from "react";
import { motion, useInView } from "framer-motion";
import { Mail, Phone, MapPin, MessageCircle, Instagram, Youtube, Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { contact } from "@/data/SiteData";
import emailjs from "@emailjs/browser";

// ─── EMAILJS CONFIG ────────────────────────────────────────────────
// Replace these with your actual values from emailjs.com
const EMAILJS_SERVICE_ID = "service_ek1wuc3";   // e.g. "service_abc123"
const EMAILJS_TEMPLATE_ID = "template_4pab1rw";  // e.g. "template_xyz456"
const EMAILJS_PUBLIC_KEY = "aDYF7gZgkw0Sq3iei";   // e.g. "abcDEFghiJKL789"
// ───────────────────────────────────────────────────────────────────

// EmailJS template variables used (set these up in your template):
// {{from_name}}   — sender's name
// {{from_email}}  — sender's email
// {{phone}}       — sender's phone
// {{goal}}        — fitness goal
// {{message}}     — message body
// {{to_name}}     — "Sudarshan" (hardcoded below)

const contactInfo = [
    { icon: Phone, label: "Phone", value: contact.phone, href: `tel:+91${contact.phone}` },
    { icon: Mail, label: "Email", value: contact.email, href: `mailto:${contact.email}` },
    { icon: MapPin, label: "Location", value: contact.location, href: "#" },
];

const socialLinks = [
    { icon: Instagram, label: "Instagram", href: contact.social.instagram },
    { icon: Youtube, label: "YouTube", href: contact.social.youtube },
    { icon: MessageCircle, label: "WhatsApp", href: contact.social.whatsapp },
];

const initialForm = { name: "", phone: "", email: "", goal: "", message: "" };

export function ContactSection() {
    const ref = useRef(null);
    const formRef = useRef(null);
    const isInView = useInView(ref, { once: true, margin: "-100px" });

    const [form, setForm] = useState(initialForm);
    const [status, setStatus] = useState("idle"); // idle | sending | success | error
    const [errorMsg, setErrorMsg] = useState("");

    const handleChange = (e) => {
        setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setStatus("sending");
        setErrorMsg("");

        // Basic validation
        if (!form.name.trim() || !form.email.trim() || !form.message.trim()) {
            setStatus("error");
            setErrorMsg("Please fill in Name, Email, and Message.");
            return;
        }

        try {
            await emailjs.send(
                EMAILJS_SERVICE_ID,
                EMAILJS_TEMPLATE_ID,
                {
                    to_name: "Sudarshan",
                    from_name: form.name.trim(),
                    from_email: form.email.trim(),
                    phone: form.phone.trim() || "Not provided",
                    goal: form.goal.trim() || "Not specified",
                    message: form.message.trim(),
                },
                EMAILJS_PUBLIC_KEY
            );

            setStatus("success");
            setForm(initialForm);
        } catch (err) {
            console.error("EmailJS error:", err);
            setStatus("error");
            setErrorMsg(
                err?.text ||
                "Something went wrong. Please try WhatsApp or email directly."
            );
        }
    };

    const isConfigured =
        EMAILJS_SERVICE_ID !== "YOUR_SERVICE_ID" &&
        EMAILJS_TEMPLATE_ID !== "YOUR_TEMPLATE_ID" &&
        EMAILJS_PUBLIC_KEY !== "YOUR_PUBLIC_KEY";

    return (
        <section id="contact" className="relative py-24 overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-b from-background via-muted/20 to-background" />

            <div ref={ref} className="relative container mx-auto px-4">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={isInView ? { opacity: 1, y: 0 } : {}}
                    transition={{ duration: 0.5 }}
                    className="text-center mb-16"
                >
                    <span className="text-primary text-sm font-semibold uppercase tracking-widest">Contact</span>
                    <h2 className="text-3xl md:text-5xl font-bold mt-4 mb-6">
                        Ready to <span className="text-primary">Start?</span>
                    </h2>
                    <p className="text-muted-foreground max-w-2xl mx-auto text-lg leading-relaxed">
                        Apply for coaching or reach out with any questions. Sudarshan personally responds to every message.
                    </p>
                </motion.div>

                {/* Setup warning — only shows if keys aren't replaced yet */}
                {!isConfigured && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="max-w-5xl mx-auto mb-8 flex items-start gap-3 bg-yellow-500/10 border border-yellow-500/30 rounded-xl px-5 py-4"
                    >
                        <AlertCircle className="h-5 w-5 text-yellow-400 flex-shrink-0 mt-0.5" />
                        <div className="text-sm">
                            <p className="font-semibold text-yellow-300 mb-1">EmailJS not configured yet</p>
                            <p className="text-yellow-300/70">
                                Replace <code className="bg-yellow-500/15 px-1 rounded">EMAILJS_SERVICE_ID</code>,{" "}
                                <code className="bg-yellow-500/15 px-1 rounded">EMAILJS_TEMPLATE_ID</code>, and{" "}
                                <code className="bg-yellow-500/15 px-1 rounded">EMAILJS_PUBLIC_KEY</code> at the top of{" "}
                                <code className="bg-yellow-500/15 px-1 rounded">ContactSection.jsx</code> with your values from{" "}
                                <a href="https://emailjs.com" target="_blank" rel="noopener noreferrer" className="underline text-yellow-300">emailjs.com</a>.
                            </p>
                        </div>
                    </motion.div>
                )}

                <div className="grid lg:grid-cols-2 gap-12 max-w-5xl mx-auto">
                    {/* ── Left: contact info ── */}
                    <motion.div
                        initial={{ opacity: 0, x: -30 }}
                        animate={isInView ? { opacity: 1, x: 0 } : {}}
                        transition={{ duration: 0.5, delay: 0.2 }}
                        className="space-y-8"
                    >
                        <div>
                            <h3 className="text-2xl font-bold mb-4">Get in Touch</h3>
                            <p className="text-muted-foreground leading-relaxed">
                                Ready to start your RECODE™ journey? Have questions about which program fits you best? Reach out through any channel below.
                            </p>
                        </div>

                        <div className="space-y-4">
                            {contactInfo.map((item, index) => (
                                <motion.a
                                    key={item.label}
                                    href={item.href}
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={isInView ? { opacity: 1, x: 0 } : {}}
                                    transition={{ duration: 0.4, delay: 0.3 + index * 0.1 }}
                                    className="flex items-center gap-4 glass-card rounded-xl p-4 hover:border-primary/30 transition-all group"
                                >
                                    <div className="w-12 h-12 rounded-lg bg-primary/20 flex items-center justify-center group-hover:bg-primary/30 transition-colors">
                                        <item.icon className="h-5 w-5 text-primary" />
                                    </div>
                                    <div>
                                        <p className="text-sm text-muted-foreground">{item.label}</p>
                                        <p className="font-semibold text-sm">{item.value}</p>
                                    </div>
                                </motion.a>
                            ))}
                        </div>

                        <div>
                            <p className="text-sm text-muted-foreground mb-4">Follow on social media</p>
                            <div className="flex items-center gap-3">
                                {socialLinks.map((s, index) => (
                                    <motion.a
                                        key={s.label}
                                        href={s.href}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        initial={{ opacity: 0, scale: 0.8 }}
                                        animate={isInView ? { opacity: 1, scale: 1 } : {}}
                                        transition={{ duration: 0.3, delay: 0.5 + index * 0.1 }}
                                        className="w-12 h-12 rounded-full glass-card flex items-center justify-center hover:border-primary/50 hover:text-primary transition-all"
                                        aria-label={s.label}
                                    >
                                        <s.icon className="h-5 w-5" />
                                    </motion.a>
                                ))}
                            </div>
                        </div>

                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={isInView ? { opacity: 1, y: 0 } : {}}
                            transition={{ duration: 0.5, delay: 0.6 }}
                            className="glass-card rounded-2xl p-6 border-primary/20"
                        >
                            <div className="flex items-center gap-4 mb-4">
                                <div className="w-12 h-12 rounded-full bg-green-500/20 flex items-center justify-center">
                                    <MessageCircle className="h-6 w-6 text-green-400" />
                                </div>
                                <div>
                                    <p className="font-semibold">Fastest Response on WhatsApp</p>
                                    <p className="text-sm text-muted-foreground">Usually replies within 2 hours</p>
                                </div>
                            </div>
                            <a href={contact.social.whatsapp} target="_blank" rel="noopener noreferrer" className="block w-full">
                                <Button className="w-full bg-green-600 hover:bg-green-700 text-white">
                                    <MessageCircle className="mr-2 h-4 w-4" />
                                    Apply on WhatsApp
                                </Button>
                            </a>
                        </motion.div>
                    </motion.div>

                    {/* ── Right: form ── */}
                    <motion.div
                        initial={{ opacity: 0, x: 30 }}
                        animate={isInView ? { opacity: 1, x: 0 } : {}}
                        transition={{ duration: 0.5, delay: 0.2 }}
                    >
                        <div className="glass-card rounded-2xl p-6 md:p-8">
                            <h3 className="text-xl font-bold mb-6">Send a Message</h3>

                            {/* ── Success state ── */}
                            {status === "success" ? (
                                <motion.div
                                    initial={{ opacity: 0, scale: 0.95 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    className="flex flex-col items-center text-center py-10 gap-4"
                                >
                                    <div className="w-16 h-16 rounded-full bg-primary/15 border-2 border-primary/30 flex items-center justify-center">
                                        <CheckCircle2 className="h-8 w-8 text-primary" />
                                    </div>
                                    <div>
                                        <h4 className="text-lg font-bold mb-1">Message Sent!</h4>
                                        <p className="text-muted-foreground text-sm">
                                            Thanks for reaching out. Sudarshan will get back to you shortly.
                                        </p>
                                    </div>
                                    <Button
                                        variant="outline"
                                        className="mt-2 text-white"
                                        onClick={() => setStatus("idle")}
                                    >
                                        Send Another Message
                                    </Button>
                                </motion.div>
                            ) : (
                                <form ref={formRef} onSubmit={handleSubmit} className="space-y-5">
                                    <div className="grid sm:grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label htmlFor="name">Name *</Label>
                                            <Input
                                                id="name"
                                                name="name"
                                                placeholder="Your name"
                                                className="bg-muted/50"
                                                value={form.name}
                                                onChange={handleChange}
                                                required
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="phone">Phone</Label>
                                            <Input
                                                id="phone"
                                                name="phone"
                                                placeholder="+91 96197 08124"
                                                className="bg-muted/50"
                                                value={form.phone}
                                                onChange={handleChange}
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="email">Email *</Label>
                                        <Input
                                            id="email"
                                            name="email"
                                            type="email"
                                            placeholder="your@email.com"
                                            className="bg-muted/50"
                                            value={form.email}
                                            onChange={handleChange}
                                            required
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="goal">Fitness Goal</Label>
                                        <Input
                                            id="goal"
                                            name="goal"
                                            placeholder="e.g. Fat loss, Muscle building, Energy improvement"
                                            className="bg-muted/50"
                                            value={form.goal}
                                            onChange={handleChange}
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="message">Message *</Label>
                                        <Textarea
                                            id="message"
                                            name="message"
                                            placeholder="Tell me about your goals and current situation..."
                                            className="bg-muted/50 min-h-[120px]"
                                            value={form.message}
                                            onChange={handleChange}
                                            required
                                        />
                                    </div>

                                    {/* Error message */}
                                    {status === "error" && (
                                        <motion.div
                                            initial={{ opacity: 0, y: -4 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            className="flex items-start gap-2 bg-red-500/10 border border-red-500/30 rounded-xl px-4 py-3 text-sm text-red-400"
                                        >
                                            <AlertCircle className="h-4 w-4 flex-shrink-0 mt-0.5" />
                                            <span>{errorMsg}</span>
                                        </motion.div>
                                    )}

                                    <Button
                                        type="submit"
                                        className="w-full glow-lime text-white font-bold"
                                        size="lg"
                                        disabled={status === "sending"}
                                    >
                                        {status === "sending" ? (
                                            <>
                                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                                Sending…
                                            </>
                                        ) : (
                                            <>
                                                <Mail className="mr-2 h-4 w-4" />
                                                Send Message
                                            </>
                                        )}
                                    </Button>

                                    <p className="text-xs text-muted-foreground text-center">
                                        Your details are only used to respond to your enquiry.
                                    </p>
                                </form>
                            )}
                        </div>
                    </motion.div>
                </div>
            </div>
        </section>
    );
}
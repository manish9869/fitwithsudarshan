import { useRef, useState } from "react";
import { motion, useInView } from "framer-motion";
import { MessageCircle, Mail, MapPin, Instagram, Youtube, Send, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { contact } from "@/data/SiteData";

const GOAL_LABELS = {
    fat_loss: "Fat Loss",
    muscle_gain: "Muscle Building",
    recovery: "Recovery & Lifestyle",
    performance: "Athletic Performance",
};

// ── Inline field-level error ──────────────────────────────────────────────────
function FieldError({ msg }) {
    if (!msg) return null;
    return (
        <p className="flex items-center gap-1 mt-1.5 text-xs" style={{ color: "#ff8ab0" }}>
            <AlertCircle className="w-3 h-3 flex-shrink-0" />
            {msg}
        </p>
    );
}

function validate(form) {
    const errors = {};
    if (!form.name.trim()) errors.name = "Name is required.";
    else if (form.name.trim().length < 2) errors.name = "Name must be at least 2 characters.";

    if (!form.email.trim()) errors.email = "Email is required.";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) errors.email = "Enter a valid email address.";

    if (form.phone && !/^[0-9+\s\-().]{7,15}$/.test(form.phone.trim()))
        errors.phone = "Enter a valid phone number.";

    return errors;
}

export function ContactSection() {
    const ref = useRef(null);
    const isInView = useInView(ref, { once: true, margin: "-100px" });

    const [form, setForm] = useState({ name: "", phone: "", email: "", goal: "", message: "" });
    const [errors, setErrors] = useState({});
    const [touched, setTouched] = useState({});
    const [status, setStatus] = useState("idle"); // idle | loading | success | error

    const set = (field) => (e) => {
        const val = e.target.value;
        setForm((prev) => ({ ...prev, [field]: val }));
        // Clear error on change once touched
        if (touched[field]) {
            setErrors((prev) => ({ ...prev, [field]: undefined }));
        }
    };

    const blur = (field) => () => {
        setTouched((prev) => ({ ...prev, [field]: true }));
        const errs = validate({ ...form });
        setErrors((prev) => ({ ...prev, [field]: errs[field] }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        // Mark all fields touched and validate everything
        setTouched({ name: true, email: true, phone: true });
        const errs = validate(form);
        setErrors(errs);
        if (Object.keys(errs).length > 0) return;

        setStatus("loading");

        const payload = {
            name: form.name.trim(),
            firstName: form.name.trim().split(" ")[0],
            email: form.email.trim(),
            phone: form.phone.trim() || "—",
            phoneClean: form.phone.replace(/\D/g, ""),
            goal: GOAL_LABELS[form.goal] || form.goal || "—",
            message: form.message.trim() || "—",
        };

        try {
            const [coachRes, customerRes] = await Promise.all([
                fetch("/api/send-email", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ template: "contact_inquiry_coach", to: contact.email, data: payload }),
                }),
                fetch("/api/send-email", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ template: "contact_inquiry_customer", to: form.email.trim(), data: payload }),
                }),
            ]);

            if (coachRes.ok && customerRes.ok) {
                setStatus("success");
            } else {
                setStatus("error");
            }
        } catch {
            setStatus("error");
        }
    };

    const contactItems = [
        { icon: MessageCircle, label: "WhatsApp", value: "+91 96197 08124", href: contact.social.whatsapp, color: "#25D366" },
        { icon: Mail, label: "Email", value: contact.email, href: `mailto:${contact.email}`, color: "#e71763" },
        { icon: MapPin, label: "Location", value: "Mumbai, India", href: null, color: "#e71763" },
    ];

    const socialLinks = [
        { icon: Instagram, label: "Instagram", href: contact.social.instagram },
        { icon: Youtube, label: "YouTube", href: contact.social.youtube },
        { icon: MessageCircle, label: "WhatsApp", href: contact.social.whatsapp },
        { icon: Mail, label: "Email", href: `mailto:${contact.email}` },
    ];

    return (
        <section id="contact" className="relative py-24 overflow-hidden">
            <div ref={ref} className="relative container mx-auto px-4">
                <motion.div
                    initial={{ opacity: 0, y: 20 }} animate={isInView ? { opacity: 1, y: 0 } : {}}
                    transition={{ duration: 0.5 }}
                    className="text-center mb-16"
                >
                    <span className="text-sm font-semibold uppercase tracking-widest" style={{ color: "#e71763" }}>Contact</span>
                    <h2 className="text-3xl md:text-5xl font-bold mt-4 mb-6">
                        Let&apos;s <span style={{ color: "#e71763" }}>Connect</span>
                    </h2>
                    <p className="text-muted-foreground max-w-2xl mx-auto text-lg leading-relaxed">
                        Ready to start your RECODE journey? Reach out — Sudarshan personally responds to all inquiries.
                    </p>
                </motion.div>

                <div className="grid lg:grid-cols-2 gap-12 max-w-5xl mx-auto">

                    {/* ── Contact Info ── */}
                    <motion.div
                        initial={{ opacity: 0, x: -30 }} animate={isInView ? { opacity: 1, x: 0 } : {}}
                        transition={{ duration: 0.5, delay: 0.2 }}
                        className="space-y-8"
                    >
                        <div className="space-y-4">
                            {contactItems.map(({ icon: Icon, label, value, href, color }) => (
                                <div key={label} className="flex items-center gap-4 p-4 rounded-xl transition-all"
                                    style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)" }}>
                                    <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
                                        style={{ background: `${color}15`, border: `1px solid ${color}30` }}>
                                        <Icon className="h-5 w-5" style={{ color }} />
                                    </div>
                                    <div>
                                        <p className="text-xs text-muted-foreground uppercase tracking-widest mb-0.5">{label}</p>
                                        {href ? (
                                            <a href={href} target="_blank" rel="noopener noreferrer"
                                                className="font-medium text-white hover:opacity-80 transition-opacity">{value}</a>
                                        ) : (
                                            <p className="font-medium text-white">{value}</p>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Social links */}
                        <div>
                            <p className="text-sm text-muted-foreground mb-4">Follow the journey</p>
                            <div className="flex gap-3">
                                {socialLinks.map(({ icon: Icon, label, href }) => (
                                    <a key={label} href={href} target="_blank" rel="noopener noreferrer"
                                        className="w-11 h-11 rounded-xl flex items-center justify-center transition-all"
                                        style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)" }}
                                        onMouseEnter={e => { e.currentTarget.style.borderColor = "rgba(231,23,99,0.4)"; e.currentTarget.style.background = "rgba(231,23,99,0.1)"; }}
                                        onMouseLeave={e => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.1)"; e.currentTarget.style.background = "rgba(255,255,255,0.05)"; }}
                                        aria-label={label}>
                                        <Icon className="h-4 w-4 text-muted-foreground" />
                                    </a>
                                ))}
                            </div>
                        </div>

                        {/* WhatsApp CTA */}
                        <a href={contact.social.whatsapp} target="_blank" rel="noopener noreferrer">
                            <Button size="lg" className="w-full text-white font-bold text-base py-6"
                                style={{ background: "#25D366", boxShadow: "0 0 25px rgba(37,211,102,0.25)" }}>
                                <MessageCircle className="mr-2 h-5 w-5" />
                                Message on WhatsApp
                            </Button>
                        </a>
                    </motion.div>

                    {/* ── Form ── */}
                    <motion.div
                        initial={{ opacity: 0, x: 30 }} animate={isInView ? { opacity: 1, x: 0 } : {}}
                        transition={{ duration: 0.5, delay: 0.3 }}
                    >
                        <div className="rounded-2xl p-6 sm:p-8" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)" }}>

                            {/* Success */}
                            {status === "success" && (
                                <motion.div
                                    initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
                                    className="text-center py-10"
                                >
                                    <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4"
                                        style={{ background: "rgba(231,23,99,0.1)", border: "2px solid rgba(231,23,99,0.3)" }}>
                                        <Send className="h-7 w-7" style={{ color: "#e71763" }} />
                                    </div>
                                    <h3 className="text-xl font-bold text-white mb-2">Message Sent!</h3>
                                    <p className="text-muted-foreground text-sm leading-relaxed">
                                        Sudarshan will get back to you within 24 hours.<br />
                                        Check your inbox for a confirmation email.
                                    </p>
                                </motion.div>
                            )}

                            {/* Error banner */}
                            {status === "error" && (
                                <motion.div
                                    initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
                                    className="flex items-start gap-2.5 mb-5 px-4 py-3 rounded-xl text-sm"
                                    style={{ background: "rgba(231,23,99,0.08)", border: "1px solid rgba(231,23,99,0.25)", color: "#ff8ab0" }}
                                >
                                    <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                                    <span>Something went wrong. Please try WhatsApp instead or retry in a moment.</span>
                                </motion.div>
                            )}

                            {/* Form fields */}
                            {status !== "success" && (
                                <form onSubmit={handleSubmit} noValidate className="space-y-5">
                                    {/* Name + Phone row */}
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <div>
                                            <Label className="mb-1.5 block text-white/70">
                                                Name <span style={{ color: "#e71763" }}>*</span>
                                            </Label>
                                            <Input
                                                value={form.name}
                                                onChange={set("name")}
                                                onBlur={blur("name")}
                                                placeholder="Your name"
                                                className="bg-white/5 border-white/10 text-white placeholder:text-white/30"
                                                style={errors.name ? { borderColor: "rgba(231,23,99,0.6)" } : {}}
                                            />
                                            <FieldError msg={errors.name} />
                                        </div>
                                        <div>
                                            <Label className="mb-1.5 block text-white/70">Phone</Label>
                                            <Input
                                                value={form.phone}
                                                type="tel"
                                                onChange={set("phone")}
                                                onBlur={blur("phone")}
                                                placeholder="+91 XXXXXXXXXX"
                                                className="bg-white/5 border-white/10 text-white placeholder:text-white/30"
                                                style={errors.phone ? { borderColor: "rgba(231,23,99,0.6)" } : {}}
                                            />
                                            <FieldError msg={errors.phone} />
                                        </div>
                                    </div>

                                    {/* Email */}
                                    <div>
                                        <Label className="mb-1.5 block text-white/70">
                                            Email <span style={{ color: "#e71763" }}>*</span>
                                        </Label>
                                        <Input
                                            value={form.email}
                                            onChange={set("email")}
                                            onBlur={blur("email")}
                                            type="email"
                                            placeholder="your@email.com"
                                            className="bg-white/5 border-white/10 text-white placeholder:text-white/30"
                                            style={errors.email ? { borderColor: "rgba(231,23,99,0.6)" } : {}}
                                        />
                                        <FieldError msg={errors.email} />
                                    </div>

                                    {/* Goal */}
                                    <div>
                                        <Label className="mb-1.5 block text-white/70">Goal</Label>
                                        <select
                                            value={form.goal}
                                            onChange={set("goal")}
                                            className="w-full rounded-md px-3 py-2 text-sm text-white"
                                            style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)" }}
                                        >
                                            <option value="" style={{ background: "#0a0a0a" }}>Select your goal</option>
                                            <option value="fat_loss" style={{ background: "#0a0a0a" }}>Fat Loss</option>
                                            <option value="muscle_gain" style={{ background: "#0a0a0a" }}>Muscle Building</option>
                                            <option value="recovery" style={{ background: "#0a0a0a" }}>Recovery & Lifestyle</option>
                                            <option value="performance" style={{ background: "#0a0a0a" }}>Athletic Performance</option>
                                        </select>
                                    </div>

                                    {/* Message */}
                                    <div>
                                        <Label className="mb-1.5 block text-white/70">Message</Label>
                                        <Textarea
                                            value={form.message}
                                            onChange={set("message")}
                                            placeholder="Tell Sudarshan about your goals and current challenges..."
                                            className="bg-white/5 border-white/10 text-white placeholder:text-white/30 h-28 resize-none"
                                        />
                                    </div>

                                    {/* Required note */}
                                    <p className="text-xs text-white/25">
                                        <span style={{ color: "#e71763" }}>*</span> Required fields
                                    </p>

                                    <Button
                                        type="submit"
                                        size="lg"
                                        className="w-full text-white font-bold"
                                        disabled={status === "loading"}
                                        style={{
                                            background: "#e71763",
                                            boxShadow: "0 0 20px rgba(231,23,99,0.3)",
                                            opacity: status === "loading" ? 0.7 : 1,
                                        }}
                                    >
                                        {status === "loading"
                                            ? "Sending…"
                                            : <><span>Send Message</span><Send className="ml-2 h-4 w-4" /></>
                                        }
                                    </Button>
                                </form>
                            )}
                        </div>
                    </motion.div>
                </div>
            </div>
        </section>
    );
}
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Send, AlertCircle, MessageCircle } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { wa } from "@/utils/whatsapp";
import { trackEvent } from "@/utils/analytics";

const API_BASE = import.meta.env.VITE_API_URL ?? "";

const GOAL_LABELS = {
    fat_loss: "Fat Loss",
    muscle_gain: "Muscle Building",
    recovery: "Recovery & Lifestyle",
    performance: "Athletic Performance",
};

const EXPERIENCE_LABELS = {
    beginner: "Beginner (no regular workouts)",
    intermediate: "Intermediate (work out 1–3x/week)",
    advanced: "Advanced (work out 4x+/week)",
};

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

    if (!form.name.trim()) {
        errors.name = "Name is required.";
    } else if (form.name.trim().length < 2) {
        errors.name = "Name must be at least 2 characters.";
    }

    if (!form.phone.trim()) {
        errors.phone = "Phone number is required.";
    } else if (!/^[0-9+\s\-().]{7,15}$/.test(form.phone.trim())) {
        errors.phone = "Enter a valid phone number.";
    }

    if (!form.email.trim()) {
        errors.email = "Email is required.";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) {
        errors.email = "Enter a valid email address.";
    }

    return errors;
}

const EMPTY_FORM = { name: "", phone: "", email: "", goal: "", experience: "", message: "" };

// Structured lead-capture modal: name + phone + email + goal, sent straight
// into the same /api/send-email pipeline ContactSection already uses. This
// is what a click on the primary hero CTA opens now, instead of jumping the
// visitor straight to WhatsApp with nothing but a free-text message — the
// coach ends up with a real name/email/phone on file even if the lead never
// replies on WhatsApp.
export default function ConsultationModal({ open, onClose }) {
    const [form, setForm] = useState(EMPTY_FORM);
    const [errors, setErrors] = useState({});
    const [touched, setTouched] = useState({});
    const [status, setStatus] = useState("idle");
    // idle | loading | success | error

    const set = (field) => (e) => {
        const val = e.target.value;

        setForm((prev) => ({ ...prev, [field]: val }));

        if (touched[field]) {
            setErrors((prev) => ({ ...prev, [field]: undefined }));
        }
    };

    const blur = (field) => () => {
        setTouched((prev) => ({ ...prev, [field]: true }));

        const errs = validate({ ...form });
        setErrors((prev) => ({ ...prev, [field]: errs[field] }));
    };

    const handleClose = () => {
        onClose();
        // Let the close animation play before wiping state, so the form
        // doesn't visibly reset while it's still fading out.
        setTimeout(() => {
            setForm(EMPTY_FORM);
            setErrors({});
            setTouched({});
            setStatus("idle");
        }, 300);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        setTouched({ name: true, phone: true, email: true });

        const errs = validate(form);
        setErrors(errs);

        if (Object.keys(errs).length > 0) return;

        setStatus("loading");

        // One request: the backend saves this as a `leads` row (so it shows
        // up in Admin → Cold Enquiries even if the coach/customer emails
        // below fail to send) and fires both notification emails itself.
        const payload = {
            name: form.name.trim(),
            email: form.email.trim(),
            phone: form.phone.trim(),
            goal: GOAL_LABELS[form.goal] || null,
            experience: EXPERIENCE_LABELS[form.experience] || null,
            message: form.message.trim() || null,
        };

        trackEvent("consultation_form_submit", { goal: form.goal || "unspecified" });

        try {
            const res = await fetch(`${API_BASE}/api/leads`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });

            if (res.ok) {
                setStatus("success");
            } else {
                setStatus("error");
            }
        } catch {
            setStatus("error");
        }
    };

    return (
        <AnimatePresence>
            {open && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-[60] flex items-center justify-center p-4 overflow-y-auto"
                    style={{ background: "rgba(0,0,0,0.75)", backdropFilter: "blur(4px)" }}
                    onClick={handleClose}
                >
                    <motion.div
                        initial={{ opacity: 0, y: 30, scale: 0.96 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 20, scale: 0.96 }}
                        transition={{ type: "spring", stiffness: 300, damping: 28 }}
                        onClick={(e) => e.stopPropagation()}
                        className="relative w-full max-w-lg my-8 rounded-2xl p-6 sm:p-8"
                        style={{
                            background: "rgba(12,12,12,0.98)",
                            border: "1px solid rgba(231,23,99,0.3)",
                            boxShadow: "0 0 80px rgba(231,23,99,0.2), 0 40px 80px rgba(0,0,0,0.6)",
                        }}
                    >
                        <button
                            onClick={handleClose}
                            className="absolute top-4 right-4 text-white/40 hover:text-white/80 transition-colors"
                            aria-label="Close"
                        >
                            <X className="w-5 h-5" />
                        </button>

                        {status === "success" ? (
                            <div className="text-center py-6">
                                <div
                                    className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4"
                                    style={{ background: "rgba(231,23,99,0.1)", border: "2px solid rgba(231,23,99,0.3)" }}
                                >
                                    <Send className="h-7 w-7" style={{ color: "#e71763" }} />
                                </div>

                                <h3 className="text-xl font-bold text-white mb-2">Application Received!</h3>

                                <p className="text-muted-foreground text-sm leading-relaxed mb-6">
                                    Sudarshan will personally review your application and reach out within 24
                                    hours.
                                    <br />
                                    Check your inbox for a confirmation email.
                                </p>

                                <a href={wa.coaching} target="_blank" rel="noopener noreferrer">
                                    <button
                                        className="w-full py-3 rounded-xl text-white font-bold text-sm flex items-center justify-center gap-2"
                                        style={{ background: "#25D366" }}
                                    >
                                        <MessageCircle className="w-4 h-4" />
                                        Message on WhatsApp Now
                                    </button>
                                </a>
                            </div>
                        ) : (
                            <>
                                <h3 className="text-2xl font-black text-white mb-1">Apply For Coaching</h3>

                                <p className="text-sm text-white/45 mb-6">
                                    Tell us a bit about yourself — Sudarshan personally reviews every
                                    application.
                                </p>

                                {status === "error" && (
                                    <div
                                        className="flex items-start gap-2.5 mb-5 px-4 py-3 rounded-xl text-sm"
                                        style={{
                                            background: "rgba(231,23,99,0.08)",
                                            border: "1px solid rgba(231,23,99,0.25)",
                                            color: "#ff8ab0",
                                        }}
                                    >
                                        <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                                        <span>Something went wrong. Please try WhatsApp instead or retry in a moment.</span>
                                    </div>
                                )}

                                <form onSubmit={handleSubmit} noValidate className="space-y-4">
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <div>
                                            <Label className="mb-1.5 block text-white/70">
                                                Full Name <span style={{ color: "#e71763" }}>*</span>
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
                                            <Label className="mb-1.5 block text-white/70">
                                                Phone Number <span style={{ color: "#e71763" }}>*</span>
                                            </Label>

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

                                    <div>
                                        <Label className="mb-1.5 block text-white/70">
                                            Email Address <span style={{ color: "#e71763" }}>*</span>
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

                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <div>
                                            <Label className="mb-1.5 block text-white/70">Primary Goal</Label>

                                            <select
                                                value={form.goal}
                                                onChange={set("goal")}
                                                className="w-full rounded-md px-3 py-2 text-sm text-white"
                                                style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)" }}
                                            >
                                                <option value="" style={{ background: "#0a0a0a" }}>Select your goal</option>
                                                {Object.entries(GOAL_LABELS).map(([id, label]) => (
                                                    <option key={id} value={id} style={{ background: "#0a0a0a" }}>{label}</option>
                                                ))}
                                            </select>
                                        </div>

                                        <div>
                                            <Label className="mb-1.5 block text-white/70">Fitness Experience</Label>

                                            <select
                                                value={form.experience}
                                                onChange={set("experience")}
                                                className="w-full rounded-md px-3 py-2 text-sm text-white"
                                                style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)" }}
                                            >
                                                <option value="" style={{ background: "#0a0a0a" }}>Select experience</option>
                                                {Object.entries(EXPERIENCE_LABELS).map(([id, label]) => (
                                                    <option key={id} value={id} style={{ background: "#0a0a0a" }}>{label}</option>
                                                ))}
                                            </select>
                                        </div>
                                    </div>

                                    <div>
                                        <Label className="mb-1.5 block text-white/70">Additional Message (optional)</Label>

                                        <Textarea
                                            value={form.message}
                                            onChange={set("message")}
                                            placeholder="Tell Sudarshan more about your goals..."
                                            className="bg-white/5 border-white/10 text-white placeholder:text-white/30 h-20 resize-none"
                                        />
                                    </div>

                                    <motion.button
                                        type="submit"
                                        whileHover={{ scale: 1.01 }}
                                        whileTap={{ scale: 0.98 }}
                                        disabled={status === "loading"}
                                        className="w-full py-3.5 rounded-xl font-black text-white text-sm"
                                        style={{
                                            background: "#e71763",
                                            boxShadow: "0 0 25px rgba(231,23,99,0.4)",
                                            opacity: status === "loading" ? 0.7 : 1,
                                        }}
                                    >
                                        {status === "loading" ? "Submitting…" : "Book My Free Consultation"}
                                    </motion.button>

                                    <p className="text-center text-xs text-white/30">
                                        Prefer WhatsApp?{" "}
                                        <a href={wa.coaching} target="_blank" rel="noopener noreferrer" className="underline hover:text-white/60">
                                            Message directly
                                        </a>
                                    </p>
                                </form>
                            </>
                        )}
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}

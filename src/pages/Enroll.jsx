import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Check, ChevronRight, Globe, Video, MapPin, User, Users, ArrowLeft, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { coachingTypes, pricingTable, durations } from "@/data/SiteData";
import { Link, useLocation } from "react-router-dom";
import CustomCursor from "@/components/CustomCursor";

const tabIcons = { online: Globe, video: Video, personal: MapPin };

const goalOptions = [
    "Fat Loss", "Belly Fat Reduction", "Muscle Gain", "Lean Gain",
    "Full Body Transformation", "Lifestyle / Habit Improvement",
    "Strength & Fitness", "Not Sure, Guide Me"
];

const formatPrice = (p) =>
    new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(p);

const steps = ["Coaching Type", "Plan & Duration", "Your Details", "Confirm"];

// Validation rules
const validateField = (name, value, extra = {}) => {
    if (!value || !value.toString().trim()) return "This field is required.";
    switch (name) {
        case "email":
            return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value) ? "" : "Enter a valid email address.";
        case "whatsapp":
            return /^[6-9]\d{9}$/.test(value.replace(/[\s+\-()]/g, "")) ? "" : "Enter a valid 10-digit Indian mobile number.";
        case "age":
            return (Number(value) >= 10 && Number(value) <= 80) ? "" : "Age must be between 10 and 80.";
        case "weight":
            return (Number(value) >= 20 && Number(value) <= 300) ? "" : "Enter a valid weight (20–300 kg).";
        default:
            return "";
    }
};

function FieldError({ msg }) {
    if (!msg) return null;
    return (
        <motion.p initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }}
            className="text-xs mt-1" style={{ color: '#f87171' }}>
            {msg}
        </motion.p>
    );
}

function Field({ label, error, touched, children }) {
    const hasError = touched && error;
    return (
        <div>
            <Label className="text-white/70 mb-1 block text-xs">{label}</Label>
            <div style={hasError ? { outline: '1px solid rgba(248,113,113,0.6)', borderRadius: 6 } : {}}>
                {children}
            </div>
            <FieldError msg={hasError ? error : ""} />
        </div>
    );
}

export default function Enroll() {
    const location = useLocation();
    const pre = location.state || {};

    const [step, setStep] = useState(0);
    const [coachingId, setCoachingId] = useState(pre.coachingId || "online");
    const [planType, setPlanType] = useState(pre.planType || "individual");
    const [durationMonths, setDurationMonths] = useState(pre.duration || "3");
    const [submitted, setSubmitted] = useState(false);
    const [attemptedNext, setAttemptedNext] = useState(false);

    const [form, setForm] = useState({
        fullName: "", whatsapp: "", email: "", age: "",
        city: "", goal: "", weight: "", medicalIssue: "no", medicalNote: "",
    });
    const [touched, setTouched] = useState({});

    const [partner, setPartner] = useState({
        fullName: "", age: "", weight: "", goal: "", medicalIssue: "no", medicalNote: "",
    });
    const [partnerTouched, setPartnerTouched] = useState({});

    const price = pricingTable[coachingId]?.[planType]?.[durationMonths] || 0;
    const selectedDuration = durations.find(d => d.months === durationMonths);
    const activeCoaching = coachingTypes.find(c => c.id === coachingId);

    // Errors for main form
    const errors = {
        fullName: validateField("fullName", form.fullName),
        whatsapp: validateField("whatsapp", form.whatsapp),
        email: validateField("email", form.email),
        age: validateField("age", form.age),
        city: validateField("city", form.city),
        weight: validateField("weight", form.weight),
        goal: form.goal ? "" : "Please select your goal.",
    };
    const partnerErrors = {
        fullName: validateField("fullName", partner.fullName),
        age: validateField("age", partner.age),
    };

    const formValid = Object.values(errors).every(e => !e);
    const partnerValid = planType === "individual" || Object.values(partnerErrors).every(e => !e);
    const canProceedStep2 = formValid && partnerValid;

    const touch = (field) => setTouched(t => ({ ...t, [field]: true }));
    const touchPartner = (field) => setPartnerTouched(t => ({ ...t, [field]: true }));

    const touchAllFields = () => {
        const allFields = { fullName: true, whatsapp: true, email: true, age: true, city: true, weight: true, goal: true };
        setTouched(allFields);
        if (planType === "couple") setPartnerTouched({ fullName: true, age: true });
    };

    const handleNext = () => {
        if (step === 2) {
            touchAllFields();
            if (!canProceedStep2) return;
        }
        setAttemptedNext(false);
        setStep(s => Math.min(s + 1, steps.length - 1));
    };
    const handleBack = () => setStep(s => Math.max(s - 1, 0));

    const handleSubmit = (e) => {
        e.preventDefault();
        setSubmitted(true);
    };

    const inputClass = (field, isTouched) =>
        `bg-white/5 border-white/10 text-white placeholder:text-white/30 h-9 ${isTouched && errors[field] ? 'border-red-400/60' : ''}`;
    const partnerInputClass = (field, isTouched) =>
        `bg-white/5 border-white/10 text-white placeholder:text-white/30 h-9 ${isTouched && partnerErrors[field] ? 'border-red-400/60' : ''}`;

    if (submitted) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center px-4">
                <CustomCursor />
                <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="max-w-lg w-full text-center">
                    <div className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6"
                        style={{ background: 'rgba(231,23,99,0.1)', border: '2px solid rgba(231,23,99,0.3)' }}>
                        <CheckCircle className="w-10 h-10 text-primary" />
                    </div>
                    <h1 className="text-3xl font-bold text-white mb-4">Your RECODE Enrollment Is Confirmed</h1>
                    <div className="rounded-2xl p-8 mb-8 text-left space-y-3"
                        style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }}>
                        <p className="text-muted-foreground leading-relaxed">Thank you for joining RECODE by FitWithSudarshan.</p>
                        <p className="text-muted-foreground leading-relaxed">Your payment and basic details have been received.</p>
                        <p className="text-muted-foreground leading-relaxed">Our team will connect with you on WhatsApp and share your detailed assessment and onboarding steps.</p>
                        <p className="text-muted-foreground leading-relaxed">Your personalized RECODE roadmap will be prepared after reviewing your assessment.</p>
                        <p className="text-white font-semibold mt-4">Please keep your WhatsApp active.</p>
                        <p className="text-primary font-bold text-lg mt-2">Welcome to RECODE. 🔥</p>
                    </div>
                    <Link to="/">
                        <Button size="lg" className="text-white font-bold" style={{ background: '#e71763' }}>
                            Back to Home
                        </Button>
                    </Link>
                </motion.div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background">
            <CustomCursor />
            {/* Header */}
            <div className="sticky top-0 z-40 backdrop-blur-xl" style={{ background: 'rgba(10,10,10,0.9)', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                <div className="container mx-auto px-4 py-4 flex items-center justify-between">
                    <Link to="/" className="flex items-center gap-2 text-muted-foreground hover:text-white transition-colors">
                        <ArrowLeft className="w-4 h-4" /> Back
                    </Link>
                    <span className="text-lg font-bold text-white">FitWith<span className="text-primary">Sudarshan</span></span>
                    <div />
                </div>
            </div>

            <div className="container mx-auto px-4 py-10 max-w-2xl">
                <div className="text-center mb-8">
                    <h1 className="text-3xl md:text-4xl font-bold text-white mb-3">Start Your RECODE Journey</h1>
                    <p className="text-muted-foreground text-sm max-w-lg mx-auto">Choose your coaching experience, select your plan, and complete enrollment. After payment, our team will guide you on WhatsApp with your detailed assessment and onboarding.</p>
                </div>

                {/* Step indicators */}
                <div className="flex items-center justify-center gap-1 mb-8">
                    {steps.map((s, i) => (
                        <div key={s} className="flex items-center gap-1">
                            <button
                                onClick={() => i < step && setStep(i)}
                                className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-bold transition-all ${i <= step ? 'cursor-pointer' : 'cursor-default'}`}
                                style={
                                    i === step ? { background: '#e71763', color: 'white' }
                                        : i < step ? { background: 'rgba(231,23,99,0.3)', color: 'white' }
                                            : { background: 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.4)' }
                                }>
                                {i < step ? <Check className="w-4 h-4" /> : i + 1}
                            </button>
                            <span className={`text-xs hidden sm:block mr-1 ${i === step ? 'text-white font-semibold' : 'text-muted-foreground'}`}>{s}</span>
                            {i < steps.length - 1 && <div className="w-5 h-px" style={{ background: i < step ? '#e71763' : 'rgba(255,255,255,0.1)' }} />}
                        </div>
                    ))}
                </div>

                <AnimatePresence mode="wait">
                    <motion.div key={step} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.2 }}>

                        {/* STEP 0 */}
                        {step === 0 && (
                            <div>
                                <h2 className="text-xl font-bold text-white mb-1">How do you want to start RECODE?</h2>
                                <p className="text-muted-foreground text-sm mb-5">Choose your coaching experience.</p>
                                <div className="space-y-3">
                                    {coachingTypes.map((ct) => {
                                        const Icon = tabIcons[ct.id];
                                        const selected = coachingId === ct.id;
                                        return (
                                            <button key={ct.id} onClick={() => setCoachingId(ct.id)} className="w-full text-left rounded-2xl p-5 transition-all"
                                                style={selected ? { background: 'rgba(231,23,99,0.08)', border: '2px solid #e71763' } : { background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }}>
                                                <div className="flex items-start gap-4">
                                                    <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5"
                                                        style={{ background: selected ? 'rgba(231,23,99,0.2)' : 'rgba(255,255,255,0.05)', border: `1px solid ${selected ? 'rgba(231,23,99,0.4)' : 'rgba(255,255,255,0.1)'}` }}>
                                                        <Icon className={`w-5 h-5 ${selected ? 'text-primary' : 'text-muted-foreground'}`} />
                                                    </div>
                                                    <div className="flex-1">
                                                        <p className={`font-bold mb-0.5 ${selected ? 'text-white' : 'text-white/80'}`}>{ct.name}</p>
                                                        <p className="text-sm text-muted-foreground">{ct.tagline}</p>
                                                    </div>
                                                    {selected && <Check className="w-5 h-5 text-primary flex-shrink-0 mt-1" />}
                                                </div>
                                            </button>
                                        );
                                    })}
                                </div>
                                <Button onClick={handleNext} className="w-full mt-6 py-6 text-white font-bold text-base" style={{ background: '#e71763' }}>
                                    Continue <ChevronRight className="ml-2" />
                                </Button>
                            </div>
                        )}

                        {/* STEP 1 */}
                        {step === 1 && (
                            <div>
                                <h2 className="text-xl font-bold text-white mb-1">Who is this plan for?</h2>
                                <p className="text-muted-foreground text-sm mb-4">Select individual or couple plan.</p>
                                <div className="grid grid-cols-2 gap-3 mb-6">
                                    {[
                                        { id: "individual", label: "Individual", sub: "For one person.", icon: User },
                                        { id: "couple", label: "Couple", sub: "For two people.", icon: Users },
                                    ].map(({ id, label, sub, icon: Icon }) => (
                                        <button key={id} onClick={() => setPlanType(id)}
                                            className="rounded-2xl p-5 text-center transition-all"
                                            style={planType === id ? { background: 'rgba(231,23,99,0.08)', border: '2px solid #e71763' } : { background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }}>
                                            <Icon className={`w-7 h-7 mx-auto mb-2 ${planType === id ? 'text-primary' : 'text-muted-foreground'}`} />
                                            <p className={`font-bold ${planType === id ? 'text-white' : 'text-white/80'}`}>{label}</p>
                                            <p className="text-xs text-muted-foreground mt-0.5">{sub}</p>
                                        </button>
                                    ))}
                                </div>

                                <h2 className="text-xl font-bold text-white mb-1">Choose your duration</h2>
                                <p className="text-muted-foreground text-sm mb-4">Price updates automatically.</p>
                                <div className="space-y-2 mb-5">
                                    {durations.map((dur) => {
                                        const p = pricingTable[coachingId]?.[planType]?.[dur.months] || 0;
                                        const selected = durationMonths === dur.months;
                                        return (
                                            <button key={dur.months} onClick={() => setDurationMonths(dur.months)}
                                                className="w-full text-left rounded-xl p-4 transition-all"
                                                style={selected ? { background: 'rgba(231,23,99,0.08)', border: '2px solid #e71763' } : { background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }}>
                                                <div className="flex items-center justify-between">
                                                    <div>
                                                        <span className={`font-bold text-sm ${selected ? 'text-white' : 'text-white/80'}`}>{dur.label}</span>
                                                        <span className="text-xs ml-2 px-1.5 py-0.5 rounded-full font-semibold"
                                                            style={{ background: dur.popular ? 'rgba(231,23,99,0.2)' : 'rgba(255,255,255,0.07)', color: dur.popular ? '#e71763' : 'rgba(255,255,255,0.5)' }}>
                                                            {dur.sublabel}
                                                        </span>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <span className={`font-bold ${selected ? 'text-white' : 'text-white/70'}`}>{formatPrice(p)}</span>
                                                        {planType === "couple" && <span className="text-xs text-muted-foreground">×2</span>}
                                                        {selected && <Check className="w-4 h-4 text-primary" />}
                                                    </div>
                                                </div>
                                            </button>
                                        );
                                    })}
                                </div>

                                <div className="rounded-xl p-4 mb-5" style={{ background: 'rgba(231,23,99,0.06)', border: '1px solid rgba(231,23,99,0.2)' }}>
                                    <div className="flex items-center justify-between">
                                        <p className="text-sm text-white/80">{activeCoaching?.name} · {planType === "couple" ? "Couple" : "Individual"} · {selectedDuration?.label}</p>
                                        <p className="text-xl font-bold text-primary">{formatPrice(price)}</p>
                                    </div>
                                </div>

                                <div className="flex gap-3">
                                    <Button onClick={handleBack} variant="outline" className="border-white/15 text-white hover:bg-white/5 px-5">Back</Button>
                                    <Button onClick={handleNext} className="flex-1 py-6 text-white font-bold text-base" style={{ background: '#e71763' }}>
                                        Continue <ChevronRight className="ml-2" />
                                    </Button>
                                </div>
                            </div>
                        )}

                        {/* STEP 2 */}
                        {step === 2 && (
                            <div>
                                <h2 className="text-xl font-bold text-white mb-1">Your Details</h2>
                                <p className="text-muted-foreground text-sm mb-5">Quick details so we can onboard you after payment.</p>

                                <div className="rounded-xl p-3 mb-5" style={{ background: 'rgba(231,23,99,0.06)', border: '1px solid rgba(231,23,99,0.2)' }}>
                                    <div className="flex items-center justify-between flex-wrap gap-2">
                                        <p className="text-sm text-white/80">{activeCoaching?.name} · {planType === "couple" ? "Couple" : "Individual"} · {selectedDuration?.label}</p>
                                        <p className="text-lg font-bold text-primary">{formatPrice(price)}</p>
                                    </div>
                                </div>

                                {/* Person 1 */}
                                <div className="rounded-2xl p-5 mb-4 space-y-4" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }}>
                                    {planType === "couple" && (
                                        <p className="text-xs font-semibold text-primary uppercase tracking-widest">Person 1 — Primary Enrollee</p>
                                    )}
                                    <div className="grid grid-cols-2 gap-3">
                                        <Field label="Full Name *" error={errors.fullName} touched={touched.fullName}>
                                            <Input value={form.fullName}
                                                onChange={e => setForm(f => ({ ...f, fullName: e.target.value }))}
                                                onBlur={() => touch("fullName")}
                                                placeholder="Your full name"
                                                className={inputClass("fullName", touched.fullName)} />
                                        </Field>
                                        <Field label="Age *" error={errors.age} touched={touched.age}>
                                            <Input type="number" value={form.age}
                                                onChange={e => setForm(f => ({ ...f, age: e.target.value }))}
                                                onBlur={() => touch("age")}
                                                placeholder="Age"
                                                className={inputClass("age", touched.age)} />
                                        </Field>
                                    </div>

                                    <Field label="WhatsApp Number *" error={errors.whatsapp} touched={touched.whatsapp}>
                                        <Input value={form.whatsapp}
                                            onChange={e => setForm(f => ({ ...f, whatsapp: e.target.value }))}
                                            onBlur={() => touch("whatsapp")}
                                            placeholder="+91 XXXXXXXXXX"
                                            className={inputClass("whatsapp", touched.whatsapp)} />
                                        {!(touched.whatsapp && errors.whatsapp) && (
                                            <p className="text-xs text-muted-foreground mt-1">Used for onboarding after payment.</p>
                                        )}
                                    </Field>

                                    <Field label="Email ID *" error={errors.email} touched={touched.email}>
                                        <Input type="email" value={form.email}
                                            onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                                            onBlur={() => touch("email")}
                                            placeholder="your@email.com"
                                            className={inputClass("email", touched.email)} />
                                    </Field>

                                    <div className="grid grid-cols-2 gap-3">
                                        <Field label="City / Area *" error={errors.city} touched={touched.city}>
                                            <Input value={form.city}
                                                onChange={e => setForm(f => ({ ...f, city: e.target.value }))}
                                                onBlur={() => touch("city")}
                                                placeholder="Mumbai / Pune"
                                                className={inputClass("city", touched.city)} />
                                        </Field>
                                        <Field label="Weight (kg) *" error={errors.weight} touched={touched.weight}>
                                            <Input type="number" value={form.weight}
                                                onChange={e => setForm(f => ({ ...f, weight: e.target.value }))}
                                                onBlur={() => touch("weight")}
                                                placeholder="e.g. 75"
                                                className={inputClass("weight", touched.weight)} />
                                        </Field>
                                    </div>

                                    <div>
                                        <Label className="text-white/70 mb-1 block text-xs">Main Goal *</Label>
                                        <select value={form.goal}
                                            onChange={e => { setForm(f => ({ ...f, goal: e.target.value })); touch("goal"); }}
                                            onBlur={() => touch("goal")}
                                            className="w-full rounded-md px-3 py-2 text-sm h-9"
                                            style={{
                                                background: 'rgba(255,255,255,0.05)',
                                                border: `1px solid ${touched.goal && errors.goal ? 'rgba(248,113,113,0.6)' : 'rgba(255,255,255,0.1)'}`,
                                                color: form.goal ? 'white' : 'rgba(255,255,255,0.4)'
                                            }}>
                                            <option value="" style={{ background: '#111' }}>Select your main goal</option>
                                            {goalOptions.map(g => <option key={g} value={g} style={{ background: '#111' }}>{g}</option>)}
                                        </select>
                                        <FieldError msg={touched.goal && errors.goal ? errors.goal : ""} />
                                    </div>

                                    <div>
                                        <Label className="text-white/70 mb-1.5 block text-xs">Any Medical Issue or Injury? *</Label>
                                        <div className="flex gap-4 mb-1">
                                            {["no", "yes"].map(opt => (
                                                <label key={opt} className="flex items-center gap-2 cursor-pointer">
                                                    <input type="radio" name="medical1" value={opt} checked={form.medicalIssue === opt}
                                                        onChange={() => setForm(f => ({ ...f, medicalIssue: opt }))} className="accent-primary" />
                                                    <span className="text-sm text-white capitalize">{opt}</span>
                                                </label>
                                            ))}
                                        </div>
                                        {form.medicalIssue === "yes" && (
                                            <motion.div initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }}>
                                                <Input value={form.medicalNote} onChange={e => setForm(f => ({ ...f, medicalNote: e.target.value }))}
                                                    placeholder="Please mention briefly" className="bg-white/5 border-white/10 text-white placeholder:text-white/30 h-9 mt-2" />
                                            </motion.div>
                                        )}
                                    </div>
                                </div>

                                {/* Person 2 */}
                                {planType === "couple" && (
                                    <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
                                        className="rounded-2xl p-5 mb-4 space-y-4"
                                        style={{ background: 'rgba(231,23,99,0.04)', border: '1px solid rgba(231,23,99,0.2)' }}>
                                        <p className="text-xs font-semibold text-primary uppercase tracking-widest">Person 2 — Partner</p>
                                        <p className="text-xs text-muted-foreground">Full assessment for both will be collected after payment.</p>
                                        <div className="grid grid-cols-2 gap-3">
                                            <Field label="Partner Full Name *" error={partnerErrors.fullName} touched={partnerTouched.fullName}>
                                                <Input value={partner.fullName}
                                                    onChange={e => setPartner(p => ({ ...p, fullName: e.target.value }))}
                                                    onBlur={() => touchPartner("fullName")}
                                                    placeholder="Partner's name"
                                                    className={partnerInputClass("fullName", partnerTouched.fullName)} />
                                            </Field>
                                            <Field label="Partner Age *" error={partnerErrors.age} touched={partnerTouched.age}>
                                                <Input type="number" value={partner.age}
                                                    onChange={e => setPartner(p => ({ ...p, age: e.target.value }))}
                                                    onBlur={() => touchPartner("age")}
                                                    placeholder="Age"
                                                    className={partnerInputClass("age", partnerTouched.age)} />
                                            </Field>
                                        </div>
                                        <div className="grid grid-cols-2 gap-3">
                                            <div>
                                                <Label className="text-white/70 mb-1 block text-xs">Partner Weight (kg)</Label>
                                                <Input type="number" value={partner.weight} onChange={e => setPartner(p => ({ ...p, weight: e.target.value }))}
                                                    placeholder="e.g. 65" className="bg-white/5 border-white/10 text-white placeholder:text-white/30 h-9" />
                                            </div>
                                            <div>
                                                <Label className="text-white/70 mb-1 block text-xs">Partner Goal</Label>
                                                <select value={partner.goal} onChange={e => setPartner(p => ({ ...p, goal: e.target.value }))}
                                                    className="w-full rounded-md px-3 py-2 text-sm h-9"
                                                    style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: partner.goal ? 'white' : 'rgba(255,255,255,0.4)' }}>
                                                    <option value="" style={{ background: '#111' }}>Select goal</option>
                                                    {goalOptions.map(g => <option key={g} value={g} style={{ background: '#111' }}>{g}</option>)}
                                                </select>
                                            </div>
                                        </div>
                                        <div>
                                            <Label className="text-white/70 mb-1.5 block text-xs">Partner Medical Issue?</Label>
                                            <div className="flex gap-4">
                                                {["no", "yes"].map(opt => (
                                                    <label key={opt} className="flex items-center gap-2 cursor-pointer">
                                                        <input type="radio" name="medical2" value={opt} checked={partner.medicalIssue === opt}
                                                            onChange={() => setPartner(p => ({ ...p, medicalIssue: opt }))} className="accent-primary" />
                                                        <span className="text-sm text-white capitalize">{opt}</span>
                                                    </label>
                                                ))}
                                            </div>
                                            {partner.medicalIssue === "yes" && (
                                                <motion.div initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }}>
                                                    <Input value={partner.medicalNote} onChange={e => setPartner(p => ({ ...p, medicalNote: e.target.value }))}
                                                        placeholder="Please mention briefly" className="bg-white/5 border-white/10 text-white placeholder:text-white/30 h-9 mt-2" />
                                                </motion.div>
                                            )}
                                        </div>
                                    </motion.div>
                                )}

                                <p className="text-xs text-muted-foreground mb-5">RECODE coaching does not replace medical treatment. If required, we may suggest consulting your doctor before starting.</p>

                                <div className="flex gap-3">
                                    <Button onClick={handleBack} variant="outline" className="border-white/15 text-white hover:bg-white/5 px-5">Back</Button>
                                    <Button onClick={handleNext} className="flex-1 py-6 text-white font-bold text-base" style={{ background: '#e71763' }}>
                                        Review & Pay <ChevronRight className="ml-2" />
                                    </Button>
                                </div>
                            </div>
                        )}

                        {/* STEP 3 */}
                        {step === 3 && (
                            <form onSubmit={handleSubmit}>
                                <h2 className="text-xl font-bold text-white mb-1">Review & Confirm</h2>
                                <p className="text-muted-foreground text-sm mb-5">Review your enrollment details before payment.</p>

                                <div className="rounded-2xl p-6 mb-5 space-y-4" style={{ background: 'rgba(231,23,99,0.06)', border: '1px solid rgba(231,23,99,0.25)' }}>
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-xs text-muted-foreground mb-1">Selected Plan</p>
                                            <p className="font-bold text-white">{activeCoaching?.name}</p>
                                            <p className="text-sm text-muted-foreground">{planType === "couple" ? "Couple Plan" : "Individual Plan"} · {selectedDuration?.label} ({selectedDuration?.sublabel})</p>
                                        </div>
                                        <p className="text-2xl font-bold text-primary">{formatPrice(price)}</p>
                                    </div>
                                    <div className="border-t pt-4" style={{ borderColor: 'rgba(255,255,255,0.08)' }}>
                                        <p className="text-xs font-semibold text-primary mb-2 uppercase tracking-widest">Enrollee Details</p>
                                        <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
                                            <span className="text-muted-foreground">Name</span><span className="text-white">{form.fullName}</span>
                                            <span className="text-muted-foreground">WhatsApp</span><span className="text-white">{form.whatsapp}</span>
                                            <span className="text-muted-foreground">Email</span><span className="text-white">{form.email}</span>
                                            <span className="text-muted-foreground">Age</span><span className="text-white">{form.age} yrs</span>
                                            <span className="text-muted-foreground">City</span><span className="text-white">{form.city}</span>
                                            <span className="text-muted-foreground">Goal</span><span className="text-white">{form.goal}</span>
                                            <span className="text-muted-foreground">Weight</span><span className="text-white">{form.weight} kg</span>
                                        </div>
                                    </div>
                                    {planType === "couple" && partner.fullName && (
                                        <div className="border-t pt-4" style={{ borderColor: 'rgba(255,255,255,0.08)' }}>
                                            <p className="text-xs font-semibold text-primary mb-2 uppercase tracking-widest">Partner Details</p>
                                            <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
                                                <span className="text-muted-foreground">Name</span><span className="text-white">{partner.fullName}</span>
                                                <span className="text-muted-foreground">Age</span><span className="text-white">{partner.age} yrs</span>
                                                {partner.weight && <><span className="text-muted-foreground">Weight</span><span className="text-white">{partner.weight} kg</span></>}
                                                {partner.goal && <><span className="text-muted-foreground">Goal</span><span className="text-white">{partner.goal}</span></>}
                                            </div>
                                        </div>
                                    )}
                                </div>

                                <p className="text-xs text-muted-foreground mb-5 text-center">
                                    After clicking below you will be directed to complete payment. Our team will then connect with you on WhatsApp within 24 hours.
                                </p>

                                <div className="flex gap-3">
                                    <Button type="button" onClick={handleBack} variant="outline" className="border-white/15 text-white hover:bg-white/5 px-5">Back</Button>
                                    <Button type="submit" className="flex-1 py-6 text-white font-bold text-base" style={{ background: '#e71763', boxShadow: '0 0 25px rgba(231,23,99,0.4)' }}>
                                        Continue to Payment — {formatPrice(price)}
                                    </Button>
                                </div>
                            </form>
                        )}

                    </motion.div>
                </AnimatePresence>
            </div>
        </div>
    );
}
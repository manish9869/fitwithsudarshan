/**
 * src/pages/Onboarding.jsx
 *
 * RECODE™ Body & Lifestyle Assessment Form
 * Accessible only via direct link (not in navbar).
 * Submits to /api/submit-assessment — stores in Supabase + sends email to coach.
 */
import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    User, Phone, Calendar, MapPin, Target, Dumbbell,
    Utensils, Moon, Heart, Camera, CheckCircle2,
    ChevronRight, ChevronLeft, Loader2, AlertCircle,
    Flame, Shield, Lock, Star,
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import CustomCursor from '@/components/CustomCursor';

// ─── Constants ────────────────────────────────────────────────────────────────
const PLANS = [
    'Online Coaching',
    'Video Coaching',
    'Mumbai Personal Training',
    'Couple Plan',
];

const WORKOUT_STATUS = [
    'Beginner (no regular workouts)',
    'Intermediate (work out 1–3x/week)',
    'Advanced (work out 4x+/week)',
];

const TRAINING_DAYS = ['1 day', '2 days', '3 days', '4 days', '5 days', '6 days', '7 days'];

const FOOD_PREFS = ['Vegetarian', 'Non-Vegetarian', 'Vegan', 'Eggetarian'];

const SLEEP_OPTIONS = [
    'Less than 5', '5–6', '6–7', '7–8', 'More than 8',
];

const COMMITMENT_LABELS = {
    1: 'Just exploring',
    5: 'Moderately committed',
    10: 'Fully committed',
};

// ─── Section definitions ──────────────────────────────────────────────────────
const SECTIONS = [
    { id: 'personal', label: 'Personal Info', icon: User },
    { id: 'fitness', label: 'Fitness Profile', icon: Dumbbell },
    { id: 'nutrition', label: 'Nutrition & Lifestyle', icon: Utensils },
    { id: 'health', label: 'Health & Photos', icon: Heart },
    { id: 'commitment', label: 'Commitment', icon: Star },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────
function FieldError({ msg }) {
    if (!msg) return null;
    return (
        <motion.p
            initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-1 mt-1.5 text-xs"
            style={{ color: '#f87171' }}
        >
            <AlertCircle className="w-3 h-3 flex-shrink-0" /> {msg}
        </motion.p>
    );
}

function FormField({ label, required, error, touched, hint, children }) {
    const hasError = touched && error;
    return (
        <div>
            <Label className="text-white/70 mb-1.5 block text-xs">
                {label} {required && <span style={{ color: '#e71763' }}>*</span>}
            </Label>
            <div style={hasError ? { outline: '1px solid rgba(248,113,113,0.5)', borderRadius: 6 } : {}}>
                {children}
            </div>
            {hint && !hasError && <p className="text-[11px] text-white/30 mt-1">{hint}</p>}
            <FieldError msg={hasError ? error : ''} />
        </div>
    );
}

function SelectField({ value, onChange, options, placeholder, className = '' }) {
    return (
        <select
            value={value}
            onChange={e => onChange(e.target.value)}
            className={`w-full rounded-md px-3 py-2 text-sm text-white h-9 ${className}`}
            style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}
        >
            <option value="" style={{ background: '#0a0a0a' }}>{placeholder || 'Select…'}</option>
            {options.map(opt => (
                <option key={opt} value={opt} style={{ background: '#0a0a0a' }}>{opt}</option>
            ))}
        </select>
    );
}

function TextArea({ value, onChange, placeholder, rows = 3 }) {
    return (
        <textarea
            value={value}
            onChange={e => onChange(e.target.value)}
            placeholder={placeholder}
            rows={rows}
            className="w-full rounded-md px-3 py-2 text-sm text-white placeholder:text-white/25 resize-none"
            style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}
        />
    );
}

// File upload component
function FileUpload({ label, hint, onChange, value, accept = 'image/*' }) {
    const inputRef = useRef(null);
    return (
        <div>
            <Label className="text-white/70 mb-1.5 block text-xs">{label}</Label>
            <div
                onClick={() => inputRef.current?.click()}
                className="rounded-xl p-4 text-center cursor-pointer transition-all"
                style={{ border: '2px dashed rgba(255,255,255,0.12)', background: 'rgba(255,255,255,0.02)' }}
                onMouseEnter={e => e.currentTarget.style.borderColor = 'rgba(231,23,99,0.4)'}
                onMouseLeave={e => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.12)'}
            >
                <Camera className="w-6 h-6 mx-auto mb-2 text-white/30" />
                {value ? (
                    <p className="text-sm font-medium text-white/80">{value.name}</p>
                ) : (
                    <>
                        <p className="text-xs text-white/50">Click to upload or drag & drop</p>
                        {hint && <p className="text-[11px] text-white/30 mt-1">{hint}</p>}
                    </>
                )}
            </div>
            <input
                ref={inputRef}
                type="file"
                accept={accept}
                className="hidden"
                onChange={e => onChange(e.target.files?.[0] || null)}
            />
        </div>
    );
}

// ─── Main ─────────────────────────────────────────────────────────────────────
export default function Onboarding() {
    const [section, setSection] = useState(0);
    const [submitting, setSubmitting] = useState(false);
    const [submitted, setSubmitted] = useState(false);
    const [submitError, setSubmitError] = useState('');
    const [touched, setTouched] = useState({});

    const [form, setForm] = useState({
        // Personal
        firstName: '',
        lastName: '',
        whatsapp: '',
        age: '',
        gender: '',
        city: '',
        plan: '',
        // Fitness
        currentWeight: '',
        height: '',
        mainGoal: '',
        desiredResult: '',
        whyNow: '',
        profession: '',
        workoutStatus: '',
        trainingLocation: '',
        trainingDays: '',
        // Nutrition & Lifestyle
        foodPreference: '',
        dailyFoodRoutine: '',
        biggestStruggle: '',
        sleepHours: '',
        // Health
        medicalConditions: '',
        // Photos (File objects)
        photoFront: null,
        photoSide: null,
        bloodReport: null,
        // Commitment
        commitment: 7,
    });

    const set = (field) => (val) => setForm(f => ({ ...f, [field]: val }));
    const touch = (field) => setTouched(t => ({ ...t, [field]: true }));

    // ── Validation per section ────────────────────────────────────────────────
    const errors = {
        firstName: !form.firstName.trim() ? 'First name is required.' : '',
        whatsapp: !form.whatsapp.trim()
            ? 'WhatsApp number is required.'
            : !/^[6-9]\d{9}$/.test(form.whatsapp.replace(/[\s+\-()]/g, ''))
                ? 'Enter a valid 10-digit Indian mobile number.'
                : '',
        age: !form.age ? 'Age is required.' : (Number(form.age) < 10 || Number(form.age) > 80) ? 'Enter a valid age (10–80).' : '',
        gender: !form.gender ? 'Please select your gender.' : '',
        city: !form.city.trim() ? 'City is required.' : '',
        plan: !form.plan ? 'Please select your enrolled plan.' : '',
        currentWeight: !form.currentWeight ? 'Current weight is required.' : '',
        height: !form.height ? 'Height is required.' : '',
        mainGoal: !form.mainGoal.trim() ? 'Please describe your main goal.' : '',
        desiredResult: !form.desiredResult.trim() ? 'Please describe your desired result.' : '',
        whyNow: !form.whyNow.trim() ? 'Please tell us why you want to transform now.' : '',
        workoutStatus: !form.workoutStatus ? 'Please select your current workout status.' : '',
        trainingDays: !form.trainingDays ? 'Please select how many days you can train.' : '',
        foodPreference: !form.foodPreference ? 'Please select your food preference.' : '',
        dailyFoodRoutine: !form.dailyFoodRoutine.trim() ? 'Please describe your daily food routine.' : '',
        biggestStruggle: !form.biggestStruggle.trim() ? 'Please describe your biggest struggle.' : '',
        sleepHours: !form.sleepHours ? 'Please select your average sleep hours.' : '',
        photoFront: !form.photoFront ? 'Please upload a front photo.' : '',
        photoSide: !form.photoSide ? 'Please upload a side photo.' : '',
    };

    const sectionFields = [
        ['firstName', 'whatsapp', 'age', 'gender', 'city', 'plan'],
        ['currentWeight', 'height', 'mainGoal', 'desiredResult', 'whyNow', 'workoutStatus', 'trainingDays'],
        ['foodPreference', 'dailyFoodRoutine', 'biggestStruggle', 'sleepHours'],
        ['photoFront', 'photoSide'],
        [],
    ];

    const sectionValid = (idx) =>
        sectionFields[idx].every(f => !errors[f]);

    const touchSection = (idx) => {
        const t = {};
        sectionFields[idx].forEach(f => { t[f] = true; });
        setTouched(prev => ({ ...prev, ...t }));
    };

    const handleNext = () => {
        touchSection(section);
        if (!sectionValid(section)) return;
        setSection(s => Math.min(s + 1, SECTIONS.length - 1));
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleBack = () => {
        setSection(s => Math.max(s - 1, 0));
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleSubmit = async () => {
        // Touch all required fields
        const allTouched = {};
        Object.keys(errors).forEach(k => { allTouched[k] = true; });
        setTouched(allTouched);

        const hasError = Object.values(errors).some(Boolean);
        if (hasError) return;

        setSubmitting(true);
        setSubmitError('');

        try {
            const fd = new FormData();
            // Append all text fields
            Object.entries(form).forEach(([k, v]) => {
                if (v instanceof File) {
                    fd.append(k, v);
                } else if (v !== null && v !== undefined) {
                    fd.append(k, String(v));
                }
            });

            const API_BASE = import.meta.env.VITE_API_URL ?? '';
            const res = await fetch(`${API_BASE}/api/submit-assessment`, {
                method: 'POST',
                body: fd,
            });

            if (!res.ok) {
                const data = await res.json().catch(() => ({}));
                throw new Error(data.error || 'Submission failed. Please try again.');
            }

            setSubmitted(true);
        } catch (err) {
            setSubmitError(err.message || 'Something went wrong. Please try again or contact us on WhatsApp.');
        } finally {
            setSubmitting(false);
        }
    };

    // ── Success screen ────────────────────────────────────────────────────────
    if (submitted) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center px-4">
                <CustomCursor />
                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="max-w-md w-full text-center"
                >
                    <motion.div
                        initial={{ scale: 0 }} animate={{ scale: 1 }}
                        transition={{ type: 'spring', stiffness: 260, damping: 18, delay: 0.1 }}
                        className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6"
                        style={{ background: 'rgba(231,23,99,0.1)', border: '2px solid rgba(231,23,99,0.4)' }}
                    >
                        <CheckCircle2 className="w-10 h-10" style={{ color: '#e71763' }} />
                    </motion.div>
                    <h1 className="text-3xl font-black text-white mb-3">Assessment Submitted!</h1>
                    <p className="text-white/50 text-sm leading-relaxed mb-6">
                        Thank you for completing your RECODE™ assessment. Sudarshan will personally review your details and reach out within <strong className="text-white">24–48 hours</strong> via WhatsApp with your personalised next steps.
                    </p>
                    <div className="rounded-2xl p-5 mb-6" style={{ background: 'rgba(231,23,99,0.06)', border: '1px solid rgba(231,23,99,0.2)' }}>
                        <p className="text-sm text-white/70 leading-relaxed">
                            Keep an eye on your WhatsApp. In the meantime, feel free to reach out directly if you have any questions.
                        </p>
                    </div>
                    <a
                        href="https://wa.me/919619708124"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-center gap-2 w-full py-3 rounded-xl font-bold text-sm text-white"
                        style={{ background: '#25D366' }}
                    >
                        Message Sudarshan on WhatsApp
                    </a>
                </motion.div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background text-white">
            <CustomCursor />

            {/* Background */}
            <div className="fixed inset-0 pointer-events-none overflow-hidden">
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] rounded-full blur-[100px]"
                    style={{ background: 'rgba(231,23,99,0.07)' }} />
                <div className="absolute inset-0"
                    style={{
                        backgroundImage: 'linear-gradient(rgba(231,23,99,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(231,23,99,0.03) 1px, transparent 1px)',
                        backgroundSize: '60px 60px',
                    }} />
            </div>

            <div className="relative z-10 container mx-auto px-4 py-10 max-w-2xl">

                {/* Header */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                    className="text-center mb-8"
                >
                    <img
                        src="https://vducmiggraxtqdgt.public.blob.vercel-storage.com/logo.png"
                        alt="FitWithSudarshan"
                        className="h-12 mx-auto mb-4 rounded-xl"
                    />
                    <div className="flex items-center justify-center gap-2 mb-3">
                        <Flame className="w-4 h-4" style={{ color: '#e71763' }} />
                        <span className="text-xs font-black uppercase tracking-widest" style={{ color: '#e71763' }}>
                            RECODE™ Body & Lifestyle Assessment
                        </span>
                    </div>
                    <h1 className="text-2xl md:text-3xl font-black text-white mb-2">
                        Let's Build Your Transformation Plan
                    </h1>
                    <p className="text-white/40 text-sm max-w-md mx-auto">
                        Fill this assessment honestly — the better we understand you, the better your RECODE™ roadmap.
                    </p>
                </motion.div>

                {/* Progress steps */}
                <div className="flex items-center justify-center gap-1 mb-8 flex-wrap">
                    {SECTIONS.map((sec, i) => {
                        const Icon = sec.icon;
                        const done = i < section;
                        const active = i === section;
                        return (
                            <div key={sec.id} className="flex items-center gap-1">
                                <div
                                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-all"
                                    style={
                                        active
                                            ? { background: '#e71763', color: 'white' }
                                            : done
                                                ? { background: 'rgba(52,211,153,0.15)', color: '#34d399', border: '1px solid rgba(52,211,153,0.3)' }
                                                : { background: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.3)', border: '1px solid rgba(255,255,255,0.08)' }
                                    }
                                >
                                    <Icon className="w-3 h-3" />
                                    <span className="hidden sm:inline">{sec.label}</span>
                                    {done && <CheckCircle2 className="w-3 h-3" />}
                                </div>
                                {i < SECTIONS.length - 1 && (
                                    <div className="w-3 h-px" style={{ background: i < section ? '#34d399' : 'rgba(255,255,255,0.1)' }} />
                                )}
                            </div>
                        );
                    })}
                </div>

                {/* Form sections */}
                <AnimatePresence mode="wait">
                    <motion.div
                        key={section}
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        transition={{ duration: 0.2 }}
                        className="rounded-2xl p-6"
                        style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }}
                    >
                        {/* ── SECTION 0: Personal Info ── */}
                        {section === 0 && (
                            <div className="space-y-4">
                                <h2 className="text-lg font-black text-white mb-4 flex items-center gap-2">
                                    <User className="w-5 h-5" style={{ color: '#e71763' }} /> Personal Information
                                </h2>

                                <div className="grid grid-cols-2 gap-3">
                                    <FormField label="First Name" required error={errors.firstName} touched={touched.firstName}>
                                        <Input
                                            value={form.firstName}
                                            onChange={e => set('firstName')(e.target.value)}
                                            onBlur={() => touch('firstName')}
                                            placeholder="First name"
                                            className="bg-white/5 border-white/10 text-white placeholder:text-white/25 h-9"
                                        />
                                    </FormField>
                                    <FormField label="Last Name">
                                        <Input
                                            value={form.lastName}
                                            onChange={e => set('lastName')(e.target.value)}
                                            placeholder="Last name"
                                            className="bg-white/5 border-white/10 text-white placeholder:text-white/25 h-9"
                                        />
                                    </FormField>
                                </div>

                                <FormField label="WhatsApp Number" required error={errors.whatsapp} touched={touched.whatsapp} hint="We'll send your onboarding details here.">
                                    <Input
                                        value={form.whatsapp}
                                        onChange={e => set('whatsapp')(e.target.value)}
                                        onBlur={() => touch('whatsapp')}
                                        placeholder="+91 XXXXXXXXXX"
                                        className="bg-white/5 border-white/10 text-white placeholder:text-white/25 h-9"
                                    />
                                </FormField>

                                <div className="grid grid-cols-2 gap-3">
                                    <FormField label="Age" required error={errors.age} touched={touched.age}>
                                        <Input
                                            type="number"
                                            value={form.age}
                                            onChange={e => set('age')(e.target.value)}
                                            onBlur={() => touch('age')}
                                            placeholder="Your age"
                                            className="bg-white/5 border-white/10 text-white placeholder:text-white/25 h-9"
                                        />
                                    </FormField>
                                    <FormField label="Gender" required error={errors.gender} touched={touched.gender}>
                                        <SelectField
                                            value={form.gender}
                                            onChange={v => { set('gender')(v); touch('gender'); }}
                                            options={['Male', 'Female', 'Other']}
                                            placeholder="Select"
                                        />
                                    </FormField>
                                </div>

                                <FormField label="City / Area" required error={errors.city} touched={touched.city}>
                                    <Input
                                        value={form.city}
                                        onChange={e => set('city')(e.target.value)}
                                        onBlur={() => touch('city')}
                                        placeholder="e.g. Mumbai, Andheri"
                                        className="bg-white/5 border-white/10 text-white placeholder:text-white/25 h-9"
                                    />
                                </FormField>

                                <FormField label="Which RECODE™ Plan Are You Enrolled In?" required error={errors.plan} touched={touched.plan}>
                                    <SelectField
                                        value={form.plan}
                                        onChange={v => { set('plan')(v); touch('plan'); }}
                                        options={PLANS}
                                        placeholder="Select your plan"
                                    />
                                </FormField>
                            </div>
                        )}

                        {/* ── SECTION 1: Fitness Profile ── */}
                        {section === 1 && (
                            <div className="space-y-4">
                                <h2 className="text-lg font-black text-white mb-4 flex items-center gap-2">
                                    <Dumbbell className="w-5 h-5" style={{ color: '#e71763' }} /> Fitness Profile
                                </h2>

                                <div className="grid grid-cols-2 gap-3">
                                    <FormField label="Current Weight (kg)" required error={errors.currentWeight} touched={touched.currentWeight}>
                                        <Input
                                            type="number"
                                            value={form.currentWeight}
                                            onChange={e => set('currentWeight')(e.target.value)}
                                            onBlur={() => touch('currentWeight')}
                                            placeholder="e.g. 78"
                                            className="bg-white/5 border-white/10 text-white placeholder:text-white/25 h-9"
                                        />
                                    </FormField>
                                    <FormField label="Height (cm)" required error={errors.height} touched={touched.height}>
                                        <Input
                                            type="number"
                                            value={form.height}
                                            onChange={e => set('height')(e.target.value)}
                                            onBlur={() => touch('height')}
                                            placeholder="e.g. 172"
                                            className="bg-white/5 border-white/10 text-white placeholder:text-white/25 h-9"
                                        />
                                    </FormField>
                                </div>

                                <FormField label="What is your main goal with RECODE™?" required error={errors.mainGoal} touched={touched.mainGoal}>
                                    <TextArea
                                        value={form.mainGoal}
                                        onChange={set('mainGoal')}
                                        placeholder="e.g. Lose 15kg, build lean muscle, improve energy levels…"
                                        rows={2}
                                    />
                                    {touched.mainGoal && errors.mainGoal && <FieldError msg={errors.mainGoal} />}
                                </FormField>

                                <FormField label="Describe your desired result in 1–2 sentences" required error={errors.desiredResult} touched={touched.desiredResult}>
                                    <TextArea
                                        value={form.desiredResult}
                                        onChange={set('desiredResult')}
                                        placeholder="What does success look like for you at the end of this program?"
                                        rows={2}
                                    />
                                    {touched.desiredResult && errors.desiredResult && <FieldError msg={errors.desiredResult} />}
                                </FormField>

                                <FormField label="Why do you want to transform now?" required error={errors.whyNow} touched={touched.whyNow}>
                                    <TextArea
                                        value={form.whyNow}
                                        onChange={set('whyNow')}
                                        placeholder="What's motivated you to start this journey today?"
                                        rows={2}
                                    />
                                    {touched.whyNow && errors.whyNow && <FieldError msg={errors.whyNow} />}
                                </FormField>

                                <FormField label="Profession / Work Type">
                                    <Input
                                        value={form.profession}
                                        onChange={e => set('profession')(e.target.value)}
                                        placeholder="e.g. Software engineer, student, homemaker…"
                                        className="bg-white/5 border-white/10 text-white placeholder:text-white/25 h-9"
                                    />
                                </FormField>

                                <FormField label="Current Workout Status" required error={errors.workoutStatus} touched={touched.workoutStatus}>
                                    <SelectField
                                        value={form.workoutStatus}
                                        onChange={v => { set('workoutStatus')(v); touch('workoutStatus'); }}
                                        options={WORKOUT_STATUS}
                                        placeholder="Select your level"
                                    />
                                </FormField>

                                <FormField label="Preferred Training Location">
                                    <Input
                                        value={form.trainingLocation}
                                        onChange={e => set('trainingLocation')(e.target.value)}
                                        placeholder="e.g. Home, society gym, commercial gym, outdoor"
                                        className="bg-white/5 border-white/10 text-white placeholder:text-white/25 h-9"
                                    />
                                </FormField>

                                <FormField label="How many days per week can you train?" required error={errors.trainingDays} touched={touched.trainingDays}>
                                    <div className="flex flex-wrap gap-2">
                                        {TRAINING_DAYS.map(d => (
                                            <button
                                                key={d}
                                                type="button"
                                                onClick={() => { set('trainingDays')(d); touch('trainingDays'); }}
                                                className="text-xs px-3 py-1.5 rounded-full transition-all font-medium"
                                                style={form.trainingDays === d
                                                    ? { background: 'rgba(231,23,99,0.2)', border: '1.5px solid #e71763', color: 'white' }
                                                    : { background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.12)', color: 'rgba(255,255,255,0.6)' }
                                                }
                                            >
                                                {d}
                                            </button>
                                        ))}
                                    </div>
                                    {touched.trainingDays && errors.trainingDays && <FieldError msg={errors.trainingDays} />}
                                </FormField>
                            </div>
                        )}

                        {/* ── SECTION 2: Nutrition & Lifestyle ── */}
                        {section === 2 && (
                            <div className="space-y-4">
                                <h2 className="text-lg font-black text-white mb-4 flex items-center gap-2">
                                    <Utensils className="w-5 h-5" style={{ color: '#e71763' }} /> Nutrition & Lifestyle
                                </h2>

                                <FormField label="Food Preference" required error={errors.foodPreference} touched={touched.foodPreference}>
                                    <div className="flex flex-wrap gap-2">
                                        {FOOD_PREFS.map(fp => (
                                            <button
                                                key={fp}
                                                type="button"
                                                onClick={() => { set('foodPreference')(fp); touch('foodPreference'); }}
                                                className="text-xs px-3 py-1.5 rounded-full transition-all font-medium"
                                                style={form.foodPreference === fp
                                                    ? { background: 'rgba(231,23,99,0.2)', border: '1.5px solid #e71763', color: 'white' }
                                                    : { background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.12)', color: 'rgba(255,255,255,0.6)' }
                                                }
                                            >
                                                {fp}
                                            </button>
                                        ))}
                                    </div>
                                    {touched.foodPreference && errors.foodPreference && <FieldError msg={errors.foodPreference} />}
                                </FormField>

                                <FormField label="Describe your normal full-day food routine" required error={errors.dailyFoodRoutine} touched={touched.dailyFoodRoutine}>
                                    <TextArea
                                        value={form.dailyFoodRoutine}
                                        onChange={set('dailyFoodRoutine')}
                                        placeholder="Breakfast: Poha + chai. Lunch: Rice, dal, sabzi. Evening: Biscuits. Dinner: Roti, sabzi…"
                                        rows={4}
                                    />
                                    {touched.dailyFoodRoutine && errors.dailyFoodRoutine && <FieldError msg={errors.dailyFoodRoutine} />}
                                </FormField>

                                <FormField label="What is your biggest struggle with fitness or nutrition?" required error={errors.biggestStruggle} touched={touched.biggestStruggle}>
                                    <TextArea
                                        value={form.biggestStruggle}
                                        onChange={set('biggestStruggle')}
                                        placeholder="e.g. Late night eating, no time to workout, stress eating, no consistency…"
                                        rows={3}
                                    />
                                    {touched.biggestStruggle && errors.biggestStruggle && <FieldError msg={errors.biggestStruggle} />}
                                </FormField>

                                <FormField label="Average sleep hours per night" required error={errors.sleepHours} touched={touched.sleepHours}>
                                    <div className="flex flex-wrap gap-2">
                                        {SLEEP_OPTIONS.map(s => (
                                            <button
                                                key={s}
                                                type="button"
                                                onClick={() => { set('sleepHours')(s); touch('sleepHours'); }}
                                                className="text-xs px-3 py-1.5 rounded-full transition-all font-medium"
                                                style={form.sleepHours === s
                                                    ? { background: 'rgba(231,23,99,0.2)', border: '1.5px solid #e71763', color: 'white' }
                                                    : { background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.12)', color: 'rgba(255,255,255,0.6)' }
                                                }
                                            >
                                                {s} hrs
                                            </button>
                                        ))}
                                    </div>
                                    {touched.sleepHours && errors.sleepHours && <FieldError msg={errors.sleepHours} />}
                                </FormField>
                            </div>
                        )}

                        {/* ── SECTION 3: Health & Photos ── */}
                        {section === 3 && (
                            <div className="space-y-5">
                                <h2 className="text-lg font-black text-white mb-4 flex items-center gap-2">
                                    <Heart className="w-5 h-5" style={{ color: '#e71763' }} /> Health & Assessment Photos
                                </h2>

                                <FormField label="Any medical conditions, medication, injuries, or pain?">
                                    <TextArea
                                        value={form.medicalConditions}
                                        onChange={set('medicalConditions')}
                                        placeholder="e.g. Thyroid, PCOS, knee injury, back pain, on BP medication — or write 'None'"
                                        rows={3}
                                    />
                                </FormField>

                                {/* Privacy note */}
                                <div className="flex items-start gap-2.5 p-3 rounded-xl" style={{ background: 'rgba(231,23,99,0.05)', border: '1px solid rgba(231,23,99,0.12)' }}>
                                    <Lock className="w-4 h-4 flex-shrink-0 mt-0.5" style={{ color: '#e71763' }} />
                                    <p className="text-xs text-white/50 leading-relaxed">
                                        <strong className="text-white/70">Privacy Note:</strong> Your photos and reports are used only for private assessment and progress tracking. They will never be posted or shared without your permission.
                                    </p>
                                </div>

                                <FileUpload
                                    label="Front Photo (required for assessment)"
                                    hint="Clear, well-lit full body shot from front. Comfortable clothing."
                                    value={form.photoFront}
                                    onChange={f => { set('photoFront')(f); touch('photoFront'); }}
                                />
                                {touched.photoFront && errors.photoFront && <FieldError msg={errors.photoFront} />}

                                <FileUpload
                                    label="Side Photo (required for assessment)"
                                    hint="Clear, well-lit full body shot from side."
                                    value={form.photoSide}
                                    onChange={f => { set('photoSide')(f); touch('photoSide'); }}
                                />
                                {touched.photoSide && errors.photoSide && <FieldError msg={errors.photoSide} />}

                                <FileUpload
                                    label="Blood Report (optional)"
                                    hint="Upload recent blood report if available (PDF or image)."
                                    value={form.bloodReport}
                                    onChange={set('bloodReport')}
                                    accept="image/*,application/pdf"
                                />

                                {/* Medical disclaimer */}
                                <div className="flex items-start gap-2.5 p-3 rounded-xl" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
                                    <Shield className="w-4 h-4 flex-shrink-0 mt-0.5 text-white/30" />
                                    <p className="text-xs text-white/40 leading-relaxed">
                                        <strong className="text-white/55">Medical Disclaimer:</strong> RECODE™ coaching does not replace medical treatment. For serious medical issues, please consult your doctor first.
                                    </p>
                                </div>
                            </div>
                        )}

                        {/* ── SECTION 4: Commitment ── */}
                        {section === 4 && (
                            <div className="space-y-6">
                                <h2 className="text-lg font-black text-white mb-4 flex items-center gap-2">
                                    <Star className="w-5 h-5" style={{ color: '#e71763' }} /> Commitment Level
                                </h2>

                                <div>
                                    <Label className="text-white/70 mb-4 block text-xs">
                                        On a scale of 1–10, how committed are you to your transformation? <span style={{ color: '#e71763' }}>*</span>
                                    </Label>
                                    <div className="text-center mb-4">
                                        <motion.span
                                            key={form.commitment}
                                            initial={{ scale: 0.8 }} animate={{ scale: 1 }}
                                            className="text-5xl font-black"
                                            style={{ color: '#e71763' }}
                                        >
                                            {form.commitment}
                                        </motion.span>
                                        <p className="text-sm text-white/50 mt-1">
                                            {form.commitment <= 3 ? 'Just exploring' : form.commitment <= 6 ? 'Moderately committed' : form.commitment <= 8 ? 'Very committed' : 'Fully committed — let\'s go!'}
                                        </p>
                                    </div>
                                    <div className="relative">
                                        <input
                                            type="range"
                                            min={1}
                                            max={10}
                                            value={form.commitment}
                                            onChange={e => set('commitment')(Number(e.target.value))}
                                            className="w-full h-2 rounded-full appearance-none cursor-pointer"
                                            style={{
                                                background: `linear-gradient(to right, #e71763 0%, #e71763 ${(form.commitment - 1) / 9 * 100}%, rgba(255,255,255,0.1) ${(form.commitment - 1) / 9 * 100}%, rgba(255,255,255,0.1) 100%)`,
                                            }}
                                        />
                                        <div className="flex justify-between text-[10px] text-white/30 mt-1">
                                            <span>Not at all</span>
                                            <span>Fully committed</span>
                                        </div>
                                    </div>
                                    <div className="flex justify-between mt-2">
                                        {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(n => (
                                            <button
                                                key={n}
                                                type="button"
                                                onClick={() => set('commitment')(n)}
                                                className="text-[10px] font-bold transition-all"
                                                style={{ color: form.commitment >= n ? '#e71763' : 'rgba(255,255,255,0.2)' }}
                                            >
                                                {n}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Summary preview */}
                                <div className="rounded-2xl p-5 space-y-3" style={{ background: 'rgba(231,23,99,0.05)', border: '1px solid rgba(231,23,99,0.15)' }}>
                                    <p className="text-xs font-black uppercase tracking-widest" style={{ color: '#e71763' }}>Your Assessment Summary</p>
                                    <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-xs">
                                        <span className="text-white/40">Name</span>
                                        <span className="text-white">{[form.firstName, form.lastName].filter(Boolean).join(' ') || '—'}</span>
                                        <span className="text-white/40">Plan</span>
                                        <span className="text-white">{form.plan || '—'}</span>
                                        <span className="text-white/40">Main Goal</span>
                                        <span className="text-white truncate">{form.mainGoal?.slice(0, 40) || '—'}{form.mainGoal?.length > 40 ? '…' : ''}</span>
                                        <span className="text-white/40">Weight / Height</span>
                                        <span className="text-white">{form.currentWeight ? `${form.currentWeight}kg` : '—'} / {form.height ? `${form.height}cm` : '—'}</span>
                                        <span className="text-white/40">Commitment</span>
                                        <span style={{ color: '#e71763' }} className="font-bold">{form.commitment}/10</span>
                                    </div>
                                </div>

                                {submitError && (
                                    <motion.div
                                        initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                                        className="flex items-start gap-2.5 px-4 py-3 rounded-xl text-sm"
                                        style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', color: '#f87171' }}
                                    >
                                        <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                                        {submitError}
                                    </motion.div>
                                )}
                            </div>
                        )}
                    </motion.div>
                </AnimatePresence>

                {/* Navigation */}
                <div className="flex gap-3 mt-5">
                    {section > 0 && (
                        <button
                            onClick={handleBack}
                            className="flex items-center gap-2 px-5 py-3 rounded-xl text-sm font-bold text-white/60 transition-all"
                            style={{ border: '1px solid rgba(255,255,255,0.1)' }}
                        >
                            <ChevronLeft className="w-4 h-4" /> Back
                        </button>
                    )}

                    {section < SECTIONS.length - 1 ? (
                        <button
                            onClick={handleNext}
                            className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold text-white"
                            style={{ background: '#e71763', boxShadow: '0 0 20px rgba(231,23,99,0.3)' }}
                        >
                            Continue <ChevronRight className="w-4 h-4" />
                        </button>
                    ) : (
                        <motion.button
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={handleSubmit}
                            disabled={submitting}
                            className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold text-white disabled:opacity-60"
                            style={{ background: '#e71763', boxShadow: '0 0 25px rgba(231,23,99,0.4)' }}
                        >
                            {submitting ? (
                                <><Loader2 className="w-4 h-4 animate-spin" /> Submitting…</>
                            ) : (
                                <><CheckCircle2 className="w-4 h-4" /> Submit Assessment</>
                            )}
                        </motion.button>
                    )}
                </div>

                {/* Progress indicator */}
                <p className="text-center text-[11px] text-white/25 mt-4">
                    Step {section + 1} of {SECTIONS.length}
                </p>
            </div>
        </div>
    );
}
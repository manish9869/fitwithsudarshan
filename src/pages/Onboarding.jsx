/**
 * src/pages/Onboarding.jsx
 *
 * RECODE™ Body & Lifestyle Assessment Form
 * - Compresses images before upload (max 800px, quality 0.72)
 * - Shows photo previews inline
 * - Submits via multipart/form-data to POST /api/submit-assessment
 * - Photos uploaded to Supabase Storage bucket "assessments"
 */
import { useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    User, Phone, Calendar, MapPin, Target, Dumbbell,
    Utensils, Heart, Camera, CheckCircle2,
    ChevronRight, ChevronLeft, Loader2, AlertCircle,
    Flame, Shield, Lock, Star, X, Eye, Upload,
    Activity, Zap,
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

const SLEEP_OPTIONS = ['Less than 5', '5–6', '6–7', '7–8', 'More than 8'];

const SECTIONS = [
    { id: 'personal', label: 'Personal', icon: User },
    { id: 'fitness', label: 'Fitness', icon: Dumbbell },
    { id: 'nutrition', label: 'Nutrition', icon: Utensils },
    { id: 'health', label: 'Health', icon: Heart },
    { id: 'commitment', label: 'Final', icon: Star },
];

// ─── Image compression ────────────────────────────────────────────────────────
async function compressImage(file, maxDim = 1200, quality = 0.78) {
    return new Promise((resolve) => {
        // PDF or non-image: pass through unchanged
        if (!file.type.startsWith('image/')) { resolve(file); return; }

        const reader = new FileReader();
        reader.onload = (e) => {
            const img = new Image();
            img.onload = () => {
                const scale = Math.min(1, maxDim / Math.max(img.width, img.height));
                const w = Math.round(img.width * scale);
                const h = Math.round(img.height * scale);

                const canvas = document.createElement('canvas');
                canvas.width = w;
                canvas.height = h;
                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0, w, h);

                canvas.toBlob(
                    (blob) => resolve(new File([blob], file.name.replace(/\.[^.]+$/, '.jpg'), { type: 'image/jpeg' })),
                    'image/jpeg',
                    quality
                );
            };
            img.src = e.target.result;
        };
        reader.readAsDataURL(file);
    });
}

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
            <Label className="text-white/60 mb-1.5 block text-xs font-semibold tracking-wide uppercase">
                {label} {required && <span style={{ color: '#e71763' }}>*</span>}
            </Label>
            <div style={hasError ? { outline: '1px solid rgba(248,113,113,0.5)', borderRadius: 8 } : {}}>
                {children}
            </div>
            {hint && !hasError && <p className="text-[11px] text-white/25 mt-1.5 leading-relaxed">{hint}</p>}
            <FieldError msg={hasError ? error : ''} />
        </div>
    );
}

function SelectField({ value, onChange, options, placeholder }) {
    return (
        <select
            value={value}
            onChange={e => onChange(e.target.value)}
            className="w-full rounded-xl px-3 py-2.5 text-sm text-white h-10"
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
            className="w-full rounded-xl px-3 py-2.5 text-sm text-white placeholder:text-white/25 resize-none leading-relaxed"
            style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}
        />
    );
}

// ─── Photo Upload with preview ────────────────────────────────────────────────
function PhotoUpload({ label, hint, required, onChange, value, accept = 'image/*', error, touched }) {
    const inputRef = useRef(null);
    const [preview, setPreview] = useState(null);
    const [compressing, setCompressing] = useState(false);

    const handleFile = useCallback(async (file) => {
        if (!file) return;
        setCompressing(true);
        try {
            const compressed = await compressImage(file);
            onChange(compressed);
            if (file.type.startsWith('image/')) {
                const reader = new FileReader();
                reader.onload = e => setPreview(e.target.result);
                reader.readAsDataURL(compressed);
            } else {
                setPreview(null);
            }
        } finally {
            setCompressing(false);
        }
    }, [onChange]);

    const handleDrop = useCallback((e) => {
        e.preventDefault();
        const file = e.dataTransfer.files[0];
        if (file) handleFile(file);
    }, [handleFile]);

    const clear = () => {
        onChange(null);
        setPreview(null);
        if (inputRef.current) inputRef.current.value = '';
    };

    const hasError = touched && error;

    return (
        <div>
            <Label className="text-white/60 mb-1.5 block text-xs font-semibold tracking-wide uppercase">
                {label} {required && <span style={{ color: '#e71763' }}>*</span>}
            </Label>

            {preview ? (
                <div className="relative rounded-xl overflow-hidden group"
                    style={{ border: '1px solid rgba(231,23,99,0.3)' }}>
                    <img
                        src={preview}
                        alt="Preview"
                        className="w-full object-cover"
                        style={{ maxHeight: 220, objectFit: 'cover', objectPosition: 'center top' }}
                    />
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all flex items-center justify-center gap-3 opacity-0 group-hover:opacity-100">
                        <button
                            type="button"
                            onClick={() => inputRef.current?.click()}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold text-white"
                            style={{ background: 'rgba(255,255,255,0.15)', backdropFilter: 'blur(8px)' }}
                        >
                            <Upload className="w-3 h-3" /> Change
                        </button>
                        <button
                            type="button"
                            onClick={clear}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold text-white"
                            style={{ background: 'rgba(239,68,68,0.2)', backdropFilter: 'blur(8px)' }}
                        >
                            <X className="w-3 h-3" /> Remove
                        </button>
                    </div>
                    <div className="absolute bottom-2 right-2 flex items-center gap-1.5 px-2 py-1 rounded-full text-[10px] font-bold"
                        style={{ background: 'rgba(52,211,153,0.9)', color: '#000' }}>
                        <CheckCircle2 className="w-3 h-3" />
                        Photo ready
                    </div>
                </div>
            ) : (
                <div
                    onClick={() => !compressing && inputRef.current?.click()}
                    onDrop={handleDrop}
                    onDragOver={e => e.preventDefault()}
                    className="rounded-xl transition-all cursor-pointer"
                    style={{
                        border: hasError ? '2px dashed rgba(248,113,113,0.5)' : '2px dashed rgba(255,255,255,0.12)',
                        background: 'rgba(255,255,255,0.02)',
                        padding: '24px 16px',
                    }}
                    onMouseEnter={e => e.currentTarget.style.borderColor = 'rgba(231,23,99,0.4)'}
                    onMouseLeave={e => e.currentTarget.style.borderColor = hasError ? 'rgba(248,113,113,0.5)' : 'rgba(255,255,255,0.12)'}
                >
                    <div className="flex flex-col items-center text-center gap-2">
                        {compressing ? (
                            <>
                                <Loader2 className="w-7 h-7 text-white/30 animate-spin" />
                                <p className="text-xs text-white/40">Optimising image…</p>
                            </>
                        ) : (
                            <>
                                <div className="w-11 h-11 rounded-xl flex items-center justify-center"
                                    style={{ background: 'rgba(231,23,99,0.08)', border: '1px solid rgba(231,23,99,0.15)' }}>
                                    <Camera className="w-5 h-5" style={{ color: '#e71763' }} />
                                </div>
                                <div>
                                    <p className="text-sm font-semibold text-white/70">Click or drag to upload</p>
                                    {hint && <p className="text-[11px] text-white/35 mt-0.5 leading-relaxed">{hint}</p>}
                                </div>
                                <p className="text-[10px] text-white/20">JPG, PNG, HEIC · Max 10MB · Auto-compressed</p>
                            </>
                        )}
                    </div>
                </div>
            )}

            <input
                ref={inputRef}
                type="file"
                accept={accept}
                className="hidden"
                onChange={e => handleFile(e.target.files?.[0])}
            />
            <FieldError msg={hasError ? error : ''} />
        </div>
    );
}

// ─── Pill selector ────────────────────────────────────────────────────────────
function PillSelector({ options, value, onChange }) {
    return (
        <div className="flex flex-wrap gap-2">
            {options.map(opt => (
                <button
                    key={opt}
                    type="button"
                    onClick={() => onChange(opt)}
                    className="text-xs px-3 py-2 rounded-full transition-all font-medium"
                    style={value === opt
                        ? { background: 'rgba(231,23,99,0.2)', border: '1.5px solid #e71763', color: 'white' }
                        : { background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.12)', color: 'rgba(255,255,255,0.55)' }
                    }
                >
                    {value === opt && <CheckCircle2 className="inline w-3 h-3 mr-1 -mt-0.5" />}
                    {opt}
                </button>
            ))}
        </div>
    );
}

// ─── Step progress bar ────────────────────────────────────────────────────────
function StepBar({ current, total, sections }) {
    return (
        <div className="mb-8">
            <div className="flex items-center justify-between mb-3">
                {sections.map((sec, i) => {
                    const Icon = sec.icon;
                    const done = i < current;
                    const active = i === current;
                    return (
                        <div key={sec.id} className="flex flex-col items-center gap-1.5">
                            <div
                                className="w-9 h-9 rounded-xl flex items-center justify-center transition-all"
                                style={
                                    active
                                        ? { background: '#e71763', boxShadow: '0 0 16px rgba(231,23,99,0.45)' }
                                        : done
                                            ? { background: 'rgba(52,211,153,0.15)', border: '1px solid rgba(52,211,153,0.3)' }
                                            : { background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }
                                }
                            >
                                {done
                                    ? <CheckCircle2 className="w-4 h-4" style={{ color: '#34d399' }} />
                                    : <Icon className="w-4 h-4" style={{ color: active ? 'white' : 'rgba(255,255,255,0.25)' }} />
                                }
                            </div>
                            <span className="text-[10px] font-semibold hidden sm:block" style={{ color: active ? '#e71763' : done ? '#34d399' : 'rgba(255,255,255,0.2)' }}>
                                {sec.label}
                            </span>
                        </div>
                    );
                })}
            </div>
            {/* Progress bar */}
            <div className="h-1 rounded-full" style={{ background: 'rgba(255,255,255,0.06)' }}>
                <motion.div
                    className="h-full rounded-full"
                    style={{ background: 'linear-gradient(90deg, #e71763, #ff6b9d)' }}
                    animate={{ width: `${(current / (total - 1)) * 100}%` }}
                    transition={{ duration: 0.4, ease: 'easeInOut' }}
                />
            </div>
            <p className="text-[11px] text-white/25 mt-2 text-right">Step {current + 1} of {total}</p>
        </div>
    );
}

// ─── Section card wrapper ─────────────────────────────────────────────────────
function SectionCard({ title, icon: Icon, children }) {
    return (
        <div className="rounded-2xl overflow-hidden" style={{ background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.07)' }}>
            <div className="flex items-center gap-3 px-5 py-4"
                style={{ background: 'rgba(231,23,99,0.06)', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                    style={{ background: 'rgba(231,23,99,0.15)', border: '1px solid rgba(231,23,99,0.2)' }}>
                    <Icon className="w-4 h-4" style={{ color: '#e71763' }} />
                </div>
                <h2 className="font-black text-white text-sm">{title}</h2>
            </div>
            <div className="p-5 space-y-5">{children}</div>
        </div>
    );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function Onboarding() {
    const [section, setSection] = useState(0);
    const [submitting, setSubmitting] = useState(false);
    const [submitted, setSubmitted] = useState(false);
    const [submitError, setSubmitError] = useState('');
    const [touched, setTouched] = useState({});

    const [form, setForm] = useState({
        firstName: '', lastName: '', whatsapp: '', age: '', gender: '', city: '', plan: '',
        currentWeight: '', height: '', mainGoal: '', desiredResult: '', whyNow: '',
        profession: '', workoutStatus: '', trainingLocation: '', trainingDays: '',
        foodPreference: '', dailyFoodRoutine: '', biggestStruggle: '', sleepHours: '',
        medicalConditions: '',
        photoFront: null, photoSide: null, bloodReport: null,
        commitment: 7,
    });

    const set = (field) => (val) => setForm(f => ({ ...f, [field]: val }));
    const touch = (field) => setTouched(t => ({ ...t, [field]: true }));

    const errors = {
        firstName: !form.firstName.trim() ? 'Required.' : '',
        whatsapp: !form.whatsapp.trim() ? 'Required.' : !/^[6-9]\d{9}$/.test(form.whatsapp.replace(/[\s+\-()]/g, '')) ? 'Enter a valid 10-digit mobile number.' : '',
        age: !form.age ? 'Required.' : (Number(form.age) < 10 || Number(form.age) > 80) ? 'Enter a valid age (10–80).' : '',
        gender: !form.gender ? 'Required.' : '',
        city: !form.city.trim() ? 'Required.' : '',
        plan: !form.plan ? 'Required.' : '',
        currentWeight: !form.currentWeight ? 'Required.' : '',
        height: !form.height ? 'Required.' : '',
        mainGoal: !form.mainGoal.trim() ? 'Required.' : '',
        desiredResult: !form.desiredResult.trim() ? 'Required.' : '',
        whyNow: !form.whyNow.trim() ? 'Required.' : '',
        workoutStatus: !form.workoutStatus ? 'Required.' : '',
        trainingDays: !form.trainingDays ? 'Required.' : '',
        foodPreference: !form.foodPreference ? 'Required.' : '',
        dailyFoodRoutine: !form.dailyFoodRoutine.trim() ? 'Required.' : '',
        biggestStruggle: !form.biggestStruggle.trim() ? 'Required.' : '',
        sleepHours: !form.sleepHours ? 'Required.' : '',
        photoFront: !form.photoFront ? 'Front photo is required.' : '',
        photoSide: !form.photoSide ? 'Side photo is required.' : '',
    };

    const sectionFields = [
        ['firstName', 'whatsapp', 'age', 'gender', 'city', 'plan'],
        ['currentWeight', 'height', 'mainGoal', 'desiredResult', 'whyNow', 'workoutStatus', 'trainingDays'],
        ['foodPreference', 'dailyFoodRoutine', 'biggestStruggle', 'sleepHours'],
        ['photoFront', 'photoSide'],
        [],
    ];

    const sectionValid = (idx) => sectionFields[idx].every(f => !errors[f]);

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
        const allTouched = {};
        Object.keys(errors).forEach(k => { allTouched[k] = true; });
        setTouched(allTouched);
        if (Object.values(errors).some(Boolean)) return;

        setSubmitting(true);
        setSubmitError('');

        try {
            const fd = new FormData();
            Object.entries(form).forEach(([k, v]) => {
                if (v instanceof File) fd.append(k, v, v.name);
                else if (v !== null && v !== undefined) fd.append(k, String(v));
            });

            const API_BASE = import.meta.env.VITE_API_URL ?? '';
            const res = await fetch(`${API_BASE}/api/submit-assessment`, { method: 'POST', body: fd });

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
                        className="w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-6"
                        style={{ background: 'rgba(52,211,153,0.1)', border: '2px solid rgba(52,211,153,0.3)' }}
                    >
                        <CheckCircle2 className="w-10 h-10" style={{ color: '#34d399' }} />
                    </motion.div>
                    <h1 className="text-3xl font-black text-white mb-3">You're All Set!</h1>
                    <p className="text-white/50 text-sm leading-relaxed mb-6">
                        Your RECODE™ assessment has been submitted. Sudarshan will review your details and get back to you within <strong className="text-white">24–48 hours</strong> on WhatsApp with your personalised roadmap.
                    </p>
                    <div className="rounded-2xl p-5 mb-6" style={{ background: 'rgba(231,23,99,0.06)', border: '1px solid rgba(231,23,99,0.18)' }}>
                        <p className="text-sm text-white/60 leading-relaxed">
                            Keep an eye on your WhatsApp. Feel free to reach out if you have questions in the meantime.
                        </p>
                    </div>
                    <a
                        href="https://wa.me/919619708124"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-center gap-2 w-full py-3.5 rounded-xl font-bold text-sm text-white"
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
                    style={{ background: 'rgba(231,23,99,0.06)' }} />
                <div className="absolute inset-0"
                    style={{
                        backgroundImage: 'linear-gradient(rgba(231,23,99,0.025) 1px, transparent 1px), linear-gradient(90deg, rgba(231,23,99,0.025) 1px, transparent 1px)',
                        backgroundSize: '60px 60px',
                    }} />
            </div>

            <div className="relative z-10 container mx-auto px-4 py-10 max-w-xl">

                {/* Header */}
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-8">
                    <img src="https://vducmiggraxtqdgt.public.blob.vercel-storage.com/logo.png" alt="FitWithSudarshan" className="h-12 mx-auto mb-4 rounded-xl" />
                    <div className="flex items-center justify-center gap-2 mb-2">
                        <Flame className="w-4 h-4" style={{ color: '#e71763' }} />
                        <span className="text-xs font-black uppercase tracking-widest" style={{ color: '#e71763' }}>
                            RECODE™ Assessment
                        </span>
                    </div>
                    <h1 className="text-2xl font-black text-white mb-1">Let's Build Your Plan</h1>
                    <p className="text-white/35 text-sm">The more honestly you fill this, the better your roadmap.</p>
                </motion.div>

                {/* Progress */}
                <StepBar current={section} total={SECTIONS.length} sections={SECTIONS} />

                {/* Form sections */}
                <AnimatePresence mode="wait">
                    <motion.div
                        key={section}
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        transition={{ duration: 0.2 }}
                        className="space-y-4"
                    >

                        {/* ── SECTION 0: Personal Info ── */}
                        {section === 0 && (
                            <SectionCard title="Personal Information" icon={User}>
                                <div className="grid grid-cols-2 gap-3">
                                    <FormField label="First Name" required error={errors.firstName} touched={touched.firstName}>
                                        <Input value={form.firstName} onChange={e => set('firstName')(e.target.value)} onBlur={() => touch('firstName')} placeholder="First name" className="bg-white/5 border-white/10 text-white placeholder:text-white/25 rounded-xl h-10" />
                                    </FormField>
                                    <FormField label="Last Name">
                                        <Input value={form.lastName} onChange={e => set('lastName')(e.target.value)} placeholder="Last name" className="bg-white/5 border-white/10 text-white placeholder:text-white/25 rounded-xl h-10" />
                                    </FormField>
                                </div>

                                <FormField label="WhatsApp Number" required error={errors.whatsapp} touched={touched.whatsapp} hint="We'll use this to send your onboarding details.">
                                    <Input value={form.whatsapp} onChange={e => set('whatsapp')(e.target.value)} onBlur={() => touch('whatsapp')} placeholder="+91 XXXXXXXXXX" className="bg-white/5 border-white/10 text-white placeholder:text-white/25 rounded-xl h-10" />
                                </FormField>

                                <div className="grid grid-cols-2 gap-3">
                                    <FormField label="Age" required error={errors.age} touched={touched.age}>
                                        <Input type="number" value={form.age} onChange={e => set('age')(e.target.value)} onBlur={() => touch('age')} placeholder="Your age" className="bg-white/5 border-white/10 text-white placeholder:text-white/25 rounded-xl h-10" />
                                    </FormField>
                                    <FormField label="Gender" required error={errors.gender} touched={touched.gender}>
                                        <SelectField value={form.gender} onChange={v => { set('gender')(v); touch('gender'); }} options={['Male', 'Female', 'Other']} placeholder="Select" />
                                    </FormField>
                                </div>

                                <FormField label="City / Area" required error={errors.city} touched={touched.city}>
                                    <Input value={form.city} onChange={e => set('city')(e.target.value)} onBlur={() => touch('city')} placeholder="e.g. Mumbai, Andheri" className="bg-white/5 border-white/10 text-white placeholder:text-white/25 rounded-xl h-10" />
                                </FormField>

                                <FormField label="Which RECODE™ Plan Are You On?" required error={errors.plan} touched={touched.plan}>
                                    <SelectField value={form.plan} onChange={v => { set('plan')(v); touch('plan'); }} options={PLANS} placeholder="Select your plan" />
                                </FormField>
                            </SectionCard>
                        )}

                        {/* ── SECTION 1: Fitness ── */}
                        {section === 1 && (
                            <SectionCard title="Fitness Profile" icon={Dumbbell}>
                                <div className="grid grid-cols-2 gap-3">
                                    <FormField label="Current Weight (kg)" required error={errors.currentWeight} touched={touched.currentWeight}>
                                        <Input type="number" value={form.currentWeight} onChange={e => set('currentWeight')(e.target.value)} onBlur={() => touch('currentWeight')} placeholder="e.g. 78" className="bg-white/5 border-white/10 text-white placeholder:text-white/25 rounded-xl h-10" />
                                    </FormField>
                                    <FormField label="Height (cm)" required error={errors.height} touched={touched.height}>
                                        <Input type="number" value={form.height} onChange={e => set('height')(e.target.value)} onBlur={() => touch('height')} placeholder="e.g. 172" className="bg-white/5 border-white/10 text-white placeholder:text-white/25 rounded-xl h-10" />
                                    </FormField>
                                </div>

                                <FormField label="What's your main goal?" required error={errors.mainGoal} touched={touched.mainGoal}>
                                    <TextArea value={form.mainGoal} onChange={v => { set('mainGoal')(v); if (!touched.mainGoal) touch('mainGoal'); }} placeholder="e.g. Lose 15kg, build lean muscle, improve energy…" rows={2} />
                                    <FieldError msg={touched.mainGoal && errors.mainGoal ? errors.mainGoal : ''} />
                                </FormField>

                                <FormField label="Describe your ideal result" required error={errors.desiredResult} touched={touched.desiredResult}>
                                    <TextArea value={form.desiredResult} onChange={v => { set('desiredResult')(v); if (!touched.desiredResult) touch('desiredResult'); }} placeholder="What does success look like at the end of this program?" rows={2} />
                                    <FieldError msg={touched.desiredResult && errors.desiredResult ? errors.desiredResult : ''} />
                                </FormField>

                                <FormField label="Why do you want to start now?" required error={errors.whyNow} touched={touched.whyNow}>
                                    <TextArea value={form.whyNow} onChange={v => { set('whyNow')(v); if (!touched.whyNow) touch('whyNow'); }} placeholder="What's driving you to start this journey today?" rows={2} />
                                    <FieldError msg={touched.whyNow && errors.whyNow ? errors.whyNow : ''} />
                                </FormField>

                                <FormField label="Profession / Work Type">
                                    <Input value={form.profession} onChange={e => set('profession')(e.target.value)} placeholder="e.g. Software engineer, student, homemaker…" className="bg-white/5 border-white/10 text-white placeholder:text-white/25 rounded-xl h-10" />
                                </FormField>

                                <FormField label="Current Workout Status" required error={errors.workoutStatus} touched={touched.workoutStatus}>
                                    <SelectField value={form.workoutStatus} onChange={v => { set('workoutStatus')(v); touch('workoutStatus'); }} options={WORKOUT_STATUS} placeholder="Select your level" />
                                </FormField>

                                <FormField label="Preferred Training Location">
                                    <Input value={form.trainingLocation} onChange={e => set('trainingLocation')(e.target.value)} placeholder="e.g. Home, society gym, commercial gym" className="bg-white/5 border-white/10 text-white placeholder:text-white/25 rounded-xl h-10" />
                                </FormField>

                                <FormField label="Training days per week" required error={errors.trainingDays} touched={touched.trainingDays}>
                                    <PillSelector options={TRAINING_DAYS} value={form.trainingDays} onChange={v => { set('trainingDays')(v); touch('trainingDays'); }} />
                                    <FieldError msg={touched.trainingDays && errors.trainingDays ? errors.trainingDays : ''} />
                                </FormField>
                            </SectionCard>
                        )}

                        {/* ── SECTION 2: Nutrition ── */}
                        {section === 2 && (
                            <SectionCard title="Nutrition & Lifestyle" icon={Utensils}>
                                <FormField label="Food Preference" required error={errors.foodPreference} touched={touched.foodPreference}>
                                    <PillSelector options={FOOD_PREFS} value={form.foodPreference} onChange={v => { set('foodPreference')(v); touch('foodPreference'); }} />
                                    <FieldError msg={touched.foodPreference && errors.foodPreference ? errors.foodPreference : ''} />
                                </FormField>

                                <FormField label="Describe your full-day food routine" required error={errors.dailyFoodRoutine} touched={touched.dailyFoodRoutine} hint="Be specific — breakfast, lunch, evening snack, dinner.">
                                    <TextArea value={form.dailyFoodRoutine} onChange={v => { set('dailyFoodRoutine')(v); if (!touched.dailyFoodRoutine) touch('dailyFoodRoutine'); }} placeholder="Breakfast: Poha + chai. Lunch: Rice, dal, sabzi. Evening: Biscuits. Dinner: Roti, sabzi…" rows={4} />
                                    <FieldError msg={touched.dailyFoodRoutine && errors.dailyFoodRoutine ? errors.dailyFoodRoutine : ''} />
                                </FormField>

                                <FormField label="Your biggest struggle with fitness / nutrition" required error={errors.biggestStruggle} touched={touched.biggestStruggle}>
                                    <TextArea value={form.biggestStruggle} onChange={v => { set('biggestStruggle')(v); if (!touched.biggestStruggle) touch('biggestStruggle'); }} placeholder="e.g. Late-night eating, no consistency, stress eating…" rows={3} />
                                    <FieldError msg={touched.biggestStruggle && errors.biggestStruggle ? errors.biggestStruggle : ''} />
                                </FormField>

                                <FormField label="Average sleep per night" required error={errors.sleepHours} touched={touched.sleepHours}>
                                    <PillSelector options={SLEEP_OPTIONS.map(s => `${s} hrs`)} value={form.sleepHours ? `${form.sleepHours} hrs` : ''} onChange={v => { set('sleepHours')(v.replace(' hrs', '')); touch('sleepHours'); }} />
                                    <FieldError msg={touched.sleepHours && errors.sleepHours ? errors.sleepHours : ''} />
                                </FormField>
                            </SectionCard>
                        )}

                        {/* ── SECTION 3: Health & Photos ── */}
                        {section === 3 && (
                            <>
                                <SectionCard title="Health Background" icon={Heart}>
                                    <FormField label="Medical conditions, injuries, or medications?">
                                        <TextArea value={form.medicalConditions} onChange={set('medicalConditions')} placeholder="e.g. Thyroid, PCOS, knee injury, BP medication — or write 'None'" rows={3} />
                                    </FormField>

                                    <div className="flex items-start gap-3 p-3.5 rounded-xl" style={{ background: 'rgba(231,23,99,0.04)', border: '1px solid rgba(231,23,99,0.1)' }}>
                                        <Shield className="w-4 h-4 flex-shrink-0 mt-0.5" style={{ color: '#e71763' }} />
                                        <p className="text-[11px] text-white/40 leading-relaxed">
                                            RECODE™ coaching is not a replacement for medical treatment. Please consult your doctor for any serious medical conditions.
                                        </p>
                                    </div>
                                </SectionCard>

                                <SectionCard title="Assessment Photos" icon={Camera}>
                                    <div className="flex items-start gap-3 p-3.5 rounded-xl mb-1" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}>
                                        <Lock className="w-4 h-4 flex-shrink-0 mt-0.5 text-white/30" />
                                        <p className="text-[11px] text-white/35 leading-relaxed">
                                            <strong className="text-white/55">100% Private.</strong> Photos are used only for your personal assessment. They will never be shared without your explicit written permission.
                                        </p>
                                    </div>

                                    <PhotoUpload
                                        label="Front Photo"
                                        hint="Full body, front-facing, comfortable clothing, good lighting."
                                        required
                                        value={form.photoFront}
                                        onChange={f => { set('photoFront')(f); touch('photoFront'); }}
                                        error={errors.photoFront}
                                        touched={touched.photoFront}
                                    />

                                    <PhotoUpload
                                        label="Side Photo"
                                        hint="Full body, side-facing, good lighting."
                                        required
                                        value={form.photoSide}
                                        onChange={f => { set('photoSide')(f); touch('photoSide'); }}
                                        error={errors.photoSide}
                                        touched={touched.photoSide}
                                    />

                                    <PhotoUpload
                                        label="Blood Report (optional)"
                                        hint="Upload recent blood work if available."
                                        value={form.bloodReport}
                                        onChange={set('bloodReport')}
                                        accept="image/*,application/pdf"
                                    />
                                </SectionCard>
                            </>
                        )}

                        {/* ── SECTION 4: Commitment ── */}
                        {section === 4 && (
                            <>
                                <SectionCard title="Commitment Level" icon={Zap}>
                                    <div>
                                        <Label className="text-white/60 mb-4 block text-xs font-semibold tracking-wide uppercase">
                                            How committed are you? <span style={{ color: '#e71763' }}>*</span>
                                        </Label>
                                        <div className="text-center mb-5">
                                            <motion.span
                                                key={form.commitment}
                                                initial={{ scale: 0.8 }} animate={{ scale: 1 }}
                                                className="text-6xl font-black block"
                                                style={{ color: '#e71763' }}
                                            >
                                                {form.commitment}
                                            </motion.span>
                                            <span className="text-sm text-white/40 block mt-1">
                                                {form.commitment <= 3 ? 'Still thinking about it' : form.commitment <= 6 ? 'Getting serious' : form.commitment <= 8 ? 'Very committed' : 'All in — let\'s go!'}
                                            </span>
                                            <span className="text-xs text-white/20 block">/10</span>
                                        </div>
                                        <input
                                            type="range" min={1} max={10} value={form.commitment}
                                            onChange={e => set('commitment')(Number(e.target.value))}
                                            className="w-full h-2 rounded-full appearance-none cursor-pointer"
                                            style={{ background: `linear-gradient(to right, #e71763 0%, #e71763 ${(form.commitment - 1) / 9 * 100}%, rgba(255,255,255,0.1) ${(form.commitment - 1) / 9 * 100}%, rgba(255,255,255,0.1) 100%)` }}
                                        />
                                        <div className="flex justify-between text-[10px] text-white/25 mt-1.5">
                                            <span>1 — Exploring</span><span>10 — Fully committed</span>
                                        </div>
                                    </div>
                                </SectionCard>

                                {/* Summary */}
                                <div className="rounded-2xl p-5 space-y-3" style={{ background: 'rgba(231,23,99,0.05)', border: '1px solid rgba(231,23,99,0.15)' }}>
                                    <p className="text-xs font-black uppercase tracking-widest" style={{ color: '#e71763' }}>Assessment Summary</p>
                                    <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-xs">
                                        {[
                                            ['Name', [form.firstName, form.lastName].filter(Boolean).join(' ') || '—'],
                                            ['Plan', form.plan || '—'],
                                            ['Weight / Height', `${form.currentWeight || '—'}kg / ${form.height || '—'}cm`],
                                            ['Training Days', form.trainingDays || '—'],
                                            ['Photos', form.photoFront && form.photoSide ? '✓ Both uploaded' : '⚠ Missing'],
                                            ['Commitment', `${form.commitment}/10`],
                                        ].map(([k, v]) => (
                                            <div key={k}>
                                                <span className="text-white/30 block">{k}</span>
                                                <span className="text-white/80 font-semibold">{v}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {submitError && (
                                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                                        className="flex items-start gap-2.5 px-4 py-3 rounded-xl text-sm"
                                        style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', color: '#f87171' }}>
                                        <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                                        <span>{submitError}</span>
                                    </motion.div>
                                )}
                            </>
                        )}
                    </motion.div>
                </AnimatePresence>

                {/* Navigation */}
                <div className="flex gap-3 mt-6">
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
                            whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                            onClick={handleSubmit}
                            disabled={submitting}
                            className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold text-white disabled:opacity-60"
                            style={{ background: '#e71763', boxShadow: '0 0 25px rgba(231,23,99,0.4)' }}
                        >
                            {submitting
                                ? <><Loader2 className="w-4 h-4 animate-spin" /> Submitting…</>
                                : <><CheckCircle2 className="w-4 h-4" /> Submit Assessment</>
                            }
                        </motion.button>
                    )}
                </div>
            </div>
        </div>
    );
}
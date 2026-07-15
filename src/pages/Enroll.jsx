import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Check, ChevronRight, Globe, Video, MapPin,
    User, Users, ArrowLeft, Loader2, Lock,
    Tag, X, Sparkles, Zap,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { coachingTypes, pricingTable, durations, basicConsultation } from '@/data/SiteData';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { usePageMeta } from '@/hooks/usePageMeta';
import { useRazorpay } from '@/hooks/useRazorpay';
import { validateCouponRemote } from '@/services/couponService';
import { formatPrice as fmtPrice } from '@/utils/coupons';

const tabIcons = { online: Globe, video: Video, personal: MapPin };
const formatPrice = (p) =>
    new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(p);

const goalOptions = [
    'Fat Loss', 'Belly Fat Reduction', 'Muscle Gain', 'Lean Gain',
    'Full Body Transformation', 'Lifestyle / Habit Improvement',
    'Strength & Fitness', 'Not Sure, Guide Me',
];

const MAX_GOALS = 3;

const steps = ['Coaching Type', 'Plan & Duration', 'Your Details', 'Confirm'];

const isBasicPlan = (pt) => pt === 'basic_individual' || pt === 'basic_couple';

// ── Draft persistence (survives accidental navigation / back button) ─────────
const ENROLL_DRAFT_KEY = 'recode_enroll_draft_v1';

function loadDraft() {
    try {
        const raw = sessionStorage.getItem(ENROLL_DRAFT_KEY);
        return raw ? JSON.parse(raw) : null;
    } catch {
        return null;
    }
}

function clearDraft() {
    try { sessionStorage.removeItem(ENROLL_DRAFT_KEY); } catch { /* noop */ }
}

// ── Validation ────────────────────────────────────────────────────────────────
const validateField = (name, value) => {
    if (!value || !value.toString().trim()) return 'This field is required.';
    switch (name) {
        case 'email':
            return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value) ? '' : 'Enter a valid email address.';
        case 'whatsapp':
            return /^[6-9]\d{9}$/.test(value.replace(/[\s+\-()]/g, '')) ? '' : 'Enter a valid 10-digit Indian mobile number.';
        case 'age':
            return Number(value) >= 10 && Number(value) <= 80 ? '' : 'Age must be between 10 and 80.';
        case 'weight':
            return Number(value) >= 20 && Number(value) <= 300 ? '' : 'Enter a valid weight (20–300 kg).';
        default:
            return '';
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
            <FieldError msg={hasError ? error : ''} />
        </div>
    );
}

// ── Goal Pill Multi-Select ────────────────────────────────────────────────────
function GoalPicker({ selected, onChange, touched, error }) {


    const toggle = (goal) => {
        if (selected.includes(goal)) {
            onChange(selected.filter((g) => g !== goal));
        } else if (selected.length < MAX_GOALS) {
            onChange([...selected, goal]);
        }
    };

    return (
        <div>
            <div className="flex items-center justify-between mb-1.5">
                <Label className="text-white/70 text-xs">Main Goal * <span className="text-white/30">(pick up to {MAX_GOALS})</span></Label>
                {selected.length > 0 && (
                    <span className="text-xs" style={{ color: '#e71763' }}>
                        {selected.length}/{MAX_GOALS} selected
                    </span>
                )}
            </div>
            <div className="flex flex-wrap gap-2">
                {goalOptions.map((goal) => {
                    const isSelected = selected.includes(goal);
                    const isDisabled = !isSelected && selected.length >= MAX_GOALS;
                    return (
                        <button
                            key={goal}
                            type="button"
                            onClick={() => toggle(goal)}
                            disabled={isDisabled}
                            className="text-xs px-3 py-1.5 rounded-full transition-all font-medium"
                            style={
                                isSelected
                                    ? { background: 'rgba(231,23,99,0.2)', border: '1.5px solid #e71763', color: 'white' }
                                    : isDisabled
                                        ? { background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.2)', cursor: 'not-allowed' }
                                        : { background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.12)', color: 'rgba(255,255,255,0.65)' }
                            }
                        >
                            {isSelected && <Check className="inline w-3 h-3 mr-1 -mt-0.5" />}
                            {goal}
                        </button>
                    );
                })}
            </div>
            <FieldError msg={touched && error ? error : ''} />
        </div>
    );
}

function PartnerGoalPicker({ selected, onChange }) {
    const toggle = (goal) => {
        if (selected.includes(goal)) {
            onChange(selected.filter((g) => g !== goal));
        } else if (selected.length < MAX_GOALS) {
            onChange([...selected, goal]);
        }
    };

    return (
        <div>
            <div className="flex items-center justify-between mb-1.5">
                <Label className="text-white/70 text-xs">Partner Goal <span className="text-white/30">(pick up to {MAX_GOALS})</span></Label>
                {selected.length > 0 && (
                    <span className="text-xs" style={{ color: '#e71763' }}>
                        {selected.length}/{MAX_GOALS} selected
                    </span>
                )}
            </div>
            <div className="flex flex-wrap gap-2">
                {goalOptions.map((goal) => {
                    const isSelected = selected.includes(goal);
                    const isDisabled = !isSelected && selected.length >= MAX_GOALS;
                    return (
                        <button
                            key={goal}
                            type="button"
                            onClick={() => toggle(goal)}
                            disabled={isDisabled}
                            className="text-xs px-3 py-1.5 rounded-full transition-all font-medium"
                            style={
                                isSelected
                                    ? { background: 'rgba(231,23,99,0.2)', border: '1.5px solid #e71763', color: 'white' }
                                    : isDisabled
                                        ? { background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.2)', cursor: 'not-allowed' }
                                        : { background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.12)', color: 'rgba(255,255,255,0.65)' }
                            }
                        >
                            {isSelected && <Check className="inline w-3 h-3 mr-1 -mt-0.5" />}
                            {goal}
                        </button>
                    );
                })}
            </div>
        </div>
    );
}

// ── Coupon Input Component ────────────────────────────────────────────────────
function CouponInput({ coachingId, planType, durationMonths, originalPrice, onApply, onRemove, appliedCoupon }) {
    const [inputValue, setInputValue] = useState('');
    const [error, setError] = useState('');
    const [checking, setChecking] = useState(false);

    const handleApply = async () => {
        setError('');
        setChecking(true);
        const result = await validateCouponRemote(inputValue, coachingId, planType, durationMonths, originalPrice);
        setChecking(false);

        if (!result.valid) {
            setError(result.error);
            return;
        }
        onApply({
            code: inputValue.trim().toUpperCase(),
            discountedPrice: result.discountedPrice,
            savings: result.savings,
            label: result.coupon.label,
            description: result.coupon.description,
        });
        setInputValue('');
    };

    if (appliedCoupon) {
        return (
            <motion.div
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                className="rounded-xl p-3 flex items-center justify-between gap-3"
                style={{ background: 'rgba(52,211,153,0.08)', border: '1px solid rgba(52,211,153,0.25)' }}
            >
                <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
                        style={{ background: 'rgba(52,211,153,0.15)' }}>
                        <Tag className="w-3.5 h-3.5" style={{ color: '#34d399' }} />
                    </div>
                    <div className="min-w-0">
                        <p className="text-xs font-bold text-white">{appliedCoupon.code}</p>
                        <p className="text-[11px] text-white/50 truncate">{appliedCoupon.description}</p>
                    </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                    <span className="text-xs font-bold" style={{ color: '#34d399' }}>
                        -{formatPrice(appliedCoupon.savings)}
                    </span>
                    <button onClick={onRemove}
                        className="w-6 h-6 rounded-full flex items-center justify-center transition-colors"
                        style={{ background: 'rgba(255,255,255,0.06)' }}
                        onMouseEnter={e => e.currentTarget.style.background = 'rgba(248,113,113,0.15)'}
                        onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.06)'}>
                        <X className="w-3 h-3 text-white/50" />
                    </button>
                </div>
            </motion.div>
        );
    }

    return (
        <div>
            <div className="flex gap-2">
                <div className="relative flex-1">
                    <Tag className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/30" />
                    <Input
                        value={inputValue}
                        onChange={(e) => { setInputValue(e.target.value.toUpperCase()); setError(''); }}
                        onKeyDown={(e) => e.key === 'Enter' && inputValue && handleApply()}
                        placeholder="COUPON CODE"
                        className="bg-white/5 border-white/10 text-white placeholder:text-white/25 h-9 pl-8 text-xs font-mono tracking-widest"
                        style={error ? { borderColor: 'rgba(248,113,113,0.5)' } : {}}
                    />
                </div>
                <Button
                    type="button"
                    onClick={handleApply}
                    disabled={!inputValue.trim() || checking}
                    className="h-9 px-4 text-xs font-bold text-white flex-shrink-0"
                    style={{ background: inputValue.trim() ? '#e71763' : 'rgba(255,255,255,0.08)' }}
                >
                    {checking ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'Apply'}
                </Button>
            </div>
            {error && (
                <motion.p initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }}
                    className="text-[11px] mt-1.5 flex items-center gap-1" style={{ color: '#f87171' }}>
                    {error}
                </motion.p>
            )}
        </div>
    );
}

// ─── Main component ───────────────────────────────────────────────────────────
export default function Enroll() {

    usePageMeta({
        title: 'Enroll Now',
        description: 'Enroll in RECODE™ coaching — choose your plan and complete secure checkout.',
        path: '/enroll',
        noindex: true, // checkout flow — no need to rank
    });

    const location = useLocation();
    const navigate = useNavigate();
    const pre = location.state || {};
    const { initiatePayment } = useRazorpay();

    // Restore any in-progress draft (e.g. user hit the header "Back" link or
    // browser back button by accident) before falling back to router state.
    const draft = loadDraft();
    const hasIncomingSelection = Boolean(pre.coachingId);

    const [step, setStep] = useState(hasIncomingSelection ? 0 : (draft?.step ?? 0));
    const [coachingId, setCoachingId] = useState(pre.coachingId ?? draft?.coachingId ?? 'online');
    const [planType, setPlanType] = useState(pre.planType ?? draft?.planType ?? 'individual');
    const [durationMonths, setDur] = useState(pre.duration ?? draft?.durationMonths ?? '3');

    const [modalStatus, setModalStatus] = useState('idle');

    // ── Coupon state ────────────────────────────────────────────────────────────
    const [appliedCoupon, setAppliedCoupon] = useState(draft?.appliedCoupon ?? null);

    const [form, setForm] = useState(draft?.form ?? {
        fullName: '', whatsapp: '', email: '', age: '',
        city: '', goal: [], weight: '', medicalIssue: 'no', medicalNote: '',
    });
    const [touched, setTouched] = useState({});

    const [partner, setPartner] = useState(draft?.partner ?? {
        fullName: '', age: '', weight: '', goal: [], medicalIssue: 'no', medicalNote: '',
    });
    const [partnerTouched, setPartnerTouched] = useState({});

    // Persist every change to sessionStorage so progress survives accidental
    // navigation (header "Back" link, browser back/forward, accidental refresh).
    useEffect(() => {
        try {
            sessionStorage.setItem(
                ENROLL_DRAFT_KEY,
                JSON.stringify({ step, coachingId, planType, durationMonths, appliedCoupon, form, partner })
            );
        } catch {
            /* sessionStorage unavailable (e.g. private mode) — fail silently */
        }
    }, [step, coachingId, planType, durationMonths, appliedCoupon, form, partner]);

    const basic = isBasicPlan(planType);
    const isCoupleBasic = planType === 'basic_couple';

    // ── Price resolution (handles basic_individual / basic_couple separately) ──
    const originalPrice = basic
        ? (pricingTable[coachingId]?.[planType]?.['1'] || 0)
        : (pricingTable[coachingId]?.[planType]?.[durationMonths] || 0);
    const finalPrice = appliedCoupon ? appliedCoupon.discountedPrice : originalPrice;

    const selectedDuration = basic
        ? { months: '1', label: 'One-Time', sublabel: 'Basic Consultation', description: basicConsultation.description }
        : durations.find((d) => d.months === durationMonths);
    const activeCoaching = coachingTypes.find((c) => c.id === coachingId);

    const programName = basic
        ? `${basicConsultation.name} — ${isCoupleBasic ? 'Couple' : 'Individual'} — One-Time`
        : `${activeCoaching?.name} — ${planType === 'couple' ? 'Couple' : 'Individual'} — ${selectedDuration?.label}`;

    // Reset coupon when plan changes
    const handleCoachingChange = (id) => {
        setCoachingId(id);
        setAppliedCoupon(null);
        if (id !== 'online' && isBasicPlan(planType)) {
            setPlanType('individual');
        }
    };
    const handlePlanTypeChange = (pt) => {
        setPlanType(pt);
        setAppliedCoupon(null);
        if (isBasicPlan(pt)) setDur('1');
    };
    const handleDurationChange = (d) => { setDur(d); setAppliedCoupon(null); };

    const errors = {
        fullName: validateField('fullName', form.fullName),
        whatsapp: validateField('whatsapp', form.whatsapp),
        email: validateField('email', form.email),
        age: validateField('age', form.age),
        city: validateField('city', form.city),
        weight: validateField('weight', form.weight),
        goal: form.goal.length > 0 ? '' : 'Please select at least one goal.',
    };
    const partnerErrors = {
        fullName: validateField('fullName', partner.fullName),
        age: validateField('age', partner.age),
    };

    const isCouplePlan = planType === 'couple' || planType === 'basic_couple';

    const formValid = Object.values(errors).every((e) => !e);
    const partnerValid = !isCouplePlan || Object.values(partnerErrors).every((e) => !e);
    const canProceedStep2 = formValid && partnerValid;

    const touch = (f) => setTouched((t) => ({ ...t, [f]: true }));
    const touchPartner = (f) => setPartnerTouched((t) => ({ ...t, [f]: true }));

    const touchAllFields = () => {
        setTouched({ fullName: true, whatsapp: true, email: true, age: true, city: true, weight: true, goal: true });
        if (isCouplePlan) setPartnerTouched({ fullName: true, age: true });
    };

    const handleNext = () => {
        if (step === 2) {
            touchAllFields();
            if (!canProceedStep2) return;
        }
        setStep((s) => Math.min(s + 1, steps.length - 1));
    };
    const handleBack = () => setStep((s) => Math.max(s - 1, 0));

    // Header "Back": if mid-flow, step back through the wizard first;
    // only leave the page entirely once they're on the very first step.
    const handleHeaderBack = () => {
        if (step > 0) {
            handleBack();
        } else {
            navigate('/');
        }
    };

    // ── PAYMENT ────────────────────────────────────────────────────────────────
    const handlePay = async (e) => {
        e.preventDefault();
        setModalStatus('loading');

        await initiatePayment({
            amountPaise: finalPrice * 100,
            originalAmountPaise: originalPrice * 100,
            couponCode: appliedCoupon?.code || null,
            couponSavings: appliedCoupon?.savings || 0,
            name: form.fullName,
            email: form.email,
            contact: form.whatsapp,
            description: programName,
            programName,
            planType: isCouplePlan ? 'couple' : 'individual', // normalize for downstream consumers
            durationMonths: basic ? '1' : durationMonths,
            coachingType: basic ? 'online' : coachingId,
            // Person 1
            age: form.age,
            city: form.city,
            weight: form.weight,
            goals: form.goal,
            medicalIssue: form.medicalIssue,
            medicalNote: form.medicalNote,
            // Partner
            partnerName: partner.fullName || null,
            partnerAge: partner.age || null,
            partnerWeight: partner.weight || null,
            partnerGoals: partner.goal || [],
            partnerMedicalIssue: partner.medicalIssue || null,
            partnerMedicalNote: partner.medicalNote || null,
            onSuccess: (enrollment) => {
                clearDraft();
                setModalStatus('idle');
                navigate('/payment-success', { state: { enrollment } });
            },
            onError: (msg) => {
                setModalStatus('idle');
                navigate('/payment-failed', {
                    state: {
                        errorMessage: msg || 'Payment could not be completed.',
                        partialEnrollment: { programName, planType, durationMonths, amountPaid: finalPrice },
                    },
                });
            },
            onDismiss: () => setModalStatus('dismissed'),
        });
    };

    const inputCls = (f) =>
        `bg-white/5 border-white/10 text-white placeholder:text-white/30 h-9 ${touched[f] && errors[f] ? 'border-red-400/60' : ''}`;
    const partnerInputCls = (f) =>
        `bg-white/5 border-white/10 text-white placeholder:text-white/30 h-9 ${partnerTouched[f] && partnerErrors[f] ? 'border-red-400/60' : ''}`;

    return (
        <div className="min-h-screen bg-background">


            {/* Header */}
            <div className="sticky top-0 z-40 backdrop-blur-xl"
                style={{ background: 'rgba(10,10,10,0.9)', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                <div className="container mx-auto px-4 py-4 flex items-center justify-between">
                    <button
                        onClick={handleHeaderBack}
                        className="flex items-center gap-2 text-muted-foreground hover:text-white transition-colors"
                    >
                        <ArrowLeft className="w-4 h-4" /> Back
                    </button>
                    <span className="text-lg font-bold text-white">
                        FitWith<span className="text-primary">Sudarshan</span>
                    </span>
                    <div />
                </div>
            </div>

            <div className="container mx-auto px-4 py-10 max-w-2xl">
                <div className="text-center mb-8">
                    <h1 className="text-3xl md:text-4xl font-bold text-white mb-3">Start Your RECODE Journey</h1>
                    <p className="text-muted-foreground text-sm max-w-lg mx-auto">
                        Choose your coaching experience, select your plan, and complete enrollment.
                    </p>
                </div>

                {/* Step indicators */}
                <div className="flex items-center justify-center gap-1 mb-8">
                    {steps.map((s, i) => (
                        <div key={s} className="flex items-center gap-1">
                            <button
                                onClick={() => i < step && setStep(i)}
                                className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-bold transition-all ${i <= step ? 'cursor-pointer' : 'cursor-default'}`}
                                style={
                                    i === step
                                        ? { background: '#e71763', color: 'white' }
                                        : i < step
                                            ? { background: 'rgba(231,23,99,0.3)', color: 'white' }
                                            : { background: 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.4)' }
                                }>
                                {i < step ? <Check className="w-4 h-4" /> : i + 1}
                            </button>
                            <span className={`text-xs hidden sm:block mr-1 ${i === step ? 'text-white font-semibold' : 'text-muted-foreground'}`}>
                                {s}
                            </span>
                            {i < steps.length - 1 && (
                                <div className="w-5 h-px" style={{ background: i < step ? '#e71763' : 'rgba(255,255,255,0.1)' }} />
                            )}
                        </div>
                    ))}
                </div>

                <AnimatePresence mode="wait">
                    <motion.div key={step}
                        initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.2 }}>

                        {/* ── STEP 0 — Coaching Type ── */}
                        {step === 0 && (
                            <div>
                                <h2 className="text-xl font-bold text-white mb-1">How do you want to start RECODE?</h2>
                                <p className="text-muted-foreground text-sm mb-5">Choose your coaching experience.</p>
                                <div className="space-y-3">
                                    {coachingTypes.map((ct) => {
                                        const Icon = tabIcons[ct.id];
                                        const selected = coachingId === ct.id;
                                        return (
                                            <button key={ct.id} onClick={() => handleCoachingChange(ct.id)}
                                                className="w-full text-left rounded-2xl p-5 transition-all"
                                                style={selected
                                                    ? { background: 'rgba(231,23,99,0.08)', border: '2px solid #e71763' }
                                                    : { background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }}>
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

                        {/* ── STEP 1 — Plan & Duration ── */}
                        {step === 1 && (
                            <div>
                                <h2 className="text-xl font-bold text-white mb-1">Who is this plan for?</h2>
                                <p className="text-muted-foreground text-sm mb-4">Select individual or couple plan.</p>
                                <div className="grid grid-cols-2 gap-3 mb-4">
                                    {[
                                        { id: 'individual', label: 'Individual', sub: 'For one person.', icon: User },
                                        { id: 'couple', label: 'Couple', sub: 'For two people.', icon: Users },
                                    ].map(({ id, label, sub, icon: Icon }) => (
                                        <button key={id} onClick={() => handlePlanTypeChange(id)}
                                            className="rounded-2xl p-5 text-center transition-all"
                                            style={planType === id
                                                ? { background: 'rgba(231,23,99,0.08)', border: '2px solid #e71763' }
                                                : { background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }}>
                                            <Icon className={`w-7 h-7 mx-auto mb-2 ${planType === id ? 'text-primary' : 'text-muted-foreground'}`} />
                                            <p className={`font-bold ${planType === id ? 'text-white' : 'text-white/80'}`}>{label}</p>
                                            <p className="text-xs text-muted-foreground mt-0.5">{sub}</p>
                                        </button>
                                    ))}
                                </div>

                                {/* Basic one-time consultation — online only */}
                                {coachingId === 'online' && (
                                    <div className="grid grid-cols-2 gap-3 mb-6">
                                        {[
                                            { id: 'basic_individual', label: 'Basic (Individual)', price: basicConsultation.priceIndividual, original: basicConsultation.originalPriceIndividual },
                                            { id: 'basic_couple', label: 'Basic (Couple)', price: basicConsultation.priceCouple, original: basicConsultation.originalPriceCouple },
                                        ].map(({ id, label, price, original }) => (
                                            <button key={id} onClick={() => handlePlanTypeChange(id)}
                                                className="relative rounded-2xl p-4 text-left transition-all"
                                                style={planType === id
                                                    ? { background: 'rgba(231,23,99,0.08)', border: '2px solid #e71763' }
                                                    : { background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }}>
                                                <span className="absolute -top-2 left-3 px-2 py-0.5 rounded-full text-[9px] font-black text-white"
                                                    style={{ background: '#e71763' }}>
                                                    HOT SALE
                                                </span>
                                                <div className="flex items-center gap-2 mb-1">
                                                    <Zap className={`w-4 h-4 ${planType === id ? 'text-primary' : 'text-muted-foreground'}`} />
                                                    <p className={`font-bold text-sm ${planType === id ? 'text-white' : 'text-white/80'}`}>{label}</p>
                                                </div>
                                                <div className="flex items-baseline gap-1.5">
                                                    <p className="text-xs font-bold text-primary">{formatPrice(price)}</p>
                                                    <p className="text-[11px] text-white/30 line-through">{formatPrice(original)}</p>
                                                </div>
                                            </button>
                                        ))}
                                    </div>
                                )}

                                {!basic && (
                                    <>
                                        <h2 className="text-xl font-bold text-white mb-1">Choose your duration</h2>
                                        <div className="space-y-2 mb-5">
                                            {durations.map((dur) => {
                                                const p = pricingTable[coachingId]?.[planType]?.[dur.months] || 0;
                                                const selected = durationMonths === dur.months;
                                                return (
                                                    <button key={dur.months} onClick={() => handleDurationChange(dur.months)}
                                                        className="w-full text-left rounded-xl p-4 transition-all"
                                                        style={selected
                                                            ? { background: 'rgba(231,23,99,0.08)', border: '2px solid #e71763' }
                                                            : { background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }}>
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
                                                                {selected && <Check className="w-4 h-4 text-primary" />}
                                                            </div>
                                                        </div>
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    </>
                                )}

                                {basic && (
                                    <div className="rounded-xl p-4 mb-5" style={{ background: 'rgba(231,23,99,0.06)', border: '1px solid rgba(231,23,99,0.2)' }}>
                                        <p className="text-sm text-white/80 mb-1">{basicConsultation.name} — {isCoupleBasic ? 'Couple' : 'Individual'}</p>
                                        <p className="text-xs text-white/40">{basicConsultation.description}</p>
                                    </div>
                                )}

                                {/* ── Coupon section ── */}
                                <div className="rounded-xl p-4 mb-4 space-y-3"
                                    style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }}>
                                    <div className="flex items-center gap-2">
                                        <Tag className="w-3.5 h-3.5 text-white/40" />
                                        <span className="text-xs font-semibold text-white/60 uppercase tracking-wider">Have a Coupon Code?</span>
                                    </div>
                                    <CouponInput
                                        coachingId={coachingId}
                                        planType={planType}
                                        durationMonths={basic ? '1' : durationMonths}
                                        originalPrice={originalPrice}
                                        appliedCoupon={appliedCoupon}
                                        onApply={(coupon) => setAppliedCoupon(coupon)}
                                        onRemove={() => setAppliedCoupon(null)}
                                    />
                                    {coachingId === 'personal' && !appliedCoupon && (
                                        <p className="text-[11px] text-white/30 italic">
                                            Returning RECODE™ clients may have a special discount code.
                                        </p>
                                    )}
                                </div>

                                {/* Price summary */}
                                <div className="rounded-xl p-4 mb-5" style={{ background: 'rgba(231,23,99,0.06)', border: '1px solid rgba(231,23,99,0.2)' }}>
                                    <div className="flex items-center justify-between mb-1">
                                        <p className="text-sm text-white/80">
                                            {basic ? basicConsultation.name : activeCoaching?.name} · {isCouplePlan ? 'Couple' : 'Individual'} · {selectedDuration?.label}
                                        </p>
                                        <div className="text-right">
                                            {appliedCoupon ? (
                                                <div>
                                                    <p className="text-xs text-white/40 line-through">{formatPrice(originalPrice)}</p>
                                                    <p className="text-xl font-bold text-primary">{formatPrice(finalPrice)}</p>
                                                </div>
                                            ) : (
                                                <p className="text-xl font-bold text-primary">{formatPrice(originalPrice)}</p>
                                            )}
                                        </div>
                                    </div>
                                    {appliedCoupon && (
                                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                                            className="flex items-center gap-1.5 mt-1">
                                            <Sparkles className="w-3 h-3" style={{ color: '#34d399' }} />
                                            <span className="text-xs font-bold" style={{ color: '#34d399' }}>
                                                {appliedCoupon.code} — You save {formatPrice(appliedCoupon.savings)}!
                                            </span>
                                        </motion.div>
                                    )}
                                </div>

                                <div className="flex gap-3">
                                    <Button onClick={handleBack} variant="outline" className="border-white/15 text-white hover:bg-white/5 px-5">Back</Button>
                                    <Button onClick={handleNext} className="flex-1 py-6 text-white font-bold text-base" style={{ background: '#e71763' }}>
                                        Continue <ChevronRight className="ml-2" />
                                    </Button>
                                </div>
                            </div>
                        )}

                        {/* ── STEP 2 — Your Details ── */}
                        {step === 2 && (
                            <div>
                                <h2 className="text-xl font-bold text-white mb-1">Your Details</h2>
                                <p className="text-muted-foreground text-sm mb-5">Quick details so we can onboard you after payment.</p>

                                <div className="rounded-xl p-3 mb-5" style={{ background: 'rgba(231,23,99,0.06)', border: '1px solid rgba(231,23,99,0.2)' }}>
                                    <div className="flex items-center justify-between flex-wrap gap-2">
                                        <p className="text-sm text-white/80">
                                            {basic ? basicConsultation.name : activeCoaching?.name} · {isCouplePlan ? 'Couple' : 'Individual'} · {selectedDuration?.label}
                                        </p>
                                        <div className="text-right">
                                            {appliedCoupon ? (
                                                <div>
                                                    <p className="text-xs text-white/40 line-through">{formatPrice(originalPrice)}</p>
                                                    <p className="text-lg font-bold text-primary">{formatPrice(finalPrice)}</p>
                                                </div>
                                            ) : (
                                                <p className="text-lg font-bold text-primary">{formatPrice(originalPrice)}</p>
                                            )}
                                        </div>
                                    </div>
                                    {appliedCoupon && (
                                        <div className="flex items-center gap-1.5 mt-1">
                                            <Sparkles className="w-3 h-3" style={{ color: '#34d399' }} />
                                            <span className="text-xs font-bold" style={{ color: '#34d399' }}>
                                                {appliedCoupon.code} applied — saving {formatPrice(appliedCoupon.savings)}
                                            </span>
                                        </div>
                                    )}
                                </div>

                                {/* Person 1 */}
                                <div className="rounded-2xl p-5 mb-4 space-y-4" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }}>
                                    {isCouplePlan && <p className="text-xs font-semibold text-primary uppercase tracking-widest">Person 1 — Primary Enrollee</p>}
                                    <div className="grid grid-cols-2 gap-3">
                                        <Field label="Full Name *" error={errors.fullName} touched={touched.fullName}>
                                            <Input value={form.fullName} onChange={(e) => setForm((f) => ({ ...f, fullName: e.target.value }))} onBlur={() => touch('fullName')} placeholder="Your full name" className={inputCls('fullName')} />
                                        </Field>
                                        <Field label="Age *" error={errors.age} touched={touched.age}>
                                            <Input type="number" value={form.age} onChange={(e) => setForm((f) => ({ ...f, age: e.target.value }))} onBlur={() => touch('age')} placeholder="Age" className={inputCls('age')} />
                                        </Field>
                                    </div>

                                    <Field label="WhatsApp Number *" error={errors.whatsapp} touched={touched.whatsapp}>
                                        <Input value={form.whatsapp} onChange={(e) => setForm((f) => ({ ...f, whatsapp: e.target.value }))} onBlur={() => touch('whatsapp')} placeholder="+91 XXXXXXXXXX" className={inputCls('whatsapp')} />
                                        {!(touched.whatsapp && errors.whatsapp) && <p className="text-xs text-muted-foreground mt-1">Used for onboarding after payment.</p>}
                                    </Field>

                                    <Field label="Email ID *" error={errors.email} touched={touched.email}>
                                        <Input type="email" value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} onBlur={() => touch('email')} placeholder="your@email.com" className={inputCls('email')} />
                                    </Field>

                                    <div className="grid grid-cols-2 gap-3">
                                        <Field label="City / Area *" error={errors.city} touched={touched.city}>
                                            <Input value={form.city} onChange={(e) => setForm((f) => ({ ...f, city: e.target.value }))} onBlur={() => touch('city')} placeholder="Mumbai" className={inputCls('city')} />
                                        </Field>
                                        <Field label="Weight (kg) *" error={errors.weight} touched={touched.weight}>
                                            <Input type="number" value={form.weight} onChange={(e) => setForm((f) => ({ ...f, weight: e.target.value }))} onBlur={() => touch('weight')} placeholder="e.g. 75" className={inputCls('weight')} />
                                        </Field>
                                    </div>

                                    <GoalPicker
                                        selected={form.goal}
                                        onChange={(goals) => { setForm((f) => ({ ...f, goal: goals })); touch('goal'); }}
                                        touched={touched.goal}
                                        error={errors.goal}
                                    />

                                    <div>
                                        <Label className="text-white/70 mb-1.5 block text-xs">Any Medical Issue or Injury? *</Label>
                                        <div className="flex gap-4 mb-1">
                                            {['no', 'yes'].map((opt) => (
                                                <label key={opt} className="flex items-center gap-2 cursor-pointer">
                                                    <input type="radio" name="medical1" value={opt} checked={form.medicalIssue === opt} onChange={() => setForm((f) => ({ ...f, medicalIssue: opt }))} className="accent-primary" />
                                                    <span className="text-sm text-white capitalize">{opt}</span>
                                                </label>
                                            ))}
                                        </div>
                                        {form.medicalIssue === 'yes' && (
                                            <motion.div initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }}>
                                                <Input value={form.medicalNote} onChange={(e) => setForm((f) => ({ ...f, medicalNote: e.target.value }))} placeholder="Please mention briefly" className="bg-white/5 border-white/10 text-white placeholder:text-white/30 h-9 mt-2" />
                                            </motion.div>
                                        )}
                                    </div>
                                </div>

                                {/* Person 2 */}
                                {isCouplePlan && (
                                    <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
                                        className="rounded-2xl p-5 mb-4 space-y-4"
                                        style={{ background: 'rgba(231,23,99,0.04)', border: '1px solid rgba(231,23,99,0.2)' }}>
                                        <p className="text-xs font-semibold text-primary uppercase tracking-widest">Person 2 — Partner</p>
                                        <div className="grid grid-cols-2 gap-3">
                                            <Field label="Partner Full Name *" error={partnerErrors.fullName} touched={partnerTouched.fullName}>
                                                <Input value={partner.fullName} onChange={(e) => setPartner((p) => ({ ...p, fullName: e.target.value }))} onBlur={() => touchPartner('fullName')} placeholder="Partner's name" className={partnerInputCls('fullName')} />
                                            </Field>
                                            <Field label="Partner Age *" error={partnerErrors.age} touched={partnerTouched.age}>
                                                <Input type="number" value={partner.age} onChange={(e) => setPartner((p) => ({ ...p, age: e.target.value }))} onBlur={() => touchPartner('age')} placeholder="Age" className={partnerInputCls('age')} />
                                            </Field>
                                        </div>
                                        <div className="grid grid-cols-2 gap-3">
                                            <div>
                                                <Label className="text-white/70 mb-1 block text-xs">Partner Weight (kg)</Label>
                                                <Input type="number" value={partner.weight} onChange={(e) => setPartner((p) => ({ ...p, weight: e.target.value }))} placeholder="e.g. 65" className="bg-white/5 border-white/10 text-white placeholder:text-white/30 h-9" />
                                            </div>
                                            <div />
                                        </div>
                                        <PartnerGoalPicker
                                            selected={partner.goal}
                                            onChange={(goals) => setPartner((p) => ({ ...p, goal: goals }))}
                                        />
                                        <div>
                                            <Label className="text-white/70 mb-1.5 block text-xs">Partner Medical Issue or Injury?</Label>
                                            <div className="flex gap-4 mb-1">
                                                {['no', 'yes'].map((opt) => (
                                                    <label key={opt} className="flex items-center gap-2 cursor-pointer">
                                                        <input type="radio" name="medical2" value={opt} checked={partner.medicalIssue === opt} onChange={() => setPartner((p) => ({ ...p, medicalIssue: opt }))} className="accent-primary" />
                                                        <span className="text-sm text-white capitalize">{opt}</span>
                                                    </label>
                                                ))}
                                            </div>
                                            {partner.medicalIssue === 'yes' && (
                                                <motion.div initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }}>
                                                    <Input value={partner.medicalNote} onChange={(e) => setPartner((p) => ({ ...p, medicalNote: e.target.value }))} placeholder="Please mention briefly" className="bg-white/5 border-white/10 text-white placeholder:text-white/30 h-9 mt-2" />
                                                </motion.div>
                                            )}
                                        </div>
                                    </motion.div>
                                )}

                                <div className="flex gap-3">
                                    <Button onClick={handleBack} variant="outline" className="border-white/15 text-white hover:bg-white/5 px-5">Back</Button>
                                    <Button onClick={handleNext} className="flex-1 py-6 text-white font-bold text-base" style={{ background: '#e71763' }}>
                                        Review & Pay <ChevronRight className="ml-2" />
                                    </Button>
                                </div>
                            </div>
                        )}

                        {/* ── STEP 3 — Confirm & Pay ── */}
                        {step === 3 && (
                            <form onSubmit={handlePay}>
                                <h2 className="text-xl font-bold text-white mb-1">Review & Confirm</h2>
                                <p className="text-muted-foreground text-sm mb-5">Review your enrollment details before payment.</p>

                                <div className="rounded-2xl p-6 mb-5 space-y-4"
                                    style={{ background: 'rgba(231,23,99,0.06)', border: '1px solid rgba(231,23,99,0.25)' }}>
                                    <div className="flex items-start justify-between gap-3">
                                        <div>
                                            <p className="text-xs text-muted-foreground mb-1">Selected Plan</p>
                                            <p className="font-bold text-white">{basic ? basicConsultation.name : activeCoaching?.name}</p>
                                            <p className="text-sm text-muted-foreground">
                                                {isCouplePlan ? 'Couple Plan' : 'Individual Plan'} · {selectedDuration?.label}
                                            </p>
                                        </div>
                                        <div className="text-right flex-shrink-0">
                                            {appliedCoupon ? (
                                                <div>
                                                    <p className="text-sm text-white/40 line-through">{formatPrice(originalPrice)}</p>
                                                    <p className="text-2xl font-bold text-primary">{formatPrice(finalPrice)}</p>
                                                    <p className="text-xs font-bold mt-0.5" style={{ color: '#34d399' }}>
                                                        Save {formatPrice(appliedCoupon.savings)}
                                                    </p>
                                                </div>
                                            ) : (
                                                <p className="text-2xl font-bold text-primary">{formatPrice(originalPrice)}</p>
                                            )}
                                        </div>
                                    </div>

                                    {/* Coupon badge on confirm */}
                                    {appliedCoupon && (
                                        <div className="flex items-center gap-2 px-3 py-2 rounded-lg"
                                            style={{ background: 'rgba(52,211,153,0.08)', border: '1px solid rgba(52,211,153,0.2)' }}>
                                            <Tag className="w-3.5 h-3.5 flex-shrink-0" style={{ color: '#34d399' }} />
                                            <span className="text-xs font-bold text-white">{appliedCoupon.code}</span>
                                            <span className="text-xs text-white/50">— {appliedCoupon.description}</span>
                                        </div>
                                    )}

                                    <div className="border-t pt-4" style={{ borderColor: 'rgba(255,255,255,0.08)' }}>
                                        <p className="text-xs font-semibold text-primary mb-2 uppercase tracking-widest">Enrollee Details</p>
                                        <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
                                            <span className="text-muted-foreground">Name</span>    <span className="text-white">{form.fullName}</span>
                                            <span className="text-muted-foreground">WhatsApp</span><span className="text-white">{form.whatsapp}</span>
                                            <span className="text-muted-foreground">Email</span>   <span className="text-white">{form.email}</span>
                                            <span className="text-muted-foreground">Age / City</span><span className="text-white">{form.age} yrs · {form.city}</span>
                                            <span className="text-muted-foreground">Weight</span>  <span className="text-white">{form.weight} kg</span>
                                            <span className="text-muted-foreground">Goal(s)</span>
                                            <span className="text-white">{form.goal.join(', ')}</span>
                                            {form.medicalIssue === 'yes' && (
                                                <>
                                                    <span className="text-muted-foreground">Medical</span>
                                                    <span className="text-white">{form.medicalNote || 'Yes'}</span>
                                                </>
                                            )}
                                        </div>
                                    </div>

                                    {isCouplePlan && partner.fullName && (
                                        <div className="border-t pt-4" style={{ borderColor: 'rgba(255,255,255,0.08)' }}>
                                            <p className="text-xs font-semibold text-primary mb-2 uppercase tracking-widest">Partner Details</p>
                                            <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
                                                <span className="text-muted-foreground">Name</span>  <span className="text-white">{partner.fullName}</span>
                                                <span className="text-muted-foreground">Age</span>   <span className="text-white">{partner.age} yrs</span>
                                                {partner.weight && <><span className="text-muted-foreground">Weight</span><span className="text-white">{partner.weight} kg</span></>}
                                                {partner.goal?.length > 0 && <><span className="text-muted-foreground">Goal(s)</span><span className="text-white">{partner.goal.join(', ')}</span></>}
                                            </div>
                                        </div>
                                    )}
                                </div>

                                <p className="text-xs text-muted-foreground mb-5 text-center">
                                    Clicking below opens the secure Razorpay payment window.
                                </p>

                                <div className="flex gap-3">
                                    <Button type="button" onClick={handleBack} variant="outline"
                                        className="border-white/15 text-white hover:bg-white/5 px-5"
                                        disabled={modalStatus === 'loading'}>
                                        Back
                                    </Button>

                                    <div className="relative flex-1">
                                        <motion.span className="absolute inset-0 rounded-xl pointer-events-none"
                                            animate={{ scale: [1, 1.5, 2], opacity: [0.35, 0.12, 0] }}
                                            transition={{ duration: 2.5, repeat: Infinity, ease: 'easeOut' }}
                                            style={{ background: 'rgba(231,23,99,0.3)' }} />
                                        <Button
                                            type="submit"
                                            disabled={!finalPrice || modalStatus === 'loading'}
                                            className="relative w-full py-6 text-white font-bold text-base flex items-center justify-center gap-2 disabled:opacity-50"
                                            style={{ background: '#e71763', boxShadow: '0 0 28px rgba(231,23,99,0.45)' }}>
                                            {modalStatus === 'loading' ? (
                                                <><Loader2 className="w-5 h-5 animate-spin" /> Processing…</>
                                            ) : (
                                                <><Lock className="w-4 h-4" /> Pay {formatPrice(finalPrice)} Securely</>
                                            )}
                                        </Button>
                                    </div>
                                </div>

                                <p className="text-xs text-white/20 text-center mt-4">
                                    Payments processed by Razorpay — PCI-DSS compliant.
                                </p>
                            </form>
                        )}

                    </motion.div>
                </AnimatePresence>
            </div>
        </div>
    );
}
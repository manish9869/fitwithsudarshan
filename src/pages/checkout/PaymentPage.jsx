import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    CheckCircle, XCircle, Loader2, Shield, Lock,
    Globe, Video, MapPin, User, Users, ArrowLeft,
    ChevronRight, Star, Zap
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useRazorpay } from '@/hooks/useRazorpay';
import { useSiteData } from '@/contexts/SiteDataContext';


// ── Helpers ───────────────────────────────────────────────────────────────────
const tabIcons = { online: Globe, video: Video, personal: MapPin };
const formatPrice = (p) =>
    new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(p);

const isBasicPlan = (pt) => pt === 'basic_individual' || pt === 'basic_couple';

// ── Sub-components ────────────────────────────────────────────────────────────
function StatusModal({ status, onClose, paymentId }) {
    if (status === 'idle') return null;
    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-[200] flex items-center justify-center p-4"
                style={{ background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(16px)' }}
            >
                <motion.div
                    initial={{ scale: 0.85, opacity: 0, y: 30 }}
                    animate={{ scale: 1, opacity: 1, y: 0 }}
                    exit={{ scale: 0.85, opacity: 0 }}
                    transition={{ type: 'spring', stiffness: 260, damping: 22 }}
                    className="w-full max-w-md rounded-3xl p-10 text-center"
                    style={{ background: 'rgba(12,12,12,0.97)', border: '1px solid rgba(255,255,255,0.1)', boxShadow: '0 0 80px rgba(231,23,99,0.2), 0 40px 80px rgba(0,0,0,0.7)' }}
                >
                    {status === 'loading' && (
                        <>
                            <motion.div
                                animate={{ rotate: 360 }}
                                transition={{ duration: 1.2, repeat: Infinity, ease: 'linear' }}
                                className="w-16 h-16 mx-auto mb-6"
                            >
                                <Loader2 className="w-16 h-16" style={{ color: '#e71763' }} />
                            </motion.div>
                            <h3 className="text-xl font-black text-white mb-2">Processing Payment</h3>
                            <p className="text-sm text-white/45">Please wait — do not close this window.</p>
                        </>
                    )}

                    {status === 'success' && (
                        <>
                            <motion.div
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                transition={{ type: 'spring', stiffness: 300, damping: 18 }}
                                className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6"
                                style={{ background: 'rgba(231,23,99,0.1)', border: '2px solid rgba(231,23,99,0.4)' }}
                            >
                                <CheckCircle className="w-10 h-10" style={{ color: '#e71763' }} />
                            </motion.div>
                            <h3 className="text-2xl font-black text-white mb-3">Payment Successful!</h3>
                            <p className="text-white/50 text-sm mb-2">Welcome to RECODE™. Your transformation starts now.</p>
                            {paymentId && (
                                <p className="text-xs text-white/25 font-mono mb-6">Payment ID: {paymentId}</p>
                            )}
                            <p className="text-white/60 text-sm mb-8">
                                Sudarshan will reach out on WhatsApp within <strong className="text-white">24 hours</strong> to begin your onboarding.
                            </p>
                            <Link to="/">
                                <Button className="w-full text-white font-bold py-6" style={{ background: '#e71763' }}>
                                    Back to Home
                                </Button>
                            </Link>
                        </>
                    )}

                    {status === 'error' && (
                        <>
                            <div
                                className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6"
                                style={{ background: 'rgba(239,68,68,0.1)', border: '2px solid rgba(239,68,68,0.3)' }}
                            >
                                <XCircle className="w-10 h-10 text-red-400" />
                            </div>
                            <h3 className="text-2xl font-black text-white mb-3">Payment Failed</h3>
                            <p className="text-white/50 text-sm mb-8">Something went wrong. Please try again or contact support.</p>
                            <Button onClick={onClose} className="w-full text-white font-bold py-6" style={{ background: '#e71763' }}>
                                Try Again
                            </Button>
                        </>
                    )}

                    {status === 'dismissed' && (
                        <>
                            <div
                                className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6"
                                style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.12)' }}
                            >
                                <XCircle className="w-10 h-10 text-white/40" />
                            </div>
                            <h3 className="text-xl font-black text-white mb-3">Payment Cancelled</h3>
                            <p className="text-white/45 text-sm mb-8">No charges were made. You can try again whenever you're ready.</p>
                            <Button onClick={onClose} className="w-full text-white font-bold py-6" style={{ background: '#e71763' }}>
                                Go Back
                            </Button>
                        </>
                    )}
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
}

// ── Trust badges ──────────────────────────────────────────────────────────────
const trustBadges = [
    { icon: Lock, label: 'Secure Payment', sub: '256-bit SSL encrypted' },
    { icon: Shield, label: 'Safe Checkout', sub: 'Powered by Razorpay' },
    { icon: Star, label: '5★ Rated Coach', sub: '200+ transformations' },
];

// ── Main Component ────────────────────────────────────────────────────────────
export default function PaymentPage() {
    const { coachingTypes, pricingTable, durations, basicConsultation, loading } = useSiteData();
    const [coachingId, setCoachingId] = useState('online');
    const [planType, setPlanType] = useState('individual');
    const [durationMonths, setDurationMonths] = useState('3');
    const [modalStatus, setModalStatus] = useState('idle');
    const [paymentId, setPaymentId] = useState(null);
    const [errorMsg, setErrorMsg] = useState('');

    // Buyer info
    const [buyerName, setBuyerName] = useState('');
    const [buyerEmail, setBuyerEmail] = useState('');
    const [buyerPhone, setBuyerPhone] = useState('');

    const { initiatePayment } = useRazorpay();

    const basic = isBasicPlan(planType);
    const isCoupleBasic = planType === 'basic_couple';
    const isCouplePlan = planType === 'couple' || isCoupleBasic;

    const price = basic
        ? (pricingTable[coachingId]?.[planType]?.['1'] || 0)
        : (pricingTable[coachingId]?.[planType]?.[durationMonths] || 0);
    const selectedDuration = basic
        ? { months: '1', label: 'One-Time', description: basicConsultation.description }
        : durations.find((d) => d.months === durationMonths);
    const activeCoaching = coachingTypes.find((c) => c.id === coachingId);

    const handleCoachingChange = (id) => {
        setCoachingId(id);
        if (id !== 'online' && isBasicPlan(planType)) setPlanType('individual');
    };
    const handlePlanTypeChange = (pt) => {
        setPlanType(pt);
        if (isBasicPlan(pt)) setDurationMonths('1');
    };

    const handlePay = async () => {
        if (!buyerName.trim() || !buyerEmail.trim()) {
            setErrorMsg('Please fill in your name and email before proceeding.');
            return;
        }
        setErrorMsg('');
        setModalStatus('loading');

        const programLabel = basic
            ? `${basicConsultation.name} — ${isCoupleBasic ? 'Couple' : 'Individual'} — One-Time`
            : `RECODE™ ${activeCoaching?.name} — ${isCouplePlan ? 'Couple' : 'Individual'} — ${selectedDuration?.label}`;

        await initiatePayment({
            amountPaise: price * 100,
            name: buyerName,
            email: buyerEmail,
            contact: buyerPhone,
            description: programLabel,
            programName: programLabel,
            planType: planType,
            durationMonths: basic ? '1' : durationMonths,
            coachingType: basic ? 'online' : coachingId,
            onSuccess: (response) => {
                setPaymentId(response.razorpay_payment_id);
                setModalStatus('success');
            },
            onError: (msg) => {
                setErrorMsg(msg);
                setModalStatus('error');
            },
            onDismiss: () => setModalStatus('dismissed'),
        });
    };

    if (loading || !coachingTypes.length || !basicConsultation) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center">
                <Loader2 className="w-6 h-6 animate-spin text-white/30" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background text-foreground">


            {/* Status Modal */}
            <StatusModal status={modalStatus} paymentId={paymentId} onClose={() => setModalStatus('idle')} />

            {/* Nav */}
            <div
                className="sticky top-0 z-40 backdrop-blur-xl"
                style={{ background: 'rgba(10,10,10,0.92)', borderBottom: '1px solid rgba(255,255,255,0.06)' }}
            >
                <div className="container mx-auto px-4 py-4 flex items-center justify-between">
                    <Link to="/" className="flex items-center gap-2 text-muted-foreground hover:text-white transition-colors">
                        <ArrowLeft className="w-4 h-4" /> Back
                    </Link>
                    <img
                        src="https://vducmiggraxtqdgt.public.blob.vercel-storage.com/logo.png"
                        alt="FitWithSudarshan"
                        className="h-10"
                    />
                    <div className="flex items-center gap-1.5 text-xs text-white/40">
                        <Lock className="w-3 h-3" /> Secure Checkout
                    </div>
                </div>
            </div>

            {/* Page hero strip */}
            <div
                className="relative py-10 overflow-hidden"
                style={{ background: 'linear-gradient(135deg, rgba(231,23,99,0.08) 0%, rgba(0,0,0,0) 60%)' }}
            >
                <div className="absolute inset-0 pointer-events-none">
                    <motion.div
                        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[200px] rounded-full blur-3xl"
                        style={{ background: 'rgba(231,23,99,0.07)' }}
                        animate={{ opacity: [0.5, 1, 0.5] }}
                        transition={{ duration: 5, repeat: Infinity }}
                    />
                </div>
                <div className="relative container mx-auto px-4 text-center">
                    <motion.span
                        className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-widest px-4 py-2 rounded-full mb-3"
                        style={{ color: '#e71763', border: '1px solid rgba(231,23,99,0.28)', background: 'rgba(231,23,99,0.07)' }}
                        animate={{ boxShadow: ['0 0 0px transparent', '0 0 18px rgba(231,23,99,0.35)', '0 0 0px transparent'] }}
                        transition={{ duration: 3, repeat: Infinity }}
                    >
                        <Zap className="w-3 h-3" /> Secure Checkout
                    </motion.span>
                    <h1 className="text-2xl md:text-4xl font-black text-white">
                        Complete Your <span style={{ color: '#e71763' }}>RECODE™ Enrollment</span>
                    </h1>
                    <p className="text-white/40 text-sm mt-2 max-w-md mx-auto">
                        Select your plan, enter your details, and pay securely via Razorpay.
                    </p>
                </div>
            </div>

            <div className="container mx-auto px-4 py-10 max-w-5xl">
                <div className="grid lg:grid-cols-[1fr_380px] gap-8">

                    {/* ── LEFT — Plan selector ─────────────────────────────────────── */}
                    <div className="space-y-8">

                        {/* Coaching type */}
                        <div>
                            <h2 className="text-sm font-black uppercase tracking-widest text-white/40 mb-4">1. Choose Coaching Type</h2>
                            <div className="grid sm:grid-cols-3 gap-3">
                                {coachingTypes.map((ct) => {
                                    const Icon = tabIcons[ct.id];
                                    const selected = coachingId === ct.id;
                                    return (
                                        <button
                                            key={ct.id}
                                            onClick={() => handleCoachingChange(ct.id)}
                                            className="rounded-2xl p-4 text-left transition-all"
                                            style={selected
                                                ? { background: 'rgba(231,23,99,0.08)', border: '2px solid #e71763' }
                                                : { background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }}
                                        >
                                            <div
                                                className="w-9 h-9 rounded-xl flex items-center justify-center mb-3"
                                                style={{ background: selected ? 'rgba(231,23,99,0.18)' : 'rgba(255,255,255,0.05)' }}
                                            >
                                                <Icon className="w-4 h-4" style={{ color: selected ? '#e71763' : 'rgba(255,255,255,0.4)' }} />
                                            </div>
                                            <p className={`font-black text-sm ${selected ? 'text-white' : 'text-white/60'}`}>{ct.shortName}</p>
                                            <p className="text-xs text-white/30 mt-0.5 line-clamp-2">{ct.tagline}</p>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Individual / Couple */}
                        <div>
                            <h2 className="text-sm font-black uppercase tracking-widest text-white/40 mb-4">2. Individual or Couple?</h2>
                            <div className="grid grid-cols-2 gap-3 mb-3">
                                {[
                                    { id: 'individual', label: 'Individual', sub: 'Just for you', icon: User },
                                    { id: 'couple', label: 'Couple', sub: 'For two people', icon: Users },
                                ].map(({ id, label, sub, icon: Icon }) => (
                                    <button
                                        key={id}
                                        onClick={() => handlePlanTypeChange(id)}
                                        className="rounded-2xl p-5 flex items-center gap-4 transition-all"
                                        style={planType === id
                                            ? { background: 'rgba(231,23,99,0.08)', border: '2px solid #e71763' }
                                            : { background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }}
                                    >
                                        <Icon className={`w-6 h-6 ${planType === id ? 'text-primary' : 'text-muted-foreground'}`} />
                                        <div className="text-left">
                                            <p className={`font-black text-sm ${planType === id ? 'text-white' : 'text-white/70'}`}>{label}</p>
                                            <p className="text-xs text-white/30">{sub}</p>
                                        </div>
                                    </button>
                                ))}
                            </div>

                            {/* Basic one-time consultation — online only */}
                            {coachingId === 'online' && (
                                <div className="grid grid-cols-2 gap-3">
                                    {[
                                        { id: 'basic_individual', label: 'RECODE Blueprint (Individual)', price: basicConsultation.priceIndividual, original: basicConsultation.originalPriceIndividual },
                                        { id: 'basic_couple', label: 'RECODE Blueprint (Couple)', price: basicConsultation.priceCouple, original: basicConsultation.originalPriceCouple },
                                    ].map(({ id, label, price: p, original }) => (
                                        <button
                                            key={id}
                                            onClick={() => handlePlanTypeChange(id)}
                                            className="relative rounded-2xl p-4 text-left transition-all"
                                            style={planType === id
                                                ? { background: 'rgba(231,23,99,0.08)', border: '2px solid #e71763' }
                                                : { background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }}
                                        >
                                            <span className="absolute -top-2 left-3 px-2 py-0.5 rounded-full text-[9px] font-black text-white"
                                                style={{ background: '#e71763' }}>
                                                HOT SALE
                                            </span>
                                            <div className="flex items-center gap-2 mb-1">
                                                <Zap className={`w-4 h-4 ${planType === id ? 'text-primary' : 'text-muted-foreground'}`} />
                                                <p className={`font-black text-sm ${planType === id ? 'text-white' : 'text-white/70'}`}>{label}</p>
                                            </div>
                                            <div className="flex items-baseline gap-1.5">
                                                <p className="text-xs font-bold" style={{ color: '#e71763' }}>{formatPrice(p)}</p>
                                                <p className="text-[11px] text-white/30 line-through">{formatPrice(original)}</p>
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Duration */}
                        {!basic && (
                            <div>
                                <h2 className="text-sm font-black uppercase tracking-widest text-white/40 mb-4">3. Select Duration</h2>
                                <div className="space-y-2">
                                    {durations.map((dur) => {
                                        const p = pricingTable[coachingId]?.[planType]?.[dur.months] || 0;
                                        const selected = durationMonths === dur.months;
                                        return (
                                            <button
                                                key={dur.months}
                                                onClick={() => setDurationMonths(dur.months)}
                                                className="w-full rounded-xl p-4 flex items-center justify-between transition-all"
                                                style={selected
                                                    ? { background: 'rgba(231,23,99,0.08)', border: '2px solid #e71763' }
                                                    : { background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }}
                                            >
                                                <div className="flex items-center gap-3">
                                                    <div
                                                        className="w-4 h-4 rounded-full border-2 flex items-center justify-center flex-shrink-0"
                                                        style={{ borderColor: selected ? '#e71763' : 'rgba(255,255,255,0.2)' }}
                                                    >
                                                        {selected && <div className="w-2 h-2 rounded-full" style={{ background: '#e71763' }} />}
                                                    </div>
                                                    <div className="text-left">
                                                        <span className={`font-bold text-sm ${selected ? 'text-white' : 'text-white/70'}`}>{dur.label}</span>
                                                        {dur.popular && (
                                                            <span
                                                                className="ml-2 text-[10px] font-black px-2 py-0.5 rounded-full"
                                                                style={{ background: 'rgba(231,23,99,0.2)', color: '#e71763' }}
                                                            >
                                                                Most Popular
                                                            </span>
                                                        )}
                                                        <p className="text-xs text-white/30 mt-0.5">{dur.description}</p>
                                                    </div>
                                                </div>
                                                <span className={`font-black text-base ${selected ? 'text-white' : 'text-white/50'}`}>
                                                    {formatPrice(p)}
                                                </span>
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                        )}

                        {basic && (
                            <div className="rounded-2xl p-5" style={{ background: 'rgba(231,23,99,0.06)', border: '1px solid rgba(231,23,99,0.2)' }}>
                                <p className="text-sm font-bold text-white mb-1">{basicConsultation.name}</p>
                                <p className="text-xs text-white/40">{basicConsultation.description}</p>
                            </div>
                        )}

                        {/* Buyer details */}
                        <div>
                            <h2 className="text-sm font-black uppercase tracking-widest text-white/40 mb-4">4. Your Details</h2>
                            <div
                                className="rounded-2xl p-6 space-y-4"
                                style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }}
                            >
                                <div className="grid sm:grid-cols-2 gap-4">
                                    <div>
                                        <Label className="text-white/60 mb-1.5 block text-xs">Full Name *</Label>
                                        <Input
                                            value={buyerName}
                                            onChange={(e) => setBuyerName(e.target.value)}
                                            placeholder="Your name"
                                            className="bg-white/5 border-white/10 text-white placeholder:text-white/25 h-10"
                                        />
                                    </div>
                                    <div>
                                        <Label className="text-white/60 mb-1.5 block text-xs">WhatsApp / Phone</Label>
                                        <Input
                                            value={buyerPhone}
                                            onChange={(e) => setBuyerPhone(e.target.value)}
                                            placeholder="+91 XXXXXXXXXX"
                                            className="bg-white/5 border-white/10 text-white placeholder:text-white/25 h-10"
                                        />
                                    </div>
                                </div>
                                <div>
                                    <Label className="text-white/60 mb-1.5 block text-xs">Email Address *</Label>
                                    <Input
                                        type="email"
                                        value={buyerEmail}
                                        onChange={(e) => setBuyerEmail(e.target.value)}
                                        placeholder="your@email.com"
                                        className="bg-white/5 border-white/10 text-white placeholder:text-white/25 h-10"
                                    />
                                    <p className="text-xs text-white/25 mt-1.5">Payment receipt will be sent to this email.</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* ── RIGHT — Order summary + Pay button ──────────────────────── */}
                    <div className="lg:sticky lg:top-24 h-fit space-y-4">
                        {/* Summary card */}
                        <div
                            className="rounded-3xl p-6 overflow-hidden relative"
                            style={{ background: 'linear-gradient(135deg, rgba(231,23,99,0.1) 0%, rgba(0,0,0,0.6) 100%)', border: '1px solid rgba(231,23,99,0.3)' }}
                        >
                            {/* Glow */}
                            <motion.div
                                className="absolute inset-0 rounded-3xl pointer-events-none"
                                style={{ background: 'radial-gradient(ellipse at 30% 0%, rgba(231,23,99,0.12) 0%, transparent 60%)' }}
                                animate={{ opacity: [0.5, 1, 0.5] }}
                                transition={{ duration: 4, repeat: Infinity }}
                            />

                            <div className="relative">
                                <p className="text-xs font-black uppercase tracking-widest text-white/40 mb-4">Order Summary</p>

                                <div className="space-y-3 mb-5">
                                    {[
                                        { label: 'Plan', value: basic ? 'Basic Consultation' : (activeCoaching?.shortName ?? '—') },
                                        { label: 'Type', value: isCouplePlan ? 'Couple' : 'Individual' },
                                        { label: 'Duration', value: basic ? 'One-Time' : (selectedDuration?.label ?? '—') },
                                    ].map(({ label, value }) => (
                                        <div key={label} className="flex justify-between text-sm">
                                            <span className="text-white/40">{label}</span>
                                            <span className="text-white font-semibold">{value}</span>
                                        </div>
                                    ))}
                                </div>

                                <div
                                    className="border-t pt-4 mt-4 flex items-center justify-between"
                                    style={{ borderColor: 'rgba(255,255,255,0.08)' }}
                                >
                                    <span className="text-sm text-white/60">Total Amount</span>
                                    <motion.span
                                        key={price}
                                        initial={{ scale: 0.85, opacity: 0 }}
                                        animate={{ scale: 1, opacity: 1 }}
                                        className="text-3xl font-black"
                                        style={{ color: '#e71763' }}
                                    >
                                        {formatPrice(price)}
                                    </motion.span>
                                </div>
                                {isCouplePlan && !basic && (
                                    <p className="text-xs text-white/30 text-right mt-1">
                                        {formatPrice(Math.round(price / 2))}/person
                                    </p>
                                )}
                            </div>
                        </div>

                        {/* Error msg */}
                        {errorMsg && (
                            <motion.div
                                initial={{ opacity: 0, y: -8 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="rounded-xl px-4 py-3 text-sm text-red-300"
                                style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.25)' }}
                            >
                                {errorMsg}
                            </motion.div>
                        )}

                        {/* Pay button */}
                        <div className="relative">
                            <motion.span
                                className="absolute inset-0 rounded-full"
                                animate={{ scale: [1, 1.5, 2], opacity: [0.4, 0.15, 0] }}
                                transition={{ duration: 2.5, repeat: Infinity, ease: 'easeOut' }}
                                style={{ background: 'rgba(231,23,99,0.3)' }}
                            />
                            <motion.button
                                whileHover={{ scale: 1.03 }}
                                whileTap={{ scale: 0.97 }}
                                onClick={handlePay}
                                disabled={!price || modalStatus === 'loading'}
                                className="relative w-full py-5 rounded-2xl font-black text-white text-base flex items-center justify-center gap-2 disabled:opacity-50"
                                style={{ background: '#e71763', boxShadow: '0 0 35px rgba(231,23,99,0.45)' }}
                            >
                                {modalStatus === 'loading' ? (
                                    <><Loader2 className="w-5 h-5 animate-spin" /> Processing…</>
                                ) : (
                                    <><Lock className="w-4 h-4" /> Pay {formatPrice(price)} Securely <ChevronRight className="w-4 h-4" /></>
                                )}
                            </motion.button>
                        </div>

                        {/* Trust badges */}
                        <div className="grid grid-cols-3 gap-2">
                            {trustBadges.map(({ icon: Icon, label, sub }) => (
                                <div
                                    key={label}
                                    className="rounded-xl p-3 text-center"
                                    style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}
                                >
                                    <Icon className="w-4 h-4 mx-auto mb-1.5" style={{ color: '#e71763' }} />
                                    <p className="text-[10px] font-bold text-white/70 leading-tight">{label}</p>
                                    <p className="text-[9px] text-white/25 mt-0.5 leading-tight">{sub}</p>
                                </div>
                            ))}
                        </div>

                        <p className="text-xs text-white/25 text-center leading-relaxed px-2">
                            By proceeding you agree to our terms. Payments processed by Razorpay — PCI-DSS compliant.
                        </p>

                        {/* Razorpay logo */}
                        <div className="flex items-center justify-center gap-2 opacity-40">
                            <Shield className="w-3 h-3 text-white/60" />
                            <span className="text-xs text-white/60">Powered by</span>
                            <span className="text-xs font-black text-white/80">Razorpay</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
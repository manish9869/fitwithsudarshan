/**
 * PaymentSuccess.jsx
 * Premium payment success page — luxury dark cinematic aesthetic.
 * Receives enrollment data via React Router state.
 */

import { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence, useMotionValue, useSpring } from 'framer-motion';
import { useNavigate, useLocation } from 'react-router-dom';
import {
    CheckCircle, Download, MessageCircle, Home,
    Calendar, CreditCard, Hash, User, Mail, Phone,
    Dumbbell, Clock, ArrowRight, Shield, Sparkles,
    ChevronRight, Star, Copy, Check,
} from 'lucide-react';
import { downloadInvoice } from '../services/invoiceService';
import CustomCursor from '../components/CustomCursor';

// ─── Floating orbs background ─────────────────────────────────────────────────
function FloatingOrbs() {
    return (
        <div className="fixed inset-0 pointer-events-none overflow-hidden">
            {/* Primary glow */}
            <motion.div
                className="absolute rounded-full blur-[160px]"
                style={{
                    width: 700, height: 700,
                    background: 'radial-gradient(circle, rgba(231,23,99,0.18) 0%, transparent 70%)',
                    top: '-20%', left: '50%', transform: 'translateX(-50%)',
                }}
                animate={{ y: [0, 30, 0], opacity: [0.7, 1, 0.7] }}
                transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
            />
            {/* Secondary accent */}
            <motion.div
                className="absolute rounded-full blur-[120px]"
                style={{
                    width: 400, height: 400,
                    background: 'radial-gradient(circle, rgba(231,23,99,0.1) 0%, transparent 70%)',
                    bottom: '5%', right: '-5%',
                }}
                animate={{ scale: [1, 1.2, 1], opacity: [0.5, 0.8, 0.5] }}
                transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut', delay: 2 }}
            />
            {/* Grid lines */}
            <div
                className="absolute inset-0"
                style={{
                    backgroundImage: `
                        linear-gradient(rgba(231,23,99,0.04) 1px, transparent 1px),
                        linear-gradient(90deg, rgba(231,23,99,0.04) 1px, transparent 1px)
                    `,
                    backgroundSize: '60px 60px',
                    maskImage: 'radial-gradient(ellipse at center, black 0%, transparent 75%)',
                }}
            />
            {/* Noise texture overlay */}
            <div
                className="absolute inset-0 opacity-[0.025]"
                style={{
                    backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
                    backgroundSize: '200px 200px',
                }}
            />
        </div>
    );
}

// ─── Confetti burst ───────────────────────────────────────────────────────────
function ConfettiParticle({ delay, color, size, tx, ty, rotate }) {
    return (
        <motion.div
            className="absolute rounded-sm"
            style={{ width: size, height: size * 0.4, background: color, top: '50%', left: '50%', originX: '50%', originY: '50%' }}
            initial={{ x: 0, y: 0, opacity: 1, scale: 1, rotate: 0 }}
            animate={{ x: tx, y: ty, opacity: 0, scale: 0, rotate }}
            transition={{ duration: 1 + Math.random() * 0.5, delay, ease: [0.2, 0.8, 0.4, 1] }}
        />
    );
}

function SuccessParticles() {
    const colors = ['#e71763', '#ff6b9d', '#fbbf24', '#34d399', '#60a5fa', '#ffffff', '#f472b6'];
    const particles = Array.from({ length: 40 }).map((_, i) => {
        const angle = (i / 40) * 360 + Math.random() * 20;
        const dist = 80 + Math.random() * 140;
        return {
            tx: Math.cos((angle * Math.PI) / 180) * dist,
            ty: Math.sin((angle * Math.PI) / 180) * dist,
            color: colors[i % colors.length],
            size: 5 + Math.random() * 8,
            delay: i * 0.02,
            rotate: Math.random() * 720 - 360,
        };
    });
    return (
        <div className="pointer-events-none absolute inset-0 overflow-visible">
            {particles.map((p, i) => <ConfettiParticle key={i} {...p} />)}
        </div>
    );
}

// ─── Animated success icon ────────────────────────────────────────────────────
function SuccessIcon() {
    const [burst, setBurst] = useState(false);

    useEffect(() => {
        const t = setTimeout(() => setBurst(true), 600);
        return () => clearTimeout(t);
    }, []);

    return (
        <div className="relative flex items-center justify-center w-40 h-40 mx-auto mb-10">
            {/* Pulse rings */}
            {[1, 2, 3].map((i) => (
                <motion.div
                    key={i}
                    className="absolute rounded-full"
                    style={{
                        inset: `-${i * 16}px`,
                        border: `1px solid rgba(231,23,99,${0.4 - i * 0.1})`,
                    }}
                    initial={{ scale: 0.5, opacity: 0 }}
                    animate={{ scale: 1, opacity: [0, 0.6, 0] }}
                    transition={{
                        duration: 2.4,
                        delay: 0.4 + i * 0.2,
                        repeat: Infinity,
                        repeatDelay: 1.8,
                        ease: 'easeOut',
                    }}
                />
            ))}

            {/* Outer ring */}
            <motion.div
                className="absolute inset-0 rounded-full"
                style={{ border: '1px solid rgba(231,23,99,0.3)' }}
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.6, delay: 0.1, ease: [0.34, 1.56, 0.64, 1] }}
            />

            {/* Main circle */}
            <motion.div
                className="relative z-10 w-32 h-32 rounded-full flex items-center justify-center"
                style={{
                    background: 'linear-gradient(135deg, rgba(231,23,99,0.2) 0%, rgba(231,23,99,0.05) 100%)',
                    border: '1.5px solid rgba(231,23,99,0.5)',
                    boxShadow: '0 0 80px rgba(231,23,99,0.3), 0 0 160px rgba(231,23,99,0.1), inset 0 0 40px rgba(231,23,99,0.05)',
                }}
                initial={{ scale: 0, rotate: -45 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ duration: 0.7, delay: 0.2, type: 'spring', stiffness: 260, damping: 20 }}
            >
                <motion.div
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ duration: 0.4, delay: 0.6 }}
                >
                    <CheckCircle
                        strokeWidth={1.5}
                        className="w-16 h-16"
                        style={{ color: '#e71763', filter: 'drop-shadow(0 0 12px rgba(231,23,99,0.6))' }}
                    />
                </motion.div>
                {burst && <SuccessParticles />}
            </motion.div>
        </div>
    );
}

// ─── Copyable text ────────────────────────────────────────────────────────────
function CopyText({ value }) {
    const [copied, setCopied] = useState(false);
    const copy = () => {
        navigator.clipboard.writeText(value).catch(() => { });
        setCopied(true);
        setTimeout(() => setCopied(false), 1800);
    };
    return (
        <button
            onClick={copy}
            className="flex items-center gap-1.5 group transition-all"
            title="Copy"
        >
            <span className="text-sm font-bold text-white font-mono tracking-tight">{value}</span>
            <span className="opacity-0 group-hover:opacity-100 transition-opacity">
                {copied
                    ? <Check className="w-3 h-3" style={{ color: '#22c55e' }} />
                    : <Copy className="w-3 h-3 text-white/30" />
                }
            </span>
        </button>
    );
}

// ─── Detail row ───────────────────────────────────────────────────────────────
function DetailRow({ icon: Icon, label, value, accent, mono, copyable }) {
    return (
        <div
            className="flex items-center gap-4 py-3.5 group"
            style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}
        >
            <div
                className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 transition-all group-hover:scale-105"
                style={{
                    background: 'rgba(231,23,99,0.1)',
                    border: '1px solid rgba(231,23,99,0.18)',
                }}
            >
                <Icon className="w-4 h-4" style={{ color: '#e71763' }} />
            </div>
            <div className="flex-1 min-w-0">
                <p className="text-[11px] font-medium tracking-wider uppercase text-white/30 mb-0.5">{label}</p>
                {copyable
                    ? <CopyText value={value} />
                    : (
                        <p
                            className={`text-sm font-semibold truncate ${mono ? 'font-mono tracking-tight' : ''}`}
                            style={{ color: accent ? '#e71763' : 'rgba(255,255,255,0.92)' }}
                        >
                            {value || '—'}
                        </p>
                    )
                }
            </div>
        </div>
    );
}

// ─── Step ────────────────────────────────────────────────────────────────────
function Step({ n, title, desc, delay, active }) {
    return (
        <motion.div
            initial={{ opacity: 0, x: -16 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.45, delay, ease: [0.22, 1, 0.36, 1] }}
            className="flex gap-4 group"
        >
            <div className="flex flex-col items-center gap-0">
                <div
                    className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-black flex-shrink-0 transition-all"
                    style={{
                        background: active ? '#e71763' : 'rgba(231,23,99,0.12)',
                        border: `1px solid ${active ? '#e71763' : 'rgba(231,23,99,0.25)'}`,
                        color: active ? 'white' : '#e71763',
                        boxShadow: active ? '0 0 20px rgba(231,23,99,0.4)' : 'none',
                    }}
                >
                    {n}
                </div>
                {n < 4 && (
                    <div
                        className="w-px flex-1 mt-1"
                        style={{ background: 'linear-gradient(to bottom, rgba(231,23,99,0.2), transparent)', minHeight: 20 }}
                    />
                )}
            </div>
            <div className="pb-5">
                <p className="text-sm font-bold text-white mb-1">{title}</p>
                <p className="text-xs leading-relaxed text-white/40">{desc}</p>
            </div>
        </motion.div>
    );
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
function formatCurrency(amount) {
    return new Intl.NumberFormat('en-IN', {
        style: 'currency', currency: 'INR', maximumFractionDigits: 0,
    }).format(amount);
}

function formatDate(iso) {
    if (!iso) return '—';
    const d = new Date(iso);
    if (isNaN(d.getTime())) return '—';
    return new Intl.DateTimeFormat('en-IN', {
        day: '2-digit', month: 'long', year: 'numeric',
        hour: '2-digit', minute: '2-digit', hour12: true,
        timeZone: 'Asia/Kolkata',
    }).format(d);
}

// ─── Main ─────────────────────────────────────────────────────────────────────
export default function PaymentSuccess() {
    const navigate = useNavigate();
    const location = useLocation();
    const enrollment = location.state?.enrollment;
    const [invoiceLoading, setInvoiceLoading] = useState(false);
    const [entered, setEntered] = useState(false);

    useEffect(() => {
        if (!enrollment) {
            navigate('/', { replace: true });
            return;
        }
        // Small delay so the page fade-in feels intentional
        const t = setTimeout(() => setEntered(true), 80);
        return () => clearTimeout(t);
    }, [enrollment, navigate]);

    if (!enrollment) return null;

    const handleDownload = async () => {
        setInvoiceLoading(true);
        try { downloadInvoice(enrollment); } catch (e) { console.error(e); }
        finally { setTimeout(() => setInvoiceLoading(false), 900); }
    };

    return (
        <motion.div
            className="min-h-screen text-white"
            style={{ background: '#080808' }}
            initial={{ opacity: 0 }}
            animate={{ opacity: entered ? 1 : 0 }}
            transition={{ duration: 0.5 }}
        >
            <CustomCursor />
            <FloatingOrbs />

            {/* ── Nav ─────────────────────────────────────────────────────────── */}
            <div
                className="relative z-20 sticky top-0 backdrop-blur-2xl"
                style={{ background: 'rgba(8,8,8,0.85)', borderBottom: '1px solid rgba(255,255,255,0.05)' }}
            >
                <div className="container mx-auto px-6 py-3.5 flex items-center justify-between max-w-6xl">
                    <div className="flex items-center gap-2.5">
                        <div
                            className="w-6 h-6 rounded-full flex items-center justify-center"
                            style={{ background: '#e71763', boxShadow: '0 0 16px rgba(231,23,99,0.5)' }}
                        >
                            <CheckCircle className="w-3.5 h-3.5 text-white" strokeWidth={2.5} />
                        </div>
                        <span className="text-sm font-bold text-white/90">FitWith<span style={{ color: '#e71763' }}>Sudarshan</span></span>
                    </div>
                    <div
                        className="flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold"
                        style={{ background: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.2)', color: '#22c55e' }}
                    >
                        <Shield className="w-3 h-3" />
                        Payment Verified
                    </div>
                </div>
            </div>

            <div className="relative z-10 container mx-auto px-4 py-16 max-w-6xl">

                {/* ── Hero ────────────────────────────────────────────────────── */}
                <motion.div
                    className="text-center mb-20"
                    initial={{ opacity: 0, y: 40 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.7, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
                >
                    <SuccessIcon />

                    <motion.div
                        initial={{ opacity: 0, y: 16 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, delay: 0.7 }}
                    >
                        <div
                            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-[0.15em] mb-6"
                            style={{
                                background: 'rgba(34,197,94,0.08)',
                                border: '1px solid rgba(34,197,94,0.25)',
                                color: '#22c55e',
                            }}
                        >
                            <Sparkles className="w-3 h-3" />
                            Payment Successful
                        </div>

                        <h1
                            className="text-5xl md:text-6xl font-black mb-5 leading-[1.05] tracking-tight"
                            style={{ fontFamily: 'system-ui, -apple-system, sans-serif' }}
                        >
                            You're{' '}
                            <span
                                style={{
                                    color: '#e71763',
                                    textShadow: '0 0 60px rgba(231,23,99,0.4)',
                                }}
                            >
                                Enrolled.
                            </span>
                        </h1>

                        <p className="text-white/45 max-w-md mx-auto text-base leading-relaxed mb-8">
                            Your payment has been verified and your transformation journey officially begins today.
                        </p>

                        {/* Enrollment ID pill */}
                        <div
                            className="inline-flex items-center gap-3 px-6 py-3 rounded-2xl cursor-pointer"
                            style={{
                                background: 'rgba(231,23,99,0.06)',
                                border: '1px solid rgba(231,23,99,0.2)',
                            }}
                        >
                            <Hash className="w-4 h-4 flex-shrink-0" style={{ color: '#e71763' }} />
                            <span className="text-xs text-white/40 font-medium">Enrollment ID</span>
                            <CopyText value={enrollment.enrollmentId} />
                        </div>
                    </motion.div>
                </motion.div>

                {/* ── Main Grid ────────────────────────────────────────────────── */}
                <div className="grid lg:grid-cols-[1fr_360px] gap-6 items-start">

                    {/* LEFT */}
                    <div className="space-y-5">

                        {/* Enrollment Summary */}
                        <motion.div
                            initial={{ opacity: 0, y: 24 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.55, delay: 0.9, ease: [0.22, 1, 0.36, 1] }}
                            className="rounded-3xl overflow-hidden"
                            style={{
                                background: 'rgba(255,255,255,0.025)',
                                border: '1px solid rgba(255,255,255,0.07)',
                                backdropFilter: 'blur(20px)',
                            }}
                        >
                            <div
                                className="flex items-center gap-3 px-7 py-4"
                                style={{
                                    background: 'linear-gradient(90deg, rgba(231,23,99,0.1) 0%, transparent 100%)',
                                    borderBottom: '1px solid rgba(255,255,255,0.05)',
                                }}
                            >
                                <Star className="w-3.5 h-3.5" style={{ color: '#e71763' }} />
                                <span className="text-xs font-black uppercase tracking-[0.15em] text-white/70">
                                    Enrollment Summary
                                </span>
                            </div>

                            <div className="px-7 pb-3">
                                <div className="grid md:grid-cols-2 gap-x-10">
                                    <div>
                                        <DetailRow icon={User} label="Name" value={enrollment.customerName} />
                                        <DetailRow icon={Mail} label="Email" value={enrollment.customerEmail} />
                                        <DetailRow icon={Phone} label="WhatsApp" value={enrollment.customerPhone} />
                                        <DetailRow icon={Dumbbell} label="Program" value={enrollment.programName} />
                                    </div>
                                    <div>
                                        <DetailRow
                                            icon={Clock}
                                            label="Duration"
                                            value={enrollment.durationMonths ? `${enrollment.durationMonths} Month${enrollment.durationMonths > 1 ? 's' : ''}` : '—'}
                                        />
                                        <DetailRow icon={CreditCard} label="Amount Paid" value={formatCurrency(enrollment.amountPaid)} accent />
                                        <DetailRow icon={Calendar} label="Payment Date" value={formatDate(enrollment.paymentDate)} />
                                        <DetailRow icon={Hash} label="Payment ID" value={enrollment.razorpayPaymentId} mono copyable />
                                    </div>
                                </div>
                            </div>
                        </motion.div>

                        {/* What happens next */}
                        <motion.div
                            initial={{ opacity: 0, y: 24 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.55, delay: 1.05, ease: [0.22, 1, 0.36, 1] }}
                            className="rounded-3xl p-7"
                            style={{
                                background: 'rgba(255,255,255,0.025)',
                                border: '1px solid rgba(255,255,255,0.07)',
                                backdropFilter: 'blur(20px)',
                            }}
                        >
                            <div className="flex items-center gap-2.5 mb-7">
                                <ArrowRight className="w-3.5 h-3.5" style={{ color: '#e71763' }} />
                                <span className="text-xs font-black uppercase tracking-[0.15em] text-white/70">What Happens Next</span>
                            </div>
                            <div>
                                <Step n={1} delay={1.1} active title="Enrollment Review" desc="Our coaching team will review your details and prepare your personalised onboarding." />
                                <Step n={2} delay={1.2} title="Onboarding Instructions" desc="Detailed onboarding instructions will arrive via email and WhatsApp within 24 hours." />
                                <Step n={3} delay={1.3} title="Plan Creation" desc="Sudarshan will craft your personalised RECODE™ workout and nutrition plan." />
                                <Step n={4} delay={1.4} title="Begin Your Transformation" desc="Start your recovery-based journey with full coach support from day one." />
                            </div>
                        </motion.div>
                    </div>

                    {/* RIGHT */}
                    <motion.div
                        initial={{ opacity: 0, x: 24 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.55, delay: 1.0, ease: [0.22, 1, 0.36, 1] }}
                        className="space-y-4 lg:sticky lg:top-24"
                    >
                        {/* Program card */}
                        <div
                            className="rounded-3xl p-6 relative overflow-hidden"
                            style={{
                                background: 'linear-gradient(135deg, rgba(231,23,99,0.14) 0%, rgba(0,0,0,0.5) 60%)',
                                border: '1px solid rgba(231,23,99,0.22)',
                            }}
                        >
                            {/* Shimmer */}
                            <motion.div
                                className="absolute inset-0 rounded-3xl pointer-events-none"
                                style={{ background: 'radial-gradient(ellipse at 20% 0%, rgba(231,23,99,0.18) 0%, transparent 55%)' }}
                                animate={{ opacity: [0.6, 1, 0.6] }}
                                transition={{ duration: 4, repeat: Infinity }}
                            />
                            <div className="relative">
                                <p className="text-[10px] font-black uppercase tracking-[0.18em] text-white/30 mb-3">Your Plan</p>
                                <p className="text-lg font-black text-white leading-snug mb-1.5">{enrollment.programName}</p>
                                <p className="text-sm text-white/40 mb-5">
                                    {enrollment.durationMonths ? `${enrollment.durationMonths}-Month` : ''} · {enrollment.planType === 'couple' ? 'Couple Plan' : 'Individual Plan'}
                                </p>
                                <div
                                    className="flex items-center justify-between pt-4"
                                    style={{ borderTop: '1px solid rgba(255,255,255,0.08)' }}
                                >
                                    <span className="text-xs text-white/35 font-medium">Total Paid</span>
                                    <span
                                        className="text-2xl font-black"
                                        style={{ color: '#e71763', textShadow: '0 0 30px rgba(231,23,99,0.5)' }}
                                    >
                                        {formatCurrency(enrollment.amountPaid)}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Actions */}
                        <div
                            className="rounded-3xl p-5 space-y-2.5"
                            style={{
                                background: 'rgba(255,255,255,0.025)',
                                border: '1px solid rgba(255,255,255,0.07)',
                            }}
                        >
                            <p className="text-[10px] font-black text-white/30 uppercase tracking-[0.18em] mb-4 px-1">Quick Actions</p>

                            {/* Download Invoice */}
                            <motion.button
                                whileHover={{ scale: 1.015, boxShadow: '0 0 40px rgba(231,23,99,0.5)' }}
                                whileTap={{ scale: 0.97 }}
                                onClick={handleDownload}
                                disabled={invoiceLoading}
                                className="w-full flex items-center gap-3 px-5 py-4 rounded-2xl font-bold text-sm text-white transition-all disabled:opacity-60 relative overflow-hidden"
                                style={{ background: '#e71763', boxShadow: '0 0 28px rgba(231,23,99,0.35)' }}
                            >
                                <motion.div
                                    className="absolute inset-0"
                                    style={{ background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.1), transparent)' }}
                                    animate={{ x: ['-100%', '200%'] }}
                                    transition={{ duration: 2, repeat: Infinity, repeatDelay: 1 }}
                                />
                                <Download className="w-4 h-4 flex-shrink-0 relative z-10" />
                                <span className="relative z-10">
                                    {invoiceLoading ? 'Generating…' : 'Download Invoice PDF'}
                                </span>
                                <ChevronRight className="w-4 h-4 ml-auto relative z-10" />
                            </motion.button>

                            {/* WhatsApp */}
                            <motion.a
                                whileHover={{ scale: 1.015 }}
                                whileTap={{ scale: 0.97 }}
                                href="https://wa.me/919619708124"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="w-full flex items-center gap-3 px-5 py-4 rounded-2xl font-bold text-sm text-white transition-all"
                                style={{ background: 'rgba(37,211,102,0.12)', border: '1px solid rgba(37,211,102,0.25)' }}
                            >
                                <MessageCircle className="w-4 h-4 flex-shrink-0" style={{ color: '#25D366' }} />
                                <span>Message Coach on WhatsApp</span>
                                <ChevronRight className="w-4 h-4 ml-auto text-white/30" />
                            </motion.a>

                            {/* Home */}
                            <motion.button
                                whileHover={{ scale: 1.015 }}
                                whileTap={{ scale: 0.97 }}
                                onClick={() => navigate('/')}
                                className="w-full flex items-center gap-3 px-5 py-4 rounded-2xl font-bold text-sm transition-all"
                                style={{
                                    background: 'rgba(255,255,255,0.04)',
                                    border: '1px solid rgba(255,255,255,0.08)',
                                    color: 'rgba(255,255,255,0.6)',
                                }}
                            >
                                <Home className="w-4 h-4 flex-shrink-0" />
                                <span>Go to Home</span>
                                <ChevronRight className="w-4 h-4 ml-auto opacity-40" />
                            </motion.button>
                        </div>

                        {/* Trust badge */}
                        <div
                            className="flex items-center gap-3 px-5 py-3.5 rounded-2xl"
                            style={{
                                background: 'rgba(34,197,94,0.05)',
                                border: '1px solid rgba(34,197,94,0.12)',
                            }}
                        >
                            <Shield className="w-4 h-4 flex-shrink-0" style={{ color: '#22c55e' }} />
                            <p className="text-xs text-white/35 leading-relaxed">
                                Payment verified via Razorpay. A confirmation has been sent to your email.
                            </p>
                        </div>
                    </motion.div>
                </div>
            </div>
        </motion.div>
    );
}
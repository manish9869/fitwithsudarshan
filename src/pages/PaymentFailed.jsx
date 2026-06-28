

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate, useLocation } from 'react-router-dom';
import {
    XCircle, AlertTriangle, RefreshCw, Home,
    MessageCircle, ChevronRight, Shield, Phone, Mail,
    Hash, WifiOff, CreditCard, Lock, DollarSign,
} from 'lucide-react';
import CustomCursor from '@/components/CustomCursor';

// ─── Background ───────────────────────────────────────────────────────────────
function Background() {
    return (
        <div className="fixed inset-0 pointer-events-none overflow-hidden">
            <motion.div
                className="absolute rounded-full blur-[160px]"
                style={{
                    width: 650, height: 650,
                    background: 'radial-gradient(circle, rgba(239,68,68,0.1) 0%, transparent 65%)',
                    top: '-15%', left: '50%', transform: 'translateX(-50%)',
                }}
                animate={{ opacity: [0.5, 0.85, 0.5] }}
                transition={{ duration: 7, repeat: Infinity }}
            />
            <div
                className="absolute inset-0"
                style={{
                    backgroundImage: `
                        linear-gradient(rgba(239,68,68,0.025) 1px, transparent 1px),
                        linear-gradient(90deg, rgba(239,68,68,0.025) 1px, transparent 1px)
                    `,
                    backgroundSize: '64px 64px',
                    maskImage: 'radial-gradient(ellipse 80% 50% at 50% 0%, black 0%, transparent 100%)',
                }}
            />
        </div>
    );
}

// ─── Fail icon ────────────────────────────────────────────────────────────────
function FailIcon() {
    return (
        // 320px: w-24 base (96px), rings use inset:-12px/-24px = max 144px — safely within 294px
        <div className="relative flex items-center justify-center w-24 h-24 sm:w-32 sm:h-32 mx-auto mb-6 sm:mb-8">
            {[1, 2].map((i) => (
                <motion.div
                    key={i}
                    className="absolute rounded-full"
                    style={{ inset: `-${i * 12}px`, border: `1px solid rgba(239,68,68,${0.28 - i * 0.1})` }}
                    initial={{ scale: 0.6, opacity: 0 }}
                    animate={{ scale: 1, opacity: [0, 0.5, 0] }}
                    transition={{ duration: 2.5, delay: 0.3 + i * 0.2, repeat: Infinity, repeatDelay: 2.2 }}
                />
            ))}
            <motion.div
                className="relative z-10 w-20 h-20 sm:w-24 sm:h-24 rounded-full flex items-center justify-center"
                style={{
                    background: 'rgba(239,68,68,0.07)',
                    border: '1.5px solid rgba(239,68,68,0.3)',
                    boxShadow: '0 0 60px rgba(239,68,68,0.18)',
                }}
                initial={{ scale: 0, rotate: 15 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ type: 'spring', stiffness: 270, damping: 22, delay: 0.15 }}
            >
                <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.5, type: 'spring', stiffness: 320, damping: 18 }}
                >
                    <XCircle
                        strokeWidth={1.5}
                        className="w-10 h-10 sm:w-12 sm:h-12"
                        style={{ color: '#ef4444', filter: 'drop-shadow(0 0 10px rgba(239,68,68,0.5))' }}
                    />
                </motion.div>
            </motion.div>
        </div>
    );
}

// ─── Error info mapper ────────────────────────────────────────────────────────
function getErrorInfo(message = '') {
    const lower = message.toLowerCase();
    if (lower.includes('declined') || lower.includes('insufficient') || lower.includes('failed'))
        return { short: 'Transaction Declined', hint: 'Your bank declined the transaction. This may be due to insufficient funds, a card limit, or a security block.' };
    if (lower.includes('network') || lower.includes('connection'))
        return { short: 'Network Issue', hint: 'Your connection dropped during checkout. No charge was made. Ensure a stable connection and retry.' };
    if (lower.includes('gateway'))
        return { short: 'Gateway Error', hint: 'The payment gateway encountered a temporary issue. Please try again in a moment.' };
    if (lower.includes('server'))
        return { short: 'Server Error', hint: 'Our servers encountered an issue. Please try again in a few minutes.' };
    return { short: 'Payment Unsuccessful', hint: 'The payment could not be completed. No charge has been made. You can safely try again.' };
}

// ─── Reason card ──────────────────────────────────────────────────────────────
function ReasonCard({ icon: Icon, label, hint, color }) {
    return (
        <div
            className="rounded-2xl p-3 sm:p-4 transition-all hover:scale-[1.02]"
            style={{ background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.06)' }}
        >
            <div className="flex items-center gap-2 mb-2">
                <div
                    className="w-6 h-6 sm:w-7 sm:h-7 rounded-lg flex items-center justify-center flex-shrink-0"
                    style={{ background: `rgba(${color},0.1)`, border: `1px solid rgba(${color},0.18)` }}
                >
                    <Icon className="w-3 h-3 sm:w-3.5 sm:h-3.5" style={{ color: `rgb(${color})` }} />
                </div>
                <p className="text-[11px] sm:text-xs font-bold text-white/60 leading-tight">{label}</p>
            </div>
            <p className="text-[10px] sm:text-[11px] text-white/40 leading-relaxed">{hint}</p>
        </div>
    );
}

// ─── Main ─────────────────────────────────────────────────────────────────────
export default function PaymentFailed() {
    const navigate = useNavigate();
    const location = useLocation();
    const { errorMessage = '', partialEnrollment = null } = location.state || {};
    const [entered, setEntered] = useState(false);

    useEffect(() => {
        const t = setTimeout(() => setEntered(true), 60);
        return () => clearTimeout(t);
    }, []);

    const errorInfo = getErrorInfo(errorMessage);
    const raw = errorMessage || 'Payment could not be completed.';

    return (

        // overflow-x-hidden prevents any inline element from causing horizontal scroll/left-shift
        <motion.div
            className="min-h-screen text-white overflow-x-hidden"
            style={{ background: '#070707' }}
            initial={{ opacity: 0 }}
            animate={{ opacity: entered ? 1 : 0 }}
            transition={{ duration: 0.4 }}
        >
            <Background />
            <CustomCursor />
            {/* ── Navbar ── */}
            <div
                className="relative z-20 sticky top-0 backdrop-blur-2xl"
                style={{ background: 'rgba(7,7,7,0.9)', borderBottom: '1px solid rgba(255,255,255,0.04)' }}
            >
                {/* 320px: px-3 base so logo+badge don't clip */}
                <div className="container mx-auto px-3 sm:px-6 py-3 flex items-center justify-between max-w-5xl">
                    <div className="flex items-center gap-2">
                        <img
                            src="https://vducmiggraxtqdgt.public.blob.vercel-storage.com/Black-bg%20Logo.jpeg"
                            alt="FitWithSudarshan"
                            className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg object-cover flex-shrink-0"
                            style={{ border: '1px solid rgba(239,68,68,0.25)' }}
                        />
                        <span className="text-xs sm:text-sm font-bold text-white/85">
                            FitWith<span style={{ color: '#e71763' }}>Sudarshan</span>
                        </span>
                    </div>
                    {/* Badge: flex wrapper so it never overflows as inline-flex */}
                    <div
                        className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-full text-[10px] sm:text-xs font-bold flex-shrink-0"
                        style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.18)', color: '#f87171' }}
                    >
                        <AlertTriangle className="w-3 h-3 flex-shrink-0" />
                        <span className="whitespace-nowrap">Payment Failed</span>
                    </div>
                </div>
            </div>

            {/* 320px: px-3 base, py-8 base (was py-14 — too much vertical space on mobile) */}
            <div className="relative z-10 container mx-auto px-3 sm:px-4 py-8 sm:py-14 max-w-2xl">

                {/* ── Hero ── */}
                <motion.div
                    className="text-center mb-8 sm:mb-10"
                    initial={{ opacity: 0, y: 32 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.65, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
                >
                    <FailIcon />

                    {/* Error badge — flex justify-center wrapper, not inline-flex, prevents left-shift */}
                    <div className="flex justify-center mb-4 sm:mb-5">
                        <div
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] sm:text-[11px] font-black uppercase tracking-[0.1em] sm:tracking-[0.16em]"
                            style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.18)', color: '#f87171' }}
                        >
                            <AlertTriangle className="w-3 h-3 flex-shrink-0" />
                            {errorInfo.short}
                        </div>
                    </div>

                    {/* 320px: text-3xl base (was text-4xl — "Payment Unsuccessful" overflows) */}
                    <h1 className="text-3xl sm:text-4xl md:text-5xl font-black mb-3 sm:mb-4 leading-tight tracking-tight">
                        Payment{' '}
                        <span style={{ color: '#ef4444', textShadow: '0 0 50px rgba(239,68,68,0.32)' }}>Unsuccessful</span>
                    </h1>
                    <p className="text-white/35 max-w-xs mx-auto text-xs sm:text-sm leading-relaxed px-2">
                        {errorInfo.hint}
                    </p>
                </motion.div>

                {/* ── No charge notice ── */}
                <motion.div
                    initial={{ opacity: 0, y: 14 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.45, delay: 0.4 }}
                    className="flex items-start gap-2.5 sm:gap-3 px-3 sm:px-5 py-3.5 sm:py-4 rounded-2xl mb-4"
                    style={{ background: 'rgba(34,197,94,0.05)', border: '1px solid rgba(34,197,94,0.12)' }}
                >
                    <Shield className="w-4 h-4 flex-shrink-0 mt-0.5" style={{ color: '#22c55e' }} />
                    <p className="text-xs text-white/38 leading-relaxed">
                        <span className="text-white/65 font-bold">No charge was made.</span>{' '}
                        Your bank account or card has not been debited. You can safely retry.
                    </p>
                </motion.div>

                {/* ── Error detail ── */}
                <motion.div
                    initial={{ opacity: 0, y: 18 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.48 }}
                    className="rounded-2xl sm:rounded-3xl p-4 sm:p-6 mb-5"
                    style={{ background: 'rgba(239,68,68,0.04)', border: '1px solid rgba(239,68,68,0.13)' }}
                >
                    <div className="flex items-start gap-3 sm:gap-4">
                        <div
                            className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5"
                            style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.18)' }}
                        >
                            <AlertTriangle className="w-3.5 h-3.5 sm:w-4 sm:h-4" style={{ color: '#f87171' }} />
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-[10px] font-black uppercase tracking-wide text-white/25 mb-1.5">Error Details</p>
                            <p className="text-xs sm:text-sm text-white/55 leading-relaxed break-words">{raw}</p>
                        </div>
                    </div>

                    {partialEnrollment?.enrollmentId && (
                        <div
                            className="flex items-center gap-2 mt-4 pt-4"
                            style={{ borderTop: '1px solid rgba(239,68,68,0.09)' }}
                        >
                            <Hash className="w-3.5 h-3.5 text-white/18 flex-shrink-0" />
                            <span className="text-xs text-white/22 flex-shrink-0">Order ref:</span>
                            {/* truncate so long IDs don't overflow at 320px */}
                            <span className="text-xs font-mono text-white/38 truncate">{partialEnrollment.enrollmentId}</span>
                        </div>
                    )}
                </motion.div>

                {/* ── Action buttons ── */}
                <motion.div
                    initial={{ opacity: 0, y: 18 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.6 }}
                    className="space-y-2.5 sm:space-y-3 mb-8 sm:mb-10"
                >
                    {/* Retry */}
                    <motion.button
                        whileHover={{ scale: 1.015, boxShadow: '0 0 44px rgba(231,23,99,0.48)' }}
                        whileTap={{ scale: 0.97 }}
                        onClick={() => navigate(-1)}
                        className="w-full flex items-center gap-2 sm:gap-3 px-4 sm:px-6 py-3.5 sm:py-4 rounded-2xl font-bold text-xs sm:text-sm text-white relative overflow-hidden"
                        style={{ background: 'linear-gradient(135deg, #e71763 0%, #c4134f 100%)', boxShadow: '0 0 28px rgba(231,23,99,0.28)' }}
                    >
                        <motion.div
                            className="absolute inset-0 pointer-events-none"
                            style={{ background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.09), transparent)' }}
                            animate={{ x: ['-100%', '200%'] }}
                            transition={{ duration: 2.2, repeat: Infinity, repeatDelay: 0.8 }}
                        />
                        <RefreshCw className="w-3.5 h-3.5 sm:w-4 sm:h-4 flex-shrink-0 relative z-10" />
                        <span className="relative z-10">Try Payment Again</span>
                        <ChevronRight className="w-3.5 h-3.5 sm:w-4 sm:h-4 ml-auto relative z-10 opacity-70 flex-shrink-0" />
                    </motion.button>

                    {/* WhatsApp */}
                    <motion.a
                        whileHover={{ scale: 1.015 }}
                        whileTap={{ scale: 0.97 }}
                        href="https://wa.me/919619708124"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-full flex items-center gap-2 sm:gap-3 px-4 sm:px-6 py-3.5 sm:py-4 rounded-2xl font-bold text-xs sm:text-sm text-white"
                        style={{ background: 'rgba(37,211,102,0.08)', border: '1px solid rgba(37,211,102,0.18)' }}
                    >
                        <MessageCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4 flex-shrink-0" style={{ color: '#25D366' }} />
                        <span className="truncate">Contact Support on WhatsApp</span>
                        <ChevronRight className="w-3.5 h-3.5 sm:w-4 sm:h-4 ml-auto text-white/22 flex-shrink-0" />
                    </motion.a>

                    {/* Home */}
                    <motion.button
                        whileHover={{ scale: 1.015 }}
                        whileTap={{ scale: 0.97 }}
                        onClick={() => navigate('/')}
                        className="w-full flex items-center gap-2 sm:gap-3 px-4 sm:px-6 py-3.5 sm:py-4 rounded-2xl font-bold text-xs sm:text-sm"
                        style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.4)' }}
                    >
                        <Home className="w-3.5 h-3.5 sm:w-4 sm:h-4 flex-shrink-0" />
                        <span>Back to Home</span>
                        <ChevronRight className="w-3.5 h-3.5 sm:w-4 sm:h-4 ml-auto opacity-25 flex-shrink-0" />
                    </motion.button>
                </motion.div>

                {/* ── Common Reasons ── */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.5, delay: 0.8 }}
                    className="pt-6 sm:pt-8"
                    style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}
                >
                    <p className="text-[10px] sm:text-[11px] font-black uppercase tracking-[0.1em] sm:tracking-[0.18em] text-white/20 mb-4 sm:mb-5 text-center">
                        Common Reasons for Failure
                    </p>
                    {/* 320px: always 2-col but cards are compact with reduced padding */}
                    <div className="grid grid-cols-2 gap-2 sm:gap-3">
                        <ReasonCard icon={CreditCard} label="Card Declined" hint="Your bank blocked the transaction. Call your bank to allow it." color="239,68,68" />
                        <ReasonCard icon={WifiOff} label="Network Issue" hint="Switch to a stable connection and retry." color="251,191,36" />
                        <ReasonCard icon={DollarSign} label="Insufficient Funds" hint="Check your available balance before retrying." color="96,165,250" />
                        <ReasonCard icon={Lock} label="Card Limit Reached" hint="Use a different card, net banking, or UPI." color="52,211,153" />
                    </div>
                </motion.div>

                {/* ── Support ── */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.5, delay: 0.95 }}
                    className="mt-6 sm:mt-8 p-4 sm:p-5 rounded-2xl"
                    style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.055)' }}
                >
                    <p className="text-[10px] font-black uppercase tracking-[0.1em] text-white/22 mb-3 sm:mb-4 text-center">
                        Direct Support
                    </p>
                    {/* 320px: always column stack — email is too long (~36ch) for a flex row at this width */}
                    <div className="flex flex-col items-center gap-3">
                        <a
                            href="mailto:Fitwithsudarshanofficial@gmail.com"
                            className="flex items-center gap-2 text-xs text-white/35 hover:text-white/55 transition-colors min-w-0"
                        >
                            <Mail className="w-3.5 h-3.5 flex-shrink-0" style={{ color: '#e71763' }} />
                            <span className="truncate">Fitwithsudarshanofficial@gmail.com</span>
                        </a>
                        <div className="w-16 h-px" style={{ background: 'rgba(255,255,255,0.08)' }} />
                        <a
                            href="https://wa.me/919619708124"
                            className="flex items-center gap-2 text-xs text-white/35 hover:text-white/55 transition-colors"
                        >
                            <Phone className="w-3.5 h-3.5 flex-shrink-0" style={{ color: '#e71763' }} />
                            +91 96197 08124
                        </a>
                    </div>
                </motion.div>
            </div>

            {/* Footer */}
            <div className="relative z-10 border-t mt-8 sm:mt-12" style={{ borderColor: 'rgba(255,255,255,0.04)' }}>
                {/* 320px: px-3 base, always column stack */}
                <div className="container mx-auto px-3 sm:px-6 py-5 sm:py-6 max-w-5xl flex flex-col items-center gap-2 text-center">
                    <span className="text-[10px] sm:text-xs text-white/18">© 2024 FitWithSudarshan — RECODE™ Program</span>
                    <span className="text-[10px] sm:text-xs text-white/14">Payments powered by Razorpay · PCI-DSS Compliant</span>
                </div>
            </div>
        </motion.div>
    );
}
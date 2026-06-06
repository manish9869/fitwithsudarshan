/**
 * PaymentFailed.jsx
 * Dedicated payment failure page — shown when Razorpay reports a failed payment.
 * Receives error details via React Router state: { errorMessage, enrollment (partial) }
 */

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate, useLocation } from 'react-router-dom';
import {
    XCircle, AlertTriangle, RefreshCw, Home,
    MessageCircle, ChevronRight, Shield, Phone, Mail,
    ArrowLeft, Hash,
} from 'lucide-react';
import CustomCursor from '../components/CustomCursor';

// ─── Background ───────────────────────────────────────────────────────────────
function Background() {
    return (
        <div className="fixed inset-0 pointer-events-none overflow-hidden">
            <motion.div
                className="absolute rounded-full blur-[160px]"
                style={{
                    width: 600, height: 600,
                    background: 'radial-gradient(circle, rgba(239,68,68,0.12) 0%, transparent 70%)',
                    top: '-10%', left: '50%', transform: 'translateX(-50%)',
                }}
                animate={{ opacity: [0.6, 1, 0.6] }}
                transition={{ duration: 6, repeat: Infinity }}
            />
            <div
                className="absolute inset-0"
                style={{
                    backgroundImage: `
                        linear-gradient(rgba(239,68,68,0.03) 1px, transparent 1px),
                        linear-gradient(90deg, rgba(239,68,68,0.03) 1px, transparent 1px)
                    `,
                    backgroundSize: '60px 60px',
                    maskImage: 'radial-gradient(ellipse at center, black 0%, transparent 70%)',
                }}
            />
        </div>
    );
}

// ─── Failure icon ─────────────────────────────────────────────────────────────
function FailIcon() {
    return (
        <div className="relative flex items-center justify-center w-36 h-36 mx-auto mb-10">
            {[1, 2].map((i) => (
                <motion.div
                    key={i}
                    className="absolute rounded-full"
                    style={{
                        inset: `-${i * 14}px`,
                        border: `1px solid rgba(239,68,68,${0.3 - i * 0.1})`,
                    }}
                    initial={{ scale: 0.5, opacity: 0 }}
                    animate={{ scale: 1, opacity: [0, 0.5, 0] }}
                    transition={{
                        duration: 2.4,
                        delay: 0.3 + i * 0.2,
                        repeat: Infinity,
                        repeatDelay: 2,
                    }}
                />
            ))}
            <motion.div
                className="relative z-10 w-28 h-28 rounded-full flex items-center justify-center"
                style={{
                    background: 'rgba(239,68,68,0.08)',
                    border: '1.5px solid rgba(239,68,68,0.35)',
                    boxShadow: '0 0 60px rgba(239,68,68,0.2)',
                }}
                initial={{ scale: 0, rotate: 20 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ type: 'spring', stiffness: 260, damping: 22, delay: 0.15 }}
            >
                <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.5, type: 'spring', stiffness: 300, damping: 18 }}
                >
                    <XCircle
                        strokeWidth={1.5}
                        className="w-14 h-14"
                        style={{ color: '#ef4444', filter: 'drop-shadow(0 0 10px rgba(239,68,68,0.5))' }}
                    />
                </motion.div>
            </motion.div>
        </div>
    );
}

// ─── Reason mapper ────────────────────────────────────────────────────────────
const ERROR_HINTS = {
    'payment_failed': { short: 'Transaction Declined', hint: 'Your bank declined the transaction. This could be due to insufficient funds, a card limit, or a security block.' },
    'bad_request_error': { short: 'Invalid Request', hint: 'There was an issue with the payment request. Please try again or use a different payment method.' },
    'gateway_error': { short: 'Gateway Error', hint: 'The payment gateway encountered an error. This is usually temporary — please try again in a moment.' },
    'network_error': { short: 'Network Issue', hint: 'Your connection dropped during checkout. No charge was made. Please retry.' },
    'server_error': { short: 'Server Error', hint: 'Our servers encountered an issue. Please try again in a few minutes.' },
    default: { short: 'Payment Unsuccessful', hint: 'The payment could not be completed. No charge has been made to your account. You can safely try again.' },
};

function getErrorInfo(message = '') {
    const lower = message.toLowerCase();
    if (lower.includes('declined') || lower.includes('insufficient') || lower.includes('failed'))
        return ERROR_HINTS.payment_failed;
    if (lower.includes('network') || lower.includes('connection'))
        return ERROR_HINTS.network_error;
    if (lower.includes('gateway'))
        return ERROR_HINTS.gateway_error;
    if (lower.includes('server'))
        return ERROR_HINTS.server_error;
    return ERROR_HINTS.default;
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
        <motion.div
            className="min-h-screen text-white"
            style={{ background: '#080808' }}
            initial={{ opacity: 0 }}
            animate={{ opacity: entered ? 1 : 0 }}
            transition={{ duration: 0.4 }}
        >
            <CustomCursor />
            <Background />

            {/* ── Nav ─────────────────────────────────────────────────────────── */}
            <div
                className="relative z-20 sticky top-0 backdrop-blur-2xl"
                style={{ background: 'rgba(8,8,8,0.85)', borderBottom: '1px solid rgba(255,255,255,0.05)' }}
            >
                <div className="container mx-auto px-6 py-3.5 flex items-center justify-between max-w-5xl">
                    <div className="flex items-center gap-2.5">
                        <div
                            className="w-6 h-6 rounded-full flex items-center justify-center"
                            style={{ background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.3)' }}
                        >
                            <XCircle className="w-3.5 h-3.5" style={{ color: '#ef4444' }} />
                        </div>
                        <span className="text-sm font-bold text-white/90">FitWith<span style={{ color: '#e71763' }}>Sudarshan</span></span>
                    </div>
                    <div
                        className="flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold"
                        style={{
                            background: 'rgba(239,68,68,0.08)',
                            border: '1px solid rgba(239,68,68,0.2)',
                            color: '#f87171',
                        }}
                    >
                        <AlertTriangle className="w-3 h-3" />
                        Payment Failed
                    </div>
                </div>
            </div>

            <div className="relative z-10 container mx-auto px-4 py-16 max-w-2xl">

                {/* Hero */}
                <motion.div
                    className="text-center mb-12"
                    initial={{ opacity: 0, y: 36 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.65, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
                >
                    <FailIcon />

                    <div
                        className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-[0.15em] mb-5"
                        style={{
                            background: 'rgba(239,68,68,0.08)',
                            border: '1px solid rgba(239,68,68,0.2)',
                            color: '#f87171',
                        }}
                    >
                        <AlertTriangle className="w-3 h-3" />
                        {errorInfo.short}
                    </div>

                    <h1
                        className="text-4xl md:text-5xl font-black mb-4 leading-tight tracking-tight"
                    >
                        Payment{' '}
                        <span style={{ color: '#ef4444', textShadow: '0 0 50px rgba(239,68,68,0.35)' }}>
                            Unsuccessful
                        </span>
                    </h1>

                    <p className="text-white/40 max-w-sm mx-auto text-sm leading-relaxed">
                        {errorInfo.hint}
                    </p>
                </motion.div>

                {/* Error detail card */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.45 }}
                    className="rounded-3xl p-6 mb-5"
                    style={{
                        background: 'rgba(239,68,68,0.05)',
                        border: '1px solid rgba(239,68,68,0.15)',
                    }}
                >
                    <div className="flex items-start gap-4">
                        <div
                            className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5"
                            style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)' }}
                        >
                            <AlertTriangle className="w-4 h-4" style={{ color: '#f87171' }} />
                        </div>
                        <div>
                            <p className="text-xs font-black uppercase tracking-widest text-white/30 mb-1.5">Error Details</p>
                            <p className="text-sm text-white/65 leading-relaxed">{raw}</p>
                        </div>
                    </div>

                    {partialEnrollment?.enrollmentId && (
                        <div
                            className="flex items-center gap-2 mt-4 pt-4"
                            style={{ borderTop: '1px solid rgba(239,68,68,0.1)' }}
                        >
                            <Hash className="w-3.5 h-3.5 text-white/20" />
                            <span className="text-xs text-white/25">Order ref:</span>
                            <span className="text-xs font-mono text-white/40">{partialEnrollment.enrollmentId}</span>
                        </div>
                    )}
                </motion.div>

                {/* No charge notice */}
                <motion.div
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.45, delay: 0.55 }}
                    className="flex items-center gap-3 px-5 py-4 rounded-2xl mb-8"
                    style={{
                        background: 'rgba(34,197,94,0.05)',
                        border: '1px solid rgba(34,197,94,0.12)',
                    }}
                >
                    <Shield className="w-4 h-4 flex-shrink-0" style={{ color: '#22c55e' }} />
                    <p className="text-xs text-white/40 leading-relaxed">
                        <span className="text-white/70 font-semibold">No charge was made.</span>{' '}
                        Your bank account or card has not been debited. You can safely retry.
                    </p>
                </motion.div>

                {/* Action buttons */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.65 }}
                    className="space-y-3"
                >
                    {/* Retry — primary CTA */}
                    <motion.button
                        whileHover={{ scale: 1.015, boxShadow: '0 0 40px rgba(231,23,99,0.45)' }}
                        whileTap={{ scale: 0.97 }}
                        onClick={() => navigate(-1)}
                        className="w-full flex items-center gap-3 px-6 py-4 rounded-2xl font-bold text-sm text-white relative overflow-hidden"
                        style={{ background: '#e71763', boxShadow: '0 0 28px rgba(231,23,99,0.3)' }}
                    >
                        <motion.div
                            className="absolute inset-0"
                            style={{ background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.08), transparent)' }}
                            animate={{ x: ['-100%', '200%'] }}
                            transition={{ duration: 2.2, repeat: Infinity, repeatDelay: 0.8 }}
                        />
                        <RefreshCw className="w-4 h-4 flex-shrink-0 relative z-10" />
                        <span className="relative z-10">Try Payment Again</span>
                        <ChevronRight className="w-4 h-4 ml-auto relative z-10" />
                    </motion.button>

                    {/* WhatsApp support */}
                    <motion.a
                        whileHover={{ scale: 1.015 }}
                        whileTap={{ scale: 0.97 }}
                        href="https://wa.me/919619708124"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-full flex items-center gap-3 px-6 py-4 rounded-2xl font-bold text-sm text-white"
                        style={{
                            background: 'rgba(37,211,102,0.08)',
                            border: '1px solid rgba(37,211,102,0.2)',
                        }}
                    >
                        <MessageCircle className="w-4 h-4 flex-shrink-0" style={{ color: '#25D366' }} />
                        <span>Contact Support on WhatsApp</span>
                        <ChevronRight className="w-4 h-4 ml-auto text-white/25" />
                    </motion.a>

                    {/* Home */}
                    <motion.button
                        whileHover={{ scale: 1.015 }}
                        whileTap={{ scale: 0.97 }}
                        onClick={() => navigate('/')}
                        className="w-full flex items-center gap-3 px-6 py-4 rounded-2xl font-bold text-sm"
                        style={{
                            background: 'rgba(255,255,255,0.03)',
                            border: '1px solid rgba(255,255,255,0.07)',
                            color: 'rgba(255,255,255,0.45)',
                        }}
                    >
                        <Home className="w-4 h-4 flex-shrink-0" />
                        <span>Go to Home</span>
                        <ChevronRight className="w-4 h-4 ml-auto opacity-30" />
                    </motion.button>
                </motion.div>

                {/* Common reasons */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.5, delay: 0.85 }}
                    className="mt-12 pt-8"
                    style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}
                >
                    <p className="text-xs font-black uppercase tracking-[0.15em] text-white/20 mb-5 text-center">
                        Common Reasons
                    </p>
                    <div className="grid grid-cols-2 gap-3">
                        {[
                            { icon: '💳', label: 'Card declined by bank', hint: 'Contact your bank to allow the transaction.' },
                            { icon: '📶', label: 'Poor network', hint: 'Ensure a stable connection and retry.' },
                            { icon: '💰', label: 'Insufficient funds', hint: 'Check your balance before retrying.' },
                            { icon: '🔒', label: 'Card limit reached', hint: 'Use a different card or UPI.' },
                        ].map(({ icon, label, hint }) => (
                            <div
                                key={label}
                                className="rounded-2xl p-4"
                                style={{
                                    background: 'rgba(255,255,255,0.025)',
                                    border: '1px solid rgba(255,255,255,0.06)',
                                }}
                            >
                                <span className="text-lg mb-2 block">{icon}</span>
                                <p className="text-xs font-bold text-white/60 mb-1">{label}</p>
                                <p className="text-[11px] text-white/30 leading-relaxed">{hint}</p>
                            </div>
                        ))}
                    </div>
                </motion.div>

            </div>
        </motion.div>
    );
}
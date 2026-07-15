/**
 * src/pages/admin/EmailSendMenu.jsx
 *
 * Reusable "Send Email" dropdown for enrollment records. Lets the admin pick
 * exactly which template to fire (confirmation, welcome, payment reminder,
 * payment failed, or the coach alert) instead of a single hardcoded email.
 *
 * Used in both AdminEnrollments.jsx (table row + detail drawer) and
 * AdminManualEnrollment.jsx (table row).
 */
import { useState, useRef, useEffect } from 'react';
import { Mail, ChevronDown, Loader2, Check, Send } from 'lucide-react';

export const ENROLLMENT_EMAIL_OPTIONS = [
    { value: 'enrollment_customer', label: 'Enrollment Confirmation', recipient: 'customer' },
    { value: 'welcome', label: 'Welcome / Onboarding', recipient: 'customer' },
    { value: 'payment_reminder', label: 'Payment Reminder', recipient: 'customer' },
    { value: 'payment_failed', label: 'Payment Failed Notice', recipient: 'customer' },
    { value: 'enrollment_coach', label: 'New Enrollment Alert', recipient: 'coach' },
];

/**
 * @param {boolean} hasCustomerEmail - disables customer-facing templates if false
 * @param {(template: string) => Promise<any>} onSend - called with the chosen template value
 * @param {boolean} compact - icon-only trigger (for dense table rows) vs labeled button
 */
export default function EmailSendMenu({ hasCustomerEmail, onSend, compact = false }) {
    const [open, setOpen] = useState(false);
    const [sendingKey, setSendingKey] = useState(null);
    const [sentKey, setSentKey] = useState(null);
    const ref = useRef(null);

    useEffect(() => {
        if (!open) return;
        const h = (e) => {
            if (ref.current && !ref.current.contains(e.target)) setOpen(false);
        };
        document.addEventListener('mousedown', h);
        return () => document.removeEventListener('mousedown', h);
    }, [open]);

    const handleSend = async (opt) => {
        if (opt.recipient === 'customer' && !hasCustomerEmail) return;
        setSendingKey(opt.value);
        try {
            await onSend(opt.value);
            setSentKey(opt.value);
            setTimeout(() => setSentKey(null), 1800);
        } finally {
            setSendingKey(null);
            setOpen(false);
        }
    };

    return (
        <div className="relative" ref={ref}>
            <button
                type="button"
                onClick={() => setOpen((o) => !o)}
                title="Send email"
                className={
                    compact
                        ? 'w-7 h-7 rounded-lg flex items-center justify-center text-white/35 hover:text-white hover:bg-white/8 transition-all'
                        : 'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-bold transition-all'
                }
                style={
                    compact
                        ? {}
                        : {
                            background: 'rgba(37,211,102,0.1)',
                            border: '1px solid rgba(37,211,102,0.25)',
                            color: '#25D366',
                        }
                }
            >
                <Mail className="w-3.5 h-3.5" />
                {!compact && <span>Send Email</span>}
                {!compact && (
                    <ChevronDown
                        className="w-3 h-3 opacity-60 transition-transform"
                        style={{ transform: open ? 'rotate(180deg)' : 'rotate(0deg)' }}
                    />
                )}
            </button>

            {open && (
                <div
                    className="absolute right-0 top-full mt-2 z-50 w-64 rounded-2xl p-1.5"
                    style={{
                        background: '#0e0e16',
                        border: '1px solid rgba(255,255,255,0.1)',
                        boxShadow: '0 20px 50px rgba(0,0,0,0.5)',
                    }}
                >
                    <p className="px-3 pt-2 pb-1.5 text-[9px] font-black uppercase tracking-widest text-white/25">
                        Choose Template
                    </p>

                    {ENROLLMENT_EMAIL_OPTIONS.map((opt) => {
                        const disabled = opt.recipient === 'customer' && !hasCustomerEmail;
                        const busy = sendingKey === opt.value;
                        const done = sentKey === opt.value;

                        return (
                            <button
                                key={opt.value}
                                type="button"
                                disabled={disabled || busy}
                                onClick={() => handleSend(opt)}
                                className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs text-left transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                                style={{ color: done ? '#34d399' : 'rgba(255,255,255,0.75)' }}
                                onMouseEnter={(e) => {
                                    if (!disabled) e.currentTarget.style.background = 'rgba(255,255,255,0.05)';
                                }}
                                onMouseLeave={(e) => {
                                    e.currentTarget.style.background = 'transparent';
                                }}
                            >
                                {busy ? (
                                    <Loader2 className="w-3.5 h-3.5 animate-spin flex-shrink-0" />
                                ) : done ? (
                                    <Check className="w-3.5 h-3.5 flex-shrink-0" style={{ color: '#34d399' }} />
                                ) : (
                                    <Send className="w-3.5 h-3.5 flex-shrink-0 opacity-50" />
                                )}
                                <span className="flex-1">{opt.label}</span>
                                <span
                                    className="text-[9px] uppercase tracking-wide flex-shrink-0 px-1.5 py-0.5 rounded"
                                    style={{
                                        background: opt.recipient === 'coach' ? 'rgba(96,165,250,0.12)' : 'rgba(255,255,255,0.06)',
                                        color: opt.recipient === 'coach' ? '#60a5fa' : 'rgba(255,255,255,0.35)',
                                    }}
                                >
                                    {opt.recipient}
                                </span>
                            </button>
                        );
                    })}

                    {!hasCustomerEmail && (
                        <p className="px-3 pt-1.5 pb-1 text-[10px] text-white/25 leading-relaxed">
                            No customer email on file — customer templates disabled.
                        </p>
                    )}
                </div>
            )}
        </div>
    );
}
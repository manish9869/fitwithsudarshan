/**
 * src/pages/admin/EmailSendMenu.jsx
 *
 * Reusable "Send Email" dropdown for enrollment records.
 *
 * FIX: table wrappers use `overflow-hidden` for rounded corners, which was
 * clipping the dropdown whenever it opened near the bottom of a short table
 * (e.g. few records — this is what was happening in Manual Enrollment).
 * The menu is now rendered via a portal into document.body with `position:
 * fixed` coordinates computed from the button's bounding rect, and flips
 * upward automatically if there isn't room below.
 */
import { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Mail, ChevronDown, Loader2, Check, Send } from 'lucide-react';

export const ENROLLMENT_EMAIL_OPTIONS = [
    { value: 'enrollment_customer', label: 'Enrollment Confirmation', recipient: 'customer' },
    { value: 'welcome', label: 'Welcome / Onboarding', recipient: 'customer' },
    { value: 'payment_reminder', label: 'Payment Reminder', recipient: 'customer' },
    { value: 'payment_failed', label: 'Payment Failed Notice', recipient: 'customer' },
    { value: 'enrollment_coach', label: 'New Enrollment Alert', recipient: 'coach' },
];

const MENU_WIDTH = 256; // w-64
const MENU_HEIGHT_EST = 290;

export default function EmailSendMenu({ hasCustomerEmail, onSend, compact = false }) {
    const [open, setOpen] = useState(false);
    const [pos, setPos] = useState({ top: 0, left: 0, openUp: false });
    const [sendingKey, setSendingKey] = useState(null);
    const [sentKey, setSentKey] = useState(null);

    const btnRef = useRef(null);
    const menuRef = useRef(null);

    const computePosition = () => {
        if (!btnRef.current) return;
        const rect = btnRef.current.getBoundingClientRect();
        const spaceBelow = window.innerHeight - rect.bottom;
        const openUp = spaceBelow < MENU_HEIGHT_EST && rect.top > MENU_HEIGHT_EST;

        let left = rect.right - MENU_WIDTH;
        left = Math.max(8, Math.min(left, window.innerWidth - MENU_WIDTH - 8));

        setPos({
            top: openUp ? rect.top - 8 : rect.bottom + 8,
            left,
            openUp,
        });
    };

    useEffect(() => {
        if (!open) return;

        computePosition();

        const handleClickOutside = (e) => {
            if (
                btnRef.current && !btnRef.current.contains(e.target) &&
                menuRef.current && !menuRef.current.contains(e.target)
            ) {
                setOpen(false);
            }
        };

        // Close on scroll/resize rather than re-tracking position — simplest
        // way to avoid a stale floating menu.
        const handleScrollOrResize = () => setOpen(false);

        document.addEventListener('mousedown', handleClickOutside);
        window.addEventListener('scroll', handleScrollOrResize, true);
        window.addEventListener('resize', handleScrollOrResize);

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
            window.removeEventListener('scroll', handleScrollOrResize, true);
            window.removeEventListener('resize', handleScrollOrResize);
        };
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
        <>
            <button
                ref={btnRef}
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

            {open &&
                createPortal(
                    <div
                        ref={menuRef}
                        className="fixed w-64 rounded-2xl p-1.5"
                        style={{
                            zIndex: 9999,
                            top: pos.openUp ? undefined : pos.top,
                            bottom: pos.openUp ? window.innerHeight - pos.top : undefined,
                            left: pos.left,
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
                                            background:
                                                opt.recipient === 'coach'
                                                    ? 'rgba(96,165,250,0.12)'
                                                    : 'rgba(255,255,255,0.06)',
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
                    </div>,
                    document.body
                )}
        </>
    );
}
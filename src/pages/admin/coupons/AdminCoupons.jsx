import { useState, useEffect, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Plus, Trash2, Edit2, X, Loader2, Tag, Search, Eye,
    Percent, IndianRupee, Layers, CheckCircle2, Copy, Check, AlertCircle, AlertTriangle, TrendingUp, Sparkles,
    ChevronDown,
} from 'lucide-react';
import { fetchCoupons, createCouponAdmin, updateCouponAdmin, deleteCouponAdmin } from '../adminApi';
import { useToast } from '../ToastProvider';
import { useSiteData } from '@/contexts/SiteDataContext';
const PLAN_TYPES = [
    { id: 'individual', label: 'Individual' },
    { id: 'couple', label: 'Couple' },
    { id: 'basic_individual', label: 'Basic (Individual)' },
    { id: 'basic_couple', label: 'Basic (Couple)' },
];

const TYPE_META = {
    PERCENT: { label: 'Percent off', icon: Percent, color: '#60a5fa' },
    FLAT: { label: 'Flat amount off', icon: IndianRupee, color: '#34d399' },
    FIXED_PRICE: { label: 'Fixed price', icon: Layers, color: '#fbbf24' },
};

const DISCOUNT_TYPE_OPTIONS = [
    { value: 'PERCENT', label: 'Percent off' },
    { value: 'FLAT', label: 'Flat ₹ off' },
    { value: 'FIXED_PRICE', label: 'Fixed price override' },
];

function emptyForm() {
    return {
        code: '', label: '', description: '',
        type: 'PERCENT', percent: 10, flat: 0,
        fixed_prices: { individual: {}, couple: {} },
        applicable_coaching_types: [], applicable_plan_types: [], applicable_durations: [],
        max_uses: '', expires_at: '', active: true,
    };
}

function fmtCurrency(n) {
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n || 0);
}

function fmtDate(iso) {
    if (!iso) return '—';
    return new Intl.DateTimeFormat('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }).format(new Date(iso));
}

function isExpired(c) {
    return c.expires_at && new Date(c.expires_at) < new Date();
}
function isExhausted(c) {
    return c.max_uses != null && c.used_count >= c.max_uses;
}
function statusOf(c) {
    if (!c.active) return { label: 'Inactive', color: 'rgba(255,255,255,0.4)', bg: 'rgba(255,255,255,0.05)' };
    if (isExpired(c)) return { label: 'Expired', color: '#f87171', bg: 'rgba(239,68,68,0.1)' };
    if (isExhausted(c)) return { label: 'Exhausted', color: '#fbbf24', bg: 'rgba(251,191,36,0.1)' };
    return { label: 'Active', color: '#34d399', bg: 'rgba(52,211,153,0.1)' };
}

function discountSummary(c) {
    if (c.type === 'PERCENT') return `${c.percent}% off`;
    if (c.type === 'FLAT') return `${fmtCurrency(c.flat)} off`;
    if (c.type === 'FIXED_PRICE') return 'Fixed price';
    return '—';
}

function appliesToEverything(c) {
    return !c.applicable_coaching_types?.length && !c.applicable_plan_types?.length && !c.applicable_durations?.length;
}

// ── Small building blocks ────────────────────────────────────────────────────
function StatCard({ icon: Icon, label, value, accent }) {
    return (
        <div className="rounded-2xl p-4 sm:p-5" style={{ background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.07)' }}>
            <div className="flex items-center gap-2 mb-2">
                <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: `${accent}18` }}>
                    <Icon className="w-3.5 h-3.5" style={{ color: accent }} />
                </div>
                <p className="text-[11px] text-white/35 uppercase tracking-widest">{label}</p>
            </div>
            <p className="text-2xl font-black" style={{ color: accent }}>{value}</p>
        </div>
    );
}

function Chip({ active, onClick, children, color = '#e71763' }) {
    return (
        <button type="button" onClick={onClick}
            className="text-xs px-3 py-1.5 rounded-full font-semibold transition-all"
            style={active
                ? { background: `${color}22`, border: `1px solid ${color}`, color: 'white' }
                : { background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.5)' }}>
            {children}
        </button>
    );
}

function CodeCopy({ code, size = 'sm' }) {
    const [copied, setCopied] = useState(false);
    return (
        <button onClick={(e) => { e.stopPropagation(); navigator.clipboard.writeText(code).catch(() => { }); setCopied(true); setTimeout(() => setCopied(false), 1400); }}
            className={`flex items-center gap-1.5 font-mono font-bold text-white group ${size === 'lg' ? 'text-sm' : 'text-xs'}`}>
            {code}
            {copied ? <Check className="w-3 h-3" style={{ color: '#34d399' }} /> : <Copy className="w-3 h-3 opacity-0 group-hover:opacity-50 transition-opacity" />}
        </button>
    );
}

// ── Theme-matching dropdown (replaces native <select>) ───────────────────────
function ThemedDropdown({ value, onChange, options, placeholder = 'Select', minWidth }) {
    const [open, setOpen] = useState(false);
    const ref = useRef(null);
    const active = options.find((o) => o.value === value) || options[0];

    useEffect(() => {
        if (!open) return;
        const handler = (e) => {
            if (ref.current && !ref.current.contains(e.target)) setOpen(false);
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, [open]);

    return (
        <div ref={ref} className="relative" style={minWidth ? { minWidth } : undefined}>
            <button
                type="button"
                onClick={() => setOpen((o) => !o)}
                className="w-full flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm font-medium transition-all focus:outline-none"
                style={{
                    background: 'rgba(255,255,255,0.05)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    color: 'white',
                    boxShadow: open ? '0 0 0 3px rgba(231,23,99,0.12)' : 'none',
                }}
            >
                <span className="flex-1 text-left truncate">
                    {active?.label || placeholder}
                </span>

                <ChevronDown
                    className="w-3.5 h-3.5 flex-shrink-0 transition-transform"
                    style={{
                        opacity: 0.6,
                        transform: open ? 'rotate(180deg)' : 'rotate(0deg)',
                    }}
                />
            </button>

            <AnimatePresence>
                {open && (
                    <motion.div
                        initial={{ opacity: 0, y: -6, scale: 0.97 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -4, scale: 0.97 }}
                        transition={{ duration: 0.12 }}
                        className="absolute left-0 top-full mt-2 z-[130] rounded-xl overflow-hidden shadow-2xl w-full"
                        style={{
                            background: '#13131f',
                            border: '1px solid rgba(255,255,255,0.12)',
                            boxShadow: '0 8px 32px rgba(0,0,0,0.6)',
                        }}
                    >
                        {options.map((option) => {
                            const isActive = option.value === value;

                            return (
                                <button
                                    type="button"
                                    key={option.value}
                                    onClick={() => {
                                        onChange(option.value);
                                        setOpen(false);
                                    }}
                                    className="w-full flex items-center gap-2.5 px-3 py-2.5 text-xs font-semibold text-left transition-colors"
                                    style={{
                                        background: isActive ? 'rgba(255,255,255,0.06)' : 'transparent',
                                    }}
                                    onMouseEnter={(e) => {
                                        if (!isActive) e.currentTarget.style.background = 'rgba(255,255,255,0.04)';
                                    }}
                                    onMouseLeave={(e) => {
                                        e.currentTarget.style.background = isActive ? 'rgba(255,255,255,0.06)' : 'transparent';
                                    }}
                                >
                                    <span
                                        className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                                        style={{ background: isActive ? '#e71763' : 'rgba(255,255,255,0.25)' }}
                                    />

                                    <span
                                        className="flex-1"
                                        style={{ color: isActive ? '#e71763' : 'rgba(255,255,255,0.65)' }}
                                    >
                                        {option.label}
                                    </span>

                                    {isActive && <Check className="w-3 h-3 flex-shrink-0" style={{ color: '#e71763' }} />}
                                </button>
                            );
                        })}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

// ── Row used inside "Applies To" / "Details" boxes ───────────────────────────
function InfoRow({ label, children, last = false }) {
    return (
        <div
            className="flex items-start justify-between gap-4 py-2.5"
            style={!last ? { borderBottom: '1px solid rgba(255,255,255,0.04)' } : undefined}
        >
            <span className="text-xs text-white/35 flex-shrink-0 w-28">{label}</span>
            <div className="flex-1 flex flex-wrap gap-1.5 justify-end">{children}</div>
        </div>
    );
}

// ── Themed confirm-delete modal (replaces window.confirm) ───────────────────
function ConfirmDeleteModal({ coupon, onCancel, onConfirm, deleting }) {
    return (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4" onClick={!deleting ? onCancel : undefined}>
            <div className="absolute inset-0 bg-black/65 backdrop-blur-sm" />
            <motion.div
                initial={{ opacity: 0, scale: 0.94, y: 8 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.96, y: 4 }}
                transition={{ duration: 0.16 }}
                className="relative w-full max-w-sm rounded-2xl overflow-hidden"
                style={{ background: '#0e0e16', border: '1px solid rgba(239,68,68,0.25)', boxShadow: '0 30px 70px rgba(0,0,0,0.55)' }}
                onClick={(e) => e.stopPropagation()}
            >
                <div className="p-6 text-center">
                    <div
                        className="w-12 h-12 rounded-2xl flex items-center justify-center mx-auto mb-4"
                        style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.25)' }}
                    >
                        <AlertTriangle className="w-5 h-5" style={{ color: '#f87171' }} />
                    </div>

                    <p className="font-bold text-white text-sm mb-1.5">Delete this coupon?</p>
                    <p className="text-xs text-white/40 leading-relaxed">
                        <span className="font-mono font-bold text-white/70">{coupon?.code}</span> will be permanently removed and can no longer be redeemed. This can't be undone.
                    </p>

                    <div className="flex gap-3 mt-5">
                        <button
                            onClick={onCancel}
                            disabled={deleting}
                            className="flex-1 py-2.5 rounded-xl text-sm text-white/50 hover:text-white transition-all disabled:opacity-50"
                            style={{ border: '1px solid rgba(255,255,255,0.08)' }}
                        >
                            Cancel
                        </button>
                        <button
                            onClick={onConfirm}
                            disabled={deleting}
                            className="flex-1 py-2.5 rounded-xl text-sm font-bold text-white flex items-center justify-center gap-2 disabled:opacity-60 transition-all"
                            style={{ background: '#ef4444' }}
                        >
                            {deleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                            {deleting ? 'Deleting…' : 'Delete'}
                        </button>
                    </div>
                </div>
            </motion.div>
        </div>
    );
}

// ── View drawer (read-only) ──────────────────────────────────────────────────
function ViewDrawer({ coupon, onClose, onEdit, onDeleteRequest, coachingTypes }) {
    const status = statusOf(coupon);
    const usagePct = coupon.max_uses ? Math.min(100, Math.round((coupon.used_count / coupon.max_uses) * 100)) : null;
    const allApplicable = appliesToEverything(coupon);

    const row = (label, value) => (
        <div className="flex items-center justify-between py-2.5" style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
            <span className="text-xs text-white/35">{label}</span>
            <span className="text-sm text-white font-medium text-right">{value}</span>
        </div>
    );

    return (
        <div className="fixed inset-0 z-50 flex justify-end" onClick={onClose}>
            <div className="absolute inset-0 bg-black/55 backdrop-blur-sm" />
            <motion.div initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
                transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                className="relative w-full max-w-md h-full overflow-y-auto"
                style={{ background: '#0a0a14', borderLeft: '1px solid rgba(255,255,255,0.08)' }}
                onClick={(e) => e.stopPropagation()}>

                <div className="sticky top-0 z-10 flex items-center justify-between px-5 py-4"
                    style={{ background: 'rgba(10,10,20,0.97)', borderBottom: '1px solid rgba(255,255,255,0.06)', backdropFilter: 'blur(20px)' }}>
                    <div>
                        <CodeCopy code={coupon.code} size="lg" />
                        <p className="text-[11px] text-white/35 mt-0.5">{coupon.label}</p>
                    </div>
                    <div className="flex items-center gap-2">
                        <button onClick={() => onEdit(coupon)}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold"
                            style={{ background: 'rgba(231,23,99,0.1)', border: '1px solid rgba(231,23,99,0.25)', color: '#e71763' }}>
                            <Edit2 className="w-3 h-3" /> Edit
                        </button>
                        <button
                            onClick={() => onDeleteRequest(coupon)}
                            className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors"
                            style={{ color: 'rgba(248,113,113,0.75)' }}
                            onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(239,68,68,0.1)')}
                            onMouseLeave={(e) => (e.currentTarget.style.background = '')}
                            title="Delete coupon"
                        >
                            <Trash2 className="w-3.5 h-3.5" />
                        </button>
                        <button onClick={onClose} className="w-8 h-8 rounded-lg flex items-center justify-center text-white/30 hover:text-white hover:bg-white/5">
                            <X className="w-4 h-4" />
                        </button>
                    </div>
                </div>

                <div className="p-5 space-y-6">
                    <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs font-bold px-3 py-1.5 rounded-full" style={{ background: status.bg, color: status.color }}>
                            {status.label}
                        </span>
                        <span className="text-xs font-bold px-3 py-1.5 rounded-full" style={{ background: `${TYPE_META[coupon.type]?.color}18`, color: TYPE_META[coupon.type]?.color }}>
                            {discountSummary(coupon)}
                        </span>
                        {allApplicable && (
                            <span className="text-xs font-bold px-3 py-1.5 rounded-full flex items-center gap-1.5"
                                style={{ background: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.5)' }}>
                                <Sparkles className="w-3 h-3" /> Site-wide
                            </span>
                        )}
                    </div>

                    {coupon.description && <p className="text-sm text-white/50 leading-relaxed">{coupon.description}</p>}

                    {coupon.max_uses != null && (
                        <div>
                            <div className="flex items-center justify-between mb-1.5">
                                <span className="text-xs text-white/35">Usage</span>
                                <span className="text-xs font-bold text-white">{coupon.used_count} / {coupon.max_uses}</span>
                            </div>
                            <div className="h-2 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.06)' }}>
                                <div className="h-full rounded-full" style={{ width: `${usagePct}%`, background: usagePct >= 100 ? '#f87171' : '#e71763' }} />
                            </div>
                        </div>
                    )}

                    <section>
                        <p className="text-[10px] font-black uppercase tracking-widest mb-2" style={{ color: '#e71763' }}>Details</p>
                        <div className="rounded-xl px-4" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}>
                            {row('Discount type', TYPE_META[coupon.type]?.label)}
                            {coupon.type === 'PERCENT' && row('Percent', `${coupon.percent}%`)}
                            {coupon.type === 'FLAT' && row('Amount off', fmtCurrency(coupon.flat))}
                            {row('Times used', coupon.used_count ?? 0)}
                            {row('Usage limit', coupon.max_uses ?? 'Unlimited')}
                            {row('Expires', fmtDate(coupon.expires_at))}
                            {row('Created', fmtDate(coupon.created_at))}
                        </div>
                    </section>

                    {coupon.type === 'FIXED_PRICE' && (
                        <section>
                            <p className="text-[10px] font-black uppercase tracking-widest mb-2" style={{ color: '#e71763' }}>Fixed prices</p>
                            <div className="space-y-3">
                                {['individual', 'couple'].map((pt) => {
                                    const prices = coupon.fixed_prices?.[pt];
                                    if (!prices || !Object.keys(prices).length) return null;
                                    return (
                                        <div key={pt} className="rounded-xl p-3" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}>
                                            <p className="text-xs text-white/40 mb-2 capitalize">{pt.replace('_', ' ')}</p>
                                            <div className="grid grid-cols-2 gap-2">
                                                {Object.entries(prices).map(([m, p]) => (
                                                    <div key={m} className="flex justify-between text-xs">
                                                        <span className="text-white/35">{m} mo</span>
                                                        <span className="text-white font-bold">{fmtCurrency(p)}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </section>
                    )}

                    {/* ── Applies To — compact rows, no repeated "All ..." blocks ── */}
                    <section>
                        <div className="flex items-center justify-between mb-2">
                            <p className="text-[10px] font-black uppercase tracking-widest" style={{ color: '#e71763' }}>Applies To</p>
                            {allApplicable && (
                                <span className="text-[10px] text-white/25">Everything — no restrictions</span>
                            )}
                        </div>

                        {allApplicable ? (
                            <div
                                className="rounded-xl px-4 py-3 flex items-center gap-2.5"
                                style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}
                            >
                                <Sparkles className="w-3.5 h-3.5 flex-shrink-0" style={{ color: 'rgba(255,255,255,0.35)' }} />
                                <p className="text-xs text-white/45">
                                    This coupon works on <span className="text-white/70 font-medium">any coaching type</span>,{' '}
                                    <span className="text-white/70 font-medium">any plan</span>, and{' '}
                                    <span className="text-white/70 font-medium">any duration</span>.
                                </p>
                            </div>
                        ) : (
                            <div className="rounded-xl px-4" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}>
                                <InfoRow label="Coaching Type">
                                    {coupon.applicable_coaching_types?.length ? (
                                        coupon.applicable_coaching_types.map((id) => (
                                            <span key={id} className="text-[11px] font-semibold px-2 py-0.5 rounded-full" style={{ background: 'rgba(231,23,99,0.1)', color: '#e71763' }}>
                                                {coachingTypes.find((c) => c.id === id)?.shortName || id}
                                            </span>
                                        ))
                                    ) : (
                                        <span className="text-xs text-white/25">Any</span>
                                    )}
                                </InfoRow>
                                <InfoRow label="Plan Type">
                                    {coupon.applicable_plan_types?.length ? (
                                        coupon.applicable_plan_types.map((id) => (
                                            <span key={id} className="text-[11px] font-semibold px-2 py-0.5 rounded-full" style={{ background: 'rgba(96,165,250,0.1)', color: '#60a5fa' }}>
                                                {PLAN_TYPES.find((p) => p.id === id)?.label || id}
                                            </span>
                                        ))
                                    ) : (
                                        <span className="text-xs text-white/25">Any</span>
                                    )}
                                </InfoRow>
                                <InfoRow label="Duration" last>
                                    {coupon.applicable_durations?.length ? (
                                        coupon.applicable_durations.map((m) => (
                                            <span key={m} className="text-[11px] font-semibold px-2 py-0.5 rounded-full" style={{ background: 'rgba(52,211,153,0.1)', color: '#34d399' }}>
                                                {m} Month{m !== '1' ? 's' : ''}
                                            </span>
                                        ))
                                    ) : (
                                        <span className="text-xs text-white/25">Any</span>
                                    )}
                                </InfoRow>
                            </div>
                        )}
                    </section>
                </div>
            </motion.div>
        </div>
    );
}

// ── Edit / create modal ───────────────────────────────────────────────────────
function EditModal({ editing, setEditing, onSave, saving, error, coachingTypes, durations }) {
    const toggleArr = (field, val) => setEditing((f) => ({
        ...f,
        [field]: f[field].includes(val) ? f[field].filter((v) => v !== val) : [...f[field], val],
    }));

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={() => setEditing(null)}>
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
            <motion.div initial={{ opacity: 0, scale: 0.96, y: 10 }} animate={{ opacity: 1, scale: 1, y: 0 }}
                className="relative w-full max-w-lg max-h-[88vh] overflow-y-auto rounded-2xl"
                style={{ background: '#0e0e16', border: '1px solid rgba(255,255,255,0.1)' }}
                onClick={(e) => e.stopPropagation()}>

                <div className="sticky top-0 z-10 flex items-center justify-between px-6 py-4"
                    style={{ background: 'rgba(14,14,22,0.97)', borderBottom: '1px solid rgba(255,255,255,0.06)', backdropFilter: 'blur(20px)' }}>
                    <h3 className="font-black text-white flex items-center gap-2">
                        <Tag className="w-4 h-4" style={{ color: '#e71763' }} />
                        {editing.id ? 'Edit Coupon' : 'New Coupon'}
                    </h3>
                    <button onClick={() => setEditing(null)}><X className="w-4 h-4 text-white/40" /></button>
                </div>

                <div className="p-6 space-y-5">
                    {error && (
                        <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl text-xs" style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', color: '#f87171' }}>
                            <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" /> {error}
                        </div>
                    )}

                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="text-[10px] text-white/35 uppercase tracking-widest mb-1.5 block">Code</label>
                            <input value={editing.code} onChange={(e) => setEditing((f) => ({ ...f, code: e.target.value.toUpperCase() }))}
                                placeholder="RECODE2026" className="w-full rounded-lg px-3 py-2.5 text-sm text-white bg-white/5 border border-white/10 font-mono" />
                        </div>
                        <div>
                            <label className="text-[10px] text-white/35 uppercase tracking-widest mb-1.5 block">Discount type</label>
                            <ThemedDropdown
                                value={editing.type}
                                onChange={(v) => setEditing((f) => ({ ...f, type: v }))}
                                options={DISCOUNT_TYPE_OPTIONS}
                            />
                        </div>
                    </div>

                    <div>
                        <label className="text-[10px] text-white/35 uppercase tracking-widest mb-1.5 block">Label</label>
                        <input value={editing.label} onChange={(e) => setEditing((f) => ({ ...f, label: e.target.value }))}
                            placeholder="Old Client Discount" className="w-full rounded-lg px-3 py-2.5 text-sm text-white bg-white/5 border border-white/10" />
                    </div>
                    <div>
                        <label className="text-[10px] text-white/35 uppercase tracking-widest mb-1.5 block">Description</label>
                        <input value={editing.description} onChange={(e) => setEditing((f) => ({ ...f, description: e.target.value }))}
                            placeholder="Special rate for returning clients" className="w-full rounded-lg px-3 py-2.5 text-sm text-white bg-white/5 border border-white/10" />
                    </div>

                    {editing.type === 'PERCENT' && (
                        <div>
                            <label className="text-[10px] text-white/35 uppercase tracking-widest mb-1.5 block">Percent off</label>
                            <input type="number" value={editing.percent} onChange={(e) => setEditing((f) => ({ ...f, percent: e.target.value }))}
                                placeholder="10" className="w-full rounded-lg px-3 py-2.5 text-sm text-white bg-white/5 border border-white/10" />
                        </div>
                    )}
                    {editing.type === 'FLAT' && (
                        <div>
                            <label className="text-[10px] text-white/35 uppercase tracking-widest mb-1.5 block">Flat amount off (₹)</label>
                            <input type="number" value={editing.flat} onChange={(e) => setEditing((f) => ({ ...f, flat: e.target.value }))}
                                placeholder="500" className="w-full rounded-lg px-3 py-2.5 text-sm text-white bg-white/5 border border-white/10" />
                        </div>
                    )}
                    {editing.type === 'FIXED_PRICE' && (
                        <div className="space-y-3">
                            <label className="text-[10px] text-white/35 uppercase tracking-widest block">Fixed prices per plan + duration</label>
                            {['individual', 'couple'].map((pt) => (
                                <div key={pt}>
                                    <p className="text-xs text-white/50 mb-1.5 capitalize">{pt}</p>
                                    <div className="grid grid-cols-4 gap-2">
                                        {durations.map((d) => (
                                            <input key={d.months} type="number" placeholder={d.label}
                                                value={editing.fixed_prices?.[pt]?.[d.months] ?? ''}
                                                onChange={(e) => setEditing((f) => ({
                                                    ...f,
                                                    fixed_prices: { ...f.fixed_prices, [pt]: { ...f.fixed_prices?.[pt], [d.months]: Number(e.target.value) } },
                                                }))}
                                                className="rounded-lg px-2 py-2 text-xs text-white bg-white/5 border border-white/10" />
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    <div>
                        <label className="text-[10px] text-white/35 uppercase tracking-widest mb-1.5 block">
                            Applicable coaching types <span className="normal-case font-normal text-white/25">(none = all)</span>
                        </label>
                        <div className="flex flex-wrap gap-2">
                            {coachingTypes.map((ct) => (
                                <Chip key={ct.id} active={editing.applicable_coaching_types.includes(ct.id)}
                                    onClick={() => toggleArr('applicable_coaching_types', ct.id)}>
                                    {ct.shortName}
                                </Chip>
                            ))}
                        </div>
                    </div>

                    <div>
                        <label className="text-[10px] text-white/35 uppercase tracking-widest mb-1.5 block">
                            Applicable plan types <span className="normal-case font-normal text-white/25">(none = all)</span>
                        </label>
                        <div className="flex flex-wrap gap-2">
                            {PLAN_TYPES.map((pt) => (
                                <Chip key={pt.id} active={editing.applicable_plan_types.includes(pt.id)}
                                    onClick={() => toggleArr('applicable_plan_types', pt.id)} color="#60a5fa">
                                    {pt.label}
                                </Chip>
                            ))}
                        </div>
                    </div>

                    <div>
                        <label className="text-[10px] text-white/35 uppercase tracking-widest mb-1.5 block">
                            Applicable durations <span className="normal-case font-normal text-white/25">(none = all — ignored for Fixed price)</span>
                        </label>
                        <div className="flex flex-wrap gap-2">
                            {durations.map((d) => (
                                <Chip key={d.months} active={editing.applicable_durations.includes(d.months)}
                                    onClick={() => toggleArr('applicable_durations', d.months)} color="#34d399">
                                    {d.label}
                                </Chip>
                            ))}
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="text-[10px] text-white/35 uppercase tracking-widest mb-1.5 block">Max uses</label>
                            <input type="number" value={editing.max_uses} onChange={(e) => setEditing((f) => ({ ...f, max_uses: e.target.value }))}
                                placeholder="Unlimited" className="w-full rounded-lg px-3 py-2.5 text-sm text-white bg-white/5 border border-white/10" />
                        </div>
                        <div>
                            <label className="text-[10px] text-white/35 uppercase tracking-widest mb-1.5 block">Expires on</label>
                            <input type="date" value={editing.expires_at} onChange={(e) => setEditing((f) => ({ ...f, expires_at: e.target.value }))}
                                className="w-full rounded-lg px-3 py-2.5 text-sm text-white bg-white/5 border border-white/10" />
                        </div>
                    </div>

                    <label className="flex items-center gap-2.5 text-sm text-white/70 cursor-pointer">
                        <input type="checkbox" checked={editing.active} onChange={(e) => setEditing((f) => ({ ...f, active: e.target.checked }))}
                            className="accent-primary w-4 h-4" />
                        Coupon is active
                    </label>
                </div>

                <div className="sticky bottom-0 p-6 pt-4" style={{ background: 'rgba(14,14,22,0.97)', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                    <button onClick={onSave} disabled={saving || !editing.code || !editing.label}
                        className="w-full py-3 rounded-xl text-sm font-black text-white disabled:opacity-40 flex items-center justify-center gap-2"
                        style={{ background: '#e71763', boxShadow: '0 0 20px rgba(231,23,99,0.3)' }}>
                        {saving ? <><Loader2 className="w-4 h-4 animate-spin" /> Saving…</> : 'Save Coupon'}
                    </button>
                </div>
            </motion.div>
        </div>
    );
}

// ── Main page ──────────────────────────────────────────────────────────────
export default function AdminCoupons() {
    const { coachingTypes, durations } = useSiteData();
    const [coupons, setCoupons] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [editing, setEditing] = useState(null);
    const [viewing, setViewing] = useState(null);
    const [saving, setSaving] = useState(false);
    const [saveError, setSaveError] = useState('');
    const toast = useToast();
    // Delete-confirmation state (replaces window.confirm)
    const [deleteTarget, setDeleteTarget] = useState(null);
    const [deleting, setDeleting] = useState(false);

    const load = async () => {
        setLoading(true);
        try { setCoupons(await fetchCoupons()); }
        catch (e) { setError(e.message); }
        finally { setLoading(false); }
    };
    useEffect(() => { load(); }, []);

    const filtered = useMemo(() => {
        let rows = coupons;
        if (search.trim()) {
            const q = search.trim().toLowerCase();
            rows = rows.filter((c) => c.code.toLowerCase().includes(q) || c.label.toLowerCase().includes(q));
        }
        if (statusFilter !== 'all') {
            rows = rows.filter((c) => statusOf(c).label.toLowerCase() === statusFilter);
        }
        return rows;
    }, [coupons, search, statusFilter]);

    const stats = useMemo(() => ({
        total: coupons.length,
        active: coupons.filter((c) => statusOf(c).label === 'Active').length,
        totalUses: coupons.reduce((s, c) => s + (c.used_count || 0), 0),
    }), [coupons]);

    const openNew = () => { setSaveError(''); setEditing(emptyForm()); };
    const openEdit = (c) => {
        setSaveError('');
        setViewing(null);
        setEditing({
            ...emptyForm(), ...c,
            max_uses: c.max_uses ?? '',
            expires_at: c.expires_at ? c.expires_at.slice(0, 10) : '',
            fixed_prices: c.fixed_prices || { individual: {}, couple: {} },
            applicable_coaching_types: c.applicable_coaching_types || [],
            applicable_plan_types: c.applicable_plan_types || [],
            applicable_durations: c.applicable_durations || [],
        });
    };

    const handleSave = async () => {
        setSaving(true);
        setSaveError('');
        try {
            const payload = {
                code: editing.code,
                label: editing.label,
                description: editing.description || null,
                type: editing.type,
                percent: editing.type === 'PERCENT' ? Number(editing.percent) : null,
                flat: editing.type === 'FLAT' ? Number(editing.flat) : null,
                fixed_prices: editing.type === 'FIXED_PRICE' ? editing.fixed_prices : null,
                applicable_coaching_types: editing.applicable_coaching_types,
                applicable_plan_types: editing.applicable_plan_types,
                applicable_durations: editing.applicable_durations,
                max_uses: editing.max_uses === '' ? null : Number(editing.max_uses),
                expires_at: editing.expires_at || null,
                active: editing.active,
            };
            if (editing.id) await updateCouponAdmin(editing.id, payload);
            else await createCouponAdmin(payload);
            toast.success(editing.id ? 'Coupon updated successfully' : 'Coupon created successfully');
            setEditing(null);
            load();
        } catch (e) {
            setSaveError(e.message);
            toast.error(e.message || 'Failed to save coupon.');
        }
        finally { setSaving(false); }
    };

    // Opens the themed confirm modal instead of window.confirm(...)
    const requestDelete = (coupon) => setDeleteTarget(coupon);

    const confirmDelete = async () => {
        if (!deleteTarget) return;
        setDeleting(true);
        try {
            await deleteCouponAdmin(deleteTarget.id);
            toast.success('Coupon deleted successfully');
            setViewing(null);
            setDeleteTarget(null);
            load();
        } catch (e) {
            setError(e.message || 'Failed to delete coupon.');
            toast.error(e.message || 'Failed to delete coupon.');
            setDeleteTarget(null);
        } finally {
            setDeleting(false);
        }
    };

    return (
        <div>
            <div className="flex items-center justify-between gap-4 mb-6 flex-wrap">
                <div>
                    <h1 className="text-xl font-black text-white mb-1">Coupons</h1>
                    <p className="text-xs text-white/35">Manage discount codes for your enrollment plans</p>
                </div>
                <button onClick={openNew}
                    className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-black text-white"
                    style={{ background: '#e71763', boxShadow: '0 0 20px rgba(231,23,99,0.3)' }}>
                    <Plus className="w-3.5 h-3.5" /> New Coupon
                </button>
            </div>

            <div className="grid grid-cols-3 gap-3 mb-6">
                <StatCard icon={Tag} label="Total Coupons" value={stats.total} accent="#e71763" />
                <StatCard icon={CheckCircle2} label="Active" value={stats.active} accent="#34d399" />
                <StatCard icon={TrendingUp} label="Total Redemptions" value={stats.totalUses} accent="#60a5fa" />
            </div>

            <div className="flex flex-wrap gap-3 mb-5">
                <div className="relative flex-1 min-w-[220px]">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/30" />
                    <input value={search} onChange={(e) => setSearch(e.target.value)}
                        placeholder="Search by code or label…"
                        className="w-full rounded-xl pl-9 pr-4 py-2.5 text-sm text-white placeholder:text-white/25 outline-none"
                        style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }} />
                    {search && (
                        <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white">
                            <X className="w-3.5 h-3.5" />
                        </button>
                    )}
                </div>
                <div className="flex gap-2">
                    {['all', 'active', 'inactive', 'expired', 'exhausted'].map((s) => (
                        <Chip key={s} active={statusFilter === s} onClick={() => setStatusFilter(s)}>
                            {s === 'all' ? 'All' : s.charAt(0).toUpperCase() + s.slice(1)}
                        </Chip>
                    ))}
                </div>
            </div>

            {error && (
                <div className="flex items-center gap-2 px-4 py-3 rounded-xl mb-4 text-sm"
                    style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', color: '#f87171' }}>
                    <AlertCircle className="w-4 h-4 flex-shrink-0" />
                    {error}
                    <button onClick={() => setError('')} className="ml-auto text-white/30 hover:text-white">
                        <X className="w-3.5 h-3.5" />
                    </button>
                </div>
            )}

            {loading ? (
                <div className="py-24 flex justify-center"><Loader2 className="w-6 h-6 animate-spin text-white/25" /></div>
            ) : filtered.length === 0 ? (
                <div className="py-20 text-center rounded-2xl" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}>
                    <Tag className="w-8 h-8 mx-auto mb-3 text-white/15" />
                    <p className="text-sm text-white/30">{coupons.length === 0 ? 'No coupons created yet' : 'No coupons match your filters'}</p>
                </div>
            ) : (
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                    {filtered.map((c) => {
                        const status = statusOf(c);
                        const meta = TYPE_META[c.type] || TYPE_META.PERCENT;
                        const Icon = meta.icon;
                        return (
                            <motion.div key={c.id}
                                initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                                className="rounded-xl p-3.5 cursor-pointer transition-all"
                                style={{ background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.07)' }}
                                onClick={() => setViewing(c)}
                                onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'rgba(231,23,99,0.3)'; e.currentTarget.style.boxShadow = '0 8px 22px rgba(0,0,0,0.28)'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
                                onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.07)'; e.currentTarget.style.boxShadow = 'none'; e.currentTarget.style.transform = 'translateY(0)'; }}>

                                <div className="flex items-start justify-between mb-2.5">
                                    <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: `${meta.color}18` }}>
                                        <Icon className="w-3.5 h-3.5" style={{ color: meta.color }} />
                                    </div>
                                    <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full" style={{ background: status.bg, color: status.color }}>
                                        {status.label}
                                    </span>
                                </div>

                                <div onClick={(e) => e.stopPropagation()} className="mb-0.5">
                                    <CodeCopy code={c.code} />
                                </div>
                                <p className="text-[11px] text-white/35 mb-2.5 truncate">{c.label}</p>

                                <div className="flex items-center justify-between text-[11px] mb-2.5">
                                    <span className="font-bold" style={{ color: meta.color }}>{discountSummary(c)}</span>
                                    <span className="text-white/25">{c.used_count || 0}{c.max_uses ? `/${c.max_uses}` : ''} used</span>
                                </div>

                                <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                                    <button onClick={() => setViewing(c)}
                                        className="flex-1 flex items-center justify-center gap-1 py-1.5 rounded-lg text-[11px] font-bold text-white/50 hover:text-white transition-colors"
                                        style={{ background: 'rgba(255,255,255,0.04)' }}>
                                        <Eye className="w-3 h-3" /> View
                                    </button>
                                    <button onClick={() => openEdit(c)}
                                        className="w-7 h-7 rounded-lg flex items-center justify-center text-white/40 hover:text-white hover:bg-white/8 transition-colors">
                                        <Edit2 className="w-3 h-3" />
                                    </button>
                                    <button onClick={() => requestDelete(c)}
                                        className="w-7 h-7 rounded-lg flex items-center justify-center text-white/40 hover:text-red-400 hover:bg-red-500/8 transition-colors">
                                        <Trash2 className="w-3 h-3" />
                                    </button>
                                </div>
                            </motion.div>
                        );
                    })}
                </div>
            )}

            <AnimatePresence>
                {viewing && (
                    <ViewDrawer
                        coupon={viewing}
                        onClose={() => setViewing(null)}
                        onEdit={openEdit}
                        onDeleteRequest={requestDelete}
                        coachingTypes={coachingTypes}
                    />
                )}
            </AnimatePresence>

            <AnimatePresence>
                {editing && <EditModal editing={editing} setEditing={setEditing} onSave={handleSave} saving={saving} error={saveError} coachingTypes={coachingTypes} durations={durations} />}
            </AnimatePresence>

            <AnimatePresence>
                {deleteTarget && (
                    <ConfirmDeleteModal
                        coupon={deleteTarget}
                        deleting={deleting}
                        onCancel={() => !deleting && setDeleteTarget(null)}
                        onConfirm={confirmDelete}
                    />
                )}
            </AnimatePresence>
        </div>
    );
}
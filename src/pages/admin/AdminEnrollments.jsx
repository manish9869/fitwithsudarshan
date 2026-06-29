/**
 * src/pages/admin/AdminEnrollments.jsx
 *
 * Enrollments dashboard
 * - Client-side filter / sort / paginate
 * - Fetches all rows once
 * - Module-level cache survives tab switching
 * - Status and note updates patch local state/cache
 * - Custom styled dropdowns for type, plan, and status filters
 */

import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSearchParams } from 'react-router-dom';
import {
    Search,
    ChevronDown,
    ChevronUp,
    X,
    Eye,
    StickyNote,
    RefreshCw,
    Copy,
    Save,
    Loader2,
    AlertCircle,
    ChevronLeft,
    ChevronRight,
    Check,
    Download,
} from 'lucide-react';

import {
    fetchEnrollments,
    fetchEnrollment,
    setEnrollmentStatus,
    exportEnrollmentsAll,
    saveNote,
} from './adminApi';

import {
    fmtCurrency,
    fmtDate,
    fmtGoals,
    exportToCSV,
    downloadInvoicePDF,
    statusBadge,
    ENROLLMENT_STATUSES,
    exportEnrollmentsToExcel,
    exportEnrollmentsToPDF,
    exportSingleEnrollmentToExcel,
} from './adminUtils';

import { useDebounce } from './useDebounce';
import ExportMenu from './ExportMenu';

const PAGE_SIZE = 20;
const CACHE_TTL = 60_000;

const COACHING_TYPES = ['all', 'online', 'video', 'personal'];
const PLAN_TYPES = ['all', 'individual', 'couple'];

const _cache = {
    allRows: null,
    ts: 0,
};

function formatLabel(value) {
    if (!value) return '—';

    return String(value)
        .replace(/_/g, ' ')
        .replace(/\b\w/g, (c) => c.toUpperCase());
}

function StatCard({ label, value, sub, color }) {
    return (
        <div
            className="rounded-2xl p-5"
            style={{
                background: 'rgba(255,255,255,0.025)',
                border: '1px solid rgba(255,255,255,0.07)',
            }}
        >
            <p className="text-xs text-white/35 uppercase tracking-widest mb-2">
                {label}
            </p>

            <p className="text-2xl font-black mb-1" style={{ color }}>
                {value}
            </p>

            {sub && <p className="text-xs text-white/30">{sub}</p>}
        </div>
    );
}

function FilterDropdown({
    value,
    onChange,
    options,
    minWidth = 150,
    placeholder = 'Select',
    getBadge,
}) {
    const [open, setOpen] = useState(false);
    const ref = useRef(null);

    const activeOption =
        options.find((option) => option.value === value) || options[0];

    const activeBadge = getBadge
        ? getBadge(activeOption.value)
        : {
              bg: 'rgba(255,255,255,0.05)',
              border: 'rgba(255,255,255,0.1)',
              color: '#ffffff',
          };

    useEffect(() => {
        if (!open) return;

        const handler = (e) => {
            if (ref.current && !ref.current.contains(e.target)) {
                setOpen(false);
            }
        };

        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, [open]);

    return (
        <div ref={ref} className="relative" style={{ minWidth }}>
            <button
                type="button"
                onClick={() => setOpen((prev) => !prev)}
                className="w-full flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm font-bold transition-all focus:outline-none"
                style={{
                    background: activeOption.value === 'all'
                        ? 'rgba(255,255,255,0.05)'
                        : activeBadge.bg,
                    border: activeOption.value === 'all'
                        ? '1px solid rgba(255,255,255,0.1)'
                        : `1px solid ${activeBadge.border}`,
                    color: activeOption.value === 'all'
                        ? 'rgba(255,255,255,0.72)'
                        : activeBadge.color,
                    boxShadow: open
                        ? '0 0 0 3px rgba(231,23,99,0.12)'
                        : 'none',
                }}
            >
                <span
                    className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                    style={{
                        background:
                            activeOption.value === 'all'
                                ? 'rgba(255,255,255,0.35)'
                                : activeBadge.color,
                    }}
                />

                <span className="flex-1 text-left truncate">
                    {activeOption?.label || placeholder}
                </span>

                <ChevronDown
                    className="w-3.5 h-3.5 flex-shrink-0 transition-transform"
                    style={{
                        opacity: 0.65,
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
                        className="absolute left-0 top-full mt-2 z-[120] rounded-xl overflow-hidden shadow-2xl"
                        style={{
                            background: '#13131f',
                            border: '1px solid rgba(255,255,255,0.12)',
                            minWidth,
                            width: '100%',
                            boxShadow: '0 8px 32px rgba(0,0,0,0.6)',
                        }}
                    >
                        {options.map((option) => {
                            const isActive = option.value === value;
                            const optionBadge = getBadge
                                ? getBadge(option.value)
                                : {
                                      color:
                                          option.value === 'all'
                                              ? 'rgba(255,255,255,0.45)'
                                              : '#e71763',
                                  };

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
                                        background: isActive
                                            ? 'rgba(255,255,255,0.06)'
                                            : 'transparent',
                                    }}
                                    onMouseEnter={(e) => {
                                        if (!isActive) {
                                            e.currentTarget.style.background =
                                                'rgba(255,255,255,0.04)';
                                        }
                                    }}
                                    onMouseLeave={(e) => {
                                        e.currentTarget.style.background = isActive
                                            ? 'rgba(255,255,255,0.06)'
                                            : 'transparent';
                                    }}
                                >
                                    <span
                                        className="w-2 h-2 rounded-full flex-shrink-0"
                                        style={{
                                            background:
                                                option.value === 'all'
                                                    ? 'rgba(255,255,255,0.35)'
                                                    : optionBadge.color,
                                        }}
                                    />

                                    <span
                                        className="flex-1"
                                        style={{
                                            color: isActive
                                                ? option.value === 'all'
                                                    ? 'white'
                                                    : optionBadge.color
                                                : 'rgba(255,255,255,0.65)',
                                        }}
                                    >
                                        {option.label}
                                    </span>

                                    {isActive && (
                                        <Check
                                            className="w-3 h-3 flex-shrink-0"
                                            style={{
                                                color:
                                                    option.value === 'all'
                                                        ? 'white'
                                                        : optionBadge.color,
                                            }}
                                        />
                                    )}
                                </button>
                            );
                        })}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

function StatusSelect({ value, onChange, disabled }) {
    const [open, setOpen] = useState(false);
    const ref = useRef(null);
    const badge = statusBadge(value || 'paid');

    useEffect(() => {
        if (!open) return;

        const handler = (e) => {
            if (ref.current && !ref.current.contains(e.target)) {
                setOpen(false);
            }
        };

        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, [open]);

    return (
        <div ref={ref} className="relative inline-block">
            <button
                type="button"
                disabled={disabled}
                onClick={() => setOpen((o) => !o)}
                className="flex items-center gap-1.5 text-[10px] font-bold px-2.5 py-1 rounded-full transition-all disabled:opacity-50 focus:outline-none"
                style={{
                    background: badge.bg,
                    border: `1px solid ${badge.border}`,
                    color: badge.color,
                    minWidth: 90,
                }}
            >
                <span
                    className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                    style={{ background: badge.color }}
                />

                <span className="flex-1 text-left leading-none">
                    {formatLabel(value || 'paid')}
                </span>

                <ChevronDown
                    className="w-2.5 h-2.5 flex-shrink-0 transition-transform"
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
                        className="absolute left-0 top-full mt-1.5 z-[100] rounded-xl overflow-hidden shadow-2xl"
                        style={{
                            background: '#13131f',
                            border: '1px solid rgba(255,255,255,0.12)',
                            minWidth: 160,
                            boxShadow: '0 8px 32px rgba(0,0,0,0.6)',
                        }}
                    >
                        {ENROLLMENT_STATUSES.map((s) => {
                            const b = statusBadge(s);
                            const isActive = s === (value || 'paid');

                            return (
                                <button
                                    type="button"
                                    key={s}
                                    onClick={() => {
                                        onChange(s);
                                        setOpen(false);
                                    }}
                                    className="w-full flex items-center gap-2.5 px-3 py-2.5 text-xs font-semibold text-left transition-colors"
                                    style={{
                                        background: isActive
                                            ? 'rgba(255,255,255,0.06)'
                                            : 'transparent',
                                    }}
                                    onMouseEnter={(e) => {
                                        if (!isActive) {
                                            e.currentTarget.style.background =
                                                'rgba(255,255,255,0.04)';
                                        }
                                    }}
                                    onMouseLeave={(e) => {
                                        e.currentTarget.style.background = isActive
                                            ? 'rgba(255,255,255,0.06)'
                                            : 'transparent';
                                    }}
                                >
                                    <span
                                        className="w-2 h-2 rounded-full flex-shrink-0"
                                        style={{ background: b.color }}
                                    />

                                    <span
                                        className="flex-1"
                                        style={{
                                            color: isActive
                                                ? b.color
                                                : 'rgba(255,255,255,0.65)',
                                        }}
                                    >
                                        {formatLabel(s)}
                                    </span>

                                    {isActive && (
                                        <Check
                                            className="w-3 h-3 flex-shrink-0"
                                            style={{ color: b.color }}
                                        />
                                    )}
                                </button>
                            );
                        })}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

function NoteModal({ recordId, name, currentNote, onClose, onSaved }) {
    const [text, setText] = useState(currentNote?.text || '');
    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(false);

    const handleSave = async () => {
        setSaving(true);

        try {
            const note = await saveNote('enrollment', recordId, text);
            onSaved(note);
            setSaved(true);
            setTimeout(() => onClose(), 700);
        } catch {
            setSaving(false);
        }
    };

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            onClick={onClose}
        >
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />

            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="relative w-full max-w-md rounded-2xl overflow-hidden"
                style={{
                    background: '#0e0e16',
                    border: '1px solid rgba(255,255,255,0.1)',
                }}
                onClick={(e) => e.stopPropagation()}
            >
                <div
                    className="flex items-center justify-between px-5 py-4"
                    style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}
                >
                    <div className="flex items-center gap-2">
                        <StickyNote className="w-4 h-4" style={{ color: '#e71763' }} />

                        <p className="font-bold text-white text-sm">
                            {currentNote ? 'Edit Note' : 'Add Note'} — {name}
                        </p>
                    </div>

                    <button onClick={onClose} className="text-white/30 hover:text-white">
                        <X className="w-4 h-4" />
                    </button>
                </div>

                <div className="p-5">
                    <textarea
                        value={text}
                        onChange={(e) => setText(e.target.value)}
                        placeholder="Add a note about this client…"
                        rows={5}
                        className="w-full rounded-xl px-4 py-3 text-sm text-white placeholder:text-white/25 resize-none outline-none leading-relaxed"
                        style={{
                            background: 'rgba(255,255,255,0.05)',
                            border: '1px solid rgba(255,255,255,0.1)',
                        }}
                        autoFocus
                    />

                    <p className="text-[10px] text-white/25 mt-2">
                        Visible to all admins
                        {currentNote?.updatedAt
                            ? ` · last updated ${fmtDate(currentNote.updatedAt, true)}`
                            : ''}
                    </p>

                    <div className="flex gap-3 mt-4">
                        <button
                            onClick={onClose}
                            className="flex-1 py-2.5 rounded-xl text-sm text-white/40 transition-all"
                            style={{ border: '1px solid rgba(255,255,255,0.08)' }}
                        >
                            Cancel
                        </button>

                        <button
                            onClick={handleSave}
                            disabled={saving}
                            className="flex-1 py-2.5 rounded-xl text-sm font-bold text-white flex items-center justify-center gap-2 disabled:opacity-60"
                            style={{ background: saved ? '#34d399' : '#e71763' }}
                        >
                            {saving ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                            ) : saved ? (
                                <>
                                    <Check className="w-4 h-4" />
                                    Saved!
                                </>
                            ) : (
                                <>
                                    <Save className="w-4 h-4" />
                                    Save Note
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </motion.div>
        </div>
    );
}

function DetailDrawer({ enrollmentId, onClose, onNoteClick, onStatusChange }) {
    const [enrollment, setEnrollment] = useState(null);
    const [loading, setLoading] = useState(true);
    const [copied, setCopied] = useState('');

    useEffect(() => {
        let cancelled = false;

        fetchEnrollment(enrollmentId)
            .then((e) => {
                if (!cancelled) setEnrollment(e);
            })
            .finally(() => {
                if (!cancelled) setLoading(false);
            });

        return () => {
            cancelled = true;
        };
    }, [enrollmentId]);

    const copy = (val, key) => {
        navigator.clipboard.writeText(val).catch(() => {});
        setCopied(key);
        setTimeout(() => setCopied(''), 1500);
    };

    const dl = (label, value) => (
        <div
            className="flex items-start justify-between gap-4 py-3"
            style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}
        >
            <span className="text-xs text-white/35 flex-shrink-0 w-32">
                {label}
            </span>

            <span className="text-xs text-white text-right font-medium flex-1">
                {value || '—'}
            </span>
        </div>
    );

    return (
        <div className="fixed inset-0 z-50 flex justify-end" onClick={onClose}>
            <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />

            <motion.div
                initial={{ x: '100%' }}
                animate={{ x: 0 }}
                exit={{ x: '100%' }}
                transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                className="relative w-full max-w-md h-full overflow-y-auto"
                style={{
                    background: '#0a0a14',
                    borderLeft: '1px solid rgba(255,255,255,0.08)',
                }}
                onClick={(e) => e.stopPropagation()}
            >
                <div
                    className="sticky top-0 z-10 flex items-center justify-between px-5 py-4"
                    style={{
                        background: 'rgba(10,10,20,0.95)',
                        borderBottom: '1px solid rgba(255,255,255,0.06)',
                        backdropFilter: 'blur(20px)',
                    }}
                >
                    <div>
                        <p className="font-black text-white text-sm">
                            {enrollment?.customer_name || '…'}
                        </p>

                        <p className="text-[10px] text-white/35 font-mono mt-0.5">
                            {enrollment?.enrollment_id}
                        </p>
                    </div>

                    <div className="flex items-center gap-2">
                        {enrollment && (
                            <>
                                <button
                                    onClick={() => onNoteClick(enrollment)}
                                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all"
                                    style={{
                                        background: 'rgba(231,23,99,0.1)',
                                        border: '1px solid rgba(231,23,99,0.2)',
                                        color: '#e71763',
                                    }}
                                >
                                    <StickyNote className="w-3 h-3" />
                                    {enrollment.note ? 'Edit Note' : 'Add Note'}
                                </button>

                                <button
                                    onClick={() => exportSingleEnrollmentToExcel(enrollment)}
                                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all"
                                    style={{
                                        background: 'rgba(96,165,250,0.1)',
                                        border: '1px solid rgba(96,165,250,0.25)',
                                        color: '#60a5fa',
                                    }}
                                >
                                    <Download className="w-3 h-3" />
                                    Export
                                </button>
                            </>
                        )}

                        <button
                            onClick={onClose}
                            className="w-8 h-8 rounded-lg flex items-center justify-center text-white/30 hover:text-white hover:bg-white/5"
                        >
                            <X className="w-4 h-4" />
                        </button>
                    </div>
                </div>

                {loading || !enrollment ? (
                    <div className="flex items-center justify-center py-24">
                        <Loader2 className="w-5 h-5 animate-spin text-white/25" />
                    </div>
                ) : (
                    <div className="p-5 space-y-6">
                        {enrollment.note && (
                            <div
                                className="rounded-xl p-4"
                                style={{
                                    background: 'rgba(231,23,99,0.06)',
                                    border: '1px solid rgba(231,23,99,0.15)',
                                }}
                            >
                                <div className="flex items-center gap-2 mb-2">
                                    <StickyNote
                                        className="w-3.5 h-3.5"
                                        style={{ color: '#e71763' }}
                                    />

                                    <p
                                        className="text-[10px] font-bold uppercase tracking-widest"
                                        style={{ color: '#e71763' }}
                                    >
                                        Note
                                    </p>
                                </div>

                                <p className="text-xs text-white/60 leading-relaxed">
                                    {enrollment.note.text}
                                </p>

                                <p className="text-[10px] text-white/25 mt-2">
                                    Updated {fmtDate(enrollment.note.updatedAt, true)}
                                </p>
                            </div>
                        )}

                        <div className="flex items-center gap-3">
                            <div
                                className="flex-1 rounded-xl p-4 text-center"
                                style={{
                                    background: 'rgba(255,255,255,0.03)',
                                    border: '1px solid rgba(255,255,255,0.07)',
                                }}
                            >
                                <p className="text-[10px] text-white/30 uppercase tracking-widest mb-1">
                                    Amount Paid
                                </p>

                                <p className="text-xl font-black" style={{ color: '#e71763' }}>
                                    {fmtCurrency(enrollment.amount_paid)}
                                </p>
                            </div>

                            <div
                                className="flex-1 rounded-xl p-4 text-center"
                                style={{
                                    background: 'rgba(255,255,255,0.03)',
                                    border: '1px solid rgba(255,255,255,0.07)',
                                }}
                            >
                                <p className="text-[10px] text-white/30 uppercase tracking-widest mb-2">
                                    Status
                                </p>

                                <div className="flex justify-center">
                                    <StatusSelect
                                        value={enrollment.payment_status || 'paid'}
                                        onChange={(newStatus) => {
                                            onStatusChange(enrollment.id, newStatus);
                                            setEnrollment((prev) => ({
                                                ...prev,
                                                payment_status: newStatus,
                                            }));
                                        }}
                                    />
                                </div>
                            </div>
                        </div>

                        {enrollment.coupon_code && (
                            <div
                                className="rounded-xl p-4"
                                style={{
                                    background: 'rgba(52,211,153,0.06)',
                                    border: '1px solid rgba(52,211,153,0.2)',
                                }}
                            >
                                <p className="text-[10px] text-white/30 uppercase tracking-widest mb-2">
                                    Coupon Applied
                                </p>

                                <div className="flex items-center justify-between">
                                    <span className="text-sm font-black text-white font-mono">
                                        {enrollment.coupon_code}
                                    </span>

                                    <span className="text-sm font-bold" style={{ color: '#34d399' }}>
                                        -{fmtCurrency(enrollment.coupon_savings)}
                                    </span>
                                </div>

                                {enrollment.original_amount > enrollment.amount_paid && (
                                    <p className="text-[11px] text-white/30 mt-1">
                                        Original:{' '}
                                        <span className="line-through">
                                            {fmtCurrency(enrollment.original_amount)}
                                        </span>
                                    </p>
                                )}
                            </div>
                        )}

                        <section>
                            <p
                                className="text-[10px] font-black uppercase tracking-widest mb-3"
                                style={{ color: '#e71763' }}
                            >
                                Client Information
                            </p>

                            <div
                                className="rounded-xl overflow-hidden"
                                style={{
                                    background: 'rgba(255,255,255,0.02)',
                                    border: '1px solid rgba(255,255,255,0.06)',
                                }}
                            >
                                <div className="px-4">
                                    {dl('Name', enrollment.customer_name)}
                                    {dl('Email', enrollment.customer_email)}
                                    {dl('Phone', enrollment.customer_phone)}
                                    {dl('Age', enrollment.age ? `${enrollment.age} yrs` : null)}
                                    {dl('City', enrollment.city)}
                                    {dl('Weight', enrollment.weight ? `${enrollment.weight} kg` : null)}

                                    <div className="flex items-start justify-between gap-4 py-3">
                                        <span className="text-xs text-white/35 flex-shrink-0 w-32">
                                            Goals
                                        </span>

                                        <span className="text-xs text-white text-right font-medium flex-1">
                                            {fmtGoals(enrollment.goals)}
                                        </span>
                                    </div>

                                    {enrollment.medical_issue === 'yes' &&
                                        dl('Medical', enrollment.medical_note || 'Yes')}
                                </div>
                            </div>
                        </section>

                        {enrollment.partner_name && (
                            <section>
                                <p
                                    className="text-[10px] font-black uppercase tracking-widest mb-3"
                                    style={{ color: '#e71763' }}
                                >
                                    Partner Details
                                </p>

                                <div
                                    className="rounded-xl overflow-hidden"
                                    style={{
                                        background: 'rgba(255,255,255,0.02)',
                                        border: '1px solid rgba(255,255,255,0.06)',
                                    }}
                                >
                                    <div className="px-4">
                                        {dl('Name', enrollment.partner_name)}
                                        {dl(
                                            'Age',
                                            enrollment.partner_age
                                                ? `${enrollment.partner_age} yrs`
                                                : null
                                        )}
                                        {dl(
                                            'Weight',
                                            enrollment.partner_weight
                                                ? `${enrollment.partner_weight} kg`
                                                : null
                                        )}

                                        <div className="flex items-start justify-between gap-4 py-3">
                                            <span className="text-xs text-white/35 flex-shrink-0 w-32">
                                                Goals
                                            </span>

                                            <span className="text-xs text-white text-right font-medium flex-1">
                                                {fmtGoals(enrollment.partner_goals)}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </section>
                        )}

                        <section>
                            <p
                                className="text-[10px] font-black uppercase tracking-widest mb-3"
                                style={{ color: '#e71763' }}
                            >
                                Enrollment Details
                            </p>

                            <div
                                className="rounded-xl overflow-hidden"
                                style={{
                                    background: 'rgba(255,255,255,0.02)',
                                    border: '1px solid rgba(255,255,255,0.06)',
                                }}
                            >
                                <div className="px-4">
                                    {dl('Program', enrollment.program_name)}
                                    {dl('Coaching Type', enrollment.coaching_type)}
                                    {dl('Plan Type', enrollment.plan_type)}
                                    {dl(
                                        'Duration',
                                        enrollment.duration_months
                                            ? `${enrollment.duration_months} Month${
                                                  Number(enrollment.duration_months) > 1
                                                      ? 's'
                                                      : ''
                                              }`
                                            : null
                                    )}
                                    {dl('Payment Date', fmtDate(enrollment.payment_date))}
                                    {dl('Created', fmtDate(enrollment.created_at))}
                                </div>
                            </div>
                        </section>

                        <section>
                            <p
                                className="text-[10px] font-black uppercase tracking-widest mb-3"
                                style={{ color: '#e71763' }}
                            >
                                Payment Reference
                            </p>

                            <div
                                className="rounded-xl overflow-hidden"
                                style={{
                                    background: 'rgba(255,255,255,0.02)',
                                    border: '1px solid rgba(255,255,255,0.06)',
                                }}
                            >
                                {[
                                    ['Enrollment ID', enrollment.enrollment_id],
                                    ['Payment ID', enrollment.razorpay_payment_id],
                                    ['Order ID', enrollment.razorpay_order_id],
                                ].map(([label, value]) => (
                                    <div
                                        key={label}
                                        className="flex items-center justify-between px-4 py-3"
                                        style={{
                                            borderBottom: '1px solid rgba(255,255,255,0.04)',
                                        }}
                                    >
                                        <span className="text-xs text-white/35">
                                            {label}
                                        </span>

                                        <button
                                            onClick={() => copy(value, label)}
                                            className="flex items-center gap-1.5 text-xs font-mono text-white/55 hover:text-white transition-colors"
                                        >
                                            <span className="truncate max-w-[140px]">
                                                {value || '—'}
                                            </span>

                                            {value &&
                                                (copied === label ? (
                                                    <Check className="w-3 h-3 text-green-400" />
                                                ) : (
                                                    <Copy className="w-3 h-3" />
                                                ))}
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </section>

                        <DownloadInvoiceButton enrollment={enrollment} />
                    </div>
                )}
            </motion.div>
        </div>
    );
}

function DownloadInvoiceButton({ enrollment }) {
    const [loading, setLoading] = useState(false);
    const [err, setErr] = useState('');

    const handleDownload = async () => {
        setLoading(true);
        setErr('');

        try {
            const mapped = {
                enrollmentId: enrollment.enrollment_id,
                customerName: enrollment.customer_name,
                customerEmail: enrollment.customer_email,
                customerPhone: enrollment.customer_phone,
                programName: enrollment.program_name,
                planType: enrollment.plan_type,
                durationMonths: enrollment.duration_months,
                coachingType: enrollment.coaching_type,
                amountPaid: enrollment.amount_paid,
                originalAmount: enrollment.original_amount,
                couponCode: enrollment.coupon_code,
                couponSavings: enrollment.coupon_savings,
                razorpayOrderId: enrollment.razorpay_order_id,
                razorpayPaymentId: enrollment.razorpay_payment_id,
                paymentDate: enrollment.payment_date,
            };

            await downloadInvoicePDF(mapped);
        } catch {
            setErr('Invoice generation failed.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div>
            <button
                onClick={handleDownload}
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl font-bold text-sm text-white disabled:opacity-60"
                style={{
                    background: '#e71763',
                    boxShadow: '0 0 20px rgba(231,23,99,0.3)',
                }}
            >
                {loading ? (
                    <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Generating…
                    </>
                ) : (
                    <>Download Invoice PDF</>
                )}
            </button>

            {err && <p className="text-xs text-red-400 mt-2 text-center">{err}</p>}
        </div>
    );
}

function SortIcon({ field, sort }) {
    if (sort.field !== field) {
        return <ChevronDown className="w-3 h-3 opacity-20" />;
    }

    return sort.dir === 'asc' ? (
        <ChevronUp className="w-3 h-3" style={{ color: '#e71763' }} />
    ) : (
        <ChevronDown className="w-3 h-3" style={{ color: '#e71763' }} />
    );
}

export default function AdminEnrollments() {
    const [searchParams, setSearchParams] = useSearchParams();
    const focusId = searchParams.get('focus');

    const [allData, setAllData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const [search, setSearch] = useState('');
    const debouncedSearch = useDebounce(search, 300);

    const [coachingFilter, setCoachingFilter] = useState('all');
    const [planFilter, setPlanFilter] = useState('all');
    const [statusFilter, setStatusFilter] = useState('all');

    const [page, setPage] = useState(1);
    const [sort, setSort] = useState({ field: 'created_at', dir: 'desc' });

    const [selectedId, setSelectedId] = useState(focusId || null);
    const [noteTarget, setNoteTarget] = useState(null);

    const coachingOptions = useMemo(
        () =>
            COACHING_TYPES.map((type) => ({
                value: type,
                label: type === 'all' ? 'All Types' : formatLabel(type),
            })),
        []
    );

    const planOptions = useMemo(
        () =>
            PLAN_TYPES.map((type) => ({
                value: type,
                label: type === 'all' ? 'All Plans' : formatLabel(type),
            })),
        []
    );

    const statusOptions = useMemo(
        () => [
            { value: 'all', label: 'All Statuses' },
            ...ENROLLMENT_STATUSES.map((status) => ({
                value: status,
                label: formatLabel(status),
            })),
        ],
        []
    );

    const filterBadge = useCallback((value) => {
        if (value === 'all') {
            return {
                bg: 'rgba(255,255,255,0.05)',
                border: 'rgba(255,255,255,0.1)',
                color: 'rgba(255,255,255,0.65)',
            };
        }

        return {
            bg: 'rgba(231,23,99,0.1)',
            border: 'rgba(231,23,99,0.25)',
            color: '#e71763',
        };
    }, []);

    const fetchData = useCallback(async ({ silent = false } = {}) => {
        const now = Date.now();

        if (_cache.allRows && now - _cache.ts < CACHE_TTL) {
            setAllData(_cache.allRows);
            setLoading(false);
            return;
        }

        if (!silent) setLoading(true);
        setError('');

        try {
            const res = await fetchEnrollments({ pageSize: 9999 });
            const rows = res.rows || [];

            _cache.allRows = rows;
            _cache.ts = Date.now();

            setAllData(rows);
        } catch (e) {
            setError(e.message || 'Failed to load enrollments');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    useEffect(() => {
        if (focusId) {
            const next = new URLSearchParams(searchParams);
            next.delete('focus');
            setSearchParams(next, { replace: true });
        }

        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const handleRefresh = () => {
        _cache.allRows = null;
        _cache.ts = 0;
        fetchData();
    };

    const filtered = useMemo(() => {
        let rows = allData;

        if (debouncedSearch.trim()) {
            const q = debouncedSearch.toLowerCase();

            rows = rows.filter((r) =>
                (r.customer_name ?? '').toLowerCase().includes(q) ||
                (r.customer_email ?? '').toLowerCase().includes(q) ||
                (r.customer_phone ?? '').includes(q) ||
                (r.enrollment_id ?? '').toLowerCase().includes(q) ||
                (r.city ?? '').toLowerCase().includes(q)
            );
        }

        if (coachingFilter !== 'all') {
            rows = rows.filter((r) => r.coaching_type === coachingFilter);
        }

        if (planFilter !== 'all') {
            rows = rows.filter((r) => r.plan_type === planFilter);
        }

        if (statusFilter !== 'all') {
            rows = rows.filter(
                (r) => (r.payment_status || 'paid') === statusFilter
            );
        }

        rows = [...rows].sort((a, b) => {
            const aVal = a[sort.field] ?? '';
            const bVal = b[sort.field] ?? '';

            if (sort.field === 'amount_paid') {
                const cmp = Number(aVal || 0) - Number(bVal || 0);
                return sort.dir === 'asc' ? cmp : -cmp;
            }

            if (sort.field === 'created_at' || sort.field === 'payment_date') {
                const cmp =
                    new Date(aVal || 0).getTime() -
                    new Date(bVal || 0).getTime();

                return sort.dir === 'asc' ? cmp : -cmp;
            }

            const cmp = String(aVal).localeCompare(String(bVal));
            return sort.dir === 'asc' ? cmp : -cmp;
        });

        return rows;
    }, [
        allData,
        debouncedSearch,
        coachingFilter,
        planFilter,
        statusFilter,
        sort,
    ]);

    useEffect(() => {
        setPage(1);
    }, [debouncedSearch, coachingFilter, planFilter, statusFilter, sort]);

    const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));

    const pageData = useMemo(() => {
        const start = (page - 1) * PAGE_SIZE;
        return filtered.slice(start, start + PAGE_SIZE);
    }, [filtered, page]);

    const toggleSort = (field) => {
        setSort((s) =>
            s.field === field
                ? { ...s, dir: s.dir === 'asc' ? 'desc' : 'asc' }
                : { field, dir: 'asc' }
        );
    };

    const handleStatusChange = async (id, newStatus) => {
        const patch = (rows) =>
            rows.map((r) =>
                r.id === id ? { ...r, payment_status: newStatus } : r
            );

        setAllData(patch);

        if (_cache.allRows) {
            _cache.allRows = patch(_cache.allRows);
        }

        try {
            await setEnrollmentStatus(id, newStatus);
        } catch (e) {
            setError(e.message || 'Failed to update status.');
            fetchData({ silent: true });
        }
    };

    const totalRevenue = pageData.reduce(
        (sum, r) => sum + (Number(r.amount_paid) || 0),
        0
    );

    const couponCount = pageData.filter((r) => r.coupon_code).length;
    const coupleCount = pageData.filter((r) => r.plan_type === 'couple').length;

    const handleExport = async (format, range) => {
        try {
            let allRows;

            if (range?.from || range?.to) {
                allRows = await exportEnrollmentsAll({
                    search: debouncedSearch,
                    coachingType: coachingFilter,
                    planType: planFilter,
                    status: statusFilter,
                    dateFrom: range?.from,
                    dateTo: range?.to,
                });
            } else {
                allRows = filtered;
            }

            if (!allRows || allRows.length === 0) {
                alert('No data to export for the selected filters.');
                return;
            }

            if (format === 'csv') {
                const mapped = allRows.map((r) => ({
                    enrollment_id: r.enrollment_id || '',
                    name: r.customer_name || '',
                    email: r.customer_email || '',
                    phone: r.customer_phone || '',
                    program: r.program_name || '',
                    coaching_type: r.coaching_type || '',
                    plan_type: r.plan_type || '',
                    duration_months: r.duration_months || '',
                    amount_paid: r.amount_paid || 0,
                    original_amount: r.original_amount || r.amount_paid || 0,
                    coupon_code: r.coupon_code || '',
                    coupon_savings: r.coupon_savings || 0,
                    payment_status: r.payment_status || '',
                    payment_date: r.payment_date || '',
                    age: r.age || '',
                    city: r.city || '',
                    weight: r.weight || '',
                    goals: Array.isArray(r.goals)
                        ? r.goals.join('; ')
                        : r.goals || '',
                    medical_issue: r.medical_issue || '',
                    medical_note: r.medical_note || '',
                    partner_name: r.partner_name || '',
                    partner_age: r.partner_age || '',
                    partner_goals: Array.isArray(r.partner_goals)
                        ? r.partner_goals.join('; ')
                        : '',
                    razorpay_payment_id: r.razorpay_payment_id || '',
                    created_at: r.created_at || '',
                }));

                exportToCSV(
                    mapped,
                    `recode-enrollments-${new Date().toISOString().slice(0, 10)}`
                );
            } else if (format === 'excel') {
                exportEnrollmentsToExcel(allRows, {
                    dateFrom: range?.from,
                    dateTo: range?.to,
                });
            } else if (format === 'pdf') {
                exportEnrollmentsToPDF(allRows, {
                    dateFrom: range?.from,
                    dateTo: range?.to,
                    filters: {
                        coachingFilter,
                        planFilter,
                        statusFilter,
                    },
                });
            }
        } catch (e) {
            setError(e.message || 'Export failed. Please try again.');
        }
    };

    const thCls =
        'px-4 py-3 text-left text-[10px] font-black uppercase tracking-widest text-white/35 cursor-pointer hover:text-white/60 transition-colors whitespace-nowrap select-none';

    return (
        <div>
            <div className="flex items-center justify-between gap-4 mb-6 flex-wrap">
                <div>
                    <h1 className="text-xl font-black text-white mb-1">
                        Enrollments
                    </h1>

                    <p className="text-xs text-white/35">
                        {filtered.length !== allData.length
                            ? `${filtered.length} of ${allData.length} records`
                            : `${allData.length} total records`}
                    </p>
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                    <button
                        onClick={handleRefresh}
                        className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs text-white/50 hover:text-white transition-all"
                        style={{ border: '1px solid rgba(255,255,255,0.08)' }}
                    >
                        <RefreshCw
                            className={`w-3.5 h-3.5 ${
                                loading ? 'animate-spin' : ''
                            }`}
                        />
                        Refresh
                    </button>

                    <ExportMenu onExport={handleExport} label="Export Data" />
                </div>
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
                <StatCard
                    label="Showing"
                    value={`${pageData.length} / ${filtered.length}`}
                    sub=""
                    color="white"
                />

                <StatCard
                    label="Page Revenue"
                    value={fmtCurrency(totalRevenue)}
                    sub=""
                    color="#e71763"
                />

                <StatCard
                    label="Couple Plans"
                    value={coupleCount}
                    sub=""
                    color="#60a5fa"
                />

                <StatCard
                    label="Coupons Used"
                    value={couponCount}
                    sub=""
                    color="#34d399"
                />
            </div>

            <div className="flex flex-wrap gap-3 mb-5 relative z-20">
                <div className="relative flex-1 min-w-[220px]">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/30" />

                    <input
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Search name, email, phone, enrollment ID…"
                        className="w-full rounded-xl pl-9 pr-4 py-2.5 text-sm text-white placeholder:text-white/25 outline-none"
                        style={{
                            background: 'rgba(255,255,255,0.05)',
                            border: '1px solid rgba(255,255,255,0.1)',
                        }}
                    />

                    {search && (
                        <button
                            onClick={() => setSearch('')}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white"
                        >
                            <X className="w-3.5 h-3.5" />
                        </button>
                    )}
                </div>

                <FilterDropdown
                    value={coachingFilter}
                    onChange={setCoachingFilter}
                    options={coachingOptions}
                    minWidth={145}
                    getBadge={filterBadge}
                />

                <FilterDropdown
                    value={planFilter}
                    onChange={setPlanFilter}
                    options={planOptions}
                    minWidth={145}
                    getBadge={filterBadge}
                />

                <FilterDropdown
                    value={statusFilter}
                    onChange={setStatusFilter}
                    options={statusOptions}
                    minWidth={160}
                    getBadge={(value) =>
                        value === 'all'
                            ? {
                                  bg: 'rgba(255,255,255,0.05)',
                                  border: 'rgba(255,255,255,0.1)',
                                  color: 'rgba(255,255,255,0.65)',
                              }
                            : statusBadge(value)
                    }
                />
            </div>

            {error && (
                <div
                    className="flex items-center gap-2 px-4 py-3 rounded-xl mb-4 text-sm"
                    style={{
                        background: 'rgba(239,68,68,0.08)',
                        border: '1px solid rgba(239,68,68,0.2)',
                        color: '#f87171',
                    }}
                >
                    <AlertCircle className="w-4 h-4 flex-shrink-0" />
                    {error}

                    <button
                        onClick={() => setError('')}
                        className="ml-auto text-white/30 hover:text-white"
                    >
                        <X className="w-3.5 h-3.5" />
                    </button>
                </div>
            )}

            <div
                className="rounded-2xl overflow-hidden"
                style={{
                    background: 'rgba(255,255,255,0.02)',
                    border: '1px solid rgba(255,255,255,0.07)',
                }}
            >
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr
                                style={{
                                    borderBottom: '1px solid rgba(255,255,255,0.06)',
                                    background: 'rgba(255,255,255,0.02)',
                                }}
                            >
                                {[
                                    ['customer_name', 'Client'],
                                    ['coaching_type', 'Type'],
                                    ['plan_type', 'Plan'],
                                    ['duration_months', 'Duration'],
                                    ['amount_paid', 'Amount'],
                                    ['payment_status', 'Status'],
                                    ['payment_date', 'Date'],
                                ].map(([field, label]) => (
                                    <th
                                        key={field}
                                        className={thCls}
                                        onClick={() => toggleSort(field)}
                                    >
                                        <span className="flex items-center gap-1">
                                            {label}
                                            <SortIcon field={field} sort={sort} />
                                        </span>
                                    </th>
                                ))}

                                <th className={`${thCls} cursor-default`}>
                                    Actions
                                </th>
                            </tr>
                        </thead>

                        <tbody>
                            {loading ? (
                                <tr>
                                    <td colSpan={8} className="px-4 py-16 text-center">
                                        <Loader2 className="w-6 h-6 animate-spin mx-auto text-white/25" />
                                    </td>
                                </tr>
                            ) : pageData.length === 0 ? (
                                <tr>
                                    <td colSpan={8} className="px-4 py-16 text-center">
                                        <p className="text-sm text-white/25">
                                            No enrollments found
                                        </p>
                                    </td>
                                </tr>
                            ) : (
                                pageData.map((row) => {
                                    const hasNote = !!row.note;

                                    return (
                                        <tr
                                            key={row.id}
                                            className="transition-colors"
                                            style={{
                                                borderBottom:
                                                    '1px solid rgba(255,255,255,0.04)',
                                            }}
                                            onMouseEnter={(e) =>
                                                (e.currentTarget.style.background =
                                                    'rgba(255,255,255,0.02)')
                                            }
                                            onMouseLeave={(e) =>
                                                (e.currentTarget.style.background = '')
                                            }
                                        >
                                            <td className="px-4 py-3">
                                                <p className="text-sm font-semibold text-white">
                                                    {row.customer_name}
                                                </p>

                                                <p className="text-[11px] text-white/35">
                                                    {row.customer_email}
                                                </p>

                                                {hasNote && (
                                                    <span
                                                        className="inline-flex items-center gap-1 text-[9px] font-bold px-1.5 py-0.5 rounded mt-1"
                                                        style={{
                                                            background:
                                                                'rgba(231,23,99,0.1)',
                                                            color: '#e71763',
                                                        }}
                                                    >
                                                        <StickyNote className="w-2.5 h-2.5" />
                                                        NOTE
                                                    </span>
                                                )}
                                            </td>

                                            <td className="px-4 py-3">
                                                <span className="text-xs font-medium text-white/60 capitalize">
                                                    {row.coaching_type || '—'}
                                                </span>
                                            </td>

                                            <td className="px-4 py-3">
                                                <span className="text-xs text-white/60 capitalize">
                                                    {row.plan_type || '—'}
                                                </span>
                                            </td>

                                            <td className="px-4 py-3">
                                                <span className="text-xs text-white/60">
                                                    {row.duration_months
                                                        ? `${row.duration_months}M`
                                                        : '—'}
                                                </span>
                                            </td>

                                            <td className="px-4 py-3">
                                                <p className="text-sm font-bold text-white">
                                                    {fmtCurrency(row.amount_paid)}
                                                </p>

                                                {row.coupon_code && (
                                                    <p
                                                        className="text-[10px]"
                                                        style={{ color: '#34d399' }}
                                                    >
                                                        -{fmtCurrency(row.coupon_savings)}
                                                    </p>
                                                )}
                                            </td>

                                            <td className="px-4 py-3">
                                                <StatusSelect
                                                    value={row.payment_status || 'paid'}
                                                    onChange={(v) =>
                                                        handleStatusChange(row.id, v)
                                                    }
                                                />
                                            </td>

                                            <td className="px-4 py-3">
                                                <p className="text-xs text-white/50">
                                                    {fmtDate(row.payment_date, true)}
                                                </p>
                                            </td>

                                            <td className="px-4 py-3">
                                                <div className="flex items-center gap-1.5">
                                                    <button
                                                        onClick={() =>
                                                            setSelectedId(row.id)
                                                        }
                                                        className="w-7 h-7 rounded-lg flex items-center justify-center text-white/35 hover:text-white hover:bg-white/8 transition-all"
                                                        title="View details"
                                                    >
                                                        <Eye className="w-3.5 h-3.5" />
                                                    </button>

                                                    <button
                                                        onClick={() =>
                                                            setNoteTarget(row)
                                                        }
                                                        className="w-7 h-7 rounded-lg flex items-center justify-center transition-all"
                                                        style={{
                                                            color: hasNote
                                                                ? '#e71763'
                                                                : 'rgba(255,255,255,0.35)',
                                                        }}
                                                        title={
                                                            hasNote
                                                                ? 'Edit note'
                                                                : 'Add note'
                                                        }
                                                        onMouseEnter={(e) =>
                                                            (e.currentTarget.style.background =
                                                                'rgba(255,255,255,0.08)')
                                                        }
                                                        onMouseLeave={(e) =>
                                                            (e.currentTarget.style.background =
                                                                '')
                                                        }
                                                    >
                                                        <StickyNote className="w-3.5 h-3.5" />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>

                {totalPages > 1 && (
                    <div
                        className="flex items-center justify-between px-4 py-3"
                        style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}
                    >
                        <p className="text-xs text-white/30">
                            Page {page} of {totalPages} · {filtered.length} records
                        </p>

                        <div className="flex items-center gap-2">
                            <button
                                disabled={page <= 1}
                                onClick={() => setPage((p) => p - 1)}
                                className="w-7 h-7 rounded-lg flex items-center justify-center text-white/40 hover:text-white hover:bg-white/8 disabled:opacity-25 transition-all"
                            >
                                <ChevronLeft className="w-4 h-4" />
                            </button>

                            {Array.from(
                                { length: Math.min(5, totalPages) },
                                (_, i) => {
                                    const p =
                                        Math.max(
                                            1,
                                            Math.min(totalPages - 4, page - 2)
                                        ) + i;

                                    return (
                                        <button
                                            key={p}
                                            onClick={() => setPage(p)}
                                            className="w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold transition-all"
                                            style={
                                                page === p
                                                    ? {
                                                          background: '#e71763',
                                                          color: 'white',
                                                      }
                                                    : {
                                                          color:
                                                              'rgba(255,255,255,0.35)',
                                                      }
                                            }
                                        >
                                            {p}
                                        </button>
                                    );
                                }
                            )}

                            <button
                                disabled={page >= totalPages}
                                onClick={() => setPage((p) => p + 1)}
                                className="w-7 h-7 rounded-lg flex items-center justify-center text-white/40 hover:text-white hover:bg-white/8 disabled:opacity-25 transition-all"
                            >
                                <ChevronRight className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                )}
            </div>

            <AnimatePresence>
                {selectedId && (
                    <DetailDrawer
                        enrollmentId={selectedId}
                        onClose={() => setSelectedId(null)}
                        onNoteClick={(row) => {
                            setNoteTarget(row);
                            setSelectedId(null);
                        }}
                        onStatusChange={handleStatusChange}
                    />
                )}
            </AnimatePresence>

            <AnimatePresence>
                {noteTarget && (
                    <NoteModal
                        recordId={noteTarget.id}
                        name={noteTarget.customer_name}
                        currentNote={noteTarget.note}
                        onClose={() => setNoteTarget(null)}
                        onSaved={(note) => {
                            const patch = (rows) =>
                                rows.map((r) =>
                                    r.id === noteTarget.id ? { ...r, note } : r
                                );

                            setAllData(patch);

                            if (_cache.allRows) {
                                _cache.allRows = patch(_cache.allRows);
                            }

                            setNoteTarget(null);
                        }}
                    />
                )}
            </AnimatePresence>
        </div>
    );
}
/**
 * src/pages/admin/AdminEnrollments.jsx
 *
 * Enrollments dashboard
 * - Client-side filter / sort / paginate
 * - Fetches all rows once
 * - Module-level cache survives tab switching
 * - Status and note updates patch local state/cache
 * - Custom styled dropdowns for type, plan, and status filters
 * - Multi-template email sending via EmailSendMenu
 * - Toast notifications on status change, note save, export, email send
 * - NEW: Payment Ledger panel embedded in the detail drawer — every
 *   payment recorded against an enrollment (website Razorpay, Razorpay
 *   link, UPI, bank transfer, cash) is now visible in one place, with the
 *   ability to record an additional payment and trigger a balance
 *   reminder without leaving this page. Table rows also flag partial
 *   payment plans so mismatches jump out immediately.
 */
import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSearchParams, useNavigate } from 'react-router-dom';
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
    Check,
    Download,
    UserPlus,
    MessageCircle,
    Trash2,
    Salad,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import EnrollmentDietPlanCard from '../diet/EnrollmentDietPlanCard';
import { getDietPlanByEnrollment } from '../diet/dietPlanApi';
import { buildDietPrefillFromEnrollment } from '../diet/dietPrefill';
import {
    fetchEnrollments,
    fetchEnrollment,
    setEnrollmentStatus,
    setEnrollmentPlanStartDate,
    exportEnrollmentsAll,
    saveNote, sendEnrollmentEmail,
    deleteEnrollmentAdmin,
    fetchEnrollmentHistory,
} from '../adminApi';
import PaginationBar from '../PaginationBar';
import {
    fmtCurrency,
    fmtDate,
    fmtDateTime,
    fmtGoals,
    fmtName,
    formatLabel,
    exportToCSV,
    downloadInvoicePDF,
    statusBadge,
    ENROLLMENT_STATUSES,
    getLifecycleStatus,
    lifecycleBadge,
    LIFECYCLE_FILTERS,
    toISTDatetimeLocal,
    istDatetimeLocalToISO,
} from '../adminUtils';

import { useDebounce } from '../useDebounce';
import ExportMenu from '../ExportMenu';
import EmailSendMenu from './EmailSendMenu';
import { useToast } from '../ToastProvider';
import PaymentLedgerPanel from './PaymentLedgerPanel';
import ExtendEnrollmentModal from './ExtendEnrollmentModal';
import FilterDropdown from './FilterDropdown';


const CACHE_TTL = 60_000;

const COACHING_TYPES = ['all', 'online', 'video', 'personal'];
const PLAN_TYPES = ['all', 'individual', 'couple'];

const _cache = {
    allRows: null,
    ts: 0,
};

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
    const toast = useToast();

    const handleSave = async () => {
        setSaving(true);

        try {
            const note = await saveNote('enrollment', recordId, text);
            onSaved(note);
            setSaved(true);
            toast.success('Note saved');
            setTimeout(() => onClose(), 700);
        } catch (e) {
            setSaving(false);
            toast.error(e.message || 'Failed to save note.');
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

function DetailDrawer({ enrollmentId, onClose, onNoteClick, onStatusChange, onPaymentRecorded, onNavigateToEnrollment, onEnrollmentDeleted }) {
    const [enrollment, setEnrollment] = useState(null);
    const [loading, setLoading] = useState(true);
    const [copied, setCopied] = useState('');
    const [history, setHistory] = useState([]);
    const [showExtendModal, setShowExtendModal] = useState(false);
    const [confirmDeleteId, setConfirmDeleteId] = useState(null);
    const [deletingHistoryId, setDeletingHistoryId] = useState(null);
    const [fixingPlanStart, setFixingPlanStart] = useState(false);
    const [planStartDraft, setPlanStartDraft] = useState('');
    const [savingPlanStart, setSavingPlanStart] = useState(false);
    const toast = useToast();

    const handleSavePlanStart = async () => {
        if (!planStartDraft) return;
        setSavingPlanStart(true);
        try {
            const updated = await setEnrollmentPlanStartDate(enrollment.id, istDatetimeLocalToISO(planStartDraft));
            setEnrollment((prev) => ({ ...prev, ...updated }));
            setFixingPlanStart(false);
            toast.success('Plan start date set');
        } catch (e) {
            toast.error(e.message || 'Failed to set plan start date.');
        } finally {
            setSavingPlanStart(false);
        }
    };

    const handleDeleteHistoryRow = async (row) => {
        setDeletingHistoryId(row.id);
        try {
            await deleteEnrollmentAdmin(row.id);
            setHistory((prev) => prev.filter((r) => r.id !== row.id));
            onEnrollmentDeleted(row.id);
            setConfirmDeleteId(null);
            toast.success(row.id === enrollment.id ? 'Enrollment deleted' : 'Extension removed');
            if (row.id === enrollment.id) onClose();
        } catch (e) {
            toast.error(e.message || 'Failed to delete.');
        } finally {
            setDeletingHistoryId(null);
        }
    };

    useEffect(() => {
        let cancelled = false;

        fetchEnrollment(enrollmentId)
            .then((e) => {
                if (!cancelled) setEnrollment(e);
            })
            .finally(() => {
                if (!cancelled) setLoading(false);
            });

        fetchEnrollmentHistory(enrollmentId)
            .then((rows) => {
                if (!cancelled) setHistory(rows);
            })
            .catch(() => { /* non-fatal — Plan History section just won't render */ });

        return () => {
            cancelled = true;
        };
    }, [enrollmentId]);

    const copy = (val, key) => {
        navigator.clipboard.writeText(val).catch(() => { });
        setCopied(key);
        toast.success('Copied to clipboard');
        setTimeout(() => setCopied(''), 1500);
    };

    // Bubbles a freshly-recorded payment (or any updated fields) both into
    // this drawer's own local state AND up to the parent table/cache, so
    // the amount/balance shown in the list stays in sync without a refetch.
    const handlePaymentRecorded = (updated) => {
        setEnrollment((prev) => (prev ? { ...prev, ...updated } : updated));
        onPaymentRecorded?.(updated);
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
                    className="sticky top-0 z-10 px-5 py-4"
                    style={{
                        background: 'rgba(10,10,20,0.95)',
                        borderBottom: '1px solid rgba(255,255,255,0.06)',
                        backdropFilter: 'blur(20px)',
                    }}
                >
                    <div className="flex items-center justify-between gap-3">
                        <div className="min-w-0">
                            <p className="font-black text-white text-sm truncate">
                                {fmtName(enrollment?.customer_name) || '…'}
                            </p>

                            <p className="text-[10px] text-white/35 font-mono mt-0.5">
                                {enrollment?.enrollment_id}
                            </p>
                        </div>

                        <button
                            onClick={onClose}
                            className="w-8 h-8 rounded-lg flex items-center justify-center text-white/30 hover:text-white hover:bg-white/5 flex-shrink-0"
                        >
                            <X className="w-4 h-4" />
                        </button>
                    </div>

                    {enrollment && (
                        <div className="flex items-center gap-2 mt-3 flex-wrap">
                            <button
                                onClick={() => onNoteClick(enrollment)}
                                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-bold transition-all"
                                style={{
                                    background: 'rgba(231,23,99,0.1)',
                                    border: '1px solid rgba(231,23,99,0.2)',
                                    color: '#e71763',
                                }}
                            >
                                <StickyNote className="w-3.5 h-3.5" />
                                {enrollment.note ? 'Edit Note' : 'Add Note'}
                            </button>

                            <EmailSendMenu
                                hasCustomerEmail={!!enrollment.customer_email}
                                onSend={async (template) => {
                                    try {
                                        await sendEnrollmentEmail(enrollment.id, template);
                                        toast.success('Email sent successfully');
                                    } catch (e) {
                                        toast.error(e.message || 'Failed to send email.');
                                        throw e;
                                    }
                                }}
                            />

                            <button
                                onClick={() => import('../adminExcelExport').then(({ exportSingleEnrollmentToExcel }) => exportSingleEnrollmentToExcel(enrollment))}
                                className="flex items-center justify-center w-9 h-9 rounded-lg transition-all"
                                style={{
                                    background: 'rgba(96,165,250,0.1)',
                                    border: '1px solid rgba(96,165,250,0.25)',
                                    color: '#60a5fa',
                                }}
                                title="Export as Excel"
                            >
                                <Download className="w-3.5 h-3.5" />
                            </button>

                            {enrollment.customer_phone && (
                                <a
                                    href={`https://wa.me/${enrollment.customer_phone.replace(/\D/g, '')}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center justify-center w-9 h-9 rounded-lg transition-all"
                                    style={{
                                        background: 'rgba(37,211,102,0.1)',
                                        border: '1px solid rgba(37,211,102,0.25)',
                                        color: '#25D366',
                                    }}
                                    title="Open WhatsApp"
                                >
                                    <MessageCircle className="w-3.5 h-3.5" />
                                </a>
                            )}

                            <button
                                onClick={() => setShowExtendModal(true)}
                                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-bold transition-all"
                                style={{
                                    background: 'rgba(96,165,250,0.1)',
                                    border: '1px solid rgba(96,165,250,0.25)',
                                    color: '#60a5fa',
                                }}
                            >
                                <RefreshCw className="w-3.5 h-3.5" />
                                Extend Plan
                            </button>

                        </div>
                    )}
                </div>

                {
                    loading || !enrollment ? (
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

                            {history.length > 1 && (
                                <section>
                                    <p
                                        className="text-[10px] font-black uppercase tracking-widest mb-3"
                                        style={{ color: '#e71763' }}
                                    >
                                        Plan History
                                    </p>
                                    <div className="rounded-xl overflow-hidden" style={{ border: '1px solid rgba(255,255,255,0.07)' }}>
                                        {history.map((row) => {
                                            const lc = getLifecycleStatus(row);
                                            const isCurrent = row.id === enrollment.id;
                                            return (
                                                <div
                                                    key={row.id}
                                                    className="flex items-center justify-between gap-3 px-4 py-3"
                                                    style={{
                                                        background: isCurrent ? 'rgba(231,23,99,0.06)' : 'rgba(255,255,255,0.02)',
                                                        borderBottom: '1px solid rgba(255,255,255,0.05)',
                                                    }}
                                                >
                                                    <div className="min-w-0">
                                                        <p className="text-xs font-semibold text-white truncate">
                                                            {row.program_name || '—'}
                                                            {row.duration_months ? ` · ${row.duration_months}M` : ''}
                                                        </p>
                                                        <p className="text-[10px] text-white/35 mt-0.5">
                                                            {fmtCurrency(row.amount_paid)} paid · {fmtDate(row.created_at, true)}
                                                        </p>
                                                    </div>
                                                    <div className="flex items-center gap-2 flex-shrink-0">
                                                        {lc && (
                                                            <span
                                                                className="text-[9px] font-bold px-2 py-0.5 rounded-full"
                                                                style={{ background: lifecycleBadge(lc.tag).bg, border: `1px solid ${lifecycleBadge(lc.tag).border}`, color: lifecycleBadge(lc.tag).color }}
                                                            >
                                                                {lc.label}
                                                            </span>
                                                        )}
                                                        {confirmDeleteId === row.id ? (
                                                            <>
                                                                <span className="text-[10px] text-white/40">Remove this plan?</span>
                                                                <button
                                                                    onClick={() => handleDeleteHistoryRow(row)}
                                                                    disabled={deletingHistoryId === row.id}
                                                                    className="text-[10px] font-bold px-2.5 py-1 rounded-lg disabled:opacity-50"
                                                                    style={{ background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.35)', color: '#f87171' }}
                                                                >
                                                                    {deletingHistoryId === row.id ? '…' : 'Yes, remove'}
                                                                </button>
                                                                <button
                                                                    onClick={() => setConfirmDeleteId(null)}
                                                                    className="text-[10px] font-bold px-2 py-1 rounded-lg text-white/40"
                                                                >
                                                                    Cancel
                                                                </button>
                                                            </>
                                                        ) : (
                                                            <>
                                                                {isCurrent ? (
                                                                    <span className="text-[10px] text-white/25 px-2">Viewing</span>
                                                                ) : (
                                                                    <button
                                                                        onClick={() => onNavigateToEnrollment(row.id)}
                                                                        className="text-[10px] font-bold px-2.5 py-1 rounded-lg"
                                                                        style={{ background: 'rgba(96,165,250,0.1)', border: '1px solid rgba(96,165,250,0.25)', color: '#60a5fa' }}
                                                                    >
                                                                        View
                                                                    </button>
                                                                )}
                                                                <button
                                                                    onClick={() => setConfirmDeleteId(row.id)}
                                                                    title="Remove this plan (accidental extension, wrong entry, etc.)"
                                                                    className="w-6 h-6 rounded-lg flex items-center justify-center text-white/25 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                                                                >
                                                                    <Trash2 className="w-3 h-3" />
                                                                </button>
                                                            </>
                                                        )}
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </section>
                            )}

                            {/* ── NEW: Full payment ledger — every source, every partial ── */}
                            <PaymentLedgerPanel
                                enrollment={enrollment}
                                onEnrollmentUpdated={handlePaymentRecorded}
                            />

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
                                        {dl('Name', fmtName(enrollment.customer_name))}
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

                            <EnrollmentDietPlanCard enrollment={enrollment} />

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
                                            {dl('Name', fmtName(enrollment.partner_name))}
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
                                        {dl('Coaching Type', formatLabel(enrollment.coaching_type))}
                                        {dl('Plan Type', formatLabel(enrollment.plan_type))}
                                        {dl(
                                            'Duration',
                                            enrollment.duration_months
                                                ? `${enrollment.duration_months} Month${Number(enrollment.duration_months) > 1
                                                    ? 's'
                                                    : ''
                                                }`
                                                : null
                                        )}
                                        {dl('Source', enrollment.source === 'manual' ? 'Manual Entry' : 'Website Checkout')}
                                        {dl('Payment Date', fmtDateTime(enrollment.payment_date))}
                                        {dl('Created', fmtDate(enrollment.created_at))}
                                        {(() => {
                                            const lc = getLifecycleStatus(enrollment);
                                            if (lc) {
                                                const b = lifecycleBadge(lc.tag);
                                                return dl('Plan Status', (
                                                    <span className="inline-flex items-center gap-2">
                                                        <span
                                                            className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                                                            style={{ background: b.bg, border: `1px solid ${b.border}`, color: b.color }}
                                                        >
                                                            {lc.label}
                                                        </span>
                                                        {lc.tag !== 'expired' && lc.expiringSoon && (
                                                            <span className="text-[10px] text-white/35">Expires in {lc.daysRemaining}d</span>
                                                        )}
                                                    </span>
                                                ));
                                            }

                                            // payment_status is 'paid' but plan_start_date is missing — usually
                                            // a website checkout whose gateway timed out and was later marked
                                            // paid by hand, so it never went through the flow that sets it.
                                            if ((enrollment.payment_status || 'paid') !== 'paid') return null;

                                            return dl('Plan Status', fixingPlanStart ? (
                                                <span className="inline-flex items-center gap-2 flex-wrap">
                                                    <input
                                                        type="datetime-local"
                                                        className="rounded-lg px-2 py-1 text-xs text-white outline-none"
                                                        style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}
                                                        value={planStartDraft}
                                                        onChange={(e) => setPlanStartDraft(e.target.value)}
                                                    />
                                                    <button
                                                        onClick={handleSavePlanStart}
                                                        disabled={savingPlanStart || !planStartDraft}
                                                        className="text-[10px] font-bold px-2 py-1 rounded-lg disabled:opacity-50"
                                                        style={{ background: 'rgba(52,211,153,0.15)', color: '#34d399' }}
                                                    >
                                                        {savingPlanStart ? 'Saving…' : 'Save'}
                                                    </button>
                                                    <button
                                                        onClick={() => setFixingPlanStart(false)}
                                                        className="text-[10px] text-white/35 hover:text-white/60"
                                                    >
                                                        Cancel
                                                    </button>
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center gap-2">
                                                    <span className="text-[10px] text-white/35">Plan start date missing — no badge</span>
                                                    <button
                                                        onClick={() => {
                                                            setPlanStartDraft(toISTDatetimeLocal(enrollment.payment_date || new Date().toISOString()));
                                                            setFixingPlanStart(true);
                                                        }}
                                                        className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                                                        style={{ background: 'rgba(96,165,250,0.12)', border: '1px solid rgba(96,165,250,0.3)', color: '#60a5fa' }}
                                                    >
                                                        Fix
                                                    </button>
                                                </span>
                                            ));
                                        })()}
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

                                {enrollment.source === 'manual' ? (
                                    <div
                                        className="rounded-xl p-4 flex items-start gap-2.5"
                                        style={{ background: 'rgba(96,165,250,0.06)', border: '1px solid rgba(96,165,250,0.18)' }}
                                    >
                                        <MessageCircle className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" style={{ color: '#60a5fa' }} />
                                        <p className="text-xs text-white/50 leading-relaxed">
                                            This is a manual entry — there's no single website Order ID / Payment ID. Each payment
                                            recorded against this enrollment has its <strong className="text-white/70">own reference</strong>{' '}
                                            (UTR / UPI ref / order+payment ID) — see the <strong className="text-white/70">Payment History</strong>{' '}
                                            section above. A single enrollment can have multiple payments, each with a different reference.
                                        </p>
                                    </div>
                                ) : (
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
                                                style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}
                                            >
                                                <span className="text-xs text-white/35">{label}</span>
                                                <button
                                                    onClick={() => copy(value, label)}
                                                    className="flex items-center gap-1.5 text-xs font-mono text-white/55 hover:text-white transition-colors"
                                                >
                                                    <span className="truncate max-w-[140px]">{value || '—'}</span>
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
                                )}
                            </section>

                            <DownloadInvoiceButton enrollment={enrollment} />
                        </div>
                    )
                }
            </motion.div >

            {showExtendModal && enrollment && (
                <ExtendEnrollmentModal
                    sourceEnrollment={enrollment}
                    onClose={() => setShowExtendModal(false)}
                    onExtended={(extended) => {
                        setShowExtendModal(false);
                        onNavigateToEnrollment(extended.id);
                    }}
                />
            )}
        </div >
    );
}

function DownloadInvoiceButton({ enrollment }) {
    const [loading, setLoading] = useState(false);
    const [err, setErr] = useState('');
    const downloadingRef = useRef(false);
    const toast = useToast();

    const handleDownload = async () => {
        if (downloadingRef.current || loading) return;

        const enrollmentId = enrollment?.enrollment_id;

        if (!enrollmentId) {
            setErr('Missing enrollment ID.');
            toast.error('Missing enrollment ID.');
            return;
        }

        downloadingRef.current = true;
        setLoading(true);
        setErr('');

        try {
            await downloadInvoicePDF(enrollment);
            toast.success('Invoice downloaded');
        } catch (error) {
            setErr(error?.message || 'Invoice generation failed.');
            toast.error(error?.message || 'Invoice generation failed.');
        } finally {
            downloadingRef.current = false;
            setLoading(false);
        }
    };

    return (
        <div>
            <button
                type="button"
                onClick={handleDownload}
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl font-bold text-sm text-white disabled:opacity-60 disabled:cursor-not-allowed"
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
                    <>
                        <Download className="w-4 h-4" />
                        Download Invoice PDF
                    </>
                )}
            </button>

            {err && (
                <p className="text-xs text-red-400 mt-2 text-center">
                    {err}
                </p>
            )}
        </div>
    );
}


function ConfirmDeleteEnrollmentModal({ row, deleting, onCancel, onConfirm }) {
    return (
        <div
            className="fixed inset-0 z-[70] flex items-center justify-center p-4"
            onClick={!deleting ? onCancel : undefined}
        >
            <div className="absolute inset-0 bg-black/65 backdrop-blur-sm" />

            <motion.div
                initial={{ opacity: 0, scale: 0.94, y: 8 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                className="relative w-full max-w-sm rounded-2xl overflow-hidden"
                style={{
                    background: '#0e0e16',
                    border: '1px solid rgba(239,68,68,0.25)',
                    boxShadow: '0 30px 70px rgba(0,0,0,0.55)',
                }}
                onClick={(e) => e.stopPropagation()}
            >
                <div className="p-6 text-center">
                    <div
                        className="w-12 h-12 rounded-2xl flex items-center justify-center mx-auto mb-4"
                        style={{
                            background: 'rgba(239,68,68,0.1)',
                            border: '1px solid rgba(239,68,68,0.25)',
                        }}
                    >
                        <AlertCircle
                            className="w-5 h-5"
                            style={{ color: '#f87171' }}
                        />
                    </div>

                    <p className="font-bold text-white text-sm mb-1.5">
                        Delete this enrollment?
                    </p>

                    <p className="text-xs text-white/40 leading-relaxed">
                        <span className="font-mono font-bold text-white/70">
                            {row?.enrollment_id}
                        </span>{' '}
                        —{' '}
                        <span className="text-white/60">
                            {row?.customer_name}
                        </span>{' '}
                        will be hidden from this list. This is a soft delete —
                        the record stays safely in the database and can be
                        restored if needed.
                    </p>

                    <div className="flex gap-3 mt-5">
                        <button
                            onClick={onCancel}
                            disabled={deleting}
                            className="flex-1 py-2.5 rounded-xl text-sm text-white/50 hover:text-white transition-all disabled:opacity-50"
                            style={{
                                border: '1px solid rgba(255,255,255,0.08)',
                            }}
                        >
                            Cancel
                        </button>

                        <button
                            onClick={onConfirm}
                            disabled={deleting}
                            className="flex-1 py-2.5 rounded-xl text-sm font-bold text-white flex items-center justify-center gap-2 disabled:opacity-60 transition-all"
                            style={{ background: '#ef4444' }}
                        >
                            {deleting ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                                <Trash2 className="w-3.5 h-3.5" />
                            )}
                            {deleting ? 'Deleting…' : 'Delete'}
                        </button>
                    </div>
                </div>
            </motion.div>
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
    const toast = useToast();
    const navigate = useNavigate();
    const [searchParams, setSearchParams] = useSearchParams();
    const focusId = searchParams.get('focus');
    const [dietCheckingId, setDietCheckingId] = useState(null);

    const [allData, setAllData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const [search, setSearch] = useState('');
    const debouncedSearch = useDebounce(search, 300);

    const [coachingFilter, setCoachingFilter] = useState('all');
    const [planFilter, setPlanFilter] = useState('all');
    const [statusFilter, setStatusFilter] = useState('all');
    const [lifecycleFilter, setLifecycleFilter] = useState(searchParams.get('lifecycle') || 'all');

    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(15);
    const [sort, setSort] = useState({ field: 'created_at', dir: 'desc' });
    const [selectedId, setSelectedId] = useState(focusId || null);
    const [noteTarget, setNoteTarget] = useState(null);
    const [deleteTarget, setDeleteTarget] = useState(null);
    const [deleting, setDeleting] = useState(false);

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
    }, []);

    const handleRefresh = () => {
        _cache.allRows = null;
        _cache.ts = 0;
        fetchData();
    };


    const requestDelete = (row) => setDeleteTarget(row);

    // Resolve on click rather than prefetching for every visible row — jumps
    // straight to the existing plan if one's already linked to this
    // enrollment, otherwise opens the wizard pre-filled with this client.
    const handleDietPlanClick = async (row) => {
        setDietCheckingId(row.id);
        try {
            const existing = await getDietPlanByEnrollment(row.id);
            if (existing) navigate(`/admin/diet-plans/${existing.id}`);
            else navigate('/admin/diet-plans/new', { state: buildDietPrefillFromEnrollment(row) });
        } catch (e) {
            toast.error(e.message || 'Failed to check diet plan.');
        } finally {
            setDietCheckingId(null);
        }
    };

    const confirmDelete = async () => {
        if (!deleteTarget) return;

        const deleteId = deleteTarget.id;
        setDeleting(true);

        try {
            await deleteEnrollmentAdmin(deleteId);

            const patch = (rows) =>
                rows.filter((r) => r.id !== deleteId);

            setAllData(patch);

            if (_cache.allRows) {
                _cache.allRows = patch(_cache.allRows);
            }

            setSelectedId((id) => (id === deleteId ? null : id));
            setDeleteTarget(null);
            toast.success('Enrollment deleted');
        } catch (e) {
            toast.error(e.message || 'Failed to delete enrollment.');
        } finally {
            setDeleting(false);
        }
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

        if (lifecycleFilter !== 'all') {
            rows = rows.filter((r) => {
                const lc = getLifecycleStatus(r);
                if (!lc) return false;
                return lifecycleFilter === 'expiring_soon' ? !!lc.expiringSoon : lc.tag === lifecycleFilter;
            });
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
        lifecycleFilter,
        sort,
    ]);

    useEffect(() => {
        setPage(1);
    }, [
        debouncedSearch,
        coachingFilter,
        planFilter,
        lifecycleFilter,
        statusFilter,
        sort,
        pageSize,
    ]);

    // How many enrollment rows (across the WHOLE dataset, not just the
    // current filter/page) share this row's email or phone — the source of
    // truth for the "N PLANS" badge and for how many periods live "inside"
    // a grouped table row.
    const contactCounts = useMemo(() => {
        const byEmail = new Map();
        const byPhone = new Map();
        for (const r of allData) {
            if (r.customer_email) byEmail.set(r.customer_email, (byEmail.get(r.customer_email) || 0) + 1);
            if (r.customer_phone) byPhone.set(r.customer_phone, (byPhone.get(r.customer_phone) || 0) + 1);
        }
        return { byEmail, byPhone };
    }, [allData]);

    const countForRow = (row) => {
        const counts = [];
        if (row.customer_email) counts.push(contactCounts.byEmail.get(row.customer_email) || 1);
        if (row.customer_phone) counts.push(contactCounts.byPhone.get(row.customer_phone) || 1);
        return counts.length ? Math.max(...counts) : 1;
    };

    // The TABLE shows one row per CUSTOMER, not one row per plan period —
    // easier to scan than seeing the same person twice. `filtered` (above)
    // stays the full, ungrouped, one-row-per-period list: stats cards and
    // exports still read from it, since "how many coupons were used" or an
    // accounting export should reflect every real transaction, not just
    // whichever period happens to represent its customer on screen.
    // Grouping key is email (falling back to phone, then the row's own id
    // so contact-less rows never accidentally merge with one another).
    // Representative = first match in `filtered`'s current sort order, so
    // whatever the admin is sorting by (date, amount, …) is also what
    // decides which of a customer's periods "stands in" for them.
    const groupedFiltered = useMemo(() => {
        const seen = new Set();
        const groups = [];
        for (const row of filtered) {
            const key = row.customer_email || row.customer_phone || row.id;
            if (seen.has(key)) continue;
            seen.add(key);
            groups.push({ ...row, _planCount: countForRow(row) });
        }
        return groups;
    }, [filtered, contactCounts]);

    const totalPages = Math.max(1, Math.ceil(groupedFiltered.length / pageSize));

    const pageData = useMemo(() => {
        const start = (page - 1) * pageSize;
        return groupedFiltered.slice(start, start + pageSize);
    }, [groupedFiltered, page, pageSize]);

    // Same grouping, unfiltered — gives the "X of Y clients" header a
    // like-for-like denominator instead of mixing customer counts with
    // raw period counts.
    const totalCustomerCount = useMemo(() => new Set(
        allData.map((r) => r.customer_email || r.customer_phone || r.id)
    ).size, [allData]);

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
            toast.success('Status updated');
        } catch (e) {
            setError(e.message || 'Failed to update status.');
            toast.error(e.message || 'Failed to update status.');
            fetchData({ silent: true });
        }
    };

    // NEW: patches the list/cache whenever a payment is recorded from
    // inside the detail drawer's PaymentLedgerPanel, so amount_paid /
    // balance_due / payment_plan_status stay correct without a full
    // refetch. `updated` is the full enrollment row returned by the
    // record-payment API.
    const handlePaymentRecorded = useCallback((updatedEnrollment) => {
        if (!updatedEnrollment?.id) return;
        const patch = (rows) =>
            rows.map((r) =>
                r.id === updatedEnrollment.id ? { ...r, ...updatedEnrollment } : r
            );

        setAllData(patch);
        if (_cache.allRows) {
            _cache.allRows = patch(_cache.allRows);
        }
    }, []);

    // "Revenue" means money actually collected — must only count paid rows.
    // This used to sum amount_paid across every row regardless of status, so
    // a pending/failed/refunded enrollment's amount_paid (which can be
    // nonzero — e.g. a payment that later got marked "failed" after the
    // fact) inflated this total above what the Dashboard reports for the
    // same data.
    const totalRevenue = pageData.reduce(
        (sum, r) => sum + (r.payment_status === 'paid' ? (Number(r.amount_paid) || 0) : 0),
        0
    );

    const couponCount = pageData.filter((r) => r.coupon_code).length;
    const coupleCount = pageData.filter((r) => r.plan_type === 'couple').length;
    const partialCount = pageData.filter((r) => r.payment_plan_status === 'partial').length;

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
                toast.error('No data to export for the selected filters.');
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
                    total_amount: r.total_amount || r.amount_paid || 0,
                    balance_due: r.balance_due || 0,
                    original_amount: r.original_amount || r.amount_paid || 0,
                    coupon_code: r.coupon_code || '',
                    coupon_savings: r.coupon_savings || 0,
                    payment_status: r.payment_status || '',
                    payment_plan_status: r.payment_plan_status || '',
                    source: r.source || 'website',
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
                // Dynamic import: xlsx is fairly heavy and only needed for
                // this one export path, not every admin page that happens
                // to import adminUtils.js for its formatters.
                const { exportEnrollmentsToExcel } = await import('../adminExcelExport');
                exportEnrollmentsToExcel(allRows, {
                    dateFrom: range?.from,
                    dateTo: range?.to,
                });
            } else if (format === 'pdf') {
                // Dynamic import: same reasoning — jsPDF only needed here.
                const { exportEnrollmentsToPDF } = await import('../adminPdfExport');
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

            toast.success(`Exported ${allRows.length} record${allRows.length !== 1 ? 's' : ''} as ${format.toUpperCase()}`);
        } catch (e) {
            setError(e.message || 'Export failed. Please try again.');
            toast.error(e.message || 'Export failed. Please try again.');
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
                        {groupedFiltered.length !== totalCustomerCount
                            ? `${groupedFiltered.length} of ${totalCustomerCount} clients`
                            : `${totalCustomerCount} total clients`}
                        {filtered.length !== groupedFiltered.length && ` · ${filtered.length} enrollment records`}
                    </p>
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                    <Link
                        to="/admin/manual-enrollment"
                        className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold text-white"
                        style={{ background: '#e71763', boxShadow: '0 0 20px rgba(231,23,99,0.3)' }}
                    >
                        <UserPlus className="w-3.5 h-3.5" /> Manual Enrollment
                    </Link>
                    <button
                        onClick={handleRefresh}
                        className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs text-white/50 hover:text-white transition-all"
                        style={{ border: '1px solid rgba(255,255,255,0.08)' }}
                    >
                        <RefreshCw
                            className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''
                                }`}
                        />
                        Refresh
                    </button>

                    <ExportMenu onExport={handleExport} label="Export Data" />
                </div>
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 mb-6">
                <StatCard
                    label="Showing"
                    value={`${pageData.length} / ${groupedFiltered.length}`}
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

                <StatCard
                    label="Partial Payments"
                    value={partialCount}
                    sub={partialCount ? 'balance still due' : 'none on this page'}
                    color={partialCount ? '#fbbf24' : '#34d399'}
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

                <FilterDropdown
                    value={lifecycleFilter}
                    onChange={setLifecycleFilter}
                    options={LIFECYCLE_FILTERS}
                    minWidth={165}
                    getBadge={(value) =>
                        value === 'all'
                            ? {
                                bg: 'rgba(255,255,255,0.05)',
                                border: 'rgba(255,255,255,0.1)',
                                color: 'rgba(255,255,255,0.65)',
                            }
                            : value === 'expiring_soon'
                                ? { bg: 'rgba(251,191,36,0.1)', border: 'rgba(251,191,36,0.3)', color: '#fbbf24' }
                                : lifecycleBadge(value)
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
                                    const isPartial = row.payment_plan_status === 'partial';

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
                                                    {fmtName(row.customer_name)}
                                                </p>

                                                <p className="text-[11px] text-white/35">
                                                    {row.customer_email}
                                                </p>

                                                {(hasNote || row.source === 'manual' || countForRow(row) > 1) && (
                                                    <div className="flex items-center gap-1 mt-1">
                                                        {hasNote && (
                                                            <span
                                                                className="inline-flex items-center gap-1 text-[9px] font-bold px-1.5 py-0.5 rounded-full leading-none"
                                                                style={{
                                                                    background: 'rgba(231,23,99,0.1)',
                                                                    color: '#e71763',
                                                                }}
                                                            >
                                                                <StickyNote className="w-2.5 h-2.5" />
                                                                NOTE
                                                            </span>
                                                        )}

                                                        {row.source === 'manual' && (
                                                            <span
                                                                className="inline-flex items-center gap-1 text-[9px] font-bold px-1.5 py-0.5 rounded-full leading-none"
                                                                style={{
                                                                    background: 'rgba(96,165,250,0.1)',
                                                                    color: '#60a5fa',
                                                                }}
                                                            >
                                                                MANUAL
                                                            </span>
                                                        )}

                                                        {countForRow(row) > 1 && (
                                                            <button
                                                                onClick={() => setSelectedId(row.id)}
                                                                className="inline-flex items-center gap-1 text-[9px] font-bold px-1.5 py-0.5 rounded-full leading-none transition-colors hover:brightness-125"
                                                                style={{
                                                                    background: 'rgba(167,139,250,0.1)',
                                                                    border: '1px solid rgba(167,139,250,0.25)',
                                                                    color: '#a78bfa',
                                                                }}
                                                                title={`This client has ${countForRow(row)} plans on record — showing their most recent here. Click to see all of them.`}
                                                            >
                                                                {countForRow(row)} PLANS <ChevronDown className="w-2.5 h-2.5 -rotate-90" />
                                                            </button>
                                                        )}
                                                    </div>
                                                )}
                                            </td>

                                            <td className="px-4 py-3">
                                                <span className="text-xs font-medium text-white/60">
                                                    {formatLabel(row.coaching_type)}
                                                </span>
                                            </td>

                                            <td className="px-4 py-3">
                                                <span className="text-xs text-white/60">
                                                    {formatLabel(row.plan_type)}
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

                                                {isPartial && (
                                                    <p
                                                        className="text-[10px] font-bold"
                                                        style={{ color: '#fbbf24' }}
                                                    >
                                                        Partial · {fmtCurrency(row.balance_due)} due
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
                                                {(() => {
                                                    const lc = getLifecycleStatus(row);
                                                    if (!lc) return null;
                                                    const b = lifecycleBadge(lc.tag);
                                                    return (
                                                        <div className="flex items-center gap-1.5 mt-2 pl-0.5">
                                                            <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: b.color }} />
                                                            <span className="text-[10px] font-semibold" style={{ color: b.color }}>
                                                                {lc.label}
                                                            </span>
                                                            {lc.tag !== 'expired' && lc.expiringSoon && (
                                                                <span className="text-[10px]" style={{ color: '#fbbf24' }}>
                                                                    · {lc.daysRemaining}d left
                                                                </span>
                                                            )}
                                                        </div>
                                                    );
                                                })()}
                                            </td>

                                            <td className="px-4 py-3">
                                                <p className="text-xs text-white/50">
                                                    {fmtDateTime(row.payment_date)}
                                                </p>
                                            </td>

                                            <td className="px-4 py-3">
                                                <div className="flex items-center gap-1.5">
                                                    <button
                                                        onClick={() =>
                                                            setSelectedId(row.id)
                                                        }
                                                        className="w-7 h-7 rounded-lg flex items-center justify-center text-white/35 hover:text-white hover:bg-white/8 transition-all"
                                                        title="View details & payment history"
                                                    >
                                                        <Eye className="w-3.5 h-3.5" />
                                                    </button>

                                                    <button
                                                        onClick={() => handleDietPlanClick(row)}
                                                        disabled={dietCheckingId === row.id}
                                                        className="w-7 h-7 rounded-lg flex items-center justify-center text-white/35 hover:text-white hover:bg-white/8 transition-all disabled:opacity-50"
                                                        title="Diet plan"
                                                    >
                                                        {dietCheckingId === row.id
                                                            ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                                            : <Salad className="w-3.5 h-3.5" />}
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

                                                    <EmailSendMenu
                                                        compact
                                                        hasCustomerEmail={!!row.customer_email}
                                                        onSend={async (template) => {
                                                            try {
                                                                await sendEnrollmentEmail(row.id, template);
                                                                toast.success('Email sent successfully');
                                                            } catch (e) {
                                                                setError('Failed to send email.');
                                                                toast.error(e.message || 'Failed to send email.');
                                                            }
                                                        }}
                                                    />

                                                    <button
                                                        onClick={() => requestDelete(row)}
                                                        className="w-7 h-7 rounded-lg flex items-center justify-center text-white/35 hover:text-red-400 hover:bg-red-500/8 transition-all"
                                                        title="Delete enrollment"
                                                    >
                                                        <Trash2 className="w-3.5 h-3.5" />
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

                {!loading && (
                    <PaginationBar
                        page={page}
                        totalPages={totalPages}
                        totalItems={groupedFiltered.length}
                        pageSize={pageSize}
                        onPageChange={setPage}
                        onPageSizeChange={(n) => { setPageSize(n); setPage(1); }}
                    />
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
                        onPaymentRecorded={handlePaymentRecorded}
                        onNavigateToEnrollment={(id) => {
                            handleRefresh();
                            setSelectedId(id);
                        }}
                        onEnrollmentDeleted={(id) => {
                            const patch = (rows) => rows.filter((r) => r.id !== id);
                            setAllData(patch);
                            if (_cache.allRows) {
                                _cache.allRows = patch(_cache.allRows);
                            }
                            setSelectedId((cur) => (cur === id ? null : cur));
                        }}
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

            <AnimatePresence>
                {deleteTarget && (
                    <ConfirmDeleteEnrollmentModal
                        row={deleteTarget}
                        deleting={deleting}
                        onCancel={() => !deleting && setDeleteTarget(null)}
                        onConfirm={confirmDelete}
                    />
                )}
            </AnimatePresence>
        </div>
    );
}
/**
 * src/pages/admin/AdminAssessments.jsx
 *
 * Assessments dashboard — lists onboarding submissions, lets Sudarshan
 * review photos, change status, and add shared notes.
 *
 * Changes:
 *  - Client-side filter / sort / paginate — no API calls on tab/sort/filter
 *  - Fetches ALL rows once (pageSize: 9999), caches in module-level _cache
 *  - Status & note changes patch local state + cache in-place (no refetch)
 *  - Custom StatusSelect for table + drawer status updates
 *  - Custom FilterDropdown for top Status and Plan filters
 *  - Header: Refresh + Export grouped, vertically centred
 *  - Standalone "Reviewed" flag (separate from status pipeline) — drives
 *    the dashboard's "Today's To-Do" list
 *  - Toast notifications on save/update/export actions
 *  - Reviewed/Pending badge now uses distinct icon + color per state so
 *    "Pending" no longer reads as a false checkmark
 */

import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSearchParams } from 'react-router-dom';
import {
    Search,
    RefreshCw,
    X,
    Eye,
    StickyNote,
    ChevronDown,
    ChevronUp,
    ChevronLeft,
    ChevronRight,
    Save,
    Loader2,
    Check,
    Circle,
    AlertCircle,
    Copy,
    Dumbbell,
    Utensils,
    Heart,
    Camera,
    MessageCircle,
    ExternalLink,
    FileText,
    Download,
} from 'lucide-react';

import {
    fmtDate,
    fmtRelativeTime,
    statusBadge,
    ASSESSMENT_STATUSES,
    exportAssessmentsToExcel,
    exportAssessmentsToPDF,
    exportToCSV,
    exportSingleAssessmentToExcel,
} from './adminUtils';

import { useDebounce } from './useDebounce';
import ExportMenu from './ExportMenu';
import { useToast } from './ToastProvider';

import {
    fetchAssessments,
    fetchAssessment,
    setAssessmentStatus,
    setAssessmentReviewed,
    saveNote,
    exportAssessmentsAll,
} from './adminApi';

const PAGE_SIZE = 20;
const CACHE_TTL = 60_000;

const PLANS = [
    'all',
    'Online Coaching',
    'Video Coaching',
    'Mumbai Personal Training',
    'Couple Plan',
];

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

function ReviewedToggle({ reviewed, onChange, disabled }) {
    return (
        <button
            type="button"
            disabled={disabled}
            onClick={() => onChange(!reviewed)}
            className="flex items-center gap-1.5 text-[10px] font-bold px-2.5 py-1 rounded-full transition-all disabled:opacity-50 whitespace-nowrap"
            style={{
                background: reviewed ? 'rgba(52,211,153,0.1)' : 'rgba(251,191,36,0.08)',
                border: `1px solid ${reviewed ? 'rgba(52,211,153,0.3)' : 'rgba(251,191,36,0.25)'}`,
                color: reviewed ? '#34d399' : '#fbbf24',
            }}
            title={reviewed ? 'Marked as reviewed — click to undo' : 'Not reviewed yet — click to mark reviewed'}
        >
            {reviewed ? (
                <Check className="w-3 h-3 flex-shrink-0" />
            ) : (
                <Circle className="w-2 h-2 flex-shrink-0" style={{ fill: '#fbbf24', stroke: 'none' }} />
            )}
            {reviewed ? 'Reviewed' : 'Pending'}
        </button>
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
                    background:
                        activeOption.value === 'all'
                            ? 'rgba(255,255,255,0.05)'
                            : activeBadge.bg,
                    border:
                        activeOption.value === 'all'
                            ? '1px solid rgba(255,255,255,0.1)'
                            : `1px solid ${activeBadge.border}`,
                    color:
                        activeOption.value === 'all'
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

function CommitmentRing({ score }) {
    if (!score && score !== 0) {
        return <span className="text-white/25 text-xs">—</span>;
    }

    const pct = (score / 10) * 100;
    const color = score >= 8 ? '#34d399' : score >= 5 ? '#fbbf24' : '#f87171';

    return (
        <div className="flex items-center gap-1.5">
            <svg width="28" height="28" viewBox="0 0 28 28">
                <circle
                    cx="14"
                    cy="14"
                    r="11"
                    fill="none"
                    stroke="rgba(255,255,255,0.07)"
                    strokeWidth="3"
                />

                <circle
                    cx="14"
                    cy="14"
                    r="11"
                    fill="none"
                    stroke={color}
                    strokeWidth="3"
                    strokeDasharray={`${pct * 0.69} 69`}
                    strokeLinecap="round"
                    transform="rotate(-90 14 14)"
                />
            </svg>

            <span className="text-xs font-bold" style={{ color }}>
                {score}/10
            </span>
        </div>
    );
}

function StatusSelect({ value, onChange, disabled }) {
    const [open, setOpen] = useState(false);
    const ref = useRef(null);
    const badge = statusBadge(value || 'new');

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
                    {formatLabel(value || 'new')}
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
                        {ASSESSMENT_STATUSES.map((s) => {
                            const b = statusBadge(s);
                            const isActive = s === (value || 'new');

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
            const note = await saveNote('assessment', recordId, text);
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

                    <button
                        onClick={onClose}
                        className="text-white/30 hover:text-white transition-colors"
                    >
                        <X className="w-4 h-4" />
                    </button>
                </div>

                <div className="p-5">
                    <textarea
                        value={text}
                        onChange={(e) => setText(e.target.value)}
                        placeholder="Add a note about this client… (e.g. plan sent on WhatsApp, waiting for check-in)"
                        rows={5}
                        className="w-full rounded-xl px-4 py-3 text-sm text-white placeholder:text-white/25 resize-none outline-none leading-relaxed"
                        style={{
                            background: 'rgba(255,255,255,0.05)',
                            border: '1px solid rgba(255,255,255,0.1)',
                        }}
                        autoFocus
                    />

                    {currentNote && (
                        <p className="text-[10px] text-white/25 mt-2">
                            Last updated {fmtDate(currentNote.updatedAt, true)} · visible
                            to all admins
                        </p>
                    )}

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
                            className="flex-1 py-2.5 rounded-xl text-sm font-bold text-white flex items-center justify-center gap-2 disabled:opacity-60 transition-all"
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

function PhotoViewer({ url, label }) {
    const [open, setOpen] = useState(false);

    if (!url) {
        return (
            <div
                className="flex flex-col items-center justify-center rounded-xl py-6 gap-2"
                style={{
                    background: 'rgba(255,255,255,0.03)',
                    border: '1px dashed rgba(255,255,255,0.08)',
                }}
            >
                <Camera className="w-5 h-5 text-white/15" />
                <p className="text-[10px] text-white/20">{label} — not uploaded</p>
            </div>
        );
    }

    const isPdf = url.includes('.pdf') || url.includes('blood-report');

    return (
        <>
            <div
                className="relative group cursor-pointer rounded-xl overflow-hidden"
                style={{ border: '1px solid rgba(255,255,255,0.08)' }}
                onClick={() => setOpen(true)}
            >
                {isPdf ? (
                    <div
                        className="flex flex-col items-center justify-center py-8 gap-2"
                        style={{ background: 'rgba(231,23,99,0.04)' }}
                    >
                        <FileText className="w-8 h-8" style={{ color: '#e71763' }} />
                        <p className="text-xs text-white/50 font-medium">
                            {label} (PDF)
                        </p>
                    </div>
                ) : (
                    <img
                        src={url}
                        alt={label}
                        className="w-full object-cover group-hover:scale-105 transition-transform duration-300"
                        style={{
                            maxHeight: 200,
                            objectPosition: 'center top',
                        }}
                    />
                )}

                <div className="absolute inset-0 flex items-center justify-center bg-black/0 group-hover:bg-black/40 transition-all opacity-0 group-hover:opacity-100">
                    <div
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold text-white"
                        style={{
                            background: 'rgba(231,23,99,0.85)',
                            backdropFilter: 'blur(8px)',
                        }}
                    >
                        <ExternalLink className="w-3 h-3" />
                        {isPdf ? 'Open PDF' : 'View Full'}
                    </div>
                </div>

                <div
                    className="absolute bottom-0 left-0 right-0 px-3 py-2"
                    style={{
                        background:
                            'linear-gradient(to top, rgba(0,0,0,0.7), transparent)',
                    }}
                >
                    <p className="text-[10px] text-white/60 font-semibold">
                        {label}
                    </p>
                </div>
            </div>

            <AnimatePresence>
                {open && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/90"
                        onClick={() => setOpen(false)}
                    >
                        <motion.div
                            initial={{ scale: 0.9 }}
                            animate={{ scale: 1 }}
                            exit={{ scale: 0.9 }}
                            className="relative max-w-2xl w-full max-h-[90vh]"
                            onClick={(e) => e.stopPropagation()}
                        >
                            {isPdf ? (
                                <a
                                    href={url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center justify-center gap-3 py-12 rounded-2xl text-white font-bold"
                                    style={{
                                        background: 'rgba(255,255,255,0.05)',
                                        border: '1px solid rgba(255,255,255,0.1)',
                                    }}
                                >
                                    <FileText
                                        className="w-8 h-8"
                                        style={{ color: '#e71763' }}
                                    />
                                    Open PDF in new tab
                                </a>
                            ) : (
                                <img
                                    src={url}
                                    alt={label}
                                    className="w-full h-full object-contain rounded-2xl"
                                />
                            )}

                            <button
                                onClick={() => setOpen(false)}
                                className="absolute -top-4 -right-4 w-8 h-8 rounded-full flex items-center justify-center text-white/60 hover:text-white"
                                style={{
                                    background: 'rgba(255,255,255,0.1)',
                                    border: '1px solid rgba(255,255,255,0.15)',
                                }}
                            >
                                <X className="w-4 h-4" />
                            </button>



                            <a
                                href={url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="absolute -bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-bold text-white"
                                style={{ background: '#e71763' }}
                            >
                                <ExternalLink className="w-3 h-3" />
                                Open original
                            </a>
                        </motion.div>
                    </motion.div >
                )
                }
            </AnimatePresence >
        </>
    );
}

function DetailDrawer({ assessmentId, onClose, onNoteClick, onStatusChange, onReviewedChange }) {
    const [assessment, setAssessment] = useState(null);
    const [loading, setLoading] = useState(true);
    const [copied, setCopied] = useState('');

    useEffect(() => {
        let cancelled = false;

        fetchAssessment(assessmentId)
            .then((a) => {
                if (!cancelled) setAssessment(a);
            })
            .finally(() => {
                if (!cancelled) setLoading(false);
            });

        return () => {
            cancelled = true;
        };
    }, [assessmentId]);

    const copy = (val, key) => {
        navigator.clipboard.writeText(val).catch(() => { });
        setCopied(key);
        setTimeout(() => setCopied(''), 1500);
    };

    const dl = (label, value) => (
        <div
            className="flex items-start justify-between gap-4 py-2.5"
            style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}
        >
            <span className="text-xs text-white/35 flex-shrink-0 w-36">
                {label}
            </span>

            <span className="text-xs text-white text-right font-medium flex-1 leading-relaxed">
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
                className="relative w-full max-w-lg h-full overflow-y-auto"
                style={{
                    background: '#0a0a14',
                    borderLeft: '1px solid rgba(255,255,255,0.08)',
                }}
                onClick={(e) => e.stopPropagation()}
            >
                <div
                    className="sticky top-0 z-10 flex items-center justify-between px-5 py-4"
                    style={{
                        background: 'rgba(10,10,20,0.97)',
                        borderBottom: '1px solid rgba(255,255,255,0.06)',
                        backdropFilter: 'blur(20px)',
                    }}
                >
                    <div>
                        <p className="font-black text-white text-sm">
                            {assessment
                                ? `${assessment.first_name} ${assessment.last_name || ''
                                    }`.trim()
                                : '…'}
                        </p>

                        <p className="text-[10px] text-white/35 mt-0.5">
                            {assessment?.plan || 'Loading…'}
                        </p>
                    </div>

                    <div className="flex items-center gap-2">
                        {assessment && (
                            <>
                                <button
                                    onClick={() => onNoteClick(assessment)}
                                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all"
                                    style={{
                                        background: 'rgba(231,23,99,0.1)',
                                        border: '1px solid rgba(231,23,99,0.2)',
                                        color: '#e71763',
                                    }}
                                >
                                    <StickyNote className="w-3 h-3" />
                                    {assessment.note ? 'Edit Note' : 'Add Note'}
                                </button>

                                {assessment.whatsapp && (
                                    <a
                                        href={`https://wa.me/${assessment.whatsapp.replace(/\D/g, '')}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors"
                                        style={{
                                            background: 'rgba(37,211,102,0.12)',
                                            border: '1px solid rgba(37,211,102,0.2)',
                                        }}
                                        title="Open WhatsApp"
                                    >
                                        <MessageCircle
                                            className="w-3.5 h-3.5"
                                            style={{ color: '#25D366' }}
                                        />
                                    </a>
                                )}
                            </>
                        )}

                        {assessment && (
                            <button
                                onClick={() => exportSingleAssessmentToExcel(assessment)}
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
                        )}

                        <button
                            onClick={onClose}
                            className="w-8 h-8 rounded-lg flex items-center justify-center text-white/30 hover:text-white hover:bg-white/5 transition-all"
                        >
                            <X className="w-4 h-4" />
                        </button>
                    </div>
                </div>

                {
                    loading || !assessment ? (
                        <div className="flex items-center justify-center py-24">
                            <Loader2 className="w-5 h-5 animate-spin text-white/25" />
                        </div>
                    ) : (
                        <div className="p-5 space-y-6">
                            {assessment.note && (
                                <div
                                    className="rounded-xl p-4"
                                    style={{
                                        background: 'rgba(231,23,99,0.06)',
                                        border: '1px solid rgba(231,23,99,0.15)',
                                    }}
                                >
                                    <div className="flex items-center justify-between mb-2">
                                        <div className="flex items-center gap-2">
                                            <StickyNote
                                                className="w-3.5 h-3.5"
                                                style={{ color: '#e71763' }}
                                            />

                                            <p
                                                className="text-[10px] font-bold uppercase tracking-widest"
                                                style={{ color: '#e71763' }}
                                            >
                                                Coach Note
                                            </p>
                                        </div>

                                        <p className="text-[10px] text-white/25">
                                            {fmtDate(assessment.note.updatedAt, true)}
                                        </p>
                                    </div>

                                    <p className="text-xs text-white/60 leading-relaxed">
                                        {assessment.note.text}
                                    </p>
                                </div>
                            )}

                            <div className="grid grid-cols-3 gap-3">
                                <div
                                    className="rounded-xl p-4"
                                    style={{
                                        background: 'rgba(255,255,255,0.03)',
                                        border: '1px solid rgba(255,255,255,0.07)',
                                    }}
                                >
                                    <p className="text-[10px] text-white/30 uppercase tracking-widest mb-3">
                                        Status
                                    </p>

                                    <StatusSelect
                                        value={assessment.status || 'new'}
                                        onChange={(s) => {
                                            onStatusChange(assessment.id, s);
                                            setAssessment((prev) => ({
                                                ...prev,
                                                status: s,
                                            }));
                                        }}
                                    />
                                </div>

                                <div
                                    className="rounded-xl p-4"
                                    style={{
                                        background: 'rgba(255,255,255,0.03)',
                                        border: '1px solid rgba(255,255,255,0.07)',
                                    }}
                                >
                                    <p className="text-[10px] text-white/30 uppercase tracking-widest mb-3">
                                        Reviewed
                                    </p>

                                    <ReviewedToggle
                                        reviewed={!!assessment.reviewed}
                                        onChange={(v) => {
                                            onReviewedChange(assessment.id, v);
                                            setAssessment((prev) => ({
                                                ...prev,
                                                reviewed: v,
                                            }));
                                        }}
                                    />
                                </div>

                                <div
                                    className="rounded-xl p-4 flex flex-col items-center justify-center text-center"
                                    style={{
                                        background: 'rgba(255,255,255,0.03)',
                                        border: '1px solid rgba(255,255,255,0.07)',
                                    }}
                                >
                                    <p className="text-[10px] text-white/30 uppercase tracking-widest mb-2">
                                        Commitment
                                    </p>

                                    <CommitmentRing score={assessment.commitment} />
                                </div>
                            </div>

                            <section>
                                <p
                                    className="text-[10px] font-black uppercase tracking-widest mb-3"
                                    style={{ color: '#e71763' }}
                                >
                                    Assessment Photos
                                </p>

                                <div className="grid grid-cols-2 gap-3">
                                    <PhotoViewer
                                        url={assessment.photoFrontUrl}
                                        label="Front Photo"
                                    />
                                    <PhotoViewer
                                        url={assessment.photoSideUrl}
                                        label="Side Photo"
                                    />
                                </div>

                                {assessment.bloodReportUrl && (
                                    <div className="mt-3">
                                        <PhotoViewer
                                            url={assessment.bloodReportUrl}
                                            label="Blood Report"
                                        />
                                    </div>
                                )}

                                <p className="text-[10px] text-white/20 mt-2 text-center">
                                    Signed links — expire in 7 days for privacy
                                </p>
                            </section>

                            <section>
                                <p
                                    className="text-[10px] font-black uppercase tracking-widest mb-3"
                                    style={{ color: '#e71763' }}
                                >
                                    Personal Details
                                </p>

                                <div
                                    className="rounded-xl overflow-hidden"
                                    style={{
                                        background: 'rgba(255,255,255,0.02)',
                                        border: '1px solid rgba(255,255,255,0.06)',
                                    }}
                                >
                                    <div className="px-4">
                                        {dl(
                                            'Full Name',
                                            `${assessment.first_name} ${assessment.last_name || ''
                                                }`.trim()
                                        )}
                                        {dl('WhatsApp', assessment.whatsapp)}
                                        {assessment.email && dl('Email', assessment.email)}
                                        {dl(
                                            'Age / Gender',
                                            `${assessment.age || '—'} yrs · ${assessment.gender || '—'
                                            }`
                                        )}
                                        {dl('City', assessment.city)}
                                        {dl('Plan', assessment.plan)}
                                        {dl('Profession', assessment.profession)}
                                        {dl('Submitted', fmtDate(assessment.created_at))}
                                    </div>
                                </div>
                            </section>

                            <section>
                                <p
                                    className="text-[10px] font-black uppercase tracking-widest mb-3"
                                    style={{ color: '#e71763' }}
                                >
                                    <span className="inline-flex items-center gap-1">
                                        <Dumbbell className="w-3 h-3" />
                                        Fitness Profile
                                    </span>
                                </p>

                                <div
                                    className="rounded-xl overflow-hidden"
                                    style={{
                                        background: 'rgba(255,255,255,0.02)',
                                        border: '1px solid rgba(255,255,255,0.06)',
                                    }}
                                >
                                    <div className="px-4">
                                        {dl(
                                            'Weight / Height',
                                            `${assessment.current_weight || '—'} kg · ${assessment.height || '—'
                                            } cm`
                                        )}
                                        {dl('Workout Status', assessment.workout_status)}
                                        {dl('Training Days/Week', assessment.training_days)}
                                        {dl(
                                            'Training Location',
                                            assessment.training_location
                                        )}
                                    </div>
                                </div>
                            </section>

                            <section>
                                <p
                                    className="text-[10px] font-black uppercase tracking-widest mb-3"
                                    style={{ color: '#e71763' }}
                                >
                                    Goals & Motivation
                                </p>

                                <div className="space-y-3">
                                    {[
                                        {
                                            label: 'Main Goal',
                                            value: assessment.main_goal,
                                        },
                                        {
                                            label: 'Desired Result',
                                            value: assessment.desired_result,
                                        },
                                        {
                                            label: 'Why Now',
                                            value: assessment.why_now,
                                        },
                                    ].map(({ label, value }) => (
                                        <div
                                            key={label}
                                            className="rounded-xl p-4"
                                            style={{
                                                background: 'rgba(255,255,255,0.02)',
                                                border: '1px solid rgba(255,255,255,0.06)',
                                            }}
                                        >
                                            <p className="text-[10px] text-white/30 uppercase tracking-widest mb-1.5">
                                                {label}
                                            </p>

                                            <p className="text-xs text-white/70 leading-relaxed">
                                                {value || '—'}
                                            </p>
                                        </div>
                                    ))}
                                </div>
                            </section>

                            <section>
                                <p
                                    className="text-[10px] font-black uppercase tracking-widest mb-3"
                                    style={{ color: '#e71763' }}
                                >
                                    <span className="inline-flex items-center gap-1">
                                        <Utensils className="w-3 h-3" />
                                        Nutrition & Lifestyle
                                    </span>
                                </p>

                                <div
                                    className="rounded-xl overflow-hidden"
                                    style={{
                                        background: 'rgba(255,255,255,0.02)',
                                        border: '1px solid rgba(255,255,255,0.06)',
                                    }}
                                >
                                    <div className="px-4">
                                        {dl('Food Preference', assessment.food_preference)}
                                        {dl(
                                            'Sleep / Night',
                                            `${assessment.sleep_hours || '—'} hrs`
                                        )}
                                    </div>
                                </div>

                                <div
                                    className="mt-3 rounded-xl p-4"
                                    style={{
                                        background: 'rgba(255,255,255,0.02)',
                                        border: '1px solid rgba(255,255,255,0.06)',
                                    }}
                                >
                                    <p className="text-[10px] text-white/30 uppercase tracking-widest mb-1.5">
                                        Daily Food Routine
                                    </p>

                                    <p className="text-xs text-white/60 leading-relaxed whitespace-pre-line">
                                        {assessment.daily_food_routine || '—'}
                                    </p>
                                </div>

                                <div
                                    className="mt-3 rounded-xl p-4"
                                    style={{
                                        background: 'rgba(255,255,255,0.02)',
                                        border: '1px solid rgba(255,255,255,0.06)',
                                    }}
                                >
                                    <p className="text-[10px] text-white/30 uppercase tracking-widest mb-1.5">
                                        Biggest Struggle
                                    </p>

                                    <p className="text-xs text-white/60 leading-relaxed">
                                        {assessment.biggest_struggle || '—'}
                                    </p>
                                </div>
                            </section>

                            {assessment.medical_conditions && (
                                <section>
                                    <p
                                        className="text-[10px] font-black uppercase tracking-widest mb-3"
                                        style={{ color: '#e71763' }}
                                    >
                                        <span className="inline-flex items-center gap-1">
                                            <Heart className="w-3 h-3" />
                                            Health Background
                                        </span>
                                    </p>

                                    <div
                                        className="rounded-xl p-4"
                                        style={{
                                            background: 'rgba(255,255,255,0.02)',
                                            border: '1px solid rgba(255,255,255,0.06)',
                                        }}
                                    >
                                        <p className="text-xs text-white/60 leading-relaxed">
                                            {assessment.medical_conditions}
                                        </p>
                                    </div>
                                </section>
                            )}

                            {assessment.whatsapp && (
                                <a
                                    href={`https://wa.me/${assessment.whatsapp.replace(
                                        /\D/g,
                                        ''
                                    )}?text=Hi%20${encodeURIComponent(
                                        assessment.first_name
                                    )}%2C%20I%27ve%20reviewed%20your%20RECODE%E2%84%A2%20assessment.%20Here%20are%20your%20next%20steps%3A`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center justify-center gap-2 w-full py-3.5 rounded-xl font-bold text-sm text-white"
                                    style={{
                                        background: '#25D366',
                                        boxShadow: '0 0 20px rgba(37,211,102,0.25)',
                                    }}
                                >
                                    <MessageCircle className="w-4 h-4" />
                                    Message {assessment.first_name} on WhatsApp
                                </a>
                            )}
                        </div >
                    )
                }
            </motion.div >
        </div >
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

function StatCard({ label, value, color }) {
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

            <p className="text-2xl font-black" style={{ color }}>
                {value}
            </p>
        </div>
    );
}

export default function AdminAssessments() {
    const toast = useToast();
    const [searchParams, setSearchParams] = useSearchParams();
    const focusId = searchParams.get('focus');

    const [allData, setAllData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const [statusFilter, setStatusFilter] = useState('all');
    const [planFilter, setPlanFilter] = useState('all');
    const [page, setPage] = useState(1);
    const [sort, setSort] = useState({ field: 'created_at', dir: 'desc' });
    const [search, setSearch] = useState('');
    const debouncedSearch = useDebounce(search, 300);

    const [selectedId, setSelectedId] = useState(focusId || null);
    const [noteTarget, setNoteTarget] = useState(null);

    const statusOptions = useMemo(
        () => [
            { value: 'all', label: 'All Statuses' },
            ...ASSESSMENT_STATUSES.map((status) => ({
                value: status,
                label: formatLabel(status),
            })),
        ],
        []
    );

    const planOptions = useMemo(
        () =>
            PLANS.map((plan) => ({
                value: plan,
                label: plan === 'all' ? 'All Plans' : plan,
            })),
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
            const res = await fetchAssessments({ pageSize: 9999 });
            const rows = res.rows || [];

            _cache.allRows = rows;
            _cache.ts = Date.now();

            setAllData(rows);
        } catch (e) {
            setError(e.message || 'Failed to load assessments');
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
                `${r.first_name ?? ''} ${r.last_name ?? ''}`
                    .toLowerCase()
                    .includes(q) ||
                (r.whatsapp ?? '').includes(q) ||
                (r.email ?? '').toLowerCase().includes(q) ||
                (r.city ?? '').toLowerCase().includes(q)
            );
        }

        if (statusFilter !== 'all') {
            rows = rows.filter((r) => (r.status || 'new') === statusFilter);
        }

        if (planFilter !== 'all') {
            rows = rows.filter((r) => r.plan === planFilter);
        }

        rows = [...rows].sort((a, b) => {
            const aVal = a[sort.field] ?? '';
            const bVal = b[sort.field] ?? '';

            const cmp =
                typeof aVal === 'number' && typeof bVal === 'number'
                    ? aVal - bVal
                    : String(aVal).localeCompare(String(bVal));

            return sort.dir === 'asc' ? cmp : -cmp;
        });

        return rows;
    }, [allData, debouncedSearch, statusFilter, planFilter, sort]);

    useEffect(() => {
        setPage(1);
    }, [debouncedSearch, statusFilter, planFilter, sort]);

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
            rows.map((r) => (r.id === id ? { ...r, status: newStatus } : r));

        setAllData(patch);

        if (_cache.allRows) {
            _cache.allRows = patch(_cache.allRows);
        }

        try {
            await setAssessmentStatus(id, newStatus);
            toast.success('Status updated');
        } catch (e) {
            setError(e.message || 'Failed to update status.');
            toast.error(e.message || 'Failed to update status.');
            fetchData({ silent: true });
        }
    };

    const handleReviewedChange = async (id, reviewed) => {
        const patch = (rows) =>
            rows.map((r) => (r.id === id ? { ...r, reviewed } : r));

        setAllData(patch);

        if (_cache.allRows) {
            _cache.allRows = patch(_cache.allRows);
        }

        try {
            await setAssessmentReviewed(id, reviewed);
            toast.success(reviewed ? 'Marked as reviewed' : 'Marked as pending');
        } catch (e) {
            setError(e.message || 'Failed to update reviewed flag.');
            toast.error(e.message || 'Failed to update reviewed flag.');
            fetchData({ silent: true });
        }
    };

    const handleExport = async (format, range) => {
        try {
            let allRows;

            if (range?.from || range?.to) {
                allRows = await exportAssessmentsAll({
                    search: debouncedSearch,
                    status: statusFilter,
                    plan: planFilter,
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
                    id: r.id,
                    first_name: r.first_name,
                    last_name: r.last_name,
                    whatsapp: r.whatsapp,
                    email: r.email,
                    age: r.age,
                    gender: r.gender,
                    city: r.city,
                    plan: r.plan,
                    main_goal: r.main_goal,
                    workout_status: r.workout_status,
                    commitment: r.commitment,
                    status: r.status,
                    reviewed: r.reviewed ? 'Yes' : 'No',
                    created_at: r.created_at,
                }));

                exportToCSV(
                    mapped,
                    `recode-assessments-${new Date().toISOString().slice(0, 10)}`
                );
            } else if (format === 'excel') {
                exportAssessmentsToExcel(allRows, {
                    dateFrom: range?.from,
                    dateTo: range?.to,
                });
            } else if (format === 'pdf') {
                exportAssessmentsToPDF(allRows, {
                    dateFrom: range?.from,
                    dateTo: range?.to,
                });
            }

            toast.success(`Exported ${allRows.length} record${allRows.length !== 1 ? 's' : ''} as ${format.toUpperCase()}`);
        } catch (e) {
            setError(e.message || 'Export failed. Please try again.');
            toast.error(e.message || 'Export failed. Please try again.');
        }
    };

    const newCount = pageData.filter((r) => r.status === 'new').length;

    const avgCommitment = pageData.length
        ? Math.round(
            pageData.reduce((s, r) => s + (r.commitment || 0), 0) /
            pageData.length
        )
        : 0;

    const noteCount = pageData.filter((r) => r.note).length;

    const thCls =
        'px-4 py-3 text-left text-[10px] font-black uppercase tracking-widest text-white/35 cursor-pointer hover:text-white/60 transition-colors whitespace-nowrap select-none';

    return (
        <div>
            <div className="flex items-center justify-between gap-4 mb-6 flex-wrap">
                <div>
                    <h1 className="text-xl font-black text-white mb-1">
                        Assessments
                    </h1>

                    <p className="text-xs text-white/35">
                        {filtered.length !== allData.length
                            ? `${filtered.length} of ${allData.length} submissions`
                            : `${allData.length} total submissions`}
                    </p>
                </div>

                <div className="flex items-center gap-2">
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

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
                <StatCard
                    label="Showing"
                    value={`${pageData.length} / ${filtered.length}`}
                    color="white"
                />

                <StatCard
                    label="New (this page)"
                    value={newCount}
                    color="#60a5fa"
                />

                <StatCard
                    label="Avg. Commitment"
                    value={avgCommitment ? `${avgCommitment}/10` : '—'}
                    color="#e71763"
                />

                <StatCard label="With Notes" value={noteCount} color="#34d399" />
            </div>

            <div className="flex flex-wrap gap-3 mb-5 relative z-20">
                <div className="relative flex-1 min-w-[220px]">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/30" />

                    <input
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Search name, WhatsApp, email, city…"
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
                    value={planFilter}
                    onChange={setPlanFilter}
                    options={planOptions}
                    minWidth={220}
                    getBadge={filterBadge}
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
                                    ['first_name', 'Client'],
                                    ['plan', 'Plan'],
                                    ['city', 'City'],
                                    ['workout_status', 'Fitness Level'],
                                    ['commitment', 'Commitment'],
                                    ['reviewed', 'Reviewed'],
                                    ['status', 'Status'],
                                    ['created_at', 'Submitted'],
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
                                    <td colSpan={9} className="px-4 py-16 text-center">
                                        <Loader2 className="w-6 h-6 animate-spin mx-auto text-white/25" />
                                    </td>
                                </tr>
                            ) : pageData.length === 0 ? (
                                <tr>
                                    <td colSpan={9} className="px-4 py-16 text-center">
                                        <p className="text-sm text-white/25">
                                            No assessments found
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
                                                    {row.first_name} {row.last_name || ''}
                                                </p>

                                                <p className="text-[11px] text-white/35">
                                                    {row.whatsapp}
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
                                                <span className="text-xs text-white/60">
                                                    {row.plan || '—'}
                                                </span>
                                            </td>

                                            <td className="px-4 py-3">
                                                <span className="text-xs text-white/60">
                                                    {row.city || '—'}
                                                </span>
                                            </td>

                                            <td className="px-4 py-3">
                                                <span className="text-xs text-white/60">
                                                    {row.workout_status
                                                        ? row.workout_status.replace(
                                                            /\s*\(.*?\)/,
                                                            ''
                                                        )
                                                        : '—'}
                                                </span>
                                            </td>

                                            <td className="px-4 py-3">
                                                <CommitmentRing score={row.commitment} />
                                            </td>

                                            <td className="px-4 py-3">
                                                <ReviewedToggle
                                                    reviewed={!!row.reviewed}
                                                    onChange={(v) =>
                                                        handleReviewedChange(row.id, v)
                                                    }
                                                />
                                            </td>

                                            <td className="px-4 py-3">
                                                <StatusSelect
                                                    value={row.status || 'new'}
                                                    onChange={(v) =>
                                                        handleStatusChange(row.id, v)
                                                    }
                                                />
                                            </td>

                                            <td className="px-4 py-3">
                                                <p className="text-xs text-white/50">
                                                    {fmtDate(row.created_at, true)}
                                                </p>

                                                <p className="text-[10px] text-white/25">
                                                    {fmtRelativeTime(row.created_at)}
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

                                                    {row.whatsapp && (
                                                        <a
                                                            href={`https://wa.me/${row.whatsapp.replace(/\D/g, '')}`}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="w-7 h-7 rounded-lg flex items-center justify-center transition-all"
                                                            style={{ color: '#25D366' }}
                                                            title="Open WhatsApp"
                                                            onMouseEnter={(e) =>
                                                            (e.currentTarget.style.background =
                                                                'rgba(37,211,102,0.1)')
                                                            }
                                                            onMouseLeave={(e) =>
                                                                (e.currentTarget.style.background = '')
                                                            }
                                                        >
                                                            <MessageCircle className="w-3.5 h-3.5" />
                                                        </a>
                                                    )}
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
                        assessmentId={selectedId}
                        onClose={() => setSelectedId(null)}
                        onNoteClick={(row) => {
                            setNoteTarget(row);
                            setSelectedId(null);
                        }}
                        onStatusChange={handleStatusChange}
                        onReviewedChange={handleReviewedChange}
                    />
                )}
            </AnimatePresence>

            <AnimatePresence>
                {noteTarget && (
                    <NoteModal
                        recordId={noteTarget.id}
                        name={`${noteTarget.first_name} ${noteTarget.last_name || ''
                            }`.trim()}
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
        </div >
    );
}
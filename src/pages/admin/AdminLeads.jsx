/**
 * src/pages/admin/AdminLeads.jsx
 *
 * Cold Enquiries — submissions from the hero "Apply For Coaching" modal.
 * Lighter than Assessments (no files, no reviewed pipeline): just contact
 * details + a status you work through, plus a shared note per lead so any
 * admin can see whether someone's already followed up.
 */
import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Search,
    RefreshCw,
    X,
    StickyNote,
    ChevronDown,
    Save,
    Loader2,
    Check,
    AlertCircle,
    MessageCircle,
    Mail,
    Trash2,
} from 'lucide-react';
import PaginationBar from './PaginationBar';
import { fmtDateTime, statusBadge, formatLabel, LEAD_STATUSES } from './adminUtils';
import { useDebounce } from './useDebounce';
import { useToast } from './ToastProvider';
import { fetchLeads, setLeadStatus, deleteLeadAdmin, saveNote } from './adminApi';

const CACHE_TTL = 60_000;

const _cache = { allRows: null, ts: 0 };

function FilterDropdown({ value, onChange, options, minWidth = 170 }) {
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
        <div ref={ref} className="relative" style={{ minWidth }}>
            <button
                type="button"
                onClick={() => setOpen((o) => !o)}
                className="w-full flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm font-bold transition-all"
                style={{
                    background: 'rgba(255,255,255,0.05)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    color: 'rgba(255,255,255,0.72)',
                }}
            >
                <span className="flex-1 text-left truncate">{active?.label}</span>
                <ChevronDown
                    className="w-3.5 h-3.5 flex-shrink-0 transition-transform"
                    style={{ opacity: 0.65, transform: open ? 'rotate(180deg)' : 'rotate(0deg)' }}
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
                        style={{ background: '#13131f', border: '1px solid rgba(255,255,255,0.12)', minWidth, width: '100%' }}
                    >
                        {options.map((option) => {
                            const isActive = option.value === value;
                            return (
                                <button
                                    type="button"
                                    key={option.value}
                                    onClick={() => { onChange(option.value); setOpen(false); }}
                                    className="w-full flex items-center gap-2.5 px-3 py-2.5 text-xs font-semibold text-left transition-colors"
                                    style={{ background: isActive ? 'rgba(255,255,255,0.06)' : 'transparent' }}
                                >
                                    <span
                                        className="w-2 h-2 rounded-full flex-shrink-0"
                                        style={{ background: option.value === 'all' ? 'rgba(255,255,255,0.35)' : statusBadge(option.value).color }}
                                    />
                                    <span className="flex-1" style={{ color: isActive ? 'white' : 'rgba(255,255,255,0.65)' }}>
                                        {option.label}
                                    </span>
                                    {isActive && <Check className="w-3 h-3 flex-shrink-0" style={{ color: 'white' }} />}
                                </button>
                            );
                        })}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

// Renders its open menu into document.body via a portal, positioned with
// `fixed` coordinates computed from the trigger's own bounding rect. The
// table cell this sits in lives inside an `overflow-x-auto` wrapper (needed
// for horizontal scroll on narrow screens) — per the CSS overflow spec,
// setting overflow-x to a non-visible value forces overflow-y to compute to
// 'auto' too, so a plain `absolute` dropdown gets silently clipped by that
// same wrapper instead of floating below the row. Portaling out of that
// subtree sidesteps the clipping entirely.
function StatusSelect({ value, onChange, disabled }) {
    const [open, setOpen] = useState(false);
    const [coords, setCoords] = useState(null);
    const triggerRef = useRef(null);
    const menuRef = useRef(null);
    const badge = statusBadge(value || 'new');

    const openMenu = () => {
        const rect = triggerRef.current?.getBoundingClientRect();
        if (rect) {
            setCoords({ top: rect.bottom + 6, left: rect.left, minWidth: Math.max(160, rect.width) });
        }
        setOpen(true);
    };

    useEffect(() => {
        if (!open) return;

        const handleClick = (e) => {
            if (
                triggerRef.current && !triggerRef.current.contains(e.target) &&
                menuRef.current && !menuRef.current.contains(e.target)
            ) {
                setOpen(false);
            }
        };
        // A fixed-position menu doesn't track the trigger if the table (or
        // the page) scrolls underneath it — closing on scroll is simpler
        // and less error-prone than re-measuring on every scroll tick.
        const handleScroll = () => setOpen(false);

        document.addEventListener('mousedown', handleClick);
        window.addEventListener('scroll', handleScroll, { capture: true, passive: true });
        return () => {
            document.removeEventListener('mousedown', handleClick);
            window.removeEventListener('scroll', handleScroll, { capture: true });
        };
    }, [open]);

    return (
        <div className="inline-block">
            <button
                ref={triggerRef}
                type="button"
                disabled={disabled}
                onClick={() => (open ? setOpen(false) : openMenu())}
                className="flex items-center gap-1.5 text-[10px] font-bold px-2.5 py-1 rounded-full transition-all disabled:opacity-50"
                style={{ background: badge.bg, border: `1px solid ${badge.border}`, color: badge.color, minWidth: 100 }}
            >
                <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: badge.color }} />
                <span className="flex-1 text-left leading-none">{formatLabel(value || 'new')}</span>
                <ChevronDown className="w-2.5 h-2.5 flex-shrink-0" style={{ opacity: 0.6, transform: open ? 'rotate(180deg)' : 'rotate(0deg)' }} />
            </button>

            {open && coords && createPortal(
                <AnimatePresence>
                    <motion.div
                        ref={menuRef}
                        initial={{ opacity: 0, y: -6, scale: 0.97 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -4, scale: 0.97 }}
                        transition={{ duration: 0.12 }}
                        className="fixed z-[200] rounded-xl overflow-hidden shadow-2xl"
                        style={{
                            top: coords.top,
                            left: coords.left,
                            minWidth: coords.minWidth,
                            background: '#13131f',
                            border: '1px solid rgba(255,255,255,0.12)',
                        }}
                    >
                        {LEAD_STATUSES.map((s) => {
                            const b = statusBadge(s);
                            const isActive = s === (value || 'new');
                            return (
                                <button
                                    type="button"
                                    key={s}
                                    onClick={() => { onChange(s); setOpen(false); }}
                                    className="w-full flex items-center gap-2.5 px-3 py-2.5 text-xs font-semibold text-left transition-colors"
                                    style={{ background: isActive ? 'rgba(255,255,255,0.06)' : 'transparent' }}
                                >
                                    <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: b.color }} />
                                    <span className="flex-1" style={{ color: isActive ? b.color : 'rgba(255,255,255,0.65)' }}>
                                        {formatLabel(s)}
                                    </span>
                                    {isActive && <Check className="w-3 h-3 flex-shrink-0" style={{ color: b.color }} />}
                                </button>
                            );
                        })}
                    </motion.div>
                </AnimatePresence>,
                document.body
            )}
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
            const note = await saveNote('lead', recordId, text);
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="relative w-full max-w-md rounded-2xl overflow-hidden"
                style={{ background: '#0e0e16', border: '1px solid rgba(255,255,255,0.1)' }}
                onClick={(e) => e.stopPropagation()}
            >
                <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                    <div className="flex items-center gap-2">
                        <StickyNote className="w-4 h-4" style={{ color: '#e71763' }} />
                        <p className="font-bold text-white text-sm">{currentNote ? 'Edit Note' : 'Add Note'} — {name}</p>
                    </div>
                    <button onClick={onClose} className="text-white/30 hover:text-white transition-colors">
                        <X className="w-4 h-4" />
                    </button>
                </div>

                <div className="p-5">
                    <textarea
                        value={text}
                        onChange={(e) => setText(e.target.value)}
                        placeholder="Add a note about this enquiry… (e.g. followed up on WhatsApp, waiting to hear back)"
                        rows={5}
                        className="w-full rounded-xl px-4 py-3 text-sm text-white placeholder:text-white/25 resize-none outline-none leading-relaxed"
                        style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}
                        autoFocus
                    />

                    {currentNote && (
                        <p className="text-[10px] text-white/25 mt-2">
                            Last updated {fmtDateTime(currentNote.updatedAt)} · visible to all admins
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
                            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : saved ? (<><Check className="w-4 h-4" />Saved!</>) : (<><Save className="w-4 h-4" />Save Note</>)}
                        </button>
                    </div>
                </div>
            </motion.div>
        </div>
    );
}

function ConfirmDeleteModal({ row, deleting, onCancel, onConfirm }) {
    return (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4" onClick={!deleting ? onCancel : undefined}>
            <div className="absolute inset-0 bg-black/65 backdrop-blur-sm" />
            <motion.div
                initial={{ opacity: 0, scale: 0.94, y: 8 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                className="relative w-full max-w-sm rounded-2xl overflow-hidden"
                style={{ background: '#0e0e16', border: '1px solid rgba(239,68,68,0.25)', boxShadow: '0 30px 70px rgba(0,0,0,0.55)' }}
                onClick={(e) => e.stopPropagation()}
            >
                <div className="p-6 text-center">
                    <div
                        className="w-12 h-12 rounded-2xl flex items-center justify-center mx-auto mb-4"
                        style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.25)' }}
                    >
                        <AlertCircle className="w-5 h-5" style={{ color: '#f87171' }} />
                    </div>
                    <p className="font-bold text-white text-sm mb-1.5">Delete this enquiry?</p>
                    <p className="text-xs text-white/40 leading-relaxed">
                        <span className="text-white/60">{row?.name}</span> will be hidden from this list. This is a soft
                        delete — the record stays safely in the database and can be restored if needed.
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

function StatCard({ label, value, color }) {
    return (
        <div className="rounded-2xl p-5" style={{ background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.07)' }}>
            <p className="text-xs text-white/35 uppercase tracking-widest mb-2">{label}</p>
            <p className="text-2xl font-black" style={{ color }}>{value}</p>
        </div>
    );
}

export default function AdminLeads() {
    const toast = useToast();

    const [allData, setAllData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const [statusFilter, setStatusFilter] = useState('all');
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(15);
    const [search, setSearch] = useState('');
    const debouncedSearch = useDebounce(search, 300);

    const [noteTarget, setNoteTarget] = useState(null);
    const [deleteTarget, setDeleteTarget] = useState(null);
    const [deleting, setDeleting] = useState(false);

    const statusOptions = useMemo(
        () => [{ value: 'all', label: 'All Statuses' }, ...LEAD_STATUSES.map((s) => ({ value: s, label: formatLabel(s) }))],
        []
    );

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
            const res = await fetchLeads({ pageSize: 9999 });
            const rows = res.rows || [];
            _cache.allRows = rows;
            _cache.ts = Date.now();
            setAllData(rows);
        } catch (e) {
            setError(e.message || 'Failed to load leads');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { fetchData(); }, [fetchData]);

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
                (r.name ?? '').toLowerCase().includes(q) ||
                (r.email ?? '').toLowerCase().includes(q) ||
                (r.phone ?? '').includes(q)
            );
        }

        if (statusFilter !== 'all') {
            rows = rows.filter((r) => (r.status || 'new') === statusFilter);
        }

        return [...rows].sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    }, [allData, debouncedSearch, statusFilter]);

    useEffect(() => { setPage(1); }, [debouncedSearch, statusFilter, pageSize]);

    const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
    const pageData = useMemo(() => {
        const start = (page - 1) * pageSize;
        return filtered.slice(start, start + pageSize);
    }, [filtered, page, pageSize]);

    const patchRow = (id, patch) => {
        const apply = (rows) => rows.map((r) => (r.id === id ? { ...r, ...patch } : r));
        setAllData(apply);
        if (_cache.allRows) _cache.allRows = apply(_cache.allRows);
    };

    const handleStatusChange = async (id, newStatus) => {
        patchRow(id, { status: newStatus });
        try {
            await setLeadStatus(id, newStatus);
            toast.success('Status updated');
        } catch (e) {
            toast.error(e.message || 'Failed to update status.');
            fetchData({ silent: true });
        }
    };

    const confirmDelete = async () => {
        if (!deleteTarget) return;
        const id = deleteTarget.id;
        setDeleting(true);
        try {
            await deleteLeadAdmin(id);
            const apply = (rows) => rows.filter((r) => r.id !== id);
            setAllData(apply);
            if (_cache.allRows) _cache.allRows = apply(_cache.allRows);
            setDeleteTarget(null);
            toast.success('Enquiry deleted');
        } catch (e) {
            toast.error(e.message || 'Failed to delete enquiry.');
        } finally {
            setDeleting(false);
        }
    };

    const newCount = allData.filter((r) => (r.status || 'new') === 'new').length;
    const convertedCount = allData.filter((r) => r.status === 'converted').length;
    const noteCount = allData.filter((r) => r.note).length;

    const thCls = 'px-4 py-3 text-left text-[10px] font-black uppercase tracking-widest text-white/35 whitespace-nowrap';

    return (
        <div>
            <div className="flex items-center justify-between gap-4 mb-6 flex-wrap">
                <div>
                    <h1 className="text-xl font-black text-white mb-1">Cold Enquiries</h1>
                    <p className="text-xs text-white/35">
                        {filtered.length !== allData.length
                            ? `${filtered.length} of ${allData.length} enquiries`
                            : `${allData.length} total enquiries`}
                    </p>
                </div>

                <button
                    onClick={handleRefresh}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs text-white/50 hover:text-white transition-all"
                    style={{ border: '1px solid rgba(255,255,255,0.08)' }}
                >
                    <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
                    Refresh
                </button>
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
                <StatCard label="Total Enquiries" value={allData.length} color="white" />
                <StatCard label="New" value={newCount} color="#60a5fa" />
                <StatCard label="Converted" value={convertedCount} color="#34d399" />
                <StatCard label="With Notes" value={noteCount} color="#e71763" />
            </div>

            <div className="flex flex-wrap gap-3 mb-5 relative z-20">
                <div className="relative flex-1 min-w-[220px]">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/30" />
                    <input
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Search name, email, phone…"
                        className="w-full rounded-xl pl-9 pr-4 py-2.5 text-sm text-white placeholder:text-white/25 outline-none"
                        style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}
                    />
                    {search && (
                        <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white">
                            <X className="w-3.5 h-3.5" />
                        </button>
                    )}
                </div>

                <FilterDropdown value={statusFilter} onChange={setStatusFilter} options={statusOptions} />
            </div>

            {error && (
                <div className="mb-4 px-4 py-3 rounded-xl text-sm flex items-center gap-2" style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.25)', color: '#f87171' }}>
                    <AlertCircle className="w-4 h-4 flex-shrink-0" />
                    {error}
                </div>
            )}

            <div className="rounded-2xl overflow-hidden" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.07)' }}>
                {loading ? (
                    <div className="flex items-center justify-center py-24">
                        <Loader2 className="w-5 h-5 animate-spin text-white/25" />
                    </div>
                ) : pageData.length === 0 ? (
                    <div className="text-center py-24 text-sm text-white/30">No enquiries found.</div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                                    <th className={thCls}>Name</th>
                                    <th className={thCls}>Contact</th>
                                    <th className={thCls}>Goal</th>
                                    <th className={thCls}>Experience</th>
                                    <th className={thCls}>Status</th>
                                    <th className={thCls}>Submitted</th>
                                    <th className={thCls}>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {pageData.map((row) => (
                                    <tr key={row.id} className="hover:bg-white/[0.02] transition-colors" style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                                        <td className="px-4 py-3 text-sm text-white font-semibold whitespace-nowrap">{row.name}</td>
                                        <td className="px-4 py-3 text-xs text-white/50">
                                            <div className="flex flex-col gap-0.5">
                                                <span className="truncate max-w-[180px]">{row.email}</span>
                                                <span>{row.phone}</span>
                                            </div>
                                        </td>
                                        <td className="px-4 py-3 text-xs text-white/60 whitespace-nowrap">{row.goal || '—'}</td>
                                        <td className="px-4 py-3 text-xs text-white/60 whitespace-nowrap">{row.experience || '—'}</td>
                                        <td className="px-4 py-3">
                                            <StatusSelect value={row.status || 'new'} onChange={(s) => handleStatusChange(row.id, s)} />
                                        </td>
                                        <td className="px-4 py-3 text-xs text-white/40 whitespace-nowrap">{fmtDateTime(row.created_at)}</td>
                                        <td className="px-4 py-3">
                                            <div className="flex items-center gap-1.5">
                                                <button
                                                    onClick={() => setNoteTarget(row)}
                                                    title={row.note ? 'Edit note' : 'Add note'}
                                                    className="w-7 h-7 rounded-lg flex items-center justify-center transition-colors"
                                                    style={row.note
                                                        ? { background: 'rgba(231,23,99,0.12)', border: '1px solid rgba(231,23,99,0.25)' }
                                                        : { background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}
                                                >
                                                    <StickyNote className="w-3.5 h-3.5" style={{ color: row.note ? '#e71763' : 'rgba(255,255,255,0.35)' }} />
                                                </button>

                                                {row.phone && (
                                                    <a
                                                        href={`https://wa.me/${row.phone.replace(/\D/g, '')}`}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        title="Message on WhatsApp"
                                                        className="w-7 h-7 rounded-lg flex items-center justify-center"
                                                        style={{ background: 'rgba(37,211,102,0.1)', border: '1px solid rgba(37,211,102,0.2)' }}
                                                    >
                                                        <MessageCircle className="w-3.5 h-3.5" style={{ color: '#25D366' }} />
                                                    </a>
                                                )}

                                                {row.email && (
                                                    <a
                                                        href={`mailto:${row.email}`}
                                                        title="Send email"
                                                        className="w-7 h-7 rounded-lg flex items-center justify-center"
                                                        style={{ background: 'rgba(96,165,250,0.1)', border: '1px solid rgba(96,165,250,0.2)' }}
                                                    >
                                                        <Mail className="w-3.5 h-3.5" style={{ color: '#60a5fa' }} />
                                                    </a>
                                                )}

                                                <button
                                                    onClick={() => setDeleteTarget(row)}
                                                    title="Delete"
                                                    className="w-7 h-7 rounded-lg flex items-center justify-center transition-colors"
                                                    style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)' }}
                                                >
                                                    <Trash2 className="w-3.5 h-3.5" style={{ color: '#f87171' }} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}

                <PaginationBar
                    page={page}
                    totalPages={totalPages}
                    totalItems={filtered.length}
                    pageSize={pageSize}
                    onPageChange={setPage}
                    onPageSizeChange={setPageSize}
                />
            </div>

            <AnimatePresence>
                {noteTarget && (
                    <NoteModal
                        recordId={noteTarget.id}
                        name={noteTarget.name}
                        currentNote={noteTarget.note}
                        onClose={() => setNoteTarget(null)}
                        onSaved={(note) => patchRow(noteTarget.id, { note })}
                    />
                )}
            </AnimatePresence>

            <AnimatePresence>
                {deleteTarget && (
                    <ConfirmDeleteModal
                        row={deleteTarget}
                        deleting={deleting}
                        onCancel={() => setDeleteTarget(null)}
                        onConfirm={confirmDelete}
                    />
                )}
            </AnimatePresence>
        </div>
    );
}

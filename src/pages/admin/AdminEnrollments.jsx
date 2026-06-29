/**
 * src/pages/admin/AdminEnrollments.jsx
 *
 * Full-featured enrollments dashboard:
 *  • Stats summary cards
 *  • Search, filter by coaching type / plan type / date range
 *  • Sortable table
 *  • Row-level: View detail drawer, Edit status, Notes, Download PDF invoice
 *  • Bulk export: CSV or PDF (all or filtered)
 */
import { useState, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Search, Download, FileText, ChevronDown, ChevronUp,
    X, Eye, Edit2, StickyNote, RefreshCw, Check,
    Users, IndianRupee, TrendingUp, Calendar, Filter,
    Copy, ExternalLink, Save, Loader2, AlertCircle,
    ChevronLeft, ChevronRight, FileSpreadsheet, Printer,
} from 'lucide-react';
import {
    getAdminSupabase, fmtCurrency, fmtDate, fmtGoals,
    exportToCSV, downloadInvoicePDF, statusBadge, getNotes, saveNote, getNote,
} from './adminUtils';

const PAGE_SIZE = 20;

const COACHING_TYPES = ['all', 'online', 'video', 'personal'];
const PLAN_TYPES = ['all', 'individual', 'couple'];
const STATUS_OPTIONS = ['paid', 'pending', 'failed'];

// ── Stat card ─────────────────────────────────────────────────────────────────
function StatCard({ label, value, sub, color }) {
    return (
        <div className="rounded-2xl p-5"
            style={{ background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.07)' }}>
            <p className="text-xs text-white/35 uppercase tracking-widest mb-2">{label}</p>
            <p className="text-2xl font-black mb-1" style={{ color }}>{value}</p>
            {sub && <p className="text-xs text-white/30">{sub}</p>}
        </div>
    );
}

// ── Note editor modal ─────────────────────────────────────────────────────────
function NoteModal({ id, name, onClose }) {
    const existing = getNote(id);
    const [text, setText] = useState(existing?.text || '');
    const [saved, setSaved] = useState(false);

    const handleSave = () => {
        saveNote(id, text);
        setSaved(true);
        setTimeout(() => { setSaved(false); onClose(); }, 800);
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
            onClick={onClose}>
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="relative w-full max-w-md rounded-2xl overflow-hidden"
                style={{ background: '#0e0e16', border: '1px solid rgba(255,255,255,0.1)' }}
                onClick={e => e.stopPropagation()}>
                <div className="flex items-center justify-between px-5 py-4"
                    style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                    <div className="flex items-center gap-2">
                        <StickyNote className="w-4 h-4" style={{ color: '#e71763' }} />
                        <p className="font-bold text-white text-sm">Note — {name}</p>
                    </div>
                    <button onClick={onClose} className="text-white/30 hover:text-white">
                        <X className="w-4 h-4" />
                    </button>
                </div>
                <div className="p-5">
                    <textarea
                        value={text}
                        onChange={e => setText(e.target.value)}
                        placeholder="Add a note about this client… (e.g. sent plan, waiting for onboarding)"
                        rows={5}
                        className="w-full rounded-xl px-4 py-3 text-sm text-white placeholder:text-white/25 resize-none outline-none leading-relaxed"
                        style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}
                        autoFocus
                    />
                    {existing?.updatedAt && (
                        <p className="text-[10px] text-white/20 mt-2">
                            Last updated: {fmtDate(existing.updatedAt)}
                        </p>
                    )}
                    <div className="flex gap-3 mt-4">
                        <button onClick={onClose}
                            className="flex-1 py-2.5 rounded-xl text-sm text-white/40 transition-all"
                            style={{ border: '1px solid rgba(255,255,255,0.08)' }}>
                            Cancel
                        </button>
                        <button onClick={handleSave}
                            className="flex-1 py-2.5 rounded-xl text-sm font-bold text-white flex items-center justify-center gap-2"
                            style={{ background: saved ? '#34d399' : '#e71763' }}>
                            {saved ? <><Check className="w-4 h-4" />Saved!</> : <><Save className="w-4 h-4" />Save Note</>}
                        </button>
                    </div>
                </div>
            </motion.div>
        </div>
    );
}

// ── Detail drawer ─────────────────────────────────────────────────────────────
function DetailDrawer({ enrollment, onClose, onNoteClick }) {
    const [copied, setCopied] = useState('');
    const note = getNote(enrollment.id);

    const copy = (val, key) => {
        navigator.clipboard.writeText(val).catch(() => { });
        setCopied(key);
        setTimeout(() => setCopied(''), 1500);
    };

    const dl = (label, value) => (
        <div className="flex items-start justify-between gap-4 py-3"
            style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
            <span className="text-xs text-white/35 flex-shrink-0 w-32">{label}</span>
            <span className="text-xs text-white text-right font-medium flex-1">{value || '—'}</span>
        </div>
    );

    const badge = statusBadge(enrollment.payment_status || 'paid');

    return (
        <div className="fixed inset-0 z-50 flex justify-end"
            onClick={onClose}>
            <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
            <motion.div
                initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
                transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                className="relative w-full max-w-md h-full overflow-y-auto"
                style={{ background: '#0a0a14', borderLeft: '1px solid rgba(255,255,255,0.08)' }}
                onClick={e => e.stopPropagation()}>

                {/* Sticky header */}
                <div className="sticky top-0 z-10 flex items-center justify-between px-5 py-4"
                    style={{ background: 'rgba(10,10,20,0.95)', borderBottom: '1px solid rgba(255,255,255,0.06)', backdropFilter: 'blur(20px)' }}>
                    <div>
                        <p className="font-black text-white text-sm">{enrollment.customer_name}</p>
                        <p className="text-[10px] text-white/35 font-mono mt-0.5">{enrollment.enrollment_id}</p>
                    </div>
                    <div className="flex items-center gap-2">
                        <button onClick={() => onNoteClick(enrollment)}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all"
                            style={{ background: 'rgba(231,23,99,0.1)', border: '1px solid rgba(231,23,99,0.2)', color: '#e71763' }}>
                            <StickyNote className="w-3 h-3" />
                            {note ? 'Edit Note' : 'Add Note'}
                        </button>
                        <button onClick={onClose} className="w-8 h-8 rounded-lg flex items-center justify-center text-white/30 hover:text-white hover:bg-white/5">
                            <X className="w-4 h-4" />
                        </button>
                    </div>
                </div>

                <div className="p-5 space-y-6">
                    {/* Note preview */}
                    {note && (
                        <div className="rounded-xl p-4"
                            style={{ background: 'rgba(231,23,99,0.06)', border: '1px solid rgba(231,23,99,0.15)' }}>
                            <div className="flex items-center gap-2 mb-2">
                                <StickyNote className="w-3.5 h-3.5" style={{ color: '#e71763' }} />
                                <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color: '#e71763' }}>Note</p>
                            </div>
                            <p className="text-xs text-white/60 leading-relaxed">{note.text}</p>
                            <p className="text-[10px] text-white/25 mt-2">Updated {fmtDate(note.updatedAt, true)}</p>
                        </div>
                    )}

                    {/* Status & amount */}
                    <div className="flex items-center gap-3">
                        <div className="flex-1 rounded-xl p-4 text-center"
                            style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
                            <p className="text-[10px] text-white/30 uppercase tracking-widest mb-1">Amount Paid</p>
                            <p className="text-xl font-black" style={{ color: '#e71763' }}>
                                {fmtCurrency(enrollment.amount_paid)}
                            </p>
                        </div>
                        <div className="flex-1 rounded-xl p-4 text-center"
                            style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
                            <p className="text-[10px] text-white/30 uppercase tracking-widest mb-2">Status</p>
                            <span className="text-xs font-bold px-3 py-1 rounded-full"
                                style={{ background: badge.bg, border: `1px solid ${badge.border}`, color: badge.color }}>
                                {(enrollment.payment_status || 'paid').toUpperCase()}
                            </span>
                        </div>
                    </div>

                    {/* Coupon */}
                    {enrollment.coupon_code && (
                        <div className="rounded-xl p-4"
                            style={{ background: 'rgba(52,211,153,0.06)', border: '1px solid rgba(52,211,153,0.2)' }}>
                            <p className="text-[10px] text-white/30 uppercase tracking-widest mb-2">Coupon Applied</p>
                            <div className="flex items-center justify-between">
                                <span className="text-sm font-black text-white font-mono">{enrollment.coupon_code}</span>
                                <span className="text-sm font-bold" style={{ color: '#34d399' }}>
                                    -{fmtCurrency(enrollment.coupon_savings)}
                                </span>
                            </div>
                            {enrollment.original_amount > enrollment.amount_paid && (
                                <p className="text-[11px] text-white/30 mt-1">
                                    Original: <span className="line-through">{fmtCurrency(enrollment.original_amount)}</span>
                                </p>
                            )}
                        </div>
                    )}

                    {/* Client info */}
                    <section>
                        <p className="text-[10px] font-black uppercase tracking-widest mb-3" style={{ color: '#e71763' }}>Client Information</p>
                        <div className="rounded-xl overflow-hidden"
                            style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}>
                            <div className="px-4">
                                {dl('Name', enrollment.customer_name)}
                                {dl('Email', enrollment.customer_email)}
                                {dl('Phone', enrollment.customer_phone)}
                                {dl('Age', enrollment.age ? `${enrollment.age} yrs` : null)}
                                {dl('City', enrollment.city)}
                                {dl('Weight', enrollment.weight ? `${enrollment.weight} kg` : null)}
                                <div className="flex items-start justify-between gap-4 py-3">
                                    <span className="text-xs text-white/35 flex-shrink-0 w-32">Goals</span>
                                    <span className="text-xs text-white text-right font-medium flex-1">{fmtGoals(enrollment.goals)}</span>
                                </div>
                                {enrollment.medical_issue === 'yes' && dl('Medical', enrollment.medical_note || 'Yes')}
                            </div>
                        </div>
                    </section>

                    {/* Partner */}
                    {enrollment.partner_name && (
                        <section>
                            <p className="text-[10px] font-black uppercase tracking-widest mb-3" style={{ color: '#e71763' }}>Partner Details</p>
                            <div className="rounded-xl overflow-hidden"
                                style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}>
                                <div className="px-4">
                                    {dl('Name', enrollment.partner_name)}
                                    {dl('Age', enrollment.partner_age ? `${enrollment.partner_age} yrs` : null)}
                                    {dl('Weight', enrollment.partner_weight ? `${enrollment.partner_weight} kg` : null)}
                                    <div className="flex items-start justify-between gap-4 py-3">
                                        <span className="text-xs text-white/35 flex-shrink-0 w-32">Goals</span>
                                        <span className="text-xs text-white text-right font-medium flex-1">{fmtGoals(enrollment.partner_goals)}</span>
                                    </div>
                                </div>
                            </div>
                        </section>
                    )}

                    {/* Enrollment details */}
                    <section>
                        <p className="text-[10px] font-black uppercase tracking-widest mb-3" style={{ color: '#e71763' }}>Enrollment Details</p>
                        <div className="rounded-xl overflow-hidden"
                            style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}>
                            <div className="px-4">
                                {dl('Program', enrollment.program_name)}
                                {dl('Coaching Type', enrollment.coaching_type)}
                                {dl('Plan Type', enrollment.plan_type)}
                                {dl('Duration', enrollment.duration_months ? `${enrollment.duration_months} Month${Number(enrollment.duration_months) > 1 ? 's' : ''}` : null)}
                                {dl('Payment Date', fmtDate(enrollment.payment_date))}
                                {dl('Created', fmtDate(enrollment.created_at))}
                            </div>
                        </div>
                    </section>

                    {/* Payment IDs */}
                    <section>
                        <p className="text-[10px] font-black uppercase tracking-widest mb-3" style={{ color: '#e71763' }}>Payment Reference</p>
                        <div className="rounded-xl overflow-hidden"
                            style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}>
                            {[
                                ['Enrollment ID', enrollment.enrollment_id],
                                ['Payment ID', enrollment.razorpay_payment_id],
                                ['Order ID', enrollment.razorpay_order_id],
                            ].map(([label, value]) => (
                                <div key={label} className="flex items-center justify-between px-4 py-3"
                                    style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                                    <span className="text-xs text-white/35">{label}</span>
                                    <button onClick={() => copy(value, label)}
                                        className="flex items-center gap-1.5 text-xs font-mono text-white/55 hover:text-white transition-colors">
                                        <span className="truncate max-w-[140px]">{value || '—'}</span>
                                        {value && (copied === label
                                            ? <Check className="w-3 h-3 text-green-400" />
                                            : <Copy className="w-3 h-3" />)}
                                    </button>
                                </div>
                            ))}
                        </div>
                    </section>

                    {/* Download invoice */}
                    <DownloadInvoiceButton enrollment={enrollment} />
                </div>
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
            // Map DB snake_case → camelCase expected by invoiceService
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
        } catch (e) {
            setErr('Invoice generation failed.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div>
            <button onClick={handleDownload} disabled={loading}
                className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl font-bold text-sm text-white disabled:opacity-60"
                style={{ background: '#e71763', boxShadow: '0 0 20px rgba(231,23,99,0.3)' }}>
                {loading
                    ? <><Loader2 className="w-4 h-4 animate-spin" />Generating…</>
                    : <><FileText className="w-4 h-4" />Download Invoice PDF</>}
            </button>
            {err && <p className="text-xs text-red-400 mt-2 text-center">{err}</p>}
        </div>
    );
}

// ── Sort indicator ─────────────────────────────────────────────────────────────
function SortIcon({ field, sort }) {
    if (sort.field !== field) return <ChevronDown className="w-3 h-3 opacity-20" />;
    return sort.dir === 'asc'
        ? <ChevronUp className="w-3 h-3" style={{ color: '#e71763' }} />
        : <ChevronDown className="w-3 h-3" style={{ color: '#e71763' }} />;
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function AdminEnrollments() {
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [total, setTotal] = useState(0);

    // Filters
    const [search, setSearch] = useState('');
    const [coachingFilter, setCoachingFilter] = useState('all');
    const [planFilter, setPlanFilter] = useState('all');
    const [page, setPage] = useState(1);
    const [sort, setSort] = useState({ field: 'created_at', dir: 'desc' });

    // UI state
    const [selected, setSelected] = useState(null);
    const [noteTarget, setNoteTarget] = useState(null);
    const [notes, setNotes] = useState({});
    const [exportLoading, setExportLoading] = useState(false);

    const refreshNotes = () => setNotes(getNotes());

    useEffect(() => { refreshNotes(); }, []);

    const fetchData = useCallback(async () => {
        setLoading(true);
        setError('');
        try {
            const sb = getAdminSupabase();
            let query = sb.from('enrollments').select('*', { count: 'exact' });

            // Search
            if (search.trim()) {
                query = query.or(
                    `customer_name.ilike.%${search}%,customer_email.ilike.%${search}%,customer_phone.ilike.%${search}%,enrollment_id.ilike.%${search}%,program_name.ilike.%${search}%`
                );
            }
            if (coachingFilter !== 'all') query = query.eq('coaching_type', coachingFilter);
            if (planFilter !== 'all') query = query.eq('plan_type', planFilter);

            query = query
                .order(sort.field, { ascending: sort.dir === 'asc' })
                .range((page - 1) * PAGE_SIZE, page * PAGE_SIZE - 1);

            const { data: rows, error: err, count } = await query;
            if (err) throw err;
            setData(rows || []);
            setTotal(count || 0);
        } catch (e) {
            setError(e.message || 'Failed to load enrollments');
        } finally {
            setLoading(false);
        }
    }, [search, coachingFilter, planFilter, page, sort]);

    useEffect(() => { fetchData(); }, [fetchData]);

    // Reset page on filter change
    useEffect(() => { setPage(1); }, [search, coachingFilter, planFilter, sort]);

    const toggleSort = (field) => {
        setSort(s => s.field === field
            ? { ...s, dir: s.dir === 'asc' ? 'desc' : 'asc' }
            : { field, dir: 'asc' }
        );
    };

    // Stats from current page (quick view)
    const totalRevenue = data.reduce((sum, r) => sum + (Number(r.amount_paid) || 0), 0);
    const couponCount = data.filter(r => r.coupon_code).length;
    const coupleCount = data.filter(r => r.plan_type === 'couple').length;

    const handleExportCSV = async () => {
        setExportLoading(true);
        try {
            const sb = getAdminSupabase();
            let query = sb.from('enrollments').select('*');
            if (search.trim()) {
                query = query.or(
                    `customer_name.ilike.%${search}%,customer_email.ilike.%${search}%,enrollment_id.ilike.%${search}%`
                );
            }
            if (coachingFilter !== 'all') query = query.eq('coaching_type', coachingFilter);
            if (planFilter !== 'all') query = query.eq('plan_type', planFilter);
            query = query.order('created_at', { ascending: false });

            const { data: allRows } = await query;
            if (allRows) {
                const mapped = allRows.map(r => ({
                    enrollment_id: r.enrollment_id,
                    name: r.customer_name,
                    email: r.customer_email,
                    phone: r.customer_phone,
                    program: r.program_name,
                    coaching_type: r.coaching_type,
                    plan_type: r.plan_type,
                    duration_months: r.duration_months,
                    amount_paid: r.amount_paid,
                    original_amount: r.original_amount,
                    coupon_code: r.coupon_code || '',
                    coupon_savings: r.coupon_savings || 0,
                    payment_status: r.payment_status,
                    payment_date: r.payment_date,
                    age: r.age,
                    city: r.city,
                    weight: r.weight,
                    goals: Array.isArray(r.goals) ? r.goals.join('; ') : r.goals,
                    medical_issue: r.medical_issue,
                    partner_name: r.partner_name || '',
                    razorpay_payment_id: r.razorpay_payment_id,
                    created_at: r.created_at,
                }));
                exportToCSV(mapped, `recode-enrollments-${new Date().toISOString().slice(0, 10)}`);
            }
        } finally {
            setExportLoading(false);
        }
    };

    const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

    const thCls = 'px-4 py-3 text-left text-[10px] font-black uppercase tracking-widest text-white/35 cursor-pointer hover:text-white/60 transition-colors whitespace-nowrap select-none';

    return (
        <div>
            {/* Header */}
            <div className="flex items-start justify-between gap-4 mb-6 flex-wrap">
                <div>
                    <h1 className="text-xl font-black text-white mb-1">Enrollments</h1>
                    <p className="text-xs text-white/35">{total} total records</p>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                    <button onClick={fetchData}
                        className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs text-white/50 hover:text-white transition-all"
                        style={{ border: '1px solid rgba(255,255,255,0.08)' }}>
                        <RefreshCw className="w-3.5 h-3.5" />
                        Refresh
                    </button>
                    <button onClick={handleExportCSV} disabled={exportLoading}
                        className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold text-white disabled:opacity-50 transition-all"
                        style={{ background: 'rgba(231,23,99,0.1)', border: '1px solid rgba(231,23,99,0.25)', color: '#e71763' }}>
                        {exportLoading
                            ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            : <FileSpreadsheet className="w-3.5 h-3.5" />}
                        Export CSV
                    </button>
                </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
                <StatCard label="Showing" value={data.length} sub={`of ${total} total`} color="white" />
                <StatCard label="Page Revenue" value={fmtCurrency(totalRevenue)} sub="from current page" color="#e71763" />
                <StatCard label="Couple Plans" value={coupleCount} sub="on this page" color="#60a5fa" />
                <StatCard label="Coupons Used" value={couponCount} sub="on this page" color="#34d399" />
            </div>

            {/* Filters */}
            <div className="flex flex-wrap gap-3 mb-5">
                {/* Search */}
                <div className="relative flex-1 min-w-[200px]">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/30" />
                    <input
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        placeholder="Search name, email, phone, enrollment ID…"
                        className="w-full rounded-xl pl-9 pr-4 py-2.5 text-sm text-white placeholder:text-white/25 outline-none"
                        style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}
                    />
                    {search && (
                        <button onClick={() => setSearch('')}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white">
                            <X className="w-3.5 h-3.5" />
                        </button>
                    )}
                </div>

                {/* Coaching type */}
                <select value={coachingFilter} onChange={e => setCoachingFilter(e.target.value)}
                    className="rounded-xl px-3 py-2.5 text-sm text-white outline-none"
                    style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', minWidth: 130 }}>
                    {COACHING_TYPES.map(t => (
                        <option key={t} value={t} style={{ background: '#0a0a0a' }}>
                            {t === 'all' ? 'All Types' : t.charAt(0).toUpperCase() + t.slice(1)}
                        </option>
                    ))}
                </select>

                {/* Plan type */}
                <select value={planFilter} onChange={e => setPlanFilter(e.target.value)}
                    className="rounded-xl px-3 py-2.5 text-sm text-white outline-none"
                    style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', minWidth: 130 }}>
                    {PLAN_TYPES.map(t => (
                        <option key={t} value={t} style={{ background: '#0a0a0a' }}>
                            {t === 'all' ? 'All Plans' : t.charAt(0).toUpperCase() + t.slice(1)}
                        </option>
                    ))}
                </select>
            </div>

            {/* Error */}
            {error && (
                <div className="flex items-center gap-2 px-4 py-3 rounded-xl mb-4 text-sm"
                    style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', color: '#f87171' }}>
                    <AlertCircle className="w-4 h-4 flex-shrink-0" />
                    {error}
                </div>
            )}

            {/* Table */}
            <div className="rounded-2xl overflow-hidden"
                style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.07)' }}>
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.06)', background: 'rgba(255,255,255,0.02)' }}>
                                {[
                                    ['customer_name', 'Client'],
                                    ['coaching_type', 'Type'],
                                    ['plan_type', 'Plan'],
                                    ['duration_months', 'Duration'],
                                    ['amount_paid', 'Amount'],
                                    ['payment_status', 'Status'],
                                    ['payment_date', 'Date'],
                                ].map(([field, label]) => (
                                    <th key={field} className={thCls} onClick={() => toggleSort(field)}>
                                        <span className="flex items-center gap-1">
                                            {label} <SortIcon field={field} sort={sort} />
                                        </span>
                                    </th>
                                ))}
                                <th className={`${thCls} cursor-default`}>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr>
                                    <td colSpan={8} className="px-4 py-16 text-center">
                                        <Loader2 className="w-6 h-6 animate-spin mx-auto text-white/25" />
                                    </td>
                                </tr>
                            ) : data.length === 0 ? (
                                <tr>
                                    <td colSpan={8} className="px-4 py-16 text-center">
                                        <p className="text-sm text-white/25">No enrollments found</p>
                                    </td>
                                </tr>
                            ) : data.map((row, i) => {
                                const badge = statusBadge(row.payment_status || 'paid');
                                const hasNote = !!notes[row.id];
                                return (
                                    <tr key={row.id}
                                        className="transition-colors"
                                        style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}
                                        onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.02)'}
                                        onMouseLeave={e => e.currentTarget.style.background = ''}>
                                        <td className="px-4 py-3">
                                            <p className="text-sm font-semibold text-white">{row.customer_name}</p>
                                            <p className="text-[11px] text-white/35">{row.customer_email}</p>
                                            {hasNote && (
                                                <span className="inline-flex items-center gap-1 text-[9px] font-bold px-1.5 py-0.5 rounded mt-1"
                                                    style={{ background: 'rgba(231,23,99,0.1)', color: '#e71763' }}>
                                                    <StickyNote className="w-2.5 h-2.5" />NOTE
                                                </span>
                                            )}
                                        </td>
                                        <td className="px-4 py-3">
                                            <span className="text-xs font-medium text-white/60 capitalize">{row.coaching_type || '—'}</span>
                                        </td>
                                        <td className="px-4 py-3">
                                            <span className="text-xs text-white/60 capitalize">{row.plan_type || '—'}</span>
                                        </td>
                                        <td className="px-4 py-3">
                                            <span className="text-xs text-white/60">{row.duration_months ? `${row.duration_months}M` : '—'}</span>
                                        </td>
                                        <td className="px-4 py-3">
                                            <p className="text-sm font-bold text-white">{fmtCurrency(row.amount_paid)}</p>
                                            {row.coupon_code && (
                                                <p className="text-[10px]" style={{ color: '#34d399' }}>
                                                    -{fmtCurrency(row.coupon_savings)}
                                                </p>
                                            )}
                                        </td>
                                        <td className="px-4 py-3">
                                            <span className="text-[10px] font-bold px-2 py-1 rounded-full"
                                                style={{ background: badge.bg, border: `1px solid ${badge.border}`, color: badge.color }}>
                                                {(row.payment_status || 'paid').toUpperCase()}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3">
                                            <p className="text-xs text-white/50">{fmtDate(row.payment_date, true)}</p>
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="flex items-center gap-1.5">
                                                <button onClick={() => setSelected(row)}
                                                    className="w-7 h-7 rounded-lg flex items-center justify-center text-white/35 hover:text-white hover:bg-white/8 transition-all"
                                                    title="View details">
                                                    <Eye className="w-3.5 h-3.5" />
                                                </button>
                                                <button onClick={() => { setNoteTarget(row); }}
                                                    className="w-7 h-7 rounded-lg flex items-center justify-center transition-all"
                                                    style={{ color: hasNote ? '#e71763' : 'rgba(255,255,255,0.35)' }}
                                                    title={hasNote ? 'Edit note' : 'Add note'}
                                                    onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.08)'}
                                                    onMouseLeave={e => e.currentTarget.style.background = ''}>
                                                    <StickyNote className="w-3.5 h-3.5" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                    <div className="flex items-center justify-between px-4 py-3"
                        style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                        <p className="text-xs text-white/30">
                            Page {page} of {totalPages} · {total} records
                        </p>
                        <div className="flex items-center gap-2">
                            <button disabled={page <= 1} onClick={() => setPage(p => p - 1)}
                                className="w-7 h-7 rounded-lg flex items-center justify-center text-white/40 hover:text-white hover:bg-white/8 disabled:opacity-25 transition-all">
                                <ChevronLeft className="w-4 h-4" />
                            </button>
                            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                                const p = Math.max(1, Math.min(totalPages - 4, page - 2)) + i;
                                return (
                                    <button key={p} onClick={() => setPage(p)}
                                        className="w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold transition-all"
                                        style={page === p
                                            ? { background: '#e71763', color: 'white' }
                                            : { color: 'rgba(255,255,255,0.35)' }}>
                                        {p}
                                    </button>
                                );
                            })}
                            <button disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}
                                className="w-7 h-7 rounded-lg flex items-center justify-center text-white/40 hover:text-white hover:bg-white/8 disabled:opacity-25 transition-all">
                                <ChevronRight className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* Detail Drawer */}
            <AnimatePresence>
                {selected && (
                    <DetailDrawer
                        enrollment={selected}
                        onClose={() => setSelected(null)}
                        onNoteClick={(row) => { setNoteTarget(row); setSelected(null); }}
                    />
                )}
            </AnimatePresence>

            {/* Note Modal */}
            <AnimatePresence>
                {noteTarget && (
                    <NoteModal
                        id={noteTarget.id}
                        name={noteTarget.customer_name}
                        onClose={() => { setNoteTarget(null); refreshNotes(); }}
                    />
                )}
            </AnimatePresence>
        </div>
    );
}
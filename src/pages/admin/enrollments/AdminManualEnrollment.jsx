import { useState, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Loader2, AlertCircle, AlertTriangle, CheckCircle2, Plus, X, Edit2, Trash2,
    Search, RefreshCw, MessageCircle, Users, IndianRupee, Eye,
} from 'lucide-react';
import { useSiteData } from '@/contexts/SiteDataContext';
import {
    createManualEnrollment, updateManualEnrollment, deleteManualEnrollment,
    sendEnrollmentEmail, fetchEnrollments, searchEnrollments, fetchEnrollmentPayments,
} from '../adminApi';
import RecordPaymentModal from './RecordPaymentModal';
import PaymentLedgerPanel from './PaymentLedgerPanel';
import PaginationBar from '../PaginationBar';
import {
    fmtCurrency, fmtDate, fmtDateTime, toISTDatetimeLocal, istDatetimeLocalToISO,
    statusBadge, ENROLLMENT_STATUSES, formatLabel, getLifecycleStatus, lifecycleBadge, LIFECYCLE_FILTERS,
} from '../adminUtils';
import EmailSendMenu from './EmailSendMenu';
import { useToast } from '../ToastProvider';
import FilterDropdown from './FilterDropdown';

// ── All 4 real-world payment modes, plus cash/other for edge cases ──────────
const PAYMENT_METHODS = [
    { value: 'razorpay_link', label: 'Razorpay Link' },
    { value: 'razorpay', label: 'Website (Razorpay)' },
    { value: 'upi', label: 'UPI' },
    { value: 'bank_transfer', label: 'Bank Transfer' },
    { value: 'cash', label: 'Cash' },
    { value: 'other', label: 'Other' },
];

const inputCls = "w-full rounded-xl px-3.5 py-2.5 text-sm text-white placeholder:text-white/25 outline-none";
const inputStyle = { background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' };
const labelCls = "text-[11px] font-bold text-white/45 uppercase tracking-widest mb-1.5 block";

function Field({ label, children, required }) {
    return (
        <div>
            <label className={labelCls}>{label} {required && <span style={{ color: '#e71763' }}>*</span>}</label>
            {children}
        </div>
    );
}

function StatCard({ label, value, color }) {
    return (
        <div className="rounded-2xl p-4 sm:p-5" style={{ background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.07)' }}>
            <p className="text-xs text-white/35 uppercase tracking-widest mb-2">{label}</p>
            <p className="text-2xl font-black" style={{ color }}>{value}</p>
        </div>
    );
}

const EMPTY_FORM = {
    customerName: '', customerEmail: '', customerPhone: '',
    coachingType: 'online', planType: 'individual', durationMonths: '3',
    totalAmount: '',
    initialPaymentAmount: '',
    latestPaymentAmount: '', // ← edit-mode only: amount of the latest ledger payment
    paymentMethod: 'razorpay_link', paymentReference: '', paymentDate: toISTDatetimeLocal(new Date().toISOString()),
    planStartDate: toISTDatetimeLocal(new Date().toISOString()),
    paymentStatus: 'paid',
    age: '', city: '', weight: '', goals: '',
    medicalIssue: 'no', medicalNote: '',
    partnerName: '', partnerAge: '', partnerWeight: '', partnerGoals: '',
    adminNote: '',
};

function rowToForm(row) {
    if (!row) return EMPTY_FORM;
    return {
        customerName: row.customer_name || '',
        customerEmail: row.customer_email || '',
        customerPhone: row.customer_phone || '',
        coachingType: row.coaching_type || 'online',
        planType: row.plan_type || 'individual',
        durationMonths: row.duration_months || '3',
        totalAmount: row.total_amount != null ? String(row.total_amount) : (row.amount_paid != null ? String(row.amount_paid) : ''),
        initialPaymentAmount: '',
        latestPaymentAmount: '',
        paymentMethod: row.payment_method || 'razorpay_link',
        paymentReference: row.razorpay_payment_id || '',
        paymentDate: toISTDatetimeLocal(row.payment_date),
        planStartDate: toISTDatetimeLocal(row.plan_start_date),
        paymentStatus: row.payment_status || 'paid',
        age: row.age || '',
        city: row.city || '',
        weight: row.weight || '',
        goals: Array.isArray(row.goals) ? row.goals.join(', ') : (row.goals || ''),
        medicalIssue: row.medical_issue || 'no',
        medicalNote: row.medical_note || '',
        partnerName: row.partner_name || '',
        partnerAge: row.partner_age || '',
        partnerWeight: row.partner_weight || '',
        partnerGoals: Array.isArray(row.partner_goals) ? row.partner_goals.join(', ') : (row.partner_goals || ''),
        adminNote: row.admin_note || '',
    };
}

function EnrollmentFormModal({ editingRow, onClose, onSaved, coachingTypes, durations, pricingTable }) {
    const isEdit = !!editingRow;
    const [form, setForm] = useState(() => rowToForm(editingRow));
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');
    const [loadingLedger, setLoadingLedger] = useState(false);
    const [hasExistingPayment, setHasExistingPayment] = useState(false);
    const toast = useToast();

    // Pull the latest real payment off the ledger so the edit form actually
    // reflects what was paid — this is what fixes "payment id not
    // auto-filling" and "payment date not visible on edit".
    useEffect(() => {
        setForm(rowToForm(editingRow));
        setError('');
        setHasExistingPayment(false);

        if (isEdit && editingRow?.id) {
            setLoadingLedger(true);
            fetchEnrollmentPayments(editingRow.id)
                .then((payments) => {
                    const latest = payments && payments.length ? payments[payments.length - 1] : null;
                    setHasExistingPayment(!!latest);
                    if (latest) {
                        setForm((f) => ({
                            ...f,
                            latestPaymentAmount: latest.amount != null ? String(latest.amount) : '',
                            paymentMethod: latest.method || f.paymentMethod,
                            paymentReference: latest.reference || '',
                            paymentDate: toISTDatetimeLocal(latest.paid_at),
                        }));
                    }
                })
                .catch(() => { /* non-fatal — form just won't prefill */ })
                .finally(() => setLoadingLedger(false));
        }
    }, [editingRow]);

    const isCouple = form.planType === 'couple';

    const set = (field) => (e) => {
        const val = e?.target ? e.target.value : e;
        setForm((f) => ({ ...f, [field]: val }));
    };

    const suggestedProgram = () => {
        const ct = coachingTypes.find((c) => c.id === form.coachingType);
        const dur = durations.find((d) => d.months === form.durationMonths);
        return `${ct?.name || 'RECODE Coaching'} — ${isCouple ? 'Couple' : 'Individual'} — ${dur?.label || ''}`;
    };

    const suggestedAmount = () =>
        pricingTable[form.coachingType]?.[form.planType]?.[form.durationMonths] || '';

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        if (!form.customerName.trim() || !form.totalAmount) {
            setError('Client name and total program price are required.');
            return;
        }

        setSaving(true);
        try {
            const payload = {
                customerName: form.customerName.trim(),
                customerEmail: form.customerEmail.trim() || null,
                customerPhone: form.customerPhone.trim() || null,
                coachingType: form.coachingType,
                planType: form.planType,
                durationMonths: form.durationMonths,
                totalAmount: Number(form.totalAmount),
                initialPaymentAmount: isEdit ? undefined : (form.initialPaymentAmount === '' ? undefined : Number(form.initialPaymentAmount)),
                paymentAmount: isEdit && form.latestPaymentAmount !== '' ? Number(form.latestPaymentAmount) : undefined,
                paymentMethod: form.paymentMethod,
                paymentReference: form.paymentReference.trim() || null,
                paymentDate: istDatetimeLocalToISO(form.paymentDate),
                age: form.age || null,
                city: form.city || null,
                weight: form.weight || null,
                goals: form.goals ? form.goals.split(',').map((g) => g.trim()).filter(Boolean) : [],
                medicalIssue: form.medicalIssue,
                medicalNote: form.medicalNote || null,
                partnerName: isCouple ? form.partnerName || null : null,
                partnerAge: isCouple ? form.partnerAge || null : null,
                partnerWeight: isCouple ? form.partnerWeight || null : null,
                partnerGoals: isCouple && form.partnerGoals
                    ? form.partnerGoals.split(',').map((g) => g.trim()).filter(Boolean) : null,
                adminNote: form.adminNote || null,
                planStartDate: isEdit ? istDatetimeLocalToISO(form.planStartDate) : undefined,
            };

            const saved = isEdit
                ? await updateManualEnrollment(editingRow.id, payload)
                : await createManualEnrollment(payload);

            onSaved(saved);
            toast.success(isEdit ? 'Enrollment updated successfully' : 'Enrollment added successfully');
        } catch (err) {
            setError(err.message || 'Failed to save enrollment.');
            toast.error(err.message || 'Failed to save enrollment.');
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />

            <motion.div
                initial={{ opacity: 0, scale: 0.96, y: 12 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.97 }}
                className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl"
                style={{ background: '#0e0e16', border: '1px solid rgba(255,255,255,0.1)' }}
                onClick={(e) => e.stopPropagation()}
            >
                <div
                    className="sticky top-0 z-10 flex items-center justify-between px-5 sm:px-6 py-4"
                    style={{ background: 'rgba(14,14,22,0.97)', borderBottom: '1px solid rgba(255,255,255,0.06)', backdropFilter: 'blur(20px)' }}
                >
                    <h3 className="font-black text-white text-sm flex items-center gap-2">
                        {isEdit ? <Edit2 className="w-4 h-4" style={{ color: '#e71763' }} /> : <Plus className="w-4 h-4" style={{ color: '#e71763' }} />}
                        {isEdit ? `Edit Enrollment — ${editingRow.enrollment_id}` : 'New Manual Enrollment'}
                    </h3>
                    <button onClick={onClose} className="text-white/30 hover:text-white">
                        <X className="w-4 h-4" />
                    </button>
                </div>

                <form onSubmit={handleSubmit}>
                    <div className="p-5 sm:p-6 space-y-5">
                        {error && (
                            <div className="flex items-center gap-2 px-4 py-3 rounded-xl text-sm"
                                style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', color: '#f87171' }}>
                                <AlertCircle className="w-4 h-4 flex-shrink-0" /> {error}
                            </div>
                        )}

                        {/* Client details */}
                        <div className="rounded-2xl p-4 sm:p-5 space-y-4" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.07)' }}>
                            <p className="text-[10px] font-black uppercase tracking-widest" style={{ color: '#e71763' }}>Client Details</p>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <Field label="Full Name" required>
                                    <input className={inputCls} style={inputStyle} value={form.customerName} onChange={set('customerName')} placeholder="Client's name" />
                                </Field>
                                <Field label="WhatsApp / Phone">
                                    <input className={inputCls} style={inputStyle} value={form.customerPhone} onChange={set('customerPhone')} placeholder="+91 XXXXXXXXXX" />
                                </Field>
                            </div>
                            <Field label="Email (needed to send confirmation email)">
                                <input type="email" className={inputCls} style={inputStyle} value={form.customerEmail} onChange={set('customerEmail')} placeholder="client@email.com" />
                            </Field>
                            <div className="grid grid-cols-3 gap-3">
                                <Field label="Age"><input type="number" className={inputCls} style={inputStyle} value={form.age} onChange={set('age')} /></Field>
                                <Field label="City"><input className={inputCls} style={inputStyle} value={form.city} onChange={set('city')} /></Field>
                                <Field label="Weight (kg)"><input type="number" className={inputCls} style={inputStyle} value={form.weight} onChange={set('weight')} /></Field>
                            </div>
                            <Field label="Goals (comma separated)">
                                <input className={inputCls} style={inputStyle} value={form.goals} onChange={set('goals')} placeholder="Fat Loss, Muscle Gain" />
                            </Field>
                            <div>
                                <label className={labelCls}>Medical Issue?</label>
                                <div className="flex gap-4">
                                    {['no', 'yes'].map((opt) => (
                                        <label key={opt} className="flex items-center gap-2 text-sm text-white cursor-pointer">
                                            <input type="radio" name="medicalIssue" value={opt} checked={form.medicalIssue === opt}
                                                onChange={() => setForm((f) => ({ ...f, medicalIssue: opt }))} className="accent-primary" />
                                            <span className="capitalize">{opt}</span>
                                        </label>
                                    ))}
                                </div>
                                {form.medicalIssue === 'yes' && (
                                    <input className={`${inputCls} mt-2`} style={inputStyle} value={form.medicalNote} onChange={set('medicalNote')} placeholder="Briefly describe" />
                                )}
                            </div>
                        </div>

                        {/* Plan */}
                        <div className="rounded-2xl p-4 sm:p-5 space-y-4" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.07)' }}>
                            <p className="text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5" style={{ color: '#e71763' }}>
                                <Users className="w-3 h-3" /> Plan
                            </p>
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                <Field label="Coaching Type">
                                    <select className={inputCls} style={inputStyle} value={form.coachingType} onChange={set('coachingType')}>
                                        {coachingTypes.map((c) => <option key={c.id} value={c.id} style={{ background: '#0a0a0a' }}>{c.shortName}</option>)}
                                    </select>
                                </Field>
                                <Field label="Plan Type">
                                    <select className={inputCls} style={inputStyle} value={form.planType} onChange={set('planType')}>
                                        <option value="individual" style={{ background: '#0a0a0a' }}>Individual</option>
                                        <option value="couple" style={{ background: '#0a0a0a' }}>Couple</option>
                                    </select>
                                </Field>
                                <Field label="Duration">
                                    <select className={inputCls} style={inputStyle} value={form.durationMonths} onChange={set('durationMonths')}>
                                        {durations.map((d) => <option key={d.months} value={d.months} style={{ background: '#0a0a0a' }}>{d.label}</option>)}
                                    </select>
                                </Field>
                            </div>
                            <p className="text-[11px] text-white/30 leading-relaxed">
                                Program name: <span className="text-white/60 font-medium">{suggestedProgram()}</span> — generated from the fields above, always in the same format.
                            </p>

                            {isCouple && (
                                <div className="pt-2 space-y-3" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                                    <p className="text-xs font-bold" style={{ color: '#e71763' }}>Partner Details</p>
                                    <div className="grid grid-cols-3 gap-3">
                                        <input className={inputCls} style={inputStyle} value={form.partnerName} onChange={set('partnerName')} placeholder="Partner name" />
                                        <input type="number" className={inputCls} style={inputStyle} value={form.partnerAge} onChange={set('partnerAge')} placeholder="Age" />
                                        <input type="number" className={inputCls} style={inputStyle} value={form.partnerWeight} onChange={set('partnerWeight')} placeholder="Weight (kg)" />
                                    </div>
                                    <input className={inputCls} style={inputStyle} value={form.partnerGoals} onChange={set('partnerGoals')} placeholder="Partner goals (comma separated)" />
                                </div>
                            )}
                        </div>

                        {/* Payment */}
                        <div className="rounded-2xl p-4 sm:p-5 space-y-4" style={{ background: 'rgba(231,23,99,0.05)', border: '1px solid rgba(231,23,99,0.18)' }}>
                            <p className="text-[10px] font-black uppercase tracking-widest" style={{ color: '#e71763' }}>Payment</p>
                            <Field label="Total Program Price (₹)" required>
                                <input type="number" className={inputCls} style={inputStyle} value={form.totalAmount} onChange={set('totalAmount')} placeholder={suggestedAmount() ? String(suggestedAmount()) : '0'} />
                            </Field>

                            {!isEdit && (
                                <Field label="Amount Received Now (₹)">
                                    <input type="number" className={inputCls} style={inputStyle} value={form.initialPaymentAmount} onChange={set('initialPaymentAmount')} placeholder={`Full amount (${form.totalAmount || 0}) if left blank`} />
                                    <p className="text-[10px] text-white/25 mt-1.5">
                                        Leave blank to mark it fully paid now. Enter a smaller amount to record a
                                        deposit — the remaining balance will show up under Balance Due, and you'll
                                        be able to add each further payment (UPI, bank transfer, cash…) from this
                                        client's detail view as they come in.
                                    </p>
                                </Field>
                            )}

                            {isEdit && (
                                <Field label={hasExistingPayment ? 'Latest Payment Amount (₹)' : 'Record First Payment (₹)'}>
                                    <input
                                        type="number"
                                        className={inputCls}
                                        style={inputStyle}
                                        value={form.latestPaymentAmount}
                                        onChange={set('latestPaymentAmount')}
                                        placeholder={loadingLedger ? 'Loading…' : '0'}
                                        disabled={loadingLedger}
                                    />
                                    <p className="text-[10px] text-white/25 mt-1.5">
                                        {loadingLedger
                                            ? 'Loading this client\'s payment history…'
                                            : hasExistingPayment
                                                ? 'This corrects the amount of the most recent payment on this client\'s ledger — the balance due recalculates automatically.'
                                                : 'No payment has been recorded on this enrollment yet — enter an amount to record the first one.'}
                                    </p>
                                </Field>
                            )}

                            <div className="grid grid-cols-2 gap-3">
                                <Field label="Payment Method">
                                    <select className={inputCls} style={inputStyle} value={form.paymentMethod} onChange={set('paymentMethod')}>
                                        {PAYMENT_METHODS.map((m) => <option key={m.value} value={m.value} style={{ background: '#0a0a0a' }}>{m.label}</option>)}
                                    </select>
                                </Field>
                                <Field label="Payment Date">
                                    <input
                                        type="datetime-local"
                                        className={inputCls}
                                        style={inputStyle}
                                        value={form.paymentDate}
                                        onChange={set('paymentDate')}
                                    />
                                </Field>
                            </div>
                            {isEdit && (
                                <Field label="Plan Start Date">
                                    <input
                                        type="datetime-local"
                                        className={inputCls}
                                        style={inputStyle}
                                        value={form.planStartDate}
                                        onChange={set('planStartDate')}
                                    />
                                    <p className="text-[10px] text-white/25 mt-1.5">
                                        Anchors the Active/Expired badge — set once at creation and never touched by
                                        later payments/edits. Only correct this if the badge is missing or wrong.
                                    </p>
                                </Field>
                            )}

                            <div className="grid grid-cols-2 gap-3">
                                <Field label="Payment Reference (UTR / UPI / Payment ID)">
                                    <input className={inputCls} style={inputStyle} value={form.paymentReference} onChange={set('paymentReference')} placeholder="Optional" />
                                </Field>
                                <Field label="Status">
                                    <select className={inputCls} style={inputStyle} value={form.paymentStatus} onChange={set('paymentStatus')}>
                                        {ENROLLMENT_STATUSES.map((s) => <option key={s} value={s} style={{ background: '#0a0a0a' }}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
                                    </select>
                                </Field>
                            </div>
                        </div>

                        <Field label="Internal Note (visible to admins only)">
                            <textarea rows={2} className={`${inputCls} resize-none`} style={inputStyle} value={form.adminNote} onChange={set('adminNote')}
                                placeholder="e.g. Friend of Sudarshan, paid via personal UPI" />
                        </Field>
                    </div>

                    <div className="sticky bottom-0 p-5 sm:p-6 pt-4 flex gap-3" style={{ background: 'rgba(14,14,22,0.97)', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                        <button type="button" onClick={onClose}
                            className="flex-1 py-3 rounded-xl text-sm font-bold text-white/50"
                            style={{ border: '1px solid rgba(255,255,255,0.1)' }}>
                            Cancel
                        </button>
                        <button type="submit" disabled={saving}
                            className="flex-[2] flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-black text-white disabled:opacity-60"
                            style={{ background: '#e71763', boxShadow: '0 0 20px rgba(231,23,99,0.3)' }}>
                            {saving
                                ? <><Loader2 className="w-4 h-4 animate-spin" /> Saving…</>
                                : <><CheckCircle2 className="w-4 h-4" /> {isEdit ? 'Save Changes' : 'Save Enrollment'}</>
                            }
                        </button>
                    </div>
                </form>
            </motion.div>
        </div>
    );
}

// ── Delete confirmation modal ─────────────────────────────────────────────
function ConfirmDeleteModal({ row, deleting, onCancel, onConfirm }) {
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
                    <div className="w-12 h-12 rounded-2xl flex items-center justify-center mx-auto mb-4"
                        style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.25)' }}>
                        <AlertTriangle className="w-5 h-5" style={{ color: '#f87171' }} />
                    </div>

                    <p className="font-bold text-white text-sm mb-1.5">Delete this enrollment?</p>
                    <p className="text-xs text-white/40 leading-relaxed">
                        <span className="font-mono font-bold text-white/70">{row?.enrollment_id}</span> —{' '}
                        <span className="text-white/60">{row?.customer_name}</span> — will be permanently removed
                        along with its full payment history. This can't be undone.
                    </p>

                    <div className="flex gap-3 mt-5">
                        <button onClick={onCancel} disabled={deleting}
                            className="flex-1 py-2.5 rounded-xl text-sm text-white/50 hover:text-white transition-all disabled:opacity-50"
                            style={{ border: '1px solid rgba(255,255,255,0.08)' }}>
                            Cancel
                        </button>
                        <button onClick={onConfirm} disabled={deleting}
                            className="flex-1 py-2.5 rounded-xl text-sm font-bold text-white flex items-center justify-center gap-2 disabled:opacity-60 transition-all"
                            style={{ background: '#ef4444' }}>
                            {deleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                            {deleting ? 'Deleting…' : 'Delete'}
                        </button>
                    </div>
                </div>
            </motion.div>
        </div>
    );
}

// ── Detail drawer (unchanged from original except for import path) ───────

function ManualEnrollmentDetailDrawer({ row, onClose, onEdit, onPaymentRecorded }) {
    const [enrollment, setEnrollment] = useState(row);

    useEffect(() => { setEnrollment(row); }, [row]);

    if (!enrollment) return null;

    const handleUpdated = (updated) => {
        setEnrollment((prev) => ({ ...prev, ...updated }));
        onPaymentRecorded?.(updated);
    };

    const dl = (label, value) => (
        <div className="flex items-start justify-between gap-4 py-2.5" style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
            <span className="text-xs text-white/35 flex-shrink-0 w-32">{label}</span>
            <span className="text-xs text-white text-right font-medium flex-1">{value || '—'}</span>
        </div>
    );

    return (
        <div className="fixed inset-0 z-50 flex justify-end" onClick={onClose}>
            <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
            <motion.div
                initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
                transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                className="relative w-full max-w-md h-full overflow-y-auto"
                style={{ background: '#0a0a14', borderLeft: '1px solid rgba(255,255,255,0.08)' }}
                onClick={(e) => e.stopPropagation()}
            >
                <div
                    className="sticky top-0 z-10 px-5 py-4"
                    style={{ background: 'rgba(10,10,20,0.95)', borderBottom: '1px solid rgba(255,255,255,0.06)', backdropFilter: 'blur(20px)' }}
                >
                    <div className="flex items-center justify-between gap-3">
                        <div className="min-w-0">
                            <p className="font-black text-white text-sm truncate">{enrollment.customer_name}</p>
                            <p className="text-[10px] text-white/35 font-mono mt-0.5">{enrollment.enrollment_id}</p>
                        </div>
                        <button onClick={onClose} className="w-8 h-8 rounded-lg flex items-center justify-center text-white/30 hover:text-white hover:bg-white/5 flex-shrink-0">
                            <X className="w-4 h-4" />
                        </button>
                    </div>

                    <div className="flex items-center gap-2 mt-3 flex-wrap">
                        <span
                            className="text-[9px] font-bold px-1.5 py-0.5 rounded-full"
                            style={{ background: 'rgba(96,165,250,0.1)', color: '#60a5fa' }}
                        >
                            MANUAL ENTRY
                        </span>
                        <button
                            onClick={() => onEdit(enrollment)}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-bold transition-all"
                            style={{ background: 'rgba(231,23,99,0.1)', border: '1px solid rgba(231,23,99,0.2)', color: '#e71763' }}
                        >
                            <Edit2 className="w-3 h-3" /> Edit Enrollment
                        </button>
                        {enrollment.customer_phone && (
                            <a
                                href={`https://wa.me/${enrollment.customer_phone.replace(/\D/g, '')}`}
                                target="_blank" rel="noopener noreferrer"
                                className="flex items-center justify-center w-9 h-9 rounded-lg transition-all"
                                style={{ background: 'rgba(37,211,102,0.1)', border: '1px solid rgba(37,211,102,0.25)', color: '#25D366' }}
                                title="Open WhatsApp"
                            >
                                <MessageCircle className="w-3.5 h-3.5" />
                            </a>
                        )}
                    </div>
                </div>

                <div className="p-5 space-y-6">
                    <PaymentLedgerPanel enrollment={enrollment} onEnrollmentUpdated={handleUpdated} />

                    <section>
                        <p className="text-[10px] font-black uppercase tracking-widest mb-3" style={{ color: '#e71763' }}>
                            Client Information
                        </p>
                        <div className="rounded-xl overflow-hidden" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}>
                            <div className="px-4">
                                {dl('Email', enrollment.customer_email)}
                                {dl('Phone', enrollment.customer_phone)}
                                {dl('Age', enrollment.age ? `${enrollment.age} yrs` : null)}
                                {dl('City', enrollment.city)}
                                {dl('Weight', enrollment.weight ? `${enrollment.weight} kg` : null)}
                                {dl('Goals', Array.isArray(enrollment.goals) ? enrollment.goals.join(', ') : enrollment.goals)}
                                {enrollment.medical_issue === 'yes' && dl('Medical', enrollment.medical_note || 'Yes')}
                            </div>
                        </div>
                    </section>

                    <section>
                        <p className="text-[10px] font-black uppercase tracking-widest mb-3" style={{ color: '#e71763' }}>
                            Enrollment Details
                        </p>
                        <div className="rounded-xl overflow-hidden" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}>
                            <div className="px-4">
                                {dl('Program', enrollment.program_name)}
                                {dl('Coaching Type', formatLabel(enrollment.coaching_type))}
                                {dl('Plan Type', formatLabel(enrollment.plan_type))}
                                {dl('Duration', enrollment.duration_months ? `${enrollment.duration_months} Month${Number(enrollment.duration_months) > 1 ? 's' : ''}` : null)}
                                {dl('Payment Date', fmtDateTime(enrollment.payment_date))}
                                {dl('Created', fmtDate(enrollment.created_at))}
                            </div>
                        </div>
                    </section>

                    {enrollment.admin_note && (
                        <section>
                            <p className="text-[10px] font-black uppercase tracking-widest mb-3" style={{ color: '#e71763' }}>
                                Internal Note
                            </p>
                            <div className="rounded-xl p-4" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}>
                                <p className="text-xs text-white/60 leading-relaxed">{enrollment.admin_note}</p>
                            </div>
                        </section>
                    )}
                </div>
            </motion.div>
        </div>
    );
}
export default function AdminManualEnrollment() {
    const { coachingTypes, durations, pricingTable } = useSiteData();
    const toast = useToast();
    const [rows, setRows] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [search, setSearch] = useState('');
    const [lifecycleFilter, setLifecycleFilter] = useState('all');

    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState(null);
    const [searching, setSearching] = useState(false);
    const [paymentTarget, setPaymentTarget] = useState(null);

    const [modalOpen, setModalOpen] = useState(false);
    const [editingRow, setEditingRow] = useState(null);
    const [viewTarget, setViewTarget] = useState(null);

    // ── Delete state ──
    const [deleteTarget, setDeleteTarget] = useState(null);
    const [deleting, setDeleting] = useState(false);

    // ── Pagination state ──
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(15);

    const load = useCallback(async () => {
        setLoading(true);
        setError('');
        try {
            const res = await fetchEnrollments({ pageSize: 9999 });
            const manualRows = (res.rows || []).filter((r) => r.source === 'manual');
            setRows(manualRows);
        } catch (e) {
            setError(e.message || 'Failed to load manual enrollments.');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { load(); }, [load]);

    const filtered = useMemo(() => {
        let out = rows;

        if (search.trim()) {
            const q = search.trim().toLowerCase();
            out = out.filter((r) =>
                (r.customer_name || '').toLowerCase().includes(q) ||
                (r.customer_email || '').toLowerCase().includes(q) ||
                (r.enrollment_id || '').toLowerCase().includes(q));
        }

        if (lifecycleFilter !== 'all') {
            out = out.filter((r) => {
                const lc = getLifecycleStatus(r);
                if (!lc) return false;
                return lifecycleFilter === 'expiring_soon' ? !!lc.expiringSoon : lc.tag === lifecycleFilter;
            });
        }

        return out;
    }, [rows, search, lifecycleFilter]);

    useEffect(() => { setPage(1); }, [search, lifecycleFilter, pageSize]);

    const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
    const pageData = useMemo(() => {
        const start = (page - 1) * pageSize;
        return filtered.slice(start, start + pageSize);
    }, [filtered, page, pageSize]);

    // Same fix as the main Enrollments page: only count rows actually marked
    // paid, so a manual entry later marked failed/refunded can't keep
    // inflating this total.
    const totalRevenue = rows.reduce((s, r) => s + (r.payment_status === 'paid' ? (Number(r.amount_paid) || 0) : 0), 0);
    const withEmailCount = rows.filter((r) => r.customer_email).length;
    const partialCount = rows.filter((r) => r.payment_plan_status === 'partial').length;

    const openNew = () => { setEditingRow(null); setModalOpen(true); };
    const openEdit = (row) => { setViewTarget(null); setEditingRow(row); setModalOpen(true); };

    const handleSaved = (saved) => {
        setRows((prev) => {
            const exists = prev.some((r) => r.id === saved.id);
            return exists ? prev.map((r) => (r.id === saved.id ? saved : r)) : [saved, ...prev];
        });
        setModalOpen(false);
        setEditingRow(null);
    };

    const handleSearch = async () => {
        if (!searchQuery.trim()) { setSearchResults(null); return; }
        setSearching(true);
        try {
            const results = await searchEnrollments(searchQuery.trim());
            setSearchResults(results);
        } catch (e) {
            toast.error(e.message || 'Search failed.');
        } finally {
            setSearching(false);
        }
    };

    const handlePaymentSaved = (updated) => {
        setRows((prev) => {
            const exists = prev.some((r) => r.id === updated.id);
            return exists ? prev.map((r) => (r.id === updated.id ? updated : r)) : prev;
        });
        setPaymentTarget(null);
        toast.success('Payment recorded');
        setSearchResults((prev) => prev ? prev.map((r) => (r.id === updated.id ? updated : r)) : prev);
    };

    const handleLedgerPaymentRecorded = useCallback((updated) => {
        if (!updated?.id) return;
        setRows((prev) => prev.map((r) => (r.id === updated.id ? { ...r, ...updated } : r)));
    }, []);

    const handleSendEmail = async (row, template) => {
        try {
            await sendEnrollmentEmail(row.id, template);
            toast.success('Email sent successfully');
        } catch (e) {
            setError('Failed to send email.');
            toast.error(e.message || 'Failed to send email.');
        }
    };

    const requestDelete = (row) => setDeleteTarget(row);

    const confirmDelete = async () => {
        if (!deleteTarget) return;
        setDeleting(true);
        try {
            await deleteManualEnrollment(deleteTarget.id);
            setRows((prev) => prev.filter((r) => r.id !== deleteTarget.id));
            toast.success('Enrollment deleted');
            setDeleteTarget(null);
        } catch (e) {
            toast.error(e.message || 'Failed to delete enrollment.');
        } finally {
            setDeleting(false);
        }
    };

    return (
        <div>
            <div className="flex items-center justify-between gap-4 mb-6 flex-wrap">
                <div>
                    <h1 className="text-xl font-black text-white mb-1">Manual Enrollments</h1>
                    <p className="text-xs text-white/35">
                        Clients who paid directly (Razorpay link, UPI, bank transfer, cash) without using the website checkout.
                    </p>
                </div>

                <div className="flex items-center gap-2">
                    <button onClick={load}
                        className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs text-white/50 hover:text-white transition-all"
                        style={{ border: '1px solid rgba(255,255,255,0.08)' }}>
                        <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} /> Refresh
                    </button>
                    <button onClick={openNew}
                        className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-black text-white"
                        style={{ background: '#e71763', boxShadow: '0 0 20px rgba(231,23,99,0.3)' }}>
                        <Plus className="w-3.5 h-3.5" /> Add Enrollment
                    </button>
                </div>
            </div>

            <div className="rounded-2xl p-4 sm:p-5 mb-6" style={{ background: 'rgba(96,165,250,0.05)', border: '1px solid rgba(96,165,250,0.18)' }}>
                <p className="text-xs font-black uppercase tracking-widest mb-2" style={{ color: '#60a5fa' }}>
                    Check for an existing enrollment first
                </p>
                <p className="text-[11px] text-white/40 mb-3">
                    Search by name, email, or phone before adding a new record — if the client already started
                    checkout on the website (a pending row), record the payment against that instead of creating a duplicate.
                    This also catches the "half-filled the form, then paid the owner directly" case — search
                    first, then use <strong className="text-white/60">Record Payment</strong> on the existing row.
                </p>
                <div className="flex gap-2">
                    <input value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                        placeholder="Search name, email, or phone…"
                        className="flex-1 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder:text-white/25 outline-none"
                        style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }} />
                    <button onClick={handleSearch} disabled={searching}
                        className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-bold text-white disabled:opacity-60"
                        style={{ background: 'rgba(96,165,250,0.15)', border: '1px solid rgba(96,165,250,0.35)', color: '#60a5fa' }}>
                        {searching ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Search className="w-3.5 h-3.5" />}
                        Search
                    </button>
                </div>

                {searchResults && (
                    searchResults.length === 0 ? (
                        <p className="text-xs text-white/30 mt-3">No matching enrollment found — safe to create a new one.</p>
                    ) : (
                        <div className="mt-3 space-y-2">
                            {searchResults.map((r) => (
                                <div key={r.id} className="flex items-center justify-between gap-3 px-3 py-2.5 rounded-xl"
                                    style={{ background: 'rgba(255,255,255,0.03)' }}>
                                    <div className="min-w-0">
                                        <p className="text-xs font-bold text-white truncate">{r.customer_name} <span className="text-white/30 font-normal">· {r.enrollment_id}</span></p>
                                        <p className="text-[11px] text-white/35">
                                            {r.program_name} · {fmtCurrency(r.amount_paid)} paid
                                            {Number(r.balance_due) > 0 ? ` · ${fmtCurrency(r.balance_due)} due` : ''} · {r.payment_status}
                                            {r.source ? ` · ${r.source}` : ''}
                                        </p>
                                    </div>
                                    {Number(r.balance_due) > 0 ? (
                                        <button onClick={() => setPaymentTarget(r)}
                                            className="flex-shrink-0 px-3 py-1.5 rounded-lg text-[11px] font-bold text-white"
                                            style={{ background: '#e71763' }}>
                                            Record Payment
                                        </button>
                                    ) : r.payment_status === 'paid' ? (
                                        <span className="flex-shrink-0 text-[10px] font-bold px-2.5 py-1.5 rounded-full"
                                            style={{ background: 'rgba(52,211,153,0.1)', color: '#34d399' }}>
                                            Fully Paid
                                        </span>
                                    ) : (
                                        <span className="flex-shrink-0 text-[10px] font-bold px-2.5 py-1.5 rounded-full"
                                            style={{ background: 'rgba(96,165,250,0.1)', color: '#60a5fa' }}>
                                            Awaiting Payment
                                        </span>
                                    )}
                                </div>
                            ))}
                        </div>
                    )
                )}
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
                <StatCard label="Manual Enrollments" value={rows.length} color="white" />
                <StatCard label="Total Revenue" value={fmtCurrency(totalRevenue)} color="#e71763" />
                <StatCard label="With Email On File" value={withEmailCount} color="#34d399" />
                <StatCard label="Partial Payments" value={partialCount} color={partialCount ? '#fbbf24' : '#34d399'} />
            </div>

            <div className="flex flex-wrap items-center gap-3 mb-5">
                <div className="relative max-w-sm flex-1 min-w-[220px]">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/30" />
                    <input value={search} onChange={(e) => setSearch(e.target.value)}
                        placeholder="Search name, email, enrollment ID…"
                        className="w-full rounded-xl pl-9 pr-4 py-2.5 text-sm text-white placeholder:text-white/25 outline-none"
                        style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }} />
                </div>

                <FilterDropdown
                    value={lifecycleFilter}
                    onChange={setLifecycleFilter}
                    options={LIFECYCLE_FILTERS}
                    minWidth={165}
                    getBadge={(value) =>
                        value === 'all'
                            ? { bg: 'rgba(255,255,255,0.05)', border: 'rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.65)' }
                            : value === 'expiring_soon'
                                ? { bg: 'rgba(251,191,36,0.1)', border: 'rgba(251,191,36,0.3)', color: '#fbbf24' }
                                : lifecycleBadge(value)
                    }
                />
            </div>

            {error && (
                <div className="flex items-center gap-2 px-4 py-3 rounded-xl mb-4 text-sm"
                    style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', color: '#f87171' }}>
                    <AlertCircle className="w-4 h-4 flex-shrink-0" /> {error}
                    <button onClick={() => setError('')} className="ml-auto text-white/30 hover:text-white">
                        <X className="w-3.5 h-3.5" />
                    </button>
                </div>
            )}

            <div className="rounded-2xl overflow-hidden" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.07)' }}>
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.06)', background: 'rgba(255,255,255,0.02)' }}>
                                {['Client', 'Program', 'Amount', 'Method', 'Date', 'Status', 'Actions'].map((label) => (
                                    <th key={label} className="px-4 py-3 text-left text-[10px] font-black uppercase tracking-widest text-white/35 whitespace-nowrap">
                                        {label}
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr><td colSpan={7} className="px-4 py-16 text-center"><Loader2 className="w-6 h-6 animate-spin mx-auto text-white/25" /></td></tr>
                            ) : pageData.length === 0 ? (
                                <tr><td colSpan={7} className="px-4 py-16 text-center"><p className="text-sm text-white/25">No manual enrollments yet</p></td></tr>
                            ) : (
                                pageData.map((row) => {
                                    const badge = statusBadge(row.payment_status || 'paid');
                                    const isPartial = row.payment_plan_status === 'partial';
                                    const methodLabel = PAYMENT_METHODS.find((m) => m.value === row.payment_method)?.label
                                        || formatLabel(row.payment_method);
                                    return (
                                        <tr key={row.id} className="transition-colors"
                                            style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}
                                            onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(255,255,255,0.02)')}
                                            onMouseLeave={(e) => (e.currentTarget.style.background = '')}>
                                            <td className="px-4 py-3">
                                                <p className="text-sm font-semibold text-white">{row.customer_name}</p>
                                                <p className="text-[11px] text-white/35">{row.customer_email || row.customer_phone || '—'}</p>
                                            </td>
                                            <td className="px-4 py-3">
                                                <span className="text-xs text-white/60">{row.program_name}</span>
                                            </td>
                                            <td className="px-4 py-3">
                                                <p className="text-sm font-bold text-white">{fmtCurrency(row.amount_paid)} <span className="text-white/25 font-normal">/ {fmtCurrency(row.total_amount)}</span></p>
                                                {isPartial && (
                                                    <p className="text-[10px] font-bold" style={{ color: '#fbbf24' }}>
                                                        Partial · {fmtCurrency(row.balance_due)} due
                                                    </p>
                                                )}
                                            </td>
                                            <td className="px-4 py-3">
                                                <span className="text-xs text-white/50 capitalize">{methodLabel}</span>
                                            </td>
                                            <td className="px-4 py-3">
                                                <span className="text-xs text-white/50">{fmtDateTime(row.payment_date)}</span>
                                            </td>
                                            <td className="px-4 py-3">
                                                <span className="text-[10px] font-bold px-2.5 py-1 rounded-full"
                                                    style={{ background: badge.bg, border: `1px solid ${badge.border}`, color: badge.color }}>
                                                    {(row.payment_status || 'paid').toUpperCase()}
                                                </span>
                                                {(() => {
                                                    const lc = getLifecycleStatus(row);
                                                    if (!lc) return null;
                                                    const b = lifecycleBadge(lc.tag);
                                                    return (
                                                        <div className="flex items-center gap-1.5 mt-2 pl-0.5">
                                                            <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: b.color }} />
                                                            <span className="text-[10px] font-semibold" style={{ color: b.color }}>{lc.label}</span>
                                                            {lc.tag !== 'expired' && lc.expiringSoon && (
                                                                <span className="text-[10px]" style={{ color: '#fbbf24' }}>· {lc.daysRemaining}d left</span>
                                                            )}
                                                        </div>
                                                    );
                                                })()}
                                            </td>
                                            <td className="px-4 py-3">
                                                <div className="flex items-center gap-1.5">
                                                    <button onClick={() => setViewTarget(row)}
                                                        className="w-7 h-7 rounded-lg flex items-center justify-center text-white/35 hover:text-white hover:bg-white/8 transition-all"
                                                        title="View details & payment history">
                                                        <Eye className="w-3.5 h-3.5" />
                                                    </button>

                                                    <button onClick={() => openEdit(row)}
                                                        className="w-7 h-7 rounded-lg flex items-center justify-center text-white/35 hover:text-white hover:bg-white/8 transition-all"
                                                        title="Edit">
                                                        <Edit2 className="w-3.5 h-3.5" />
                                                    </button>

                                                    <EmailSendMenu
                                                        compact
                                                        hasCustomerEmail={!!row.customer_email}
                                                        onSend={(template) => handleSendEmail(row, template)}
                                                    />

                                                    {Number(row.balance_due) > 0 && (
                                                        <button onClick={() => setPaymentTarget(row)}
                                                            className="w-7 h-7 rounded-lg flex items-center justify-center text-white/35 hover:text-white hover:bg-white/8 transition-all"
                                                            title="Record payment">
                                                            <IndianRupee className="w-3.5 h-3.5" />
                                                        </button>
                                                    )}

                                                    {row.customer_phone && (
                                                        <a href={`https://wa.me/${row.customer_phone.replace(/\D/g, '')}`}
                                                            target="_blank" rel="noopener noreferrer"
                                                            className="w-7 h-7 rounded-lg flex items-center justify-center transition-all"
                                                            style={{ color: '#25D366' }}
                                                            title="Open WhatsApp">
                                                            <MessageCircle className="w-3.5 h-3.5" />
                                                        </a>
                                                    )}

                                                    <button onClick={() => requestDelete(row)}
                                                        className="w-7 h-7 rounded-lg flex items-center justify-center text-white/35 hover:text-red-400 hover:bg-red-500/8 transition-all"
                                                        title="Delete">
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
                        totalItems={filtered.length}
                        pageSize={pageSize}
                        onPageChange={setPage}
                        onPageSizeChange={(n) => { setPageSize(n); setPage(1); }}
                    />
                )}
            </div>

            <AnimatePresence>
                {modalOpen && (
                    <EnrollmentFormModal
                        editingRow={editingRow}
                        onClose={() => { setModalOpen(false); setEditingRow(null); }}
                        onSaved={handleSaved}
                        coachingTypes={coachingTypes}
                        durations={durations}
                        pricingTable={pricingTable}
                    />
                )}
            </AnimatePresence>

            <AnimatePresence>
                {paymentTarget && (
                    <RecordPaymentModal enrollment={paymentTarget} onClose={() => setPaymentTarget(null)} onSaved={handlePaymentSaved} />
                )}
            </AnimatePresence>

            <AnimatePresence>
                {viewTarget && (
                    <ManualEnrollmentDetailDrawer
                        row={viewTarget}
                        onClose={() => setViewTarget(null)}
                        onEdit={openEdit}
                        onPaymentRecorded={handleLedgerPaymentRecorded}
                    />
                )}
            </AnimatePresence>

            <AnimatePresence>
                {deleteTarget && (
                    <ConfirmDeleteModal
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
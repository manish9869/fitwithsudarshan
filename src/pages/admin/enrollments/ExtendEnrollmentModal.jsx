import { useState } from 'react';
import { motion } from 'framer-motion';
import { Loader2, AlertCircle, X, Users, RefreshCw } from 'lucide-react';
import { useSiteData } from '@/contexts/SiteDataContext';
import { extendEnrollment } from '../adminApi';
import { toISTDatetimeLocal, istDatetimeLocalToISO, fmtName } from '../adminUtils';
import { useToast } from '../ToastProvider';

const PAYMENT_METHODS = [
    { value: 'razorpay_link', label: 'Razorpay Link' },
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

// Adds a new plan period on top of an existing enrollment — client identity
// (name/email/phone/profile) is carried forward server-side from the
// enrollment being extended, so this form only asks for what's actually
// changing: the new plan/duration and its payment.
export default function ExtendEnrollmentModal({ sourceEnrollment, onClose, onExtended }) {
    const { coachingTypes, durations, pricingTable } = useSiteData();
    const toast = useToast();

    const [form, setForm] = useState({
        coachingType: sourceEnrollment.coaching_type || 'online',
        planType: sourceEnrollment.plan_type || 'individual',
        durationMonths: sourceEnrollment.duration_months || '3',
        programName: '',
        totalAmount: '',
        originalAmount: '',
        initialPaymentAmount: '',
        paymentMethod: 'razorpay_link',
        paymentReference: '',
        paymentDate: toISTDatetimeLocal(new Date().toISOString()),
        adminNote: '',
    });
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');

    const set = (field) => (e) => {
        const val = e?.target ? e.target.value : e;
        setForm((f) => ({ ...f, [field]: val }));
    };

    const suggestedProgram = () => {
        const ct = coachingTypes.find((c) => c.id === form.coachingType);
        const dur = durations.find((d) => d.months === form.durationMonths);
        return `${ct?.name || sourceEnrollment.program_name || 'RECODE Coaching'} — ${form.planType === 'couple' ? 'Couple' : 'Individual'} — ${dur?.label || ''}`;
    };

    const suggestedAmount = () =>
        pricingTable?.[form.coachingType]?.[form.planType]?.[form.durationMonths] || '';

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        if (!form.totalAmount) {
            setError('Total price for the extension is required.');
            return;
        }

        setSaving(true);
        try {
            const payload = {
                coachingType: form.coachingType,
                planType: form.planType,
                durationMonths: form.durationMonths,
                programName: form.programName.trim() || suggestedProgram(),
                totalAmount: Number(form.totalAmount),
                originalAmount: form.originalAmount ? Number(form.originalAmount) : Number(form.totalAmount),
                initialPaymentAmount: form.initialPaymentAmount === '' ? undefined : Number(form.initialPaymentAmount),
                paymentMethod: form.paymentMethod,
                paymentReference: form.paymentReference.trim() || null,
                paymentDate: istDatetimeLocalToISO(form.paymentDate),
                adminNote: form.adminNote || null,
            };

            const extended = await extendEnrollment(sourceEnrollment.id, payload);
            toast.success('Plan extended successfully');
            onExtended(extended);
        } catch (err) {
            setError(err.message || 'Failed to extend enrollment.');
            toast.error(err.message || 'Failed to extend enrollment.');
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
                className="relative w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-2xl"
                style={{ background: '#0e0e16', border: '1px solid rgba(255,255,255,0.1)' }}
                onClick={(e) => e.stopPropagation()}
            >
                <div
                    className="sticky top-0 z-10 flex items-center justify-between px-5 sm:px-6 py-4"
                    style={{ background: 'rgba(14,14,22,0.97)', borderBottom: '1px solid rgba(255,255,255,0.06)', backdropFilter: 'blur(20px)' }}
                >
                    <h3 className="font-black text-white text-sm flex items-center gap-2">
                        <RefreshCw className="w-4 h-4" style={{ color: '#e71763' }} />
                        Extend Plan
                    </h3>
                    <button onClick={onClose} className="text-white/30 hover:text-white">
                        <X className="w-4 h-4" />
                    </button>
                </div>

                <form onSubmit={handleSubmit}>
                    <div className="p-5 sm:p-6 space-y-5">
                        <div className="flex items-center gap-2 px-4 py-3 rounded-xl text-sm"
                            style={{ background: 'rgba(96,165,250,0.06)', border: '1px solid rgba(96,165,250,0.18)', color: 'rgba(255,255,255,0.6)' }}>
                            <Users className="w-4 h-4 flex-shrink-0" style={{ color: '#60a5fa' }} />
                            Extending for <strong className="text-white">{fmtName(sourceEnrollment.customer_name)}</strong> — client details carry forward automatically.
                        </div>

                        {error && (
                            <div className="flex items-center gap-2 px-4 py-3 rounded-xl text-sm"
                                style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', color: '#f87171' }}>
                                <AlertCircle className="w-4 h-4 flex-shrink-0" /> {error}
                            </div>
                        )}

                        {/* Plan */}
                        <div className="rounded-2xl p-4 sm:p-5 space-y-4" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.07)' }}>
                            <p className="text-[10px] font-black uppercase tracking-widest" style={{ color: '#e71763' }}>New Plan Period</p>
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
                            <Field label="Program Name (auto-filled if left blank)">
                                <input className={inputCls} style={inputStyle} value={form.programName} onChange={set('programName')} placeholder={suggestedProgram()} />
                            </Field>
                        </div>

                        {/* Payment */}
                        <div className="rounded-2xl p-4 sm:p-5 space-y-4" style={{ background: 'rgba(231,23,99,0.05)', border: '1px solid rgba(231,23,99,0.18)' }}>
                            <p className="text-[10px] font-black uppercase tracking-widest" style={{ color: '#e71763' }}>Payment</p>
                            <div className="grid grid-cols-2 gap-3">
                                <Field label="Total Price for Extension (₹)" required>
                                    <input type="number" className={inputCls} style={inputStyle} value={form.totalAmount} onChange={set('totalAmount')} placeholder={suggestedAmount() ? String(suggestedAmount()) : '0'} />
                                </Field>
                                <Field label="Original Amount (₹, optional)">
                                    <input type="number" className={inputCls} style={inputStyle} value={form.originalAmount} onChange={set('originalAmount')} placeholder="Same as total price" />
                                </Field>
                            </div>

                            <Field label="Amount Received Now (₹)">
                                <input type="number" className={inputCls} style={inputStyle} value={form.initialPaymentAmount} onChange={set('initialPaymentAmount')} placeholder={`Full amount (${form.totalAmount || 0}) if left blank`} />
                                <p className="text-[10px] text-white/25 mt-1.5">
                                    Leave blank to mark it fully paid now. Enter a smaller amount to record a
                                    deposit — the remaining balance will show up under Balance Due for this new period.
                                </p>
                            </Field>

                            <div className="grid grid-cols-2 gap-3">
                                <Field label="Payment Method">
                                    <select className={inputCls} style={inputStyle} value={form.paymentMethod} onChange={set('paymentMethod')}>
                                        {PAYMENT_METHODS.map((m) => <option key={m.value} value={m.value} style={{ background: '#0a0a0a' }}>{m.label}</option>)}
                                    </select>
                                </Field>
                                <Field label="Reference / Transaction ID">
                                    <input className={inputCls} style={inputStyle} value={form.paymentReference} onChange={set('paymentReference')} placeholder="UPI ref, UTR…" />
                                </Field>
                            </div>
                            <Field label="Payment Date">
                                <input type="datetime-local" className={inputCls} style={inputStyle} value={form.paymentDate} onChange={set('paymentDate')} />
                            </Field>
                        </div>

                        <Field label="Admin Note (optional)">
                            <textarea rows={2} className={inputCls} style={inputStyle} value={form.adminNote} onChange={set('adminNote')} placeholder="Internal note about this extension…" />
                        </Field>
                    </div>

                    <div
                        className="sticky bottom-0 flex items-center justify-end gap-3 px-5 sm:px-6 py-4"
                        style={{ background: 'rgba(14,14,22,0.97)', borderTop: '1px solid rgba(255,255,255,0.06)', backdropFilter: 'blur(20px)' }}
                    >
                        <button type="button" onClick={onClose} className="px-4 py-2.5 rounded-xl text-sm font-bold text-white/60" style={{ border: '1px solid rgba(255,255,255,0.1)' }}>
                            Cancel
                        </button>
                        <button type="submit" disabled={saving} className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold text-white disabled:opacity-60"
                            style={{ background: '#e71763' }}>
                            {saving ? <><Loader2 className="w-4 h-4 animate-spin" /> Extending…</> : 'Extend Plan'}
                        </button>
                    </div>
                </form>
            </motion.div>
        </div>
    );
}

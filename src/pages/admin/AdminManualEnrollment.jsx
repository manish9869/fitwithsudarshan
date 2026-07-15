/**
 * src/pages/admin/AdminManualEnrollment.jsx
 *
 * For clients who paid Sudarshan directly (Razorpay link, UPI, bank transfer,
 * cash) without going through the website checkout. Saves straight into the
 * `enrollments` table (source: 'manual') so they show up in Enrollments and
 * follow-up tracking exactly like a normal signup. Sending the confirmation
 * email is a separate, optional step after saving.
 */
import { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
    Loader2, AlertCircle, CheckCircle2, ArrowLeft, Mail, Send,
    User, Users, IndianRupee, Calendar, StickyNote,
} from 'lucide-react';
import { coachingTypes, durations, pricingTable } from '@/data/SiteData';
import { createManualEnrollment, sendEnrollmentEmail } from './adminApi';

const PAYMENT_METHODS = [
    { value: 'razorpay', label: 'Razorpay Link' },
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

const INITIAL = {
    customerName: '', customerEmail: '', customerPhone: '',
    coachingType: 'online', planType: 'individual', durationMonths: '3',
    programName: '', amountPaid: '', originalAmount: '',
    paymentMethod: 'razorpay', paymentReference: '', paymentDate: new Date().toISOString().slice(0, 10),
    age: '', city: '', weight: '', goals: '',
    medicalIssue: 'no', medicalNote: '',
    partnerName: '', partnerAge: '', partnerWeight: '', partnerGoals: '',
    adminNote: '',
};

export default function AdminManualEnrollment() {
    const navigate = useNavigate();
    const [form, setForm] = useState(INITIAL);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');
    const [created, setCreated] = useState(null); // saved enrollment row
    const [emailState, setEmailState] = useState('idle'); // idle | sending | sent | error

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

        if (!form.customerName.trim() || !form.amountPaid) {
            setError('Client name and amount paid are required.');
            return;
        }

        setSaving(true);
        try {
            const payload = {
                customerName: form.customerName.trim(),
                customerEmail: form.customerEmail.trim() || null,
                customerPhone: form.customerPhone.trim() || null,
                programName: form.programName.trim() || suggestedProgram(),
                coachingType: form.coachingType,
                planType: form.planType,
                durationMonths: form.durationMonths,
                amountPaid: Number(form.amountPaid),
                originalAmount: form.originalAmount ? Number(form.originalAmount) : Number(form.amountPaid),
                paymentMethod: form.paymentMethod,
                paymentReference: form.paymentReference.trim() || null,
                paymentDate: form.paymentDate,
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
            };

            const enrollment = await createManualEnrollment(payload);
            setCreated(enrollment);
        } catch (err) {
            setError(err.message || 'Failed to save enrollment.');
        } finally {
            setSaving(false);
        }
    };

    const handleSendEmail = async () => {
        if (!created?.id) return;
        setEmailState('sending');
        try {
            await sendEnrollmentEmail(created.id, 'customer');
            setEmailState('sent');
        } catch {
            setEmailState('error');
        }
    };

    // ── Success screen ────────────────────────────────────────────────────────
    if (created) {
        return (
            <div className="max-w-lg mx-auto">
                <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
                    className="rounded-2xl p-6 text-center"
                    style={{ background: 'rgba(52,211,153,0.06)', border: '1px solid rgba(52,211,153,0.25)' }}>
                    <div className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4"
                        style={{ background: 'rgba(52,211,153,0.12)', border: '1px solid rgba(52,211,153,0.3)' }}>
                        <CheckCircle2 className="w-7 h-7" style={{ color: '#34d399' }} />
                    </div>
                    <p className="font-black text-white text-lg mb-1">Enrollment Saved</p>
                    <p className="text-xs text-white/40 font-mono mb-5">{created.enrollment_id}</p>

                    <div className="rounded-xl p-4 text-left text-xs space-y-1.5 mb-5"
                        style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
                        <div className="flex justify-between"><span className="text-white/40">Client</span><span className="text-white font-semibold">{created.customer_name}</span></div>
                        <div className="flex justify-between"><span className="text-white/40">Program</span><span className="text-white">{created.program_name}</span></div>
                        <div className="flex justify-between"><span className="text-white/40">Amount</span><span className="font-bold" style={{ color: '#e71763' }}>₹{Number(created.amount_paid).toLocaleString('en-IN')}</span></div>
                        <div className="flex justify-between"><span className="text-white/40">Follow-up due</span><span className="text-white">7 days from now</span></div>
                    </div>

                    {created.customer_email ? (
                        <button onClick={handleSendEmail} disabled={emailState === 'sending' || emailState === 'sent'}
                            className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold text-white disabled:opacity-70 mb-3"
                            style={{ background: emailState === 'sent' ? '#34d399' : '#e71763' }}>
                            {emailState === 'sending' ? (<><Loader2 className="w-4 h-4 animate-spin" /> Sending…</>)
                                : emailState === 'sent' ? (<><CheckCircle2 className="w-4 h-4" /> Confirmation Sent</>)
                                    : (<><Mail className="w-4 h-4" /> Send Enrollment Email to Client</>)}
                        </button>
                    ) : (
                        <p className="text-[11px] text-white/30 mb-3 flex items-center justify-center gap-1.5">
                            <AlertCircle className="w-3 h-3" /> No email on file — nothing to send.
                        </p>
                    )}
                    {emailState === 'error' && <p className="text-[11px] mb-3" style={{ color: '#f87171' }}>Failed to send. Try again from the enrollment record.</p>}

                    <div className="flex gap-3">
                        <button onClick={() => { setCreated(null); setForm(INITIAL); setEmailState('idle'); }}
                            className="flex-1 py-2.5 rounded-xl text-xs font-bold text-white/60"
                            style={{ border: '1px solid rgba(255,255,255,0.1)' }}>
                            Add Another
                        </button>
                        <button onClick={() => navigate(`/admin/enrollments?focus=${created.id}`)}
                            className="flex-1 py-2.5 rounded-xl text-xs font-bold text-white"
                            style={{ background: 'rgba(231,23,99,0.12)', border: '1px solid rgba(231,23,99,0.3)', color: '#e71763' }}>
                            View in Enrollments
                        </button>
                    </div>
                </motion.div>
            </div>
        );
    }

    return (
        <div className="max-w-2xl mx-auto">
            <button onClick={() => navigate('/admin/enrollments')}
                className="flex items-center gap-1.5 text-xs text-white/40 hover:text-white mb-4 transition-colors">
                <ArrowLeft className="w-3.5 h-3.5" /> Back to Enrollments
            </button>

            <div className="mb-6">
                <h1 className="text-xl font-black text-white mb-1">Manual Enrollment</h1>
                <p className="text-xs text-white/35">
                    For clients who paid directly (Razorpay link, UPI, bank transfer, cash) without using the website checkout.
                </p>
            </div>

            {error && (
                <div className="flex items-center gap-2 px-4 py-3 rounded-xl mb-4 text-sm"
                    style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', color: '#f87171' }}>
                    <AlertCircle className="w-4 h-4 flex-shrink-0" /> {error}
                </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
                {/* Client details */}
                <div className="rounded-2xl p-5 space-y-4" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.07)' }}>
                    <p className="text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5" style={{ color: '#e71763' }}>
                        <User className="w-3 h-3" /> Client Details
                    </p>
                    <div className="grid grid-cols-2 gap-3">
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
                <div className="rounded-2xl p-5 space-y-4" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.07)' }}>
                    <p className="text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5" style={{ color: '#e71763' }}>
                        <Users className="w-3 h-3" /> Plan
                    </p>
                    <div className="grid grid-cols-3 gap-3">
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
                <div className="rounded-2xl p-5 space-y-4" style={{ background: 'rgba(231,23,99,0.05)', border: '1px solid rgba(231,23,99,0.18)' }}>
                    <p className="text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5" style={{ color: '#e71763' }}>
                        <IndianRupee className="w-3 h-3" /> Payment
                    </p>
                    <div className="grid grid-cols-2 gap-3">
                        <Field label="Amount Paid (₹)" required>
                            <input type="number" className={inputCls} style={inputStyle} value={form.amountPaid} onChange={set('amountPaid')} placeholder={suggestedAmount() ? String(suggestedAmount()) : '0'} />
                        </Field>
                        <Field label="Original Amount (₹, optional — for discounts)">
                            <input type="number" className={inputCls} style={inputStyle} value={form.originalAmount} onChange={set('originalAmount')} placeholder="Same as amount paid" />
                        </Field>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                        <Field label="Payment Method">
                            <select className={inputCls} style={inputStyle} value={form.paymentMethod} onChange={set('paymentMethod')}>
                                {PAYMENT_METHODS.map((m) => <option key={m.value} value={m.value} style={{ background: '#0a0a0a' }}>{m.label}</option>)}
                            </select>
                        </Field>
                        <Field label="Payment Date">
                            <div className="relative">
                                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/30" />
                                <input type="date" className={`${inputCls} pl-9`} style={inputStyle} value={form.paymentDate} onChange={set('paymentDate')} />
                            </div>
                        </Field>
                    </div>
                    <Field label="Payment Reference (UTR / UPI ID / Razorpay Payment ID)">
                        <input className={inputCls} style={inputStyle} value={form.paymentReference} onChange={set('paymentReference')} placeholder="Optional but helpful for reconciliation" />
                    </Field>
                </div>

                {/* Note */}
                <Field label="Internal Note (visible to admins only)">
                    <div className="relative">
                        <StickyNote className="absolute left-3 top-3 w-3.5 h-3.5 text-white/30" />
                        <textarea rows={2} className={`${inputCls} pl-9 resize-none`} style={inputStyle} value={form.adminNote} onChange={set('adminNote')}
                            placeholder="e.g. Friend of Sudarshan, paid via personal UPI" />
                    </div>
                </Field>

                <button type="submit" disabled={saving}
                    className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl text-sm font-bold text-white disabled:opacity-60"
                    style={{ background: '#e71763', boxShadow: '0 0 20px rgba(231,23,99,0.3)' }}>
                    {saving ? (<><Loader2 className="w-4 h-4 animate-spin" /> Saving…</>) : (<><Send className="w-4 h-4" /> Save Enrollment</>)}
                </button>
                <p className="text-[11px] text-white/25 text-center">
                    This does not send any email automatically — you'll get the option after saving.
                </p>
            </form>
        </div>
    );
}
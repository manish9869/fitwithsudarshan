import { useState } from 'react';
import { motion } from 'framer-motion';
import { X, Loader2, IndianRupee, CheckCircle2 } from 'lucide-react';
import { recordEnrollmentPayment } from './adminApi';
import { useToast } from './ToastProvider';

const METHODS = [
    { value: 'razorpay_link', label: 'Razorpay Link' },
    { value: 'upi', label: 'UPI' },
    { value: 'bank_transfer', label: 'Bank Transfer' },
    { value: 'cash', label: 'Cash' },
    { value: 'razorpay', label: 'Razorpay (Website)' },
    { value: 'other', label: 'Other' },
];

export default function RecordPaymentModal({ enrollment, onClose, onSaved }) {
    const [amount, setAmount] = useState('');
    const [method, setMethod] = useState('upi');
    const [reference, setReference] = useState('');
    const [note, setNote] = useState('');
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');
    const toast = useToast();

    const balance = Number(
        enrollment.balance_due ??
        Math.max(0, (enrollment.total_amount || enrollment.amount_paid || 0) - (enrollment.amount_paid || 0))
    );

    const handleSave = async () => {
        setError('');
        const amt = Number(amount);
        if (!amt || amt <= 0) { setError('Enter a valid amount.'); return; }
        setSaving(true);
        try {
            const updated = await recordEnrollmentPayment(enrollment.id, {
                amount: amt, method, reference: reference || null, note: note || null,
            });
            toast.success(`Payment of ₹${amt.toLocaleString('en-IN')} recorded`);
            onSaved(updated);
        } catch (e) {
            setError(e.message || 'Failed to record payment.');
            toast.error(e.message || 'Failed to record payment.');
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
                className="relative w-full max-w-md rounded-2xl overflow-hidden"
                style={{ background: '#0e0e16', border: '1px solid rgba(255,255,255,0.1)' }}
                onClick={(e) => e.stopPropagation()}>
                <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                    <div>
                        <p className="font-bold text-white text-sm">Record Payment — {enrollment.customer_name}</p>
                        <p className="text-[11px] text-white/35 mt-0.5">
                            Balance due: <span style={{ color: '#fbbf24' }} className="font-bold">
                                {new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(balance)}
                            </span>
                        </p>
                    </div>
                    <button onClick={onClose} className="text-white/30 hover:text-white"><X className="w-4 h-4" /></button>
                </div>

                <div className="p-5 space-y-4">
                    {error && (
                        <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl text-xs"
                            style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', color: '#f87171' }}>
                            {error}
                        </div>
                    )}

                    <div>
                        <label className="text-[11px] font-bold text-white/45 uppercase tracking-widest mb-1.5 block">Amount Received (₹)</label>
                        <div className="relative">
                            <IndianRupee className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/30" />
                            <input type="number" value={amount} onChange={(e) => setAmount(e.target.value)}
                                placeholder={balance ? String(balance) : '0'}
                                className="w-full rounded-xl pl-9 pr-3.5 py-2.5 text-sm text-white outline-none"
                                style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }} />
                        </div>
                        {balance > 0 && (
                            <button type="button" onClick={() => setAmount(String(balance))}
                                className="text-[11px] mt-1.5" style={{ color: '#e71763' }}>
                                Use full balance ({balance.toLocaleString('en-IN')})
                            </button>
                        )}
                    </div>

                    <div>
                        <label className="text-[11px] font-bold text-white/45 uppercase tracking-widest mb-1.5 block">Payment Method</label>
                        <select value={method} onChange={(e) => setMethod(e.target.value)}
                            className="w-full rounded-xl px-3.5 py-2.5 text-sm text-white outline-none"
                            style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}>
                            {METHODS.map((m) => <option key={m.value} value={m.value} style={{ background: '#0a0a0a' }}>{m.label}</option>)}
                        </select>
                    </div>

                    <div>
                        <label className="text-[11px] font-bold text-white/45 uppercase tracking-widest mb-1.5 block">Reference (UTR / UPI Ref / Txn ID)</label>
                        <input value={reference} onChange={(e) => setReference(e.target.value)} placeholder="Optional"
                            className="w-full rounded-xl px-3.5 py-2.5 text-sm text-white outline-none"
                            style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }} />
                    </div>

                    <div>
                        <label className="text-[11px] font-bold text-white/45 uppercase tracking-widest mb-1.5 block">Note</label>
                        <textarea rows={2} value={note} onChange={(e) => setNote(e.target.value)} placeholder="Optional"
                            className="w-full rounded-xl px-3.5 py-2.5 text-sm text-white resize-none outline-none"
                            style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }} />
                    </div>

                    <div className="flex gap-3 pt-1">
                        <button onClick={onClose} className="flex-1 py-2.5 rounded-xl text-sm text-white/40" style={{ border: '1px solid rgba(255,255,255,0.08)' }}>Cancel</button>
                        <button onClick={handleSave} disabled={saving}
                            className="flex-1 py-2.5 rounded-xl text-sm font-bold text-white flex items-center justify-center gap-2 disabled:opacity-60"
                            style={{ background: '#e71763' }}>
                            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <><CheckCircle2 className="w-4 h-4" /> Record Payment</>}
                        </button>
                    </div>
                </div>
            </motion.div>
        </div>
    );
}
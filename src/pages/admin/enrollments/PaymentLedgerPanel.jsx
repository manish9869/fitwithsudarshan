import { useState, useEffect, useCallback, useMemo } from 'react';
import { AnimatePresence } from 'framer-motion';
import {
    IndianRupee, Loader2, Plus, Send, CreditCard, Smartphone, Landmark,
    Wallet, HelpCircle, Clock, AlertCircle, Copy, Check, Layers, CheckCircle2,
    Download, Mail,
} from 'lucide-react';
import { fetchEnrollmentPayments, sendBalanceReminder, sendPaymentReceiptEmail } from '../adminApi';
import { fmtCurrency, fmtDateTime, downloadPaymentReceiptPDF } from '../adminUtils';
import RecordPaymentModal from './RecordPaymentModal';
import { useToast } from '../ToastProvider';

const METHOD_META = {
    razorpay: { label: 'Razorpay (Website)', icon: CreditCard, color: '#e71763' },
    razorpay_link: { label: 'Razorpay Link', icon: CreditCard, color: '#e71763' },
    upi: { label: 'UPI', icon: Smartphone, color: '#34d399' },
    bank_transfer: { label: 'Bank Transfer', icon: Landmark, color: '#60a5fa' },
    cash: { label: 'Cash', icon: Wallet, color: '#fbbf24' },
    other: { label: 'Other', icon: HelpCircle, color: 'rgba(255,255,255,0.55)' },
};

function methodMeta(m) {
    return METHOD_META[m] || METHOD_META.other;
}

export default function PaymentLedgerPanel({ enrollment, onEnrollmentUpdated }) {
    const toast = useToast();
    const [payments, setPayments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [showRecordModal, setShowRecordModal] = useState(false);
    const [sendingReminder, setSendingReminder] = useState(false);
    const [copiedId, setCopiedId] = useState('');

    // Per-row receipt action state
    const [downloadingReceiptId, setDownloadingReceiptId] = useState('');
    const [emailingReceiptId, setEmailingReceiptId] = useState('');

    const load = useCallback(async () => {
        if (!enrollment?.id) return;
        setLoading(true);
        setError('');
        try {
            const rows = await fetchEnrollmentPayments(enrollment.id);
            setPayments(rows || []);
        } catch (e) {
            setError(e.message || 'Failed to load payment history.');
        } finally {
            setLoading(false);
        }
    }, [enrollment?.id]);

    useEffect(() => { load(); }, [load]);

    // Chronological running total — payments come back ordered by paid_at
    // ascending, so this is a simple cumulative sum. Used so each payment's
    // receipt shows an accurate "paid to date" figure, not just its own amount.
    const paymentsWithRunningTotal = useMemo(() => {
        let running = 0;
        return payments.map((p) => {
            running += Number(p.amount || 0);
            return { ...p, _paidToDate: running };
        });
    }, [payments]);

    if (!enrollment) return null;

    const totalAmount = Number(enrollment.total_amount ?? enrollment.amount_paid ?? 0);
    const amountPaid = Number(enrollment.amount_paid ?? 0);
    const balanceDue = Number(
        enrollment.balance_due ?? Math.max(0, totalAmount - amountPaid)
    );
    const isFullyPaid = balanceDue <= 0;
    const isSplit = payments.length > 1;

    const copy = (val, key) => {
        navigator.clipboard.writeText(val).catch(() => { });
        setCopiedId(key);
        setTimeout(() => setCopiedId(''), 1500);
    };

    const handleReminder = async () => {
        if (!enrollment.customer_email) {
            toast.error('This enrollment has no customer email on file.');
            return;
        }
        setSendingReminder(true);
        try {
            await sendBalanceReminder(enrollment.id);
            toast.success('Balance reminder sent');
        } catch (e) {
            toast.error(e.message || 'Failed to send reminder.');
        } finally {
            setSendingReminder(false);
        }
    };

    const handlePaymentSaved = (updated) => {
        setShowRecordModal(false);
        toast.success('Payment recorded');
        onEnrollmentUpdated?.(updated);
        load();
    };

    const handleDownloadReceipt = async (payment) => {
        setDownloadingReceiptId(payment.id);
        try {
            await downloadPaymentReceiptPDF({ enrollment, payment });
            toast.success('Receipt downloaded');
        } catch (e) {
            toast.error(e.message || 'Failed to download receipt.');
        } finally {
            setDownloadingReceiptId('');
        }
    };

    const handleEmailReceipt = async (payment) => {
        if (!enrollment.customer_email) {
            toast.error('This enrollment has no customer email on file.');
            return;
        }
        setEmailingReceiptId(payment.id);
        try {
            await sendPaymentReceiptEmail(enrollment.id, payment.id);
            toast.success('Receipt emailed to customer');
        } catch (e) {
            toast.error(e.message || 'Failed to email receipt.');
        } finally {
            setEmailingReceiptId('');
        }
    };

    return (
        <section>
            <div className="flex items-center justify-between mb-3 gap-2 flex-wrap">
                <p
                    className="text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5"
                    style={{ color: '#e71763' }}
                >
                    <IndianRupee className="w-3.5 h-3.5" /> Payment History
                    {isSplit && (
                        <span
                            className="flex items-center gap-1 text-[9px] font-bold px-1.5 py-0.5 rounded-full"
                            style={{ background: 'rgba(96,165,250,0.12)', color: '#60a5fa' }}
                        >
                            <Layers className="w-2.5 h-2.5" /> {payments.length} PAYMENTS
                        </span>
                    )}
                </p>

                {/* Record Payment — hidden entirely once fully paid. There's
                    nothing to record against a 0 balance; if a genuinely new
                    charge comes up later (add-on, correction) the total/plan
                    should be edited first so a balance exists again. */}
                {!isFullyPaid && (
                    <button
                        onClick={() => setShowRecordModal(true)}
                        className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[11px] font-bold text-white"
                        style={{ background: '#e71763' }}
                    >
                        <Plus className="w-3 h-3" /> Record Payment
                    </button>
                )}
            </div>

            {/* Summary strip */}
            <div className="grid grid-cols-3 gap-2 mb-3">
                <div
                    className="rounded-xl p-3 text-center"
                    style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}
                >
                    <p className="text-[9px] text-white/30 uppercase tracking-widest mb-1">Total</p>
                    <p className="text-sm font-black text-white">{fmtCurrency(totalAmount)}</p>
                </div>
                <div
                    className="rounded-xl p-3 text-center"
                    style={{ background: 'rgba(52,211,153,0.06)', border: '1px solid rgba(52,211,153,0.18)' }}
                >
                    <p className="text-[9px] text-white/30 uppercase tracking-widest mb-1">Paid</p>
                    <p className="text-sm font-black" style={{ color: '#34d399' }}>{fmtCurrency(amountPaid)}</p>
                </div>
                <div
                    className="rounded-xl p-3 text-center"
                    style={{
                        background: balanceDue > 0 ? 'rgba(251,191,36,0.06)' : 'rgba(255,255,255,0.03)',
                        border: `1px solid ${balanceDue > 0 ? 'rgba(251,191,36,0.2)' : 'rgba(255,255,255,0.07)'}`,
                    }}
                >
                    <p className="text-[9px] text-white/30 uppercase tracking-widest mb-1">Balance</p>
                    <p className="text-sm font-black" style={{ color: balanceDue > 0 ? '#fbbf24' : 'rgba(255,255,255,0.4)' }}>
                        {fmtCurrency(balanceDue)}
                    </p>
                </div>
            </div>

            {/* Fully-paid confirmation strip — replaces the record-payment
                action once there's nothing left to collect. */}
            {isFullyPaid && (
                <div
                    className="flex items-center gap-2 mb-3 px-3 py-2.5 rounded-xl"
                    style={{ background: 'rgba(52,211,153,0.06)', border: '1px solid rgba(52,211,153,0.2)' }}
                >
                    <CheckCircle2 className="w-3.5 h-3.5 flex-shrink-0" style={{ color: '#34d399' }} />
                    <p className="text-[11px] text-white/50">Fully paid — no balance due.</p>
                </div>
            )}

            {/* Reminder strip — only when money is still owed */}
            {balanceDue > 0 && (
                <div
                    className="flex items-center justify-between gap-3 mb-3 px-3 py-2.5 rounded-xl"
                    style={{ background: 'rgba(251,191,36,0.06)', border: '1px solid rgba(251,191,36,0.2)' }}
                >
                    <div className="flex items-center gap-2 min-w-0">
                        <Clock className="w-3.5 h-3.5 flex-shrink-0" style={{ color: '#fbbf24' }} />
                        <p className="text-[11px] text-white/60 truncate">
                            {enrollment.next_payment_reminder_at
                                ? `Next reminder ${fmtDateTime(enrollment.next_payment_reminder_at)}`
                                : 'No reminder scheduled yet'}
                        </p>
                    </div>
                    <button
                        onClick={handleReminder}
                        disabled={sendingReminder || !enrollment.customer_email}
                        className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[11px] font-bold flex-shrink-0 disabled:opacity-40"
                        style={{ background: 'rgba(251,191,36,0.15)', border: '1px solid rgba(251,191,36,0.3)', color: '#fbbf24' }}
                        title={!enrollment.customer_email ? 'No email on file' : 'Send balance reminder now'}
                    >
                        {sendingReminder ? <Loader2 className="w-3 h-3 animate-spin" /> : <Send className="w-3 h-3" />}
                        Remind Now
                    </button>
                </div>
            )}

            {/* Ledger list */}
            {loading ? (
                <div className="flex justify-center py-8">
                    <Loader2 className="w-5 h-5 animate-spin text-white/25" />
                </div>
            ) : error ? (
                <div
                    className="flex items-center gap-2 px-3 py-3 rounded-xl text-xs"
                    style={{ background: 'rgba(239,68,68,0.06)', color: '#f87171' }}
                >
                    <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" /> {error}
                </div>
            ) : payments.length === 0 ? (
                <div
                    className="text-center py-8 rounded-xl"
                    style={{ background: 'rgba(255,255,255,0.02)', border: '1px dashed rgba(255,255,255,0.08)' }}
                >
                    <p className="text-xs text-white/25">No payments recorded yet.</p>
                </div>
            ) : (
                <div
                    className="rounded-xl overflow-hidden"
                    style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}
                >
                    {paymentsWithRunningTotal.map((p, i) => {
                        const meta = methodMeta(p.method);
                        const Icon = meta.icon;
                        const downloading = downloadingReceiptId === p.id;
                        const emailing = emailingReceiptId === p.id;
                        return (
                            <div
                                key={p.id}
                                className="flex items-center gap-3 px-4 py-3 flex-wrap sm:flex-nowrap"
                                style={i < paymentsWithRunningTotal.length - 1 ? { borderBottom: '1px solid rgba(255,255,255,0.05)' } : {}}
                            >
                                <div
                                    className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                                    style={{ background: `${meta.color}18` }}
                                >
                                    <Icon className="w-3.5 h-3.5" style={{ color: meta.color }} />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 flex-wrap">
                                        <p className="text-sm font-bold text-white">{fmtCurrency(p.amount)}</p>
                                        <span
                                            className="text-[10px] font-semibold px-1.5 py-0.5 rounded"
                                            style={{ background: `${meta.color}15`, color: meta.color }}
                                        >
                                            {meta.label}
                                        </span>
                                    </div>
                                    <p className="text-[11px] text-white/35">{fmtDateTime(p.paid_at)}</p>
                                    {p.note && (
                                        <p className="text-[11px] text-white/30 mt-0.5 italic truncate">{p.note}</p>
                                    )}
                                </div>
                                {p.reference && (
                                    <button
                                        onClick={() => copy(p.reference, p.id)}
                                        className="flex items-center gap-1 text-[10px] font-mono text-white/35 hover:text-white/60 flex-shrink-0 transition-colors"
                                        title="Copy reference"
                                    >
                                        <span className="truncate max-w-[90px]">{p.reference}</span>
                                        {copiedId === p.id
                                            ? <Check className="w-3 h-3" style={{ color: '#34d399' }} />
                                            : <Copy className="w-3 h-3" />}
                                    </button>
                                )}

                                {/* Per-payment receipt actions */}
                                <div className="flex items-center gap-1 flex-shrink-0">
                                    <button
                                        onClick={() => handleDownloadReceipt(p)}
                                        disabled={downloading}
                                        className="w-7 h-7 rounded-lg flex items-center justify-center text-white/35 hover:text-white hover:bg-white/8 transition-all disabled:opacity-40"
                                        title="Download receipt PDF for this payment"
                                    >
                                        {downloading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />}
                                    </button>
                                    <button
                                        onClick={() => handleEmailReceipt(p)}
                                        disabled={emailing || !enrollment.customer_email}
                                        className="w-7 h-7 rounded-lg flex items-center justify-center text-white/35 hover:text-white hover:bg-white/8 transition-all disabled:opacity-40"
                                        title={!enrollment.customer_email ? 'No email on file' : 'Email receipt for this payment'}
                                    >
                                        {emailing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Mail className="w-3.5 h-3.5" />}
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            <AnimatePresence>
                {showRecordModal && (
                    <RecordPaymentModal
                        enrollment={enrollment}
                        onClose={() => setShowRecordModal(false)}
                        onSaved={handlePaymentSaved}
                    />
                )}
            </AnimatePresence>
        </section>
    );
}
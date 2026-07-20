import { useState, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { RefreshCw, Search, MessageCircle, AlertCircle, Loader2, IndianRupee, Send, Eye } from 'lucide-react';
import { Link } from 'react-router-dom';
import { fetchBalanceDue, sendBalanceReminder as sendBalanceReminderApi } from './adminApi';
import { fmtCurrency } from './adminUtils';
import { useToast } from './ToastProvider';
import RecordPaymentModal from './RecordPaymentModal';

export default function AdminBalanceDue() {
    const toast = useToast();
    const [rows, setRows] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [dueOnly, setDueOnly] = useState(false);
    const [search, setSearch] = useState('');
    const [paymentTarget, setPaymentTarget] = useState(null);
    const [sendingId, setSendingId] = useState(null);

    const load = useCallback(async () => {
        setLoading(true);
        setError('');
        try {
            const res = await fetchBalanceDue({ due: dueOnly ? 'true' : undefined });
            setRows(res.rows || []);
        } catch (e) {
            setError(e.message || 'Failed to load outstanding balances.');
        } finally {
            setLoading(false);
        }
    }, [dueOnly]);

    useEffect(() => { load(); }, [load]);

    const filtered = useMemo(() => {
        if (!search.trim()) return rows;
        const q = search.trim().toLowerCase();
        return rows.filter((r) =>
            (r.customer_name || '').toLowerCase().includes(q) ||
            (r.customer_email || '').toLowerCase().includes(q) ||
            (r.enrollment_id || '').toLowerCase().includes(q));
    }, [rows, search]);

    const totalOutstanding = rows.reduce((s, r) => s + (Number(r.balance_due) || 0), 0);

    const handleSendReminder = async (row) => {
        setSendingId(row.id);
        try {
            await sendBalanceReminderApi(row.id);
            toast.success('Reminder sent');
        } catch (e) {
            toast.error(e.message || 'Failed to send reminder.');
        } finally {
            setSendingId(null);
        }
    };

    const handlePaymentSaved = (updated) => {
        setRows((prev) => prev
            .map((r) => (r.id === updated.id ? updated : r))
            .filter((r) => Number(r.balance_due) > 0));
        setPaymentTarget(null);
    };

    return (
        <div>
            <div className="flex items-center justify-between gap-4 mb-6 flex-wrap">
                <div>
                    <h1 className="text-xl font-black text-white mb-1">Balance Due</h1>
                    <p className="text-xs text-white/35">Clients who paid a deposit or partial amount — track and collect the rest.</p>
                </div>
                <div className="flex items-center gap-2">
                    <button onClick={() => setDueOnly((d) => !d)}
                        className="px-3 py-2 rounded-xl text-xs font-bold transition-all"
                        style={dueOnly
                            ? { background: 'rgba(231,23,99,0.1)', border: '1px solid rgba(231,23,99,0.25)', color: '#e71763' }
                            : { background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', color: 'white' }}>
                        {dueOnly ? 'Showing Reminder Due' : 'Showing All Outstanding'}
                    </button>
                    <button onClick={load} className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs text-white/50 hover:text-white transition-all"
                        style={{ border: '1px solid rgba(255,255,255,0.08)' }}>
                        <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} /> Refresh
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-2 gap-3 mb-6">
                <div className="rounded-2xl p-5" style={{ background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.07)' }}>
                    <p className="text-xs text-white/35 uppercase tracking-widest mb-2">Clients with Balance</p>
                    <p className="text-2xl font-black text-white">{rows.length}</p>
                </div>
                <div className="rounded-2xl p-5" style={{ background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.07)' }}>
                    <p className="text-xs text-white/35 uppercase tracking-widest mb-2">Total Outstanding</p>
                    <p className="text-2xl font-black" style={{ color: '#fbbf24' }}>{fmtCurrency(totalOutstanding)}</p>
                </div>
            </div>

            <div className="relative mb-5 max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/30" />
                <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search client…"
                    className="w-full rounded-xl pl-9 pr-4 py-2.5 text-sm text-white placeholder:text-white/25 outline-none"
                    style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }} />
            </div>

            {error && (
                <div className="flex items-center gap-2 px-4 py-3 rounded-xl mb-4 text-sm"
                    style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', color: '#f87171' }}>
                    <AlertCircle className="w-4 h-4 flex-shrink-0" /> {error}
                </div>
            )}

            {loading ? (
                <div className="py-24 flex justify-center"><Loader2 className="w-6 h-6 animate-spin text-white/25" /></div>
            ) : filtered.length === 0 ? (
                <div className="py-20 text-center rounded-2xl" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}>
                    <IndianRupee className="w-8 h-8 mx-auto mb-3 text-white/15" />
                    <p className="text-sm text-white/30">No outstanding balances right now.</p>
                </div>
            ) : (
                <div className="space-y-2.5">
                    {filtered.map((row) => (
                        <motion.div key={row.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                            className="rounded-2xl p-4 flex items-center justify-between gap-4 flex-wrap"
                            style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.07)' }}>
                            <div className="min-w-0 flex-1">
                                <p className="font-bold text-white text-sm">{row.customer_name}</p>
                                <p className="text-xs text-white/40 truncate">{row.program_name}</p>
                                <div className="flex items-center gap-3 mt-1.5 text-[11px] text-white/30">
                                    <span>Total {fmtCurrency(row.total_amount)}</span>
                                    <span>·</span>
                                    <span>Paid {fmtCurrency(row.amount_paid)}</span>
                                    <span>·</span>
                                    <span style={{ color: '#fbbf24' }} className="font-bold">Balance {fmtCurrency(row.balance_due)}</span>
                                </div>
                            </div>
                            <div className="flex items-center gap-1.5 flex-shrink-0">
                                {row.customer_phone && (
                                    <a href={`https://wa.me/${row.customer_phone.replace(/\D/g, '')}`} target="_blank" rel="noopener noreferrer"
                                        className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'rgba(37,211,102,0.12)', color: '#25D366' }}
                                        title="WhatsApp client">
                                        <MessageCircle className="w-3.5 h-3.5" />
                                    </a>
                                )}
                                <Link to={`/admin/enrollments?focus=${row.id}`}
                                    className="w-8 h-8 rounded-lg flex items-center justify-center text-white/40 hover:text-white hover:bg-white/8"
                                    title="View enrollment">
                                    <Eye className="w-3.5 h-3.5" />
                                </Link>
                                <button onClick={() => handleSendReminder(row)} disabled={sendingId === row.id || !row.customer_email}
                                    className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold disabled:opacity-40"
                                    style={{ background: 'rgba(251,191,36,0.15)', border: '1px solid rgba(251,191,36,0.3)', color: '#fbbf24' }}
                                    title={!row.customer_email ? 'No email on file' : 'Send reminder email'}>
                                    {sendingId === row.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                                    Remind
                                </button>
                                <button onClick={() => setPaymentTarget(row)}
                                    className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold text-white"
                                    style={{ background: '#e71763' }}>
                                    <IndianRupee className="w-3.5 h-3.5" /> Record Payment
                                </button>
                            </div>
                        </motion.div>
                    ))}
                </div>
            )}

            <AnimatePresence>
                {paymentTarget && (
                    <RecordPaymentModal enrollment={paymentTarget} onClose={() => setPaymentTarget(null)} onSaved={handlePaymentSaved} />
                )}
            </AnimatePresence>
        </div>
    );
}
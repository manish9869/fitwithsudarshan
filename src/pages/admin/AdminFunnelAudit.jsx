// src/pages/admin/AdminFunnelAudit.jsx
import { useEffect, useState } from 'react';
import { Loader2, AlertCircle, RefreshCw } from 'lucide-react';
import { fetchFunnelAudit } from './adminApi';
import { fmtCurrency, fmtDate } from './adminUtils';

export default function AdminFunnelAudit() {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [days, setDays] = useState(30);

    const load = async () => {
        setLoading(true);
        setError('');
        try {
            setData(await fetchFunnelAudit(days));
        } catch (e) {
            setError(e.message || 'Failed to load funnel audit.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { load(); }, [days]);

    return (
        <div>
            <div className="flex items-center justify-between gap-4 mb-6 flex-wrap">
                <div>
                    <h1 className="text-xl font-black text-white mb-1">Funnel Audit</h1>
                    <p className="text-xs text-white/35">Reconciles GA4-eligible client events against actual paid enrollments.</p>
                </div>
                <div className="flex items-center gap-2">
                    <select value={days} onChange={(e) => setDays(Number(e.target.value))}
                        className="rounded-xl px-3 py-2 text-xs text-white"
                        style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}>
                        {[7, 30, 90, 365].map((d) => <option key={d} value={d} style={{ background: '#0a0a0a' }}>{d} days</option>)}
                    </select>
                    <button onClick={load} className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs text-white/50 hover:text-white transition-all"
                        style={{ border: '1px solid rgba(255,255,255,0.08)' }}>
                        <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} /> Refresh
                    </button>
                </div>
            </div>

            {error && (
                <div className="flex items-center gap-2 px-4 py-3 rounded-xl mb-4 text-sm"
                    style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', color: '#f87171' }}>
                    <AlertCircle className="w-4 h-4 flex-shrink-0" /> {error}
                </div>
            )}

            {loading ? (
                <div className="py-24 flex justify-center"><Loader2 className="w-6 h-6 animate-spin text-white/25" /></div>
            ) : data && (
                <>
                    <div className="grid grid-cols-3 gap-3 mb-6">
                        <div className="rounded-2xl p-5" style={{ background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.07)' }}>
                            <p className="text-xs text-white/35 uppercase tracking-widest mb-2">Checkout Opened</p>
                            <p className="text-2xl font-black text-white">{data.totals.checkoutOpened}</p>
                        </div>
                        <div className="rounded-2xl p-5" style={{ background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.07)' }}>
                            <p className="text-xs text-white/35 uppercase tracking-widest mb-2">Captured & Logged</p>
                            <p className="text-2xl font-black" style={{ color: '#34d399' }}>{data.totals.capturedAndLogged}</p>
                        </div>
                        <div className="rounded-2xl p-5" style={{ background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.07)' }}>
                            <p className="text-xs text-white/35 uppercase tracking-widest mb-2">Paid in DB</p>
                            <p className="text-2xl font-black" style={{ color: '#e71763' }}>{data.totals.paidInDb}</p>
                        </div>
                    </div>

                    <div className="rounded-2xl overflow-hidden mb-6" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(239,68,68,0.2)' }}>
                        <div className="px-5 py-3" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                            <p className="text-xs font-black uppercase tracking-widest" style={{ color: '#f87171' }}>
                                Paid but not logged ({data.issues.paidButNotLogged.length})
                            </p>
                            <p className="text-[11px] text-white/30 mt-1">These purchases likely never fired a GA4 purchase event — the client left before confirmation, or the webhook path processed them alone.</p>
                        </div>
                        {data.issues.paidButNotLogged.length === 0 ? (
                            <p className="text-xs text-white/25 px-5 py-6">None — every paid enrollment has a matching client log.</p>
                        ) : (
                            <table className="w-full text-xs">
                                <tbody>
                                    {data.issues.paidButNotLogged.map((row) => (
                                        <tr key={row.enrollmentId} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                                            <td className="px-5 py-2.5 text-white/70">{row.enrollmentId}</td>
                                            <td className="px-5 py-2.5 text-white/70">{row.customerName}</td>
                                            <td className="px-5 py-2.5 text-white/50">{row.customerEmail}</td>
                                            <td className="px-5 py-2.5 text-white font-bold">{fmtCurrency(row.amountPaid)}</td>
                                            <td className="px-5 py-2.5 text-white/40">{fmtDate(row.createdAt, true)}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}
                    </div>

                    <div className="rounded-2xl overflow-hidden" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(251,191,36,0.2)' }}>
                        <div className="px-5 py-3" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                            <p className="text-xs font-black uppercase tracking-widest" style={{ color: '#fbbf24' }}>
                                Logged captured but not marked paid ({data.issues.loggedButNotPaid.length})
                            </p>
                            <p className="text-[11px] text-white/30 mt-1">Investigate — a DB write may have failed after capture was confirmed.</p>
                        </div>
                        {data.issues.loggedButNotPaid.length === 0 ? (
                            <p className="text-xs text-white/25 px-5 py-6">None.</p>
                        ) : (
                            <div className="px-5 py-4 space-y-1">
                                {data.issues.loggedButNotPaid.map((orderId) => (
                                    <p key={orderId} className="text-xs font-mono text-white/60">{orderId}</p>
                                ))}
                            </div>
                        )}
                    </div>
                </>
            )}
        </div>
    );
}
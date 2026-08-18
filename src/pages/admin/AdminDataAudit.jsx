// src/pages/admin/AdminDataAudit.jsx
//
// Independent, server-side re-derivation of every number the admin panel
// shows elsewhere (revenue, lifecycle counts) plus row-level integrity
// checks. Read-only by design — every fix belongs on the actual enrollment
// (Record Payment, Recalculate, Mark Refunded, the Plan Start Date "Fix"),
// not here. This page exists purely so a disagreement between what's
// displayed elsewhere and what the raw data actually says is visible,
// instead of something you have to take on faith.
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Loader2, AlertCircle, RefreshCw, CheckCircle2, AlertTriangle, Users } from 'lucide-react';
import { fetchDataAudit } from './adminApi';
import { fmtCurrency, formatLabel } from './adminUtils';

const ISSUE_META = {
    missing_plan_start_date: { label: 'Missing Plan Start Date', color: '#60a5fa' },
    paid_with_zero_amount: { label: 'Paid with ₹0 Collected', color: '#f87171' },
    ledger_mismatch: { label: 'Ledger Mismatch', color: '#f87171' },
    balance_mismatch: { label: 'Balance Due Mismatch', color: '#fbbf24' },
};

function StatCard({ label, value, sub, color }) {
    return (
        <div className="rounded-2xl p-5" style={{ background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.07)' }}>
            <p className="text-xs text-white/35 uppercase tracking-widest mb-2">{label}</p>
            <p className="text-2xl font-black mb-1" style={{ color }}>{value}</p>
            {sub && <p className="text-xs text-white/30">{sub}</p>}
        </div>
    );
}

export default function AdminDataAudit() {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const load = async () => {
        setLoading(true);
        setError('');
        try {
            setData(await fetchDataAudit());
        } catch (e) {
            setError(e.message || 'Failed to load data audit.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { load(); }, []);

    return (
        <div>
            <div className="flex items-center justify-between gap-4 mb-6 flex-wrap">
                <div>
                    <h1 className="text-xl font-black text-white mb-1">Data Audit</h1>
                    <p className="text-xs text-white/35">
                        Independently recomputed from the raw tables, on the server — cross-checks every total and
                        badge shown elsewhere in the admin panel. Read-only; fix issues from the flagged enrollment itself.
                    </p>
                </div>
                <button
                    onClick={load}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs text-white/50 hover:text-white transition-all"
                    style={{ border: '1px solid rgba(255,255,255,0.08)' }}
                >
                    <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} /> Refresh
                </button>
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
                    {/* ── Overall verdict ── */}
                    <div
                        className="rounded-2xl p-5 mb-6 flex items-center gap-3"
                        style={{
                            background: data.issues.length === 0 ? 'rgba(52,211,153,0.06)' : 'rgba(239,68,68,0.06)',
                            border: `1px solid ${data.issues.length === 0 ? 'rgba(52,211,153,0.25)' : 'rgba(239,68,68,0.25)'}`,
                        }}
                    >
                        {data.issues.length === 0 ? (
                            <CheckCircle2 className="w-5 h-5 flex-shrink-0" style={{ color: '#34d399' }} />
                        ) : (
                            <AlertTriangle className="w-5 h-5 flex-shrink-0" style={{ color: '#f87171' }} />
                        )}
                        <div>
                            <p className="text-sm font-bold text-white">
                                {data.issues.length === 0
                                    ? 'No data integrity issues found.'
                                    : `${data.issues.length} issue${data.issues.length > 1 ? 's' : ''} found across ${data.totals.enrollmentCount} enrollments.`}
                            </p>
                            <p className="text-[11px] text-white/35 mt-0.5">
                                Last checked {new Date(data.generatedAt).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}
                            </p>
                        </div>
                    </div>

                    {/* ── Revenue reconciliation ── */}
                    <p className="text-[10px] font-black uppercase tracking-widest text-white/25 mb-2.5">Revenue Reconciliation</p>
                    <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 mb-6">
                        <StatCard label="From Enrollment Rows" value={fmtCurrency(data.revenue.fromEnrollmentRows)} color="#e71763" />
                        <StatCard label="From Payment Ledger" value={fmtCurrency(data.revenue.fromPaymentLedger)} color="#e71763" />
                        <StatCard
                            label="Match"
                            value={data.revenue.matches ? 'Yes' : 'No — mismatch!'}
                            sub={data.revenue.matches ? 'Both methods agree exactly' : 'See ledger_mismatch issues below'}
                            color={data.revenue.matches ? '#34d399' : '#f87171'}
                        />
                    </div>

                    {/* ── Lifecycle cross-check ── */}
                    <p className="text-[10px] font-black uppercase tracking-widest text-white/25 mb-2.5">
                        Plan Lifecycle (independent recount — compare against Enrollments page)
                    </p>
                    <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 mb-6">
                        <StatCard label="Active" value={data.lifecycle.active} color="#34d399" />
                        <StatCard label="Expiring ≤7d" value={data.lifecycle.expiringSoon} color="#fbbf24" />
                        <StatCard label="Expired" value={data.lifecycle.expired} color="rgba(255,255,255,0.5)" />
                        <StatCard label="Renewed" value={data.lifecycle.renewed} color="#60a5fa" />
                        <StatCard label="No Active Plan" value={data.lifecycle.noPlan} color="rgba(255,255,255,0.35)" />
                    </div>

                    {/* ── Status breakdown ── */}
                    <p className="text-[10px] font-black uppercase tracking-widest text-white/25 mb-2.5">Status Breakdown</p>
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
                        {['paid', 'pending', 'failed', 'refunded'].map((s) => (
                            <StatCard key={s} label={formatLabel(s)} value={data.totals.statusCounts[s] || 0} color="rgba(255,255,255,0.7)" />
                        ))}
                    </div>

                    {/* ── Flagged issues ── */}
                    <div className="rounded-2xl overflow-hidden mb-6" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.07)' }}>
                        <div className="px-5 py-3" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                            <p className="text-xs font-black uppercase tracking-widest text-white/50">
                                Flagged Enrollments ({data.issues.length})
                            </p>
                        </div>
                        {data.issues.length === 0 ? (
                            <p className="text-xs text-white/25 px-5 py-6 text-center">Nothing flagged.</p>
                        ) : (
                            data.issues.map((issue, i) => {
                                const meta = ISSUE_META[issue.type] || { label: issue.type, color: '#fbbf24' };
                                return (
                                    <div
                                        key={`${issue.id}-${issue.type}-${i}`}
                                        className="flex items-center justify-between gap-4 px-5 py-3"
                                        style={i < data.issues.length - 1 ? { borderBottom: '1px solid rgba(255,255,255,0.04)' } : {}}
                                    >
                                        <div className="min-w-0">
                                            <div className="flex items-center gap-2 mb-1">
                                                <span
                                                    className="text-[10px] font-bold px-2 py-0.5 rounded-full flex-shrink-0"
                                                    style={{ background: `${meta.color}18`, color: meta.color }}
                                                >
                                                    {meta.label}
                                                </span>
                                                <span className="text-xs font-bold text-white truncate">{issue.customerName}</span>
                                                <span className="text-[10px] text-white/30 font-mono flex-shrink-0">{issue.enrollmentId}</span>
                                            </div>
                                            <p className="text-[11px] text-white/40">{issue.message}</p>
                                        </div>
                                        <Link
                                            to={`/admin/enrollments?focus=${issue.id}`}
                                            className="flex-shrink-0 text-[10px] font-bold px-2.5 py-1.5 rounded-lg"
                                            style={{ background: 'rgba(96,165,250,0.1)', border: '1px solid rgba(96,165,250,0.25)', color: '#60a5fa' }}
                                        >
                                            Open
                                        </Link>
                                    </div>
                                );
                            })
                        )}
                    </div>

                    {/* ── Duplicate customers ── */}
                    <div className="rounded-2xl overflow-hidden" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.07)' }}>
                        <div className="px-5 py-3 flex items-center gap-2" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                            <Users className="w-3.5 h-3.5 text-white/40" />
                            <p className="text-xs font-black uppercase tracking-widest text-white/50">
                                Duplicate Customers ({data.duplicateGroups.length})
                            </p>
                        </div>
                        {data.duplicateGroups.length === 0 ? (
                            <p className="text-xs text-white/25 px-5 py-6 text-center">
                                No email/phone shared across more than one pending or paid enrollment.
                            </p>
                        ) : (
                            data.duplicateGroups.map((group, gi) => (
                                <div
                                    key={group.contact}
                                    className="px-5 py-3"
                                    style={gi < data.duplicateGroups.length - 1 ? { borderBottom: '1px solid rgba(255,255,255,0.04)' } : {}}
                                >
                                    <p className="text-[11px] text-white/40 mb-2 font-mono">{group.contact}</p>
                                    <div className="flex flex-wrap gap-2">
                                        {group.enrollments.map((e) => (
                                            <Link
                                                key={e.id}
                                                to={`/admin/enrollments?focus=${e.id}`}
                                                className="flex items-center gap-1.5 text-[10px] font-bold px-2.5 py-1.5 rounded-lg"
                                                style={{ background: 'rgba(251,191,36,0.08)', border: '1px solid rgba(251,191,36,0.2)', color: '#fbbf24' }}
                                            >
                                                {e.customerName} · {e.enrollmentId} · {formatLabel(e.paymentStatus)}
                                            </Link>
                                        ))}
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </>
            )}
        </div>
    );
}

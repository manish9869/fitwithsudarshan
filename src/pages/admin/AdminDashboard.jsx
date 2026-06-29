/**
 * src/pages/admin/AdminDashboard.jsx
 *
 * Landing page after login. One glance answers: how's revenue trending,
 * where are clients coming from (coaching type / plan type / duration),
 * how's the assessment pipeline moving, and what just happened.
 */
import { useEffect, useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import {
    AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    PieChart, Pie, Cell, BarChart, Bar, Legend,
} from 'recharts';
import {
    IndianRupee, TrendingUp, Users, ClipboardList, Tag, Heart,
    RefreshCw, AlertCircle, ArrowUpRight, Calendar, Sparkles, Loader2,
} from 'lucide-react';
import { fetchDashboard } from './adminApi';
import { fmtCurrency, fmtCompactCurrency, fmtRelativeTime, CHART_COLORS } from './adminUtils';
import { Link } from 'react-router-dom';

const RANGE_OPTIONS = [
    { label: '7D', value: 7 },
    { label: '30D', value: 30 },
    { label: '90D', value: 90 },
    { label: '1Y', value: 365 },
];

function KpiCard({ icon: Icon, label, value, sub, accent, delay = 0 }) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay }}
            className="rounded-2xl p-5 relative overflow-hidden"
            style={{ background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.07)' }}
        >
            <div className="flex items-start justify-between mb-3">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center"
                    style={{ background: `${accent}18`, border: `1px solid ${accent}30` }}>
                    <Icon className="w-4 h-4" style={{ color: accent }} />
                </div>
            </div>
            <p className="text-xs text-white/35 uppercase tracking-widest mb-1.5">{label}</p>
            <p className="text-2xl font-black mb-1" style={{ color: accent }}>{value}</p>
            {sub && <p className="text-xs text-white/30">{sub}</p>}
        </motion.div>
    );
}

function ChartCard({ title, icon: Icon, children, className = '' }) {
    return (
        <div className={`rounded-2xl overflow-hidden ${className}`}
            style={{ background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.07)' }}>
            <div className="flex items-center gap-2 px-5 py-4" style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                <Icon className="w-3.5 h-3.5 flex-shrink-0" style={{ color: '#e71763' }} />
                <span className="text-xs font-black uppercase tracking-widest text-white/60">{title}</span>
            </div>
            <div className="p-5">{children}</div>
        </div>
    );
}

function EmptyChartState({ label = 'No data in this range yet' }) {
    return (
        <div className="flex flex-col items-center justify-center py-12 text-center">
            <Sparkles className="w-6 h-6 text-white/15 mb-2" />
            <p className="text-xs text-white/25">{label}</p>
        </div>
    );
}

const tooltipStyle = {
    background: 'rgba(15,15,20,0.95)',
    border: '1px solid rgba(231,23,99,0.25)',
    borderRadius: 10,
    fontSize: 12,
    color: '#fff',
};

export default function AdminDashboard() {
    const [range, setRange] = useState(90);
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const load = useCallback(async (r) => {
        setLoading(true);
        setError('');
        try {
            const d = await fetchDashboard(r);
            setData(d);
        } catch (e) {
            setError(e.message || 'Failed to load dashboard.');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { load(range); }, [range, load]);

    const k = data?.kpis || {};
    const c = data?.charts || {};

    return (
        <div>

            {/* Header */}
            <div className="flex items-start justify-between gap-4 mb-6 flex-wrap">
                <div>
                    <h1 className="text-xl font-black text-white mb-1">Dashboard</h1>
                    <p className="text-xs text-white/35">
                        Overview of the last {range === 365 ? '12 months' : `${range} days`}
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <div className="flex items-center rounded-xl overflow-hidden" style={{ border: '1px solid rgba(255,255,255,0.08)' }}>
                        {RANGE_OPTIONS.map((opt) => (
                            <button
                                key={opt.value}
                                onClick={() => setRange(opt.value)}
                                className="px-3 py-2 text-xs font-bold transition-all"
                                style={range === opt.value
                                    ? { background: '#e71763', color: 'white' }
                                    : { color: 'rgba(255,255,255,0.4)' }}
                            >
                                {opt.label}
                            </button>
                        ))}
                    </div>
                    <button onClick={() => load(range)}
                        className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs text-white/50 hover:text-white transition-all"
                        style={{ border: '1px solid rgba(255,255,255,0.08)' }}>
                        <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
                        Refresh
                    </button>
                </div>
            </div>

            {error && (
                <div className="flex items-center gap-2 px-4 py-3 rounded-xl mb-4 text-sm"
                    style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', color: '#f87171' }}>
                    <AlertCircle className="w-4 h-4 flex-shrink-0" />
                    {error}
                </div>
            )}

            {loading && !data ? (
                <div className="flex items-center justify-center py-32">
                    <Loader2 className="w-6 h-6 animate-spin text-white/25" />
                </div>
            ) : (
                <>
                    {/* KPI row */}
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
                        <KpiCard icon={IndianRupee} label="Revenue" value={fmtCompactCurrency(k.totalRevenue)}
                            sub={`${k.enrollmentsInRange || 0} paid enrollments`} accent="#e71763" delay={0} />
                        <KpiCard icon={TrendingUp} label="Avg. Order Value" value={fmtCompactCurrency(k.avgOrderValue)}
                            sub="per enrollment" accent="#34d399" delay={0.05} />
                        <KpiCard icon={Tag} label="Coupon Savings Given" value={fmtCompactCurrency(k.totalSavings)}
                            sub={`${k.couponUsageCount || 0} enrollments used a code`} accent="#fbbf24" delay={0.1} />
                        <KpiCard icon={ClipboardList} label="New Assessments" value={k.assessmentsInRange ?? 0}
                            sub={k.avgCommitment ? `avg. commitment ${k.avgCommitment.toFixed(1)}/10` : 'in range'} accent="#60a5fa" delay={0.15} />
                    </div>

                    {/* Lifetime totals strip */}
                    <div className="flex flex-wrap items-center gap-4 mb-6 px-5 py-3 rounded-xl text-xs"
                        style={{ background: 'rgba(231,23,99,0.04)', border: '1px solid rgba(231,23,99,0.12)' }}>
                        <span className="text-white/40">All-time:</span>
                        <span className="text-white font-semibold">{k.totalEnrollmentsAllTime ?? '—'} total enrollments</span>
                        <span className="text-white/20">·</span>
                        <span className="text-white font-semibold">{k.totalAssessmentsAllTime ?? '—'} total assessments</span>
                        <span className="text-white/20">·</span>
                        <span className="text-white font-semibold">{k.coupleCount ?? 0} couple plans in range</span>
                    </div>

                    {/* Revenue trend */}
                    <ChartCard title="Revenue Trend" icon={TrendingUp} className="mb-5">
                        {!c.revenueTrend?.length ? (
                            <EmptyChartState label="No paid enrollments in this range yet" />
                        ) : (
                            <ResponsiveContainer width="100%" height={260}>
                                <AreaChart data={c.revenueTrend} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
                                    <defs>
                                        <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="0%" stopColor="#e71763" stopOpacity={0.4} />
                                            <stop offset="100%" stopColor="#e71763" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                                    <XAxis dataKey="date" tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 11 }}
                                        tickFormatter={(d) => new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}
                                        axisLine={false} tickLine={false} />
                                    <YAxis tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 11 }}
                                        tickFormatter={(v) => fmtCompactCurrency(v)} axisLine={false} tickLine={false} width={56} />
                                    <Tooltip contentStyle={tooltipStyle}
                                        formatter={(v) => [fmtCurrency(v), 'Revenue']}
                                        labelFormatter={(d) => new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' })} />
                                    <Area type="monotone" dataKey="amount" stroke="#e71763" strokeWidth={2} fill="url(#revGrad)" />
                                </AreaChart>
                            </ResponsiveContainer>
                        )}
                    </ChartCard>

                    {/* Split charts row */}
                    <div className="grid lg:grid-cols-3 gap-5 mb-5">
                        <ChartCard title="Coaching Type" icon={Users}>
                            {!c.coachingTypeSplit?.length ? <EmptyChartState /> : (
                                <ResponsiveContainer width="100%" height={200}>
                                    <PieChart>
                                        <Pie data={c.coachingTypeSplit} dataKey="value" nameKey="name" cx="50%" cy="50%"
                                            innerRadius={45} outerRadius={75} paddingAngle={3}>
                                            {c.coachingTypeSplit.map((_, i) => (
                                                <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                                            ))}
                                        </Pie>
                                        <Tooltip contentStyle={tooltipStyle} />
                                        <Legend wrapperStyle={{ fontSize: 11, color: 'rgba(255,255,255,0.5)' }} />
                                    </PieChart>
                                </ResponsiveContainer>
                            )}
                        </ChartCard>

                        <ChartCard title="Individual vs Couple" icon={Heart}>
                            {!c.planTypeSplit?.length ? <EmptyChartState /> : (
                                <ResponsiveContainer width="100%" height={200}>
                                    <PieChart>
                                        <Pie data={c.planTypeSplit} dataKey="value" nameKey="name" cx="50%" cy="50%"
                                            innerRadius={45} outerRadius={75} paddingAngle={3}>
                                            {c.planTypeSplit.map((_, i) => (
                                                <Cell key={i} fill={CHART_COLORS[(i + 2) % CHART_COLORS.length]} />
                                            ))}
                                        </Pie>
                                        <Tooltip contentStyle={tooltipStyle} />
                                        <Legend wrapperStyle={{ fontSize: 11, color: 'rgba(255,255,255,0.5)' }} />
                                    </PieChart>
                                </ResponsiveContainer>
                            )}
                        </ChartCard>

                        <ChartCard title="Duration Chosen" icon={Calendar}>
                            {!c.durationSplit?.length ? <EmptyChartState /> : (
                                <ResponsiveContainer width="100%" height={200}>
                                    <BarChart data={c.durationSplit} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                                        <XAxis dataKey="name" tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 11 }} axisLine={false} tickLine={false} />
                                        <YAxis tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 11 }} axisLine={false} tickLine={false} allowDecimals={false} />
                                        <Tooltip contentStyle={tooltipStyle} />
                                        <Bar dataKey="value" fill="#e71763" radius={[6, 6, 0, 0]} />
                                    </BarChart>
                                </ResponsiveContainer>
                            )}
                        </ChartCard>
                    </div>

                    {/* Assessment pipeline + recent activity */}
                    <div className="grid lg:grid-cols-3 gap-5">
                        <ChartCard title="Assessment Pipeline" icon={ClipboardList} className="lg:col-span-1">
                            {!c.assessmentStatusSplit?.length ? <EmptyChartState label="No assessments in this range yet" /> : (
                                <div className="space-y-3">
                                    {c.assessmentStatusSplit.map((s, i) => {
                                        const total = c.assessmentStatusSplit.reduce((sum, x) => sum + x.value, 0);
                                        const pct = total ? Math.round((s.value / total) * 100) : 0;
                                        return (
                                            <div key={s.name}>
                                                <div className="flex items-center justify-between mb-1.5">
                                                    <span className="text-xs text-white/60 capitalize">{s.name.replace('_', ' ')}</span>
                                                    <span className="text-xs font-bold text-white">{s.value}</span>
                                                </div>
                                                <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.06)' }}>
                                                    <div className="h-full rounded-full" style={{ width: `${pct}%`, background: CHART_COLORS[i % CHART_COLORS.length] }} />
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </ChartCard>

                        <div className="lg:col-span-2 rounded-2xl overflow-hidden"
                            style={{ background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.07)' }}>
                            <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                                <div className="flex items-center gap-2">
                                    <ArrowUpRight className="w-3.5 h-3.5" style={{ color: '#e71763' }} />
                                    <span className="text-xs font-black uppercase tracking-widest text-white/60">Recent Activity</span>
                                </div>
                            </div>
                            <div className="divide-y" style={{ '--tw-divide-opacity': 1 }}>
                                {!data?.recentActivity?.length ? (
                                    <EmptyChartState label="Nothing yet in this range" />
                                ) : data.recentActivity.map((item) => (
                                    <Link
                                        key={`${item.type}-${item.id}`}
                                        to={item.type === 'enrollment' ? `/admin/enrollments?focus=${item.id}` : `/admin/assessments?focus=${item.id}`}
                                        className="flex items-center justify-between gap-3 px-5 py-3 hover:bg-white/[0.02] transition-colors"
                                        style={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }}
                                    >
                                        <div className="flex items-center gap-3 min-w-0">
                                            <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
                                                style={{
                                                    background: item.type === 'enrollment' ? 'rgba(231,23,99,0.1)' : 'rgba(96,165,250,0.1)',
                                                    border: `1px solid ${item.type === 'enrollment' ? 'rgba(231,23,99,0.25)' : 'rgba(96,165,250,0.25)'}`,
                                                }}>
                                                {item.type === 'enrollment'
                                                    ? <Users className="w-3.5 h-3.5" style={{ color: '#e71763' }} />
                                                    : <ClipboardList className="w-3.5 h-3.5" style={{ color: '#60a5fa' }} />}
                                            </div>
                                            <div className="min-w-0">
                                                <p className="text-sm font-semibold text-white truncate">{item.title}</p>
                                                <p className="text-[11px] text-white/35 truncate">{item.subtitle || (item.type === 'enrollment' ? 'New enrollment' : 'New assessment')}</p>
                                            </div>
                                        </div>
                                        <div className="text-right flex-shrink-0">
                                            {item.amount != null && (
                                                <p className="text-sm font-bold" style={{ color: '#e71763' }}>{fmtCurrency(item.amount)}</p>
                                            )}
                                            <p className="text-[10px] text-white/25">{fmtRelativeTime(item.timestamp)}</p>
                                        </div>
                                    </Link>
                                ))}
                            </div>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}
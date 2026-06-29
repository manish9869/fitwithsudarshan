/**
 * src/pages/admin/AdminDashboard.jsx
 *
 * Fixes:
 * - Removed ugly white/grey hover backgrounds.
 * - Hover now elevates cards/rows using transform + shadow.
 * - Donut/ring chart tooltip now shows label + value + percentage.
 * - Bar charts improved with gradients, labels, cleaner tooltip, no grey hover cursor.
 * - Recent Activity now has max height + custom scroll so Assessment Pipeline stays clean.
 */

import { useEffect, useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import {
    AreaChart, Area,
    XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    PieChart, Pie, Cell,
    BarChart, Bar, LabelList,
} from 'recharts';
import {
    IndianRupee, TrendingUp, Users, ClipboardList, Tag, Heart,
    RefreshCw, AlertCircle, ArrowUpRight, Calendar, Sparkles, Loader2,
    Percent,
} from 'lucide-react';
import { fetchDashboard } from './adminApi';
import { fmtCurrency, fmtCompactCurrency, fmtRelativeTime } from './adminUtils';
import { Link } from 'react-router-dom';

const RANGE_OPTIONS = [
    { label: '7D', value: 7 },
    { label: '30D', value: 30 },
    { label: '90D', value: 90 },
    { label: '1Y', value: 365 },
];

const PIE_COLORS = ['#e71763', '#60a5fa', '#34d399', '#fbbf24', '#a78bfa', '#f472b6'];

const cardBaseStyle = {
    background: 'rgba(255,255,255,0.025)',
    border: '1px solid rgba(255,255,255,0.07)',
};

const tooltipWrapperStyle = {
    background: 'rgba(12,12,22,0.98)',
    border: '1px solid rgba(231,23,99,0.28)',
    borderRadius: 14,
    color: '#fff',
    boxShadow: '0 18px 50px rgba(0,0,0,0.65)',
    padding: '10px 12px',
};

const tooltipStyle = {
    background: 'rgba(12,12,22,0.98)',
    border: '1px solid rgba(231,23,99,0.28)',
    borderRadius: 14,
    fontSize: 12,
    color: '#fff',
    boxShadow: '0 18px 50px rgba(0,0,0,0.65)',
};

// ── Shared Tooltip ────────────────────────────────────────────────────────────
function CustomTooltip({ active, payload, label, formatter, labelFormatter, valueLabel = 'Value' }) {
    if (!active || !payload?.length) return null;

    const item = payload[0];
    const rawValue = item.value;
    const displayValue = formatter ? formatter(rawValue) : rawValue;

    return (
        <div style={tooltipWrapperStyle}>
            {label && (
                <p className="text-[11px] text-white/35 mb-1">
                    {labelFormatter ? labelFormatter(label) : label}
                </p>
            )}

            <div className="flex items-center gap-2">
                <span
                    className="w-2 h-2 rounded-full"
                    style={{ background: item.color || '#e71763' }}
                />
                <p className="text-xs font-semibold text-white">
                    {item.name || valueLabel}
                </p>
            </div>

            <p className="text-sm font-black mt-1" style={{ color: item.color || '#e71763' }}>
                {displayValue}
            </p>
        </div>
    );
}

function DonutTooltip({ active, payload, total = 0, formatter, valueLabel = 'Count' }) {
    if (!active || !payload?.length) return null;

    const item = payload[0];
    const name = item.name || item.payload?.name || 'Item';
    const value = item.value ?? item.payload?.value ?? 0;
    const pct = total ? Math.round((Number(value) / Number(total)) * 100) : 0;
    const displayValue = formatter ? formatter(value) : value;

    return (
        <div style={tooltipWrapperStyle}>
            <div className="flex items-center gap-2 mb-1">
                <span
                    className="w-2 h-2 rounded-full"
                    style={{ background: item.payload?.fill || item.color || '#e71763' }}
                />
                <p className="text-xs font-bold text-white">{name}</p>
            </div>

            <div className="flex items-end gap-2">
                <p className="text-base font-black" style={{ color: item.payload?.fill || item.color || '#e71763' }}>
                    {displayValue}
                </p>
                <p className="text-[11px] text-white/35 mb-0.5">{valueLabel}</p>
            </div>

            <p className="text-[11px] text-white/35 mt-1">
                {pct}% of total
            </p>
        </div>
    );
}

// ── KPI Card ──────────────────────────────────────────────────────────────────
function KpiCard({ icon: Icon, label, value, sub, accent, delay = 0 }) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            whileHover={{
                y: -4,
                scale: 1.015,
                boxShadow: `0 18px 45px ${accent}14`,
                borderColor: `${accent}35`,
            }}
            transition={{ duration: 0.25, delay }}
            className="rounded-2xl p-5 relative overflow-hidden will-change-transform"
            style={cardBaseStyle}
        >
            <div
                className="absolute top-0 left-0 right-0 h-0.5 rounded-t-2xl"
                style={{ background: `linear-gradient(90deg, ${accent}90, ${accent}20)` }}
            />

            <div className="flex items-start justify-between mb-3">
                <div
                    className="w-9 h-9 rounded-xl flex items-center justify-center"
                    style={{ background: `${accent}18`, border: `1px solid ${accent}30` }}
                >
                    <Icon className="w-4 h-4" style={{ color: accent }} />
                </div>
            </div>

            <p className="text-xs text-white/35 uppercase tracking-widest mb-1.5">{label}</p>
            <p className="text-2xl font-black mb-1" style={{ color: accent }}>{value}</p>
            {sub && <p className="text-xs text-white/30">{sub}</p>}
        </motion.div>
    );
}

// ── Chart Card ────────────────────────────────────────────────────────────────
function ChartCard({ title, icon: Icon, children, className = '', badge }) {
    return (
        <motion.div
            whileHover={{
                y: -3,
                boxShadow: '0 18px 45px rgba(0,0,0,0.28)',
                borderColor: 'rgba(231,23,99,0.22)',
            }}
            transition={{ duration: 0.22 }}
            className={`rounded-2xl overflow-hidden will-change-transform ${className}`}
            style={cardBaseStyle}
        >
            <div
                className="flex items-center justify-between px-5 py-4"
                style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}
            >
                <div className="flex items-center gap-2">
                    <Icon className="w-3.5 h-3.5 flex-shrink-0" style={{ color: '#e71763' }} />
                    <span className="text-xs font-black uppercase tracking-widest text-white/60">
                        {title}
                    </span>
                </div>

                {badge && (
                    <span
                        className="text-[10px] font-bold px-2 py-1 rounded-full"
                        style={{
                            background: 'rgba(231,23,99,0.1)',
                            color: '#e71763',
                            border: '1px solid rgba(231,23,99,0.2)',
                        }}
                    >
                        {badge}
                    </span>
                )}
            </div>

            <div className="p-4">{children}</div>
        </motion.div>
    );
}

function EmptyState({ label = 'No data in this range yet' }) {
    return (
        <div className="flex flex-col items-center justify-center py-14 text-center">
            <Sparkles className="w-6 h-6 text-white/12 mb-2" />
            <p className="text-xs text-white/20">{label}</p>
        </div>
    );
}

// ── Donut Label ───────────────────────────────────────────────────────────────
const renderPieLabel = ({ cx, cy, midAngle, outerRadius, name, value, percent }) => {
    if (percent < 0.06) return null;

    const RADIAN = Math.PI / 180;
    const radius = outerRadius + 26;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);

    return (
        <text
            x={x}
            y={y}
            fill="rgba(255,255,255,0.58)"
            textAnchor={x > cx ? 'start' : 'end'}
            dominantBaseline="central"
            fontSize={10}
            fontWeight={700}
        >
            {name} ({value})
        </text>
    );
};

// ── Bar Value Label ───────────────────────────────────────────────────────────
function BarValueLabel({ x, y, width, value, formatter }) {
    if (value == null) return null;

    return (
        <text
            x={x + width / 2}
            y={y - 8}
            fill="rgba(255,255,255,0.58)"
            textAnchor="middle"
            fontSize={10}
            fontWeight={800}
        >
            {formatter ? formatter(value) : value}
        </text>
    );
}

// ── Activity Feed Item ────────────────────────────────────────────────────────
function ActivityItem({ item }) {
    const isEnrollment = item.type === 'enrollment';
    const accent = isEnrollment ? '#e71763' : '#60a5fa';

    return (
        <Link
            to={
                isEnrollment
                    ? `/admin/enrollments?focus=${item.id}`
                    : `/admin/assessments?focus=${item.id}`
            }
            className="group flex items-center justify-between gap-3 px-5 py-3 rounded-xl mx-2 my-1 transition-all duration-200"
            style={{
                border: '1px solid transparent',
                borderBottom: '1px solid rgba(255,255,255,0.03)',
                background: 'transparent',
            }}
            onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = `${accent}26`;
                e.currentTarget.style.boxShadow = `0 10px 26px ${accent}10`;
            }}
            onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = 'transparent';
                e.currentTarget.style.boxShadow = 'none';
            }}
        >
            <div className="flex items-center gap-3 min-w-0">
                <div
                    className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 transition-transform duration-200 group-hover:-translate-y-0.5"
                    style={{
                        background: isEnrollment ? 'rgba(231,23,99,0.1)' : 'rgba(96,165,250,0.1)',
                        border: `1px solid ${isEnrollment ? 'rgba(231,23,99,0.25)' : 'rgba(96,165,250,0.25)'}`,
                    }}
                >
                    {isEnrollment ? (
                        <Users className="w-3.5 h-3.5" style={{ color: '#e71763' }} />
                    ) : (
                        <ClipboardList className="w-3.5 h-3.5" style={{ color: '#60a5fa' }} />
                    )}
                </div>

                <div className="min-w-0">
                    <p className="text-sm font-semibold text-white truncate">{item.title}</p>
                    <p className="text-[11px] text-white/35 truncate">
                        {item.subtitle || (isEnrollment ? 'New enrollment' : 'New assessment')}
                    </p>
                </div>
            </div>

            <div className="text-right flex-shrink-0">
                {item.amount != null && (
                    <p className="text-sm font-bold" style={{ color: '#e71763' }}>
                        {fmtCurrency(item.amount)}
                    </p>
                )}
                <p className="text-[10px] text-white/25">{fmtRelativeTime(item.timestamp)}</p>
            </div>
        </Link>
    );
}

// ── Main ──────────────────────────────────────────────────────────────────────
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

    useEffect(() => {
        load(range);
    }, [range, load]);

    const k = data?.kpis || {};
    const c = data?.charts || {};

    const coachingTotal = c.coachingTypeSplit?.reduce((sum, item) => sum + Number(item.value || 0), 0) || 0;
    const planTypeTotal = c.planTypeSplit?.reduce((sum, item) => sum + Number(item.value || 0), 0) || 0;

    return (
        <div>
            {/* Local scrollbar style for recent activity */}
            <style>
                {`
                    .dashboard-thin-scroll::-webkit-scrollbar {
                        width: 6px;
                    }

                    .dashboard-thin-scroll::-webkit-scrollbar-track {
                        background: rgba(255,255,255,0.03);
                        border-radius: 999px;
                    }

                    .dashboard-thin-scroll::-webkit-scrollbar-thumb {
                        background: rgba(231,23,99,0.35);
                        border-radius: 999px;
                    }

                    .dashboard-thin-scroll::-webkit-scrollbar-thumb:hover {
                        background: rgba(231,23,99,0.55);
                    }
                `}
            </style>

            {/* ── Header ── */}
            <div className="flex items-start justify-between gap-4 mb-6 flex-wrap">
                <div>
                    <h1 className="text-xl font-black text-white mb-1">Dashboard</h1>
                    <p className="text-xs text-white/35">
                        Overview of the last {range === 365 ? '12 months' : `${range} days`}
                    </p>
                </div>

                <div className="flex items-center gap-2">
                    <div
                        className="flex items-center rounded-xl overflow-hidden"
                        style={{ border: '1px solid rgba(255,255,255,0.08)' }}
                    >
                        {RANGE_OPTIONS.map((opt) => (
                            <button
                                key={opt.value}
                                onClick={() => setRange(opt.value)}
                                className="px-3 py-2 text-xs font-bold transition-all"
                                style={
                                    range === opt.value
                                        ? { background: '#e71763', color: 'white' }
                                        : { color: 'rgba(255,255,255,0.4)', background: 'transparent' }
                                }
                            >
                                {opt.label}
                            </button>
                        ))}
                    </div>

                    <button
                        onClick={() => load(range)}
                        className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs text-white/50 hover:text-white transition-all"
                        style={{
                            border: '1px solid rgba(255,255,255,0.08)',
                            background: 'transparent',
                        }}
                    >
                        <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
                        Refresh
                    </button>
                </div>
            </div>

            {error && (
                <div
                    className="flex items-center gap-2 px-4 py-3 rounded-xl mb-4 text-sm"
                    style={{
                        background: 'rgba(239,68,68,0.08)',
                        border: '1px solid rgba(239,68,68,0.2)',
                        color: '#f87171',
                    }}
                >
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
                    {/* ── KPI Row 1 ── */}
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
                        <KpiCard
                            icon={IndianRupee}
                            label="Revenue"
                            accent="#e71763"
                            value={fmtCompactCurrency(k.totalRevenue)}
                            sub={`avg. ${fmtCompactCurrency(k.avgOrderValue)} / order`}
                            delay={0}
                        />

                        <KpiCard
                            icon={Users}
                            label="Paid Enrollments"
                            accent="#34d399"
                            value={k.enrollmentsInRange ?? 0}
                            sub={`${k.totalEnrollmentsAllTime ?? 0} all-time`}
                            delay={0.05}
                        />

                        <KpiCard
                            icon={ClipboardList}
                            label="New Assessments"
                            accent="#60a5fa"
                            value={k.assessmentsInRange ?? 0}
                            sub={`${k.totalAssessmentsAllTime ?? 0} all-time`}
                            delay={0.1}
                        />

                        <KpiCard
                            icon={Tag}
                            label="Savings Given"
                            accent="#fbbf24"
                            value={fmtCompactCurrency(k.totalSavings)}
                            sub={`${k.couponUsageCount ?? 0} coupon uses`}
                            delay={0.15}
                        />
                    </div>

                    {/* ── KPI Row 2 ── */}
                    <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 mb-6">
                        <KpiCard
                            icon={Percent}
                            label="Conversion Rate"
                            accent="#a78bfa"
                            value={k.conversionRate != null ? `${k.conversionRate}%` : '—'}
                            sub="assessments → enrollments"
                            delay={0.2}
                        />

                        <KpiCard
                            icon={Heart}
                            label="Couple Plans"
                            accent="#f472b6"
                            value={k.coupleCount ?? 0}
                            sub="in selected range"
                            delay={0.25}
                        />

                        <KpiCard
                            icon={Sparkles}
                            label="Avg. Commitment"
                            accent="#fb923c"
                            value={k.avgCommitment ? `${k.avgCommitment.toFixed(1)}/10` : '—'}
                            sub="from assessments"
                            delay={0.3}
                        />
                    </div>

                    {/* ── Lifetime Strip ── */}
                    <div
                        className="flex flex-wrap items-center gap-4 mb-6 px-5 py-3 rounded-xl text-xs"
                        style={{
                            background: 'rgba(231,23,99,0.04)',
                            border: '1px solid rgba(231,23,99,0.12)',
                        }}
                    >
                        <span className="text-white/40">All-time totals:</span>
                        <span className="text-white font-semibold">{k.totalEnrollmentsAllTime ?? '—'} enrollments</span>
                        <span className="text-white/20">·</span>
                        <span className="text-white font-semibold">{k.totalAssessmentsAllTime ?? '—'} assessments</span>
                        <span className="text-white/20">·</span>
                        <span className="text-white font-semibold">{fmtCompactCurrency(k.totalRevenue)} revenue</span>
                    </div>

                    {/* ── Revenue Trend ── */}
                    <ChartCard
                        title="Revenue Trend"
                        icon={TrendingUp}
                        className="mb-5"
                        badge={`${c.revenueTrend?.length ?? 0} data points`}
                    >
                        {!c.revenueTrend?.length ? (
                            <EmptyState label="No paid enrollments in this range yet" />
                        ) : (
                            <ResponsiveContainer width="100%" height={280}>
                                <AreaChart
                                    data={c.revenueTrend}
                                    margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
                                >
                                    <defs>
                                        <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="0%" stopColor="#e71763" stopOpacity={0.45} />
                                            <stop offset="100%" stopColor="#e71763" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>

                                    <CartesianGrid
                                        strokeDasharray="3 3"
                                        stroke="rgba(255,255,255,0.05)"
                                        vertical={false}
                                    />

                                    <XAxis
                                        dataKey="date"
                                        tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 11 }}
                                        tickFormatter={(d) =>
                                            new Date(d).toLocaleDateString('en-IN', {
                                                day: '2-digit',
                                                month: 'short',
                                            })
                                        }
                                        axisLine={false}
                                        tickLine={false}
                                    />

                                    <YAxis
                                        tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 11 }}
                                        tickFormatter={(v) => fmtCompactCurrency(v)}
                                        axisLine={false}
                                        tickLine={false}
                                        width={60}
                                    />

                                    <Tooltip
                                        cursor={{ stroke: 'rgba(231,23,99,0.25)', strokeWidth: 1 }}
                                        content={
                                            <CustomTooltip
                                                formatter={(v) => fmtCurrency(v)}
                                                valueLabel="Revenue"
                                                labelFormatter={(d) =>
                                                    new Date(d).toLocaleDateString('en-IN', {
                                                        day: '2-digit',
                                                        month: 'long',
                                                        year: 'numeric',
                                                    })
                                                }
                                            />
                                        }
                                    />

                                    <Area
                                        type="monotone"
                                        dataKey="amount"
                                        name="Revenue"
                                        stroke="#e71763"
                                        strokeWidth={2.7}
                                        fill="url(#revGrad)"
                                        dot={false}
                                        activeDot={{
                                            r: 5,
                                            fill: '#e71763',
                                            stroke: '#fff',
                                            strokeWidth: 1.5,
                                        }}
                                    />
                                </AreaChart>
                            </ResponsiveContainer>
                        )}
                    </ChartCard>

                    {/* ── Donut Charts ── */}
                    <div className="grid lg:grid-cols-2 gap-5 mb-5">
                        <ChartCard title="Enrollments by Coaching Type" icon={Users}>
                            {!c.coachingTypeSplit?.length ? (
                                <EmptyState />
                            ) : (
                                <ResponsiveContainer width="100%" height={275}>
                                    <PieChart>
                                        <Pie
                                            data={c.coachingTypeSplit}
                                            dataKey="value"
                                            nameKey="name"
                                            cx="50%"
                                            cy="50%"
                                            innerRadius={58}
                                            outerRadius={92}
                                            paddingAngle={4}
                                            cornerRadius={8}
                                            labelLine={false}
                                            label={renderPieLabel}
                                        >
                                            {c.coachingTypeSplit.map((_, i) => (
                                                <Cell
                                                    key={i}
                                                    fill={PIE_COLORS[i % PIE_COLORS.length]}
                                                    stroke="rgba(12,12,22,0.95)"
                                                    strokeWidth={3}
                                                />
                                            ))}
                                        </Pie>

                                        <Tooltip
                                            cursor={false}
                                            content={
                                                <DonutTooltip
                                                    total={coachingTotal}
                                                    valueLabel="enrollments"
                                                />
                                            }
                                        />
                                    </PieChart>
                                </ResponsiveContainer>
                            )}
                        </ChartCard>

                        <ChartCard title="Individual vs Couple Plans" icon={Heart}>
                            {!c.planTypeSplit?.length ? (
                                <EmptyState />
                            ) : (
                                <ResponsiveContainer width="100%" height={275}>
                                    <PieChart>
                                        <Pie
                                            data={c.planTypeSplit}
                                            dataKey="value"
                                            nameKey="name"
                                            cx="50%"
                                            cy="50%"
                                            innerRadius={58}
                                            outerRadius={92}
                                            paddingAngle={4}
                                            cornerRadius={8}
                                            labelLine={false}
                                            label={renderPieLabel}
                                        >
                                            {c.planTypeSplit.map((_, i) => (
                                                <Cell
                                                    key={i}
                                                    fill={[PIE_COLORS[2], PIE_COLORS[4]][i % 2]}
                                                    stroke="rgba(12,12,22,0.95)"
                                                    strokeWidth={3}
                                                />
                                            ))}
                                        </Pie>

                                        <Tooltip
                                            cursor={false}
                                            content={
                                                <DonutTooltip
                                                    total={planTypeTotal}
                                                    valueLabel="plans"
                                                />
                                            }
                                        />
                                    </PieChart>
                                </ResponsiveContainer>
                            )}
                        </ChartCard>
                    </div>

                    {/* ── Bar Charts ── */}
                    <div className="grid lg:grid-cols-2 gap-5 mb-5">
                        <ChartCard title="Duration Chosen by Clients" icon={Calendar}>
                            {!c.durationSplit?.length ? (
                                <EmptyState />
                            ) : (
                                <ResponsiveContainer width="100%" height={285}>
                                    <BarChart
                                        data={c.durationSplit}
                                        margin={{ top: 24, right: 12, left: -16, bottom: 0 }}
                                        barCategoryGap="28%"
                                    >
                                        <defs>
                                            <linearGradient id="durationBarGrad" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="0%" stopColor="#e71763" stopOpacity={0.95} />
                                                <stop offset="100%" stopColor="#e71763" stopOpacity={0.35} />
                                            </linearGradient>
                                        </defs>

                                        <CartesianGrid
                                            strokeDasharray="3 3"
                                            stroke="rgba(255,255,255,0.045)"
                                            vertical={false}
                                        />

                                        <XAxis
                                            dataKey="name"
                                            tick={{ fill: 'rgba(255,255,255,0.45)', fontSize: 11, fontWeight: 700 }}
                                            axisLine={false}
                                            tickLine={false}
                                        />

                                        <YAxis
                                            tick={{ fill: 'rgba(255,255,255,0.28)', fontSize: 11 }}
                                            axisLine={false}
                                            tickLine={false}
                                            allowDecimals={false}
                                        />

                                        <Tooltip
                                            cursor={{ fill: 'transparent' }}
                                            content={
                                                <CustomTooltip
                                                    formatter={(v) => v}
                                                    valueLabel="Enrollments"
                                                />
                                            }
                                        />

                                        <Bar
                                            dataKey="value"
                                            name="Enrollments"
                                            fill="url(#durationBarGrad)"
                                            radius={[10, 10, 4, 4]}
                                            maxBarSize={54}
                                            background={{ fill: 'rgba(255,255,255,0.025)', radius: 10 }}
                                        >
                                            <LabelList
                                                dataKey="value"
                                                content={(props) => <BarValueLabel {...props} />}
                                            />
                                        </Bar>
                                    </BarChart>
                                </ResponsiveContainer>
                            )}
                        </ChartCard>

                        <ChartCard title="Revenue by Coaching Type" icon={IndianRupee}>
                            {!c.revenueByCoachingType?.length ? (
                                <EmptyState />
                            ) : (
                                <ResponsiveContainer width="100%" height={285}>
                                    <BarChart
                                        data={c.revenueByCoachingType}
                                        margin={{ top: 24, right: 12, left: -4, bottom: 0 }}
                                        barCategoryGap="28%"
                                    >
                                        <defs>
                                            <linearGradient id="revenueTypeBarGrad" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="0%" stopColor="#60a5fa" stopOpacity={0.95} />
                                                <stop offset="100%" stopColor="#e71763" stopOpacity={0.35} />
                                            </linearGradient>
                                        </defs>

                                        <CartesianGrid
                                            strokeDasharray="3 3"
                                            stroke="rgba(255,255,255,0.045)"
                                            vertical={false}
                                        />

                                        <XAxis
                                            dataKey="name"
                                            tick={{ fill: 'rgba(255,255,255,0.45)', fontSize: 11, fontWeight: 700 }}
                                            axisLine={false}
                                            tickLine={false}
                                        />

                                        <YAxis
                                            tick={{ fill: 'rgba(255,255,255,0.28)', fontSize: 11 }}
                                            tickFormatter={(v) => fmtCompactCurrency(v)}
                                            axisLine={false}
                                            tickLine={false}
                                            width={58}
                                        />

                                        <Tooltip
                                            cursor={{ fill: 'transparent' }}
                                            content={
                                                <CustomTooltip
                                                    formatter={(v) => fmtCurrency(v)}
                                                    valueLabel="Revenue"
                                                />
                                            }
                                        />

                                        <Bar
                                            dataKey="value"
                                            name="Revenue"
                                            fill="url(#revenueTypeBarGrad)"
                                            radius={[10, 10, 4, 4]}
                                            maxBarSize={54}
                                            background={{ fill: 'rgba(255,255,255,0.025)', radius: 10 }}
                                        >
                                            <LabelList
                                                dataKey="value"
                                                content={(props) => (
                                                    <BarValueLabel
                                                        {...props}
                                                        formatter={(v) => fmtCompactCurrency(v)}
                                                    />
                                                )}
                                            />
                                        </Bar>
                                    </BarChart>
                                </ResponsiveContainer>
                            )}
                        </ChartCard>
                    </div>

                    {/* ── Assessment Pipeline + Recent Activity ── */}
                    <div className="grid lg:grid-cols-3 gap-5 items-start">
                        <ChartCard title="Assessment Pipeline" icon={ClipboardList}>
                            {!c.assessmentStatusSplit?.length ? (
                                <EmptyState label="No assessments in this range yet" />
                            ) : (
                                <div className="space-y-3.5 py-1">
                                    {(() => {
                                        const total = c.assessmentStatusSplit.reduce(
                                            (s, x) => s + Number(x.value || 0),
                                            0
                                        );

                                        const statusColors = {
                                            new: '#60a5fa',
                                            reviewed: '#fbbf24',
                                            plan_sent: '#a78bfa',
                                            completed: '#34d399',
                                            archived: 'rgba(255,255,255,0.25)',
                                        };

                                        return c.assessmentStatusSplit.map((s, i) => {
                                            const pct = total ? Math.round((Number(s.value || 0) / total) * 100) : 0;
                                            const color = statusColors[s.name] || PIE_COLORS[i % PIE_COLORS.length];

                                            return (
                                                <div key={s.name}>
                                                    <div className="flex items-center justify-between mb-1.5">
                                                        <span className="text-xs text-white/60 capitalize font-medium">
                                                            {String(s.name).replace('_', ' ')}
                                                        </span>

                                                        <div className="flex items-center gap-2">
                                                            <span className="text-[10px] text-white/30">{pct}%</span>
                                                            <span className="text-xs font-bold text-white">{s.value}</span>
                                                        </div>
                                                    </div>

                                                    <div
                                                        className="h-2 rounded-full overflow-hidden"
                                                        style={{ background: 'rgba(255,255,255,0.06)' }}
                                                    >
                                                        <motion.div
                                                            className="h-full rounded-full"
                                                            style={{
                                                                background: `linear-gradient(90deg, ${color}, ${color}99)`,
                                                                boxShadow: `0 0 16px ${color}35`,
                                                            }}
                                                            initial={{ width: 0 }}
                                                            animate={{ width: `${pct}%` }}
                                                            transition={{ duration: 0.8, delay: i * 0.08 }}
                                                        />
                                                    </div>
                                                </div>
                                            );
                                        });
                                    })()}

                                    <div
                                        className="pt-2 border-t mt-2"
                                        style={{ borderColor: 'rgba(255,255,255,0.05)' }}
                                    >
                                        <p className="text-[10px] text-white/25 text-right">
                                            {c.assessmentStatusSplit.reduce((s, x) => s + Number(x.value || 0), 0)} total
                                        </p>
                                    </div>
                                </div>
                            )}
                        </ChartCard>

                        <motion.div
                            whileHover={{
                                y: -3,
                                boxShadow: '0 18px 45px rgba(0,0,0,0.28)',
                                borderColor: 'rgba(231,23,99,0.22)',
                            }}
                            transition={{ duration: 0.22 }}
                            className="lg:col-span-2 rounded-2xl overflow-hidden will-change-transform"
                            style={cardBaseStyle}
                        >
                            <div
                                className="flex items-center justify-between px-5 py-4"
                                style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}
                            >
                                <div className="flex items-center gap-2">
                                    <ArrowUpRight className="w-3.5 h-3.5" style={{ color: '#e71763' }} />
                                    <span className="text-xs font-black uppercase tracking-widest text-white/60">
                                        Recent Activity
                                    </span>
                                </div>

                                <span className="text-[10px] text-white/25">
                                    {data?.recentActivity?.length ?? 0} latest
                                </span>
                            </div>

                            <div className="max-h-[330px] overflow-y-auto dashboard-thin-scroll py-1 pr-1">
                                {!data?.recentActivity?.length ? (
                                    <EmptyState label="Nothing yet in this range" />
                                ) : (
                                    data.recentActivity.map((item) => (
                                        <ActivityItem
                                            key={`${item.type}-${item.id}`}
                                            item={item}
                                        />
                                    ))
                                )}
                            </div>
                        </motion.div>
                    </div>
                </>
            )}
        </div>
    );
}
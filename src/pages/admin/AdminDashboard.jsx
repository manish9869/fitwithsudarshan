/**
 * src/pages/admin/AdminDashboard.jsx
 *
 * Changes:
 * - Removed "Assessment Pipeline" chart originally. Re-added it here in a
 *   cleaner horizontal-bar layout (data was already computed server-side
 *   but unused), plus a new Conversion Rate radial gauge.
 * - "Today's To-Do" driven by the assessment `reviewed` flag.
 * - Ambient background glow + gradient header icon + sliding pill range
 *   selector.
 * - Hover elevates cards/rows using transform + shadow instead of flat
 *   backgrounds.
 * - Donut/ring/gauge tooltips show label + value + percentage.
 * - FIX: "Recent Activity" used a fixed h-[380px] scroll area while its
 *   sibling "Today's To-Do" (via ChartCard) uses flex-1 min-h-0, so the
 *   two panels didn't match heights and Recent Activity could get
 *   visually cropped/mismatched depending on To-Do's content height.
 *   Recent Activity now uses the same flex-1 min-h-0 pattern so it always
 *   fills — and scrolls within — whatever height the grid row settles on.
 */

import { useEffect, useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import {
    AreaChart, Area,
    XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    PieChart, Pie, Cell,
    BarChart, Bar, LabelList,
    RadialBarChart, RadialBar, PolarAngleAxis,
} from 'recharts';
import {
    IndianRupee, TrendingUp, Users, ClipboardList, Tag, Heart,
    RefreshCw, AlertCircle, ArrowUpRight, Calendar, Sparkles, Loader2,
    Percent, BellRing, ListChecks, ClipboardCheck, Salad,
    ShieldAlert, Globe,
} from 'lucide-react';
import { fetchDashboard, fetchAssessments, fetchFollowUps } from './adminApi';
import { fmtCurrency, fmtCompactCurrency, fmtRelativeTime } from './adminUtils';
import { Link } from 'react-router-dom';

const RANGE_OPTIONS = [
    { label: '7D', value: 7 },
    { label: '30D', value: 30 },
    { label: '90D', value: 90 },
    { label: '1Y', value: 365 },
];

// Categorical palette for the bar/ring charts below — validated against this
// panel's actual dark surface (#0a0a0a) with the dataviz skill's
// validate_palette.js: the previous set (Tailwind-400 blue/emerald/amber/
// violet/pink) all sat well above the dark-mode lightness band (OKLCH L
// 0.71–0.84 vs. the ≈0.48–0.67 target), which is why they read washed-out
// against a near-black background. This set keeps the brand pink as the
// anchor (slot 1) and steps the rest into the dark band; worst adjacent CVD
// ΔE 8.4 / normal-vision ΔE 19.8 — both clear the validator's target. Order
// is the CVD-safety mechanism — don't reshuffle without re-validating.
const PIE_COLORS = ['#e71763', '#3987e5', '#199e70', '#c98500', '#9085e9', '#d95926'];

const STATUS_COLORS = {
    new: '#3987e5',
    reviewed: '#c98500',
    plan_sent: '#9085e9',
    completed: '#199e70',
    archived: 'rgba(255,255,255,0.3)',
};

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

function formatStatusLabel(value) {
    if (!value) return '—';
    return String(value)
        .replace(/_/g, ' ')
        .replace(/\b\w/g, (c) => c.toUpperCase());
}

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

function DonutTooltip({ active, payload, total = 0, formatter, valueLabel = 'Count', secondaryKey, secondaryFormatter, secondaryLabel }) {
    if (!active || !payload?.length) return null;

    const item = payload[0];
    const name = item.name || item.payload?.name || 'Item';
    const value = item.value ?? item.payload?.value ?? 0;
    const pct = total ? Math.round((Number(value) / Number(total)) * 100) : 0;
    const displayValue = formatter ? formatter(value) : value;
    const secondaryValue = secondaryKey ? item.payload?.[secondaryKey] : undefined;

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

            {secondaryValue != null && (
                <p className="text-[11px] font-bold mt-1" style={{ color: '#34d399' }}>
                    {secondaryFormatter ? secondaryFormatter(secondaryValue) : secondaryValue} {secondaryLabel}
                </p>
            )}
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
            className="rounded-2xl p-5 relative overflow-hidden will-change-transform flex flex-col"
            style={{ ...cardBaseStyle, minHeight: 150 }}
        >
            <div
                className="absolute top-0 left-0 right-0 h-0.5 rounded-t-2xl"
                style={{ background: `linear-gradient(90deg, ${accent}90, ${accent}20)` }}
            />

            <div className="flex items-start justify-between mb-3">
                <div
                    className="w-9 h-9 rounded-xl flex items-center justify-center"
                    style={{ background: `linear-gradient(135deg, ${accent}30, ${accent}08)`, border: `1px solid ${accent}30` }}
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
// ── KPI Section — groups related KPI cards under a small labeled header so
// 11 cards read as 3 digestible questions ("how's the business doing?",
// "what needs me right now?", "what are clients choosing?") instead of one
// flat wall of numbers.
function KpiSection({ title, icon: Icon, accent = '#e71763', children }) {
    return (
        <div className="mb-6">
            <div className="flex items-center gap-2 mb-3">
                <Icon className="w-3.5 h-3.5" style={{ color: accent }} />
                <span className="text-xs font-black uppercase tracking-widest" style={{ color: accent }}>
                    {title}
                </span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                {children}
            </div>
        </div>
    );
}

// ── Chart Card ────────────────────────────────────────────────────────────────
function ChartCard({ title, icon: Icon, children, className = '', bodyClassName = 'p-4', badge }) {
    return (
        <motion.div
            whileHover={{
                y: -3,
                boxShadow: '0 18px 45px rgba(0,0,0,0.28)',
                borderColor: 'rgba(231,23,99,0.22)',
            }}
            transition={{ duration: 0.22 }}
            className={`rounded-2xl overflow-hidden will-change-transform flex flex-col h-full ${className}`}
            style={cardBaseStyle}
        >
            <div
                className="flex items-center justify-between px-5 py-4 flex-shrink-0"
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

            <div className={`flex-1 min-h-0 ${bodyClassName}`}>{children}</div>
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

// ── Horizontal Bar Value Label (for the Assessment Pipeline chart) ───────────
function HBarValueLabel({ x, y, width, height, value }) {
    if (value == null) return null;
    return (
        <text
            x={x + width + 8}
            y={y + height / 2}
            fill="rgba(255,255,255,0.7)"
            textAnchor="start"
            dominantBaseline="middle"
            fontSize={11}
            fontWeight={800}
        >
            {value}
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

// ── Today's To-Do Item ────────────────────────────────────────────────────────
function TodoItem({ icon: Icon, color, title, subtitle, to }) {
    return (
        <Link
            to={to}
            className="flex items-center gap-3 px-4 py-3 rounded-xl transition-all"
            style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}
            onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = `${color}35`;
                e.currentTarget.style.background = `${color}0c`;
            }}
            onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = 'rgba(255,255,255,0.06)';
                e.currentTarget.style.background = 'rgba(255,255,255,0.02)';
            }}
        >
            <div
                className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                style={{ background: `${color}18` }}
            >
                <Icon className="w-4 h-4" style={{ color }} />
            </div>
            <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-white truncate">{title}</p>
                <p className="text-[11px] text-white/35 truncate">{subtitle}</p>
            </div>
        </Link>
    );
}

// ── Today's To-Do List ─────────────────────────────────────────────────────────
// Surfaces the two most actionable admin tasks: assessments NOT YET
// REVIEWED (using the standalone `reviewed` flag, independent of the
// status pipeline) and enrollments whose 7-day follow-up is due.
//
// FIX: previously used items.length (capped at pageSize) as the badge count,
// which silently under-reported when there were more pending records than
// fit in one page. Now uses the `total` field the API already returns.
function TodoList({ refreshKey }) {
    const SHOW_LIMIT = 5; // how many rows to actually list per section

    const [newAssessments, setNewAssessments] = useState([]);
    const [assessmentsTotal, setAssessmentsTotal] = useState(0);
    const [dueFollowUps, setDueFollowUps] = useState([]);
    const [followUpsTotal, setFollowUpsTotal] = useState(0);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);

    const load = useCallback(() => {
        setLoading(true);
        setError(false);
        Promise.all([
            fetchAssessments({ reviewed: 'false', pageSize: SHOW_LIMIT, sortField: 'created_at', sortDir: 'desc' }).catch(() => ({ rows: [], total: 0 })),
            fetchFollowUps({ due: 'true', pageSize: SHOW_LIMIT }).catch(() => ({ rows: [], total: 0 })),
        ])
            .then(([a, f]) => {
                setNewAssessments(a.rows || []);
                setAssessmentsTotal(a.total ?? (a.rows || []).length);
                setDueFollowUps(f.rows || []);
                setFollowUpsTotal(f.total ?? (f.rows || []).length);
            })
            .catch(() => setError(true))
            .finally(() => setLoading(false));
    }, []);

    useEffect(() => { load(); }, [load, refreshKey]);

    const totalPending = assessmentsTotal + followUpsTotal;
    const shownCount = newAssessments.length + dueFollowUps.length;
    const hiddenCount = Math.max(0, totalPending - shownCount);

    return (
        <ChartCard
            title="Today's To-Do"
            icon={ListChecks}
            badge={!loading ? (totalPending ? `${totalPending} pending` : 'All clear') : undefined}
            bodyClassName="p-4 overflow-y-auto dashboard-thin-scroll"
            className=""
        >
            {loading ? (
                <div className="flex justify-center py-8">
                    <Loader2 className="w-5 h-5 animate-spin text-white/25" />
                </div>
            ) : error ? (
                <div className="flex items-center gap-2 px-3 py-3 rounded-xl text-xs"
                    style={{ background: 'rgba(239,68,68,0.06)', color: '#f87171' }}>
                    <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
                    Couldn't load to-dos. Try refreshing.
                </div>
            ) : totalPending === 0 ? (
                <div className="text-center py-8">
                    <Sparkles className="w-5 h-5 mx-auto mb-2 text-white/15" />
                    <p className="text-xs text-white/25">Nothing needs your attention right now.</p>
                </div>
            ) : (
                <div className="space-y-4">
                    {/* ── Follow-ups section ── */}
                    {followUpsTotal > 0 && (
                        <div>
                            <div className="flex items-center justify-between px-1 mb-2">
                                <div className="flex items-center gap-1.5">
                                    <BellRing className="w-3 h-3" style={{ color: '#f87171' }} />
                                    <span className="text-[10px] font-black uppercase tracking-widest" style={{ color: '#f87171' }}>
                                        Follow-Ups Due
                                    </span>
                                </div>
                                <span
                                    className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                                    style={{ background: 'rgba(239,68,68,0.1)', color: '#f87171' }}
                                >
                                    {followUpsTotal}
                                </span>
                            </div>
                            <div className="space-y-2">
                                {dueFollowUps.map((f) => (
                                    <TodoItem
                                        key={`f-${f.id}`}
                                        icon={BellRing}
                                        color="#f87171"
                                        title={`Follow up with ${f.customer_name}`}
                                        subtitle={f.program_name || 'Follow-up due'}
                                        to="/admin/follow-ups"
                                    />
                                ))}
                            </div>
                            {followUpsTotal > dueFollowUps.length && (
                                <Link
                                    to="/admin/follow-ups"
                                    className="block text-center text-[11px] font-bold mt-2 py-1.5 rounded-lg transition-colors"
                                    style={{ color: '#f87171' }}
                                >
                                    View all {followUpsTotal} follow-ups due →
                                </Link>
                            )}
                        </div>
                    )}

                    {/* ── Assessments section ── */}
                    {assessmentsTotal > 0 && (
                        <div>
                            <div className="flex items-center justify-between px-1 mb-2">
                                <div className="flex items-center gap-1.5">
                                    <ClipboardList className="w-3 h-3" style={{ color: '#60a5fa' }} />
                                    <span className="text-[10px] font-black uppercase tracking-widest" style={{ color: '#60a5fa' }}>
                                        Unreviewed Assessments
                                    </span>
                                </div>
                                <span
                                    className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                                    style={{ background: 'rgba(96,165,250,0.1)', color: '#60a5fa' }}
                                >
                                    {assessmentsTotal}
                                </span>
                            </div>
                            <div className="space-y-2">
                                {newAssessments.map((a) => (
                                    <TodoItem
                                        key={`a-${a.id}`}
                                        icon={ClipboardList}
                                        color="#60a5fa"
                                        title={`Review assessment — ${`${a.first_name || ''} ${a.last_name || ''}`.trim()}`}
                                        subtitle={a.plan || 'Not yet reviewed'}
                                        to={`/admin/assessments?focus=${a.id}`}
                                    />
                                ))}
                            </div>
                            {assessmentsTotal > newAssessments.length && (
                                <Link
                                    to="/admin/assessments"
                                    className="block text-center text-[11px] font-bold mt-2 py-1.5 rounded-lg transition-colors"
                                    style={{ color: '#60a5fa' }}
                                >
                                    View all {assessmentsTotal} unreviewed assessments →
                                </Link>
                            )}
                        </div>
                    )}

                    {hiddenCount > 0 && (
                        <p className="text-[10px] text-white/20 text-center pt-1">
                            Showing {shownCount} of {totalPending} pending items
                        </p>
                    )}
                </div>
            )}
        </ChartCard>
    );
}

// ── Main ──────────────────────────────────────────────────────────────────────
export default function AdminDashboard() {
    const [range, setRange] = useState(90);
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [refreshTick, setRefreshTick] = useState(0);

    const load = useCallback(async (r) => {
        setLoading(true);
        setError('');

        try {
            const d = await fetchDashboard(r);
            setData(d);
            setRefreshTick((t) => t + 1);
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
    const sourceTotal = c.enrollmentSourceSplit?.reduce((sum, item) => sum + Number(item.value || 0), 0) || 0;

    const assessmentStatusData = (c.assessmentStatusSplit || []).map((item) => ({
        ...item,
        label: formatStatusLabel(item.name),
        fill: STATUS_COLORS[item.name] || '#e71763',
    }));

    // Clamped defensively on top of the backend's own cap — a gauge with a
    // fixed 0–100 domain (below) fed a value over 100 just clips silently,
    // which reads as "stuck full" rather than showing what's wrong.
    const conversionValue = Math.min(100, Math.max(0, k.conversionRate ?? 0));
    const conversionGaugeData = [{ name: 'Conversion', value: conversionValue, fill: '#9085e9' }];

    return (
        <div className="relative">
            {/* Ambient background glow — purely decorative */}
            <div className="fixed inset-0 pointer-events-none overflow-hidden -z-10">
                <div className="absolute -top-32 -right-24 w-[520px] h-[520px] rounded-full blur-[140px]"
                    style={{ background: 'rgba(231,23,99,0.07)' }} />
                <div className="absolute top-1/2 -left-32 w-[420px] h-[420px] rounded-full blur-[130px]"
                    style={{ background: 'rgba(96,165,250,0.05)' }} />
            </div>

            {/* Local scrollbar style */}
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
                    <div className="flex items-center gap-2.5 mb-1">
                        <div
                            className="w-8 h-8 rounded-xl flex items-center justify-center"
                            style={{
                                background: 'linear-gradient(135deg, rgba(231,23,99,0.3), rgba(231,23,99,0.05))',
                                border: '1px solid rgba(231,23,99,0.3)',
                            }}
                        >
                            <Sparkles className="w-4 h-4" style={{ color: '#e71763' }} />
                        </div>
                        <h1 className="text-2xl font-black text-white">Dashboard</h1>
                    </div>
                    <p className="text-xs text-white/35 ml-[42px]">
                        Overview of the last {range === 365 ? '12 months' : `${range} days`}
                    </p>
                </div>

                <div className="flex items-center gap-2">
                    <div
                        className="relative flex items-center rounded-xl p-1"
                        style={{ border: '1px solid rgba(255,255,255,0.08)', background: 'rgba(255,255,255,0.02)' }}
                    >
                        {RANGE_OPTIONS.map((opt) => (
                            <button
                                key={opt.value}
                                onClick={() => setRange(opt.value)}
                                className="relative px-3 py-1.5 rounded-lg text-xs font-bold overflow-hidden"
                            >
                                {range === opt.value && (
                                    <motion.div
                                        layoutId="rangePill"
                                        className="absolute inset-0"
                                        style={{ background: '#e71763', borderRadius: 8, boxShadow: '0 0 16px rgba(231,23,99,0.4)' }}
                                        transition={{ type: 'spring', stiffness: 400, damping: 32 }}
                                    />
                                )}
                                <span className="relative z-10" style={{ color: range === opt.value ? 'white' : 'rgba(255,255,255,0.4)' }}>
                                    {opt.label}
                                </span>
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
                    {/* ── KPIs — grouped into 3 questions instead of one flat wall of
                        11 cards: how's the business doing, what needs me right now,
                        and what are clients actually choosing. ── */}
                    <KpiSection title="Business Performance" icon={TrendingUp} accent="#e71763">
                        <KpiCard
                            icon={IndianRupee} label="Revenue" accent="#e71763"
                            value={fmtCompactCurrency(k.totalRevenue)}
                            sub={`avg. ${fmtCompactCurrency(k.avgOrderValue)} / order`}
                            delay={0}
                        />
                        <KpiCard
                            icon={Users} label="Paid Enrollments" accent="#34d399"
                            value={k.enrollmentsInRange ?? 0}
                            sub={`${k.totalEnrollmentsAllTime ?? 0} all-time`}
                            delay={0.03}
                        />
                        <KpiCard
                            icon={Percent} label="Conversion Rate" accent="#9085e9"
                            value={k.conversionRate != null ? `${k.conversionRate}%` : '—'}
                            sub="paid enrollments vs. assessments"
                            delay={0.06}
                        />
                        <KpiCard
                            icon={Tag} label="Savings Given" accent="#fbbf24"
                            value={fmtCompactCurrency(k.totalSavings)}
                            sub={`${k.couponUsageCount ?? 0} coupon uses`}
                            delay={0.09}
                        />
                    </KpiSection>

                    <KpiSection title="Needs Your Attention" icon={ShieldAlert} accent="#f87171">
                        <KpiCard
                            icon={ClipboardCheck} label="Pending Review"
                            accent={k.pendingReviewCount > 0 ? '#fbbf24' : '#34d399'}
                            value={k.pendingReviewCount ?? 0}
                            sub={k.pendingReviewCount > 0 ? 'assessments awaiting review' : 'all reviewed'}
                            delay={0.12}
                        />
                        <Link to="/admin/follow-ups" className="block">
                            <KpiCard
                                icon={BellRing} label="Follow-Ups Due"
                                accent={k.followUpsDue > 0 ? '#f87171' : '#34d399'}
                                value={k.followUpsDue ?? 0}
                                sub={k.followUpsDue > 0 ? 'clients waiting — tap to review' : 'all caught up'}
                                delay={0.15}
                            />
                        </Link>
                        <Link to="/admin/balance-due" className="block">
                            <KpiCard
                                icon={IndianRupee} label="Outstanding Balance"
                                accent={k.totalOutstandingBalance > 0 ? '#fbbf24' : '#34d399'}
                                value={fmtCompactCurrency(k.totalOutstandingBalance)}
                                sub={`${k.clientsWithBalance ?? 0} clients — tap to collect`}
                                delay={0.18}
                            />
                        </Link>
                    </KpiSection>

                    <KpiSection title="Client Insights" icon={Users} accent="#60a5fa">
                        <KpiCard
                            icon={ClipboardList} label="New Assessments" accent="#60a5fa"
                            value={k.assessmentsInRange ?? 0}
                            sub={`${k.totalAssessmentsAllTime ?? 0} all-time`}
                            delay={0.21}
                        />
                        <KpiCard
                            icon={Heart} label="Couple Plans" accent="#f472b6"
                            value={k.coupleCount ?? 0}
                            sub="in selected range"
                            delay={0.24}
                        />
                        <KpiCard
                            icon={Sparkles} label="Avg. Commitment" accent="#fb923c"
                            value={k.avgCommitment ? `${k.avgCommitment.toFixed(1)}/10` : '—'}
                            sub="from assessments"
                            delay={0.27}
                        />
                        <Link to="/admin/diet-plans" className="block">
                            <KpiCard
                                icon={Salad} label="Diet Plans Created" accent="#2dd4bf"
                                value={k.dietPlansInRange ?? 0}
                                sub={`${k.totalDietPlansAllTime ?? 0} all-time · ${k.dietPlansLinkedInRange ?? 0} for enrolled clients`}
                                delay={0.3}
                            />
                        </Link>
                    </KpiSection>

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
                    <div className="grid lg:grid-cols-3 gap-5 mb-5">
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

                        <ChartCard title="Enrollment Source" icon={Globe} badge="website vs manual">
                            {!c.enrollmentSourceSplit?.some((s) => s.value > 0) ? (
                                <EmptyState />
                            ) : (
                                <ResponsiveContainer width="100%" height={275}>
                                    <PieChart>
                                        <Pie
                                            data={c.enrollmentSourceSplit}
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
                                            {c.enrollmentSourceSplit.map((_, i) => (
                                                <Cell
                                                    key={i}
                                                    fill={[PIE_COLORS[0], PIE_COLORS[1]][i % 2]}
                                                    stroke="rgba(12,12,22,0.95)"
                                                    strokeWidth={3}
                                                />
                                            ))}
                                        </Pie>

                                        <Tooltip
                                            cursor={false}
                                            content={
                                                <DonutTooltip
                                                    total={sourceTotal}
                                                    valueLabel="enrollments"
                                                    secondaryKey="revenue"
                                                    secondaryFormatter={(v) => fmtCompactCurrency(v)}
                                                    secondaryLabel="revenue"
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
                                                <stop offset="0%" stopColor="#3987e5" stopOpacity={0.95} />
                                                <stop offset="100%" stopColor="#3987e5" stopOpacity={0.35} />
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

                    {/* ── NEW: Assessment Pipeline + Conversion Gauge ── */}
                    <div className="grid lg:grid-cols-2 gap-5 mb-5">
                        <ChartCard
                            title="Assessment Pipeline"
                            icon={ClipboardList}
                            badge={`${k.assessmentsInRange ?? 0} total`}
                        >
                            {!assessmentStatusData.length ? (
                                <EmptyState label="No assessments in this range yet" />
                            ) : (
                                <ResponsiveContainer width="100%" height={260}>
                                    <BarChart
                                        data={assessmentStatusData}
                                        layout="vertical"
                                        margin={{ top: 4, right: 36, left: 8, bottom: 4 }}
                                        barCategoryGap="30%"
                                    >
                                        <CartesianGrid
                                            strokeDasharray="3 3"
                                            stroke="rgba(255,255,255,0.045)"
                                            horizontal={false}
                                        />

                                        <XAxis
                                            type="number"
                                            tick={{ fill: 'rgba(255,255,255,0.28)', fontSize: 11 }}
                                            axisLine={false}
                                            tickLine={false}
                                            allowDecimals={false}
                                        />

                                        <YAxis
                                            type="category"
                                            dataKey="label"
                                            tick={{ fill: 'rgba(255,255,255,0.55)', fontSize: 11, fontWeight: 700 }}
                                            axisLine={false}
                                            tickLine={false}
                                            width={90}
                                        />

                                        <Tooltip
                                            cursor={{ fill: 'rgba(255,255,255,0.03)' }}
                                            content={<CustomTooltip valueLabel="Assessments" />}
                                        />

                                        <Bar
                                            dataKey="value"
                                            name="Assessments"
                                            radius={[0, 8, 8, 0]}
                                            maxBarSize={22}
                                        >
                                            {assessmentStatusData.map((entry, i) => (
                                                <Cell key={i} fill={entry.fill} />
                                            ))}
                                            <LabelList
                                                dataKey="value"
                                                content={(props) => <HBarValueLabel {...props} />}
                                            />
                                        </Bar>
                                    </BarChart>
                                </ResponsiveContainer>
                            )}
                        </ChartCard>

                        <ChartCard title="Conversion Rate" icon={Percent} badge="paid vs. assessments">
                            <div className="relative flex items-center justify-center" style={{ height: 260 }}>
                                <ResponsiveContainer width="100%" height={260}>
                                    <RadialBarChart
                                        innerRadius="72%"
                                        outerRadius="100%"
                                        data={conversionGaugeData}
                                        startAngle={90}
                                        endAngle={-270}
                                    >
                                        <PolarAngleAxis type="number" domain={[0, 100]} tick={false} />
                                        <RadialBar
                                            dataKey="value"
                                            cornerRadius={12}
                                            background={{ fill: 'rgba(255,255,255,0.05)' }}
                                        />
                                    </RadialBarChart>
                                </ResponsiveContainer>

                                {/* Explicit z-index — this overlay sits on top of the SVG by DOM
                                    order alone with no stacking context of its own, which is
                                    fragile (any ancestor picking up a stacking context, e.g. from
                                    a framer-motion transform, can silently reorder it behind the
                                    chart). Pinning it removes that ambiguity outright. */}
                                <div
                                    className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none"
                                    style={{ zIndex: 10 }}
                                >
                                    <p
                                        className="text-3xl font-black text-white"
                                        style={{ textShadow: '0 1px 12px rgba(0,0,0,0.5)' }}
                                    >
                                        {k.conversionRate != null ? `${k.conversionRate}%` : '—'}
                                    </p>
                                    <p className="text-[10px] text-white/30 mt-1.5 text-center px-10 leading-relaxed">
                                        paid enrollments vs. assessments started
                                    </p>
                                </div>
                            </div>
                        </ChartCard>
                    </div>

                    {/* ── Today's To-Do + Recent Activity ── */}
                    <div className="grid lg:grid-cols-3 gap-5">
                        <TodoList refreshKey={refreshTick} />

                        <motion.div
                            whileHover={{
                                y: -3,
                                boxShadow: '0 18px 45px rgba(0,0,0,0.28)',
                                borderColor: 'rgba(231,23,99,0.22)',
                            }}
                            transition={{ duration: 0.22 }}
                            className="lg:col-span-2 rounded-2xl overflow-hidden will-change-transform flex flex-col h-full"
                            style={cardBaseStyle}
                        >
                            <div
                                className="flex items-center justify-between px-5 py-4 flex-shrink-0"
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

                            {/*
                                FIX: was `h-[380px]` (fixed) — didn't match the
                                sibling ChartCard's `flex-1 min-h-0` behavior, so
                                the two panels in this grid row could mismatch in
                                height and this one would get visually cropped.
                                Now it fills whatever height the row settles on
                                and scrolls internally, exactly like ChartCard.
                            */}
                            <div className="flex-1 min-h-0 overflow-y-auto dashboard-thin-scroll py-1 pr-1">
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
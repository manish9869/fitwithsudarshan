/**
 * src/pages/admin/AdminAnalytics.jsx
 *
 * Historical GA4 metrics — separate from the Dashboard's Live Visitors
 * badge (that's real-time; this is trend/breakdown reporting over a date
 * range). Renders a "connect GA4" empty state if the backend hasn't been
 * configured yet (see FitWithSudarshan-Backend/docs/ga4-live-users-setup.md
 * — the same service account setup powers both this page and that badge).
 */
import { useEffect, useState } from 'react';
import {
    AreaChart, Area, PieChart, Pie, Cell,
    XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts';
import {
    Activity, Users, MousePointerClick, Eye, Clock, ArrowUpRight,
    Loader2, AlertCircle, RefreshCw, BarChart3, Globe2, Smartphone, FileText, Link2,
} from 'lucide-react';
import { fetchAnalyticsOverview } from './adminApi';

// Same validated palette as AdminDashboard.jsx (dataviz skill's
// validate_palette.js against this panel's #0a0a0a surface) — keep the
// order in sync if either file's palette changes, it's the CVD-safety
// mechanism for both.
const PIE_COLORS = ['#e71763', '#3987e5', '#199e70', '#c98500', '#9085e9', '#d95926'];

const cardBaseStyle = { background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.07)' };
const tooltipWrapperStyle = {
    background: 'rgba(12,12,22,0.98)', border: '1px solid rgba(231,23,99,0.28)', borderRadius: 14,
    color: '#fff', boxShadow: '0 18px 50px rgba(0,0,0,0.65)', padding: '10px 12px',
};

function KpiCard({ icon: Icon, label, value, accent = '#e71763' }) {
    return (
        <div className="rounded-2xl p-4" style={cardBaseStyle}>
            <div className="flex items-center gap-1.5 mb-2">
                <Icon className="w-3.5 h-3.5" style={{ color: accent }} />
                <p className="text-[10px] font-black uppercase tracking-widest text-white/35">{label}</p>
            </div>
            <p className="text-xl font-black text-white">{value}</p>
        </div>
    );
}

function ChartCard({ title, icon: Icon, children, bodyClassName = 'p-4', badge }) {
    return (
        <div className="rounded-2xl overflow-hidden flex flex-col h-full" style={cardBaseStyle}>
            <div className="flex items-center justify-between px-5 py-4 flex-shrink-0" style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                <div className="flex items-center gap-2">
                    <Icon className="w-3.5 h-3.5 flex-shrink-0" style={{ color: '#e71763' }} />
                    <span className="text-xs font-black uppercase tracking-widest text-white/60">{title}</span>
                </div>
                {badge && <span className="text-[10px] font-bold px-2 py-1 rounded-full" style={{ background: 'rgba(231,23,99,0.1)', color: '#e71763' }}>{badge}</span>}
            </div>
            <div className={`flex-1 ${bodyClassName}`}>{children}</div>
        </div>
    );
}

function EmptyState({ label = 'No data in this range yet' }) {
    return (
        <div className="flex flex-col items-center justify-center py-14 text-center">
            <BarChart3 className="w-6 h-6 text-white/12 mb-2" />
            <p className="text-xs text-white/20">{label}</p>
        </div>
    );
}

function SeriesTooltip({ active, payload, label }) {
    if (!active || !payload?.length) return null;
    return (
        <div style={tooltipWrapperStyle}>
            <p className="text-[11px] text-white/35 mb-1.5">
                {new Date(label).toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' })}
            </p>
            {payload.map((p) => (
                <div key={p.dataKey} className="flex items-center gap-2 justify-between">
                    <div className="flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full" style={{ background: p.color }} />
                        <span className="text-xs text-white/60">{p.name}</span>
                    </div>
                    <span className="text-xs font-bold text-white ml-4">{p.value.toLocaleString('en-IN')}</span>
                </div>
            ))}
        </div>
    );
}

function DonutTooltip({ active, payload, total = 0 }) {
    if (!active || !payload?.length) return null;
    const item = payload[0];
    const pct = total ? Math.round((Number(item.value) / total) * 100) : 0;
    return (
        <div style={tooltipWrapperStyle}>
            <div className="flex items-center gap-2 mb-1">
                <span className="w-2 h-2 rounded-full" style={{ background: item.payload?.fill }} />
                <p className="text-xs font-bold text-white">{item.name}</p>
            </div>
            <p className="text-base font-black" style={{ color: item.payload?.fill }}>{item.value.toLocaleString('en-IN')}</p>
            <p className="text-[11px] text-white/35 mt-0.5">{pct}% of total</p>
        </div>
    );
}

function RankedList({ items, labelKey, valueKey, formatValue = (v) => v.toLocaleString('en-IN') }) {
    const max = Math.max(1, ...items.map((it) => it[valueKey]));
    return (
        <div className="space-y-2.5">
            {items.map((it, i) => (
                <div key={it[labelKey] + i}>
                    <div className="flex items-center justify-between mb-1">
                        <span className="text-xs text-white/65 truncate max-w-[70%]" title={it[labelKey]}>{it[labelKey]}</span>
                        <span className="text-xs font-bold text-white flex-shrink-0">{formatValue(it[valueKey])}</span>
                    </div>
                    <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.05)' }}>
                        <div className="h-full rounded-full" style={{ width: `${(it[valueKey] / max) * 100}%`, background: PIE_COLORS[i % PIE_COLORS.length] }} />
                    </div>
                </div>
            ))}
        </div>
    );
}

function formatDuration(totalSeconds) {
    const s = Math.round(totalSeconds);
    if (s < 60) return `${s}s`;
    const m = Math.floor(s / 60);
    const rem = s % 60;
    return rem ? `${m}m ${rem}s` : `${m}m`;
}

const RANGE_OPTIONS = [{ label: '7D', value: 7 }, { label: '30D', value: 30 }, { label: '90D', value: 90 }];

export default function AdminAnalytics() {
    const [range, setRange] = useState(30);
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const load = async (r) => {
        setLoading(true);
        setError('');
        try {
            setData(await fetchAnalyticsOverview(r));
        } catch (e) {
            setError(e.message || 'Failed to load analytics.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { load(range); }, [range]);

    const channelTotal = data?.channels?.reduce((s, c) => s + c.sessions, 0) || 0;
    const deviceTotal = data?.devices?.reduce((s, d) => s + d.users, 0) || 0;

    return (
        <div>
            <div className="flex items-center justify-between gap-4 mb-6 flex-wrap">
                <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl flex items-center justify-center"
                        style={{ background: 'linear-gradient(135deg, rgba(231,23,99,0.3), rgba(231,23,99,0.05))', border: '1px solid rgba(231,23,99,0.3)' }}>
                        <Activity className="w-4 h-4" style={{ color: '#e71763' }} />
                    </div>
                    <div>
                        <h1 className="text-xl font-black text-white">Analytics</h1>
                        <p className="text-xs text-white/35">Website traffic from Google Analytics (GA4)</p>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <div className="relative flex items-center rounded-xl p-1" style={{ border: '1px solid rgba(255,255,255,0.08)', background: 'rgba(255,255,255,0.02)' }}>
                        {RANGE_OPTIONS.map((opt) => (
                            <button key={opt.value} onClick={() => setRange(opt.value)}
                                className="relative px-3 py-1.5 rounded-lg text-xs font-bold"
                                style={range === opt.value ? { background: '#e71763', color: 'white' } : { color: 'rgba(255,255,255,0.4)' }}>
                                {opt.label}
                            </button>
                        ))}
                    </div>
                    <button onClick={() => load(range)} className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs text-white/50 hover:text-white transition-all" style={{ border: '1px solid rgba(255,255,255,0.08)' }}>
                        <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} /> Refresh
                    </button>
                </div>
            </div>

            {error && (
                <div className="flex items-center gap-2 px-4 py-3 rounded-xl mb-4 text-sm" style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', color: '#f87171' }}>
                    <AlertCircle className="w-4 h-4 flex-shrink-0" /> {error}
                </div>
            )}

            {loading ? (
                <div className="py-24 flex justify-center"><Loader2 className="w-6 h-6 animate-spin text-white/25" /></div>
            ) : !data?.configured ? (
                <div className="rounded-2xl p-8 text-center" style={cardBaseStyle}>
                    <BarChart3 className="w-8 h-8 text-white/15 mx-auto mb-3" />
                    <p className="text-sm font-bold text-white mb-1">GA4 isn't connected yet</p>
                    <p className="text-xs text-white/35 max-w-md mx-auto">
                        This page (and the Dashboard's Live Visitors badge) needs a Google Cloud service account with access to your GA4 property.
                        See <span className="font-mono text-white/50">FitWithSudarshan-Backend/docs/ga4-live-users-setup.md</span> for the setup steps.
                    </p>
                </div>
            ) : data.error ? (
                <div className="rounded-2xl p-8 text-center" style={cardBaseStyle}>
                    <AlertCircle className="w-8 h-8 text-white/15 mx-auto mb-3" />
                    <p className="text-sm font-bold text-white mb-1">Could not reach Google Analytics</p>
                    <p className="text-xs text-white/35">Check the backend logs for details, or try Refresh.</p>
                </div>
            ) : (
                <>
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-5">
                        <KpiCard icon={Users} label="Active Users" value={data.totals.activeUsers.toLocaleString('en-IN')} />
                        <KpiCard icon={ArrowUpRight} label="New Users" value={data.totals.newUsers.toLocaleString('en-IN')} accent="#199e70" />
                        <KpiCard icon={MousePointerClick} label="Sessions" value={data.totals.sessions.toLocaleString('en-IN')} accent="#3987e5" />
                        <KpiCard icon={Eye} label="Page Views" value={data.totals.pageViews.toLocaleString('en-IN')} accent="#9085e9" />
                        <KpiCard icon={Clock} label="Avg. Session" value={`${Math.floor(data.totals.avgSessionSeconds / 60)}m ${data.totals.avgSessionSeconds % 60}s`} accent="#c98500" />
                        <KpiCard icon={Activity} label="Bounce Rate" value={`${data.totals.bounceRate}%`} accent="#d95926" />
                    </div>

                    <ChartCard title="Traffic Over Time" icon={Activity} badge={`${data.series.length} days`} bodyClassName="p-2">
                        {!data.series.length ? <EmptyState /> : (
                            <ResponsiveContainer width="100%" height={280}>
                                <AreaChart data={data.series} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                                    <defs>
                                        <linearGradient id="usersGrad" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="0%" stopColor="#e71763" stopOpacity={0.45} />
                                            <stop offset="100%" stopColor="#e71763" stopOpacity={0} />
                                        </linearGradient>
                                        <linearGradient id="viewsGrad" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="0%" stopColor="#3987e5" stopOpacity={0.35} />
                                            <stop offset="100%" stopColor="#3987e5" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                                    <XAxis dataKey="date" tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 11 }}
                                        tickFormatter={(d) => new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}
                                        axisLine={false} tickLine={false} />
                                    <YAxis tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 11 }} axisLine={false} tickLine={false} width={40} />
                                    <Tooltip cursor={{ stroke: 'rgba(231,23,99,0.25)', strokeWidth: 1 }} content={<SeriesTooltip />} />
                                    <Legend wrapperStyle={{ fontSize: 11, color: 'rgba(255,255,255,0.5)' }} iconType="circle" iconSize={8} />
                                    <Area type="monotone" dataKey="pageViews" name="Page Views" stroke="#3987e5" strokeWidth={2} fill="url(#viewsGrad)" dot={false} />
                                    <Area type="monotone" dataKey="users" name="Users" stroke="#e71763" strokeWidth={2.7} fill="url(#usersGrad)" dot={false} activeDot={{ r: 5, fill: '#e71763', stroke: '#fff', strokeWidth: 1.5 }} />
                                </AreaChart>
                            </ResponsiveContainer>
                        )}
                    </ChartCard>

                    <div className="grid lg:grid-cols-2 gap-5 mt-5">
                        <ChartCard title="Top Pages" icon={FileText} badge={`${data.topPages.length}`}>
                            {!data.topPages.length ? <EmptyState /> : <RankedList items={data.topPages} labelKey="path" valueKey="views" />}
                        </ChartCard>

                        <ChartCard title="Traffic Sources" icon={Link2} bodyClassName="p-4 flex items-center justify-center">
                            {!data.channels.length ? <EmptyState /> : (
                                <ResponsiveContainer width="100%" height={240}>
                                    <PieChart>
                                        <Pie data={data.channels} dataKey="sessions" nameKey="channel" cx="50%" cy="50%" innerRadius={55} outerRadius={85} paddingAngle={2}>
                                            {data.channels.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                                        </Pie>
                                        <Tooltip content={<DonutTooltip total={channelTotal} />} />
                                        <Legend wrapperStyle={{ fontSize: 11, color: 'rgba(255,255,255,0.5)' }} iconType="circle" iconSize={8} />
                                    </PieChart>
                                </ResponsiveContainer>
                            )}
                        </ChartCard>
                    </div>

                    <div className="grid gap-5 mt-5">
                        <ChartCard title="Time Spent per Page" icon={Clock} badge={`${data.timeOnPage.length}`}>
                            {!data.timeOnPage.length ? <EmptyState /> : (
                                <RankedList items={data.timeOnPage} labelKey="path" valueKey="avgEngagementSeconds" formatValue={formatDuration} />
                            )}
                        </ChartCard>
                    </div>

                    <div className="grid gap-5 mt-5">
                        <ChartCard title="Time Spent per Landing Section" icon={Clock} badge={data.sectionEngagement.configured ? `${data.sectionEngagement.sections.length}` : undefined}>
                            {!data.sectionEngagement.configured ? (
                                <div className="flex flex-col items-center justify-center py-10 text-center px-6">
                                    <Clock className="w-6 h-6 text-white/12 mb-3" />
                                    <p className="text-xs text-white/40 mb-1.5">Not set up yet in GA4</p>
                                    <p className="text-[11px] text-white/25 max-w-md leading-relaxed">
                                        Tracking code is already live on the landing page. In GA4 → Admin → Custom
                                        definitions, register two event-scoped custom definitions from the
                                        <code className="mx-1 px-1 rounded" style={{ background: 'rgba(255,255,255,0.06)' }}>section_engagement</code>
                                        event: dimension <code className="mx-1 px-1 rounded" style={{ background: 'rgba(255,255,255,0.06)' }}>section_name</code>
                                        and metric <code className="mx-1 px-1 rounded" style={{ background: 'rgba(255,255,255,0.06)' }}>engaged_seconds</code>.
                                        Data appears here once GA4 finishes processing (usually within a day).
                                    </p>
                                </div>
                            ) : !data.sectionEngagement.sections.length ? (
                                <EmptyState label="No section engagement recorded in this range yet" />
                            ) : (
                                <RankedList
                                    items={data.sectionEngagement.sections.map((s) => ({ ...s, section: s.section.charAt(0).toUpperCase() + s.section.slice(1) }))}
                                    labelKey="section"
                                    valueKey="avgEngagementSeconds"
                                    formatValue={formatDuration}
                                />
                            )}
                        </ChartCard>
                    </div>

                    <div className="grid lg:grid-cols-2 gap-5 mt-5">
                        <ChartCard title="Devices" icon={Smartphone} bodyClassName="p-4 flex items-center justify-center">
                            {!data.devices.length ? <EmptyState /> : (
                                <ResponsiveContainer width="100%" height={220}>
                                    <PieChart>
                                        <Pie data={data.devices} dataKey="users" nameKey="device" cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={2}>
                                            {data.devices.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                                        </Pie>
                                        <Tooltip content={<DonutTooltip total={deviceTotal} />} />
                                        <Legend wrapperStyle={{ fontSize: 11, color: 'rgba(255,255,255,0.5)' }} iconType="circle" iconSize={8} formatter={(v) => v.charAt(0).toUpperCase() + v.slice(1)} />
                                    </PieChart>
                                </ResponsiveContainer>
                            )}
                        </ChartCard>

                        <ChartCard title="Top Countries" icon={Globe2} badge={`${data.countries.length}`}>
                            {!data.countries.length ? <EmptyState /> : <RankedList items={data.countries} labelKey="country" valueKey="users" />}
                        </ChartCard>
                    </div>
                </>
            )}
        </div>
    );
}

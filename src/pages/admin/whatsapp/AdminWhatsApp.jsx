/**
 * /admin/whatsapp — WhatsApp marketing: today's send queue, broadcasts,
 * day-wise sequences, contacts & groups.
 */
import { useCallback, useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { MessageCircle, Send, Megaphone, CalendarDays, Users, Zap, Hand, AlertTriangle, Loader2 } from 'lucide-react';
import { waApi } from '../adminApi';
import { useToast } from '../ToastProvider';
import WaQueue from './WaQueue';
import WaCampaigns from './WaCampaigns';
import WaSequences from './WaSequences';
import WaContacts from './WaContacts';
import { card, PINK, WA_GREEN } from './waShared';

const TABS = [
    { id: 'queue', label: "Today's queue", icon: Send },
    { id: 'broadcasts', label: 'Broadcasts', icon: Megaphone },
    { id: 'sequences', label: 'Day-wise', icon: CalendarDays },
    { id: 'contacts', label: 'Contacts & groups', icon: Users },
];

function Stat({ label, value, tone }) {
    return (
        <div className="rounded-2xl px-4 py-3" style={card}>
            <p className="text-[10px] font-bold uppercase tracking-wider text-white/35">{label}</p>
            <p className="text-2xl font-black tabular-nums mt-0.5" style={{ color: tone || '#fff' }}>{value ?? '—'}</p>
        </div>
    );
}

export default function AdminWhatsApp() {
    const toast = useToast();
    const [params, setParams] = useSearchParams();
    const tab = TABS.some((t) => t.id === params.get('tab')) ? params.get('tab') : 'queue';
    const setTab = (id) => setParams({ tab: id }, { replace: true });

    const [status, setStatus] = useState(null);
    const [groups, setGroups] = useState([]);
    const [tags, setTags] = useState([]);
    const [setupError, setSetupError] = useState('');
    const [booting, setBooting] = useState(true);

    const loadStatus = useCallback(() => waApi.status().then(setStatus).catch(() => {}), []);
    const loadMeta = useCallback(async () => {
        const [g, t] = await Promise.all([waApi.groups(), waApi.tags()]);
        setGroups(g.groups || []);
        setTags(t.tags || []);
    }, []);

    useEffect(() => {
        document.title = 'WhatsApp | Admin';
        (async () => {
            try {
                // Building the queue on open means scheduled broadcasts and
                // sequence days show up even before the daily cron has run.
                await waApi.buildQueue();
                await Promise.all([loadStatus(), loadMeta()]);
            } catch (e) {
                if (/wa_|relation|does not exist|schema cache/i.test(e.message)) {
                    setSetupError(e.message);
                } else {
                    toast.error(e.message);
                }
            } finally {
                setBooting(false);
            }
        })();
    }, [loadStatus, loadMeta, toast]);

    const onChanged = () => { loadStatus(); loadMeta().catch(() => {}); };

    if (booting) {
        return <div className="flex justify-center py-24"><Loader2 className="w-5 h-5 text-white/30 animate-spin" /></div>;
    }

    if (setupError) {
        return (
            <div className="max-w-2xl rounded-2xl p-6" style={{ ...card, borderColor: 'rgba(251,191,36,0.3)' }}>
                <div className="flex items-center gap-2 mb-2 text-amber-400"><AlertTriangle className="w-5 h-5" /><h1 className="font-bold">One-time setup needed</h1></div>
                <p className="text-sm text-white/60 leading-relaxed mb-3">
                    The WhatsApp tables don't exist in the database yet. Open <b className="text-white">Supabase → SQL Editor → New query</b>, paste the
                    contents of <code className="text-pink-300">FitWithSudarshan-Backend/src/scripts/whatsapp_schema.sql</code> and run it. Then reload this page.
                </p>
                <p className="text-xs text-white/30 font-mono break-all">{setupError}</p>
            </div>
        );
    }

    return (
        <div className="max-w-6xl mx-auto space-y-5">
            <header className="flex flex-wrap items-end justify-between gap-3">
                <div>
                    <div className="flex items-center gap-2.5">
                        <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: 'rgba(37,211,102,0.12)' }}>
                            <MessageCircle className="w-5 h-5" style={{ color: WA_GREEN }} />
                        </div>
                        <h1 className="text-xl font-black text-white">WhatsApp Marketing</h1>
                    </div>
                    <p className="text-sm text-white/40 mt-1">Broadcast offers, run day-wise follow-ups, and manage who gets them.</p>
                </div>
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold"
                    style={status?.apiConfigured
                        ? { background: 'rgba(37,211,102,0.1)', color: WA_GREEN, border: '1px solid rgba(37,211,102,0.25)' }
                        : { background: 'rgba(255,255,255,0.04)', color: 'rgba(255,255,255,0.6)', border: '1px solid rgba(255,255,255,0.1)' }}
                    title={status?.apiConfigured ? 'Messages can be sent automatically through the WhatsApp Cloud API.' : 'Free mode: messages open in WhatsApp pre-filled and you press send.'}>
                    {status?.apiConfigured ? <Zap className="w-3.5 h-3.5" /> : <Hand className="w-3.5 h-3.5" />}
                    {status?.apiConfigured ? 'Auto-send connected' : 'Free hand-send mode'}
                </span>
            </header>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <Stat label="To send today" value={status?.pendingToday} tone={status?.pendingToday ? PINK : undefined} />
                <Stat label="Sent today" value={status?.sentToday} tone={WA_GREEN} />
                <Stat label="Overdue" value={status?.overdue} tone={status?.overdue ? '#fbbf24' : undefined} />
                <Stat label="Contacts" value={status ? `${status.contacts - status.optedOut}` : null} />
            </div>

            <nav className="flex gap-1 overflow-x-auto pb-1" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }} role="tablist">
                {TABS.map((t) => {
                    const active = tab === t.id;
                    return (
                        <button key={t.id} role="tab" aria-selected={active} onClick={() => setTab(t.id)}
                            className={`relative flex items-center gap-2 px-4 py-2.5 text-sm font-semibold whitespace-nowrap ${active ? 'text-white' : 'text-white/40 hover:text-white/70'}`}>
                            <t.icon className="w-4 h-4" /> {t.label}
                            {t.id === 'queue' && status?.pendingToday + status?.overdue > 0 && (
                                <span className="text-[10px] font-bold px-1.5 rounded-full text-white" style={{ background: PINK }}>{status.pendingToday + status.overdue}</span>
                            )}
                            {active && <span className="absolute left-3 right-3 -bottom-px h-0.5 rounded-full" style={{ background: PINK }} />}
                        </button>
                    );
                })}
            </nav>

            {tab === 'queue' && <WaQueue status={status} onChanged={onChanged} />}
            {tab === 'broadcasts' && <WaCampaigns groups={groups} tags={tags} onChanged={onChanged} />}
            {tab === 'sequences' && <WaSequences groups={groups} onChanged={onChanged} />}
            {tab === 'contacts' && <WaContacts groups={groups} tags={tags} reloadMeta={onChanged} apiConfigured={!!status?.apiConfigured} />}
        </div>
    );
}

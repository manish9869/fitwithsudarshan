/**
 * /admin/promotions — the simple, guided way to run a promotion:
 *   1. Pick a template  2. Make it yours  3. Choose who gets it (+ optional
 *   website pop-up), with a live phone preview beside every step.
 * Power features (custom audiences, editing, history) live in
 * Admin → WhatsApp; this page creates the same broadcasts underneath.
 */
import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
    Megaphone, ArrowLeft, ArrowRight, Check, Loader2, Globe, UserSearch, UserCheck, History, Users, PenLine,
    Send, CalendarClock, MonitorSmartphone, PartyPopper, Settings2,
} from 'lucide-react';
import { waApi } from '../adminApi';
import { useToast } from '../ToastProvider';
import { useDebounce } from '../useDebounce';
import { getSiteContentKey, putSiteContentKey } from '../content/cmsApi';
import { DEFAULT_PROMO_POPUP } from '@/utils/siteContentDefaults';
import { TemplateGallery, PlaceholderFields, SaveTemplateButton, useMyTemplates } from './TemplateGallery';
import PreviewPanel from './PreviewPanel';
import { findPlaceholders } from './waTemplates';
import { MessageComposer, AudiencePicker, ContactPicker, card, inputCls, labelCls, btnGhost, btnPrimary, PINK, WA_GREEN } from './waShared';

const todayIST = () => new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' });

const STEPS = ['Pick a template', 'Make it yours', 'Send'];

const AUDIENCES = [
    { id: 'everyone', label: 'Everyone', hint: 'All contacts', icon: Globe, audience: { all: true } },
    { id: 'leads', label: 'Leads & enquiries', hint: "Haven't joined yet", icon: UserSearch, audience: { tags: ['lead', 'assessment'] } },
    { id: 'active', label: 'Active clients', hint: 'Currently on a plan', icon: UserCheck, audience: { tags: ['active'] } },
    { id: 'past', label: 'Past clients', hint: 'Plan has ended', icon: History, audience: { tags: ['expired'] } },
];

function Stepper({ step, onGo }) {
    return (
        <ol className="flex items-center gap-2 sm:gap-3">
            {STEPS.map((label, i) => {
                const n = i + 1;
                const done = step > n;
                const current = step === n;
                return (
                    <li key={label} className="flex items-center gap-2 sm:gap-3">
                        <button type="button" disabled={n > step} onClick={() => onGo(n)}
                            className="flex items-center gap-2 disabled:cursor-default" aria-current={current ? 'step' : undefined}>
                            <span className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-black"
                                style={current ? { background: PINK, color: '#fff' } : done ? { background: 'rgba(231,23,99,0.2)', color: PINK } : { background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.35)' }}>
                                {done ? <Check className="w-3.5 h-3.5" /> : n}
                            </span>
                            <span className={`hidden sm:inline text-sm font-semibold ${current ? 'text-white' : 'text-white/40'}`}>{label}</span>
                        </button>
                        {n < STEPS.length && <span className="w-6 sm:w-10 h-px bg-white/10" />}
                    </li>
                );
            })}
        </ol>
    );
}

export default function AdminPromotions() {
    const toast = useToast();
    const navigate = useNavigate();
    const my = useMyTemplates();

    const [step, setStep] = useState(1);
    const [title, setTitle] = useState('');
    const [msg, setMsg] = useState({ body: '', image_url: '', cta_label: '', cta_url: '' });

    const [groups, setGroups] = useState([]);
    const [tags, setTags] = useState([]);
    const [audienceId, setAudienceId] = useState('leads');
    const [customAudience, setCustomAudience] = useState({ groupIds: [], tags: [], contactIds: [], excludeContactIds: [] });
    const [skipIds, setSkipIds] = useState([]);
    const [count, setCount] = useState(null);
    const [scheduleDate, setScheduleDate] = useState('');

    const [popupOn, setPopupOn] = useState(false);
    const [popup, setPopup] = useState({ ...DEFAULT_PROMO_POPUP, enabled: true });

    const [busy, setBusy] = useState(false);
    const [result, setResult] = useState(null);
    const [recent, setRecent] = useState([]);
    const [setupError, setSetupError] = useState('');

    useEffect(() => {
        document.title = 'Promotions | Admin';
        Promise.all([waApi.groups(), waApi.tags(), waApi.campaigns()])
            .then(([g, t, c]) => {
                setGroups(g.groups || []);
                setTags(t.tags || []);
                setRecent((c.campaigns || []).slice(0, 4));
            })
            .catch((e) => {
                if (/wa_|relation|does not exist|schema cache/i.test(e.message)) setSetupError(e.message);
            });
        // Keep the coach's existing pop-up timing/frequency settings.
        getSiteContentKey('promo_popup').then((v) => v && setPopup((p) => ({ ...p, ...v, enabled: true }))).catch(() => {});
    }, []);

    // Resolve the chosen audience.
    const audience = useMemo(() => {
        let base;
        if (audienceId === 'custom') base = customAudience;
        else if (audienceId.startsWith('group:')) base = { groupIds: [audienceId.slice(6)] };
        else base = AUDIENCES.find((a) => a.id === audienceId)?.audience || {};
        return { ...base, excludeContactIds: [...new Set([...(base.excludeContactIds || []), ...skipIds])] };
    }, [audienceId, customAudience, skipIds]);

    const audienceKey = useDebounce(JSON.stringify(audience), 350);
    useEffect(() => {
        if (step !== 3 || audienceId === 'custom') return;
        let live = true;
        setCount(null);
        waApi.previewAudience(JSON.parse(audienceKey)).then((r) => live && setCount(r.count)).catch(() => live && setCount(0));
        return () => { live = false; };
    }, [audienceKey, step, audienceId]);

    const pickTemplate = (t) => {
        setTitle(t.title || '');
        setMsg({ body: t.body || '', image_url: t.image_url || '', cta_label: t.cta_label || '', cta_url: t.cta_url || '' });
        setPopup((p) => ({ ...p, title: t.title || p.title, eyebrow: t.when ? `${t.title} special` : p.eyebrow }));
        setStep(2);
    };

    const startBlank = () => pickTemplate({ title: 'My promotion', body: '' });

    const unfilled = findPlaceholders(msg.body, msg.cta_url);
    const canContinue = msg.body.trim() && !unfilled.length;

    // Offer details typed into the message make sensible pop-up defaults.
    const enablePopup = (on) => {
        setPopupOn(on);
        if (on) {
            const code = msg.body.match(/code:?\s*\*?([A-Z0-9]{4,20})\*?/i)?.[1];
            setPopup((p) => ({
                ...p,
                title: p.title || title,
                message: p.message && p.message !== DEFAULT_PROMO_POPUP.message ? p.message : msg.body.replace(/\{\{\s*(first_)?name\s*\}\}/gi, 'there').replace(/[*_]/g, '').split('\n').filter(Boolean).slice(0, 2).join(' '),
                couponCode: code || p.couponCode,
                image: msg.image_url || p.image,
                ctaLabel: msg.cta_label || p.ctaLabel,
                startDate: scheduleDate || '',
            }));
        }
    };

    const send = async () => {
        if (audienceId !== 'custom' && count === 0) return toast.error('Nobody matches this audience yet. Sync or add contacts first.');
        setBusy(true);
        try {
            const { campaign } = await waApi.createCampaign({
                name: `${title || 'Promotion'} · ${scheduleDate || todayIST()}`,
                ...msg,
                audience,
                scheduled_for: scheduleDate ? `${scheduleDate}T00:00:00+05:30` : null,
            });
            const launched = await waApi.launchCampaign(campaign.id);

            let popupSaved = false;
            if (popupOn) {
                await putSiteContentKey('promo_popup', { ...popup, enabled: true, startDate: scheduleDate || popup.startDate || '' });
                popupSaved = true;
            }
            setResult({ ...launched, popupSaved });
            setStep(4);
        } catch (e) {
            toast.error(e.message);
        } finally {
            setBusy(false);
        }
    };

    const reset = () => {
        setStep(1); setTitle(''); setMsg({ body: '', image_url: '', cta_label: '', cta_url: '' });
        setSkipIds([]); setScheduleDate(''); setPopupOn(false); setResult(null);
    };

    if (setupError) {
        return (
            <div className="max-w-2xl rounded-2xl p-6" style={card}>
                <h1 className="font-bold text-amber-400 mb-2">One-time setup needed</h1>
                <p className="text-sm text-white/60">Run <code className="text-pink-300">FitWithSudarshan-Backend/src/scripts/whatsapp_schema.sql</code> in Supabase → SQL Editor, then reload this page.</p>
            </div>
        );
    }

    const setP = (k) => (e) => setPopup((p) => ({ ...p, [k]: e.target.value }));

    return (
        <div className="max-w-6xl mx-auto space-y-6">
            <header className="flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'rgba(231,23,99,0.12)' }}>
                        <Megaphone className="w-5 h-5" style={{ color: PINK }} />
                    </div>
                    <div>
                        <h1 className="text-xl font-black text-white">Promotions</h1>
                        <p className="text-sm text-white/40">Send an offer on WhatsApp and show it on your website, in 3 steps.</p>
                    </div>
                </div>
                {step <= 3 && <Stepper step={step} onGo={setStep} />}
            </header>

            {/* ── Step 1: template ── */}
            {step === 1 && (
                <div className="space-y-6">
                    <section className="rounded-2xl p-5" style={card}>
                        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
                            <h2 className="text-base font-bold text-white">What are you promoting?</h2>
                            <button onClick={startBlank} className={btnGhost}><PenLine className="w-4 h-4" /> Write my own</button>
                        </div>
                        <TemplateGallery my={my} onPick={pickTemplate} />
                    </section>

                    {recent.length > 0 && (
                        <section>
                            <div className="flex items-center justify-between mb-2">
                                <h2 className="text-xs font-bold uppercase tracking-wider text-white/40">Recent promotions</h2>
                                <Link to="/admin/whatsapp?tab=broadcasts" className="text-xs text-white/40 hover:text-white">See all →</Link>
                            </div>
                            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
                                {recent.map((c) => {
                                    const s = c.stats;
                                    const total = s ? s.pending + s.sent + s.skipped + s.failed : 0;
                                    return (
                                        <div key={c.id} className="rounded-xl p-3" style={card}>
                                            <p className="text-sm font-semibold text-white truncate">{c.name}</p>
                                            <p className="text-xs text-white/40 mt-0.5">{total ? `${s.sent}/${total} sent` : c.status}</p>
                                        </div>
                                    );
                                })}
                            </div>
                        </section>
                    )}
                </div>
            )}

            {/* ── Steps 2 & 3 with preview beside ── */}
            {(step === 2 || step === 3) && (
                <div className="grid lg:grid-cols-[1fr_340px] gap-6 items-start">
                    <div className="space-y-5 min-w-0">
                        {step === 2 && (
                            <>
                                <section className="rounded-2xl p-5 space-y-4" style={card}>
                                    <div>
                                        <label className={labelCls}>Promotion name</label>
                                        <input className={inputCls} value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Diwali offer" />
                                    </div>
                                    <PlaceholderFields value={msg} onChange={setMsg} />
                                    <MessageComposer value={msg} onChange={setMsg} />
                                    <SaveTemplateButton msg={msg} onSave={my.save} />
                                </section>
                                <div className="flex items-center justify-between gap-3">
                                    <button onClick={() => setStep(1)} className={btnGhost}><ArrowLeft className="w-4 h-4" /> Templates</button>
                                    <button onClick={() => setStep(3)} disabled={!canContinue} className={btnPrimary} style={{ background: PINK }}
                                        title={unfilled.length ? `Fill in: ${unfilled.join(', ')}` : undefined}>
                                        Choose who gets it <ArrowRight className="w-4 h-4" />
                                    </button>
                                </div>
                                {unfilled.length > 0 && <p className="text-xs text-amber-300 text-right">Fill in {unfilled.join(', ')} to continue.</p>}
                            </>
                        )}

                        {step === 3 && (
                            <>
                                <section className="rounded-2xl p-5 space-y-4" style={card}>
                                    <h2 className="text-base font-bold text-white">Who should get it?</h2>
                                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
                                        {AUDIENCES.map((a) => {
                                            const on = audienceId === a.id;
                                            return (
                                                <button key={a.id} type="button" onClick={() => setAudienceId(a.id)}
                                                    className="rounded-xl p-3 text-left transition-colors active:scale-[0.98]"
                                                    style={on ? { background: 'rgba(231,23,99,0.12)', border: '1.5px solid rgba(231,23,99,0.55)' } : { background: 'rgba(255,255,255,0.02)', border: '1.5px solid rgba(255,255,255,0.07)' }}>
                                                    <a.icon className="w-4 h-4 mb-2" style={{ color: on ? PINK : 'rgba(255,255,255,0.4)' }} />
                                                    <p className="text-sm font-semibold text-white">{a.label}</p>
                                                    <p className="text-[11px] text-white/40">{a.hint}</p>
                                                </button>
                                            );
                                        })}
                                    </div>
                                    {groups.length > 0 && (
                                        <div className="flex flex-wrap gap-2">
                                            {groups.map((g) => {
                                                const on = audienceId === `group:${g.id}`;
                                                return (
                                                    <button key={g.id} type="button" onClick={() => setAudienceId(`group:${g.id}`)}
                                                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold"
                                                        style={on ? { background: 'rgba(231,23,99,0.14)', border: '1px solid rgba(231,23,99,0.45)', color: '#fff' } : { background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.09)', color: 'rgba(255,255,255,0.6)' }}>
                                                        <Users className="w-3.5 h-3.5" /> {g.name} <span className="text-white/35">{g.memberCount}</span>
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    )}
                                    <button type="button" onClick={() => setAudienceId(audienceId === 'custom' ? 'leads' : 'custom')} className="inline-flex items-center gap-1.5 text-xs font-semibold text-white/50 hover:text-white">
                                        <Settings2 className="w-3.5 h-3.5" /> {audienceId === 'custom' ? 'Back to simple choices' : 'Custom mix (groups + tags + people)'}
                                    </button>

                                    {audienceId === 'custom' ? (
                                        <AudiencePicker value={customAudience} onChange={setCustomAudience} groups={groups} tags={tags} body={msg.body} />
                                    ) : (
                                        <>
                                            <ContactPicker label="Skip anyone?" value={skipIds} onChange={setSkipIds} hint="People who stopped messages are always skipped." />
                                            <div className="rounded-xl px-4 py-3 text-sm" style={{ background: 'rgba(37,211,102,0.06)', border: '1px solid rgba(37,211,102,0.2)' }}>
                                                {count === null ? <span className="text-white/50">Counting…</span>
                                                    : count === 0 ? <span className="text-amber-300">No one matches yet. <Link to="/admin/whatsapp?tab=contacts" className="underline">Sync or add contacts</Link>.</span>
                                                        : <span className="text-white/80"><b className="text-white">{count}</b> {count === 1 ? 'person' : 'people'} will get this message</span>}
                                            </div>
                                        </>
                                    )}
                                </section>

                                <section className="rounded-2xl p-5 space-y-3" style={card}>
                                    <h2 className="text-base font-bold text-white">When?</h2>
                                    <div className="flex flex-wrap items-center gap-2">
                                        {[['', 'Today'], ['later', 'Pick a day']].map(([mode, label]) => {
                                            const on = mode ? !!scheduleDate : !scheduleDate;
                                            return (
                                                <button key={label} type="button"
                                                    onClick={() => setScheduleDate(mode ? (scheduleDate || new Date(Date.now() + 86400000).toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' })) : '')}
                                                    className="px-3.5 py-2 rounded-lg text-sm font-semibold"
                                                    style={on ? { background: 'rgba(231,23,99,0.14)', border: '1px solid rgba(231,23,99,0.45)', color: '#fff' } : { background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.09)', color: 'rgba(255,255,255,0.6)' }}>
                                                    {label}
                                                </button>
                                            );
                                        })}
                                        {scheduleDate && (
                                            <input type="date" className={inputCls + ' !w-auto'} value={scheduleDate} min={todayIST()} onChange={(e) => setScheduleDate(e.target.value)} />
                                        )}
                                    </div>
                                    {scheduleDate && <p className="text-[11px] text-white/35">It appears in Today's queue around 9:00 AM IST that day.</p>}
                                </section>

                                <section className="rounded-2xl p-5 space-y-4" style={card}>
                                    <label className="flex items-center justify-between gap-3 cursor-pointer">
                                        <span className="flex items-center gap-2.5">
                                            <MonitorSmartphone className="w-5 h-5" style={{ color: popupOn ? PINK : 'rgba(255,255,255,0.4)' }} />
                                            <span>
                                                <span className="block text-sm font-bold text-white">Also show as a pop-up on the website</span>
                                                <span className="block text-xs text-white/40">Visitors see this offer when they open fitwithsudarshan.com. Replaces any current pop-up.</span>
                                            </span>
                                        </span>
                                        <input type="checkbox" checked={popupOn} onChange={(e) => enablePopup(e.target.checked)} className="accent-primary w-5 h-5" />
                                    </label>
                                    {popupOn && (
                                        <div className="grid sm:grid-cols-2 gap-3 pt-1">
                                            <div className="sm:col-span-2"><label className={labelCls}>Pop-up title</label><input className={inputCls} value={popup.title || ''} onChange={setP('title')} /></div>
                                            <div className="sm:col-span-2"><label className={labelCls}>Short message</label><textarea rows={2} className={inputCls} value={popup.message || ''} onChange={setP('message')} /></div>
                                            <div><label className={labelCls}>Small label</label><input className={inputCls} value={popup.eyebrow || ''} onChange={setP('eyebrow')} placeholder="Diwali offer · 3 days left" /></div>
                                            <div><label className={labelCls}>Coupon code</label><input className={inputCls} value={popup.couponCode || ''} onChange={setP('couponCode')} placeholder="DIWALI20" /></div>
                                            <div><label className={labelCls}>Button text</label><input className={inputCls} value={popup.ctaLabel || ''} onChange={setP('ctaLabel')} /></div>
                                            <div><label className={labelCls}>Hide after</label><input type="date" className={inputCls} value={popup.endDate || ''} min={todayIST()} onChange={setP('endDate')} /></div>
                                            <p className="sm:col-span-2 text-[11px] text-white/35">Timing and how often it shows come from <Link to="/admin/site-settings" className="underline">Site Settings → Promo Pop-up</Link>.</p>
                                        </div>
                                    )}
                                </section>

                                <div className="flex items-center justify-between gap-3">
                                    <button onClick={() => setStep(2)} className={btnGhost}><ArrowLeft className="w-4 h-4" /> Edit message</button>
                                    <button onClick={send} disabled={busy || (audienceId !== 'custom' && !count)} className={btnPrimary + ' !px-6'} style={{ background: PINK }}>
                                        {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : scheduleDate ? <CalendarClock className="w-4 h-4" /> : <Send className="w-4 h-4" />}
                                        {scheduleDate ? 'Schedule promotion' : 'Send promotion'}
                                    </button>
                                </div>
                            </>
                        )}
                    </div>

                    <aside className="lg:sticky lg:top-20">
                        <PreviewPanel
                            key={popupOn ? 'with-popup' : 'wa-only'}
                            msg={msg}
                            popup={step === 3 && popupOn ? { ...popup, image: popup.image || msg.image_url } : null}
                            defaultTab={step === 3 && popupOn ? 'popup' : 'whatsapp'}
                        />
                    </aside>
                </div>
            )}

            {/* ── Done ── */}
            {step === 4 && result && (
                <section className="max-w-xl mx-auto rounded-2xl p-8 text-center" style={card}>
                    <div className="mx-auto mb-4 w-14 h-14 rounded-2xl flex items-center justify-center" style={{ background: 'rgba(37,211,102,0.12)' }}>
                        <PartyPopper className="w-6 h-6" style={{ color: WA_GREEN }} />
                    </div>
                    <h2 className="text-2xl font-black text-white mb-2">
                        {result.scheduled ? 'Promotion scheduled' : 'Promotion ready to send'}
                    </h2>
                    <p className="text-sm text-white/50 mb-1">
                        {result.scheduled
                            ? `It will be prepared on ${scheduleDate} and appear in Today's queue that morning.`
                            : `${result.queued} message${result.queued === 1 ? '' : 's'} added to Today's queue.`}
                    </p>
                    {result.popupSaved && <p className="text-sm text-white/50">The offer pop-up is now live on your website.</p>}
                    <div className="flex flex-wrap justify-center gap-2 mt-6">
                        {!result.scheduled && (
                            <button onClick={() => navigate('/admin/whatsapp?tab=queue')} className={btnPrimary} style={{ background: WA_GREEN, color: '#05210f' }}>
                                <Send className="w-4 h-4" /> Start sending
                            </button>
                        )}
                        <button onClick={reset} className={btnGhost}>Create another</button>
                    </div>
                </section>
            )}
        </div>
    );
}

/**
 * Phone-framed live preview: the WhatsApp message as a client sees it, and
 * (optionally) the website promo pop-up rendered with the real component.
 */
import { useState } from 'react';
import { MessageCircle, MonitorSmartphone, ChevronLeft, Video, Phone } from 'lucide-react';
import { PromoPopupCard } from '@/components/landing/PromoPopup';
import { WhatsAppPreview, PINK } from './waShared';

const SAMPLE_NAMES = ['Rahul Sharma', 'Priya Patil', 'Aditya Kulkarni'];

function PhoneFrame({ children, dark = true }) {
    return (
        <div className="mx-auto w-full max-w-[320px] rounded-[2.4rem] p-2.5" style={{ background: '#1c1c1e', boxShadow: '0 25px 60px rgba(0,0,0,0.55), inset 0 0 0 1.5px rgba(255,255,255,0.08)' }}>
            <div className="relative rounded-[1.9rem] overflow-hidden h-[560px] flex flex-col" style={{ background: dark ? '#0b141a' : '#0a0a0a' }}>
                <div className="absolute top-2 left-1/2 -translate-x-1/2 w-24 h-6 rounded-full z-20" style={{ background: '#000' }} aria-hidden="true" />
                {children}
            </div>
        </div>
    );
}

function WhatsAppScreen({ msg, name }) {
    return (
        <PhoneFrame>
            <div className="flex items-center gap-2 px-3 pt-10 pb-2.5" style={{ background: '#1f2c34' }}>
                <ChevronLeft className="w-5 h-5 text-white/70" />
                <div className="w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-black text-white" style={{ background: PINK }}>FWS</div>
                <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-white truncate">FitWithSudarshan</p>
                    <p className="text-[10px] text-white/45">to {name.split(' ')[0]}</p>
                </div>
                <Video className="w-4 h-4 text-white/60" />
                <Phone className="w-4 h-4 text-white/60 ml-2" />
            </div>
            <div className="flex-1 overflow-y-auto px-2 py-3"
                style={{ backgroundImage: 'radial-gradient(rgba(255,255,255,0.025) 1px, transparent 1px)', backgroundSize: '14px 14px' }}>
                <WhatsAppPreview bare msg={msg} name={name} />
            </div>
        </PhoneFrame>
    );
}

function PopupScreen({ popup, device }) {
    const noop = (e) => e?.preventDefault?.();
    const card = (
        <PromoPopupCard
            preview
            p={popup}
            copied={false}
            onCopy={noop}
            onClose={noop}
            onCta={noop}
            ctaHref="#"
            external={false}
        />
    );

    if (device === 'desktop') {
        return (
            <div className="rounded-xl overflow-hidden" style={{ border: '1px solid rgba(255,255,255,0.1)', boxShadow: '0 20px 50px rgba(0,0,0,0.5)' }}>
                <div className="flex items-center gap-1.5 px-3 py-2" style={{ background: '#1c1c1e' }}>
                    {['#ff5f57', '#febc2e', '#28c840'].map((c) => <span key={c} className="w-2.5 h-2.5 rounded-full" style={{ background: c }} />)}
                    <span className="ml-3 flex-1 text-[10px] text-white/40 rounded-md px-2 py-0.5 truncate" style={{ background: 'rgba(255,255,255,0.06)' }}>fitwithsudarshan.com</span>
                </div>
                <div className="relative h-[460px] overflow-hidden" style={{ background: '#0a0a0a' }}>
                    <FakeSite />
                    <div className="absolute inset-0 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.7)' }}>
                        {/* Desktop card is 448px wide; scale it into the preview box. */}
                        <div className="w-[448px] flex-shrink-0 origin-center scale-[0.72]">{card}</div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <PhoneFrame dark={false}>
            <div className="relative flex-1 overflow-hidden">
                <FakeSite />
                <div className="absolute inset-0 flex items-end p-3 pb-4 overflow-y-auto" style={{ background: 'rgba(0,0,0,0.7)' }}>
                    {card}
                </div>
            </div>
        </PhoneFrame>
    );
}

/** A blurred stand-in for the homepage behind the pop-up. */
function FakeSite() {
    return (
        <div className="absolute inset-0 p-5 pt-12 space-y-3 blur-[1.5px] opacity-60" aria-hidden="true">
            <div className="h-3 w-20 rounded" style={{ background: PINK }} />
            <div className="h-9 w-4/5 rounded bg-white/80" />
            <div className="h-9 w-3/5 rounded bg-white/80" />
            <div className="h-2.5 w-full rounded bg-white/20" />
            <div className="h-2.5 w-5/6 rounded bg-white/20" />
            <div className="h-9 w-40 rounded-full mt-4" style={{ background: PINK }} />
            <div className="grid grid-cols-2 gap-2 pt-4">
                {[0, 1, 2, 3].map((i) => <div key={i} className="h-16 rounded-xl bg-white/5 border border-white/10" />)}
            </div>
        </div>
    );
}

/**
 * Props:
 *  - msg:   WhatsApp message (body, image_url, cta_label, cta_url) — optional
 *  - popup: promo popup object (title, message, image, couponCode, ctaLabel…) — optional
 */
export default function PreviewPanel({ msg, popup, defaultTab }) {
    const tabs = [
        msg && { id: 'whatsapp', label: 'WhatsApp', icon: MessageCircle },
        popup && { id: 'popup', label: 'Website pop-up', icon: MonitorSmartphone },
    ].filter(Boolean);
    const [tab, setTab] = useState(defaultTab || tabs[0]?.id);
    const [name, setName] = useState(SAMPLE_NAMES[0]);
    const [device, setDevice] = useState('mobile');
    const active = tabs.some((t) => t.id === tab) ? tab : tabs[0]?.id;

    const pill = (on) => (on
        ? { background: 'rgba(231,23,99,0.15)', color: '#fff', border: '1px solid rgba(231,23,99,0.4)' }
        : { color: 'rgba(255,255,255,0.5)', border: '1px solid transparent' });

    return (
        <div className="space-y-3">
            <div className="flex items-center justify-between gap-2">
                <p className="text-[11px] font-bold uppercase tracking-wider text-white/40">Live preview</p>
                {tabs.length > 1 && (
                    <div className="flex gap-1 p-0.5 rounded-lg" style={{ background: 'rgba(255,255,255,0.04)' }} role="tablist">
                        {tabs.map((t) => (
                            <button key={t.id} type="button" role="tab" aria-selected={active === t.id} onClick={() => setTab(t.id)}
                                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold" style={pill(active === t.id)}>
                                <t.icon className="w-3.5 h-3.5" /> {t.label}
                            </button>
                        ))}
                    </div>
                )}
            </div>

            {active === 'whatsapp' && (
                <>
                    <WhatsAppScreen msg={msg} name={name} />
                    <div className="flex items-center justify-center gap-1.5 text-[11px] text-white/40">
                        Preview as
                        {SAMPLE_NAMES.map((n) => (
                            <button key={n} type="button" onClick={() => setName(n)} className="px-2 py-0.5 rounded-md" style={pill(name === n)}>{n.split(' ')[0]}</button>
                        ))}
                    </div>
                </>
            )}

            {active === 'popup' && (
                <>
                    {popup?.title
                        ? <PopupScreen popup={popup} device={device} />
                        : <p className="rounded-2xl px-4 py-16 text-center text-sm text-white/35" style={{ border: '1px dashed rgba(255,255,255,0.1)' }}>Add a title to see the pop-up.</p>}
                    <div className="flex items-center justify-center gap-1.5 text-[11px] text-white/40">
                        {['mobile', 'desktop'].map((d) => (
                            <button key={d} type="button" onClick={() => setDevice(d)} className="px-2 py-0.5 rounded-md capitalize" style={pill(device === d)}>{d}</button>
                        ))}
                    </div>
                </>
            )}
        </div>
    );
}

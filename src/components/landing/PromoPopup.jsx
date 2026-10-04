import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { X, Copy, Check, ArrowRight, Flame } from "lucide-react";
import { useSiteData } from "@/contexts/SiteDataContext";
import { wa } from "@/utils/whatsapp";
import { trackEvent } from "@/utils/analytics";

// Admin-managed promotional pop-up (Admin → Site Settings → Promo Pop-up).
// Shows at most once per the configured frequency, only inside its date
// window, and never on top of checkout (it's mounted on the landing page only).

const STORAGE_KEY = "fws_promo_seen";

function offerId(p) {
    // Editing the title / coupon / start date makes it a "new" offer, so
    // visitors who dismissed the previous one get to see this one.
    return `${p.title || ""}|${p.couponCode || ""}|${p.startDate || ""}`;
}

function todayLocal() {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function readSeen() {
    try {
        return JSON.parse(localStorage.getItem(STORAGE_KEY) || "null");
    } catch {
        return null;
    }
}

function markSeen(id) {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify({ id, at: Date.now() }));
        sessionStorage.setItem(STORAGE_KEY, id);
    } catch {
        /* storage blocked — worst case the visitor sees it again next visit */
    }
}

function alreadySeen(id, frequency) {
    try {
        if (frequency === "session") return sessionStorage.getItem(STORAGE_KEY) === id;
    } catch {
        return false;
    }
    const seen = readSeen();
    if (!seen || seen.id !== id) return false;
    if (frequency === "once") return true;
    return Date.now() - seen.at < 24 * 60 * 60 * 1000; // "day"
}

export default function PromoPopup() {
    const { promoPopup: p } = useSiteData();
    const navigate = useNavigate();
    const [open, setOpen] = useState(false);
    const [copied, setCopied] = useState(false);
    const closeBtnRef = useRef(null);
    const restoreFocusRef = useRef(null);

    const id = useMemo(() => (p ? offerId(p) : ""), [p]);

    const eligible = useMemo(() => {
        if (!p?.enabled || !p.title) return false;
        const today = todayLocal();
        if (p.startDate && today < p.startDate) return false;
        if (p.endDate && today > p.endDate) return false;
        if (p.showOnMobile === false && window.matchMedia("(max-width: 767px)").matches) return false;
        return !alreadySeen(id, p.frequency || "day");
    }, [p, id]);

    // Arm the trigger (delay / scroll / exit-intent).
    useEffect(() => {
        if (!eligible) return;
        let fired = false;
        const fire = () => {
            if (fired) return;
            fired = true;
            restoreFocusRef.current = document.activeElement;
            setOpen(true);
            markSeen(id);
            trackEvent("promo_popup_view", { offer: p.title });
        };

        const trigger = p.trigger || "delay";
        const cleanups = [];

        if (trigger === "delay") {
            const t = setTimeout(fire, Math.max(0, Number(p.delaySeconds) || 6) * 1000);
            cleanups.push(() => clearTimeout(t));
        } else {
            const onScroll = () => {
                const max = document.documentElement.scrollHeight - window.innerHeight;
                if (max > 0 && window.scrollY / max >= 0.5) fire();
            };
            window.addEventListener("scroll", onScroll, { passive: true });
            cleanups.push(() => window.removeEventListener("scroll", onScroll));

            const finePointer = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
            if (trigger === "exit" && finePointer) {
                const onOut = (e) => {
                    if (!e.relatedTarget && e.clientY <= 0) fire();
                };
                document.addEventListener("mouseout", onOut);
                cleanups.push(() => document.removeEventListener("mouseout", onOut));
            }
        }
        return () => cleanups.forEach((fn) => fn());
    }, [eligible, id, p]);

    const close = () => setOpen(false);

    // Escape to close, focus the close button on open, restore on close.
    useEffect(() => {
        if (!open) return;
        const onKey = (e) => {
            if (e.key === "Escape") close();
        };
        window.addEventListener("keydown", onKey);
        requestAnimationFrame(() => closeBtnRef.current?.focus());
        return () => {
            window.removeEventListener("keydown", onKey);
            restoreFocusRef.current?.focus?.();
        };
    }, [open]);

    if (!p?.enabled) return null;

    const copyCode = async () => {
        try {
            await navigator.clipboard.writeText(p.couponCode);
            setCopied(true);
            setTimeout(() => setCopied(false), 1800);
        } catch {
            /* clipboard blocked — the code is still visible to type */
        }
    };

    const ctaHref = (() => {
        if (p.ctaAction === "whatsapp" || !p.ctaAction) {
            const code = p.couponCode ? ` (code ${p.couponCode})` : "";
            return wa.custom(`Hi Sudarshan, I saw the "${p.title}" offer on your website${code}. I'd like to know more.`);
        }
        if (p.ctaAction === "url") return p.ctaUrl || "#pricing";
        return null;
    })();
    const external = !!ctaHref && /^https?:/.test(ctaHref);

    const onCta = (e) => {
        trackEvent("promo_popup_click", { offer: p.title, action: p.ctaAction || "whatsapp" });
        if (p.ctaAction === "pricing") {
            e.preventDefault();
            close();
            document.getElementById("pricing")?.scrollIntoView({ behavior: "smooth" });
        } else if (p.ctaAction === "enroll") {
            e.preventDefault();
            close();
            navigate("/enroll");
        } else if (ctaHref && !external && ctaHref.startsWith("/")) {
            e.preventDefault();
            close();
            navigate(ctaHref);
        } else {
            close();
        }
    };

    return (
        <AnimatePresence>
            {open && (
                <motion.div
                    className="fixed inset-0 z-[70] flex items-end sm:items-center justify-center p-3 sm:p-6"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0, transition: { duration: 0.15 } }}
                    style={{ background: "rgba(0,0,0,0.7)", backdropFilter: "blur(6px)" }}
                    onMouseDown={(e) => {
                        if (e.target === e.currentTarget) close();
                    }}
                >
                    <motion.div
                        role="dialog"
                        aria-modal="true"
                        aria-labelledby="promo-title"
                        initial={{ opacity: 0, y: 24, scale: 0.96 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 12, scale: 0.98, transition: { duration: 0.15 } }}
                        transition={{ type: "spring", duration: 0.45, bounce: 0.15 }}
                        className="relative w-full max-w-md overflow-hidden rounded-3xl"
                        style={{
                            background: "#0f0f0f",
                            border: "1px solid rgba(231,23,99,0.3)",
                            boxShadow: "0 30px 90px rgba(0,0,0,0.7), 0 0 60px rgba(231,23,99,0.15)",
                        }}
                    >
                        <button
                            ref={closeBtnRef}
                            onClick={close}
                            aria-label="Close offer"
                            className="press absolute top-3 right-3 z-10 w-9 h-9 rounded-full flex items-center justify-center text-white/80 hover:text-white"
                            style={{ background: "rgba(0,0,0,0.55)", border: "1px solid rgba(255,255,255,0.12)" }}
                        >
                            <X className="w-4 h-4" />
                        </button>

                        {p.image && (
                            <div className="relative aspect-[4/3] w-full overflow-hidden">
                                <img src={p.image} alt="" className="w-full h-full object-cover" />
                                <div className="absolute inset-0 bg-gradient-to-t from-[#0f0f0f] via-transparent to-transparent" />
                            </div>
                        )}

                        <div className={`px-6 pb-6 ${p.image ? "-mt-6 relative" : "pt-8"}`}>
                            {p.eyebrow && (
                                <div className="inline-flex items-center gap-1.5 mb-3 px-2.5 py-1 rounded-md text-[11px] font-bold uppercase tracking-wider"
                                    style={{ background: "rgba(231,23,99,0.15)", color: "#ff4d8d" }}>
                                    <Flame className="w-3.5 h-3.5" aria-hidden="true" />
                                    {p.eyebrow}
                                </div>
                            )}

                            <h2 id="promo-title" className="text-3xl sm:text-4xl font-bold uppercase text-white leading-[0.95] mb-3">
                                {p.title}
                            </h2>

                            {p.message && (
                                <p className="text-sm text-white/60 leading-relaxed mb-5">{p.message}</p>
                            )}

                            {p.couponCode && (
                                <button
                                    onClick={copyCode}
                                    className="press w-full flex items-center justify-between gap-3 mb-4 px-4 py-3 rounded-xl text-left"
                                    style={{ background: "rgba(255,255,255,0.04)", border: "1.5px dashed rgba(231,23,99,0.5)" }}
                                    aria-label={`Copy coupon code ${p.couponCode}`}
                                >
                                    <span>
                                        <span className="block text-[10px] uppercase tracking-widest text-white/40">Coupon code</span>
                                        <span className="block text-lg font-bold tracking-[0.15em] text-white" style={{ fontFamily: "var(--font-display)" }}>
                                            {p.couponCode}
                                        </span>
                                    </span>
                                    <span className="flex items-center gap-1.5 text-xs font-semibold" style={{ color: copied ? "#34d399" : "#ff4d8d" }} aria-live="polite">
                                        {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                                        {copied ? "Copied" : "Copy"}
                                    </span>
                                </button>
                            )}

                            <a
                                href={ctaHref || "#pricing"}
                                target={external ? "_blank" : undefined}
                                rel={external ? "noopener noreferrer" : undefined}
                                onClick={onCta}
                                className="press group w-full inline-flex items-center justify-center gap-2 px-6 py-4 rounded-full text-white font-bold"
                                style={{ background: "#e71763", boxShadow: "0 0 30px rgba(231,23,99,0.45)" }}
                            >
                                {p.ctaLabel || "Claim my offer"}
                                <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" aria-hidden="true" />
                            </a>

                            <button onClick={close} className="w-full mt-3 text-xs text-white/35 hover:text-white/60 transition-colors">
                                No thanks, maybe later
                            </button>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}

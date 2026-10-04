import { Link, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, Dumbbell, MessageCircle } from "lucide-react";
import { wa } from "@/utils/whatsapp";
import { usePageMeta } from "@/hooks/usePageMeta";

// Public catch-all. Before this existed, an unknown URL (old shared link,
// typo, removed blog slug) rendered a completely blank page — no nav, no
// way back — which reads as "the site is broken" to a prospective client.
export default function NotFound() {
    const { pathname } = useLocation();

    usePageMeta({
        title: "Page not found",
        description: "This page doesn't exist. Head back to RECODE™ coaching by Sudarshan Chavan.",
        path: pathname,
        noindex: true,
    });

    return (
        <main
            id="main-content"
            className="relative min-h-[100dvh] flex items-center justify-center overflow-hidden px-4"
            style={{ background: "#0a0a0a" }}
        >
            <div
                className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] rounded-full blur-3xl pointer-events-none"
                style={{ background: "rgba(231,23,99,0.08)" }}
            />

            <motion.div
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, ease: [0.23, 1, 0.32, 1] }}
                className="relative z-10 max-w-lg w-full text-center"
            >
                {/* Outlined 404 in the display face — reads like a gym-wall
                    stencil rather than a generic error code. */}
                <p
                    aria-hidden="true"
                    className="select-none leading-none mb-2"
                    style={{
                        fontFamily: "var(--font-display)",
                        fontWeight: 800,
                        fontSize: "clamp(7rem, 28vw, 12rem)",
                        color: "transparent",
                        WebkitTextStroke: "2px rgba(231,23,99,0.55)",
                        letterSpacing: "-0.02em",
                    }}
                >
                    404
                </p>

                <div className="inline-flex items-center gap-2 mb-4 text-xs font-bold uppercase tracking-[0.25em]" style={{ color: "#e71763" }}>
                    <Dumbbell className="w-4 h-4" aria-hidden="true" />
                    Rest day for this page
                </div>

                <h1 className="text-4xl sm:text-5xl text-white mb-4 uppercase">
                    This page skipped training
                </h1>

                <p className="text-white/50 text-sm sm:text-base leading-relaxed mb-8 max-w-sm mx-auto">
                    The link may be old or mistyped. Your transformation is still one click away.
                </p>

                <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                    <Link
                        to="/"
                        className="press inline-flex items-center gap-2 px-6 py-3.5 rounded-full text-white font-bold text-sm"
                        style={{ background: "#e71763", boxShadow: "0 0 30px rgba(231,23,99,0.4)" }}
                    >
                        <ArrowLeft className="w-4 h-4" aria-hidden="true" />
                        Back to home
                    </Link>
                    <a
                        href={wa.coaching}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="press inline-flex items-center gap-2 px-6 py-3.5 rounded-full text-white/80 font-semibold text-sm border border-white/15 hover:bg-white/5 hover:text-white transition-colors"
                    >
                        <MessageCircle className="w-4 h-4" aria-hidden="true" />
                        Ask on WhatsApp
                    </a>
                </div>
            </motion.div>
        </main>
    );
}

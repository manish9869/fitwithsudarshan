import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, X } from "lucide-react";
import { Link } from "react-router-dom";
import { useSiteData } from "@/contexts/SiteDataContext";
import { DEFAULT_STICKY_CTA } from "@/utils/siteContentDefaults";

export default function StickyCTABar() {
    const { stickyCta } = useSiteData();
    const [visible, setVisible] = useState(false);
    const [closed, setClosed] = useState(false);

    useEffect(() => {
        const handleScroll = () => {
            // Show after scrolling past 60% of the page
            const scrolled = window.scrollY / (document.body.scrollHeight - window.innerHeight);
            if (scrolled > 0.25) setVisible(true);
        };
        window.addEventListener("scroll", handleScroll, { passive: true });
        return () => window.removeEventListener("scroll", handleScroll);
    }, []);

    if (stickyCta?.enabled === false) return null;

    const title = stickyCta?.title || DEFAULT_STICKY_CTA.title;
    const subtitle = stickyCta?.subtitle || DEFAULT_STICKY_CTA.subtitle;
    const ctaLabel = stickyCta?.ctaLabel || DEFAULT_STICKY_CTA.ctaLabel;

    return (
        <AnimatePresence>
            {visible && !closed && (
                <motion.div
                    initial={{ y: 100, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: 100, opacity: 0 }}
                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                    className="fixed bottom-0 left-0 right-0 z-40 px-4 py-3"
                    style={{ background: 'rgba(8,8,8,0.96)', borderTop: '1px solid rgba(231,23,99,0.25)', backdropFilter: 'blur(20px)' }}
                >
                    <div className="container mx-auto flex items-center justify-between gap-3 max-w-4xl">
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                            <motion.span
                                className="w-2 h-2 rounded-full flex-shrink-0"
                                style={{ background: '#e71763' }}
                                animate={{ scale: [1, 1.5, 1], opacity: [1, 0.5, 1] }}
                                transition={{ duration: 1.5, repeat: Infinity }}
                            />
                            <p className="text-white font-semibold text-sm truncate">
                                {title}
                            </p>
                            <p className="text-muted-foreground text-xs hidden sm:block">{subtitle}</p>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                            <Link to="/enroll">
                                <motion.button
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.97 }}
                                    className="px-5 py-2 rounded-full text-white font-bold text-sm"
                                    style={{ background: '#e71763', boxShadow: '0 0 20px rgba(231,23,99,0.35)' }}
                                >
                                    {ctaLabel} <ArrowRight className="inline w-3.5 h-3.5 ml-1" />
                                </motion.button>
                            </Link>
                            <button onClick={() => setClosed(true)} className="text-white/40 hover:text-white/80 p-1">
                                <X className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
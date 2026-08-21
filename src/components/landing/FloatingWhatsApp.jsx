import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, MessageCircle } from "lucide-react";
import { wa } from "@/utils/whatsapp";
import { useSiteData } from "@/contexts/SiteDataContext";
import { DEFAULT_FLOATING_WHATSAPP } from "@/utils/siteContentDefaults";

export default function FloatingWhatsApp() {
    const { floatingWhatsapp } = useSiteData();
    const [showTooltip, setShowTooltip] = useState(false);
    const [dismissed, setDismissed] = useState(false);

    useEffect(() => {
        // Scroll-gated rather than a flat timer — a flat 4s delay means the
        // tooltip can pop up while someone's still reading the hero and land
        // directly on top of the subtext (worse on the compact mobile hero,
        // which fits more copy above the fold). Waiting for scroll past the
        // hero means it only ever appears over content they've moved past.
        const handleScroll = () => {
            if (window.scrollY > 400) setShowTooltip(true);
        };
        window.addEventListener("scroll", handleScroll, { passive: true });
        return () => window.removeEventListener("scroll", handleScroll);
    }, []);

    if (floatingWhatsapp?.enabled === false) return null;

    const tooltipText = floatingWhatsapp?.tooltipText || DEFAULT_FLOATING_WHATSAPP.tooltipText;

    return (
        <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-2">
            {/* Tooltip bubble */}
            <AnimatePresence>
                {showTooltip && !dismissed && (
                    <motion.div
                        initial={{ opacity: 0, y: 10, scale: 0.9 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 10, scale: 0.9 }}
                        className="flex items-start gap-2 rounded-2xl px-4 py-3 max-w-[220px] shadow-2xl"
                        style={{ background: 'rgba(20,20,20,0.95)', border: '1px solid rgba(231,23,99,0.3)', backdropFilter: 'blur(20px)' }}
                    >
                        <div className="flex-1">
                            <p className="text-white text-xs font-semibold leading-relaxed">
                                {tooltipText}
                            </p>
                        </div>
                        <button onClick={() => setDismissed(true)} className="text-white/40 hover:text-white/80 flex-shrink-0 mt-0.5">
                            <X className="w-3 h-3" />
                        </button>
                    </motion.div>
                )}
            </AnimatePresence>





            {/* Main Button */}
            <motion.a
                href={wa.coaching}
                target="_blank"
                rel="noopener noreferrer"
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 1.5, type: "spring", stiffness: 200, damping: 15 }}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
                className="relative w-14 h-14 rounded-full flex items-center justify-center shadow-2xl"
                style={{
                    background: '#25D366',
                    boxShadow: '0 0 30px rgba(37,211,102,0.4)'
                }}
                onClick={() => setShowTooltip(false)}
            >
                {/* Pulse rings */}
                <motion.span
                    className="absolute inset-0 rounded-full"
                    animate={{ scale: [1, 1.6, 2], opacity: [0.4, 0.15, 0] }}
                    transition={{ duration: 2.5, repeat: Infinity, ease: "easeOut" }}
                    style={{ background: 'rgba(37,211,102,0.4)' }}
                />
                <motion.span
                    className="absolute inset-0 rounded-full"
                    animate={{ scale: [1, 1.4, 1.7], opacity: [0.3, 0.1, 0] }}
                    transition={{
                        duration: 2.5,
                        repeat: Infinity,
                        ease: "easeOut",
                        delay: 0.5
                    }}
                    style={{ background: 'rgba(37,211,102,0.3)' }}
                />
                <MessageCircle className="w-6 h-6 text-white fill-white" />
            </motion.a>
        </div>
    );
}
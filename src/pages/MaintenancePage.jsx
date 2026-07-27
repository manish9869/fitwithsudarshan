import { motion } from "framer-motion";
import { Wrench, MessageCircle } from "lucide-react";
import { wa } from "@/utils/whatsapp";
import { useSiteData } from "@/contexts/SiteDataContext";
import { DEFAULT_MAINTENANCE } from "@/utils/siteContentDefaults";

export default function MaintenancePage() {
    const { maintenance, brand } = useSiteData();

    const title = maintenance?.title || DEFAULT_MAINTENANCE.title;
    const message = maintenance?.message || DEFAULT_MAINTENANCE.message;
    const brandName = brand?.name || "FitWithSudarshan";

    return (
        <div
            className="relative min-h-screen flex items-center justify-center overflow-hidden px-4"
            style={{ background: "#0a0a0a" }}
        >
            <motion.div
                className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] rounded-full blur-3xl pointer-events-none"
                style={{ background: "rgba(231,23,99,0.08)" }}
                animate={{ scale: [1, 1.15, 1], opacity: [0.5, 0.9, 0.5] }}
                transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
            />

            <motion.div
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
                className="relative z-10 max-w-lg w-full text-center"
            >
                <motion.div
                    className="mx-auto mb-6 w-16 h-16 rounded-2xl flex items-center justify-center"
                    style={{
                        background: "rgba(231,23,99,0.1)",
                        border: "1px solid rgba(231,23,99,0.3)",
                    }}
                    animate={{ rotate: [0, -8, 8, 0] }}
                    transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                >
                    <Wrench className="w-7 h-7" style={{ color: "#e71763" }} />
                </motion.div>

                <p
                    className="text-xs font-black uppercase tracking-[0.25em] mb-3"
                    style={{ color: "#e71763" }}
                >
                    {brandName}
                </p>

                <h1 className="text-3xl sm:text-4xl font-black text-white mb-4 leading-tight">
                    {title}
                </h1>

                <p className="text-white/50 text-sm sm:text-base leading-relaxed mb-8">
                    {message}
                </p>

                <a href={wa.coaching} target="_blank" rel="noopener noreferrer">
                    <motion.div
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.97 }}
                        className="inline-flex items-center gap-2 px-6 py-3.5 rounded-full text-white font-bold text-sm"
                        style={{
                            background: "#e71763",
                            boxShadow: "0 0 30px rgba(231,23,99,0.4)",
                        }}
                    >
                        <MessageCircle className="w-4 h-4" />
                        Message Us on WhatsApp
                    </motion.div>
                </a>
            </motion.div>
        </div>
    );
}

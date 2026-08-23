import { motion } from "framer-motion";

// Shown while useSiteData() is still loading, in place of a section that
// would otherwise render null. The real backend latency (cold serverless
// start on the first request in a while) is a few seconds, not a bug — but
// four major sections (testimonials, blog, pricing, transformations)
// returning null during that window collapsed the whole page down to a
// handful of gaps, which reads as broken even though it self-resolves.
// Reserving roughly the section's real height also keeps a pending #hash
// scroll (see ScrollToTop.jsx) from landing somewhere wildly off.
export default function SectionSkeleton({ id, minHeight = 480 }) {
    return (
        <section
            id={id}
            className="flex items-center justify-center"
            style={{ minHeight }}
        >
            <motion.div
                className="w-8 h-8 rounded-full"
                style={{
                    border: "2.5px solid rgba(231,23,99,0.2)",
                    borderTopColor: "#e71763",
                }}
                animate={{ rotate: 360 }}
                transition={{ duration: 0.8, repeat: Infinity, ease: "linear" }}
            />
        </section>
    );
}

import { motion } from "framer-motion";

// Shown while useSiteData() is still loading, in place of a section that
// would otherwise render null. The real backend latency (cold serverless
// start on the first request in a while) is a few seconds, not a bug — but
// four major sections (testimonials, blog, pricing, transformations)
// returning null during that window collapsed the whole page down to a
// handful of gaps, which reads as broken even though it self-resolves.
// Reserving roughly the section's real height also keeps a pending #hash
// scroll (see ScrollToTop.jsx) from landing somewhere wildly off.
//
// No `id` here — the outer TrackedSection wrapper in Landing.jsx already
// carries the section's #hash anchor id. Every real section used to also
// set that same id on its own root (and this skeleton mirrored it), which
// meant two elements sharing one id in the DOM at once — invalid HTML, and
// technically undefined which one `document.getElementById` returns.
export default function SectionSkeleton({ minHeight = 480 }) {
    return (
        <section
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

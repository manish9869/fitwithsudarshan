import { useEffect } from "react";
import { useLocation, useNavigationType } from "react-router-dom";
import { useSiteData } from "@/contexts/SiteDataContext";

const getHashId = (hash) => {
    const rawId = hash.slice(1);

    try {
        return decodeURIComponent(rawId);
    } catch {
        return rawId;
    }
};

export default function ScrollToTop() {
    const { pathname, hash } = useLocation();
    const navigationType = useNavigationType();
    const { loading } = useSiteData();

    useEffect(() => {
        if (navigationType === "POP") return;

        if (hash) {
            // Content-gated sections (testimonials, blog, pricing...) render
            // nothing until the site-content fetch resolves, so right after
            // mount the page can be much shorter than its final height. On a
            // never-cached first visit, scrolling to the hash target here
            // lands on wherever it sits in that not-yet-final layout — once
            // the fetch resolves a beat later and those sections mount their
            // real content, the page grows and pushes the target down, but
            // the scroll position never re-adjusts, leaving a blank gap in
            // view. Wait for loading to clear first (already-cached visits:
            // instant, no behavior change) before scrolling.
            if (loading) return;

            const id = getHashId(hash);
            const timer = window.setTimeout(() => {
                document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
            }, 300);
            return () => window.clearTimeout(timer);
        }

        window.scrollTo({ top: 0, left: 0, behavior: "instant" });
    }, [pathname, hash, navigationType, loading]);

    return null;
}

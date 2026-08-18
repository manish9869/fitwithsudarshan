import { useEffect, useRef } from 'react';

// GA4's page_view-based reporting has no visibility into WHICH PART of one
// long single-page route (the landing page) someone was actually looking
// at — "Transformations," "Pricing," etc. are all just "/" to GA4. This
// fills that gap: watches a section with IntersectionObserver, times how
// long it stayed at least half-visible, and fires one custom event per
// visible period once they scroll away (rather than accumulating and hoping
// an unload handler fires reliably).
//
// Requires section_name/engaged_seconds to be registered as GA4 Custom
// Definitions before the admin Analytics page can report on them — see the
// setup steps wherever this hook is wired up (Landing.jsx).
const VISIBLE_THRESHOLD = 0.5;
const MIN_REPORTABLE_SECONDS = 1; // ignore a fast scroll-through as noise

export function useSectionEngagement(sectionName) {
    const ref = useRef(null);
    const visibleSince = useRef(null);

    useEffect(() => {
        const el = ref.current;
        if (!el || typeof window === 'undefined' || typeof window.gtag !== 'function') return;

        const report = () => {
            if (visibleSince.current == null) return;
            const seconds = (Date.now() - visibleSince.current) / 1000;
            visibleSince.current = null;
            if (seconds < MIN_REPORTABLE_SECONDS) return;
            window.gtag('event', 'section_engagement', {
                section_name: sectionName,
                engaged_seconds: Math.round(seconds),
            });
        };

        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) {
                    visibleSince.current = Date.now();
                } else {
                    report();
                }
            },
            { threshold: VISIBLE_THRESHOLD }
        );
        observer.observe(el);

        // Backstop for "tab hidden/closed while still on this section" —
        // an unmount alone would miss that.
        const onVisibilityChange = () => { if (document.visibilityState === 'hidden') report(); };
        document.addEventListener('visibilitychange', onVisibilityChange);

        return () => {
            observer.disconnect();
            document.removeEventListener('visibilitychange', onVisibilityChange);
            report();
        };
    }, [sectionName]);

    return ref;
}

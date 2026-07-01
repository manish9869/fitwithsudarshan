import { useEffect } from "react";
import { useLocation } from "react-router-dom";

/**
 * AnalyticsTracker
 *
 * Fires a GA4 page_view event on every client-side route change.
 * Must render inside <Router> (uses useLocation).
 *
 * Pairs with the gtag config in index.html which has
 * `send_page_view: false` set — GA's automatic pageview only fires
 * once on initial load in an SPA, so we handle it manually here.
 */
export default function AnalyticsTracker() {
    const location = useLocation();

    useEffect(() => {
        if (typeof window.gtag !== "function") return;
        window.gtag("event", "page_view", {
            page_path: location.pathname + location.search,
            page_location: window.location.href,
            page_title: document.title,
        });
    }, [location]);

    return null;
}
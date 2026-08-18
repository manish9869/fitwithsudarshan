import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

export function useAnalyticsPageview() {
    const location = useLocation();

    useEffect(() => {
        if (typeof window === 'undefined' || typeof window.gtag !== 'function') return;
        // Admin panel navigation isn't customer traffic — tracking it here
        // meant every dashboard/enrollments/analytics click from the coach
        // showed up in GA4's Top Pages and inflated pageview/session totals
        // right alongside real visitors. Nothing downstream needs it.
        if (location.pathname.startsWith('/admin')) return;

        window.gtag('event', 'page_view', {
            page_path: location.pathname + location.search,
            page_location: window.location.href,
            page_title: document.title,
        });
    }, [location]);
}
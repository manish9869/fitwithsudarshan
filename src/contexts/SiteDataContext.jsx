// src/contexts/SiteDataContext.jsx
import { createContext, useContext, useEffect, useRef, useState, useCallback } from 'react';
import { fetchSiteContent, fetchContentVersion, readCachedSiteContent } from '@/services/contentApi';
import { applyWhatsAppTemplates } from '@/utils/whatsapp';

// How often an already-open tab checks whether an admin changed something.
const VERSION_POLL_MS = 15_000;

const SiteDataContext = createContext(null);

const EMPTY = {
    brand: {}, coach: {}, contact: { social: {} }, whyRecode: { others: [], recode: [] },
    targetAudience: [], planInclusions: [], coachingTypes: [], durations: [],
    pricingTable: {}, basicConsultation: null, recodeMethod: [],
    testimonials: [], blogPosts: [], transformations: [], saleFlags: {}, popularFlags: {},
};

export function SiteDataProvider({ children }) {
    const [data, setData] = useState(() => {
        const cached = readCachedSiteContent();
        if (cached?.whatsappTemplates) applyWhatsAppTemplates(cached.whatsappTemplates);
        return cached || EMPTY;
    });
    const [loading, setLoading] = useState(!readCachedSiteContent());
    const [error, setError] = useState('');
    const lastVersionRef = useRef(null);

    // Mobile connections drop/stall far more often than desktop — a single
    // failed attempt used to leave the whole page's content sections empty
    // until the visitor manually hard-refreshed. Retrying a couple of times
    // with a short backoff covers a transient blip without a page reload.
    const MAX_LOAD_ATTEMPTS = 3;
    const load = useCallback(async () => {
        for (let attempt = 1; attempt <= MAX_LOAD_ATTEMPTS; attempt++) {
            try {
                const fresh = await fetchSiteContent();
                setData(fresh);
                applyWhatsAppTemplates(fresh.whatsappTemplates);
                setError('');
                setLoading(false);
                return;
            } catch (e) {
                if (attempt === MAX_LOAD_ATTEMPTS) {
                    setError(e.message || 'Failed to load site content');
                    setLoading(false);
                    return;
                }
                await new Promise((resolve) => setTimeout(resolve, attempt * 1000));
            }
        }
    }, []);

    useEffect(() => { load(); }, [load]);

    // Background poll: an admin save bumps the backend's content version, so
    // a tab a customer already has open picks up the change on its own —
    // no hard refresh needed.
    useEffect(() => {
        const checkVersion = async () => {
            try {
                const version = await fetchContentVersion();
                if (lastVersionRef.current === null) {
                    lastVersionRef.current = version;
                    return;
                }
                if (version !== lastVersionRef.current) {
                    lastVersionRef.current = version;
                    load();
                }
            } catch {
                // Transient network issue — try again on the next tick.
            }
        };
        const interval = setInterval(checkVersion, VERSION_POLL_MS);
        return () => clearInterval(interval);
    }, [load]);

    return (
        <SiteDataContext.Provider value={{ ...data, loading, error, refresh: load }}>
            {children}
        </SiteDataContext.Provider>
    );
}

export function useSiteData() {
    const ctx = useContext(SiteDataContext);
    if (!ctx) throw new Error('useSiteData must be used within SiteDataProvider');
    return ctx;
}
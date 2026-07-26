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
    pricingTable: {}, basicConsultation: null, services: [], recodeMethod: [],
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

    const load = useCallback(async () => {
        try {
            const fresh = await fetchSiteContent();
            setData(fresh);
            applyWhatsAppTemplates(fresh.whatsappTemplates);
            setError('');
        } catch (e) {
            setError(e.message || 'Failed to load site content');
        } finally {
            setLoading(false);
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
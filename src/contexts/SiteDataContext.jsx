// src/contexts/SiteDataContext.jsx
import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { fetchSiteContent, readCachedSiteContent } from '@/services/contentApi';

const SiteDataContext = createContext(null);

const EMPTY = {
    brand: {}, coach: {}, contact: { social: {} }, whyRecode: { others: [], recode: [] },
    targetAudience: [], planInclusions: [], coachingTypes: [], durations: [],
    pricingTable: {}, basicConsultation: null, services: [], recodeMethod: [],
    testimonials: [], blogPosts: [], transformations: [],
};

export function SiteDataProvider({ children }) {
    const [data, setData] = useState(() => readCachedSiteContent() || EMPTY);
    const [loading, setLoading] = useState(!readCachedSiteContent());
    const [error, setError] = useState('');

    const load = useCallback(async () => {
        try {
            const fresh = await fetchSiteContent();
            setData(fresh);
            setError('');
        } catch (e) {
            setError(e.message || 'Failed to load site content');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { load(); }, [load]);

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
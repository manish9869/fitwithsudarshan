// src/services/contentApi.js
const API_BASE = import.meta.env.VITE_API_URL ?? '';
const STORAGE_KEY = 'recode_site_content_cache_v1';

export async function fetchSiteContent() {
    const res = await fetch(`${API_BASE}/api/content/all`);
    if (!res.ok) throw new Error('Failed to load site content');
    const data = await res.json();
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify({ data, ts: Date.now() })); } catch { /* noop */ }
    return data;
}

// Cheap poll target — just a number, no DB query on the backend. Lets an
// already-open tab detect an admin edit and refetch, instead of the
// customer needing to hard-refresh to see a price/content change.
export async function fetchContentVersion() {
    const res = await fetch(`${API_BASE}/api/content/version`);
    if (!res.ok) throw new Error('Failed to check content version');
    const { version } = await res.json();
    return version;
}

// Instant-paint fallback: whatever we last successfully fetched, so the
// page doesn't flash empty while the network request is in flight.
export function readCachedSiteContent() {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (!raw) return null;
        return JSON.parse(raw).data;
    } catch { return null; }
}
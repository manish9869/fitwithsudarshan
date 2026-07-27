// src/services/contentApi.js
const API_BASE = import.meta.env.VITE_API_URL ?? '';
// Bumped from _v1 — a stale, possibly-wrong snapshot (e.g. a transformation
// with the same before/after photo, since corrected) could sit in a
// customer's localStorage indefinitely with no expiry, get instant-painted
// on every visit, and only get replaced a moment later once the real fetch
// resolved. Bumping the key throws away every existing cached copy on
// deploy; the new TTL below stops it from happening again.
const STORAGE_KEY = 'recode_site_content_cache_v2';
const CACHE_TTL_MS = 10 * 60 * 1000; // 10 minutes
const FETCH_TIMEOUT_MS = 12_000;

// A stalled/hanging request on a flaky mobile connection used to block
// forever — fetch() has no default timeout, so a customer with no cache yet
// (first-ever visit) could be stuck on a blank page indefinitely, only
// "fixed" by a hard refresh giving the network a fresh attempt.
function fetchWithTimeout(url, timeoutMs = FETCH_TIMEOUT_MS) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    return fetch(url, { signal: controller.signal }).finally(() => clearTimeout(timer));
}

export async function fetchSiteContent() {
    const res = await fetchWithTimeout(`${API_BASE}/api/content/all`);
    if (!res.ok) throw new Error('Failed to load site content');
    const data = await res.json();
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify({ data, ts: Date.now() })); } catch { /* noop */ }
    return data;
}

// Cheap poll target — just a number, no DB query on the backend. Lets an
// already-open tab detect an admin edit and refetch, instead of the
// customer needing to hard-refresh to see a price/content change.
export async function fetchContentVersion() {
    const res = await fetchWithTimeout(`${API_BASE}/api/content/version`, 6_000);
    if (!res.ok) throw new Error('Failed to check content version');
    const { version } = await res.json();
    return version;
}

// Instant-paint fallback: whatever we last successfully fetched, so the
// page doesn't flash empty while the network request is in flight. Ignores
// anything older than CACHE_TTL_MS — a long-stale snapshot is more likely
// to be wrong (superseded by an admin edit) than a few-minutes-old one, and
// showing definitely-current-ish content beats showing possibly-stale
// content that then visibly swaps out from under the visitor.
export function readCachedSiteContent() {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (!raw) return null;
        const { data, ts } = JSON.parse(raw);
        if (!ts || Date.now() - ts > CACHE_TTL_MS) return null;
        return data;
    } catch { return null; }
}
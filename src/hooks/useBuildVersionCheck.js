import { useEffect, useState } from 'react';

/* global __BUILD_ID__ */

const CHECK_INTERVAL_MS = 5 * 60 * 1000;

// Detects a newer deploy while this tab is already open. lazyRetry() already
// self-heals a route chunk that's been deleted by a newer deploy (catches
// the failed dynamic import, reloads once) — this covers the gap that left:
// a tab sitting on a page it's already loaded, never touching a new chunk,
// has no way to learn a new build exists until something breaks. version.json
// is written fresh on every build (vite.config.js) and served with
// Cache-Control: no-store (vercel.json), so this is always comparing against
// the actually-live build, not a cached answer.
export function useBuildVersionCheck() {
    const [updateAvailable, setUpdateAvailable] = useState(false);

    useEffect(() => {
        let cancelled = false;

        const check = async () => {
            try {
                const res = await fetch('/version.json', { cache: 'no-store' });
                if (!res.ok) return; // dev server / not deployed yet — nothing to compare against
                const { buildId } = await res.json();
                if (!cancelled && buildId && buildId !== __BUILD_ID__) {
                    setUpdateAvailable(true);
                }
            } catch {
                // Offline, blocked by an extension, whatever — never let a
                // version check take down the actual app.
            }
        };

        check();
        const interval = setInterval(check, CHECK_INTERVAL_MS);
        const onVisible = () => { if (document.visibilityState === 'visible') check(); };
        document.addEventListener('visibilitychange', onVisible);

        return () => {
            cancelled = true;
            clearInterval(interval);
            document.removeEventListener('visibilitychange', onVisible);
        };
    }, []);

    return updateAvailable;
}

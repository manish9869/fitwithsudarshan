export function lazyRetry(importFn) {
    return new Promise((resolve, reject) => {
        importFn()
            .then(resolve)
            .catch((error) => {
                // A stale/deleted chunk after a new deploy usually shows up as a
                // failed dynamic import. Do a single hard reload to grab the
                // latest index.html + chunk hashes instead of leaving a blank page.
                const alreadyRetried = sessionStorage.getItem('chunk-retry');
                if (!alreadyRetried) {
                    sessionStorage.setItem('chunk-retry', '1');
                    window.location.reload();
                    return;
                }
                sessionStorage.removeItem('chunk-retry');
                reject(error);
            });
    });
}
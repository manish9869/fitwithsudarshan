import { useEffect } from 'react';

const DEFAULT_IMAGE = 'https://vducmiggraxtqdgt.public.blob.vercel-storage.com/sudarshan.jpeg';
const SITE = 'https://fitwithsudarshan.com';

function setMeta(attr, key, content) {
    if (!content) return;
    let el = document.querySelector(`meta[${attr}="${key}"]`);
    if (!el) {
        el = document.createElement('meta');
        el.setAttribute(attr, key);
        document.head.appendChild(el);
    }
    el.setAttribute('content', content);
}

function setCanonical(href) {
    let el = document.querySelector('link[rel="canonical"]');
    if (!el) {
        el = document.createElement('link');
        el.setAttribute('rel', 'canonical');
        document.head.appendChild(el);
    }
    el.setAttribute('href', href);
}

/**
 * usePageMeta({ title, description, path, image, noindex })
 * Sets document.title + meta description/OG/Twitter + canonical for the current route.
 * Call once near the top of each page component.
 */
export function usePageMeta({ title, description, path = '', image = DEFAULT_IMAGE, noindex = false }) {
    useEffect(() => {
        const fullTitle = title ? `${title} | FitWithSudarshan` : 'RECODE™ Fitness Coaching by Sudarshan Chavan';
        const url = `${SITE}${path}`;

        document.title = fullTitle;

        setMeta('name', 'description', description);
        setMeta('property', 'og:title', fullTitle);
        setMeta('property', 'og:description', description);
        setMeta('property', 'og:url', url);
        setMeta('property', 'og:image', image);
        setMeta('name', 'twitter:title', fullTitle);
        setMeta('name', 'twitter:description', description);
        setMeta('name', 'twitter:image', image);
        setMeta('name', 'robots', noindex ? 'noindex, nofollow' : 'index, follow, max-snippet:-1, max-image-preview:large, max-video-preview:-1');

        setCanonical(url);

        // Reset to homepage defaults on unmount so a fast route change
        // never leaves stale tags behind if a page forgets to call this.
        return () => {
            document.title = 'RECODE™ Fitness Coaching by Sudarshan Chavan';
        };
    }, [title, description, path, image, noindex]);
}
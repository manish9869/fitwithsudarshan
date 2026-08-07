// src/utils/siteContentDefaults.js
// Fallback copy for site_content keys that ship empty from the DB until an
// admin edits them. Both the live component (StickyCTABar, FloatingWhatsApp)
// and the admin editor (AdminSiteSettings) import from here, so the admin
// panel always shows the real current text instead of blank boxes, and the
// two can never drift out of sync.

export const DEFAULT_STICKY_CTA = {
    enabled: true,
    title: 'Not sure where to start?',
    subtitle: 'Chat directly with Sudarshan, Founder of RECODE™',
    ctaLabel: 'Enroll Now',
};

export const DEFAULT_FLOATING_WHATSAPP = {
    enabled: true,
    tooltipText: '💬 Speak Directly With The Founder - Get clarity on your transformation journey.',
};

export const DEFAULT_MAINTENANCE = {
    enabled: false,
    title: "We'll Be Right Back",
    message: "The site is currently undergoing scheduled maintenance. We're working hard to improve your experience — please check back shortly. For anything urgent, reach out on WhatsApp.",
};

export const DEFAULT_LOGGING = {
    verbose: false,
};

// Approximate gram weight of each serving unit, used to convert between
// units in the Diet Planner (e.g. "1.5 Cup - Medium" -> grams -> scaled
// nutrition) since foods are stored with values per a fixed gram amount.
// These are estimates, not per-food measurements — deliberately editable
// here so Sudarshan can tune them (or add new units) without a code change.
//
// `type` controls which foods a unit is even offered for — a banana can't
// be measured in ml, tea can't be measured in slices. 'solid' units only
// show for non-Beverages foods, 'liquid' only for Beverages, 'both' always.
export const DEFAULT_DIET_UNITS = {
    units: [
        { label: 'Grams (g)', grams: '1', type: 'solid' },
        { label: 'Milliliters (ml)', grams: '1', type: 'liquid' },
        { label: 'Ounce (oz)', grams: '28.35', type: 'both' },
        { label: 'Tablespoon (tbsp)', grams: '15', type: 'both' },
        { label: 'Teaspoon (tsp)', grams: '5', type: 'both' },
        { label: 'Cup - Small', grams: '100', type: 'both' },
        { label: 'Cup - Medium', grams: '150', type: 'both' },
        { label: 'Cup - Large', grams: '200', type: 'both' },
        { label: 'Bowl - Small', grams: '150', type: 'solid' },
        { label: 'Bowl - Medium', grams: '250', type: 'solid' },
        { label: 'Bowl - Large', grams: '350', type: 'solid' },
        { label: 'Katori', grams: '150', type: 'solid' },
        { label: 'Piece', grams: '30', type: 'solid' },
        { label: 'Slice', grams: '25', type: 'solid' },
        { label: 'Glass', grams: '200', type: 'liquid' },
        { label: 'Plate', grams: '200', type: 'solid' },
        { label: 'Scoop', grams: '30', type: 'solid' },
        { label: 'Bar', grams: '60', type: 'solid' },
    ],
};

// The PDF's "General Guidelines" page — global default, shown on every plan
// unless that specific plan has its own override (diet_plans.guidelines).
// Kept as one string per line (already numbered) rather than a repeater of
// objects — simplest possible editor is a plain textarea, one tip per line.
export const DEFAULT_DIET_GUIDELINES = {
    tips: [
        '1. Drink 8-10 glasses of water daily.',
        '2. Stick to meal timings as closely as possible.',
        '3. Avoid processed foods, sugary drinks, and fried snacks.',
        '4. Aim for 7-8 hours of quality sleep each night.',
        '5. Warm up before every workout; cool down and stretch after.',
        '6. Track your progress every week (weight + measurements).',
        '7. Consult your coach before making any modifications.',
        '8. Stay consistent — results take time and dedication.',
    ],
};

// The original hero banner and coach photo — used whenever an admin hasn't
// uploaded a custom one (hero.bannerImage / coach.photo are empty). Uploading
// a custom image overrides these; clearing it reverts back to these exact URLs.
export const DEFAULT_HERO_BANNER_IMAGE =
    'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=1280&h=720&fit=crop&q=70&auto=format';

export const DEFAULT_COACH_PHOTO =
    'https://vducmiggraxtqdgt.public.blob.vercel-storage.com/sudarshan.jpeg';

// Site logo (navbar, footer, admin sidebar) — used whenever an admin hasn't
// uploaded a custom one (brand.logo is empty).
export const DEFAULT_LOGO_URL =
    'https://vducmiggraxtqdgt.public.blob.vercel-storage.com/logo.png';

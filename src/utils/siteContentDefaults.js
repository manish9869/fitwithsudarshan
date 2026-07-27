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

// The original hero banner and coach photo — used whenever an admin hasn't
// uploaded a custom one (hero.bannerImage / coach.photo are empty). Uploading
// a custom image overrides these; clearing it reverts back to these exact URLs.
export const DEFAULT_HERO_BANNER_IMAGE =
    'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=1280&h=720&fit=crop&q=70&auto=format';

export const DEFAULT_COACH_PHOTO =
    'https://vducmiggraxtqdgt.public.blob.vercel-storage.com/sudarshan.jpeg';

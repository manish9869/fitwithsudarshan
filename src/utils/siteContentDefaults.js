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

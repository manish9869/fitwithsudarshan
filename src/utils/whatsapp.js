/**
 * WhatsApp Message Templates — RECODE™
 *
 * Usage:
 *   import { wa } from "@/utils/whatsapp";
 *
 *   // Use a preset template:
 *   <a href={wa.coaching}>...</a>
 *   <a href={wa.pricing}>...</a>
 *
 *   // Or build a custom one on the fly:
 *   <a href={wa.custom("Hi, I have a question about...")}>...</a>
 */

const BASE = "https://wa.me/919619708124";

function build(text) {
    return `${BASE}?text=${encodeURIComponent(text.trim())}`;
}

// ─── Message Templates ────────────────────────────────────────────────────────

const MESSAGES = {

    /** General coaching inquiry — hero, navbar, floating button */
    coaching: `Hi Sudarshan,

    I'd like to apply for a RECODE Comeback Consultation.
    
    My main goal:
    My current weight:
    My biggest struggle:
    I prefer: Online Coaching / Personal Training / Video Call Training
    I'm looking to begin: Immediately / Within 7 days / This month
    
    My status:
    Ready to enrol if it's the right fit / Need clarity before deciding
    
    I understand that RECODE is a personalised paid coaching program, not a free diet or workout plan.
    `,

    /** Pricing page — user has seen prices and wants to enroll */
    pricing: `Hi Sudarshan,

I've gone through the RECODE™ pricing and I'm interested in enrolling.

Plan I'm considering:
Duration:
My goal:
Any questions:`,

    /** Programs / services page */
    programs: `Hi Sudarshan,

I'd like to know more about the RECODE™ programs.

Program I'm interested in: (Online / Video / Mumbai Personal Training)
My goal:
My current fitness level:`,

    /** Transformations section — inspired by results */
    transformations: `Hi Sudarshan,

I just saw the RECODE™ client transformations and I'm inspired!

My goal:
My current weight:
How long I want to commit:`,

    /** Tools / calculators section — user just used a calculator */
    tools: `Hi Sudarshan,

I used the RECODE™ fitness calculator and I'd like a personalised plan based on my results.

My BMI / Calories / Macros (paste your results):
My goal:
My current weight:`,

    /** Contact / support */
    contact: `Hi Sudarshan,

I have a question about RECODE™.

My question:
My name:
Best time to reach me:`,

    /** Payment failed — user needs help completing enrollment */
    paymentFailed: `Hi Sudarshan,

I tried to enroll in RECODE™ but my payment didn't go through. Can you help me complete the enrollment?

Plan I was enrolling for:
Error I saw:`,

    /** Post-payment — onboarding follow-up */
    postPayment: `Hi Sudarshan,

I just completed my RECODE™ enrollment and I'm ready to begin!

My Enrollment ID:
My main goal:
Any questions before we start:`,

    /** Blog / knowledge hub — reader wants coaching */
    blog: `Hi Sudarshan,

I've been reading the RECODE™ blog and I'd love to work together.

Article that resonated most:
My goal:
My current situation:`,

    /** Testimonials section — social proof drove them */
    testimonials: `Hi Sudarshan,

I read the RECODE™ client stories and I'm motivated to start my own transformation.

My goal:
My starting point:
Preferred coaching type: Online / Video / Personal`,

    /** Footer / general newsletter area */
    footer: `Hi Sudarshan,

I'd like to learn more about RECODE™ and how you can help me.

My name:
My goal:`,

    assessmentCompleted: `Hi Sudarshan,

I've completed my RECODE™ assessment form.
Is there anything else you need from me before we begin?`,

};

// ─── Build all URLs ───────────────────────────────────────────────────────────

export const wa = {
    // Pre-built URLs for every template
    coaching: build(MESSAGES.coaching),
    pricing: build(MESSAGES.pricing),
    programs: build(MESSAGES.programs),
    transformations: build(MESSAGES.transformations),
    tools: build(MESSAGES.tools),
    contact: build(MESSAGES.contact),
    paymentFailed: build(MESSAGES.paymentFailed),
    postPayment: build(MESSAGES.postPayment),
    blog: build(MESSAGES.blog),
    testimonials: build(MESSAGES.testimonials),
    footer: build(MESSAGES.footer),
    assessmentCompleted: build(MESSAGES.assessmentCompleted),
    /** Build a URL from any custom string */
    custom: (text) => build(text),
};

// Default export — general coaching URL (backwards-compatible with WHATSAPP_URL)
export const WHATSAPP_URL = wa.coaching;
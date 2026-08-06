# FitWithSudarshan — Frontend

React/Vite frontend for FitWithSudarshan: a public marketing + enrollment site backed by a full admin panel (CRM, payments ledger, CMS, and a diet/workout plan builder). Talks to the [FitWithSudarshan-Backend](../FitWithSudarshan-Backend) API for everything except static content rendering — there is no direct database access from the browser.

## Tech stack

- **React 18** + **Vite 6**, plain JavaScript (no TypeScript at runtime — `tsc` is used only for editor type-checking via `jsconfig.json`)
- **React Router v6** for routing, with every non-critical route code-split via `React.lazy` (see `src/App.jsx`)
- **Tailwind CSS v4** (CSS-first config, no `tailwind.config.js` — theme tokens live in `styles/index.css`)
- **Framer Motion** for animation, **Recharts** for the admin dashboard charts
- A small set of **Radix UI** primitives (`select`, `tabs`, `slider`, `label`) wrapped as local components in `src/components/ui/`
- **Razorpay** for payments (`src/hooks/useRazorpay.js`), **jsPDF**/**html2canvas** for client-side diet-plan PDF export, **xlsx** for admin data export

## Getting started

```bash
npm install
npm run dev        # http://localhost:5173, proxies /api/* to the backend on :3001
```

Other scripts:

| Script | What it does |
|---|---|
| `npm run build` | Production build to `dist/` |
| `npm run preview` | Preview the production build locally |
| `npm run lint` / `npm run lint:fix` | ESLint (includes `eslint-plugin-unused-imports`) |
| `npm run typecheck` | `tsc` in check-only mode against `jsconfig.json` |

### Environment variables

Create `.env` (see values already used in `.env.production` for reference):

| Variable | Purpose |
|---|---|
| `VITE_API_URL` | Base URL of the backend API. In dev, requests to `/api/*` are proxied to `http://localhost:3001` by `vite.config.js`, so this is typically only needed in production. |
| `VITE_RAZORPAY_KEY_ID` | Public Razorpay key used to open the checkout widget client-side. |

This app does **not** talk to Supabase directly from the browser — all data access goes through the backend's `/api/*` routes, which hold the service-role key server-side. There's nothing to configure here for the database.

## Project structure

```
src/
  App.jsx                  Route table (lazy-loaded), maintenance-mode gate
  pages/
    Landing.jsx             Public marketing page (built from components/landing/*)
    checkout/                Enroll → PaymentPage → PaymentSuccess/PaymentFailed
    legal/                   Terms, Privacy Policy, Refund Policy, FAQ
    Onboarding.jsx           Post-enrollment intake form
    UploadPhotos.jsx         Tokenized progress-photo upload link (no login required)
    BlogPost.jsx             /blog/:slug
    admin/                   Everything behind /admin (see below)
  components/
    landing/                 Hero, Features, Tools, Pricing, Testimonials, Transformations, Blog, Contact, Navbar, Footer, StickyCTABar, FloatingWhatsApp
    ui/                      Small local component library (button, input, select, tabs, slider, label — Radix-based where noted)
  contexts/SiteDataContext.jsx   Global site content + maintenance-mode flag, fetched once and shared
  services/                 API client wrappers (couponService, contentApi)
  hooks/                    useRazorpay, useAnalyticsPageview
  utils/                    whatsapp helpers, coupon helpers, lazy-retry for chunk-load failures
```

## Public site

- **Landing page** (`/`) — hero, coaching-type feature breakdown, pricing matrix, testimonials, before/after transformations, blog preview, contact form, sticky CTA bar, floating WhatsApp button. All content is CMS-driven (see Admin → CMS below), not hardcoded.
- **Enrollment flow** — `/enroll` → `/payment` (Razorpay checkout) → `/payment-success` or `/payment-failed`. Applies coupons client-side (validated server-side) and supports both individual and couple plans.
- **Onboarding** (`/onboarding`) — intake form a client fills out after enrolling.
- **Upload Photos** (`/upload-photos/:token`) — a tokenized, login-free link a client uses to upload progress photos / blood reports tied to their assessment.
- **Legal pages** — `/terms`, `/refund-policy`, `/privacy-policy`, `/faq` — all CMS-editable.
- **Blog** — `/blog/:slug`.
- **Maintenance mode** — when enabled from Admin → Site Settings, every public route (everything except `/admin/*`) renders a maintenance page instead of the real page. This is a UX-layer gate; the backend independently rejects checkout attempts while maintenance is on regardless of what the frontend shows.

## Admin panel (`/admin/*`)

Login at `/admin` (`AdminLogin.jsx`); every other admin route is behind `AdminGuard` (JWT session check) inside `AdminLayout` (sidebar shell).

### Dashboard (`/admin/dashboard`)
One-screen business overview for a selectable date range (7D / 30D / 90D / 1Y):
- **Business Performance** — revenue, paid enrollments, conversion rate (paid enrollments vs. assessments, capped at 100% — see note below), savings given via coupons.
- **Needs Your Attention** — assessments pending review, follow-ups due, outstanding balance, and plans **ending soon** (expiring within 7 days).
- **Client Insights** — new assessments, couple plans, average commitment score, diet plans created, and **renewed** plans (extensions created in range, plus an all-time renewed-client count).
- **Ending Soon** panel — lists every client whose current plan period expires within 7 days, with days remaining and how many times that client has already renewed (`Renewed ×N`), independent of the date-range picker so a plan that started months ago still surfaces here if it's about to lapse.
- Charts: revenue trend, enrollments by coaching type, individual vs. couple split, website vs. manual source split, duration chosen, revenue by coaching type, assessment status funnel, conversion-rate gauge.
- **Today's To-Do** (unreviewed assessments + due follow-ups) and **Recent Activity** feed.
- All figures exclude soft-deleted enrollments/assessments (`deleted_at`).

> **Why conversion rate can show 100% even when it "shouldn't":** it's `paid enrollments ÷ assessments in range`, capped at 100. Most clients on this site buy directly at checkout without ever filling out the assessment form, so paid enrollments regularly outnumber assessments in a window — an uncapped ratio (e.g. 157%) isn't a meaningful percentage, so it's clamped. This is intentional, not a bug.

### Enrollments (`/admin/enrollments`)
Full CRM list/search/filter over every enrollment (paid + manual), with lifecycle badges (Active / Active · Renewed / Expired / Expiring Soon — computed client-side from `plan_start_date + duration_months`, never stored), notes, and Excel export. Deep-linkable via `?lifecycle=` (e.g. from a dashboard KPI card) and `?focus=<id>`.

### Manual Enrollment (`/admin/manual-enrollment`)
Add a client who paid outside the website (cash/UPI/bank transfer/friends), or record a partial payment against an existing one. Supports **extending** an existing plan into a new period — this is how a renewal is created: a brand-new enrollment row chained to the original via `root_enrollment_id`, so every issued invoice/receipt stays historically accurate.

### Follow-Ups (`/admin/follow-ups`)
The 7-day automated follow-up queue — clients whose `next_followup_at` has passed.

### Balance Due (`/admin/balance-due`)
Payment ledger view for clients with an outstanding balance — record additional payments, send balance-due reminder emails.

### Assessments (`/admin/assessments`)
The "book a free consult" intake submissions — review, mark reviewed, move through the status pipeline (New → Plan Sent → Reviewed → Completed / Archived).

### Coupons (`/admin/coupons`)
Create/manage discount codes (percent, flat, or fixed-price), scoped to specific coaching types, plan types, and durations, with usage limits and active windows.

### Analytics (`/admin/analytics`)
Google Analytics 4 overview + live-visitor count (renders nothing if GA4 isn't configured on the backend).

### Funnel Audit (`/admin/funnel-audit`)
Cross-checks assessment → enrollment conversion at the individual-record level (as opposed to the dashboard's aggregate conversion rate).

### Logs (`/admin/logs`)
Transaction/audit log viewer for payment and checkout events.

### Profile (`/admin/profile`)
The logged-in admin's own display name, qualification, and contact info — also used as the default trainer identity when building a new diet plan.

### Diet & Workout Plan Builder
The largest sub-system — a full plan authoring tool with its own food/exercise reference libraries:
- **Diet Plans** (`/admin/diet-plans`, `/admin/diet-plans/:id`) — per-client day-by-day meal plans with macro targets (auto-calculated BMR/TDEE or manual override), cuisine/region preference, budget-conscious filtering, and PDF export.
- **Diet Foods** / **Diet Exercises** (`/admin/diet-foods`, `/admin/diet-exercises`) — the reference libraries plans are built from (nutrition facts, regional tagging, budget-friendly tagging for foods; muscle group/difficulty/location for exercises).
- **Diet Templates** / **Workout Templates** (`/admin/diet-templates`, `/admin/workout-templates`, plus `/:id` editors) — reusable day-rotation starting points so a new plan doesn't start from a blank page.

### CMS (`/admin/content/*`, `/admin/site-settings`)
Everything on the public site is editable without a deploy:
- `content/pricing` — coaching type × plan type × duration price matrix (dedicated editor)
- `content/coaching_types`, `content/recode_method` — dedicated simplified editors
- `content/legal-pages` — Terms / Privacy / Refund policy content
- `content/:table` — generic editor reused for `testimonials`, `blog_posts`, `transformations`, `durations`, `faqs`
- `site-settings` — site-wide settings, including the maintenance-mode toggle

## Database

This app has no direct database dependency — all persistence lives in the backend. The full schema (every table, consolidated into one script) is documented at [`FitWithSudarshan-Backend/src/scripts/schema.sql`](../FitWithSudarshan-Backend/src/scripts/schema.sql).

## Deployment

Deployed as a static SPA (see `vercel.json` — pure rewrite/caching rules, no serverless functions in this project). `npm run build` outputs `dist/`.

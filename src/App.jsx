import { lazy, Suspense } from 'react';

import {
  BrowserRouter as Router,
  Route,
  Routes,
  Navigate,
  useLocation,
} from 'react-router-dom';

import { motion } from 'framer-motion';
import { SpeedInsights } from '@vercel/speed-insights/react';

import CustomCursor from '@/components/CustomCursor';
import ScrollToTop from '@/components/ScrollToTop';
import AnalyticsTracker from '@/components/AnalyticsTracker';
import Landing from '@/pages/Landing';
import MaintenancePage from '@/pages/MaintenancePage';
import { lazyRetry } from '@/utils/lazyRetry';
import RouteErrorBoundary from '@/components/RouteErrorBoundary';
import { SiteDataProvider, useSiteData } from '@/contexts/SiteDataContext';

// ── Lazy pages — all wrapped in lazyRetry so a stale/failed chunk load
//    (e.g. after a fresh deploy rotates asset hashes) triggers a single
//    automatic hard-reload instead of leaving a stuck/blank screen. ──

// ── Public pages ──────────────────────────────────────────────────────────
const Enroll = lazy(() =>
  lazyRetry(() => import('@/pages/checkout/Enroll'))
);

const PaymentPage = lazy(() =>
  lazyRetry(() => import('@/pages/checkout/PaymentPage'))
);

const PaymentSuccess = lazy(() =>
  lazyRetry(() => import('@/pages/checkout/PaymentSuccess'))
);

const PaymentFailed = lazy(() =>
  lazyRetry(() => import('@/pages/checkout/PaymentFailed'))
);

const Terms = lazy(() =>
  lazyRetry(() => import('@/pages/legal/Terms'))
);

const RefundPolicy = lazy(() =>
  lazyRetry(() => import('@/pages/legal/RefundPolicy'))
);

const PrivacyPolicy = lazy(() =>
  lazyRetry(() => import('@/pages/legal/PrivacyPolicy'))
);

const Onboarding = lazy(() =>
  lazyRetry(() => import('@/pages/Onboarding'))
);

const UploadPhotos = lazy(() =>
  lazyRetry(() => import('@/pages/UploadPhotos'))
);

const FAQ = lazy(() =>
  lazyRetry(() => import('@/pages/legal/FAQSection'))
);

const BlogPost = lazy(() =>
  lazyRetry(() => import('@/pages/BlogPost'))
);

// ── Admin pages ───────────────────────────────────────────────────────────
const AdminLogin = lazy(() =>
  lazyRetry(() => import('@/pages/admin/AdminLogin'))
);

const AdminLayout = lazy(() =>
  lazyRetry(() => import('@/pages/admin/AdminLayout'))
);

const AdminGuard = lazy(() =>
  lazyRetry(() => import('@/pages/admin/AdminGuard'))
);

const AdminDashboard = lazy(() =>
  lazyRetry(() => import('@/pages/admin/AdminDashboard'))
);

const AdminEnrollments = lazy(() =>
  lazyRetry(() => import('@/pages/admin/enrollments/AdminEnrollments'))
);

const AdminAssessments = lazy(() =>
  lazyRetry(() => import('@/pages/admin/AdminAssessments'))
);

const AdminProfile = lazy(() =>
  lazyRetry(() => import('@/pages/admin/AdminProfile'))
);

const AdminCoupons = lazy(() =>
  lazyRetry(() => import('@/pages/admin/coupons/AdminCoupons'))
);

const AdminManualEnrollment = lazy(() =>
  lazyRetry(() => import('@/pages/admin/enrollments/AdminManualEnrollment'))
);

const AdminFollowUps = lazy(() =>
  lazyRetry(() => import('@/pages/admin/enrollments/AdminFollowUps'))
);

const AdminFunnelAudit = lazy(() =>
  lazyRetry(() => import('@/pages/admin/AdminFunnelAudit'))
);

const AdminAnalytics = lazy(() =>
  lazyRetry(() => import('@/pages/admin/AdminAnalytics'))
);

const AdminBalanceDue = lazy(() =>
  lazyRetry(() => import('@/pages/admin/enrollments/AdminBalanceDue'))
);

// ── Admin CMS ─────────────────────────────────────────────────────────────
const AdminCMSList = lazy(() =>
  lazyRetry(() => import('@/pages/admin/content/AdminCMSList'))
);

const AdminPricingMatrix = lazy(() =>
  lazyRetry(() => import('@/pages/admin/content/AdminPricingMatrix'))
);

const AdminCoachingTypes = lazy(() =>
  lazyRetry(() => import('@/pages/admin/content/AdminCoachingTypes'))
);

const DietPlanList = lazy(() =>
  lazyRetry(() => import('@/pages/admin/diet/DietPlanList'))
);

const DietPlanBuilder = lazy(() =>
  lazyRetry(() => import('@/pages/admin/diet/DietPlanBuilder'))
);

const DietTemplateList = lazy(() =>
  lazyRetry(() => import('@/pages/admin/diet/DietTemplateList'))
);

const DietTemplateEditor = lazy(() =>
  lazyRetry(() => import('@/pages/admin/diet/DietTemplateEditor'))
);

const DietWorkoutTemplateList = lazy(() =>
  lazyRetry(() => import('@/pages/admin/diet/DietWorkoutTemplateList'))
);

const DietWorkoutTemplateEditor = lazy(() =>
  lazyRetry(() => import('@/pages/admin/diet/DietWorkoutTemplateEditor'))
);

const DietFoodList = lazy(() =>
  lazyRetry(() => import('@/pages/admin/diet/DietFoodList'))
);

const DietExerciseList = lazy(() =>
  lazyRetry(() => import('@/pages/admin/diet/DietExerciseList'))
);

const AdminRecodeMethod = lazy(() =>
  lazyRetry(() => import('@/pages/admin/content/AdminRecodeMethod'))
);


const AdminLegalPages = lazy(() =>
  lazyRetry(() => import('@/pages/admin/content/AdminLegalPages'))
);

const AdminSiteSettings = lazy(() =>
  lazyRetry(() => import('@/pages/admin/content/AdminSiteSettings'))
);

const AdminLogs = lazy(() =>
  lazyRetry(() => import('@/pages/admin/AdminLogs'))
);
// ── Loading fallback ──────────────────────────────────────────────────────
function PageFallback() {
  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'hsl(0 0% 4%)',
      }}
    >
      <div
        style={{
          width: 28,
          height: 28,
          borderRadius: '50%',
          border: '2.5px solid rgba(231,23,99,0.2)',
          borderTopColor: '#e71763',
          animation: 'fws-spin 0.8s linear infinite',
        }}
      />

      <style>
        {`
          @keyframes fws-spin {
            to {
              transform: rotate(360deg);
            }
          }
        `}
      </style>
    </div>
  );
}

// Simple fade-IN only — no exit animation, no AnimatePresence around the
// route switch. Each page mounts fresh and fades from 0 → 1 opacity.
//
// Deliberately NOT using AnimatePresence/exit transitions here: that
// combination (exit animation + a lazy/Suspense-loaded incoming route)
// is what caused the intermittent blank-screen bug before.
//
// A mount-only fade has nothing to "wait" on, so there's no equivalent
// failure mode.
function PageEnter({ children }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{
        duration: 0.35,
        ease: 'easeOut',
      }}
    >
      {children}
    </motion.div>
  );
}

function LazyRoute({ children }) {
  return (
    <Suspense fallback={<PageFallback />}>
      <PageEnter>{children}</PageEnter>
    </Suspense>
  );
}

// ── Maintenance gate ─────────────────────────────────────────────────────────
// Sits above every route. Admin paths always pass through unmodified — that's
// the only way to reach Site Settings and turn maintenance mode back off.
// Everything else renders the maintenance page instead of the real route the
// moment `maintenance.enabled` is true, so no visitor can reach the
// enrollment/payment flow from the UI. (The actual hard guarantee against a
// transaction going through lives server-side in POST /api/create-order,
// which independently rejects while maintenance is on — this gate is the UX
// layer on top of that.)
//
// FIX: this used to hold on the fallback spinner for the ENTIRE app —
// including the landing page, which isn't even lazy — until the site-content
// fetch resolved. A returning visitor never noticed (last response is
// localStorage-cached for 10 min and paints instantly), but incognito/a new
// device always starts with an empty cache, so every first-time visitor sat
// on a blank spinner for as long as that fetch took (~1.5s+ on a cold
// serverless hit, worse on mobile). Now the real page renders immediately;
// the only remaining trade-off is that on that same never-cached first visit,
// if an admin happens to have maintenance mode on at that exact moment, the
// real page can be visible for a beat before this swaps it to the
// maintenance page once `maintenance.enabled` arrives. That's an acceptable,
// rare, short window versus every single first-time visitor eating a
// multi-second blank load — the server-side checkout guard in
// POST /api/create-order is what actually stops a transaction either way.
function MaintenanceGate({ children }) {
  const { maintenance } = useSiteData();
  const location = useLocation();
  const isAdminRoute = location.pathname.startsWith('/admin');

  if (isAdminRoute) return children;
  if (maintenance?.enabled) return <PageEnter><MaintenancePage /></PageEnter>;

  return children;
}

// ── App ───────────────────────────────────────────────────────────────────
function App() {
  return (
    <SiteDataProvider>
      <Router>
        <RouteErrorBoundary>
          <CustomCursor />
          <ScrollToTop />
          <AnalyticsTracker />

          <MaintenanceGate>
          <Routes>
            {/* ──────────────────────────────────────────────────────────── */}
            {/* Public                                                     */}
            {/* ──────────────────────────────────────────────────────────── */}

            <Route
              path="/"
              element={
                <PageEnter>
                  <Landing />
                </PageEnter>
              }
            />

            <Route
              path="/enroll"
              element={
                <LazyRoute>
                  <Enroll />
                </LazyRoute>
              }
            />

            <Route
              path="/payment"
              element={
                <LazyRoute>
                  <PaymentPage />
                </LazyRoute>
              }
            />

            <Route
              path="/payment-failed"
              element={
                <LazyRoute>
                  <PaymentFailed />
                </LazyRoute>
              }
            />

            <Route
              path="/payment-success"
              element={
                <LazyRoute>
                  <PaymentSuccess />
                </LazyRoute>
              }
            />

            <Route
              path="/terms"
              element={
                <LazyRoute>
                  <Terms />
                </LazyRoute>
              }
            />

            <Route
              path="/refund-policy"
              element={
                <LazyRoute>
                  <RefundPolicy />
                </LazyRoute>
              }
            />

            <Route
              path="/privacy-policy"
              element={
                <LazyRoute>
                  <PrivacyPolicy />
                </LazyRoute>
              }
            />

            <Route
              path="/onboarding"
              element={
                <LazyRoute>
                  <Onboarding />
                </LazyRoute>
              }
            />

            <Route
              path="/upload-photos/:token"
              element={
                <LazyRoute>
                  <UploadPhotos />
                </LazyRoute>
              }
            />

            <Route
              path="/faq"
              element={
                <LazyRoute>
                  <FAQ />
                </LazyRoute>
              }
            />

            <Route
              path="/blog/:slug"
              element={
                <LazyRoute>
                  <BlogPost />
                </LazyRoute>
              }
            />

            {/* ──────────────────────────────────────────────────────────── */}
            {/* Admin login — no guard                                      */}
            {/* ──────────────────────────────────────────────────────────── */}

            <Route
              path="/admin"
              element={
                <LazyRoute>
                  <AdminLogin />
                </LazyRoute>
              }
            />

            {/* ──────────────────────────────────────────────────────────── */}
            {/* Admin protected pages                                       */}
            {/* ──────────────────────────────────────────────────────────── */}

            <Route
              path="/admin"
              element={
                <LazyRoute>
                  <AdminGuard>
                    <AdminLayout />
                  </AdminGuard>
                </LazyRoute>
              }
            >
              <Route
                path="dashboard"
                element={
                  <LazyRoute>
                    <AdminDashboard />
                  </LazyRoute>
                }
              />

              <Route
                path="enrollments"
                element={
                  <LazyRoute>
                    <AdminEnrollments />
                  </LazyRoute>
                }
              />

              <Route
                path="assessments"
                element={
                  <LazyRoute>
                    <AdminAssessments />
                  </LazyRoute>
                }
              />

              <Route
                path="profile"
                element={
                  <LazyRoute>
                    <AdminProfile />
                  </LazyRoute>
                }
              />

              <Route
                path="coupons"
                element={
                  <LazyRoute>
                    <AdminCoupons />
                  </LazyRoute>
                }
              />

              <Route
                path="manual-enrollment"
                element={
                  <LazyRoute>
                    <AdminManualEnrollment />
                  </LazyRoute>
                }
              />

              <Route
                path="follow-ups"
                element={
                  <LazyRoute>
                    <AdminFollowUps />
                  </LazyRoute>
                }
              />

              <Route
                path="funnel-audit"
                element={
                  <LazyRoute>
                    <AdminFunnelAudit />
                  </LazyRoute>
                }
              />

              <Route
                path="analytics"
                element={
                  <LazyRoute>
                    <AdminAnalytics />
                  </LazyRoute>
                }
              />

              <Route
                path="balance-due"
                element={
                  <LazyRoute>
                    <AdminBalanceDue />
                  </LazyRoute>
                }
              />

              {/* ── CMS: Pricing has its own editor ── */}
              <Route
                path="content/pricing"
                element={
                  <LazyRoute>
                    <AdminPricingMatrix />
                  </LazyRoute>
                }
              />
              <Route path="content/legal-pages" element={<LazyRoute><AdminLegalPages /></LazyRoute>} />
              <Route path="site-settings" element={<LazyRoute><AdminSiteSettings /></LazyRoute>} />
              <Route path="logs" element={<LazyRoute><AdminLogs /></LazyRoute>} />
              {/* ── CMS: these have their own simplified editors ── */}
              <Route
                path="content/coaching_types"
                element={
                  <LazyRoute>
                    <AdminCoachingTypes />
                  </LazyRoute>
                }
              />
              <Route
                path="content/recode_method"
                element={
                  <LazyRoute>
                    <AdminRecodeMethod />
                  </LazyRoute>
                }
              />
              <Route
                path="diet-plans"
                element={
                  <LazyRoute>
                    <DietPlanList />
                  </LazyRoute>
                }
              />
              <Route
                path="diet-plans/:id"
                element={
                  <LazyRoute>
                    <DietPlanBuilder />
                  </LazyRoute>
                }
              />
              <Route
                path="diet-foods"
                element={
                  <LazyRoute>
                    <DietFoodList />
                  </LazyRoute>
                }
              />
              <Route
                path="diet-exercises"
                element={
                  <LazyRoute>
                    <DietExerciseList />
                  </LazyRoute>
                }
              />
              <Route
                path="diet-templates"
                element={
                  <LazyRoute>
                    <DietTemplateList />
                  </LazyRoute>
                }
              />
              <Route
                path="diet-templates/:id"
                element={
                  <LazyRoute>
                    <DietTemplateEditor />
                  </LazyRoute>
                }
              />
              <Route
                path="workout-templates"
                element={
                  <LazyRoute>
                    <DietWorkoutTemplateList />
                  </LazyRoute>
                }
              />
              <Route
                path="workout-templates/:id"
                element={
                  <LazyRoute>
                    <DietWorkoutTemplateEditor />
                  </LazyRoute>
                }
              />
              {/* ── Generic CMS editor ──
                  Handles:
                  /admin/content/testimonials
                  /admin/content/blog_posts
                  /admin/content/transformations
                  /admin/content/durations
                  /admin/content/faqs
                  /admin/content/legal_pages
              */}
              <Route
                path="content/:table"
                element={
                  <LazyRoute>
                    <AdminCMSList />
                  </LazyRoute>
                }
              />

              {/* Unknown admin route */}
              <Route
                path="*"
                element={
                  <Navigate
                    to="/admin/dashboard"
                    replace
                  />
                }
              />
            </Route>
          </Routes>
          </MaintenanceGate>
        </RouteErrorBoundary>

        <SpeedInsights />
      </Router>
    </SiteDataProvider>
  );
}

export default App;
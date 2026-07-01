import { lazy, Suspense } from 'react';

import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { SpeedInsights } from '@vercel/speed-insights/react';
import CustomCursor from '@/components/CustomCursor';
import ScrollToTop from '@/components/ScrollToTop';
import AnalyticsTracker from '@/components/AnalyticsTracker';
import Landing from '@/pages/Landing';
import { lazyRetry } from '@/utils/lazyRetry';
import RouteErrorBoundary from '@/components/RouteErrorBoundary';

// ── Lazy pages — all wrapped in lazyRetry so a stale/failed chunk load
//    (e.g. after a fresh deploy rotates asset hashes) triggers a single
//    automatic hard-reload instead of leaving a stuck/blank screen. ──
const Enroll = lazy(() => lazyRetry(() => import('@/pages/Enroll')));
const PaymentPage = lazy(() => lazyRetry(() => import('@/pages/PaymentPage')));
const PaymentSuccess = lazy(() => lazyRetry(() => import('@/pages/PaymentSuccess')));
const PaymentFailed = lazy(() => lazyRetry(() => import('@/pages/PaymentFailed')));
const Terms = lazy(() => lazyRetry(() => import('@/pages/Terms')));
const RefundPolicy = lazy(() => lazyRetry(() => import('@/pages/RefundPolicy')));
const PrivacyPolicy = lazy(() => lazyRetry(() => import('@/pages/PrivacyPolicy')));
const Onboarding = lazy(() => lazyRetry(() => import('@/pages/Onboarding')));
const Programs = lazy(() => lazyRetry(() => import('@/pages/Programs')));
const FAQ = lazy(() => lazyRetry(() => import('@/pages/FAQSection')));
const BlogPost = lazy(() => lazyRetry(() => import('@/pages/BlogPost')));

const AdminLogin = lazy(() => lazyRetry(() => import('@/pages/admin/AdminLogin')));
const AdminLayout = lazy(() => lazyRetry(() => import('@/pages/admin/AdminLayout')));
const AdminGuard = lazy(() => lazyRetry(() => import('@/pages/admin/AdminGuard')));
const AdminDashboard = lazy(() => lazyRetry(() => import('@/pages/admin/AdminDashboard')));
const AdminEnrollments = lazy(() => lazyRetry(() => import('@/pages/admin/AdminEnrollments')));
const AdminAssessments = lazy(() => lazyRetry(() => import('@/pages/admin/AdminAssessments')));

function PageFallback() {
  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'hsl(0 0% 4%)' }}>
      <div style={{ width: 28, height: 28, borderRadius: '50%', border: '2.5px solid rgba(231,23,99,0.2)', borderTopColor: '#e71763', animation: 'fws-spin 0.8s linear infinite' }} />
      <style>{`@keyframes fws-spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

// Simple fade-IN only — no exit animation, no AnimatePresence around the
// route switch. Each page mounts fresh and fades from 0 → 1 opacity.
// Deliberately NOT using AnimatePresence/exit transitions here: that
// combination (exit animation + a lazy/Suspense-loaded incoming route)
// is what caused the intermittent blank-screen bug before. A mount-only
// fade has nothing to "wait" on, so there's no equivalent failure mode.
function PageEnter({ children }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.35, ease: 'easeOut' }}
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

function App() {
  return (
    <Router>
      <RouteErrorBoundary>
        <CustomCursor />
        <ScrollToTop />
        <AnalyticsTracker />
        <Routes>
          {/* ── Public ── */}
          <Route path="/" element={<PageEnter><Landing /></PageEnter>} />
          <Route path="/enroll" element={<LazyRoute><Enroll /></LazyRoute>} />
          <Route path="/payment" element={<LazyRoute><PaymentPage /></LazyRoute>} />
          <Route path="/payment-failed" element={<LazyRoute><PaymentFailed /></LazyRoute>} />
          <Route path="/payment-success" element={<LazyRoute><PaymentSuccess /></LazyRoute>} />
          <Route path="/terms" element={<LazyRoute><Terms /></LazyRoute>} />
          <Route path="/refund-policy" element={<LazyRoute><RefundPolicy /></LazyRoute>} />
          <Route path="/privacy-policy" element={<LazyRoute><PrivacyPolicy /></LazyRoute>} />
          <Route path="/onboarding" element={<LazyRoute><Onboarding /></LazyRoute>} />
          <Route path="/programs" element={<LazyRoute><Programs /></LazyRoute>} />
          <Route path="/faq" element={<LazyRoute><FAQ /></LazyRoute>} />
          <Route path="/blog/:slug" element={<LazyRoute><BlogPost /></LazyRoute>} />

          {/* ── Admin: login (no guard) ── */}
          <Route path="/admin" element={<LazyRoute><AdminLogin /></LazyRoute>} />

          {/* ── Admin: protected pages ── */}
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
            <Route path="dashboard" element={<LazyRoute><AdminDashboard /></LazyRoute>} />
            <Route path="enrollments" element={<LazyRoute><AdminEnrollments /></LazyRoute>} />
            <Route path="assessments" element={<LazyRoute><AdminAssessments /></LazyRoute>} />
            <Route path="*" element={<Navigate to="/admin/dashboard" replace />} />
          </Route>
        </Routes>
      </RouteErrorBoundary>
      <SpeedInsights />
    </Router>
  );
}
export default App;
import { lazy, Suspense } from 'react';

import { BrowserRouter as Router, Route, Routes, Navigate, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { SpeedInsights } from '@vercel/speed-insights/react';
import CustomCursor from '@/components/CustomCursor';
import ScrollToTop from '@/components/ScrollToTop';
import AnalyticsTracker from '@/components/AnalyticsTracker';
import Landing from '@/pages/Landing';
import { lazyRetry } from '@/utils/lazyRetry';
import RouteErrorBoundary from '@/components/RouteErrorBoundary';
const Enroll = lazy(() => import('@/pages/Enroll'));
const PaymentPage = lazy(() => import('@/pages/PaymentPage'));
const PaymentSuccess = lazy(() => import('@/pages/PaymentSuccess'));
const PaymentFailed = lazy(() => import('@/pages/PaymentFailed'));
const Terms = lazy(() => import('@/pages/Terms'));
const RefundPolicy = lazy(() => import('@/pages/RefundPolicy'));
const PrivacyPolicy = lazy(() => import('@/pages/PrivacyPolicy'));
const Onboarding = lazy(() => import('@/pages/Onboarding'));
const Programs = lazy(() => import('@/pages/Programs'));
const FAQ = lazy(() => import('@/pages/FAQSection'));
const BlogPost = lazy(() => import('@/pages/BlogPost'));

const AdminLogin = lazy(() => import('@/pages/admin/AdminLogin'));
const AdminLayout = lazy(() => import('@/pages/admin/AdminLayout'));
const AdminGuard = lazy(() => import('@/pages/admin/AdminGuard'));
const AdminDashboard = lazy(() => import('@/pages/admin/AdminDashboard'));
const AdminEnrollments = lazy(() => import('@/pages/admin/AdminEnrollments'));
const AdminAssessments = lazy(() => import('@/pages/admin/AdminAssessments'));

function PageFallback() {
  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'hsl(0 0% 4%)' }}>
      <div style={{ width: 28, height: 28, borderRadius: '50%', border: '2.5px solid rgba(231,23,99,0.2)', borderTopColor: '#e71763', animation: 'fws-spin 0.8s linear infinite' }} />
      <style>{`@keyframes fws-spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

// Wraps each route's page in a fade so switching routes feels smooth
// instead of an instant hard cut. Duration kept short (0.25s) so it
// still feels snappy, not sluggish.
function PageTransition({ children }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.25, ease: 'easeInOut' }}
    >
      {children}
    </motion.div>
  );
}

function AnimatedRoutes() {
  const location = useLocation();

  return (
    <AnimatePresence mode="wait" initial={false}>
      <Routes location={location} key={location.pathname}>
        {/* ── Public ── */}
        <Route path="/" element={<PageTransition><Landing /></PageTransition>} />
        <Route path="/enroll" element={<PageTransition><Enroll /></PageTransition>} />
        <Route path="/payment" element={<PageTransition><PaymentPage /></PageTransition>} />
        <Route path="/payment-failed" element={<PageTransition><PaymentFailed /></PageTransition>} />
        <Route path="/payment-success" element={<PageTransition><PaymentSuccess /></PageTransition>} />
        <Route path="/terms" element={<PageTransition><Terms /></PageTransition>} />
        <Route path="/refund-policy" element={<PageTransition><RefundPolicy /></PageTransition>} />
        <Route path="/privacy-policy" element={<PageTransition><PrivacyPolicy /></PageTransition>} />
        <Route path="/onboarding" element={<PageTransition><Onboarding /></PageTransition>} />
        <Route path="/programs" element={<PageTransition><Programs /></PageTransition>} />
        <Route path="/faq" element={<PageTransition><FAQ /></PageTransition>} />
        <Route path="/blog/:slug" element={<PageTransition><BlogPost /></PageTransition>} />

        {/* ── Admin: login (no guard) ── */}
        <Route path="/admin" element={<PageTransition><AdminLogin /></PageTransition>} />

        {/* ── Admin: protected pages ── */}
        <Route
          path="/admin"
          element={
            <AdminGuard>
              <AdminLayout />
            </AdminGuard>
          }
        >
          <Route path="dashboard" element={<AdminDashboard />} />
          <Route path="enrollments" element={<AdminEnrollments />} />
          <Route path="assessments" element={<AdminAssessments />} />
          <Route path="*" element={<Navigate to="/admin/dashboard" replace />} />
        </Route>
      </Routes>
    </AnimatePresence>
  );
}

function App() {
  return (
    <Router>
      <CustomCursor />
      <ScrollToTop />
      <AnalyticsTracker />
      <RouteErrorBoundary>
        <Suspense fallback={<PageFallback />}>
          <AnimatedRoutes />
        </Suspense>
      </RouteErrorBoundary>
      <SpeedInsights />
    </Router>
  );
}
export default App;
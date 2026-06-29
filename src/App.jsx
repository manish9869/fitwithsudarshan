import { lazy, Suspense } from 'react';
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import { SpeedInsights } from '@vercel/speed-insights/react';
import CustomCursor from '@/components/CustomCursor';

// Landing stays eager — it's the first thing most visitors see.
import Landing from '@/pages/Landing';

// Everything else loads on demand. None of these are needed for the
// initial paint, so there's no reason to ship their JS upfront.
const Enroll = lazy(() => import('@/pages/Enroll'));
const PaymentPage = lazy(() => import('@/pages/PaymentPage'));
const PaymentSuccess = lazy(() => import('@/pages/PaymentSuccess'));
const PaymentFailed = lazy(() => import('@/pages/PaymentFailed'));
const Terms = lazy(() => import('@/pages/Terms'));
const RefundPolicy = lazy(() => import('@/pages/RefundPolicy'));
const PrivacyPolicy = lazy(() => import('@/pages/PrivacyPolicy'));
const Onboarding = lazy(() => import('@/pages/Onboarding'));
const Programs = lazy(() => import('@/pages/Programs'));

// Admin bundle (recharts, jspdf, xlsx) — only fetched if someone actually
// visits /admin. Public visitors never download a byte of this.
const AdminLogin = lazy(() => import('@/pages/admin/AdminLogin'));
const AdminLayout = lazy(() => import('@/pages/admin/AdminLayout'));
const AdminGuard = lazy(() => import('@/pages/admin/AdminGuard'));
const AdminDashboard = lazy(() => import('@/pages/admin/AdminDashboard'));
const AdminEnrollments = lazy(() => import('@/pages/admin/AdminEnrollments'));
const AdminAssessments = lazy(() => import('@/pages/admin/AdminAssessments'));

function PageFallback() {
  // Minimal, brand-colored — avoids a white flash on the dark theme
  // while a lazy chunk is fetched.
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
      <style>{`@keyframes fws-spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

function App() {
  return (
    <Router>
      {/* Mounted once at the root instead of once-per-page. Skips its own
          listeners entirely on touch devices (see CustomCursor.jsx). */}
      <CustomCursor />

      <Suspense fallback={<PageFallback />}>
        <Routes>
          {/* ── Public ── */}
          <Route path="/" element={<Landing />} />
          <Route path="/enroll" element={<Enroll />} />
          <Route path="/payment" element={<PaymentPage />} />
          <Route path="/payment-failed" element={<PaymentFailed />} />
          <Route path="/payment-success" element={<PaymentSuccess />} />
          <Route path="/terms" element={<Terms />} />
          <Route path="/refund-policy" element={<RefundPolicy />} />
          <Route path="/privacy-policy" element={<PrivacyPolicy />} />
          <Route path="/onboarding" element={<Onboarding />} />
          <Route path="/programs" element={<Programs />} />

          {/* ── Admin: login (no guard) ── */}
          <Route path="/admin" element={<AdminLogin />} />

          {/* ── Admin: protected pages wrap in guard + layout ── */}
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
      </Suspense>

      <SpeedInsights />
    </Router>
  );
}

export default App;

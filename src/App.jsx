import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import Landing from '@/pages/Landing';
import Enroll from '@/pages/Enroll';
import PaymentPage from '@/pages/PaymentPage';
import PaymentSuccess from '@/pages/PaymentSuccess';
import PaymentFailed from '@/pages/PaymentFailed';
import Terms from '@/pages/Terms';
import RefundPolicy from '@/pages/RefundPolicy';
import PrivacyPolicy from '@/pages/PrivacyPolicy';
import Onboarding from '@/pages/Onboarding';

// Admin
import AdminLogin from '@/pages/admin/AdminLogin';
import AdminLayout from '@/pages/admin/AdminLayout';
import AdminGuard from '@/pages/admin/AdminGuard';
import AdminDashboard from '@/pages/admin/AdminDashboard';
import AdminEnrollments from '@/pages/admin/AdminEnrollments';
import AdminAssessments from '@/pages/admin/AdminAssessments';

import { SpeedInsights } from '@vercel/speed-insights/react';

function App() {
  return (
    <Router>
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
          {/* Catch any unknown /admin/* and send back to dashboard */}
          <Route path="*" element={<Navigate to="/admin/dashboard" replace />} />
        </Route>
      </Routes>
      <SpeedInsights />
    </Router>
  );
}

export default App;
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import Landing from '@/pages/Landing';
import Enroll from '@/pages/Enroll';
import PaymentPage from '@/pages/PaymentPage';
import { SpeedInsights } from '@vercel/speed-insights/react'
function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/enroll" element={<Enroll />} />
        <Route path="/payment" element={<PaymentPage />} />
      </Routes>
      <SpeedInsights />
    </Router>
  );
}

export default App;
import React, { useEffect } from 'react';
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import Join from './pages/Join';
import VIPCard from './pages/VIPCard';
import StaffScanner from './pages/StaffScanner';
import StaffLogin from './pages/StaffLogin';
import StaffDashboard from './pages/StaffDashboard';

const App: React.FC = () => {
  const navigate = useNavigate();
  const location = window.location.pathname;

  useEffect(() => {
    // 1. ISOLATION: Don't run customer login logic on staff routes
    if (location.startsWith('/staff')) return;

    // 2. SMART /VIP HANDLER
    if (location === '/vip') {
      const savedId = localStorage.getItem('vip_member_id');
      if (savedId) {
        navigate(`/card/${savedId}`, { replace: true });
      } else {
        navigate('/join', { replace: true });
      }
      return;
    }

    // 3. AUTO-LOGIN ON ROOT/JOIN
    if (location === '/' || location === '/join') {
      const savedId = localStorage.getItem('vip_member_id');
      if (savedId) {
        navigate(`/card/${savedId}`, { replace: true });
      }
    }
  }, [location, navigate]);

  return (
    <div className="app-container">
      <Routes>
        <Route path="/" element={<Navigate to="/join" replace />} />
        <Route path="/vip" element={<div className="min-h-screen bg-[#050408]"></div>} />
        <Route path="/join" element={<Join />} />
        <Route path="/card/:id" element={<VIPCard />} />
        <Route path="/staff" element={<StaffLogin />} />
        <Route path="/staff/:business" element={<StaffDashboard />} />
        <Route path="/staff/scan/:business" element={<StaffScanner />} />
      </Routes>
    </div>
  );
}

// Minimal Staff Landing to remember business
const StaffLanding = () => {
  const navigate = useNavigate();
  useEffect(() => {
    const lastBiz = localStorage.getItem('vip_staff_business');
    if (lastBiz) {
      navigate(`/staff/${lastBiz}`, { replace: true });
    } else {
      // Default to coffee if nothing found
      navigate('/staff/coffee', { replace: true });
    }
  }, [navigate]);
  return <div className="min-h-screen bg-[#050408]"></div>;
}

export default App;

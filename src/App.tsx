import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import Join from './pages/Join';
import VIPCard from './pages/VIPCard';
import StaffScanner from './pages/StaffScanner';

const App: React.FC = () => {
  // MODE DETECTION: Separate Customer vs Staff identities for PWA installs
  const params = new URLSearchParams(window.location.search);
  const APP_MODE = params.get('mode') ||
    (window.location.pathname.startsWith('/staff') ? 'staff' : 'member');

  const navigate = useNavigate();

  useEffect(() => {
    // Only trigger customer auto-login if in member mode
    if (APP_MODE === 'member') {
      const savedId = localStorage.getItem('odancia_member_id');
      if (savedId && (window.location.pathname === '/' || window.location.pathname === '/join')) {
        navigate(`/card/${savedId}`, { replace: true });
      }
    }
  }, [APP_MODE, navigate]);

  return (
    <Router>
      <div className="app-container">
        <Routes>
          <Route path="/" element={<Navigate to="/join" replace />} />
          <Route path="/vip" element={<Navigate to="/join" replace />} />
          <Route path="/join" element={<Join />} />
          <Route path="/card/:id" element={<VIPCard />} />
          <Route path="/staff" element={<Navigate to="/staff/coffee" replace />} />
          <Route path="/staff/:business" element={<StaffScanner />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;

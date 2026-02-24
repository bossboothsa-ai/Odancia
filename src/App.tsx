import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Join from './pages/Join';
import VIPCard from './pages/VIPCard';

import StaffScanner from './pages/StaffScanner';

function App() {
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

import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Join from './pages/Join';
import VIPCard from './pages/VIPCard';
import StaffLogin from './pages/StaffLogin';
import StaffScanner from './pages/StaffScanner';

function App() {
  return (
    <Router>
      <div className="app-container">
        <Routes>
          <Route path="/" element={<Navigate to="/join" replace />} />
          <Route path="/join" element={<Join />} />
          <Route path="/card/:id" element={<VIPCard />} />
          <Route path="/staff" element={<StaffLogin />} />
          <Route path="/staff/:business" element={<StaffScanner />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;

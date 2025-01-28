import React from 'react'; // Add React import
import { Routes, Route } from 'react-router-dom';
import BirdDashboard from './components/BirdDashboard.tsx';

function App() {
  return (
    <Routes>
      <Route path="/" element={<BirdDashboard />} />
      {/* Add 404 fallback */}
      <Route path="*" element={<div>404 Not Found</div>} />
    </Routes>
  );
}

export default App;
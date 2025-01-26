import React from 'react';
import ReactDOM from 'react-dom/client';
import BirdDashboard from './components/BirdDashboard.tsx';

const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);

root.render(
  <React.StrictMode>
    <div className="App">
      <BirdDashboard />
    </div>
  </React.StrictMode>
);
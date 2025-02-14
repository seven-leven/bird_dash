// App.tsx
import React from "react";
import ReactDOM from "react-dom/client";
import { HashRouter, Route, Routes } from "react-router-dom";
import BirdDashboard from "./BirdDashboard.tsx";

// Main app component
function App() {
  return (
    <Routes>
      <Route path="/" element={<BirdDashboard />} />
      <Route path="*" element={<div>404 Not Found</div>} />
    </Routes>
  );
}

// Root rendering logic
const root = ReactDOM.createRoot(
  document.getElementById("root") as HTMLElement,
);

root.render(
  <React.StrictMode>
    <HashRouter>
      <App />
    </HashRouter>
  </React.StrictMode>,
);

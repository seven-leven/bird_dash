// src/Index.tsx
import React, { FC } from "react";
import ReactDOM from "react-dom/client";
import { HashRouter, Route, Routes } from "react-router-dom";
import BirdDashboard from "./BirdDashboard.tsx";

const NotFound: FC = () => (
  <main style={{ padding: "1rem" }}>
    <h1>404 Not Found</h1>
    <p>The page you're looking for does not exist.</p>
  </main>
);

const App: FC = () => (
  <Routes>
    <Route path="/" element={<BirdDashboard />} />
    <Route path="*" element={<NotFound />} />
  </Routes>
);

const rootElement = document.getElementById("root");
if (!rootElement) {
  throw new Error(
    "Root element not found. Please ensure there is an element with id 'root'.",
  );
}

const root = ReactDOM.createRoot(rootElement);

root.render(
  <React.StrictMode>
    <HashRouter>
      <App />
    </HashRouter>
  </React.StrictMode>,
);


import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { UnifiedAuthProvider } from './contexts/UnifiedAuthProvider';
import { registerSW } from './utils/pwa';

// Register service worker for PWA
registerSW();

createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <UnifiedAuthProvider>
      <App />
    </UnifiedAuthProvider>
  </React.StrictMode>
);

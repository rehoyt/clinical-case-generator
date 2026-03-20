import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

console.log("%c[ClinicalCaseAI] VERSION 2.3 - DIAGNOSTICS ACTIVE", "color: #2563eb; font-weight: bold; font-size: 14px;");
console.log("[ClinicalCaseAI] Build Time:", new Date().toISOString());

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);

import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
// import App from './App';
import './index.css';
import { LeitorAdmin } from './pages/LeitorAdmin';

createRoot(document.getElementById('root') as HTMLElement).render(
  <StrictMode>
    <LeitorAdmin />
  </StrictMode>
);

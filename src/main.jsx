import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, HashRouter } from 'react-router-dom';
import { HASH_ROUTES } from './routes.js';
import App from './App.jsx';
import '@fontsource/instrument-serif/latin-400.css';
import '@fontsource-variable/geist/index.css';
import './styles.css';

// Old links (blik.design/#/work/decibuy) keep working: move them to the real path.
if (!HASH_ROUTES && window.location.hash.startsWith('#/')) {
  window.history.replaceState(null, '', window.location.hash.slice(1) || '/');
}
const Router = HASH_ROUTES ? HashRouter : BrowserRouter;

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <Router>
      <App />
    </Router>
  </React.StrictMode>
);

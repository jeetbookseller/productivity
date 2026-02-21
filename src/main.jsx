import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import './styles/index.css';
import { registerSW } from './lib/sw-utils.js';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

// Only register SW in production — import.meta.env.BASE_URL = '/productivity/' at build time
if (import.meta.env.PROD) {
  registerSW(import.meta.env.BASE_URL);
}

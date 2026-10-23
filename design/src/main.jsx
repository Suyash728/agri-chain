import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './index.css'

// Dynamic host rewrite for mobile / LAN devices accessing from external IP:
if (typeof window !== 'undefined') {
  const originalFetch = window.fetch;
  window.fetch = function (input, init) {
    const hostname = window.location.hostname;
    if (hostname && hostname !== 'localhost' && hostname !== '127.0.0.1') {
      if (typeof input === 'string') {
        input = input.replace(/http:\/\/(localhost|127\.0\.0\.1):8000/g, `http://${hostname}:8000`);
      } else if (input instanceof Request && input.url.includes(':8000')) {
        const newUrl = input.url.replace(/http:\/\/(localhost|127\.0\.0\.1):8000/g, `http://${hostname}:8000`);
        input = new Request(newUrl, input);
      }
    }
    return originalFetch.call(this, input, init);
  };
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)

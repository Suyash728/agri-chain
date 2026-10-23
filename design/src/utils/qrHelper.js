/**
 * Universal QR & LAN Network Helper for AgriChain
 * Ensures QR codes generate cross-device accessible URLs that work
 * seamlessly when scanned from a mobile phone on the same Wi-Fi / LAN network.
 */

let cachedLanHost = '192.168.1.102';
let cachedPort = '3000';

// Check if current browser window is already on LAN IP
if (typeof window !== 'undefined' && window.location) {
  const host = window.location.hostname;
  if (host && host !== 'localhost' && host !== '127.0.0.1') {
    cachedLanHost = host;
    cachedPort = window.location.port || '3000';
  }
}

// Dynamically fetch network info from backend if on localhost
if (typeof window !== 'undefined') {
  fetch('http://localhost:8000/network/info')
    .then((res) => (res.ok ? res.json() : null))
    .then((info) => {
      if (info?.lan_ip) {
        cachedLanHost = info.lan_ip;
        if (info.frontend_port) cachedPort = String(info.frontend_port);
      }
    })
    .catch(() => {});
}

/**
 * Returns the base URL accessible by external mobile devices on the LAN.
 */
export function getLanClientBaseUrl() {
  if (typeof window !== 'undefined' && window.location) {
    const host = window.location.hostname;
    if (host && host !== 'localhost' && host !== '127.0.0.1') {
      return `${window.location.protocol}//${host}${window.location.port ? `:${window.location.port}` : ''}`;
    }
  }
  return `http://${cachedLanHost}:${cachedPort}`;
}

/**
 * Generates the target URL that opens the consumer provenance passport for a batch.
 */
export function getBatchConsumerPassportUrl(batchId) {
  const base = getLanClientBaseUrl();
  const cleanBatch = encodeURIComponent(batchId || 'BATCH-001');
  return `${base}/?role=consumer&tab=journey&batch=${cleanBatch}`;
}

/**
 * Generates the QR image source URL using api.qrserver.com.
 */
export function getBatchQRCodeImageUrl(batchId, size = 260) {
  const targetUrl = getBatchConsumerPassportUrl(batchId);
  return `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encodeURIComponent(targetUrl)}`;
}

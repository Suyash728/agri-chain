/**
 * AgriChain Unified API Network Configuration & Safe Client
 * Provides centralized base URL configuration with Vite environment variable support,
 * timeout handling, and consistent JSON error propagation.
 */

export const API_BASE_URL = (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_API_BASE_URL)
  ? import.meta.env.VITE_API_BASE_URL
  : (typeof window !== 'undefined' && window.location && window.location.hostname && window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1')
    ? `http://${window.location.hostname}:8000`
    : 'http://localhost:8000';

/**
 * Safe fetch wrapper with default timeout and unified error parsing.
 * 
 * @param {string} endpoint - Relative API path (e.g. '/farmer/kpis') or absolute URL.
 * @param {RequestInit} [options={}] - Standard fetch options.
 * @param {number} [timeoutMs=15000] - Request timeout in milliseconds.
 * @returns {Promise<any>}
 */
export async function apiRequest(endpoint, options = {}, timeoutMs = 15000) {
  const url = endpoint.startsWith('http') ? endpoint : `${API_BASE_URL}${endpoint.startsWith('/') ? '' : '/'}${endpoint}`;
  
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, {
      ...options,
      signal: options.signal || controller.signal,
      headers: {
        'Content-Type': 'application/json',
        ...(options.headers || {}),
      },
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      let errorDetail = `API Request failed with status ${response.status}`;
      try {
        const errJson = await response.json();
        errorDetail = errJson.detail || errJson.message || errorDetail;
      } catch (_) {
        try {
          const errText = await response.text();
          if (errText) errorDetail = errText;
        } catch (_) {}
      }
      const err = new Error(errorDetail);
      err.status = response.status;
      throw err;
    }

    // Parse JSON safely
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      return await response.json();
    }
    return await response.text();
  } catch (error) {
    clearTimeout(timeoutId);
    if (error.name === 'AbortError') {
      const timeoutErr = new Error(`Request timed out after ${timeoutMs}ms for ${url}`);
      timeoutErr.status = 408;
      throw timeoutErr;
    }
    throw error;
  }
}

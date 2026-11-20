// Browser storage is a per-viewer convenience (remembered tab, address, read notifications).
// It can be full, disabled in private mode or blocked by site settings, so every access is
// wrapped here once: callers carry on without it, and the first failure is logged, not hidden.
let warned = false;

function warnOnce(action, key, err) {
  if (warned) return;
  warned = true;
  console.warn(`localStorage ${action}("${key}") failed; preferences won't persist this session.`, err);
}

export function storageGet(key) {
  try {
    return localStorage.getItem(key);
  } catch (err) {
    warnOnce('getItem', key, err);
    return null;
  }
}

export function storageSet(key, value) {
  try {
    localStorage.setItem(key, value);
  } catch (err) {
    warnOnce('setItem', key, err);
  }
}

export function storageRemove(key) {
  try {
    localStorage.removeItem(key);
  } catch (err) {
    warnOnce('removeItem', key, err);
  }
}

export function storageKeys() {
  try {
    return Object.keys(localStorage);
  } catch (err) {
    warnOnce('keys', '*', err);
    return [];
  }
}

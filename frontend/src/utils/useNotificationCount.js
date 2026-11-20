import { useState, useEffect, useCallback } from 'react';
import { API_BASE_URL } from './api';
import { storageKeys, storageRemove, storageSet } from './storage';

export function useNotificationCount(role = 'all') {
  const [count, setCount] = useState(0);
  const normalizedRole = role || 'all';
  const storageKey = `agrichain_read_notifs_${normalizedRole}`;

  const getReadIds = useCallback(() => {
    try {
      const stored = localStorage.getItem(storageKey);
      return stored ? new Set(JSON.parse(stored)) : new Set();
    } catch (_) {
      return new Set();
    }
  }, [storageKey]);

  const refreshCount = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/notifications/all-users?role=${normalizedRole}`);
      if (res.ok) {
        const list = await res.json();
        if (Array.isArray(list)) {
          const readIds = getReadIds();
          const unread = list.filter((n) => !readIds.has(n.id));
          setCount(unread.length);
          return;
        }
      }

      // Fallback endpoint if list is not returned
      const countRes = await fetch(`${API_BASE_URL}/notifications/count?role=${normalizedRole}`);
      if (countRes.ok) {
        const cData = await countRes.json();
        setCount(typeof cData.count === 'number' ? cData.count : 0);
      }
    } catch (err) {
      // Keep the existing count on transient network failures.
      console.warn('Notification count refresh failed:', err);
    }
  }, [normalizedRole, getReadIds]);

  const markAllAsRead = useCallback(async () => {
    setCount(0);
    window.dispatchEvent(new CustomEvent('agrichain-notifications-read', { detail: { role: normalizedRole } }));
    try {
      const res = await fetch(`${API_BASE_URL}/notifications/all-users?role=${normalizedRole}`);
      if (res.ok) {
        const list = await res.json();
        if (Array.isArray(list)) {
          const allIds = list.map((n) => n.id);
          storageSet(storageKey, JSON.stringify(allIds));
        }
      }
    } catch (err) {
      // The badge is already cleared locally; only the server-side read list failed to load.
      console.warn('Could not load notifications to mark them read:', err);
    }
  }, [normalizedRole, storageKey]);

  useEffect(() => {
    refreshCount();

    const handleReset = () => {
      storageKeys()
        .filter((key) => key.startsWith('agrichain_read_notifs_'))
        .forEach(storageRemove);
      setCount(0);
    };

    const handleUpdate = () => {
      refreshCount();
    };

    const handleNotificationsRead = (e) => {
      if (!e.detail?.role || e.detail.role === normalizedRole || e.detail.role === 'all') {
        setCount(0);
      }
    };

    window.addEventListener('agrichain-data-reset', handleReset);
    window.addEventListener('agrichain-data-updated', handleUpdate);
    window.addEventListener('agrichain-notifications-read', handleNotificationsRead);

    const interval = setInterval(refreshCount, 15000);

    return () => {
      window.removeEventListener('agrichain-data-reset', handleReset);
      window.removeEventListener('agrichain-data-updated', handleUpdate);
      window.removeEventListener('agrichain-notifications-read', handleNotificationsRead);
      clearInterval(interval);
    };
  }, [refreshCount, storageKey, normalizedRole]);

  return { count, refreshCount, markAllAsRead };
}

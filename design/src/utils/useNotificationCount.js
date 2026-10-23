import { useState, useEffect, useCallback } from 'react';
import { API_BASE_URL } from './api';

export function useNotificationCount(role) {
  const [count, setCount] = useState(0);

  const refreshCount = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/notifications/count?role=${role || 'all'}`);
      if (res.ok) {
        const data = await res.json();
        setCount(typeof data.count === 'number' ? data.count : 0);
      }
    } catch (_) {
      // Keep existing state on transient network failures
    }
  }, [role]);

  useEffect(() => {
    refreshCount();

    const handleReset = () => {
      setCount(0);
      refreshCount();
    };

    const handleUpdate = () => {
      refreshCount();
    };

    window.addEventListener('agrichain-data-reset', handleReset);
    window.addEventListener('agrichain-data-updated', handleUpdate);

    const interval = setInterval(refreshCount, 15000);

    return () => {
      window.removeEventListener('agrichain-data-reset', handleReset);
      window.removeEventListener('agrichain-data-updated', handleUpdate);
      clearInterval(interval);
    };
  }, [refreshCount]);

  return { count, refreshCount };
}

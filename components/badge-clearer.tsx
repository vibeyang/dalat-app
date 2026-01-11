'use client';

import { useEffect } from 'react';

/**
 * Clears the app badge when the user opens the app.
 * This ensures the +1 counter resets when they view notifications.
 */
export function BadgeClearer() {
  useEffect(() => {
    // Clear badge when app becomes visible
    const clearBadge = () => {
      if ('clearAppBadge' in navigator) {
        navigator.clearAppBadge().catch(() => {});
      }
    };

    // Clear on mount (app opened)
    clearBadge();

    // Clear when app becomes visible (tab focused or PWA resumed)
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        clearBadge();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  return null;
}

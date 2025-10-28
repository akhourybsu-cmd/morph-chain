import { useEffect, useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { toast as sonnerToast } from 'sonner';

interface VersionInfo {
  version: string;
  timestamp: string;
  buildTime: number;
}

export const useVersionCheck = () => {
  const [currentVersion, setCurrentVersion] = useState<string | null>(null);
  const [updatePending, setUpdatePending] = useState(false);

  const performUpdate = () => {
    // Clear service worker cache if exists
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.getRegistrations().then((registrations) => {
        registrations.forEach((registration) => registration.unregister());
      });
    }
    
    // Clear browser cache and reload
    window.location.reload();
  };

  const checkVersion = async () => {
    try {
      // Add cache-busting parameter to ensure fresh data
      const response = await fetch(`/version.json?t=${Date.now()}`, {
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
        }
      });
      const data: VersionInfo = await response.json();

      if (currentVersion === null) {
        // First load - just store the version
        setCurrentVersion(data.timestamp);
      } else if (data.timestamp !== currentVersion && !updatePending) {
        // Version changed - notify user non-intrusively
        setUpdatePending(true);

        // Show non-intrusive notification with action button
        sonnerToast('🎮 Update Available', {
          description: "New features ready! The app will refresh automatically in 10 seconds.",
          duration: 10000,
          action: {
            label: "Update Now",
            onClick: performUpdate,
          },
        });

        // Auto-refresh after 10 seconds
        setTimeout(() => {
          performUpdate();
        }, 10000);
      }
    } catch (error) {
      // Silently fail - don't disrupt user experience
      console.debug('Version check skipped:', error);
    }
  };

  useEffect(() => {
    // Check immediately on mount
    checkVersion();

    // Then check every 3 minutes (more frequent for faster updates)
    const interval = setInterval(checkVersion, 3 * 60 * 1000);

    // Also check when page becomes visible (user returns to tab)
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        checkVersion();
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      clearInterval(interval);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [currentVersion, updatePending]);

  return { checkVersion };
};

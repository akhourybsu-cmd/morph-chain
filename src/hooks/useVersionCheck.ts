import { useEffect, useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';

interface VersionInfo {
  version: string;
  timestamp: string;
}

export const useVersionCheck = () => {
  const [currentVersion, setCurrentVersion] = useState<string | null>(null);
  const { toast } = useToast();

  const checkVersion = async () => {
    try {
      // Add cache-busting parameter to ensure fresh data
      const response = await fetch(`/version.json?t=${Date.now()}`);
      const data: VersionInfo = await response.json();

      if (currentVersion === null) {
        // First load - just store the version
        setCurrentVersion(data.timestamp);
      } else if (data.timestamp !== currentVersion) {
        // Version changed - notify user
        const handleRefresh = () => {
          window.location.reload();
        };

        toast({
          title: "Update Available",
          description: "A new version is available. Refresh to update.",
          duration: 0,
        });

        // Auto-refresh after 3 seconds if user doesn't dismiss
        setTimeout(handleRefresh, 3000);
      }
    } catch (error) {
      console.error('Failed to check version:', error);
    }
  };

  useEffect(() => {
    // Check immediately on mount
    checkVersion();

    // Then check every 5 minutes
    const interval = setInterval(checkVersion, 5 * 60 * 1000);

    return () => clearInterval(interval);
  }, [currentVersion]);

  return { checkVersion };
};

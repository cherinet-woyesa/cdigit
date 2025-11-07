import { useState, useEffect } from 'react';

/**
 * Hook to detect online/offline status
 * Returns true if online, false if offline
 */
export const useOnlineStatus = () => {
  const [isOnline, setIsOnline] = useState<boolean>(
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );

  useEffect(() => {
    const handleOnline = () => {
      console.log('Network status: Online');
      setIsOnline(true);
    };

    const handleOffline = () => {
      console.log('Network status: Offline');
      setIsOnline(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // More reliable connection check using a simple HTTP request
    const checkConnection = async () => {
      // Only check if browser thinks we're online
      if (!navigator.onLine) {
        setIsOnline(false);
        return;
      }

      try {
        // Use a more reliable endpoint for connection testing
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout
        
        const response = await fetch('https://www.google.com/favicon.ico', {
          method: 'HEAD',
          mode: 'no-cors', // Avoid CORS issues
          cache: 'no-cache',
          signal: controller.signal,
        });
        
        clearTimeout(timeoutId);
        
        // For no-cors requests, we can't check response.ok, but if we reach here, we're online
        setIsOnline(true);
      } catch (error) {
        // Only set offline if the browser also thinks we're offline
        if (!navigator.onLine) {
          setIsOnline(false);
        }
        // Otherwise, trust the browser's online status
      }
    };

    // Initial check after a small delay
    const initialCheckTimeout = setTimeout(() => {
      checkConnection();
    }, 1000);

    // Check every 60 seconds (less frequent to avoid false negatives)
    const intervalId = setInterval(checkConnection, 60000);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      clearTimeout(initialCheckTimeout);
      clearInterval(intervalId);
    };
  }, []);

  return isOnline;
};

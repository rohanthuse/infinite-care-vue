import { useState, useEffect } from 'react';

interface OfflineStorageOptions {
  key: string;
  expiry?: number; // in milliseconds
}

export const useOfflineStorage = <T>(options: OfflineStorageOptions) => {
  const { key, expiry = 24 * 60 * 60 * 1000 } = options; // 24 hours default
  const [data, setData] = useState<T | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const storageKey = `offline_${key}`;
  const expiryKey = `offline_${key}_expiry`;

  useEffect(() => {
    const loadFromStorage = () => {
      try {
        const storedData = localStorage.getItem(storageKey);
        const storedExpiry = localStorage.getItem(expiryKey);

        if (storedData && storedExpiry) {
          const expiryTime = parseInt(storedExpiry, 10);
          const now = Date.now();

          if (now < expiryTime) {
            setData(JSON.parse(storedData));
          } else {
            // Data expired, remove it
            localStorage.removeItem(storageKey);
            localStorage.removeItem(expiryKey);
          }
        }
      } catch (error) {
        console.error('Error loading offline data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadFromStorage();
  }, [storageKey, expiryKey]);

  const saveData = (newData: T) => {
    try {
      const expiryTime = Date.now() + expiry;
      localStorage.setItem(storageKey, JSON.stringify(newData));
      localStorage.setItem(expiryKey, expiryTime.toString());
      setData(newData);
    } catch (error) {
      console.error('Error saving offline data:', error);
    }
  };

  const clearData = () => {
    try {
      localStorage.removeItem(storageKey);
      localStorage.removeItem(expiryKey);
      setData(null);
    } catch (error) {
      console.error('Error clearing offline data:', error);
    }
  };

  const isExpired = () => {
    try {
      const storedExpiry = localStorage.getItem(expiryKey);
      if (!storedExpiry) return true;
      
      const expiryTime = parseInt(storedExpiry, 10);
      return Date.now() >= expiryTime;
    } catch {
      return true;
    }
  };

  return {
    data,
    isLoading,
    saveData,
    clearData,
    isExpired,
  };
};
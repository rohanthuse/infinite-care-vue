import React, { useState, useEffect } from 'react';
import { Wifi, WifiOff } from 'lucide-react';
import { Card } from '@/components/ui/card';

export const OfflineIndicator = () => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [showNotification, setShowNotification] = useState(false);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      setShowNotification(true);
      // Auto-hide after 3 seconds
      setTimeout(() => setShowNotification(false), 3000);
    };

    const handleOffline = () => {
      setIsOnline(false);
      setShowNotification(true);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  if (!showNotification) {
    return null;
  }

  return (
    <Card className={`fixed top-4 right-4 z-50 p-3 shadow-lg animate-fade-in ${
      isOnline ? 'bg-green-50 border-green-200' : 'bg-orange-50 border-orange-200'
    }`}>
      <div className="flex items-center space-x-2">
        {isOnline ? (
          <Wifi className="w-4 h-4 text-green-600" />
        ) : (
          <WifiOff className="w-4 h-4 text-orange-600" />
        )}
        <span className={`text-sm font-medium ${
          isOnline ? 'text-green-800' : 'text-orange-800'
        }`}>
          {isOnline ? 'Back online' : 'You\'re offline'}
        </span>
      </div>
      {!isOnline && (
        <p className="text-xs text-orange-600 mt-1">
          Some features may be limited
        </p>
      )}
    </Card>
  );
};
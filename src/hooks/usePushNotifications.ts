import { 
  PushNotifications, 
  Token, 
  PushNotificationSchema, 
  ActionPerformed 
} from '@capacitor/push-notifications';
import { Capacitor } from '@capacitor/core';
import { useState, useCallback, useEffect } from 'react';

export interface PushNotificationData {
  id: string;
  title?: string;
  body?: string;
  data?: Record<string, any>;
}

export interface UsePushNotificationsResult {
  token: string | null;
  isRegistered: boolean;
  isLoading: boolean;
  error: string | null;
  lastNotification: PushNotificationData | null;
  register: () => Promise<string | null>;
  addNotificationListener: (callback: (notification: PushNotificationData) => void) => void;
  addActionListener: (callback: (action: ActionPerformed) => void) => void;
  removeAllListeners: () => Promise<void>;
  isNativePush: boolean;
}

/**
 * Hook for managing push notifications using Capacitor Push Notifications plugin
 * Used for real-time alerts for carers (new bookings, schedule changes, messages)
 */
export const usePushNotifications = (): UsePushNotificationsResult => {
  const [token, setToken] = useState<string | null>(null);
  const [isRegistered, setIsRegistered] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastNotification, setLastNotification] = useState<PushNotificationData | null>(null);

  const isNativePush = Capacitor.isNativePlatform();

  // Initialize listeners on mount for native platforms
  useEffect(() => {
    if (!isNativePush) return;

    const setupListeners = async () => {
      // Registration success listener
      await PushNotifications.addListener('registration', (token: Token) => {
        console.log('[Push] Registration successful, token:', token.value);
        setToken(token.value);
        setIsRegistered(true);
      });

      // Registration error listener
      await PushNotifications.addListener('registrationError', (error) => {
        console.error('[Push] Registration error:', error);
        setError(error.error);
        setIsRegistered(false);
      });

      // Notification received while app is in foreground
      await PushNotifications.addListener('pushNotificationReceived', (notification: PushNotificationSchema) => {
        console.log('[Push] Notification received:', notification);
        setLastNotification({
          id: notification.id,
          title: notification.title,
          body: notification.body,
          data: notification.data
        });
      });

      // Notification action performed (user tapped notification)
      await PushNotifications.addListener('pushNotificationActionPerformed', (action: ActionPerformed) => {
        console.log('[Push] Notification action performed:', action);
        setLastNotification({
          id: action.notification.id,
          title: action.notification.title,
          body: action.notification.body,
          data: action.notification.data
        });
      });
    };

    setupListeners();

    return () => {
      PushNotifications.removeAllListeners();
    };
  }, [isNativePush]);

  const register = useCallback(async (): Promise<string | null> => {
    if (!isNativePush) {
      console.log('[Push] Not on native platform, skipping registration');
      return null;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Check current permission status
      let permStatus = await PushNotifications.checkPermissions();
      
      if (permStatus.receive === 'prompt') {
        // Request permission
        permStatus = await PushNotifications.requestPermissions();
      }

      if (permStatus.receive !== 'granted') {
        throw new Error('Push notification permission denied');
      }

      // Register with Apple/Google to receive push
      await PushNotifications.register();

      // Token will be set via the 'registration' listener
      // Return null here, token available via hook state
      return null;
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to register for push notifications';
      setError(errorMessage);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [isNativePush]);

  const addNotificationListener = useCallback((
    callback: (notification: PushNotificationData) => void
  ) => {
    if (!isNativePush) return;

    PushNotifications.addListener('pushNotificationReceived', (notification: PushNotificationSchema) => {
      callback({
        id: notification.id,
        title: notification.title,
        body: notification.body,
        data: notification.data
      });
    });
  }, [isNativePush]);

  const addActionListener = useCallback((callback: (action: ActionPerformed) => void) => {
    if (!isNativePush) return;

    PushNotifications.addListener('pushNotificationActionPerformed', callback);
  }, [isNativePush]);

  const removeAllListeners = useCallback(async () => {
    await PushNotifications.removeAllListeners();
  }, []);

  return {
    token,
    isRegistered,
    isLoading,
    error,
    lastNotification,
    register,
    addNotificationListener,
    addActionListener,
    removeAllListeners,
    isNativePush
  };
};

/**
 * Types of push notifications for carer app
 */
export type CarerNotificationType = 
  | 'new_booking'
  | 'booking_cancelled'
  | 'booking_updated'
  | 'schedule_reminder'
  | 'new_message'
  | 'urgent_alert'
  | 'timesheet_reminder'
  | 'document_request';

/**
 * Interface for carer-specific notification payloads
 */
export interface CarerNotificationPayload {
  type: CarerNotificationType;
  bookingId?: string;
  clientId?: string;
  messageId?: string;
  timestamp: string;
  priority: 'low' | 'normal' | 'high' | 'urgent';
}

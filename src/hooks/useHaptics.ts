import { Haptics, ImpactStyle, NotificationType } from '@capacitor/haptics';
import { Capacitor } from '@capacitor/core';
import { useCallback } from 'react';

export interface UseHapticsResult {
  impact: (style?: ImpactStyle) => Promise<void>;
  notification: (type?: NotificationType) => Promise<void>;
  vibrate: (duration?: number) => Promise<void>;
  selectionStart: () => Promise<void>;
  selectionChanged: () => Promise<void>;
  selectionEnd: () => Promise<void>;
  isNativeHaptics: boolean;
}

/**
 * Hook for haptic feedback using Capacitor Haptics plugin
 * Provides tactile feedback for button presses, success/error states, etc.
 */
export const useHaptics = (): UseHapticsResult => {
  const isNativeHaptics = Capacitor.isNativePlatform();

  /**
   * Trigger impact haptic feedback
   * @param style - Impact intensity: Light, Medium, or Heavy
   */
  const impact = useCallback(async (style: ImpactStyle = ImpactStyle.Medium): Promise<void> => {
    if (!isNativeHaptics) return;
    
    try {
      await Haptics.impact({ style });
    } catch (err) {
      console.warn('[Haptics] Impact failed:', err);
    }
  }, [isNativeHaptics]);

  /**
   * Trigger notification haptic feedback
   * @param type - Notification type: Success, Warning, or Error
   */
  const notification = useCallback(async (type: NotificationType = NotificationType.Success): Promise<void> => {
    if (!isNativeHaptics) return;
    
    try {
      await Haptics.notification({ type });
    } catch (err) {
      console.warn('[Haptics] Notification failed:', err);
    }
  }, [isNativeHaptics]);

  /**
   * Trigger vibration for a specified duration
   * @param duration - Vibration duration in milliseconds (default: 300)
   */
  const vibrate = useCallback(async (duration = 300): Promise<void> => {
    if (!isNativeHaptics) return;
    
    try {
      await Haptics.vibrate({ duration });
    } catch (err) {
      console.warn('[Haptics] Vibrate failed:', err);
    }
  }, [isNativeHaptics]);

  /**
   * Selection feedback methods for drag/scroll interactions
   */
  const selectionStart = useCallback(async (): Promise<void> => {
    if (!isNativeHaptics) return;
    
    try {
      await Haptics.selectionStart();
    } catch (err) {
      console.warn('[Haptics] Selection start failed:', err);
    }
  }, [isNativeHaptics]);

  const selectionChanged = useCallback(async (): Promise<void> => {
    if (!isNativeHaptics) return;
    
    try {
      await Haptics.selectionChanged();
    } catch (err) {
      console.warn('[Haptics] Selection changed failed:', err);
    }
  }, [isNativeHaptics]);

  const selectionEnd = useCallback(async (): Promise<void> => {
    if (!isNativeHaptics) return;
    
    try {
      await Haptics.selectionEnd();
    } catch (err) {
      console.warn('[Haptics] Selection end failed:', err);
    }
  }, [isNativeHaptics]);

  return {
    impact,
    notification,
    vibrate,
    selectionStart,
    selectionChanged,
    selectionEnd,
    isNativeHaptics
  };
};

/**
 * Pre-configured haptic patterns for common carer app actions
 */
export const hapticPatterns = {
  /** Light tap for button presses */
  buttonTap: () => Haptics.impact({ style: ImpactStyle.Light }),
  
  /** Medium tap for important actions */
  actionTap: () => Haptics.impact({ style: ImpactStyle.Medium }),
  
  /** Success feedback for completed actions */
  success: () => Haptics.notification({ type: NotificationType.Success }),
  
  /** Warning feedback for cautionary states */
  warning: () => Haptics.notification({ type: NotificationType.Warning }),
  
  /** Error feedback for failed actions */
  error: () => Haptics.notification({ type: NotificationType.Error }),
  
  /** Heavy impact for check-in/check-out confirmation */
  checkInOut: () => Haptics.impact({ style: ImpactStyle.Heavy }),
};

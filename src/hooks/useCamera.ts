import { Camera, CameraResultType, CameraSource, Photo } from '@capacitor/camera';
import { Capacitor } from '@capacitor/core';
import { useState, useCallback } from 'react';

export interface CapturedPhoto {
  dataUrl: string;
  format: string;
  webPath?: string;
  exif?: any;
  base64String?: string;
}

export interface UseCameraResult {
  photo: CapturedPhoto | null;
  isLoading: boolean;
  error: string | null;
  takePhoto: () => Promise<CapturedPhoto | null>;
  pickFromGallery: () => Promise<CapturedPhoto | null>;
  clearPhoto: () => void;
  isNativeCamera: boolean;
}

/**
 * Hook for capturing photos using Capacitor Camera plugin
 * Automatically uses native camera on iOS/Android, falls back to file input on web
 */
export const useCamera = (): UseCameraResult => {
  const [photo, setPhoto] = useState<CapturedPhoto | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isNativeCamera = Capacitor.isNativePlatform();

  const capturePhoto = useCallback(async (source: CameraSource): Promise<CapturedPhoto | null> => {
    setIsLoading(true);
    setError(null);

    try {
      // Check camera permissions
      const permissions = await Camera.checkPermissions();
      
      if (permissions.camera !== 'granted') {
        const requested = await Camera.requestPermissions();
        if (requested.camera !== 'granted') {
          throw new Error('Camera permission denied');
        }
      }

      const capturedPhoto: Photo = await Camera.getPhoto({
        quality: 90,
        allowEditing: false,
        resultType: CameraResultType.DataUrl,
        source: source,
        width: 1920,
        height: 1080,
        correctOrientation: true,
        saveToGallery: false
      });

      const result: CapturedPhoto = {
        dataUrl: capturedPhoto.dataUrl || '',
        format: capturedPhoto.format,
        webPath: capturedPhoto.webPath,
        base64String: capturedPhoto.base64String
      };

      setPhoto(result);
      return result;
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to capture photo';
      // Don't set error for user cancellation
      if (!errorMessage.includes('cancelled') && !errorMessage.includes('User cancelled')) {
        setError(errorMessage);
      }
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const takePhoto = useCallback(async (): Promise<CapturedPhoto | null> => {
    return capturePhoto(CameraSource.Camera);
  }, [capturePhoto]);

  const pickFromGallery = useCallback(async (): Promise<CapturedPhoto | null> => {
    return capturePhoto(CameraSource.Photos);
  }, [capturePhoto]);

  const clearPhoto = useCallback(() => {
    setPhoto(null);
    setError(null);
  }, []);

  return {
    photo,
    isLoading,
    error,
    takePhoto,
    pickFromGallery,
    clearPhoto,
    isNativeCamera
  };
};

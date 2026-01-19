import React, { useRef, useState } from 'react';
import { Camera, ImagePlus, Loader2, CheckCircle, X, Smartphone } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { useCamera, CapturedPhoto } from '@/hooks/useCamera';
import { useHaptics } from '@/hooks/useHaptics';
import { useNativeAppMode } from '@/contexts/NativeAppContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { ImpactStyle, NotificationType } from '@capacitor/haptics';

interface VisitPhotoCaptureProps {
  clientId: string;
  uploadedPhotos: string[];
  onPhotoUploaded: (photoUrl: string) => void;
  onPhotoDeleted: (photoUrl: string) => void;
  disabled?: boolean;
}

/**
 * Visit Photo Capture Component
 * 
 * Integrates native camera for mobile (Capacitor) and file input for web.
 * Handles photo capture, upload to Supabase storage, and display.
 */
export const VisitPhotoCapture: React.FC<VisitPhotoCaptureProps> = ({
  clientId,
  uploadedPhotos,
  onPhotoUploaded,
  onPhotoDeleted,
  disabled = false
}) => {
  const { isNative } = useNativeAppMode();
  const { takePhoto, pickFromGallery, isLoading: cameraLoading, error: cameraError } = useCamera();
  const { impact, notification } = useHaptics();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<string | null>(null);

  /**
   * Convert data URL to File for upload
   */
  const dataUrlToFile = (dataUrl: string, filename: string): File => {
    const arr = dataUrl.split(',');
    const mime = arr[0].match(/:(.*?);/)?.[1] || 'image/jpeg';
    const bstr = atob(arr[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    while (n--) {
      u8arr[n] = bstr.charCodeAt(n);
    }
    return new File([u8arr], filename, { type: mime });
  };

  /**
   * Upload photo to Supabase storage
   */
  const uploadToStorage = async (file: File): Promise<string | null> => {
    try {
      const fileExt = file.name.split('.').pop() || 'jpg';
      const filename = `${clientId}-${Date.now()}.${fileExt}`;
      const filePath = `client-photos/${filename}`;

      setUploadProgress(`Uploading ${file.name}...`);

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('client-photos')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) {
        console.error('[VisitPhotoCapture] Upload error:', uploadError);
        throw new Error(uploadError.message);
      }

      // Get the public URL
      const { data: { publicUrl } } = supabase.storage
        .from('client-photos')
        .getPublicUrl(uploadData.path);

      return publicUrl;
    } catch (error) {
      console.error('[VisitPhotoCapture] Upload failed:', error);
      throw error;
    }
  };

  /**
   * Handle native camera capture
   */
  const handleNativeCapture = async () => {
    if (!clientId) {
      toast.error('Cannot upload photos: Client information not available');
      return;
    }

    // Haptic feedback on button press
    await impact(ImpactStyle.Medium);

    const photo = await takePhoto();
    if (photo) {
      await processNativePhoto(photo);
    }
  };

  /**
   * Handle picking from gallery (native)
   */
  const handleNativeGallery = async () => {
    if (!clientId) {
      toast.error('Cannot upload photos: Client information not available');
      return;
    }

    await impact(ImpactStyle.Light);

    const photo = await pickFromGallery();
    if (photo) {
      await processNativePhoto(photo);
    }
  };

  /**
   * Process and upload a natively captured photo
   */
  const processNativePhoto = async (photo: CapturedPhoto) => {
    if (!photo.dataUrl) {
      toast.error('Failed to capture photo');
      return;
    }

    setUploading(true);

    try {
      const file = dataUrlToFile(photo.dataUrl, `visit-photo-${Date.now()}.${photo.format || 'jpg'}`);
      const photoUrl = await uploadToStorage(file);

      if (photoUrl) {
        onPhotoUploaded(photoUrl);
        await notification(NotificationType.Success);
        toast.success('Photo captured and uploaded!');
      }
    } catch (error) {
      await notification(NotificationType.Error);
      toast.error(`Failed to upload photo: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setUploading(false);
      setUploadProgress(null);
    }
  };

  /**
   * Handle web file input change
   */
  const handleFileInputChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    if (!clientId) {
      toast.error('Cannot upload photos: Client information not available');
      return;
    }

    setUploading(true);

    for (const file of Array.from(files)) {
      try {
        setUploadProgress(`Uploading ${file.name}...`);
        const photoUrl = await uploadToStorage(file);

        if (photoUrl) {
          onPhotoUploaded(photoUrl);
          toast.success(`Photo ${file.name} uploaded!`);
        }
      } catch (error) {
        toast.error(`Failed to upload ${file.name}: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }

    setUploading(false);
    setUploadProgress(null);
    event.target.value = '';
  };

  /**
   * Handle photo deletion
   */
  const handleDeletePhoto = async (photoUrl: string) => {
    try {
      // Extract file path from URL
      const url = new URL(photoUrl);
      const pathParts = url.pathname.split('/');
      const filePath = pathParts[pathParts.length - 1];

      const { error } = await supabase.storage
        .from('client-photos')
        .remove([`client-photos/${filePath}`]);

      if (error) {
        console.error('[VisitPhotoCapture] Delete error:', error);
        toast.error('Failed to delete photo');
        return;
      }

      onPhotoDeleted(photoUrl);
      toast.success('Photo deleted');
    } catch (error) {
      console.error('[VisitPhotoCapture] Delete failed:', error);
      toast.error('Failed to delete photo');
    }
  };

  const isProcessing = uploading || cameraLoading;

  return (
    <div className="space-y-4">
      {/* Photo Capture Buttons */}
      <div className="flex flex-wrap items-center gap-3">
        {/* Hidden file input for web fallback */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          onChange={handleFileInputChange}
          className="hidden"
          disabled={disabled || isProcessing}
        />

        {isNative ? (
          // Native mobile: Show camera and gallery buttons
          <>
            <Button
              variant="default"
              className="flex items-center gap-2"
              disabled={disabled || isProcessing}
              onClick={handleNativeCapture}
            >
              <Camera className="w-4 h-4" />
              {cameraLoading ? 'Opening Camera...' : 'Take Photo'}
            </Button>
            
            <Button
              variant="outline"
              className="flex items-center gap-2"
              disabled={disabled || isProcessing}
              onClick={handleNativeGallery}
            >
              <ImagePlus className="w-4 h-4" />
              From Gallery
            </Button>
          </>
        ) : (
          // Web: Show file picker button
          <Button
            variant="outline"
            className="flex items-center gap-2"
            disabled={disabled || isProcessing}
            onClick={() => fileInputRef.current?.click()}
          >
            <Camera className="w-4 h-4" />
            {uploading ? 'Uploading...' : 'Add Photos'}
          </Button>
        )}

        {/* Upload progress indicator */}
        {isProcessing && uploadProgress && (
          <div className="flex items-center gap-2 text-muted-foreground">
            <Loader2 className="w-4 h-4 animate-spin" />
            <span className="text-sm">{uploadProgress}</span>
          </div>
        )}

        {/* Photo count badge */}
        {uploadedPhotos.length > 0 && !isProcessing && (
          <div className="flex items-center gap-2 text-green-600">
            <CheckCircle className="w-4 h-4" />
            <span className="text-sm">{uploadedPhotos.length} photo(s) added</span>
          </div>
        )}
      </div>

      {/* Camera error display */}
      {cameraError && (
        <div className="text-sm text-destructive bg-destructive/10 px-3 py-2 rounded-lg flex items-center gap-2">
          <X className="w-4 h-4" />
          {cameraError}
        </div>
      )}

      {/* Native mode hint */}
      {isNative && uploadedPhotos.length === 0 && !isProcessing && (
        <div className="text-sm text-muted-foreground bg-muted/50 px-3 py-2 rounded-lg flex items-center gap-2">
          <Smartphone className="w-4 h-4" />
          Use your device camera to capture visit documentation
        </div>
      )}

      {/* Photo Gallery */}
      {uploadedPhotos.length > 0 && (
        <div className="space-y-2">
          <Label className="text-sm font-medium">Visit Photos</Label>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {uploadedPhotos.map((photoUrl, index) => (
              <div key={index} className="relative group">
                <img
                  src={photoUrl}
                  alt={`Visit photo ${index + 1}`}
                  className="w-full h-24 object-cover rounded-lg border"
                />
                <Button
                  size="sm"
                  variant="destructive"
                  className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 md:transition-opacity h-6 w-6 p-0 touch:opacity-100"
                  onClick={() => handleDeletePhoto(photoUrl)}
                  disabled={disabled}
                >
                  <X className="w-3 h-3" />
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

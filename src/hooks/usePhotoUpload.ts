import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export const usePhotoUpload = () => {
  const [uploading, setUploading] = useState(false);

  const uploadPhoto = async (file: File, clientId: string): Promise<string | null> => {
    if (!file || !clientId) return null;

    setUploading(true);
    try {
      // Create a unique filename with timestamp
      const fileExt = file.name.split('.').pop();
      const filename = `${clientId}-${Date.now()}.${fileExt}`;
      const filePath = `client-photos/${filename}`;

      // Upload file to Supabase Storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('client-photos')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) {
        console.error('Upload error:', uploadError);
        toast.error('Failed to upload photo');
        return null;
      }

      // Get the public URL
      const { data: { publicUrl } } = supabase.storage
        .from('client-photos')
        .getPublicUrl(uploadData.path);

      return publicUrl;
    } catch (error) {
      console.error('Photo upload error:', error);
      toast.error('Failed to upload photo');
      return null;
    } finally {
      setUploading(false);
    }
  };

  const deletePhoto = async (photoUrl: string): Promise<boolean> => {
    if (!photoUrl) return false;

    try {
      // Extract file path from URL
      const url = new URL(photoUrl);
      const pathParts = url.pathname.split('/');
      const filePath = pathParts[pathParts.length - 1];

      const { error } = await supabase.storage
        .from('client-photos')
        .remove([`client-photos/${filePath}`]);

      if (error) {
        console.error('Delete error:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Photo delete error:', error);
      return false;
    }
  };

  return {
    uploadPhoto,
    deletePhoto,
    uploading
  };
};
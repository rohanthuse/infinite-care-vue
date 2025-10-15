import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface VaccinationFileUploadOptions {
  vaccinationId?: string;
  clientId: string;
  maxSizeInMB?: number;
  allowedTypes?: string[];
}

export const useVaccinationFileUpload = () => {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);

  const uploadVaccinationFile = async (
    file: File,
    options: VaccinationFileUploadOptions
  ) => {
    setUploading(true);
    setProgress(0);

    try {
      // Check authentication
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('You must be logged in to upload vaccination documents');
      }

      // Validate file size (default 10MB)
      const maxSize = (options.maxSizeInMB || 10) * 1024 * 1024;
      if (file.size > maxSize) {
        throw new Error(`File size must be less than ${options.maxSizeInMB || 10}MB`);
      }

      // Validate file type
      const allowedTypes = options.allowedTypes || [
        'application/pdf',
        'image/jpeg',
        'image/png',
        'image/webp',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
      ];

      if (!allowedTypes.includes(file.type)) {
        throw new Error('File type not allowed. Please upload PDF, image, or document files.');
      }

      // Generate unique file path
      const fileExt = file.name.split('.').pop();
      const timestamp = Date.now();
      const randomStr = Math.random().toString(36).substring(2, 9);
      const fileName = `vaccination_${options.clientId}_${timestamp}_${randomStr}.${fileExt}`;
      const filePath = `vaccinations/${options.clientId}/${fileName}`;

      setProgress(30);

      // Upload to Supabase Storage (client-documents bucket)
      const { error: uploadError } = await supabase.storage
        .from('client-documents')
        .upload(filePath, file);

      if (uploadError) {
        console.error('Storage upload error:', uploadError);
        throw new Error(`Upload failed: ${uploadError.message}`);
      }

      setProgress(100);
      toast.success('Vaccination document uploaded successfully');

      return filePath;
    } catch (error: any) {
      console.error('Upload error:', error);
      toast.error(`Upload failed: ${error.message}`);
      throw error;
    } finally {
      setUploading(false);
      setProgress(0);
    }
  };

  const deleteVaccinationFile = async (filePath: string) => {
    try {
      const { error: storageError } = await supabase.storage
        .from('client-documents')
        .remove([filePath]);

      if (storageError) throw storageError;

      toast.success('Vaccination document deleted successfully');
    } catch (error: any) {
      console.error('Delete error:', error);
      toast.error(`Delete failed: ${error.message}`);
      throw error;
    }
  };

  const getFileUrl = (filePath: string) => {
    const { data } = supabase.storage
      .from('client-documents')
      .getPublicUrl(filePath);

    return data.publicUrl;
  };

  return {
    uploadVaccinationFile,
    deleteVaccinationFile,
    getFileUrl,
    uploading,
    progress
  };
};

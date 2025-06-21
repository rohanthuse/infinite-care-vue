
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export type FileCategory = 'document' | 'signature' | 'template' | 'attachment';

export interface UploadOptions {
  agreementId?: string;
  templateId?: string;
  scheduledAgreementId?: string;
  category: FileCategory;
  maxSizeInMB?: number;
  allowedTypes?: string[];
}

export const useFileUpload = () => {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);

  const uploadFile = async (file: File, options: UploadOptions) => {
    setUploading(true);
    setProgress(0);

    try {
      // Validate file size (default 50MB)
      const maxSize = (options.maxSizeInMB || 50) * 1024 * 1024;
      if (file.size > maxSize) {
        throw new Error(`File size must be less than ${options.maxSizeInMB || 50}MB`);
      }

      // Validate file type
      const allowedTypes = options.allowedTypes || [
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'image/jpeg',
        'image/png',
        'image/gif',
        'image/webp'
      ];
      
      if (!allowedTypes.includes(file.type)) {
        throw new Error('File type not allowed');
      }

      // Generate unique file path
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}_${Math.random().toString(36).substring(2)}.${fileExt}`;
      const filePath = `${options.category}/${fileName}`;

      // Upload to Supabase Storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('agreement-files')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      setProgress(50);

      // Save file metadata to database
      const fileMetadata = {
        agreement_id: options.agreementId || null,
        template_id: options.templateId || null,
        scheduled_agreement_id: options.scheduledAgreementId || null,
        file_name: file.name,
        file_type: file.type,
        file_size: file.size,
        storage_path: filePath,
        file_category: options.category,
        uploaded_by: null // Will be set when auth is implemented
      };

      const { data: fileRecord, error: dbError } = await supabase
        .from('agreement_files')
        .insert(fileMetadata)
        .select()
        .single();

      if (dbError) {
        // Clean up uploaded file if database insert fails
        await supabase.storage.from('agreement-files').remove([filePath]);
        throw dbError;
      }

      setProgress(100);
      toast.success('File uploaded successfully');
      
      return fileRecord;
    } catch (error) {
      console.error('Upload error:', error);
      toast.error(`Upload failed: ${error.message}`);
      throw error;
    } finally {
      setUploading(false);
      setProgress(0);
    }
  };

  const deleteFile = async (fileId: string) => {
    try {
      // Get file info first
      const { data: fileInfo, error: fetchError } = await supabase
        .from('agreement_files')
        .select('storage_path')
        .eq('id', fileId)
        .single();

      if (fetchError) throw fetchError;

      // Delete from storage
      const { error: storageError } = await supabase.storage
        .from('agreement-files')
        .remove([fileInfo.storage_path]);

      if (storageError) throw storageError;

      // Delete from database
      const { error: dbError } = await supabase
        .from('agreement_files')
        .delete()
        .eq('id', fileId);

      if (dbError) throw dbError;

      toast.success('File deleted successfully');
    } catch (error) {
      console.error('Delete error:', error);
      toast.error(`Delete failed: ${error.message}`);
      throw error;
    }
  };

  const getFileUrl = (storagePath: string) => {
    const { data } = supabase.storage
      .from('agreement-files')
      .getPublicUrl(storagePath);
    
    return data.publicUrl;
  };

  return {
    uploadFile,
    deleteFile,
    getFileUrl,
    uploading,
    progress
  };
};

import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

const MAX_FILE_SIZE = 20 * 1024 * 1024; // 20MB
const ALLOWED_FILE_TYPES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/gif',
  'image/webp'
];

const ALLOWED_EXTENSIONS = ['.pdf', '.doc', '.docx', '.jpg', '.jpeg', '.png', '.gif', '.webp'];

export const useSystemTenantAgreementFileUpload = () => {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);

  const validateFile = (file: File): { valid: boolean; error?: string } => {
    if (file.size > MAX_FILE_SIZE) {
      return { valid: false, error: `File size exceeds 20MB limit` };
    }

    const extension = '.' + file.name.split('.').pop()?.toLowerCase();
    if (!ALLOWED_EXTENSIONS.includes(extension)) {
      return { valid: false, error: `File type not allowed. Allowed: PDF, DOC, DOCX, JPG, PNG, GIF, WEBP` };
    }

    if (!ALLOWED_FILE_TYPES.includes(file.type)) {
      return { valid: false, error: `Invalid file type` };
    }

    return { valid: true };
  };

  const uploadFile = async (
    file: File,
    agreementId: string,
    category: 'document' | 'attachment' | 'template' = 'attachment'
  ) => {
    const validation = validateFile(file);
    if (!validation.valid) {
      toast.error(validation.error);
      throw new Error(validation.error);
    }

    setUploading(true);
    setProgress(0);

    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${agreementId}/${Date.now()}_${file.name}`;
      const filePath = `system-tenant-agreements/${fileName}`;

      // Upload to storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('agreement-files')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) throw uploadError;

      setProgress(50);

      // Get current user
      const { data: { user } } = await supabase.auth.getUser();

      // Save metadata to database
      const { data: fileRecord, error: dbError } = await supabase
        .from('system_tenant_agreement_files')
        .insert({
          agreement_id: agreementId,
          file_name: file.name,
          file_type: file.type,
          file_size: file.size,
          storage_path: uploadData.path,
          file_category: category,
          uploaded_by: user?.id
        })
        .select()
        .single();

      if (dbError) throw dbError;

      setProgress(100);
      toast.success('File uploaded successfully');
      
      return fileRecord;
    } catch (error: any) {
      console.error('File upload error:', error);
      toast.error(error.message || 'Failed to upload file');
      throw error;
    } finally {
      setUploading(false);
      setProgress(0);
    }
  };

  const deleteFile = async (fileId: string, storagePath: string) => {
    try {
      // Delete from storage
      const { error: storageError } = await supabase.storage
        .from('agreement-files')
        .remove([storagePath]);

      if (storageError) throw storageError;

      // Delete from database
      const { error: dbError } = await supabase
        .from('system_tenant_agreement_files')
        .delete()
        .eq('id', fileId);

      if (dbError) throw dbError;

      toast.success('File deleted successfully');
    } catch (error: any) {
      console.error('File deletion error:', error);
      toast.error(error.message || 'Failed to delete file');
      throw error;
    }
  };

  const getFileUrl = (storagePath: string): string => {
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
    progress,
    validateFile
  };
};

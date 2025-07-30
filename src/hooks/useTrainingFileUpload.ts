import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface TrainingFileUploadOptions {
  trainingRecordId: string;
  staffId: string;
  maxSizeInMB?: number;
  allowedTypes?: string[];
}

export const useTrainingFileUpload = () => {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);

  const uploadTrainingFile = async (file: File, options: TrainingFileUploadOptions) => {
    setUploading(true);
    setProgress(0);

    try {
      // Check authentication first
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('You must be logged in to upload training certificates');
      }

      // Validate file size (default 10MB for training files)
      const maxSize = (options.maxSizeInMB || 10) * 1024 * 1024;
      if (file.size > maxSize) {
        throw new Error(`File size must be less than ${options.maxSizeInMB || 10}MB`);
      }

      // Validate file type - training evidence typically includes PDFs, images, and docs
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

      // Verify staff access permissions
      const { data: staffData, error: staffError } = await supabase
        .from('staff')
        .select('id, auth_user_id')
        .eq('id', options.staffId)
        .eq('auth_user_id', user.id)
        .single();

      if (staffError || !staffData) {
        throw new Error('You can only upload certificates for your own training records');
      }

      // Generate unique file path for training evidence
      const fileExt = file.name.split('.').pop();
      const fileName = `training_${options.trainingRecordId}_${Date.now()}_${Math.random().toString(36).substring(2)}.${fileExt}`;
      const filePath = `training-evidence/${options.staffId}/${fileName}`;

      setProgress(25);

      // Upload to Supabase Storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('staff-documents')
        .upload(filePath, file);

      if (uploadError) {
        console.error('Storage upload error:', uploadError);
        throw new Error(`Upload failed: ${uploadError.message}`);
      }

      setProgress(75);

      // Get current evidence files
      const { data: currentRecord, error: fetchError } = await supabase
        .from('staff_training_records')
        .select('evidence_files')
        .eq('id', options.trainingRecordId)
        .single();

      if (fetchError) throw fetchError;

      // Prepare new file metadata
      const newFileMetadata = {
        id: crypto.randomUUID(),
        name: file.name,
        size: file.size,
        type: file.type,
        storagePath: filePath,
        uploadedAt: new Date().toISOString()
      };

      // Update evidence_files array
      const currentFiles = Array.isArray(currentRecord.evidence_files) ? currentRecord.evidence_files : [];
      const updatedFiles = [...currentFiles, newFileMetadata];

      // Update the training record with new evidence files
      const { error: updateError } = await supabase
        .from('staff_training_records')
        .update({ evidence_files: updatedFiles })
        .eq('id', options.trainingRecordId);

      if (updateError) {
        // Clean up uploaded file if database update fails
        await supabase.storage.from('staff-documents').remove([filePath]);
        throw updateError;
      }

      setProgress(100);
      toast.success('Training certificate uploaded successfully');
      
      return newFileMetadata;
    } catch (error) {
      console.error('Upload error:', error);
      toast.error(`Upload failed: ${error.message}`);
      throw error;
    } finally {
      setUploading(false);
      setProgress(0);
    }
  };

  const deleteTrainingFile = async (trainingRecordId: string, fileId: string) => {
    try {
      // Get current evidence files
      const { data: currentRecord, error: fetchError } = await supabase
        .from('staff_training_records')
        .select('evidence_files')
        .eq('id', trainingRecordId)
        .single();

      if (fetchError) throw fetchError;

      const currentFiles = Array.isArray(currentRecord.evidence_files) ? currentRecord.evidence_files : [];
      const fileToDelete = currentFiles.find((f: any) => f.id === fileId);
      
      if (!fileToDelete) {
        throw new Error('File not found');
      }

      // Delete from storage
      const { error: storageError } = await supabase.storage
        .from('staff-documents')
        .remove([(fileToDelete as any).storagePath]);

      if (storageError) throw storageError;

      // Update evidence_files array (remove the deleted file)
      const updatedFiles = currentFiles.filter((f: any) => f.id !== fileId);

      // Update the training record
      const { error: updateError } = await supabase
        .from('staff_training_records')
        .update({ evidence_files: updatedFiles })
        .eq('id', trainingRecordId);

      if (updateError) throw updateError;

      toast.success('Training certificate deleted successfully');
    } catch (error) {
      console.error('Delete error:', error);
      toast.error(`Delete failed: ${error.message}`);
      throw error;
    }
  };

  const getFileUrl = (storagePath: string) => {
    const { data } = supabase.storage
      .from('staff-documents')
      .getPublicUrl(storagePath);
    
    return data.publicUrl;
  };

  return {
    uploadTrainingFile,
    deleteTrainingFile,
    getFileUrl,
    uploading,
    progress
  };
};
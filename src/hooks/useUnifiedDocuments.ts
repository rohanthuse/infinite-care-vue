import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface UnifiedDocument {
  id: string;
  name: string;
  type: string;
  category: string;
  description?: string;
  file_path?: string;
  file_size?: string;
  file_type?: string;
  uploaded_by_name?: string;
  client_id?: string;
  client_name?: string;
  staff_id?: string;
  staff_name?: string;
  tags?: string[];
  status: string;
  created_at: string;
  updated_at: string;
  source_table: string;
  related_entity: string;
  has_file?: boolean;
}

export interface UploadDocumentData {
  name: string;
  type: string;
  category: string;
  description?: string;
  file: File;
  tags: string[];
  access_level: string;
  client_id?: string;
  staff_id?: string;
  expiry_date?: string;
}

export const useUnifiedDocuments = (branchId: string) => {
  const queryClient = useQueryClient();
  const [isUploading, setIsUploading] = useState(false);

  console.log('[useUnifiedDocuments] Hook initialized with branchId:', branchId);

  // Fetch unified documents
  const { data: documents = [], isLoading } = useQuery({
    queryKey: ['unified-documents', branchId],
    queryFn: async () => {
      console.log('[useUnifiedDocuments] Fetching documents for branch:', branchId);
      
      const { data, error } = await supabase.rpc('get_branch_documents', {
        p_branch_id: branchId
      });

      if (error) {
        console.error('[useUnifiedDocuments] Error fetching documents:', error);
        throw error;
      }

      // Check file existence for each document with proper folder handling
      const documentsWithFileStatus = await Promise.all(
        data?.map(async (doc: any) => {
          if (doc.file_path) {
            const bucket = doc.source_table === 'client_documents' ? 'client-documents' : 
                          doc.source_table === 'agreement_files' ? 'agreement-files' : 'documents';
            
            try {
              // Split path to get folder and filename
              const pathParts = doc.file_path.split('/');
              const filename = pathParts.pop();
              const folder = pathParts.length > 0 ? pathParts.join('/') : '';
              
              // List files in the specific folder
              const { data: fileData, error: fileError } = await supabase.storage
                .from(bucket)
                .list(folder, {
                  limit: 100,
                  search: filename
                });
              
              // Check if the specific file exists in the folder
              const fileExists = !fileError && fileData && 
                fileData.some(file => file.name === filename);
              
              return {
                ...doc,
                has_file: fileExists
              };
            } catch (err) {
              console.error('[useUnifiedDocuments] Error checking file existence:', err);
              // If file path exists, assume file is available (fallback for backward compatibility)
              return { ...doc, has_file: true };
            }
          }
          // No file path means no file
          return { ...doc, has_file: false };
        }) || []
      );

      console.log('[useUnifiedDocuments] Successfully fetched documents count:', documentsWithFileStatus.length);
      return documentsWithFileStatus as UnifiedDocument[];
    },
    enabled: !!branchId,
  });

  // Upload document mutation
  const uploadDocument = async (uploadData: UploadDocumentData) => {
    console.log('[useUnifiedDocuments] Starting document upload:', {
      branchId,
      fileName: uploadData.file.name,
      fileSize: uploadData.file.size,
      category: uploadData.category,
      clientId: uploadData.client_id
    });
    
    setIsUploading(true);

    try {
      // Get current user
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) {
        console.error('[useUnifiedDocuments] User authentication error:', userError);
        throw new Error('You must be logged in to upload documents');
      }

      console.log('[useUnifiedDocuments] Current user verified:', {
        userId: user.id,
        email: user.email
      });

      // Check user permissions for this branch - more inclusive access checking
      console.log('[useUnifiedDocuments] Checking user access for branch:', branchId);
      
      // Check user roles first
      const { data: userRolesData, error: roleError } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id);

      if (roleError) {
        console.log('[useUnifiedDocuments] No user roles found, checking direct branch access');
      }

      const userRoles = userRolesData?.map(r => r.role) || [];
      console.log('[useUnifiedDocuments] User roles found:', userRoles);

      // Check multiple access methods
      let hasAccess = false;
      let accessMethod = '';
      
      // 1. Check super admin role
      if (userRoles.includes('super_admin')) {
        hasAccess = true;
        accessMethod = 'super_admin';
        console.log('[useUnifiedDocuments] Super admin access granted');
      }
      
      // 2. Check admin_branches table (regardless of role)
      if (!hasAccess) {
        const { data: adminBranch, error: adminError } = await supabase
          .from('admin_branches')
          .select('branch_id')
          .eq('admin_id', user.id)
          .eq('branch_id', branchId)
          .single();
        
        if (!adminError && adminBranch) {
          hasAccess = true;
          accessMethod = 'admin_branches';
          console.log('[useUnifiedDocuments] Admin branch access granted:', adminBranch);
        }
      }
      
      // 3. Check staff table (regardless of role) - FIX: use auth_user_id instead of id
      if (!hasAccess) {
        const { data: staffData, error: staffError } = await supabase
          .from('staff')
          .select('branch_id')
          .eq('auth_user_id', user.id)
          .eq('branch_id', branchId)
          .single();
        
        if (!staffError && staffData) {
          hasAccess = true;
          accessMethod = 'staff';
          console.log('[useUnifiedDocuments] Staff access granted:', staffData);
        }
      }

      if (!hasAccess) {
        console.error('[useUnifiedDocuments] Access denied for branch:', branchId, 'User ID:', user.id);
        throw new Error('You do not have permission to upload documents to this branch');
      }

      console.log('[useUnifiedDocuments] User has access to branch, proceeding with upload');

      // Generate unique file path
      const fileExt = uploadData.file.name.split('.').pop();
      const fileName = `${Date.now()}_${Math.random().toString(36).substring(2)}.${fileExt}`;
      const filePath = `${branchId}/${fileName}`;

      console.log('[useUnifiedDocuments] Generated file path:', filePath);

      // Upload file to storage
      console.log('[useUnifiedDocuments] Uploading to storage bucket: documents');
      const { data: uploadResult, error: uploadError } = await supabase.storage
        .from('documents')
        .upload(filePath, uploadData.file, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) {
        console.error('[useUnifiedDocuments] File upload error:', {
          error: uploadError,
          message: uploadError.message,
          filePath,
          fileName: uploadData.file.name,
          fileSize: uploadData.file.size
        });
        
        // Enhanced error message based on error type
        let errorMessage = `Failed to upload file: ${uploadError.message}`;
        if (uploadError.message.includes('policy')) {
          errorMessage = 'Permission denied. Storage policies may need to be configured.';
        } else if (uploadError.message.includes('size')) {
          errorMessage = 'File is too large. Please try a smaller file.';
        }
        
        throw new Error(errorMessage);
      }

      console.log('[useUnifiedDocuments] File uploaded successfully to storage:', uploadResult);

      // Get user name for display
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('first_name, last_name')
        .eq('id', user.id)
        .single();

      if (profileError) {
        console.log('[useUnifiedDocuments] Could not fetch profile data, using email:', profileError);
      }

      const uploaderName = profileData 
        ? `${profileData.first_name || ''} ${profileData.last_name || ''}`.trim()
        : user.email || 'Unknown User';

      console.log('[useUnifiedDocuments] Uploader name determined:', uploaderName);

      // Save document metadata to database
      const documentData = {
        name: uploadData.name,
        type: uploadData.type,
        category: uploadData.category,
        description: uploadData.description,
        file_path: filePath,
        file_size: uploadData.file.size.toString(),
        file_type: uploadData.file.type,
        uploaded_by: user.id,
        uploaded_by_name: uploaderName,
        branch_id: branchId,
        client_id: uploadData.client_id || null,
        staff_id: uploadData.staff_id || null,
        tags: uploadData.tags,
        access_level: uploadData.access_level,
        status: 'active',
        expiry_date: uploadData.expiry_date || null
      };

      console.log('[useUnifiedDocuments] Saving document metadata:', {
        ...documentData,
        file_size: `${documentData.file_size} bytes`
      });

      const { data: documentRecord, error: dbError } = await supabase
        .from('documents')
        .insert(documentData)
        .select()
        .single();

      if (dbError) {
        console.error('[useUnifiedDocuments] Database insert error:', dbError);
        // Clean up uploaded file if database insert fails
        console.log('[useUnifiedDocuments] Cleaning up uploaded file due to database error');
        await supabase.storage.from('documents').remove([filePath]);
        throw new Error(`Failed to save document: ${dbError.message}`);
      }

      console.log('[useUnifiedDocuments] Document metadata saved successfully:', documentRecord);
      toast.success('Document uploaded successfully');
      
      // Invalidate and refetch documents
      queryClient.invalidateQueries({ queryKey: ['unified-documents', branchId] });
      
      return documentRecord;
    } catch (error) {
      console.error('[useUnifiedDocuments] Upload error:', {
        error,
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      });
      toast.error(error instanceof Error ? error.message : 'Failed to upload document');
      throw error;
    } finally {
      setIsUploading(false);
      console.log('[useUnifiedDocuments] Upload process completed');
    }
  };

  // Delete document mutation
  const deleteDocument = async (documentId: string) => {
    try {
      console.log('Deleting document:', documentId);

      // Get document info first
      const { data: docInfo, error: fetchError } = await supabase
        .from('documents')
        .select('file_path, name')
        .eq('id', documentId)
        .single();

      if (fetchError) {
        console.error('Error fetching document:', fetchError);
        throw new Error('Document not found');
      }

      // Delete file from storage if it exists
      if (docInfo.file_path) {
        const { error: storageError } = await supabase.storage
          .from('documents')
          .remove([docInfo.file_path]);

        if (storageError) {
          console.error('Storage delete error:', storageError);
          // Continue with database deletion even if storage fails
        }
      }

      // Delete from database
      const { error: dbError } = await supabase
        .from('documents')
        .delete()
        .eq('id', documentId);

      if (dbError) {
        console.error('Database delete error:', dbError);
        throw new Error(`Failed to delete document: ${dbError.message}`);
      }

      toast.success('Document deleted successfully');
      queryClient.invalidateQueries({ queryKey: ['unified-documents', branchId] });
    } catch (error) {
      console.error('Delete error:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to delete document');
      throw error;
    }
  };

  // Download document
  const downloadDocument = async (filePath: string, fileName: string) => {
    try {
      console.log('Downloading document:', filePath);

      const bucket = filePath.startsWith('client-documents/') ? 'client-documents' :
                    filePath.startsWith('agreement-files/') ? 'agreement-files' : 'documents';

      const { data, error } = await supabase.storage
        .from(bucket)
        .download(filePath);

      if (error) {
        console.error('Download error:', error);
        throw new Error(`Failed to download file: ${error.message}`);
      }

      // Create download link
      const url = URL.createObjectURL(data);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast.success('Download started');
    } catch (error) {
      console.error('Download error:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to download document');
    }
  };

  // View document
  const viewDocument = async (filePath: string) => {
    try {
      console.log('Viewing document:', filePath);

      const bucket = filePath.startsWith('client-documents/') ? 'client-documents' :
                    filePath.startsWith('agreement-files/') ? 'agreement-files' : 'documents';

      const { data } = supabase.storage
        .from(bucket)
        .getPublicUrl(filePath);

      if (data?.publicUrl) {
        window.open(data.publicUrl, '_blank');
      } else {
        throw new Error('Could not generate file URL');
      }
    } catch (error) {
      console.error('View error:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to view document');
    }
  };

  return {
    documents,
    isLoading,
    uploadDocument,
    deleteDocument,
    downloadDocument,
    viewDocument,
    isUploading
  };
};

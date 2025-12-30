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
  expiry_date?: string;
  shared_with_clients?: string[];  // For restricted access only
  shared_with_staff?: string[];    // For restricted access only
}

interface DocumentUploadAccessCheck {
  user_id: string;
  branch_id: string;
  user_roles: string[];
  is_super_admin: boolean;
  is_branch_admin: boolean;
  is_branch_staff: boolean;
  can_upload: boolean;
  staff_record?: {
    id: string;
    auth_user_id: string;
    first_name: string;
    last_name: string;
    email: string;
  };
  error?: string;
}

export const useUnifiedDocuments = (branchId: string) => {
  const queryClient = useQueryClient();
  const [isUploading, setIsUploading] = useState(false);

  console.log('[useUnifiedDocuments] Hook initialized with branchId:', branchId);

  // Fetch unified documents
  const { data: documents = [], isLoading } = useQuery({
    queryKey: ['unified-documents', branchId],
    staleTime: 5 * 60 * 1000, // 5 minutes to reduce frequent 504 errors
    queryFn: async () => {
      console.log('[useUnifiedDocuments] Fetching documents for branch:', branchId);
      
      const { data, error } = await supabase.rpc('get_branch_documents', {
        p_branch_id: branchId
      });

      if (error) {
        console.error('[useUnifiedDocuments] Error fetching documents:', error);
        throw error;
      }

      // Map RPC column names to expected interface column names
      // The RPC returns: storage_path, uploaded_at, size, source_table
      // The interface expects: file_path, created_at, file_size, source_table
      const documentsWithFileStatus = data?.map((doc: any) => ({
        ...doc,
        file_path: doc.storage_path || doc.file_path,
        file_size: doc.size || doc.file_size,
        created_at: doc.uploaded_at || doc.created_at,
        updated_at: doc.uploaded_at || doc.updated_at,
        source_table: doc.source_table || 'unknown',
        has_file: !!(doc.storage_path || doc.file_path)
      })) || [];

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
      accessLevel: uploadData.access_level
    });
    
    setIsUploading(true);

    // Phase 3: Add diagnostic check before upload
    console.log('[useUnifiedDocuments] Running upload permission diagnostic...');
    const { data: accessCheckData, error: accessError } = await supabase
      .rpc('check_document_upload_access', { p_branch_id: branchId });

    if (accessError) {
      console.error('[useUnifiedDocuments] Diagnostic check failed:', accessError);
    } else {
      const accessCheck = accessCheckData as unknown as DocumentUploadAccessCheck;
      console.log('[useUnifiedDocuments] Upload permission diagnostic:', accessCheck);
      
      if (accessCheck && !accessCheck.can_upload) {
        let detailedError = '❌ Document Upload Permission Denied\n\n';
        detailedError += `📋 Diagnostic Information:\n`;
        detailedError += `• User ID: ${accessCheck.user_id}\n`;
        detailedError += `• Branch ID: ${accessCheck.branch_id}\n`;
        detailedError += `• User Roles: ${accessCheck.user_roles?.join(', ') || 'None'}\n`;
        detailedError += `• Is Super Admin: ${accessCheck.is_super_admin ? '✅ Yes' : '❌ No'}\n`;
        detailedError += `• Is Branch Admin: ${accessCheck.is_branch_admin ? '✅ Yes' : '❌ No'}\n`;
        detailedError += `• Is Branch Staff: ${accessCheck.is_branch_staff ? '✅ Yes' : '❌ No'}\n\n`;
        
        if (accessCheck.staff_record) {
          detailedError += `👤 Staff Record Found:\n`;
          detailedError += `• Staff ID: ${accessCheck.staff_record.id}\n`;
          detailedError += `• Auth User ID: ${accessCheck.staff_record.auth_user_id}\n`;
          detailedError += `• Name: ${accessCheck.staff_record.first_name} ${accessCheck.staff_record.last_name}\n`;
          detailedError += `• Email: ${accessCheck.staff_record.email}\n\n`;
        } else {
          detailedError += `⚠️ No Staff Record Found\n`;
          detailedError += `This indicates your staff account may not be properly linked to your login.\n`;
          detailedError += `Please contact your administrator to link your account.\n\n`;
        }
        
        detailedError += `💡 Solution: You need one of the following:\n`;
        detailedError += `• Super Admin role (system-wide access)\n`;
        detailedError += `• Branch Admin assignment for this branch\n`;
        detailedError += `• Staff record with auth_user_id linked to this branch\n`;
        
        console.error('[useUnifiedDocuments] Upload blocked:', detailedError);
        setIsUploading(false);
        toast.error('Permission denied. Check console for details.');
        throw new Error(detailedError);
      }
    }

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

      // Get user name and role for display
      // 1. Check if user is a staff member
      const { data: staffData } = await supabase
        .from('staff')
        .select('first_name, last_name')
        .eq('auth_user_id', user.id)
        .single();

      // 2. Determine role label from user_roles
      let roleLabel = '';
      if (userRoles.includes('super_admin')) {
        roleLabel = 'Super Admin';
      } else if (userRoles.includes('branch_admin')) {
        roleLabel = 'Branch Admin';
      } else if (staffData) {
        roleLabel = 'Staff';
      }

      // 3. Determine uploader name (priority: staff name > profile name > email)
      let uploaderName = '';

      if (staffData && (staffData.first_name || staffData.last_name)) {
        uploaderName = `${staffData.first_name || ''} ${staffData.last_name || ''}`.trim();
      } else {
        // Fall back to profile
        const { data: profileData } = await supabase
          .from('profiles')
          .select('first_name, last_name')
          .eq('id', user.id)
          .single();
        
        uploaderName = profileData 
          ? `${profileData.first_name || ''} ${profileData.last_name || ''}`.trim()
          : '';
      }

      // 4. Build final display name
      if (!uploaderName) {
        uploaderName = user.email || 'Unknown User';
      }

      // Add role suffix if available
      if (roleLabel) {
        uploaderName = `${uploaderName} (${roleLabel})`;
      }

      console.log('[useUnifiedDocuments] Uploader name determined:', uploaderName);

      // Handle document sharing based on access level
      const documentsToCreate = [];
      const baseDocumentData = {
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
        tags: uploadData.tags,
        access_level: uploadData.access_level,
        status: 'active',
        expiry_date: uploadData.expiry_date || null
      };

      if (uploadData.access_level === 'restricted') {
        // For restricted access, validate that recipients are specified
        const hasSharedClients = uploadData.shared_with_clients && uploadData.shared_with_clients.length > 0;
        const hasSharedStaff = uploadData.shared_with_staff && uploadData.shared_with_staff.length > 0;
        
        if (!hasSharedClients && !hasSharedStaff) {
          throw new Error('Restricted documents must be shared with at least one client or staff member');
        }

        // Create documents for each shared client
        if (hasSharedClients) {
          uploadData.shared_with_clients.forEach(clientId => {
            documentsToCreate.push({
              ...baseDocumentData,
              client_id: clientId,
              staff_id: null
            });
          });
        }

        // Create documents for each shared staff
        if (hasSharedStaff) {
          uploadData.shared_with_staff.forEach(staffId => {
            documentsToCreate.push({
              ...baseDocumentData,
              client_id: null,
              staff_id: staffId
            });
          });
        }
      } else {
        // For public and branch access, create one document record
        // Set client_id if provided in uploadData (e.g., from Care Plan wizard)
        documentsToCreate.push({
          ...baseDocumentData,
          client_id: (uploadData as any).client_id || null,
          staff_id: null
        });
      }

      console.log('[useUnifiedDocuments] Creating document records:', documentsToCreate.length);

      // Insert all document records
      const { data: documentRecords, error: dbError } = await supabase
        .from('documents')
        .insert(documentsToCreate)
        .select();

      if (dbError) {
        console.error('[useUnifiedDocuments] Database insert error:', dbError);
        // Clean up uploaded file if database insert fails
        console.log('[useUnifiedDocuments] Cleaning up uploaded file due to database error');
        await supabase.storage.from('documents').remove([filePath]);
        throw new Error(`Failed to save document: ${dbError.message}`);
      }

      console.log('[useUnifiedDocuments] Document metadata saved successfully:', documentRecords);
      
      const successMessage = uploadData.access_level === 'restricted' 
        ? `Document uploaded and shared with ${documentsToCreate.length} recipient(s)`
        : 'Document uploaded successfully';
      
      toast.success(successMessage);
      
      // Invalidate and refetch documents
      queryClient.invalidateQueries({ queryKey: ['unified-documents', branchId] });
      
      // Trigger notifications for document recipients based on access level
      try {
        // For restricted access, get specific client/staff IDs from document records
        const clientIds = documentRecords
          .filter((doc: any) => doc.client_id)
          .map((doc: any) => doc.client_id);
        const staffIds = documentRecords
          .filter((doc: any) => doc.staff_id)
          .map((doc: any) => doc.staff_id);

        // Get organization_id for public access notifications
        let organizationId: string | null = null;
        if (uploadData.access_level === 'public') {
          const { data: branchData } = await supabase
            .from('branches')
            .select('organization_id')
            .eq('id', branchId)
            .single();
          organizationId = branchData?.organization_id || null;
        }

        console.log('[useUnifiedDocuments] Triggering document notifications:', {
          access_level: uploadData.access_level,
          clientIds: clientIds.length,
          staffIds: staffIds.length,
          organizationId
        });
        
        const { data: notifResult, error: notifError } = await supabase.functions.invoke('create-document-notifications', {
          body: {
            document_id: documentRecords[0].id,
            document_name: uploadData.name,
            branch_id: branchId,
            access_level: uploadData.access_level,
            organization_id: organizationId,
            client_ids: [...new Set(clientIds)],
            staff_ids: [...new Set(staffIds)]
          }
        });

        if (notifError) {
          console.error('[useUnifiedDocuments] Error creating notifications:', notifError);
        } else {
          console.log('[useUnifiedDocuments] Notification result:', notifResult);
        }
      } catch (notifErr) {
        console.error('[useUnifiedDocuments] Failed to trigger notifications:', notifErr);
        // Don't throw - document upload succeeded, notification is secondary
      }
      
      return documentRecords[0];
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

  // Bulk delete documents mutation
  const deleteBulkDocuments = async (documentIds: string[]) => {
    const results = {
      successful: 0,
      failed: 0,
      errors: [] as string[]
    };

    console.log('[useUnifiedDocuments] Starting bulk delete for', documentIds.length, 'documents');

    for (const documentId of documentIds) {
      try {
        // Get document info first
        const { data: docInfo, error: fetchError } = await supabase
          .from('documents')
          .select('file_path, name')
          .eq('id', documentId)
          .single();

        if (fetchError) {
          console.error('Error fetching document:', documentId, fetchError);
          results.failed++;
          results.errors.push(`Failed to fetch ${documentId}`);
          continue;
        }

        // Delete file from storage if it exists
        if (docInfo.file_path) {
          const { error: storageError } = await supabase.storage
            .from('documents')
            .remove([docInfo.file_path]);

          if (storageError) {
            console.error('Storage delete error for:', documentId, storageError);
            // Continue with database deletion even if storage fails
          }
        }

        // Delete from database
        const { error: dbError } = await supabase
          .from('documents')
          .delete()
          .eq('id', documentId);

        if (dbError) {
          console.error('Database delete error for:', documentId, dbError);
          results.failed++;
          results.errors.push(`Failed to delete ${docInfo.name}`);
        } else {
          results.successful++;
          console.log('[useUnifiedDocuments] Successfully deleted:', docInfo.name);
        }
      } catch (error) {
        console.error('Unexpected error deleting document:', documentId, error);
        results.failed++;
        results.errors.push(`Unexpected error for ${documentId}`);
      }
    }

    console.log('[useUnifiedDocuments] Bulk delete completed:', results);

    // Show appropriate toast message
    if (results.failed === 0) {
      toast.success(`Successfully deleted ${results.successful} document${results.successful > 1 ? 's' : ''}`);
    } else if (results.successful === 0) {
      toast.error(`Failed to delete all ${results.failed} documents`);
    } else {
      toast.warning(`Deleted ${results.successful} documents, ${results.failed} failed`);
    }

    // Invalidate and refetch documents
    queryClient.invalidateQueries({ queryKey: ['unified-documents', branchId] });

    return results;
  };

  // Download document
  const downloadDocument = async (filePath: string, fileName: string) => {
    try {
      console.log('Downloading document:', filePath);

      const bucket = filePath.startsWith('client-documents/') ? 'client-documents' :
                    filePath.startsWith('agreement-files/') ? 'agreement-files' :
                    filePath.startsWith('staff-documents/') ? 'staff-documents' : 'documents';

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
                    filePath.startsWith('agreement-files/') ? 'agreement-files' :
                    filePath.startsWith('staff-documents/') ? 'staff-documents' : 'documents';

      // Open a blank tab immediately to avoid popup blockers
      const newTab = window.open('about:blank', '_blank');
      
      if (!newTab) {
        throw new Error('Could not open new tab. Please check your popup blocker settings.');
      }

      // Create signed URL for private documents
      const { data, error } = await supabase.storage
        .from(bucket)
        .createSignedUrl(filePath, 3600); // 1 hour expiry

      if (error) {
        newTab.close();
        throw new Error(`Failed to create document URL: ${error.message}`);
      }

      if (data?.signedUrl) {
        newTab.location.href = data.signedUrl;
      } else {
        newTab.close();
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
    deleteBulkDocuments,
    downloadDocument,
    viewDocument,
    isUploading
  };
};

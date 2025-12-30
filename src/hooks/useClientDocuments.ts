
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

// Helper to detect storage bucket from file path
const getStorageBucket = (filePath: string): string => {
  if (filePath.startsWith('client-documents/')) return 'client-documents';
  if (filePath.startsWith('agreement-files/')) return 'agreement-files';
  if (filePath.startsWith('staff-documents/')) return 'staff-documents';
  // Default to 'documents' bucket (used by wizard/unified document uploads)
  return 'documents';
};

export interface ClientDocument {
  id: string;
  name: string;
  type: string;
  file_path?: string;
  file_size?: string;
  uploaded_by: string;
  upload_date: string;
  created_at: string;
  updated_at: string;
  client_id: string;
}

// Fetch client documents
export const useClientDocuments = (clientId: string) => {
  return useQuery({
    queryKey: ['client-documents', clientId],
    queryFn: async () => {
      if (!clientId) {
        console.error('[useClientDocuments] No client ID provided');
        return [];
      }

      console.log(`[useClientDocuments] Fetching documents for client: ${clientId}`);

      const { data, error } = await supabase
        .from('client_documents')
        .select('*')
        .eq('client_id', clientId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching client documents:', error);
        throw error;
      }

      return data || [];
    },
    enabled: Boolean(clientId),
  });
};

// Upload client document
export const useUploadClientDocument = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ clientId, file, name, type, uploaded_by }: {
      clientId: string;
      file: File;
      name: string;
      type: string;
      uploaded_by: string;
    }) => {
      console.log('Starting client document upload:', { clientId, name, type });

      // Generate unique file path
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}_${Math.random().toString(36).substring(2)}.${fileExt}`;
      const filePath = `client-documents/${clientId}/${fileName}`;

      // Upload file to storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('client-documents')
        .upload(filePath, file);

      if (uploadError) {
        console.error('File upload error:', uploadError);
        throw new Error(`Failed to upload file: ${uploadError.message}`);
      }

      console.log('File uploaded successfully:', uploadData);

      const formattedSize = `${(file.size / 1024 / 1024).toFixed(2)} MB`;

      // Save document metadata to database
      const { data: documentRecord, error: dbError } = await supabase
        .from('client_documents')
        .insert({
          client_id: clientId,
          name: name,
          type: type,
          file_path: filePath,
          file_size: formattedSize,
          uploaded_by: uploaded_by,
          upload_date: new Date().toISOString().split('T')[0]
        })
        .select()
        .single();

      if (dbError) {
        console.error('Database insert error:', dbError);
        // Clean up uploaded file if database insert fails
        await supabase.storage.from('client-documents').remove([filePath]);
        throw new Error(`Failed to save document: ${dbError.message}`);
      }

      console.log('Document saved successfully:', documentRecord);
      return documentRecord;
    },
    onSuccess: async (data, variables) => {
      toast.success('Document uploaded successfully');
      queryClient.invalidateQueries({ queryKey: ['client-documents'] });
      
      // Trigger notification for Branch Admins (NOT the uploading client)
      try {
        // Get the client's branch_id and name
        const { data: clientData } = await supabase
          .from('clients')
          .select('branch_id, first_name, last_name')
          .eq('id', variables.clientId)
          .single();

        if (clientData?.branch_id) {
          const clientName = `${clientData.first_name || ''} ${clientData.last_name || ''}`.trim() || 'Unknown Client';
          const uploadTimestamp = new Date().toISOString();
          
          console.log('[useClientDocuments] Triggering notification for branch admins');
          const { data: notifResult, error: notifError } = await supabase.functions.invoke('create-document-notifications', {
            body: {
              document_id: data.id,
              document_name: variables.name,
              branch_id: clientData.branch_id,
              notify_admins: true, // Notify branch admins instead of client
              client_id: variables.clientId,
              client_name: clientName,
              upload_timestamp: uploadTimestamp
            }
          });

          if (notifError) {
            console.error('[useClientDocuments] Error creating notification:', notifError);
          } else {
            console.log('[useClientDocuments] Notification result:', notifResult);
          }
        }
      } catch (notifErr) {
        console.error('[useClientDocuments] Failed to trigger notification:', notifErr);
      }
    },
    onError: (error) => {
      console.error('Upload error:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to upload document');
    },
  });
};

// Update client document
export const useUpdateClientDocument = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, name, type, uploaded_by }: {
      id: string;
      name: string;
      type: string;
      uploaded_by: string;
    }) => {
      const { data, error } = await supabase
        .from('client_documents')
        .update({
          name,
          type,
          uploaded_by,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('Update error:', error);
        throw new Error(`Failed to update document: ${error.message}`);
      }

      return data;
    },
    onSuccess: () => {
      toast.success('Document updated successfully');
      queryClient.invalidateQueries({ queryKey: ['client-documents'] });
    },
    onError: (error) => {
      console.error('Update error:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to update document');
    },
  });
};

// Delete client document
export const useDeleteClientDocument = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (documentId: string) => {
      console.log('Deleting client document:', documentId);

      // Get document info first
      const { data: docInfo, error: fetchError } = await supabase
        .from('client_documents')
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
          .from('client-documents')
          .remove([docInfo.file_path]);

        if (storageError) {
          console.error('Storage delete error:', storageError);
          // Continue with database deletion even if storage fails
        }
      }

      // Delete from database
      const { error: dbError } = await supabase
        .from('client_documents')
        .delete()
        .eq('id', documentId);

      if (dbError) {
        console.error('Database delete error:', dbError);
        throw new Error(`Failed to delete document: ${dbError.message}`);
      }
    },
    onSuccess: () => {
      toast.success('Document deleted successfully');
      queryClient.invalidateQueries({ queryKey: ['client-documents'] });
    },
    onError: (error) => {
      console.error('Delete error:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to delete document');
    },
  });
};

// View client document
export const useViewClientDocument = () => {
  return useMutation({
    mutationFn: async ({ filePath }: { filePath: string }) => {
      console.log('Viewing client document:', filePath);

      // Open a blank tab immediately to avoid popup blockers
      const newTab = window.open('about:blank', '_blank');
      
      if (!newTab) {
        throw new Error('Could not open new tab. Please check your popup blocker settings.');
      }

      // Detect correct bucket based on file path
      const bucket = getStorageBucket(filePath);
      console.log('Using storage bucket:', bucket, 'for path:', filePath);

      try {
        // First try to download as blob to avoid ERR_BLOCKED_BY_CLIENT
        const { data: fileData, error: downloadError } = await supabase.storage
          .from(bucket)
          .download(filePath);

        if (!downloadError && fileData) {
          // Create blob URL and navigate to it
          const blobUrl = URL.createObjectURL(fileData);
          newTab.location.href = blobUrl;
          
          // Clean up the blob URL after a delay
          setTimeout(() => {
            URL.revokeObjectURL(blobUrl);
          }, 30000); // 30 seconds
          
          return;
        }
      } catch (blobError) {
        console.warn('Blob download failed, falling back to signed URL:', blobError);
      }

      // Fallback to signed URL if blob download fails
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
    },
    onError: (error) => {
      console.error('View error:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to view document');
    },
  });
};

// Download client document
export const useDownloadClientDocument = () => {
  return useMutation({
    mutationFn: async ({ filePath, fileName }: { filePath: string; fileName: string }) => {
      console.log('Downloading client document:', filePath);

      // Detect correct bucket based on file path
      const bucket = getStorageBucket(filePath);
      console.log('Using storage bucket:', bucket, 'for path:', filePath);

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
    },
    onSuccess: () => {
      toast.success('Download started');
    },
    onError: (error) => {
      console.error('Download error:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to download document');
    },
  });
};

// Bulk delete client documents
export const useBulkDeleteClientDocuments = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (documentIds: string[]) => {
      const results = {
        successful: 0,
        failed: 0,
        errors: [] as string[]
      };

      console.log('[useBulkDeleteClientDocuments] Starting bulk delete for', documentIds.length, 'documents');

      for (const documentId of documentIds) {
        try {
          // Get document info first
          const { data: docInfo, error: fetchError } = await supabase
            .from('client_documents')
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
              .from('client-documents')
              .remove([docInfo.file_path]);

            if (storageError) {
              console.error('Storage delete error for:', documentId, storageError);
              // Continue with database deletion even if storage fails
            }
          }

          // Delete from database
          const { error: dbError } = await supabase
            .from('client_documents')
            .delete()
            .eq('id', documentId);

          if (dbError) {
            console.error('Database delete error for:', documentId, dbError);
            results.failed++;
            results.errors.push(`Failed to delete ${docInfo.name}`);
          } else {
            results.successful++;
            console.log('[useBulkDeleteClientDocuments] Successfully deleted:', docInfo.name);
          }
        } catch (error) {
          console.error('Unexpected error deleting document:', documentId, error);
          results.failed++;
          results.errors.push(`Unexpected error for ${documentId}`);
        }
      }

      console.log('[useBulkDeleteClientDocuments] Bulk delete completed:', results);
      return results;
    },
    onSuccess: (results) => {
      // Show appropriate toast message
      if (results.failed === 0) {
        toast.success(`Successfully deleted ${results.successful} client document${results.successful > 1 ? 's' : ''}`);
      } else if (results.successful === 0) {
        toast.error(`Failed to delete all ${results.failed} documents`);
      } else {
        toast.warning(`Deleted ${results.successful} documents, ${results.failed} failed`);
      }
      
      queryClient.invalidateQueries({ queryKey: ['client-documents'] });
    },
    onError: (error) => {
      console.error('Bulk delete error:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to delete documents');
    },
  });
};


import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

// Known storage buckets in the application
const KNOWN_BUCKETS = ['documents', 'client-documents', 'agreement-files', 'staff-documents'];

/**
 * Resolves bucket and object path from various input formats:
 * 1. Full Supabase URL: https://xxx.supabase.co/storage/v1/object/public/documents/path/file.pdf
 * 2. Bucket-prefixed path: documents/branchId/file.pdf
 * 3. Plain object key: branchId/file.pdf (assumes 'documents' bucket)
 */
const resolveBucketAndPath = (input: string): { bucket: string; objectPath: string } => {
  if (!input) {
    console.error('[resolveBucketAndPath] Empty input provided');
    return { bucket: 'documents', objectPath: '' };
  }

  // Case 1: Full Supabase storage URL
  // Example: https://xxx.supabase.co/storage/v1/object/public/documents/branchId/file.pdf
  const urlPattern = /storage\/v1\/object\/(?:public|sign)\/([^\/]+)\/(.+)/;
  const urlMatch = input.match(urlPattern);
  if (urlMatch) {
    const [, bucket, objectPath] = urlMatch;
    console.log('[resolveBucketAndPath] Extracted from URL:', { bucket, objectPath, original: input });
    return { bucket, objectPath: decodeURIComponent(objectPath) };
  }

  // Case 2: Check if path starts with a known bucket prefix
  for (const bucket of KNOWN_BUCKETS) {
    if (input.startsWith(`${bucket}/`)) {
      const objectPath = input.slice(bucket.length + 1); // Remove bucket prefix
      console.log('[resolveBucketAndPath] Stripped bucket prefix:', { bucket, objectPath, original: input });
      return { bucket, objectPath };
    }
  }

  // Case 3: Plain object key - determine bucket from path structure
  // client-documents bucket uses paths like: clientId/filename
  // documents bucket (wizard uploads) uses paths like: branchId/clientId/filename or branchId/filename
  const bucket = 'documents'; // Default bucket for care plan documents
  console.log('[resolveBucketAndPath] Using default bucket:', { bucket, objectPath: input, original: input });
  return { bucket, objectPath: input };
};

// Legacy helper for backward compatibility (used by other parts of the app)
const getStorageBucket = (filePath: string): string => {
  const { bucket } = resolveBucketAndPath(filePath);
  return bucket;
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
  // Added for document source tracking
  source?: 'client_details' | 'care_plan';
  category?: string | null;
}

// Fetch client documents from both client_documents and documents tables
export const useClientDocuments = (clientId: string) => {
  return useQuery({
    queryKey: ['client-documents', clientId],
    queryFn: async () => {
      if (!clientId) {
        console.error('[useClientDocuments] No client ID provided');
        return [];
      }

      console.log(`[useClientDocuments] Fetching documents for client: ${clientId}`);

      // Fetch from client_documents table
      const { data: clientDocs, error: clientDocsError } = await supabase
        .from('client_documents')
        .select('*')
        .eq('client_id', clientId)
        .order('created_at', { ascending: false });

      if (clientDocsError) {
        console.error('Error fetching client_documents:', clientDocsError);
      }

      // Fetch from documents table (Care Plan uploads)
      const { data: unifiedDocs, error: unifiedDocsError } = await supabase
        .from('documents')
        .select('*')
        .eq('client_id', clientId)
        .order('created_at', { ascending: false });

      if (unifiedDocsError) {
        console.error('Error fetching documents:', unifiedDocsError);
      }

      // Transform unified documents to match ClientDocument interface
      const transformedUnifiedDocs: ClientDocument[] = (unifiedDocs || []).map(doc => ({
        id: doc.id,
        name: doc.name,
        type: doc.type || 'other',
        file_path: doc.file_path,
        file_size: doc.file_size,
        uploaded_by: doc.uploaded_by_name || 'Unknown',
        upload_date: doc.created_at?.split('T')[0] || new Date().toISOString().split('T')[0],
        created_at: doc.created_at,
        updated_at: doc.updated_at,
        client_id: doc.client_id,
        source: 'care_plan' as const,
        category: doc.category
      }));

      // Mark client_documents with their source
      const transformedClientDocs: ClientDocument[] = (clientDocs || []).map(doc => ({
        ...doc,
        source: 'client_details' as const,
        category: null
      }));

      // Merge and sort by created_at
      const allDocs = [...transformedClientDocs, ...transformedUnifiedDocs]
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

      console.log(`[useClientDocuments] Total documents: ${allDocs.length} (${transformedClientDocs.length} from client_documents, ${transformedUnifiedDocs.length} from documents)`);

      return allDocs;
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
      console.log('[useViewClientDocument] Input filePath:', filePath);

      // Resolve bucket and clean object path from various input formats
      const { bucket, objectPath } = resolveBucketAndPath(filePath);
      console.log('[useViewClientDocument] Resolved:', { bucket, objectPath });

      if (!objectPath) {
        throw new Error('Invalid document path provided');
      }

      // Open a blank tab immediately to avoid popup blockers
      const newTab = window.open('about:blank', '_blank');
      
      if (!newTab) {
        throw new Error('Could not open new tab. Please check your popup blocker settings.');
      }

      try {
        // First try to download as blob to avoid ERR_BLOCKED_BY_CLIENT
        const { data: fileData, error: downloadError } = await supabase.storage
          .from(bucket)
          .download(objectPath);

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
        
        // Log the specific error for debugging
        if (downloadError) {
          console.warn('[useViewClientDocument] Blob download failed:', {
            error: downloadError.message,
            bucket,
            objectPath,
            originalInput: filePath
          });
        }
      } catch (blobError) {
        console.warn('[useViewClientDocument] Blob download exception:', blobError);
      }

      // Fallback to signed URL if blob download fails
      const { data, error } = await supabase.storage
        .from(bucket)
        .createSignedUrl(objectPath, 3600); // 1 hour expiry

      if (error) {
        newTab.close();
        console.error('[useViewClientDocument] Signed URL failed:', {
          error: error.message,
          bucket,
          objectPath,
          originalInput: filePath
        });
        throw new Error(`Failed to access document. The file may not exist or you may not have permission.`);
      }

      if (data?.signedUrl) {
        newTab.location.href = data.signedUrl;
      } else {
        newTab.close();
        throw new Error('Could not generate file URL');
      }
    },
    onError: (error) => {
      console.error('[useViewClientDocument] Error:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to view document');
    },
  });
};

// Download client document
export const useDownloadClientDocument = () => {
  return useMutation({
    mutationFn: async ({ filePath, fileName }: { filePath: string; fileName: string }) => {
      console.log('[useDownloadClientDocument] Input:', { filePath, fileName });

      // Resolve bucket and clean object path from various input formats
      const { bucket, objectPath } = resolveBucketAndPath(filePath);
      console.log('[useDownloadClientDocument] Resolved:', { bucket, objectPath });

      if (!objectPath) {
        throw new Error('Invalid document path provided');
      }

      const { data, error } = await supabase.storage
        .from(bucket)
        .download(objectPath);

      if (error) {
        console.error('[useDownloadClientDocument] Download failed:', {
          error: error.message,
          bucket,
          objectPath,
          originalInput: filePath
        });
        throw new Error(`Failed to download file. The file may not exist or you may not have permission.`);
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
      console.error('[useDownloadClientDocument] Error:', error);
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

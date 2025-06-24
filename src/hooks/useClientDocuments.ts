
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

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
    onSuccess: () => {
      toast.success('Document uploaded successfully');
      queryClient.invalidateQueries({ queryKey: ['client-documents'] });
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

      const { data } = supabase.storage
        .from('client-documents')
        .getPublicUrl(filePath);

      if (data?.publicUrl) {
        window.open(data.publicUrl, '_blank');
      } else {
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

      const { data, error } = await supabase.storage
        .from('client-documents')
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


import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface ClientDocument {
  id: string;
  client_id: string;
  name: string;
  type: string;
  uploaded_by: string;
  upload_date: string;
  file_path?: string;
  file_size?: string;
  created_at: string;
  updated_at: string;
}

const fetchClientDocuments = async (clientId: string): Promise<ClientDocument[]> => {
  console.log('[fetchClientDocuments] Fetching documents for client:', clientId);
  
  const { data, error } = await supabase
    .from('client_documents')
    .select('*')
    .eq('client_id', clientId)
    .order('upload_date', { ascending: false });

  if (error) {
    console.error('[fetchClientDocuments] Error:', error);
    throw error;
  }
  
  console.log('[fetchClientDocuments] Fetched documents:', data);
  return data || [];
};

const uploadClientDocument = async (params: {
  clientId: string;
  file: File;
  name: string;
  type: string;
  uploaded_by: string;
}) => {
  const { clientId, file, name, type, uploaded_by } = params;
  
  console.log('[uploadClientDocument] Starting upload:', { clientId, fileName: file.name, type });
  
  try {
    // Upload file to storage
    const fileExt = file.name.split('.').pop();
    const fileName = `${clientId}/${Date.now()}.${fileExt}`;
    
    console.log('[uploadClientDocument] Uploading to storage:', fileName);
    
    const { error: uploadError } = await supabase.storage
      .from('client-documents')
      .upload(fileName, file);

    if (uploadError) {
      console.error('[uploadClientDocument] Storage upload error:', uploadError);
      throw new Error(`File upload failed: ${uploadError.message}`);
    }

    console.log('[uploadClientDocument] File uploaded successfully, creating database record');

    // Create database record
    const { data, error } = await supabase
      .from('client_documents')
      .insert([{
        client_id: clientId,
        name,
        type,
        uploaded_by,
        file_path: fileName,
        file_size: `${(file.size / 1024 / 1024).toFixed(2)} MB`,
        upload_date: new Date().toISOString().split('T')[0],
      }])
      .select()
      .single();

    if (error) {
      console.error('[uploadClientDocument] Database insert error:', error);
      // Clean up uploaded file if database insert fails
      await supabase.storage.from('client-documents').remove([fileName]);
      throw new Error(`Database error: ${error.message}`);
    }

    console.log('[uploadClientDocument] Document record created successfully:', data);
    return data;
  } catch (error) {
    console.error('[uploadClientDocument] Upload failed:', error);
    throw error;
  }
};

const updateClientDocument = async ({ id, ...updates }: Partial<ClientDocument> & { id: string }) => {
  console.log('[updateClientDocument] Updating document:', id, updates);
  
  const { data, error } = await supabase
    .from('client_documents')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('[updateClientDocument] Error:', error);
    throw error;
  }
  
  console.log('[updateClientDocument] Document updated successfully:', data);
  return data;
};

const deleteClientDocument = async (id: string) => {
  console.log('[deleteClientDocument] Deleting document:', id);
  
  // First, get the document to find the file path
  const { data: document, error: fetchError } = await supabase
    .from('client_documents')
    .select('file_path')
    .eq('id', id)
    .single();

  if (fetchError) {
    console.error('[deleteClientDocument] Error fetching document:', fetchError);
    throw fetchError;
  }

  // Delete from database
  const { error: deleteError } = await supabase
    .from('client_documents')
    .delete()
    .eq('id', id);

  if (deleteError) {
    console.error('[deleteClientDocument] Error deleting document:', deleteError);
    throw deleteError;
  }

  // Delete file from storage if file_path exists
  if (document?.file_path) {
    const { error: storageError } = await supabase.storage
      .from('client-documents')
      .remove([document.file_path]);

    if (storageError) {
      console.warn('[deleteClientDocument] Storage deletion warning:', storageError);
      // Don't throw here as the database record is already deleted
    }
  }

  console.log('[deleteClientDocument] Document deleted successfully');
  return id;
};

export const useClientDocuments = (clientId: string) => {
  return useQuery({
    queryKey: ['client-documents', clientId],
    queryFn: () => fetchClientDocuments(clientId),
    enabled: Boolean(clientId),
  });
};

export const useUploadClientDocument = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: uploadClientDocument,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['client-documents', data.client_id] });
      toast.success('Document uploaded successfully');
    },
    onError: (error: any) => {
      console.error('[useUploadClientDocument] Upload failed:', error);
      toast.error('Failed to upload document', {
        description: error.message || 'Please try again later'
      });
    },
  });
};

export const useUpdateClientDocument = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateClientDocument,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['client-documents', data.client_id] });
      toast.success('Document updated successfully');
    },
    onError: (error: any) => {
      console.error('[useUpdateClientDocument] Update failed:', error);
      toast.error('Failed to update document', {
        description: error.message || 'Please try again later'
      });
    },
  });
};

export const useDeleteClientDocument = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteClientDocument,
    onSuccess: (_, documentId) => {
      // Invalidate all client-documents queries since we don't have the client_id in the response
      queryClient.invalidateQueries({ queryKey: ['client-documents'] });
      toast.success('Document deleted successfully');
    },
    onError: (error: any) => {
      console.error('[useDeleteClientDocument] Delete failed:', error);
      toast.error('Failed to delete document', {
        description: error.message || 'Please try again later'
      });
    },
  });
};

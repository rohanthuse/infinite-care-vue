
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface ClientDocument {
  id: string;
  client_id: string;
  name: string;
  type: string;
  file_path?: string;
  file_size?: string;
  uploaded_by: string;
  upload_date: string;
  created_at: string;
  updated_at: string;
}

const fetchClientDocuments = async (clientId: string): Promise<ClientDocument[]> => {
  console.log('[fetchClientDocuments] Fetching for client:', clientId);
  
  const { data, error } = await supabase
    .from('client_documents')
    .select('*')
    .eq('client_id', clientId)
    .order('upload_date', { ascending: false });

  if (error) {
    console.error('[fetchClientDocuments] Error:', error);
    throw error;
  }

  return data || [];
};

const uploadClientDocument = async ({ clientId, file, name, type, uploaded_by }: {
  clientId: string;
  file: File;
  name: string;
  type: string;
  uploaded_by: string;
}) => {
  console.log('[uploadClientDocument] Uploading:', { clientId, name, type });
  
  try {
    // Generate a unique file path
    const fileExt = file.name.split('.').pop();
    const fileName = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}.${fileExt}`;
    const filePath = `${clientId}/${fileName}`;

    // For now, we'll create the document record without actual file upload
    // In a production app, you would upload to Supabase Storage first
    console.log('[uploadClientDocument] Would upload file to:', filePath);
    
    const { data, error } = await supabase
      .from('client_documents')
      .insert({
        client_id: clientId,
        name,
        type,
        uploaded_by,
        file_size: `${Math.round(file.size / 1024)} KB`,
        file_path: filePath,
      })
      .select()
      .single();

    if (error) {
      console.error('[uploadClientDocument] Error:', error);
      throw error;
    }

    return data;
  } catch (error) {
    console.error('[uploadClientDocument] Unexpected error:', error);
    throw error;
  }
};

const updateClientDocument = async ({ id, name, type, uploaded_by }: {
  id: string;
  name: string;
  type: string;
  uploaded_by: string;
}) => {
  console.log('[updateClientDocument] Updating:', { id, name, type });
  
  const { data, error } = await supabase
    .from('client_documents')
    .update({ name, type, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('[updateClientDocument] Error:', error);
    throw error;
  }

  return data;
};

const deleteClientDocument = async (id: string) => {
  console.log('[deleteClientDocument] Deleting:', id);
  
  const { error } = await supabase
    .from('client_documents')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('[deleteClientDocument] Error:', error);
    throw error;
  }

  return { id };
};

const viewClientDocument = async ({ filePath }: { filePath: string }) => {
  console.log('[viewClientDocument] Opening:', filePath);
  
  // In a real implementation, this would:
  // 1. Get a signed URL from Supabase Storage
  // 2. Open the document in a new tab or modal viewer
  // For now, we'll show a mock success message
  
  try {
    // Mock successful viewing
    const viewUrl = `https://example.com/documents/${filePath}`;
    window.open(viewUrl, '_blank');
    toast.success("Document viewer opened");
    return { success: true };
  } catch (error) {
    console.error('[viewClientDocument] Error:', error);
    toast.error("Unable to open document viewer");
    throw error;
  }
};

const downloadClientDocument = async ({ filePath, fileName }: { filePath: string; fileName: string }) => {
  console.log('[downloadClientDocument] Downloading:', { filePath, fileName });
  
  // In a real implementation, this would:
  // 1. Get a signed URL from Supabase Storage
  // 2. Trigger a download
  // For now, we'll show a mock success message
  
  try {
    // Mock successful download
    const downloadUrl = `https://example.com/documents/${filePath}`;
    const link = document.createElement('a');
    link.href = downloadUrl;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    toast.success(`Download started for ${fileName}`);
    return { success: true };
  } catch (error) {
    console.error('[downloadClientDocument] Error:', error);
    toast.error("Download failed");
    throw error;
  }
};

export const useClientDocuments = (clientId: string) => {
  return useQuery({
    queryKey: ['client-documents', clientId],
    queryFn: () => fetchClientDocuments(clientId),
    enabled: Boolean(clientId),
    staleTime: 5 * 60 * 1000,
  });
};

export const useUploadClientDocument = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: uploadClientDocument,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['client-documents', data.client_id] });
      toast.success("Document uploaded successfully");
    },
    onError: (error) => {
      console.error('[useUploadClientDocument] Error:', error);
      toast.error("Failed to upload document");
    }
  });
};

export const useUpdateClientDocument = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: updateClientDocument,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['client-documents', data.client_id] });
      toast.success("Document updated successfully");
    },
    onError: (error) => {
      console.error('[useUpdateClientDocument] Error:', error);
      toast.error("Failed to update document");
    }
  });
};

export const useDeleteClientDocument = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: deleteClientDocument,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['client-documents'] });
      toast.success("Document deleted successfully");
    },
    onError: (error) => {
      console.error('[useDeleteClientDocument] Error:', error);
      toast.error("Failed to delete document");
    }
  });
};

export const useViewClientDocument = () => {
  return useMutation({
    mutationFn: viewClientDocument,
  });
};

export const useDownloadClientDocument = () => {
  return useMutation({
    mutationFn: downloadClientDocument,
  });
};

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
  console.log('[uploadClientDocument] Starting upload:', { clientId, name, type, fileSize: file.size });
  
  try {
    // Validate inputs
    if (!name.trim()) {
      throw new Error('Document name is required');
    }
    
    if (!type.trim()) {
      throw new Error('Document type is required');
    }

    // Generate a unique file path
    const fileExt = file.name.split('.').pop();
    const fileName = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}.${fileExt}`;
    const filePath = `${clientId}/${fileName}`;

    console.log('[uploadClientDocument] Creating database record...');
    
    const { data, error } = await supabase
      .from('client_documents')
      .insert({
        client_id: clientId,
        name: name.trim(),
        type: type.trim(),
        uploaded_by,
        file_size: `${Math.round(file.size / 1024)} KB`,
        file_path: filePath,
      })
      .select()
      .single();

    if (error) {
      console.error('[uploadClientDocument] Database error:', error);
      throw error;
    }

    console.log('[uploadClientDocument] Upload successful:', data);
    return data;
  } catch (error) {
    console.error('[uploadClientDocument] Upload failed:', error);
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
    staleTime: 10 * 60 * 1000, // 10 minutes - increased from 5 minutes
    refetchOnWindowFocus: false, // Prevent refetch on window focus
    refetchOnMount: false, // Prevent refetch on component mount if data exists
    retry: 2, // Reduce retry attempts
  });
};

export const useUploadClientDocument = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: uploadClientDocument,
    onMutate: async ({ clientId, name, type }) => {
      console.log('[useUploadClientDocument] Starting optimistic update...');
      
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['client-documents', clientId] });
      
      // Snapshot previous value
      const previousDocuments = queryClient.getQueryData(['client-documents', clientId]);
      
      // Optimistically update
      const tempDocument = {
        id: 'temp-' + Date.now(),
        client_id: clientId,
        name,
        type,
        uploaded_by: 'Current User',
        upload_date: new Date().toISOString(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        file_size: 'Uploading...',
        file_path: ''
      };
      
      queryClient.setQueryData(['client-documents', clientId], (old: ClientDocument[] | undefined) => 
        old ? [tempDocument, ...old] : [tempDocument]
      );
      
      return { previousDocuments };
    },
    onSuccess: (data) => {
      console.log('[useUploadClientDocument] Upload successful, updating cache...');
      queryClient.invalidateQueries({ queryKey: ['client-documents', data.client_id] });
      toast.success("Document uploaded successfully", {
        description: `${data.name} has been uploaded to the system.`
      });
    },
    onError: (error, variables, context) => {
      console.error('[useUploadClientDocument] Upload failed:', error);
      
      // Rollback optimistic update
      if (context?.previousDocuments) {
        queryClient.setQueryData(['client-documents', variables.clientId], context.previousDocuments);
      }
      
      const errorMessage = error.message || "Failed to upload document";
      toast.error("Upload failed", {
        description: errorMessage
      });
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

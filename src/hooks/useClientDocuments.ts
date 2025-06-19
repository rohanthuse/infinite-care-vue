
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

    console.log('[uploadClientDocument] Uploading to storage...');
    
    // Upload file to Supabase Storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('client-documents')
      .upload(filePath, file);

    if (uploadError) {
      console.error('[uploadClientDocument] Storage upload error:', uploadError);
      throw uploadError;
    }

    console.log('[uploadClientDocument] Storage upload successful, creating database record...');
    
    const { data, error } = await supabase
      .from('client_documents')
      .insert({
        client_id: clientId,
        name: name.trim(),
        type: type.trim(),
        uploaded_by,
        file_size: `${Math.round(file.size / 1024)} KB`,
        file_path: uploadData.path,
      })
      .select()
      .single();

    if (error) {
      console.error('[uploadClientDocument] Database error:', error);
      // If database insert fails, clean up the uploaded file
      await supabase.storage
        .from('client-documents')
        .remove([uploadData.path]);
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
  
  // First get the document to find the file path
  const { data: doc, error: fetchError } = await supabase
    .from('client_documents')
    .select('file_path')
    .eq('id', id)
    .single();

  if (fetchError) {
    console.error('[deleteClientDocument] Fetch error:', fetchError);
    throw fetchError;
  }

  // Delete from storage if file path exists
  if (doc.file_path) {
    const { error: storageError } = await supabase.storage
      .from('client-documents')
      .remove([doc.file_path]);
    
    if (storageError) {
      console.error('[deleteClientDocument] Storage deletion error:', storageError);
      // Continue with database deletion even if storage deletion fails
    }
  }

  // Delete from database
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
  console.log('[viewClientDocument] Getting signed URL for:', filePath);
  
  try {
    // Get a signed URL from Supabase Storage
    const { data, error } = await supabase.storage
      .from('client-documents')
      .createSignedUrl(filePath, 3600); // Valid for 1 hour

    if (error) {
      console.error('[viewClientDocument] Error getting signed URL:', error);
      throw error;
    }

    if (data?.signedUrl) {
      window.open(data.signedUrl, '_blank');
      toast.success("Document opened in new tab");
      return { success: true };
    } else {
      throw new Error('Failed to generate document URL');
    }
  } catch (error) {
    console.error('[viewClientDocument] Error:', error);
    toast.error("Unable to open document viewer");
    throw error;
  }
};

const downloadClientDocument = async ({ filePath, fileName }: { filePath: string; fileName: string }) => {
  console.log('[downloadClientDocument] Downloading:', { filePath, fileName });
  
  try {
    // Get a signed URL for download
    const { data, error } = await supabase.storage
      .from('client-documents')
      .createSignedUrl(filePath, 3600);

    if (error) {
      console.error('[downloadClientDocument] Error getting signed URL:', error);
      throw error;
    }

    if (data?.signedUrl) {
      const link = document.createElement('a');
      link.href = data.signedUrl;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      toast.success(`Download started for ${fileName}`);
      return { success: true };
    } else {
      throw new Error('Failed to generate download URL');
    }
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
    staleTime: 30 * 60 * 1000, // 30 minutes - increased to prevent frequent refetches
    refetchOnWindowFocus: false, // Prevent refetch on window focus
    refetchOnMount: false, // Prevent refetch on component mount if data exists
    refetchOnReconnect: false, // Prevent refetch when network reconnects
    refetchInterval: false, // Disable automatic periodic refetches
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
      console.log('[useUploadClientDocument] Upload successful, updating cache with real data...');
      
      // Update the cache with the real document data instead of invalidating
      queryClient.setQueryData(['client-documents', data.client_id], (old: ClientDocument[] | undefined) => {
        if (!old) return [data];
        
        // Replace the temporary document with the real one
        return old.map(doc => 
          doc.id.startsWith('temp-') ? data : doc
        );
      });
      
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
      // Update cache directly instead of invalidating
      queryClient.setQueryData(['client-documents', data.client_id], (old: ClientDocument[] | undefined) => {
        if (!old) return [data];
        return old.map(doc => doc.id === data.id ? data : doc);
      });
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
    onSuccess: (result, variables) => {
      // Update cache directly by removing the deleted document
      queryClient.setQueryData(['client-documents'], (old: ClientDocument[] | undefined) => {
        if (!old) return [];
        return old.filter(doc => doc.id !== variables);
      });
      
      // Also update specific client cache
      queryClient.getQueryCache().findAll(['client-documents']).forEach(query => {
        if (query.queryKey[0] === 'client-documents' && query.queryKey[1]) {
          queryClient.setQueryData(query.queryKey, (old: ClientDocument[] | undefined) => {
            if (!old) return [];
            return old.filter(doc => doc.id !== variables);
          });
        }
      });
      
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


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
  const { data, error } = await supabase
    .from('client_documents')
    .select('*')
    .eq('client_id', clientId)
    .order('upload_date', { ascending: false });

  if (error) throw error;
  return data || [];
};

const createClientDocument = async (document: Omit<ClientDocument, 'id' | 'created_at' | 'updated_at'>) => {
  const { data, error } = await supabase
    .from('client_documents')
    .insert([document])
    .select()
    .single();

  if (error) throw error;
  return data;
};

const updateClientDocument = async (document: { id: string; name: string; type: string; uploaded_by: string }) => {
  const { data, error } = await supabase
    .from('client_documents')
    .update({
      name: document.name,
      type: document.type,
      uploaded_by: document.uploaded_by,
      updated_at: new Date().toISOString()
    })
    .eq('id', document.id)
    .select()
    .single();

  if (error) throw error;
  return data;
};

const deleteClientDocument = async (documentId: string) => {
  const { error } = await supabase
    .from('client_documents')
    .delete()
    .eq('id', documentId);

  if (error) throw error;
};

const uploadClientDocument = async (params: {
  clientId: string;
  file: File;
  name: string;
  type: string;
  uploaded_by: string;
}) => {
  // For now, we'll just create the document record without actual file upload
  // In a real implementation, you'd upload to Supabase Storage first
  const document = {
    client_id: params.clientId,
    name: params.name,
    type: params.type,
    uploaded_by: params.uploaded_by,
    upload_date: new Date().toISOString().split('T')[0],
    file_size: `${Math.round(params.file.size / 1024)} KB`,
    file_path: `/uploads/${params.clientId}/${params.file.name}`
  };

  return createClientDocument(document);
};

export const useClientDocuments = (clientId: string) => {
  return useQuery({
    queryKey: ['client-documents', clientId],
    queryFn: () => fetchClientDocuments(clientId),
    enabled: Boolean(clientId),
  });
};

export const useCreateClientDocument = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createClientDocument,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['client-documents', data.client_id] });
      toast.success('Document uploaded successfully');
    },
    onError: () => {
      toast.error('Failed to upload document');
    },
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
    onError: () => {
      toast.error('Failed to upload document');
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
    onError: () => {
      toast.error('Failed to update document');
    },
  });
};

export const useDeleteClientDocument = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteClientDocument,
    onSuccess: (_, documentId) => {
      queryClient.invalidateQueries({ queryKey: ['client-documents'] });
      toast.success('Document deleted successfully');
    },
    onError: () => {
      toast.error('Failed to delete document');
    },
  });
};


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


import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

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

const uploadClientDocument = async (params: {
  clientId: string;
  file: File;
  name: string;
  type: string;
  uploaded_by: string;
}) => {
  const { clientId, file, name, type, uploaded_by } = params;
  
  // Upload file to storage
  const fileExt = file.name.split('.').pop();
  const fileName = `${clientId}/${Date.now()}.${fileExt}`;
  
  const { error: uploadError } = await supabase.storage
    .from('client-documents')
    .upload(fileName, file);

  if (uploadError) throw uploadError;

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

export const useUploadClientDocument = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: uploadClientDocument,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['client-documents', data.client_id] });
    },
  });
};

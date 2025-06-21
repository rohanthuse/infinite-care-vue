
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface AgreementFile {
  id: string;
  agreement_id: string | null;
  template_id: string | null;
  scheduled_agreement_id: string | null;
  file_name: string;
  file_type: string;
  file_size: number;
  storage_path: string;
  file_category: 'document' | 'signature' | 'template' | 'attachment';
  uploaded_by: string | null;
  created_at: string;
  updated_at: string;
}

const fetchAgreementFiles = async (params: {
  agreementId?: string;
  templateId?: string;
  scheduledAgreementId?: string;
  category?: string;
}) => {
  let query = supabase.from('agreement_files').select('*');
  
  if (params.agreementId) {
    query = query.eq('agreement_id', params.agreementId);
  }
  if (params.templateId) {
    query = query.eq('template_id', params.templateId);
  }
  if (params.scheduledAgreementId) {
    query = query.eq('scheduled_agreement_id', params.scheduledAgreementId);
  }
  if (params.category) {
    query = query.eq('file_category', params.category);
  }
  
  const { data, error } = await query.order('created_at', { ascending: false });
  if (error) throw new Error(error.message);
  return data as AgreementFile[];
};

export const useAgreementFiles = (params: {
  agreementId?: string;
  templateId?: string;
  scheduledAgreementId?: string;
  category?: string;
}) => {
  return useQuery<AgreementFile[], Error>({
    queryKey: ['agreement_files', params],
    queryFn: () => fetchAgreementFiles(params),
    enabled: !!(params.agreementId || params.templateId || params.scheduledAgreementId)
  });
};

const updateFileCategory = async ({ fileId, category }: { fileId: string; category: string }) => {
  const { error } = await supabase
    .from('agreement_files')
    .update({ file_category: category })
    .eq('id', fileId);
  
  if (error) throw new Error(error.message);
};

export const useUpdateFileCategory = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: updateFileCategory,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['agreement_files'] });
      toast.success('File category updated');
    },
    onError: (error) => {
      toast.error(`Update failed: ${error.message}`);
    }
  });
};

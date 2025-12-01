import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface SystemTenantAgreementFile {
  id: string;
  agreement_id: string | null;
  template_id: string | null;
  file_name: string;
  file_type: string;
  file_size: number;
  storage_path: string;
  file_category: 'document' | 'signature' | 'template' | 'attachment';
  uploaded_by: string | null;
  created_at: string;
  updated_at: string;
}

const fetchFiles = async (params: {
  agreementId?: string;
  templateId?: string;
  category?: 'document' | 'signature' | 'template' | 'attachment';
}) => {
  let query = supabase.from('system_tenant_agreement_files').select('*');
  
  if (params.agreementId) {
    query = query.eq('agreement_id', params.agreementId);
  }
  if (params.templateId) {
    query = query.eq('template_id', params.templateId);
  }
  if (params.category) {
    query = query.eq('file_category', params.category);
  }
  
  const { data, error } = await query.order('created_at', { ascending: false });
  if (error) throw new Error(error.message);
  return data as SystemTenantAgreementFile[];
};

export const useSystemTenantAgreementFiles = (params: {
  agreementId?: string;
  templateId?: string;
  category?: 'document' | 'signature' | 'template' | 'attachment';
}) => {
  return useQuery<SystemTenantAgreementFile[], Error>({
    queryKey: ['system_tenant_agreement_files', params],
    queryFn: () => fetchFiles(params),
    enabled: !!(params.agreementId || params.templateId)
  });
};


import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface CarerDocument {
  id: string;
  staff_id: string;
  document_type: string;
  status: string;
  expiry_date?: string;
  created_at: string;
}

const fetchCarerDocuments = async (carerId: string): Promise<CarerDocument[]> => {
  console.log('[fetchCarerDocuments] Fetching documents for carer:', carerId);
  
  const { data, error } = await supabase
    .from('staff_documents')
    .select('*')
    .eq('staff_id', carerId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('[fetchCarerDocuments] Error:', error);
    throw error;
  }

  return data || [];
};

export const useCarerDocuments = (carerId: string) => {
  return useQuery({
    queryKey: ['carer-documents', carerId],
    queryFn: () => fetchCarerDocuments(carerId),
    enabled: Boolean(carerId),
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
};

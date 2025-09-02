import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Agreement } from '@/types/agreements';

interface UseClientAgreementsParams {
  searchQuery?: string;
  statusFilter?: "Active" | "Pending" | "Expired" | "Terminated";
}

const fetchClientAgreements = async (params: UseClientAgreementsParams): Promise<Agreement[]> => {
  let query = supabase
    .from('agreements')
    .select(`
      *,
      agreement_types (
        name
      )
    `)
    .eq('signing_party', 'client')
    .eq('signed_by_client_id', (await supabase.auth.getUser()).data.user?.id);

  if (params.searchQuery) {
    query = query.ilike('title', `%${params.searchQuery}%`);
  }

  if (params.statusFilter) {
    query = query.eq('status', params.statusFilter);
  }

  query = query.order('created_at', { ascending: false });

  const { data, error } = await query;

  if (error) {
    throw new Error(error.message);
  }

  return data as Agreement[];
};

export const useClientAgreements = (params: UseClientAgreementsParams = {}) => {
  return useQuery<Agreement[], Error>({
    queryKey: ['client_agreements', params],
    queryFn: () => fetchClientAgreements(params)
  });
};
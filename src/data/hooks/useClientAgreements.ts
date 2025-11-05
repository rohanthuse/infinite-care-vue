import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Agreement } from '@/types/agreements';

interface UseClientAgreementsParams {
  searchQuery?: string;
  statusFilter?: "Active" | "Pending" | "Expired" | "Terminated";
}

const fetchClientAgreements = async (params: UseClientAgreementsParams): Promise<Agreement[]> => {
  const userId = (await supabase.auth.getUser()).data.user?.id;
  
  let query = supabase
    .from('agreements')
    .select(`
      *,
      agreement_types (
        name
      ),
      agreement_signers (
        id,
        signer_name,
        signer_type
      )
    `);
  
  // Filter for agreements where the current user is a signer
  const { data: agreements, error } = await query.order('created_at', { ascending: false });
  
  if (error) throw new Error(error.message);
  
  // Filter agreements where user is a signer
  const filteredAgreements = (agreements || []).filter(agreement => {
    return agreement.agreement_signers?.some((signer: any) => 
      signer.signer_type === 'client' && agreement.signing_party === 'client'
    );
  });
  
  let result = filteredAgreements;

  if (params.searchQuery) {
    result = result.filter(a => 
      a.title.toLowerCase().includes(params.searchQuery!.toLowerCase())
    );
  }

  if (params.statusFilter) {
    result = result.filter(a => a.status === params.statusFilter);
  }

  return result as Agreement[];
};

export const useClientAgreements = (params: UseClientAgreementsParams = {}) => {
  return useQuery<Agreement[], Error>({
    queryKey: ['client_agreements', params],
    queryFn: () => fetchClientAgreements(params)
  });
};
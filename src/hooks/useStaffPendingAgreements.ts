import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Agreement } from '@/types/agreements';

interface UseStaffPendingAgreementsParams {
  searchQuery?: string;
}

const fetchStaffPendingAgreements = async (params: UseStaffPendingAgreementsParams): Promise<Agreement[]> => {
  const userId = (await supabase.auth.getUser()).data.user?.id;
  
  console.log('[useStaffPendingAgreements] Fetching pending agreements for user:', userId);
  
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
        signer_type,
        signer_auth_user_id,
        signing_status,
        signed_at,
        signature_file_id
      ),
      agreement_files!agreement_id (
        id,
        file_name,
        file_type,
        file_size,
        storage_path,
        file_category,
        created_at
      )
    `);
  
  const { data: agreements, error } = await query.order('created_at', { ascending: false });
  
  if (error) throw new Error(error.message);
  
  // Filter agreements where the current logged-in user is assigned as a signer with pending status
  const filteredAgreements = (agreements || []).filter(agreement => {
    const userSigner = agreement.agreement_signers?.find((signer: any) => 
      signer.signer_type === 'staff' && 
      signer.signer_auth_user_id === userId
    );
    
    const isPending = userSigner && userSigner.signing_status === 'pending';
    
    if (isPending) {
      console.log('[useStaffPendingAgreements] Found pending agreement for user:', agreement.title);
    }
    
    return isPending;
  });
  
  console.log('[useStaffPendingAgreements] Found', filteredAgreements.length, 'pending agreements for user');
  
  let result = filteredAgreements;

  if (params.searchQuery) {
    result = result.filter(a => 
      a.title.toLowerCase().includes(params.searchQuery!.toLowerCase())
    );
  }

  return result as Agreement[];
};

export const useStaffPendingAgreements = (params: UseStaffPendingAgreementsParams = {}) => {
  return useQuery<Agreement[], Error>({
    queryKey: ['staff_pending_agreements', params],
    queryFn: () => fetchStaffPendingAgreements(params)
  });
};

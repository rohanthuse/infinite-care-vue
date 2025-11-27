import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { ScheduledAgreement } from '@/types/agreements';

interface UseClientScheduledAgreementsParams {
  searchQuery?: string;
  statusFilter?: string;
}

const fetchClientScheduledAgreements = async (params: UseClientScheduledAgreementsParams = {}): Promise<ScheduledAgreement[]> => {
  const { searchQuery = '', statusFilter } = params;

  // Get current user
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    throw new Error('User not authenticated');
  }

  // Find client record for current user
  const { data: client, error: clientError } = await supabase
    .from('clients')
    .select('id')
    .eq('auth_user_id', user.id)
    .single();

  if (clientError || !client) {
    throw new Error('Client record not found');
  }

  // Fetch scheduled agreements for this client
  let query = supabase
    .from('scheduled_agreements')
    .select(`
      *,
      agreement_types (name)
    `)
    .eq('scheduled_with_client_id', client.id)
    .in('status', ['Upcoming', 'Pending Approval', 'Under Review']); // Exclude completed/cancelled

  if (searchQuery) {
    query = query.ilike('title', `%${searchQuery}%`);
  }

  if (statusFilter && statusFilter !== 'all') {
    query = query.eq('status', statusFilter as 'Upcoming' | 'Pending Approval' | 'Under Review' | 'Completed' | 'Cancelled');
  }

  const { data, error } = await query.order('scheduled_for', { ascending: true });

  if (error) {
    throw new Error(error.message);
  }

  return (data || []) as ScheduledAgreement[];
};

export const useClientScheduledAgreements = (params: UseClientScheduledAgreementsParams = {}) => {
  return useQuery<ScheduledAgreement[], Error>({
    queryKey: ['client_scheduled_agreements', params],
    queryFn: () => fetchClientScheduledAgreements(params),
  });
};

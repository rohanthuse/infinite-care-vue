import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { Branch } from '@/pages/Branch';

const fetchBranchesForNavigation = async (): Promise<Branch[]> => {
  const { data, error } = await supabase
    .from('branches')
    .select('*')
    .eq('status', 'Active')
    .order('name');
  
  if (error) throw error;
  return data as Branch[];
};

export const useBranchNavigation = () => {
  return useQuery({
    queryKey: ['branches-navigation'],
    queryFn: fetchBranchesForNavigation,
  });
};
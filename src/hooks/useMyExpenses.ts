import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useCarerProfile } from './useCarerProfile';

export interface MyExpense {
  id: string;
  description: string;
  category: string;
  amount: number;
  expense_date: string;
  status: string;
  payment_method: string;
  receipt_url: string | null;
  notes: string | null;
  approved_at: string | null;
  approved_by: string | null;
  created_at: string;
}

export const useMyExpenses = () => {
  const { data: carerProfile } = useCarerProfile();

  return useQuery({
    queryKey: ['my-expenses', carerProfile?.id],
    queryFn: async () => {
      if (!carerProfile?.id) {
        throw new Error('Carer profile not found');
      }

      const { data, error } = await supabase
        .from('expenses')
        .select('*')
        .eq('staff_id', carerProfile.id)
        .order('expense_date', { ascending: false });

      if (error) throw error;

      return data as MyExpense[];
    },
    enabled: !!carerProfile?.id,
  });
};
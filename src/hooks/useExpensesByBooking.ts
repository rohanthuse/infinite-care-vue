import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface BookingExpense {
  id: string;
  description: string;
  category: string;
  amount: number;
  status: string;
  rejection_reason: string | null;
  expense_date: string;
  metadata: Record<string, any> | null;
  created_at: string;
}

export const useExpensesByBooking = (bookingId?: string) => {
  return useQuery({
    queryKey: ['expenses-by-booking', bookingId],
    queryFn: async () => {
      if (!bookingId) return [];

      const { data, error } = await supabase
        .from('expenses')
        .select('id, description, category, amount, status, rejection_reason, expense_date, metadata, created_at')
        .eq('booking_id', bookingId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as BookingExpense[];
    },
    enabled: !!bookingId,
  });
};

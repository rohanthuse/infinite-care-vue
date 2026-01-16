import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';

export interface FutureCarerBookingDB {
  id: string;
  staff_id: string;
  start_time: string;
  end_time: string;
  status: string;
  location_address: string | null;
  clients: {
    id: string;
    first_name: string;
    last_name: string;
    client_addresses: Array<{
      address_line_1: string;
      city: string;
      postcode: string;
      is_default: boolean | null;
    }> | null;
  } | null;
}

const fetchFutureCarerBookings = async (
  branchId: string,
  carerId: string,
  dateFrom: Date,
  dateTo: Date
): Promise<FutureCarerBookingDB[]> => {
  const startOfDay = `${format(dateFrom, 'yyyy-MM-dd')}T00:00:00`;
  const endOfDay = `${format(dateTo, 'yyyy-MM-dd')}T23:59:59`;

  const { data, error } = await supabase
    .from('bookings')
    .select(`
      id,
      staff_id,
      start_time,
      end_time,
      status,
      location_address,
      clients (
        id,
        first_name,
        last_name,
        client_addresses (
          address_line_1,
          city,
          postcode,
          is_default
        )
      )
    `)
    .eq('branch_id', branchId)
    .eq('staff_id', carerId)
    .gte('start_time', startOfDay)
    .lte('start_time', endOfDay)
    .neq('status', 'cancelled')
    .order('start_time', { ascending: true });

  if (error) throw error;
  return (data || []) as FutureCarerBookingDB[];
};

export const useFutureCarerBookings = (
  branchId?: string,
  carerId?: string,
  dateFrom?: Date,
  dateTo?: Date
) => {
  return useQuery({
    queryKey: ['future-carer-bookings', branchId, carerId, 
               dateFrom?.toISOString(), dateTo?.toISOString()],
    queryFn: () => fetchFutureCarerBookings(branchId!, carerId!, dateFrom!, dateTo!),
    enabled: !!branchId && !!carerId && !!dateFrom && !!dateTo,
    staleTime: 30 * 1000, // 30 seconds
  });
};

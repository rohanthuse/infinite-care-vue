import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface BookingRelatedRecords {
  bookingServicesCount: number;
  expensesCount: number;
  extraTimeRecordsCount: number;
  hasRelatedRecords: boolean;
}

export async function fetchBookingRelatedRecords(bookingId: string): Promise<BookingRelatedRecords> {
  console.log('[fetchBookingRelatedRecords] Fetching related records for booking:', bookingId);
  
  const [bookingServices, expenses, extraTimeRecords] = await Promise.all([
    supabase
      .from('booking_services')
      .select('id', { count: 'exact', head: true })
      .eq('booking_id', bookingId),
    supabase
      .from('expenses')
      .select('id', { count: 'exact', head: true })
      .eq('booking_id', bookingId),
    supabase
      .from('extra_time_records')
      .select('id', { count: 'exact', head: true })
      .eq('booking_id', bookingId),
  ]);
  
  const result = {
    bookingServicesCount: bookingServices.count || 0,
    expensesCount: expenses.count || 0,
    extraTimeRecordsCount: extraTimeRecords.count || 0,
    hasRelatedRecords: 
      (bookingServices.count || 0) + 
      (expenses.count || 0) + 
      (extraTimeRecords.count || 0) > 0
  };
  
  console.log('[fetchBookingRelatedRecords] Result:', result);
  return result;
}

export function useBookingRelatedRecords() {
  const [isLoading, setIsLoading] = useState(false);
  const [relatedRecords, setRelatedRecords] = useState<BookingRelatedRecords | null>(null);
  const [error, setError] = useState<string | null>(null);

  const checkRelatedRecords = async (bookingId: string) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const records = await fetchBookingRelatedRecords(bookingId);
      setRelatedRecords(records);
      return records;
    } catch (err: any) {
      console.error('[useBookingRelatedRecords] Error:', err);
      setError(err.message || 'Failed to check related records');
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  const reset = () => {
    setRelatedRecords(null);
    setError(null);
  };

  return {
    isLoading,
    relatedRecords,
    error,
    checkRelatedRecords,
    reset
  };
}

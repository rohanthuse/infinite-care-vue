import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface InvoiceExtraTime {
  id: string;
  description: string;
  duration_minutes: number;
  rate_per_hour: number;
  total_cost: number;
  service_date?: string;
}

/**
 * Hook to fetch extra time entries linked to an invoice for the client portal.
 */
export const useClientInvoiceExtraTime = (invoiceId: string) => {
  return useQuery({
    queryKey: ['client-invoice-extra-time', invoiceId],
    queryFn: async (): Promise<InvoiceExtraTime[]> => {
      // Fetch line items that represent extra time
      const { data: lineItems, error: lineItemsError } = await supabase
        .from('invoice_line_items')
        .select('*')
        .eq('invoice_id', invoiceId)
        .order('created_at', { ascending: true });

      if (lineItemsError) throw lineItemsError;

      // Filter and transform extra time items
      const extraTimeItems: InvoiceExtraTime[] = (lineItems || [])
        .filter(item => 
          item.description?.toLowerCase().includes('extra time') ||
          item.description?.toLowerCase().includes('overtime') ||
          item.description?.toLowerCase().includes('additional time')
        )
        .map(item => {
          // Calculate duration in minutes from quantity (assuming quantity is hours)
          const durationMinutes = (item.quantity || 0) * 60;
          const ratePerHour = item.unit_price || 0;
          const totalCost = item.line_total || (item.quantity * item.unit_price);

          return {
            id: item.id,
            description: item.description || 'Extra Time',
            duration_minutes: durationMinutes,
            rate_per_hour: ratePerHour,
            total_cost: totalCost,
            service_date: item.created_at || undefined,
          };
        });

      return extraTimeItems;
    },
    enabled: Boolean(invoiceId),
  });
};

/**
 * Helper function to format duration from minutes to readable string.
 */
export const formatDuration = (minutes: number): string => {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  
  if (hours > 0 && mins > 0) {
    return `${hours}h ${mins}m`;
  } else if (hours > 0) {
    return `${hours}h`;
  } else {
    return `${mins}m`;
  }
};

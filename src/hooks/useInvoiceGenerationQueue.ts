import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { BillingFrequency } from '@/types/clientAccounting';

export interface ClientReadyForInvoicing {
  id: string;
  first_name: string;
  last_name: string;
  billing_frequency: BillingFrequency;
  last_invoice_generated_at?: string;
  branch_id: string;
  organization_id: string;
  uninvoiced_count: number;
  unbilled_amount: number;
  last_booking_date?: string;
}

const fetchClientsReadyForInvoicing = async (branchId: string): Promise<ClientReadyForInvoicing[]> => {
  console.log('[fetchClientsReadyForInvoicing] Fetching for branch:', branchId);
  
  // Query clients with uninvoiced bookings
  const { data: clientsData, error: clientsError } = await supabase
    .from('clients')
    .select('id, first_name, last_name, billing_frequency, last_invoice_generated_at, branch_id, organization_id, auto_generate_invoices, uninvoiced_bookings_count')
    .eq('branch_id', branchId)
    .eq('auto_generate_invoices', true)
    .gt('uninvoiced_bookings_count', 0);

  if (clientsError) {
    console.error('[fetchClientsReadyForInvoicing] Error:', clientsError);
    throw clientsError;
  }

  if (!clientsData || clientsData.length === 0) {
    return [];
  }

  // Fetch unbilled amounts for each client
  const clientIds = clientsData.map(c => c.id);
  const { data: bookingsData, error: bookingsError } = await supabase
    .from('bookings')
    .select('client_id, revenue')
    .in('client_id', clientIds)
    .in('status', ['done', 'completed'])
    .eq('is_invoiced', false);

  if (bookingsError) {
    console.error('[fetchClientsReadyForInvoicing] Bookings error:', bookingsError);
    throw bookingsError;
  }

  // Aggregate bookings by client
  const clientBookingsMap = new Map<string, { count: number; amount: number; lastDate?: string }>();
  
  (bookingsData || []).forEach(booking => {
    const existing = clientBookingsMap.get(booking.client_id) || { count: 0, amount: 0 };
    clientBookingsMap.set(booking.client_id, {
      count: existing.count + 1,
      amount: existing.amount + (Number(booking.revenue) || 0),
    });
  });

  // Map to result format
  const results: ClientReadyForInvoicing[] = clientsData
    .filter(client => clientBookingsMap.has(client.id))
    .map(client => {
      const bookingStats = clientBookingsMap.get(client.id)!;
      return {
        id: client.id,
        first_name: client.first_name,
        last_name: client.last_name,
        billing_frequency: (client.billing_frequency || 'monthly') as BillingFrequency,
        last_invoice_generated_at: client.last_invoice_generated_at || undefined,
        branch_id: client.branch_id,
        organization_id: client.organization_id,
        uninvoiced_count: bookingStats.count,
        unbilled_amount: bookingStats.amount,
        last_booking_date: undefined,
      };
    });

  console.log('[fetchClientsReadyForInvoicing] Found', results.length, 'clients ready for invoicing');
  return results;
};

export const useInvoiceGenerationQueue = (branchId: string) => {
  return useQuery({
    queryKey: ['invoice-generation-queue', branchId],
    queryFn: () => fetchClientsReadyForInvoicing(branchId),
    enabled: Boolean(branchId),
    refetchInterval: 60000, // Refresh every minute
  });
};

export const useInvoiceQueueStats = (branchId: string) => {
  const { data: clients = [], isLoading } = useInvoiceGenerationQueue(branchId);

  const stats = {
    totalReady: clients.length,
    totalAmount: clients.reduce((sum, client) => sum + Number(client.unbilled_amount || 0), 0),
    byFrequency: {
      weekly: clients.filter(c => c.billing_frequency === 'weekly').length,
      fortnightly: clients.filter(c => c.billing_frequency === 'fortnightly').length,
      monthly: clients.filter(c => c.billing_frequency === 'monthly').length,
      on_demand: clients.filter(c => c.billing_frequency === 'on_demand').length,
    },
    overdueClients: clients.filter(c => {
      if (!c.last_invoice_generated_at || !c.billing_frequency) return false;
      
      const lastInvoice = new Date(c.last_invoice_generated_at);
      const now = new Date();
      const daysSinceLastInvoice = Math.floor((now.getTime() - lastInvoice.getTime()) / (1000 * 60 * 60 * 24));

      switch (c.billing_frequency) {
        case 'weekly':
          return daysSinceLastInvoice > 7;
        case 'fortnightly':
          return daysSinceLastInvoice > 14;
        case 'monthly':
          return daysSinceLastInvoice > 30;
        default:
          return false;
      }
    }).length,
  };

  return {
    stats,
    clients,
    isLoading,
  };
};

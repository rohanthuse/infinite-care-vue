import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export interface LedgerLineItem {
  id: string;
  description: string;
  quantity: number;
  unit_price: number;
  line_total: number;
  visit_date?: string;
  day_type?: string;
  service_start_time?: string;
  service_end_time?: string;
  rate_type_applied?: string;
  duration_minutes?: number;
  rate_per_unit?: number;
  bank_holiday_multiplier_applied?: number;
  visit_record_id?: string;
  booking_id?: string;
}

export interface EnhancedInvoice {
  id: string;
  client_id: string;
  invoice_number: string;
  invoice_date: string;
  due_date: string;
  start_date?: string;
  end_date?: string;
  status: string;
  description: string;
  amount: number;
  net_amount?: number;
  vat_amount?: number;
  total_amount?: number;
  total_invoiced_hours_minutes?: number;
  is_ledger_locked?: boolean;
  locked_at?: string;
  locked_by?: string;
  authority_type?: string;
  currency?: string;
  payment_terms?: string;
  notes?: string;
  line_items?: LedgerLineItem[];
}

export function useInvoiceWithLedger(invoiceId?: string) {
  return useQuery({
    queryKey: ['invoice-with-ledger', invoiceId],
    queryFn: async () => {
      if (!invoiceId) return null;

      const { data: invoice, error: invoiceError } = await supabase
        .from('client_billing')
        .select(`
          *,
          clients:client_id (
            id,
            first_name,
            last_name,
            email,
            branches:branch_id (
              id,
              name,
              organization_id
            )
          )
        `)
        .eq('id', invoiceId)
        .single();

      if (invoiceError) throw invoiceError;

      const { data: lineItems, error: lineItemsError } = await supabase
        .from('invoice_line_items')
        .select('*')
        .eq('invoice_id', invoiceId)
        .order('visit_date', { ascending: true });

      if (lineItemsError) throw lineItemsError;

      return {
        ...invoice,
        line_items: lineItems || []
      } as EnhancedInvoice & { clients: any };
    },
    enabled: !!invoiceId
  });
}

export function useGenerateLedger() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({
      invoiceId,
      clientId,
      startDate,
      endDate
    }: {
      invoiceId: string;
      clientId: string;
      startDate: string;
      endDate: string;
    }) => {
      const { error } = await supabase.rpc('generate_invoice_ledger', {
        invoice_id_param: invoiceId,
        client_id_param: clientId,
        start_date_param: startDate,
        end_date_param: endDate
      });

      if (error) throw error;
      return { success: true };
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['invoice-with-ledger', variables.invoiceId] });
      queryClient.invalidateQueries({ queryKey: ['branch-invoices'] });
      toast({
        title: "Ledger Generated",
        description: "Invoice ledger has been generated from visit records.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Generation Failed",
        description: `Failed to generate ledger: ${error.message}`,
        variant: "destructive",
      });
    }
  });
}

export function useUpdateLineItem() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({
      lineItemId,
      updates
    }: {
      lineItemId: string;
      updates: Partial<LedgerLineItem>;
    }) => {
      const { error } = await supabase
        .from('invoice_line_items')
        .update(updates)
        .eq('id', lineItemId);

      if (error) throw error;
      return { success: true };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invoice-with-ledger'] });
      toast({
        title: "Line Item Updated",
        description: "Invoice line item has been updated successfully.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Update Failed",
        description: `Failed to update line item: ${error.message}`,
        variant: "destructive",
      });
    }
  });
}

export function useLockLedger() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({
      invoiceId,
      isLocked
    }: {
      invoiceId: string;
      isLocked: boolean;
    }) => {
      const updates = {
        is_ledger_locked: isLocked,
        locked_at: isLocked ? new Date().toISOString() : null,
        // locked_by would be set by the database trigger
      };

      const { error } = await supabase
        .from('client_billing')
        .update(updates)
        .eq('id', invoiceId);

      if (error) throw error;
      return { success: true };
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['invoice-with-ledger', variables.invoiceId] });
      const action = variables.isLocked ? 'locked' : 'unlocked';
      toast({
        title: `Ledger ${action}`,
        description: `Invoice ledger has been ${action} successfully.`,
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Lock/Unlock Failed",
        description: `Failed to update ledger lock: ${error.message}`,
        variant: "destructive",
      });
    }
  });
}

// Helper function to format hours and minutes from total minutes
export function formatHoursMinutes(totalMinutes?: number): string {
  if (!totalMinutes) return "00:00";
  
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
}

// Helper function to format rate type display
export function formatRateType(rateType?: string): string {
  switch (rateType) {
    case 'hourly': return 'Rate per Hour';
    case 'per_minute': return 'Rate per Minutes (Pro Rata)';
    case 'daily': return 'Daily Flat Rate';
    case 'per_visit': return 'Service Flat Rate';
    default: return 'Rate per Hour';
  }
}

// Helper function to format day type with emoji
export function formatDayType(dayType?: string): string {
  switch (dayType) {
    case 'bank_holiday': return '🏛️ Bank Holiday';
    case 'weekend': return '🌅 Weekend';
    case 'weekday': return '📅 Weekday';
    default: return '📅 Weekday';
  }
}
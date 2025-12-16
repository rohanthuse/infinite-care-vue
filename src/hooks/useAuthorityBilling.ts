import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { AuthorityBillingInfo, EnhancedInvoiceCreationData } from '@/types/billing';

// Get authorities for billing selection
export const useAuthoritiesForBilling = (branchId?: string) => {
  return useQuery({
    queryKey: ['authorities-for-billing', branchId],
    queryFn: async (): Promise<AuthorityBillingInfo[]> => {
      if (branchId) {
        // First get authority IDs that have clients in this branch
        const { data: clientAuthorities, error: clientError } = await supabase
          .from('clients')
          .select('authority_id')
          .eq('branch_id', branchId)
          .eq('funding_type', 'authority')
          .not('authority_id', 'is', null);

        if (clientError) throw clientError;

        const authorityIds = [...new Set(clientAuthorities?.map(c => c.authority_id).filter(Boolean))];

        if (authorityIds.length === 0) {
          return [];
        }

        // Then get the organizations
        const { data, error } = await supabase
          .from('organizations')
          .select('*')
          .in('id', authorityIds)
          .order('name');

        if (error) throw error;
        return data || [];
      } else {
        // Get all authority organizations
        const { data, error } = await supabase
          .from('organizations')
          .select('*')
          .order('name');

        if (error) throw error;
        return data || [];
      }
    },
    enabled: Boolean(branchId),
  });
};

// Get clients by authority for billing
export const useClientsByAuthority = (authorityId: string, branchId?: string) => {
  return useQuery({
    queryKey: ['clients-by-authority', authorityId, branchId],
    queryFn: async () => {
      let query = supabase
        .from('clients')
        .select(`
          id,
          first_name,
          last_name,
          email,
          funding_type,
          authority_id,
          branch_id
        `)
        .eq('authority_id', authorityId)
        .eq('funding_type', 'authority');

      if (branchId) {
        query = query.eq('branch_id', branchId);
      }

      const { data, error } = await query.order('last_name', { ascending: true });

      if (error) {
        console.error('Error fetching clients by authority:', error);
        throw error;
      }

      return data || [];
    },
    enabled: Boolean(authorityId),
  });
};

// Get private clients for billing
export const usePrivateClients = (branchId?: string) => {
  return useQuery({
    queryKey: ['private-clients', branchId],
    queryFn: async () => {
      let query = supabase
        .from('clients')
        .select(`
          id,
          first_name,
          last_name,
          email,
          funding_type,
          branch_id
        `)
        .eq('funding_type', 'private');

      if (branchId) {
        query = query.eq('branch_id', branchId);
      }

      const { data, error } = await query.order('last_name', { ascending: true });

      if (error) {
        console.error('Error fetching private clients:', error);
        throw error;
      }

      return data || [];
    },
    enabled: Boolean(branchId),
  });
};

// Create enhanced invoice with authority/private billing support
export const useCreateEnhancedInvoice = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: EnhancedInvoiceCreationData & { organization_id: string; pay_method?: string | null }) => {
      const invoiceData = {
        client_id: data.client_id,
        description: data.description,
        amount: data.amount,
        invoice_date: data.invoice_date,
        due_date: data.due_date,
        start_date: data.start_date,
        end_date: data.end_date,
        notes: data.notes,
        bill_to_type: data.bill_to_type,
        authority_id: data.authority_id,
        consolidation_type: data.consolidation_type,
        pay_method: data.pay_method || null,
        invoice_number: `INV-${Date.now()}`, // Generate unique invoice number
        status: 'pending',
        organization_id: data.organization_id
      };

      const { data: result, error } = await supabase
        .from('client_billing')
        .insert([invoiceData])
        .select()
        .single();

      if (error) throw error;
      return result;
    },
    onSuccess: (data) => {
      toast.success('Invoice created successfully');
      queryClient.invalidateQueries({ queryKey: ['client-billing'] });
      queryClient.invalidateQueries({ queryKey: ['branch-invoices'] });
    },
    onError: (error) => {
      console.error('Error creating enhanced invoice:', error);
      toast.error('Failed to create invoice');
    },
  });
};

// Get invoice billing summary for authority/private breakdown
export const useInvoiceBillingSummary = (branchId: string, startDate?: string, endDate?: string) => {
  return useQuery({
    queryKey: ['invoice-billing-summary', branchId, startDate, endDate],
    queryFn: async () => {
      let query = supabase
        .from('client_billing')
        .select(`
          id,
          bill_to_type,
          authority_id,
          amount,
          total_amount,
          status,
          invoice_date,
          organizations:authority_id(name),
          clients:client_id(first_name, last_name, branch_id)
        `)
        .eq('clients.branch_id', branchId);

      if (startDate) {
        query = query.gte('invoice_date', startDate);
      }

      if (endDate) {
        query = query.lte('invoice_date', endDate);
      }

      const { data, error } = await query.order('invoice_date', { ascending: false });

      if (error) {
        console.error('Error fetching billing summary:', error);
        throw error;
      }

      // Group by bill_to_type for summary
      const summary = {
        authority: {
          count: 0,
          total: 0,
          invoices: [] as any[]
        },
        private: {
          count: 0,
          total: 0,
          invoices: [] as any[]
        }
      };

      data?.forEach(invoice => {
        const type = invoice.bill_to_type as 'authority' | 'private';
        summary[type].count++;
        summary[type].total += invoice.total_amount || invoice.amount || 0;
        summary[type].invoices.push(invoice);
      });

      return { summary, invoices: data || [] };
    },
    enabled: Boolean(branchId),
  });
};
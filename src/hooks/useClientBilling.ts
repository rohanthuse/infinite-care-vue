
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useClient } from '@/contexts/ClientContext';
import { useToast } from '@/components/ui/use-toast';

export interface ClientInvoice {
  id: string;
  invoice_number: string;
  invoice_date: string;
  due_date: string;
  amount: number;
  description: string;
  status: string;
  paid_date?: string;
}

export interface ClientPaymentMethod {
  id: string;
  type: string;
  last_four: string;
  exp_month: number;
  exp_year: number;
  cardholder_name: string;
  is_default: boolean;
}

export const useClientBilling = () => {
  const [invoices, setInvoices] = useState<ClientInvoice[]>([]);
  const [paymentMethods, setPaymentMethods] = useState<ClientPaymentMethod[]>([]);
  const [loading, setLoading] = useState(true);
  const { client } = useClient();
  const { toast } = useToast();

  const fetchBillingData = async () => {
    if (!client) {
      setLoading(false);
      return;
    }

    try {
      const [invoicesResult, paymentMethodsResult] = await Promise.all([
        supabase
          .from('client_billing')
          .select('*')
          .eq('client_id', client.id)
          .order('invoice_date', { ascending: false }),
        supabase
          .from('client_payment_methods')
          .select('*')
          .eq('client_id', client.id)
      ]);

      if (invoicesResult.error) {
        console.error('Error fetching invoices:', invoicesResult.error);
        toast({
          title: "Error",
          description: "Failed to load billing information",
          variant: "destructive"
        });
        return;
      }

      if (paymentMethodsResult.error) {
        console.error('Error fetching payment methods:', paymentMethodsResult.error);
      }

      setInvoices(invoicesResult.data || []);
      setPaymentMethods(paymentMethodsResult.data || []);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBillingData();
  }, [client]);

  return {
    invoices,
    paymentMethods,
    loading,
    refetch: fetchBillingData
  };
};

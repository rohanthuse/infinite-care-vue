import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export type ServicePayerType = 'authorities' | 'direct_payment' | 'self_funder' | 'other' | null;

export interface ServicePayerConfig {
  servicePayer: ServicePayerType;
  defaultBillTo: 'authority' | 'private' | null;
  showBillToSelector: boolean;
  requireAuthority: boolean;
  canProceed: boolean;
  errorMessage?: string;
}

export const servicePayerLabels: Record<string, string> = {
  authorities: 'Authority / Local Authority',
  direct_payment: 'Direct Payment',
  self_funder: 'Self Funder',
  other: 'Other Funding Authority'
};

export const getServicePayerConfig = (servicePayer: ServicePayerType): ServicePayerConfig => {
  switch (servicePayer) {
    case 'self_funder':
      return {
        servicePayer,
        defaultBillTo: 'private',
        showBillToSelector: false,
        requireAuthority: false,
        canProceed: true
      };
    case 'authorities':
      return {
        servicePayer,
        defaultBillTo: 'authority',
        showBillToSelector: true,
        requireAuthority: true,
        canProceed: true
      };
    case 'direct_payment':
      return {
        servicePayer,
        defaultBillTo: 'private',
        showBillToSelector: true,
        requireAuthority: false,
        canProceed: true
      };
    case 'other':
      return {
        servicePayer,
        defaultBillTo: null,
        showBillToSelector: true,
        requireAuthority: false,
        canProceed: true
      };
    default: // null or undefined
      return {
        servicePayer: null,
        defaultBillTo: null,
        showBillToSelector: false,
        requireAuthority: false,
        canProceed: false,
        errorMessage: "Please select 'Who pays for the service' in General Accounting Settings before creating an invoice."
      };
  }
};

export const useClientServicePayer = (clientId: string) => {
  return useQuery({
    queryKey: ['client-service-payer', clientId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('client_accounting_settings')
        .select('service_payer, authority_category')
        .eq('client_id', clientId)
        .maybeSingle();
      
      if (error) {
        throw error;
      }
      
      return {
        service_payer: (data?.service_payer as ServicePayerType) || null,
        authority_category: data?.authority_category || null,
        is_configured: !!data?.service_payer
      };
    },
    enabled: !!clientId
  });
};

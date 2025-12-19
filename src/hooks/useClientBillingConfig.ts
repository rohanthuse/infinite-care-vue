import { supabase } from "@/integrations/supabase/client";

export interface ClientBillingConfig {
  // General settings
  servicePayer: 'authorities' | 'direct_payment' | 'self_funder' | 'other' | null;
  invoiceMethod: string | null;
  invoiceDisplayType: string | null;
  billingAddressSameAsPersonal: boolean;
  billingAddress: string | null;
  mileageRuleNoPayment: boolean;
  
  // Private accounting settings
  creditPeriodDays: number;
  privateChargeBasedOn: 'planned_time' | 'actual_time';
  privateExtraTimeEnabled: boolean;
  privateTravelRateId: string | null;
  
  // Authority accounting settings
  authorityId: string | null;
  authorityReferenceNumber: string | null;
  authorityChargeBasedOn: 'planned_time' | 'actual_time';
  authorityExtraTimeEnabled: boolean;
  authorityTravelRateId: string | null;
  clientContributionRequired: boolean;
  
  // Computed helpers
  useActualTime: boolean;
  extraTimeEnabled: boolean;
  billToType: 'private' | 'authority';
}

export const fetchClientBillingConfig = async (clientId: string): Promise<ClientBillingConfig> => {
  // Fetch all settings in parallel
  const [
    { data: generalSettings },
    { data: privateSettings },
    { data: authoritySettings }
  ] = await Promise.all([
    supabase
      .from('client_accounting_settings')
      .select('*')
      .eq('client_id', clientId)
      .maybeSingle(),
    supabase
      .from('client_private_accounting')
      .select('*')
      .eq('client_id', clientId)
      .maybeSingle(),
    supabase
      .from('client_authority_accounting')
      .select('*')
      .eq('client_id', clientId)
      .maybeSingle()
  ]);

  // Determine service payer (who pays)
  const servicePayer = generalSettings?.service_payer as ClientBillingConfig['servicePayer'] || null;
  
  // Determine if we should use actual time based on service payer
  const isAuthorityBilling = servicePayer === 'authorities';
  const chargeBasedOn = isAuthorityBilling 
    ? (authoritySettings?.charge_based_on || 'planned_time')
    : (privateSettings?.charge_based_on || 'planned_time');
  
  const useActualTime = chargeBasedOn === 'actual_time';
  
  // Determine if extra time is enabled based on service payer
  const extraTimeEnabled = isAuthorityBilling
    ? (authoritySettings?.extra_time_calculation ?? false)
    : (privateSettings?.extra_time_calculation ?? false);

  // Determine bill_to_type based on service payer
  const billToType: 'private' | 'authority' = 
    servicePayer === 'authorities' ? 'authority' : 'private';

  return {
    // General settings
    servicePayer,
    invoiceMethod: generalSettings?.invoice_method || null,
    invoiceDisplayType: generalSettings?.invoice_display_type || null,
    billingAddressSameAsPersonal: generalSettings?.billing_address_same_as_personal ?? true,
    billingAddress: generalSettings?.billing_address || null,
    mileageRuleNoPayment: generalSettings?.mileage_rule_no_payment ?? false,
    
    // Private accounting settings
    creditPeriodDays: privateSettings?.credit_period_days ?? 30,
    privateChargeBasedOn: (privateSettings?.charge_based_on as 'planned_time' | 'actual_time') || 'planned_time',
    privateExtraTimeEnabled: privateSettings?.extra_time_calculation ?? false,
    privateTravelRateId: privateSettings?.travel_rate_id || null,
    
    // Authority accounting settings
    authorityId: authoritySettings?.authority_id || null,
    authorityReferenceNumber: authoritySettings?.reference_number || null,
    authorityChargeBasedOn: (authoritySettings?.charge_based_on as 'planned_time' | 'actual_time') || 'planned_time',
    authorityExtraTimeEnabled: authoritySettings?.extra_time_calculation ?? false,
    authorityTravelRateId: authoritySettings?.travel_rate_id || null,
    clientContributionRequired: authoritySettings?.client_contribution_required ?? false,
    
    // Computed helpers
    useActualTime,
    extraTimeEnabled,
    billToType
  };
};

// React Query hook version for components
import { useQuery } from "@tanstack/react-query";

export const useClientBillingConfig = (clientId: string) => {
  return useQuery({
    queryKey: ['client-billing-config', clientId],
    queryFn: () => fetchClientBillingConfig(clientId),
    enabled: !!clientId
  });
};

import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { ExpiringAgreement } from "@/types/agreements";

export const useExpiringAgreements = (branchId?: string, isOrganizationLevel?: boolean) => {
  return useQuery({
    queryKey: ['expiring-agreements', branchId, isOrganizationLevel],
    queryFn: async () => {
      const thirtyDaysFromNow = new Date();
      thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);

      let query = supabase
        .from('agreements')
        .select(`
          *,
          agreement_types(name),
          agreement_signers(id, signer_name, signer_type)
        `)
        .eq('status', 'Active')
        .not('expiry_date', 'is', null)
        .gte('expiry_date', new Date().toISOString())
        .lte('expiry_date', thirtyDaysFromNow.toISOString());

      if (isOrganizationLevel) {
        query = query.is('branch_id', null);
      } else if (branchId) {
        query = query.eq('branch_id', branchId);
      }

      const { data, error } = await query.order('expiry_date', { ascending: true });

      if (error) throw error;

      const expiringAgreements: ExpiringAgreement[] = (data || []).map(agreement => {
        const expiryDate = new Date(agreement.expiry_date!);
        const today = new Date();
        const daysUntilExpiry = Math.ceil(
          (expiryDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
        );

        return {
          ...agreement,
          days_until_expiry: daysUntilExpiry,
          notification_sent: false
        };
      });

      return expiringAgreements;
    },
    refetchInterval: 5 * 60 * 1000,
  });
};
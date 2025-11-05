import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const useRenewAgreement = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ agreementId, newExpiryDate }: { agreementId: string; newExpiryDate: string }) => {
      const { data, error } = await supabase
        .from('agreements')
        .update({
          expiry_date: newExpiryDate,
          renewal_date: new Date().toISOString(),
          status: 'Active',
          updated_at: new Date().toISOString()
        })
        .eq('id', agreementId)
        .select()
        .single();

      if (error) throw error;

      await supabase
        .from('agreement_expiry_notifications')
        .delete()
        .eq('agreement_id', agreementId);

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['agreements'] });
      queryClient.invalidateQueries({ queryKey: ['signed_agreements'] });
      queryClient.invalidateQueries({ queryKey: ['expiring-agreements'] });
      toast.success('Agreement renewed successfully');
    },
    onError: (error: any) => {
      toast.error(`Failed to renew agreement: ${error.message}`);
    },
  });
};
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const archiveAgreement = async (agreementId: string) => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("User not authenticated");
  
  const { data, error } = await supabase
    .from('agreements')
    .update({
      approval_status: 'archived',
      archived_by: user.id,
      archived_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    })
    .eq('id', agreementId)
    .select()
    .single();
  
  if (error) throw error;
  return data;
};

export const useArchiveAgreement = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: archiveAgreement,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['agreements'] });
      queryClient.invalidateQueries({ queryKey: ['signed_agreements'] });
      toast.success('Agreement archived successfully');
    },
    onError: (error: any) => {
      toast.error(`Failed to archive agreement: ${error.message}`);
    }
  });
};

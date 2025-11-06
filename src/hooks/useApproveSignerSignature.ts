import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface ApproveSignerParams {
  signerId: string;
  signerName: string;
}

const approveSignerSignature = async ({ signerId, signerName }: ApproveSignerParams) => {
  console.log('[useApproveSignerSignature] Approving signer:', signerId);
  
  // Get current user (admin)
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("User not authenticated");
  
  // Check if already approved
  const { data: existingSigner } = await supabase
    .from('agreement_signers')
    .select('admin_approved')
    .eq('id', signerId)
    .single();
  
  if (existingSigner?.admin_approved) {
    throw new Error("Signer already approved");
  }
  
  // Mark the signer as approved
  const { data, error } = await supabase
    .from('agreement_signers')
    .update({
      admin_approved: true,
      approved_by: user.id,
      approved_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    })
    .eq('id', signerId)
    .select()
    .single();
  
  if (error) {
    console.error('[useApproveSignerSignature] Error:', error);
    throw new Error(error.message);
  }
  
  return { ...data, signerName };
};

export const useApproveSignerSignature = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: approveSignerSignature,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['agreements'] });
      queryClient.invalidateQueries({ queryKey: ['agreement_signers'] });
      queryClient.invalidateQueries({ queryKey: ['signed_agreements'] });
      
      toast.success(`Agreement approved successfully for ${data.signerName}`);
    },
    onError: (error: any) => {
      if (error.message === "Signer already approved") {
        toast.info('This signature has already been approved');
      } else {
        console.error('[useApproveSignerSignature] Error:', error);
        toast.error(`Failed to approve signature: ${error.message}`);
      }
    }
  });
};

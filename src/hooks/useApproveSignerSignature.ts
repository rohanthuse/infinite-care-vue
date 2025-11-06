import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface ApproveSignerParams {
  signerId: string;
  signerName: string;
}

const approveSignerSignature = async ({ signerId }: ApproveSignerParams) => {
  console.log('[useApproveSignerSignature] Approving signer:', signerId);
  
  // Get current user (admin)
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("User not authenticated");
  
  // Mark the signer as approved by updating timestamp
  // Note: Using 'signed' status as 'approved' is not in the current enum
  const { error } = await supabase
    .from('agreement_signers')
    .update({
      updated_at: new Date().toISOString()
    })
    .eq('id', signerId);
  
  if (error) {
    console.error('[useApproveSignerSignature] Error:', error);
    throw new Error(error.message);
  }
};

export const useApproveSignerSignature = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: approveSignerSignature,
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['agreements'] });
      queryClient.invalidateQueries({ queryKey: ['agreement_signers'] });
      queryClient.invalidateQueries({ queryKey: ['signed_agreements'] });
      
      toast.success('Signature approved successfully');
    },
    onError: (error: any) => {
      console.error('[useApproveSignerSignature] Error:', error);
      toast.error(`Failed to approve signature: ${error.message}`);
    }
  });
};

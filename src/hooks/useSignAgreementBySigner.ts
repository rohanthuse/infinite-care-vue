import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface SignAgreementParams {
  agreementId: string;
  signerId: string;
  signatureData: string;
  signatureFileId?: string;
}

const signAgreementBySigner = async (params: SignAgreementParams) => {
  const { agreementId, signerId, signatureData, signatureFileId } = params;
  
  console.log('[useSignAgreementBySigner] Signing agreement:', { agreementId, signerId });
  
  // Update the signer record
  const { error: signerError } = await supabase
    .from('agreement_signers')
    .update({
      signed_at: new Date().toISOString(),
      signature_file_id: signatureFileId || null,
      signing_status: 'signed'
    })
    .eq('id', signerId);
  
  if (signerError) {
    console.error('[useSignAgreementBySigner] Error updating signer:', signerError);
    throw new Error(signerError.message);
  }
  
  // Check if all signers have signed
  const { data: allSigners, error: signersError } = await supabase
    .from('agreement_signers')
    .select('signing_status')
    .eq('agreement_id', agreementId);
  
  if (signersError) {
    console.error('[useSignAgreementBySigner] Error fetching signers:', signersError);
    throw new Error(signersError.message);
  }
  
  const allSigned = allSigners?.every(s => s.signing_status === 'signed');
  
  console.log('[useSignAgreementBySigner] All signers signed:', allSigned);
  
  // If all signers have signed, update agreement status to Active and set for review
  if (allSigned) {
    const { error: agreementError } = await supabase
      .from('agreements')
      .update({
        status: 'Active',
        signed_at: new Date().toISOString(),
        digital_signature: signatureData,
        approval_status: 'pending_review'
      })
      .eq('id', agreementId);
    
    if (agreementError) {
      console.error('[useSignAgreementBySigner] Error updating agreement:', agreementError);
      throw new Error(agreementError.message);
    }
  }
  
  return { allSigned };
};

export const useSignAgreementBySigner = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: signAgreementBySigner,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['staff_agreements'] });
      queryClient.invalidateQueries({ queryKey: ['client_agreements'] });
      queryClient.invalidateQueries({ queryKey: ['agreement_signers'] });
      queryClient.invalidateQueries({ queryKey: ['agreements'] });
      
      if (data.allSigned) {
        toast.success('Agreement fully signed! It has been sent to admin for review.');
      } else {
        toast.success('✓ Signature submitted successfully. The admin will be notified once all signers complete.');
      }
    },
    onError: (error: any) => {
      console.error('[useSignAgreementBySigner] Error:', error);
      toast.error(`Failed to sign agreement: ${error.message}`);
    }
  });
};

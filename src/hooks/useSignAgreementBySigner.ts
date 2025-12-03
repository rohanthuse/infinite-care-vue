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
  
  let finalSignatureFileId = signatureFileId;
  
  // If signature data is provided but no file ID, save the signature
  if (signatureData && !signatureFileId) {
    try {
      // Convert base64 to blob
      const base64Response = await fetch(signatureData);
      const blob = await base64Response.blob();
      
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      
      // Upload to storage
      const fileName = `signature_${signerId}_${Date.now()}.png`;
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('agreement-files')
        .upload(`signatures/${fileName}`, blob, {
          contentType: 'image/png',
          upsert: false
        });
      
      if (uploadError) {
        console.error('[useSignAgreementBySigner] Upload error:', uploadError);
      } else if (uploadData) {
        // Create agreement_files record
        const { data: fileRecord, error: fileError } = await supabase
          .from('agreement_files')
          .insert({
            agreement_id: agreementId,
            file_name: fileName,
            file_type: 'image/png',
            file_size: blob.size,
            storage_path: uploadData.path,
            file_category: 'signature',
            uploaded_by: user?.id
          })
          .select('id')
          .single();
        
        if (!fileError && fileRecord) {
          finalSignatureFileId = fileRecord.id;
          console.log('[useSignAgreementBySigner] Signature file created:', fileRecord.id);
        }
      }
    } catch (error) {
      console.error('[useSignAgreementBySigner] Error saving signature file:', error);
    }
  }
  
  // Update the signer record
  const { error: signerError } = await supabase
    .from('agreement_signers')
    .update({
      signed_at: new Date().toISOString(),
      signature_file_id: finalSignatureFileId || null,
      signing_status: 'signed'
    })
    .eq('id', signerId);
  
  if (signerError) {
    console.error('[useSignAgreementBySigner] Error updating signer:', signerError);
    throw new Error(signerError.message);
  }
  
  // Fetch agreement and signer details for notification
  const { data: agreementData } = await supabase
    .from('agreements')
    .select('title, branch_id')
    .eq('id', agreementId)
    .single();

  const { data: signerData } = await supabase
    .from('agreement_signers')
    .select('signer_name, signer_type, signer_auth_user_id')
    .eq('id', signerId)
    .single();

  // Send notification to admins about signature
  if (agreementData && signerData && agreementData.branch_id) {
    try {
      console.log('[useSignAgreementBySigner] Sending admin notification...');
      await supabase.functions.invoke('create-agreement-signed-notifications', {
        body: {
          agreement_id: agreementId,
          agreement_title: agreementData.title,
          signer_name: signerData.signer_name,
          signer_type: signerData.signer_type,
          signer_auth_user_id: signerData.signer_auth_user_id,
          branch_id: agreementData.branch_id
        }
      });
      console.log('[useSignAgreementBySigner] Admin notification sent');
    } catch (notifErr) {
      console.error('[useSignAgreementBySigner] Notification error:', notifErr);
      // Don't throw - signing was successful, just notification failed
    }
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
      queryClient.invalidateQueries({ queryKey: ['client_pending_agreements'] });
      queryClient.invalidateQueries({ queryKey: ['staff_pending_agreements'] });
      queryClient.invalidateQueries({ queryKey: ['signed_agreements'] });
      
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

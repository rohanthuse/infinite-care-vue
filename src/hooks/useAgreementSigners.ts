import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface AgreementSigner {
  id: string;
  agreement_id: string;
  signer_type: 'client' | 'staff' | 'other';
  signer_id: string | null;
  signer_name: string;
  signer_auth_user_id: string | null;
  signed_at: string | null;
  signature_file_id: string | null;
  signing_status: 'pending' | 'signed' | 'declined';
  created_at: string;
  updated_at: string;
  admin_approved: boolean;
  approved_by: string | null;
  approved_at: string | null;
}

interface CreateSignerData {
  agreement_id: string;
  signer_type: 'client' | 'staff' | 'other';
  signer_id?: string;
  signer_name: string;
  signer_auth_user_id?: string;
}

// Fetch signers for a specific agreement
const fetchAgreementSigners = async (agreementId: string): Promise<AgreementSigner[]> => {
  const { data, error } = await supabase
    .from('agreement_signers')
    .select('*')
    .eq('agreement_id', agreementId)
    .order('created_at', { ascending: false });

  if (error) throw new Error(error.message);
  return (data || []) as AgreementSigner[];
};

export const useAgreementSigners = (agreementId?: string) => {
  return useQuery<AgreementSigner[], Error>({
    queryKey: ['agreement_signers', agreementId],
    queryFn: () => fetchAgreementSigners(agreementId!),
    enabled: !!agreementId,
  });
};

// Create multiple signers at once
const createSigners = async (signersData: CreateSignerData[]) => {
  const { data, error } = await supabase
    .from('agreement_signers')
    .insert(signersData)
    .select();

  if (error) throw new Error(error.message);
  return data;
};

export const useCreateSigners = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: createSigners,
    onSuccess: async (data, variables) => {
      if (variables.length > 0) {
        queryClient.invalidateQueries({ 
          queryKey: ['agreement_signers', variables[0].agreement_id] 
        });
      }
      toast.success(`${variables.length} signer(s) added successfully`);

      // Trigger notifications for agreement signers
      try {
        // Get agreement title and branch_id
        const { data: agreementData } = await supabase
          .from('agreements')
          .select('title, branch_id')
          .eq('id', variables[0].agreement_id)
          .single();

        if (agreementData) {
          // Collect signer auth_user_ids from the created signers
          const signerAuthUserIds = data
            ?.filter((signer: any) => signer.signer_auth_user_id)
            .map((signer: any) => signer.signer_auth_user_id) || [];

          if (signerAuthUserIds.length > 0) {
            console.log('[useAgreementSigners] Triggering notifications for agreement signers:', signerAuthUserIds.length);
            const { data: notifResult, error: notifError } = await supabase.functions.invoke('create-agreement-notifications', {
              body: {
                agreement_id: variables[0].agreement_id,
                agreement_title: agreementData.title,
                signer_auth_user_ids: signerAuthUserIds,
                branch_id: agreementData.branch_id
              }
            });

            if (notifError) {
              console.error('[useAgreementSigners] Error creating notifications:', notifError);
            } else {
              console.log('[useAgreementSigners] Notification result:', notifResult);
            }
          }
        }
      } catch (notifErr) {
        console.error('[useAgreementSigners] Failed to trigger notifications:', notifErr);
      }
    },
    onError: (error) => {
      toast.error(`Failed to add signers: ${error.message}`);
    },
  });
};

// Delete a signer
const deleteSigner = async (signerId: string) => {
  const { error } = await supabase
    .from('agreement_signers')
    .delete()
    .eq('id', signerId);

  if (error) throw new Error(error.message);
};

export const useDeleteSigner = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: deleteSigner,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['agreement_signers'] });
      toast.success('Signer removed successfully');
    },
    onError: (error) => {
      toast.error(`Failed to remove signer: ${error.message}`);
    },
  });
};

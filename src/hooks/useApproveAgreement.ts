import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface ApproveAgreementParams {
  agreementId: string;
  action: 'approve' | 'reject';
  notes?: string;
  rejectionReason?: string;
}

const approveAgreement = async (params: ApproveAgreementParams) => {
  const { agreementId, action, notes, rejectionReason } = params;
  
  // Get current user
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("User not authenticated");
  
  const updateData: any = {
    approval_status: action === 'approve' ? 'approved' : 'rejected',
    approved_by: user.id,
    approved_at: new Date().toISOString(),
    approval_notes: notes || null,
    updated_at: new Date().toISOString()
  };
  
  // If rejecting, update status to Terminated and add rejection reason
  if (action === 'reject') {
    updateData.status = 'Terminated';
    updateData.rejection_reason = rejectionReason || 'Rejected by admin';
  }
  
  const { data, error } = await supabase
    .from('agreements')
    .update(updateData)
    .eq('id', agreementId)
    .select()
    .single();
  
  if (error) throw error;
  
  return data;
};

export const useApproveAgreement = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: approveAgreement,
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['agreements'] });
      queryClient.invalidateQueries({ queryKey: ['signed_agreements'] });
      
      if (variables.action === 'approve') {
        toast.success('Agreement approved successfully');
      } else {
        toast.success('Agreement rejected');
      }
    },
    onError: (error: any) => {
      toast.error(`Failed to process agreement: ${error.message}`);
    }
  });
};

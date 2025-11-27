import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface ConvertScheduledAgreementResult {
  agreementId: string;
  signerId: string;
}

// Replace template placeholders with actual data
const replacePlaceholders = (content: string, data: {
  clientName?: string;
  staffName?: string;
  date: string;
  agreementTitle: string;
}): string => {
  return content
    .replace(/\{\{CLIENT_NAME\}\}/g, data.clientName || '[Client Name]')
    .replace(/\{\{STAFF_NAME\}\}/g, data.staffName || '[Staff Name]')
    .replace(/\{\{DATE\}\}/g, data.date)
    .replace(/\{\{AGREEMENT_TITLE\}\}/g, data.agreementTitle)
    .replace(/\{\{TODAY\}\}/g, data.date);
};

const convertScheduledAgreement = async (scheduledAgreementId: string): Promise<ConvertScheduledAgreementResult> => {
  // Step 1: Fetch scheduled agreement details
  const { data: scheduledAgreement, error: fetchError } = await supabase
    .from('scheduled_agreements')
    .select(`
      *,
      agreement_types (name)
    `)
    .eq('id', scheduledAgreementId)
    .single();

  if (fetchError || !scheduledAgreement) {
    throw new Error('Failed to fetch scheduled agreement');
  }

  // Step 2: Get template content if template_id exists
  let agreementContent = null;
  let signerName = scheduledAgreement.scheduled_with_name || 'Unknown';
  
  if (scheduledAgreement.template_id) {
    const { data: template, error: templateError } = await supabase
      .from('agreement_templates')
      .select('content')
      .eq('id', scheduledAgreement.template_id)
      .single();

    if (!templateError && template) {
      // Replace placeholders in template content
      agreementContent = replacePlaceholders(template.content || '', {
        clientName: scheduledAgreement.scheduled_with_client_id ? signerName : undefined,
        staffName: scheduledAgreement.scheduled_with_staff_id ? signerName : undefined,
        date: new Date().toLocaleDateString(),
        agreementTitle: scheduledAgreement.title
      });
    }
  }

  // Step 3: Get auth_user_id for the signer
  let signerAuthUserId: string | null = null;
  let signerType: 'client' | 'staff' | 'other' = 'other';
  let signerId: string | null = null;

  if (scheduledAgreement.scheduled_with_client_id) {
    const { data: client } = await supabase
      .from('clients')
      .select('auth_user_id, id')
      .eq('id', scheduledAgreement.scheduled_with_client_id)
      .single();
    
    if (client) {
      signerAuthUserId = client.auth_user_id;
      signerId = client.id;
      signerType = 'client';
    }
  } else if (scheduledAgreement.scheduled_with_staff_id) {
    const { data: staff } = await supabase
      .from('staff')
      .select('auth_user_id, id')
      .eq('id', scheduledAgreement.scheduled_with_staff_id)
      .single();
    
    if (staff) {
      signerAuthUserId = staff.auth_user_id;
      signerId = staff.id;
      signerType = 'staff';
    }
  }

  // Step 4: Create new agreement in agreements table
  const { data: newAgreement, error: agreementError } = await supabase
    .from('agreements')
    .insert({
      title: scheduledAgreement.title,
      content: agreementContent,
      type_id: scheduledAgreement.type_id,
      template_id: scheduledAgreement.template_id,
      branch_id: scheduledAgreement.branch_id,
      status: 'Pending',
      approval_status: 'pending_signatures',
      signed_by_client_id: signerType === 'client' ? signerId : null,
      signed_by_staff_id: signerType === 'staff' ? signerId : null,
      signing_party: signerType,
      signed_by_name: signerName,
    })
    .select()
    .single();

  if (agreementError || !newAgreement) {
    throw new Error('Failed to create agreement');
  }

  // Step 5: Create signer record in agreement_signers
  const { data: newSigner, error: signerError } = await supabase
    .from('agreement_signers')
    .insert({
      agreement_id: newAgreement.id,
      signer_type: signerType,
      signer_id: signerId,
      signer_name: signerName,
      signer_auth_user_id: signerAuthUserId,
      signing_status: 'pending',
      admin_approved: false,
    })
    .select()
    .single();

  if (signerError || !newSigner) {
    // Rollback: delete the agreement if signer creation fails
    await supabase.from('agreements').delete().eq('id', newAgreement.id);
    throw new Error('Failed to create signer record');
  }

  // Step 6: Update scheduled agreement status to 'Completed'
  const { error: updateError } = await supabase
    .from('scheduled_agreements')
    .update({ status: 'Completed' })
    .eq('id', scheduledAgreementId);

  if (updateError) {
    console.error('Failed to update scheduled agreement status:', updateError);
  }

  return {
    agreementId: newAgreement.id,
    signerId: newSigner.id,
  };
};

export const useConvertScheduledAgreement = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: convertScheduledAgreement,
    onSuccess: (data) => {
      // Invalidate all relevant queries
      queryClient.invalidateQueries({ queryKey: ['scheduled_agreements'] });
      queryClient.invalidateQueries({ queryKey: ['agreements'] });
      queryClient.invalidateQueries({ queryKey: ['client_scheduled_agreements'] });
      
      toast.success('Agreement created successfully', {
        description: 'The agreement is now ready for signing',
      });
    },
    onError: (error: Error) => {
      toast.error('Failed to start signing process', {
        description: error.message,
      });
    },
  });
};

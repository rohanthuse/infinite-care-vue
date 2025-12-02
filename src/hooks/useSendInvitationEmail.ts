import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface SendInvitationEmailData {
  staffId: string;
  email: string;
  firstName: string;
  lastName: string;
}

export const useSendInvitationEmail = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ staffId, email, firstName, lastName }: SendInvitationEmailData) => {
      // First, get the staff's temporary password
      const { data: staffData, error: staffError } = await supabase
        .from('staff')
        .select('temporary_password')
        .eq('id', staffId)
        .single();

      if (staffError) throw new Error('Failed to fetch staff data');
      
      if (!staffData?.temporary_password) {
        throw new Error('No password set. Please set a password for this staff member first.');
      }

      // Call the edge function to send email
      const { data, error } = await supabase.functions.invoke('send-welcome-email', {
        body: {
          email,
          first_name: firstName,
          last_name: lastName,
          temporary_password: staffData.temporary_password,
          role: 'Carer'
        }
      });

      if (error) throw error;
      if (!data?.success) throw new Error(data?.error || 'Failed to send email');

      // Update the staff record with invitation_sent_at
      const { error: updateError } = await supabase
        .from('staff')
        .update({ invitation_sent_at: new Date().toISOString() })
        .eq('id', staffId);

      if (updateError) {
        console.warn('Email sent but failed to update invitation_sent_at:', updateError);
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['branch-carers'], refetchType: 'all' });
      toast.success('Invitation email sent successfully!');
    },
    onError: (error: Error) => {
      toast.error('Failed to send email. Please try again.', {
        description: error.message
      });
    }
  });
};

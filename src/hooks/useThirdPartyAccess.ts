
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

export interface ThirdPartyAccessRequest {
  id: string;
  branch_id: string;
  created_by: string;
  first_name: string;
  surname: string;
  email: string;
  organisation?: string;
  role?: string;
  request_for: 'client' | 'staff' | 'both';
  client_consent_required: boolean;
  reason_for_access: string;
  access_from: string;
  access_until?: string;
  status: 'pending' | 'approved' | 'rejected' | 'expired' | 'revoked';
  approved_by?: string;
  approved_at?: string;
  rejection_reason?: string;
  invite_token?: string;
  invite_sent_at?: string;
  created_at: string;
  updated_at: string;
}

export interface CreateThirdPartyAccessData {
  first_name: string;
  surname: string;
  email: string;
  organisation?: string;
  role?: string;
  request_for: 'client' | 'staff' | 'both';
  client_consent_required: boolean;
  reason_for_access: string;
  access_from: Date;
  access_until?: Date;
}

export const useThirdPartyAccess = (branchId: string) => {
  const queryClient = useQueryClient();

  // Fetch access requests
  const {
    data: requests = [],
    isLoading,
    error,
  } = useQuery({
    queryKey: ['third-party-access-requests', branchId],
    queryFn: async () => {
      console.log('Fetching third-party access requests for branch:', branchId);
      
      const { data, error } = await supabase
        .from('third_party_access_requests')
        .select('*')
        .eq('branch_id', branchId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching third-party access requests:', error);
        if (error.message?.includes('RLS')) {
          throw new Error('Access denied: You do not have permission to view third-party access requests for this branch.');
        }
        throw error;
      }
      
      console.log('Fetched third-party access requests:', data);
      return data as ThirdPartyAccessRequest[];
    },
    enabled: !!branchId,
  });

  // Create access request mutation
  const createRequestMutation = useMutation({
    mutationFn: async (requestData: CreateThirdPartyAccessData) => {
      console.log('Creating third-party access request:', requestData);
      
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('You must be logged in to create access requests');
      }

      console.log('Current user:', user.id);

      const { data, error } = await supabase
        .from('third_party_access_requests')
        .insert({
          branch_id: branchId,
          created_by: user.id,
          first_name: requestData.first_name,
          surname: requestData.surname,
          email: requestData.email,
          organisation: requestData.organisation,
          role: requestData.role,
          request_for: requestData.request_for,
          client_consent_required: requestData.client_consent_required,
          reason_for_access: requestData.reason_for_access,
          access_from: requestData.access_from.toISOString(),
          access_until: requestData.access_until?.toISOString(),
        })
        .select()
        .single();

      if (error) {
        console.error('Error creating access request:', error);
        if (error.message?.includes('RLS') || error.message?.includes('policy')) {
          throw new Error('Access denied: You do not have permission to create access requests for this branch.');
        }
        throw error;
      }

      console.log('Access request created successfully:', data);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['third-party-access-requests', branchId] });
      toast({
        title: "Success",
        description: "Third-party access request created successfully",
      });
    },
    onError: (error) => {
      console.error('Error creating access request:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to create access request",
        variant: "destructive",
      });
    },
  });

  // Enhanced approve request mutation with better error handling
  const approveRequestMutation = useMutation({
    mutationFn: async (requestId: string) => {
      console.log('Approving access request:', requestId);
      
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('You must be logged in to approve requests');
      }

      try {
        // Generate invite token using the fixed database function
        const { data: tokenData, error: tokenError } = await supabase
          .rpc('generate_invite_token');

        if (tokenError) {
          console.error('Token generation error:', tokenError);
          throw new Error(`Failed to generate invite token: ${tokenError.message}`);
        }

        console.log('Generated token:', tokenData);

        // Update request status and add token
        const { data, error } = await supabase
          .from('third_party_access_requests')
          .update({
            status: 'approved',
            approved_by: user.id,
            approved_at: new Date().toISOString(),
            invite_token: tokenData,
          })
          .eq('id', requestId)
          .select()
          .single();

        if (error) {
          console.error('Error approving request:', error);
          if (error.message?.includes('RLS') || error.message?.includes('policy')) {
            throw new Error('Access denied: You do not have permission to approve this request.');
          }
          throw new Error(`Database error: ${error.message}`);
        }

        console.log('Request approved successfully:', data);

        // Create third-party user account
        try {
          const { data: userId, error: userError } = await supabase
            .rpc('create_third_party_user_account', { request_id_param: requestId });

          if (userError) {
            console.error('Error creating third-party user:', userError);
            // Don't fail the approval if user creation fails - this can be retried
          } else {
            console.log('Third-party user created:', userId);
          }
        } catch (userCreationError) {
          console.error('User creation failed:', userCreationError);
          // Continue with approval even if user creation fails
        }

        // Send invitation email
        try {
          const { error: emailError } = await supabase.functions.invoke('send-third-party-invitation', {
            body: { requestId, inviteToken: tokenData }
          });

          if (emailError) {
            console.error('Error sending invitation email:', emailError);
            toast({
              title: "Request Approved",
              description: "Request approved but email invitation failed to send. You can resend it manually.",
              variant: "default",
            });
          } else {
            console.log('Invitation email sent successfully');
          }
        } catch (emailError) {
          console.error('Email sending failed:', emailError);
          toast({
            title: "Request Approved", 
            description: "Request approved but email invitation failed to send. You can resend it manually.",
            variant: "default",
          });
        }

        return data;
      } catch (error) {
        console.error('Approval process failed:', error);
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['third-party-access-requests', branchId] });
      toast({
        title: "Success",
        description: "Access request approved and invitation sent",
      });
    },
    onError: (error) => {
      console.error('Error in approval mutation:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to approve request",
        variant: "destructive",
      });
    },
  });

  // Reject request mutation
  const rejectRequestMutation = useMutation({
    mutationFn: async ({ requestId, reason }: { requestId: string; reason: string }) => {
      console.log('Rejecting access request:', requestId, reason);
      
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('You must be logged in to reject requests');
      }

      const { data, error } = await supabase
        .from('third_party_access_requests')
        .update({
          status: 'rejected',
          approved_by: user.id,
          approved_at: new Date().toISOString(),
          rejection_reason: reason,
        })
        .eq('id', requestId)
        .select()
        .single();

      if (error) {
        console.error('Error rejecting request:', error);
        if (error.message?.includes('RLS') || error.message?.includes('policy')) {
          throw new Error('Access denied: You do not have permission to reject this request.');
        }
        throw error;
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['third-party-access-requests', branchId] });
      toast({
        title: "Success",
        description: "Access request rejected",
      });
    },
    onError: (error) => {
      console.error('Error rejecting request:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to reject request",
        variant: "destructive",
      });
    },
  });

  const revokeAccessMutation = useMutation({
    mutationFn: async (requestId: string) => {
      console.log('Revoking access request:', requestId);
      
      const { data, error } = await supabase
        .from('third_party_access_requests')
        .update({
          status: 'revoked',
          updated_at: new Date().toISOString(),
        })
        .eq('id', requestId)
        .select()
        .single();

      if (error) {
        console.error('Error revoking access:', error);
        if (error.message?.includes('RLS') || error.message?.includes('policy')) {
          throw new Error('Access denied: You do not have permission to revoke this access.');
        }
        throw error;
      }

      await supabase
        .from('third_party_users')
        .update({ is_active: false })
        .eq('request_id', requestId);

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['third-party-access-requests', branchId] });
      toast({
        title: "Success",
        description: "Access revoked successfully",
      });
    },
    onError: (error) => {
      console.error('Error revoking access:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to revoke access",
        variant: "destructive",
      });
    },
  });

  return {
    requests,
    isLoading,
    error,
    createRequest: createRequestMutation.mutate,
    approveRequest: approveRequestMutation.mutate,
    rejectRequest: rejectRequestMutation.mutate,
    revokeAccess: revokeAccessMutation.mutate,
    isCreating: createRequestMutation.isPending,
    isApproving: approveRequestMutation.isPending,
    isRejecting: rejectRequestMutation.isPending,
    isRevoking: revokeAccessMutation.isPending,
  };
};

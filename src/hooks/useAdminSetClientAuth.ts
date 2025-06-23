
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface SetupClientAuthParams {
  clientId: string;
  password: string;
  adminId: string;
}

interface AdminSetupClientAuthResponse {
  success: boolean;
  error?: string;
  message?: string;
  auth_user_id?: string;
}

const setupClientAuth = async ({ clientId, password, adminId }: SetupClientAuthParams) => {
  console.log('[setupClientAuth] Setting up auth for client:', clientId);
  
  try {
    // Get client details first
    const { data: client, error: clientError } = await supabase
      .from('clients')
      .select('email, first_name, last_name')
      .eq('id', clientId)
      .single();

    if (clientError) {
      console.error('[setupClientAuth] Client lookup error:', clientError);
      throw new Error('Client not found');
    }

    if (!client || !client.email) {
      throw new Error('Client not found or missing email');
    }

    // Check if auth user already exists
    const { data: existingUsers } = await supabase.auth.admin.listUsers();
    const existingUser = existingUsers?.users?.find(u => u.email === client.email);

    let authUserId;

    if (existingUser) {
      // Update existing user's password
      const { data: updateData, error: updateError } = await supabase.auth.admin.updateUserById(
        existingUser.id,
        { password }
      );

      if (updateError) {
        throw updateError;
      }

      authUserId = existingUser.id;
      console.log('[setupClientAuth] Updated existing auth user:', authUserId);
    } else {
      // Create new auth user
      const { data: createData, error: createError } = await supabase.auth.admin.createUser({
        email: client.email,
        password,
        email_confirm: true,
        user_metadata: {
          first_name: client.first_name,
          last_name: client.last_name,
          role: 'client'
        }
      });

      if (createError) {
        throw createError;
      }

      authUserId = createData.user?.id;
      console.log('[setupClientAuth] Created new auth user:', authUserId);

      // Assign client role
      if (authUserId) {
        const { error: roleError } = await supabase
          .from('user_roles')
          .insert({ user_id: authUserId, role: 'client' });

        if (roleError) {
          console.warn('[setupClientAuth] Could not assign role:', roleError);
        }
      }
    }

    // Update client record with password info
    const { error: updateClientError } = await supabase
      .from('clients')
      .update({
        temporary_password: password,
        invitation_sent_at: new Date().toISOString(),
        password_set_by: adminId
      })
      .eq('id', clientId);

    if (updateClientError) {
      console.warn('[setupClientAuth] Could not update client record:', updateClientError);
    }

    return {
      success: true,
      message: 'Client authentication setup successfully',
      auth_user_id: authUserId
    };

  } catch (error: any) {
    console.error('[setupClientAuth] Error:', error);
    throw error;
  }
};

export const useAdminSetClientAuth = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  return useMutation({
    mutationFn: setupClientAuth,
    onSuccess: (data) => {
      console.log('[useAdminSetClientAuth] Auth setup successful:', data);
      
      toast({
        title: "Success",
        description: "Client authentication has been set up successfully",
      });
      
      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: ['branch-clients'] });
      queryClient.invalidateQueries({ queryKey: ['admin-clients'] });
    },
    onError: (error: any) => {
      console.error('[useAdminSetClientAuth] Error:', error);
      toast({
        title: "Error",
        description: "Failed to set up client authentication. Please try again.",
        variant: "destructive",
      });
    },
  });
};

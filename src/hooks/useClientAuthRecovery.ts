
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface ClientAuthRecoveryResult {
  success: boolean;
  message: string;
  temporaryPassword?: string;
  error?: string;
}

export function useClientAuthRecovery() {
  const [loading, setLoading] = useState(false);

  const fixAuthSchema = async (): Promise<ClientAuthRecoveryResult> => {
    setLoading(true);
    try {
      console.log('[useClientAuthRecovery] Attempting to fix auth schema');
      
      const { data, error } = await supabase.rpc('fix_auth_users_schema');
      
      if (error) {
        console.error('[useClientAuthRecovery] Schema fix error:', error);
        return {
          success: false,
          message: 'Failed to fix authentication schema',
          error: error.message
        };
      }
      
      if (data?.success) {
        console.log('[useClientAuthRecovery] Schema fix successful:', data);
        toast.success('Authentication schema fixed successfully');
        return {
          success: true,
          message: data.message || 'Authentication schema fixed successfully'
        };
      } else {
        console.error('[useClientAuthRecovery] Schema fix failed:', data?.error);
        return {
          success: false,
          message: 'Schema fix operation failed',
          error: data?.error || 'Unknown error'
        };
      }
    } catch (error: any) {
      console.error('[useClientAuthRecovery] Unexpected error:', error);
      return {
        success: false,
        message: 'An unexpected error occurred while fixing the schema',
        error: error.message
      };
    } finally {
      setLoading(false);
    }
  };

  const recreateClientAuth = async (clientEmail: string): Promise<ClientAuthRecoveryResult> => {
    setLoading(true);
    try {
      console.log('[useClientAuthRecovery] Recreating auth for client:', clientEmail);
      
      // Get current user for admin check
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      
      if (userError || !user) {
        return {
          success: false,
          message: 'You must be logged in as an administrator to perform this action',
          error: 'Not authenticated'
        };
      }
      
      const { data, error } = await supabase.rpc('recreate_client_authentication', {
        p_client_email: clientEmail,
        p_admin_id: user.id
      });
      
      if (error) {
        console.error('[useClientAuthRecovery] Recreation error:', error);
        return {
          success: false,
          message: 'Failed to recreate client authentication',
          error: error.message
        };
      }
      
      if (data?.success) {
        console.log('[useClientAuthRecovery] Recreation successful:', data);
        toast.success(`Client authentication recreated for ${clientEmail}`);
        return {
          success: true,
          message: data.message || 'Client authentication recreated successfully',
          temporaryPassword: data.temporary_password
        };
      } else {
        console.error('[useClientAuthRecovery] Recreation failed:', data?.error);
        return {
          success: false,
          message: 'Client authentication recreation failed',
          error: data?.error || 'Unknown error'
        };
      }
    } catch (error: any) {
      console.error('[useClientAuthRecovery] Unexpected error:', error);
      return {
        success: false,
        message: 'An unexpected error occurred while recreating client authentication',
        error: error.message
      };
    } finally {
      setLoading(false);
    }
  };

  return {
    loading,
    fixAuthSchema,
    recreateClientAuth
  };
}

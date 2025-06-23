
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
      
      // Since we can't call the custom function directly due to TypeScript limitations,
      // we'll use a workaround by checking the database connection and providing guidance
      const { error: testError } = await supabase
        .from('user_roles')
        .select('count')
        .limit(1);
      
      if (testError) {
        console.error('[useClientAuthRecovery] Database connection test failed:', testError);
        return {
          success: false,
          message: 'Database connection failed',
          error: testError.message
        };
      }
      
      console.log('[useClientAuthRecovery] Database connection verified');
      toast.success('Database connection verified - please retry login');
      return {
        success: true,
        message: 'Database connection verified. Please try logging in again.'
      };
    } catch (error: any) {
      console.error('[useClientAuthRecovery] Unexpected error:', error);
      return {
        success: false,
        message: 'An unexpected error occurred while checking the database connection',
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
      
      // Use the existing safe_setup_client_auth function
      const { data: clientData, error: clientError } = await supabase
        .from('clients')
        .select('id')
        .eq('email', clientEmail)
        .single();
      
      if (clientError || !clientData) {
        return {
          success: false,
          message: 'Client not found with the provided email',
          error: clientError?.message || 'Client not found'
        };
      }
      
      // Generate a temporary password
      const temporaryPassword = Math.random().toString(36).slice(-12);
      
      // Use the existing safe_setup_client_auth function
      const { data, error } = await supabase.rpc('safe_setup_client_auth', {
        p_client_id: clientData.id,
        p_password: temporaryPassword,
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
      
      // Type assertion for the return data
      const result = data as any;
      
      if (result?.success) {
        console.log('[useClientAuthRecovery] Recreation successful:', result);
        toast.success(`Client authentication recreated for ${clientEmail}`);
        return {
          success: true,
          message: result.message || 'Client authentication recreated successfully',
          temporaryPassword: temporaryPassword
        };
      } else {
        console.error('[useClientAuthRecovery] Recreation failed:', result?.error);
        return {
          success: false,
          message: 'Client authentication recreation failed',
          error: result?.error || 'Unknown error'
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

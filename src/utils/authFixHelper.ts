
import { supabase } from '@/integrations/supabase/client';

export const diagnoseAuthIssue = async (email: string) => {
  try {
    console.log('[AuthFixHelper] Diagnosing auth issues for:', email);
    
    // Check if the auth health function exists and run it
    const { data: healthCheck, error: healthError } = await supabase.rpc('check_carer_auth_health');
    
    if (healthError) {
      console.error('[AuthFixHelper] Health check failed:', healthError);
    } else {
      console.log('[AuthFixHelper] Auth health status:', healthCheck);
    }
    
    // Try to fetch user info directly
    const { data: users, error: userError } = await supabase
      .from('staff')
      .select('*, auth_user_id')
      .eq('email', email);
    
    if (userError) {
      console.error('[AuthFixHelper] User lookup error:', userError);
    } else {
      console.log('[AuthFixHelper] User data:', users);
    }
    
    return {
      healthCheck,
      userData: users,
      success: !healthError && !userError
    };
    
  } catch (error) {
    console.error('[AuthFixHelper] Diagnosis failed:', error);
    return { success: false, error };
  }
};

export const attemptAuthFix = async (email: string) => {
  try {
    console.log('[AuthFixHelper] Attempting to fix auth issues for:', email);
    
    // This would typically be handled by a database function
    // For now, we'll just log the attempt
    const diagnosis = await diagnoseAuthIssue(email);
    
    return {
      success: diagnosis.success,
      message: diagnosis.success ? 'Auth diagnosis completed' : 'Auth diagnosis failed',
      data: diagnosis
    };
    
  } catch (error) {
    console.error('[AuthFixHelper] Fix attempt failed:', error);
    return { success: false, error };
  }
};

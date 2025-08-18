import { supabase } from '@/integrations/supabase/client';

export const debugAuthState = async () => {
  console.log('[AUTH DEBUG] Starting authentication state check...');
  
  try {
    // Get current session
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError) {
      console.error('[AUTH DEBUG] Session error:', sessionError);
      return { success: false, error: sessionError };
    }
    
    if (!session) {
      console.log('[AUTH DEBUG] No active session found');
      return { success: false, error: 'No active session' };
    }
    
    console.log('[AUTH DEBUG] Session found:', {
      userId: session.user.id,
      email: session.user.email,
      accessToken: session.access_token.substring(0, 20) + '...',
      refreshToken: session.refresh_token ? session.refresh_token.substring(0, 20) + '...' : 'None',
      expiresAt: new Date(session.expires_at! * 1000).toISOString()
    });
    
    // Get user roles
    const { data: roleData, error: roleError } = await supabase
      .rpc('get_user_highest_role', { p_user_id: session.user.id })
      .single();
    
    if (roleError) {
      console.error('[AUTH DEBUG] Role detection error:', roleError);
    } else {
      console.log('[AUTH DEBUG] User role:', roleData.role);
    }
    
    // Check organization memberships
    const { data: orgMemberships, error: orgError } = await supabase
      .from('organization_members')
      .select('organization_id, status, organizations(name, slug)')
      .eq('user_id', session.user.id);
    
    if (orgError) {
      console.error('[AUTH DEBUG] Organization membership error:', orgError);
    } else {
      console.log('[AUTH DEBUG] Organization memberships:', orgMemberships);
    }
    
    // Check staff assignments
    const { data: staffData, error: staffError } = await supabase
      .from('staff')
      .select('id, branch_id, status, branches(name, organization_id)')
      .eq('auth_user_id', session.user.id);
    
    if (staffError) {
      console.error('[AUTH DEBUG] Staff data error:', staffError);
    } else {
      console.log('[AUTH DEBUG] Staff assignments:', staffData);
    }
    
    // Check client data
    const { data: clientData, error: clientError } = await supabase
      .from('clients')
      .select('id, branch_id, branches(name, organization_id)')
      .eq('auth_user_id', session.user.id);
    
    if (clientError) {
      console.error('[AUTH DEBUG] Client data error:', clientError);
    } else {
      console.log('[AUTH DEBUG] Client assignments:', clientData);
    }
    
    return {
      success: true,
      session,
      role: roleData?.role,
      orgMemberships,
      staffData,
      clientData
    };
    
  } catch (error) {
    console.error('[AUTH DEBUG] Debug failed:', error);
    return { success: false, error };
  }
};

export const clearAuthState = async () => {
  console.log('[AUTH DEBUG] Clearing authentication state...');
  
  try {
    // Sign out from Supabase
    await supabase.auth.signOut();
    
    // Clear all localStorage items
    const keysToRemove = [
      'userType',
      'clientName', 
      'clientId',
      'system_session_token',
      'systemSessionToken',
      'system-session-token'
    ];
    
    keysToRemove.forEach(key => {
      localStorage.removeItem(key);
      sessionStorage.removeItem(key);
    });
    
    console.log('[AUTH DEBUG] Authentication state cleared successfully');
    
    // Force page reload to ensure clean state
    window.location.reload();
    
  } catch (error) {
    console.error('[AUTH DEBUG] Error clearing auth state:', error);
  }
};
import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CustomButton } from "@/components/ui/CustomButton";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Eye, EyeOff, Mail, Lock, Heart, AlertCircle, CheckCircle, RefreshCw } from "lucide-react";
import { validateSessionState, clearAllAuthData, debugAuthState, nuclearReset, validatePreLoginState, withProgressiveTimeout } from "@/utils/authRecovery";
import { checkNetworkHealth } from "@/utils/sessionRecovery";
import { useOptimizedAuth } from "@/hooks/useOptimizedAuth";
import { useAuth } from "@/contexts/UnifiedAuthProvider";
import { checkTenantStatus, fetchOrganizationStatusBySlug } from "@/utils/tenantStatusValidation";



const formatRoleName = (role: string): string => {
  const roleMap: Record<string, string> = {
    'owner': 'Owner',
    'admin': 'Admin',
    'manager': 'Manager',
    'member': 'Member',
    'branch_admin': 'Branch Admin',
    'super_admin': 'Super Admin',
    'carer': 'Carer',
    'client': 'Client'
  };
  return roleMap[role] || role.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase());
};

const checkUserActiveStatus = async (userId: string, userEmail: string): Promise<{
  isActive: boolean;
  userType: 'system_user' | 'staff' | 'client' | 'org_member' | 'unknown';
  message?: string;
}> => {
  // 1. Check system_users (Super Admins)
  const { data: systemUser } = await supabase
    .from('system_users')
    .select('is_active')
    .eq('auth_user_id', userId)
    .maybeSingle();

  if (systemUser) {
    return {
      isActive: systemUser.is_active === true,
      userType: 'system_user'
    };
  }

  // 2. Check staff (Carers)
  const { data: staffMember } = await supabase
    .from('staff')
    .select('status')
    .eq('auth_user_id', userId)
    .maybeSingle();

  if (staffMember) {
    // Only block Inactive status - On Leave and Training can still log in
    const blockedStatuses = ['Inactive'];
    const isBlocked = blockedStatuses.includes(staffMember.status);
    
    return {
      isActive: !isBlocked,
      userType: 'staff',
      message: isBlocked ? 'Your account is inactive. Please contact your organisation admin.' : undefined
    };
  }

  // 3. Check clients
  const { data: clientMember } = await supabase
    .from('clients')
    .select('status')
    .eq('auth_user_id', userId)
    .maybeSingle();

  if (clientMember) {
    // Active clients have status 'Active', not 'Inactive'
    return {
      isActive: clientMember.status !== 'Inactive',
      userType: 'client'
    };
  }

  // 4. Check organization_members
  const { data: orgMember } = await supabase
    .from('organization_members')
    .select('status')
    .eq('user_id', userId)
    .maybeSingle();

  if (orgMember) {
    return {
      isActive: orgMember.status === 'active',
      userType: 'org_member'
    };
  }

  // If no record found, allow login (new user or admin without specific record)
  return { isActive: true, userType: 'unknown' };
};

const UnifiedLogin = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState("Signing in...");
  const [searchParams] = useSearchParams();
  const [thirdPartyInfo, setThirdPartyInfo] = useState<any>(null);
  const [thirdPartyLoading, setThirdPartyLoading] = useState(false);
  const [showRecovery, setShowRecovery] = useState(false);
  const [forceShowForm, setForceShowForm] = useState(false);
  const navigate = useNavigate();
  const { getRoleWithOptimization, getOrganizationWithOptimization, clearOptimizationCache } = useOptimizedAuth();
  const { user, loading: authLoading } = useAuth();

  // Clean up navigation flags when landing on login page
  useEffect(() => {
    console.log('[UnifiedLogin] Component mounted, performing aggressive cleanup');
    
    // Clear all navigation and auth-related flags
    sessionStorage.removeItem('navigating_to_dashboard');
    sessionStorage.removeItem('target_dashboard');
    sessionStorage.removeItem('redirect_in_progress');
    sessionStorage.removeItem('login_redirect_count');
    sessionStorage.removeItem('post_login_redirect');
    sessionStorage.removeItem('navigation_flag_timestamp');
    
    // Check for stuck auth state
    const stuckAuth = sessionStorage.getItem('auth_stuck');
    if (stuckAuth) {
      console.warn('[UnifiedLogin] Detected stuck auth state, clearing');
      localStorage.removeItem('supabase.auth.token');
      sessionStorage.clear();
    }
    
    // Set recovery flag
    sessionStorage.setItem('login_page_loaded', Date.now().toString());
  }, []);

  // PHASE 2: Force display form after 2 seconds regardless of loading state
  useEffect(() => {
    const forceDisplayTimer = setTimeout(() => {
      if (authLoading || loading) {
        console.warn('[UnifiedLogin] Force displaying form after 2s timeout');
        setForceShowForm(true);
      }
    }, 2000);
    
    return () => clearTimeout(forceDisplayTimer);
  }, [authLoading, loading]);

  // Defensive: Ensure auth provider timeout doesn't interfere
  useEffect(() => {
    // Give the auth provider 100ms to initialize
    const checkTimer = setTimeout(() => {
      console.log('[UnifiedLogin] Auth state check:', { authLoading, user });
    }, 100);
    
    return () => clearTimeout(checkTimer);
  }, [authLoading, user]);

  // Diagnostic logging for debugging
  useEffect(() => {
    console.log('[UnifiedLogin] Render state:', {
      authLoading,
      hasUser: !!user,
      pathname: window.location.pathname,
      timestamp: new Date().toISOString()
    });
  }, [authLoading, user]);

  // Redirect loop prevention - removed automatic redirect
  // Let users stay on login page to see error messages if they have auth issues

  // Check for third-party invitation token
  useEffect(() => {
    const token = searchParams.get('thirdPartyToken');
    if (token) {
      validateThirdPartyToken(token);
    }
  }, [searchParams]);

  // Check auth health on mount
  useEffect(() => {
    const checkAuthHealth = async () => {
      try {
        const { data, error } = await supabase.rpc('check_auth_health');
        if (!error && data) {
          console.log('[Auth Health]', data);
          const healthData = data as any;
          if (healthData && !healthData.healthy) {
            console.warn('[Auth Health] System unhealthy:', healthData.affected_users, 'users affected');
          }
        }
      } catch (error) {
        console.error('[Auth Health] Check failed:', error);
      }
    };
    
    checkAuthHealth();
  }, []);

  const validateThirdPartyToken = async (token: string) => {
    try {
      const { data: request, error } = await supabase
        .from('third_party_access_requests')
        .select(`
          *,
          branches:branch_id (name)
        `)
        .eq('invite_token', token)
        .eq('status', 'approved')
        .single();

      if (error || !request) {
        toast.error("Invalid or expired invitation token");
        return;
      }

      // Validate access window
      const now = new Date();
      const accessFrom = new Date(request.access_from);
      const accessUntil = request.access_until ? new Date(request.access_until) : null;

      if (now < accessFrom) {
        toast.error("Access period has not started yet");
        return;
      }

      if (accessUntil && now > accessUntil) {
        toast.error("Access period has expired");
        return;
      }

      setThirdPartyInfo({
        token,
        email: request.email,
        branchName: request.branches?.name,
        accessScope: request.request_for,
        accessUntil: accessUntil?.toLocaleDateString(),
        firstName: request.first_name,
        lastName: request.surname,
        companyName: request.organisation || 'Third-party Organisation'
      });

      // Pre-fill email if provided
      if (request.email) {
        setEmail(request.email);
      }
    } catch (error) {
      console.error('Error validating third-party token:', error);
      toast.error("Unable to validate invitation");
    }
  };

  const redeemThirdPartyInvite = async (userId: string, userEmail: string) => {
    if (!thirdPartyInfo?.token) return null;

    setThirdPartyLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('third-party-redeem-invite', {
        body: {
          token: thirdPartyInfo.token,
          userId,
          userEmail
        }
      });

      if (error) throw error;

      // Store session info in localStorage for third-party workspace
      localStorage.setItem('thirdPartySession', JSON.stringify({
        sessionToken: data.sessionToken,
        thirdPartyUser: data.thirdPartyUser,
        branchInfo: data.branchInfo,
        accessScope: data.accessScope,
        accessExpiresAt: data.accessExpiresAt
      }));

      return data;
    } catch (error: any) {
      console.error('Error redeeming third-party invite:', error);
      toast.error(error.message || "Failed to activate third-party access");
      return null;
    } finally {
      setThirdPartyLoading(false);
    }
  };

  const detectUserOrganization = async (userId: string) => {
    try {
      console.log('[detectUserOrganization] Checking organization for user:', userId);
      
      // For super_admin and app_admin users, check system_user_organizations FIRST
      console.log('[detectUserOrganization] Checking system_user_organizations first for admin users');

      const { data: systemUserData, error: systemUserLookupError } = await supabase
        .from('system_users')
        .select('id')
        .eq('auth_user_id', userId)
        .maybeSingle();

      if (systemUserData?.id) {
        const { data: systemOrgAssignment, error: systemOrgError } = await supabase
          .from('system_user_organizations')
          .select('role, organization_id, organizations(slug, name)')
          .eq('system_user_id', systemUserData.id)
          .limit(1)
          .maybeSingle();

        // If user is super_admin, admin, or app_admin in system_user_organizations, use that org
        if (systemOrgAssignment?.organizations?.slug && 
            ['super_admin', 'app_admin', 'admin'].includes(systemOrgAssignment.role)) {
          const orgSlug = (systemOrgAssignment.organizations as any).slug;
          console.log('[detectUserOrganization] Found admin organization via system_user_organizations:', orgSlug);
          return orgSlug;
        }
      }
      
      // Then check organization_members (for regular org members)
      const { data: memberships, error: membershipError } = await supabase
        .from('organization_members')
        .select('role, organization_id, joined_at, organizations(slug)')
        .eq('user_id', userId)
        .eq('status', 'active')
        .order('joined_at', { ascending: false }); // Most recent first as tiebreaker

      console.log('[detectUserOrganization] Organization membership result:', { 
        count: memberships?.length || 0, 
        membershipError 
      });

      if (memberships && memberships.length > 0) {
        // Sort by role priority: owner > admin > member
        const prioritizedMemberships = memberships
          .filter(m => m.organizations?.slug) // Ensure organization data exists
          .sort((a, b) => {
            const roleOrder = { owner: 1, admin: 2, member: 3 };
            const aOrder = roleOrder[a.role as keyof typeof roleOrder] || 999;
            const bOrder = roleOrder[b.role as keyof typeof roleOrder] || 999;
            return aOrder - bOrder;
          });

        if (prioritizedMemberships.length > 0) {
          const primaryMembership = prioritizedMemberships[0];
          console.log('[detectUserOrganization] Found organization via membership:', {
            slug: primaryMembership.organizations.slug,
            role: primaryMembership.role,
            totalMemberships: memberships.length
          });
          return primaryMembership.organizations.slug;
        }
      }
      
      // DEFENSIVE FALLBACK: If memberships exist but nested organizations.slug is missing, fetch it separately
      if (memberships && memberships.length > 0) {
        const membershipWithoutSlug = memberships.find(m => m.organization_id && !m.organizations?.slug);
        if (membershipWithoutSlug) {
          console.log('[detectUserOrganization] 🔧 Nested org select failed, fetching org separately for organization_id:', membershipWithoutSlug.organization_id);
          const { data: orgData, error: orgFetchError } = await supabase
            .from('organizations')
            .select('slug')
            .eq('id', membershipWithoutSlug.organization_id)
            .single();
          
          if (orgData?.slug) {
            console.log('[detectUserOrganization] ✅ Defensive fallback successful! Found org slug:', orgData.slug);
            return orgData.slug;
          } else {
            console.error('[detectUserOrganization] ❌ Defensive fallback failed:', orgFetchError);
          }
        }
      }

      // Then check staff table (for carers) - use separate queries to avoid join issues
      const { data: staffMember, error: staffError } = await supabase
        .from('staff')
        .select('id, branch_id, status')
        .eq('auth_user_id', userId)
        .eq('status', 'Active')
        .maybeSingle();

      if (staffError && staffError.code !== 'PGRST116') {
        console.error('[detectUserOrganization] Error querying staff table:', staffError);
      }
      
      console.log('[detectUserOrganization] Staff query result:', { staffMember, staffError });

      if (staffMember?.branch_id) {
        const { data: staffBranch } = await supabase
          .from('branches')
          .select('organization_id')
          .eq('id', staffMember.branch_id)
          .maybeSingle();

        if (staffBranch?.organization_id) {
          const { data: staffOrg } = await supabase
            .from('organizations')
            .select('slug')
            .eq('id', staffBranch.organization_id)
            .maybeSingle();

          if (staffOrg?.slug) {
            console.log('[detectUserOrganization] Found staff organization:', staffOrg.slug);
            return staffOrg.slug;
          }
        }
      }

      // Check clients table (for clients)
      const { data: clientMember, error: clientError } = await supabase
        .from('clients')
        .select('id, branch_id')
        .eq('auth_user_id', userId)
        .maybeSingle();

      if (clientError && clientError.code !== 'PGRST116') {
        console.error('[detectUserOrganization] Error querying clients table:', clientError);
      }

      if (clientMember?.branch_id) {
        const { data: clientBranch } = await supabase
          .from('branches')
          .select('organization_id')
          .eq('id', clientMember.branch_id)
          .maybeSingle();

        if (clientBranch?.organization_id) {
          const { data: clientOrg } = await supabase
            .from('organizations')
            .select('slug')
            .eq('id', clientBranch.organization_id)
            .maybeSingle();

          if (clientOrg?.slug) {
            console.log('[detectUserOrganization] Found client organization:', clientOrg.slug);
            return clientOrg.slug;
          }
        }
      }

      // Final fallback: check system_user_organizations via system_users table
      // Use a more reliable two-step query instead of nested select
      const { data: systemUserFallback, error: systemUserFallbackError } = await supabase
        .from('system_users')
        .select('id')
        .eq('auth_user_id', userId)
        .maybeSingle();

      console.log('[detectUserOrganization] System user fallback lookup:', { systemUserFallback, systemUserFallbackError });

      if (systemUserFallback?.id) {
        const { data: systemOrgFallback, error: systemOrgFallbackError } = await supabase
          .from('system_user_organizations')
          .select('organization_id, organizations(slug)')
          .eq('system_user_id', systemUserFallback.id)
          .limit(1)
          .maybeSingle();

        console.log('[detectUserOrganization] System org fallback assignment:', { systemOrgFallback, systemOrgFallbackError });

        if (systemOrgFallback?.organizations?.slug) {
          const orgSlug = (systemOrgFallback.organizations as any).slug;
          console.log('[detectUserOrganization] Found organization via system user fallback:', orgSlug);
          return orgSlug;
        }
      }

      console.log('[detectUserOrganization] No organization found for user:', userId);
      return null;
    } catch (error) {
      console.error('[detectUserOrganization] Error detecting organization:', error);
      return null;
    }
  };

  const handleAuthSchemaFix = async () => {
    try {
      setResetLoading(true);
      toast.info("Running auth schema fix...");
      
      const { data, error } = await supabase.rpc('fix_auth_users_schema');
      
      if (error) throw error;
      
      console.log('[AUTH FIX] Schema fix result:', data);
      
      const fixData = data as any;
      if (fixData?.success) {
        toast.success(
          `Auth schema fixed! ${fixData.affected_rows} users repaired. Please try logging in again.`,
          { duration: 5000 }
        );
        setShowRecovery(false);
      } else {
        toast.error(fixData?.error || "Failed to fix auth schema");
      }
    } catch (error: any) {
      console.error('[AUTH FIX] Error:', error);
      toast.error("Failed to run schema fix: " + error.message);
    } finally {
      setResetLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log('[LOGIN DEBUG] Sign in button clicked, starting login process');
    
    if (!email || !password) {
      console.log('[LOGIN DEBUG] Missing credentials');
      toast.error("Please fill in all fields");
      return;
    }

    console.log('[LOGIN DEBUG] Setting loading state to true');
    setLoading(true);
    setLoadingMessage("Signing in...");

    // Clear all session/local storage flags to prevent stale data from previous sessions
    console.log('[LOGIN DEBUG] Clearing all stale session flags');
    sessionStorage.removeItem('is_org_member');
    sessionStorage.removeItem('actual_org_role');
    sessionStorage.removeItem('client_auth_confirmed');
    sessionStorage.removeItem('client_id');
    sessionStorage.removeItem('client_name');
    sessionStorage.removeItem('client_email');
    sessionStorage.removeItem('redirect_in_progress');
    sessionStorage.removeItem('navigating_to_dashboard');
    sessionStorage.removeItem('target_dashboard');
    sessionStorage.removeItem('client_redirect_timestamp');

    // Set navigation flags IMMEDIATELY to prevent Index page interference
    sessionStorage.setItem('redirect_in_progress', 'true');
    sessionStorage.setItem('navigating_to_dashboard', 'true');

    // Clear any stale navigation data
    sessionStorage.removeItem('target_dashboard');
    
    // Remove obsolete localStorage keys from old branch selection flow
    localStorage.removeItem('currentBranchId');
    localStorage.removeItem('currentBranchName');
    localStorage.removeItem('availableBranches');

    // Add timeout to force loading reset after 15 seconds
    const timeoutId = setTimeout(() => {
      console.warn('[LOGIN DEBUG] Login timeout reached, resetting loading state');
      setLoading(false);
      setShowRecovery(true);
      toast.error("Login is taking too long. Try the recovery options below.");
    }, 15000);

    try {
      console.log('[LOGIN DEBUG] Starting Supabase authentication');
      // Authenticate user first
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (authError) {
        console.error('[LOGIN DEBUG] Auth error:', authError);
        
        // Check for auth schema error specifically
        if (authError.message?.includes('Database error querying schema') || 
            authError.message?.includes('converting NULL to string')) {
          clearTimeout(timeoutId);
          setLoading(false);
          setShowRecovery(true);
          
          toast.error(
            "Authentication system error detected. Please try the 'Fix Auth Schema' option below.",
            { duration: 6000 }
          );
          
          // Log for admin monitoring
          console.error('[LOGIN CRITICAL] Auth schema error - NULL values detected in auth.users');
          
          return;
        }
        
        throw authError;
      }

      if (!authData.user) {
        console.error('[LOGIN DEBUG] No user data returned');
        throw new Error("Authentication failed");
      }

      console.log('[LOGIN DEBUG] Authentication successful, user ID:', authData.user.id);
      setLoadingMessage("Verifying account status...");

      // Check if user account is active
      console.log('[LOGIN DEBUG] Checking user active status...');
      const statusCheck = await checkUserActiveStatus(authData.user.id, authData.user.email || '');

      if (!statusCheck.isActive) {
        console.log('[LOGIN DEBUG] User account is inactive:', statusCheck.userType);
        clearTimeout(timeoutId);
        setLoading(false);
        
        // Show the error toast with explicit id to prevent duplicates
        toast.error("Your account is inactive. Please contact your organization administrator.", {
          id: 'inactive-user-toast',  // Unique ID to prevent duplicate toasts
          duration: 5000,             // Show for 5 seconds
        });
        
        // Delay the sign out to allow the toast to display for a few seconds
        // The toast will stay visible during this delay, then sign out will occur
        setTimeout(() => {
          console.log('[LOGIN DEBUG] Delayed sign out for inactive user');
          supabase.auth.signOut().catch(err => {
            console.error('[LOGIN DEBUG] Sign out error:', err);
          });
        }, 3000); // Wait 3 seconds before signing out - gives user time to read the message
        
        console.log('[LOGIN DEBUG] Inactive user handled, toast displayed, sign out scheduled');
        return;
      }

      console.log('[LOGIN DEBUG] User active status verified:', statusCheck.userType);
      setLoadingMessage("Verifying access level...");

      // Add longer timeout and better error handling for role detection
      let userRole = null;
      let orgSlug: string | null = null; // Declare early so fallbacks can capture it
      let retryCount = 0;
      const maxRetries = 2;

      // PRIORITY: Detect clients FIRST to avoid role confusion
      console.log('[LOGIN DEBUG] Checking if user is a client first (direct query)');
      
      // Use a simpler, faster query - just check if client record exists
      const { data: clientCheck, error: clientCheckError } = await supabase
        .from('clients')
        .select(`
          id,
          first_name,
          last_name,
          email,
          branch_id,
          branches!inner (
            organization_id,
            organizations!inner (slug)
          )
        `)
        .eq('auth_user_id', authData.user.id)
        .single(); // Use single() instead of maybeSingle() to catch errors better

      if (clientCheckError) {
        console.warn('[LOGIN DEBUG] Client check query error:', clientCheckError);
      }

      if (clientCheck) {
        userRole = 'client';
        const clientOrg = (clientCheck.branches as any)?.organizations;
        orgSlug = clientOrg?.slug || null;
        
        console.log('[LOGIN DEBUG] ✅ CLIENT DETECTED - Early redirect path activated:', {
          clientId: clientCheck.id,
          clientName: `${clientCheck.first_name} ${clientCheck.last_name}`,
          branchId: clientCheck.branch_id,
          orgSlug,
          redirectTo: `/${orgSlug}/client-dashboard`
        });

        // CHECK ORGANIZATION STATUS BEFORE ALLOWING LOGIN
        if (orgSlug) {
          try {
            const orgStatus = await fetchOrganizationStatusBySlug(supabase, orgSlug);
            const statusCheck = checkTenantStatus(orgStatus);
            
            if (!statusCheck.isAllowed) {
              clearTimeout(timeoutId);
              setLoading(false);
              console.log('[LOGIN DEBUG] ❌ Tenant status blocked (client) - showing toast:', statusCheck.message);
              // Show toast FIRST with unique ID
              toast.error(statusCheck.message, { 
                id: 'tenant-status-blocked',
                duration: 6000 
              });
              console.log('[LOGIN DEBUG] Toast displayed, scheduling signOut in 3 seconds');
              // Delay signOut to allow toast to display
              setTimeout(() => {
                supabase.auth.signOut();
              }, 3000);
              return;
            }
          } catch (error) {
            console.error('[LOGIN DEBUG] Error checking organization status:', error);
            // Continue with login if status check fails (fail open for availability)
          }
        }

        // CHECK THIRD-PARTY ACCESS EXPIRY FOR CLIENTS
        console.log('[LOGIN DEBUG] Checking third-party access expiry for client');
        const { data: thirdPartyAccess } = await supabase
          .from('third_party_users')
          .select('access_expires_at, is_active')
          .eq('auth_user_id', authData.user.id)
          .maybeSingle();

        if (thirdPartyAccess) {
          console.log('[LOGIN DEBUG] Third-party access record found:', thirdPartyAccess);
          
          // Check if access is revoked
          if (!thirdPartyAccess.is_active) {
            console.log('[LOGIN DEBUG] Third-party access has been revoked');
            clearTimeout(timeoutId);
            setLoading(false);
            toast.error("Your temporary access has been revoked. Please contact the administrator.");
            await supabase.auth.signOut();
            return;
          }
          
          // Check if access has expired
          if (thirdPartyAccess.access_expires_at) {
            const expiryDate = new Date(thirdPartyAccess.access_expires_at);
            if (new Date() > expiryDate) {
              console.log('[LOGIN DEBUG] Third-party access has expired:', thirdPartyAccess.access_expires_at);
              clearTimeout(timeoutId);
              setLoading(false);
              toast.error("Your temporary access has expired. Please contact the administrator.");
              await supabase.auth.signOut();
              return;
            }
          }
          
          console.log('[LOGIN DEBUG] Third-party access is valid');
        }
        
        // Store client data for dashboard
        sessionStorage.setItem('client_id', clientCheck.id);
        sessionStorage.setItem('client_name', `${clientCheck.first_name} ${clientCheck.last_name}`);
        sessionStorage.setItem('client_email', clientCheck.email || '');
        sessionStorage.setItem('client_auth_confirmed', 'true');
        
        // Early redirect for clients
        if (orgSlug) {
          const clientDashboardPath = `/${orgSlug}/client-dashboard`;
          console.log('[LOGIN DEBUG] 🚀 REDIRECTING CLIENT TO:', clientDashboardPath);
          
          toast.success(`Welcome back, ${clientCheck.first_name}!`);
          
          sessionStorage.setItem('redirect_in_progress', 'true');
          sessionStorage.setItem('navigating_to_dashboard', 'true');
          sessionStorage.setItem('target_dashboard', clientDashboardPath);
          sessionStorage.setItem('client_redirect_timestamp', Date.now().toString());
          
          setTimeout(() => {
            sessionStorage.removeItem('redirect_in_progress');
            sessionStorage.removeItem('navigating_to_dashboard');
          }, 3000);
          
          clearTimeout(timeoutId);
          
          // Add fallback to navigate() if window.location.href fails
          try {
            window.location.href = clientDashboardPath;
          } catch (redirectError) {
            console.error('[LOGIN DEBUG] window.location.href failed, using navigate:', redirectError);
            navigate(clientDashboardPath, { replace: true });
          }
          return; // Exit early, don't continue with other role detection
        } else {
          console.error('[LOGIN DEBUG] ❌ Client detected but no organization slug found');
          clearTimeout(timeoutId);
          setLoading(false);
          toast.error("Your account is not associated with an organization. Please contact support.");
          await supabase.auth.signOut();
          return;
        }
      }

      console.log('[LOGIN DEBUG] No client record found, proceeding with standard role detection');

      while (!userRole && retryCount < maxRetries) {
        try {
          console.log(`[LOGIN DEBUG] Role detection attempt ${retryCount + 1}/${maxRetries}`);
          const roleData = await getRoleWithOptimization(authData.user.id);
          userRole = roleData?.role;
          
          if (userRole) {
            console.log('[LOGIN DEBUG] Role detected:', userRole);
            break;
          }
        } catch (optimizedError) {
          console.warn(`[LOGIN DEBUG] Optimized detection failed (attempt ${retryCount + 1}):`, optimizedError);
        }
        
        // If optimization failed, try fallback
        if (!userRole) {
          try {
            const fallbackResult = await supabase.rpc('get_user_highest_role', { 
              p_user_id: authData.user.id 
            }).single();
            
            if (!fallbackResult.error && fallbackResult.data?.role) {
              userRole = fallbackResult.data.role;
              console.log('[LOGIN DEBUG] Fallback role detection succeeded:', userRole);
              break;
            }
          } catch (fallbackError) {
            console.error(`[LOGIN DEBUG] Fallback failed (attempt ${retryCount + 1}):`, fallbackError);
          }
        }
        
        retryCount++;
        if (retryCount < maxRetries) {
          await new Promise(resolve => setTimeout(resolve, 500)); // Wait 500ms before retry
        }
      }

      // THIRD FALLBACK: Direct query to system_users + system_user_organizations
      // This guarantees Super Admins created via System Portal can always log in
      if (!userRole) {
        console.log('[LOGIN DEBUG] No role from RPC, checking system_user_organizations fallback');

        // 1) Find system_users row for this auth user
        const { data: systemUser, error: systemUserErr } = await supabase
          .from('system_users')
          .select('id')
          .eq('auth_user_id', authData.user.id)
          .maybeSingle();

        if (!systemUserErr && systemUser?.id) {
          // 2) Check organization assignment with role
          const { data: systemOrg, error: systemOrgErr } = await supabase
            .from('system_user_organizations')
            .select('role, organizations(slug)')
            .eq('system_user_id', systemUser.id)
            .limit(1)
            .maybeSingle();

          if (!systemOrgErr && systemOrg?.role === 'super_admin') {
            userRole = 'super_admin';
            // Capture orgSlug from the same query result
            if (systemOrg.organizations?.slug) {
              orgSlug = (systemOrg.organizations as any).slug;
              console.log('[LOGIN DEBUG] Fallback: captured orgSlug from system_user_organizations:', orgSlug);
            }
            console.log('[LOGIN DEBUG] Fallback: using system_user_organizations role super_admin');
          } else if (!systemOrgErr && ['admin', 'app_admin'].includes(systemOrg?.role)) {
            // Regular admins should be treated as organization members
            userRole = 'organization_member';
            // Capture orgSlug from the same query result
            if (systemOrg.organizations?.slug) {
              orgSlug = (systemOrg.organizations as any).slug;
              console.log('[LOGIN DEBUG] Fallback: captured orgSlug from system_user_organizations:', orgSlug);
            }
            // Cache the actual organization role for later use
            sessionStorage.setItem('actual_org_role', systemOrg.role);
            sessionStorage.setItem('is_org_member', 'true');
            console.log('[LOGIN DEBUG] Fallback: using system_user_organizations role as organization member:', systemOrg.role);
          }
        }
      }

      console.log('[LOGIN DEBUG] After fallback - userRole:', userRole, 'orgSlug:', orgSlug);

      if (!userRole) {
        console.error('[LOGIN DEBUG] Role detection failure', {
          userId: authData.user.id,
          email: authData.user.email,
          lastKnownRole: userRole,
        });
        clearTimeout(timeoutId);
        setLoading(false);
        toast.error("Unable to determine your access level. Please try again or contact support.");
        await supabase.auth.signOut();
        return;
      }

      console.log('[LOGIN DEBUG] Final user role:', userRole);
      setLoadingMessage("Loading your workspace...");

      // CRITICAL FIX: Check organization membership BEFORE using system role
      // Organization members should NEVER be routed as carers/clients
      console.log('[LOGIN DEBUG] Checking organization membership before routing');

      // Note: orgSlug already declared earlier (line 492) and may have been set in fallback

      const { data: orgMembership } = await supabase
        .from('organization_members')
        .select('role, status, organization_id, organizations(slug)')
        .eq('user_id', authData.user.id)
        .eq('status', 'active')
        .maybeSingle();

      // Only treat as org member if NOT a client - clients use their own routing
      if (orgMembership && 
          orgMembership.organizations?.slug && 
          orgMembership.role !== 'client') {
        console.log('[LOGIN DEBUG] User is an organization member, overriding system role');
        console.log('[LOGIN DEBUG] Organization role:', orgMembership.role, 'System role:', userRole);
        
        // Override userRole with organization membership
        userRole = 'organization_member'; // Create a special marker for org members
        orgSlug = orgMembership.organizations.slug;
        
        // Cache the actual organization role for later use
        sessionStorage.setItem('actual_org_role', orgMembership.role);
        sessionStorage.setItem('is_org_member', 'true');
      }
      
      // DEFENSIVE FALLBACK: If orgMembership exists but nested organizations.slug is missing, fetch it separately
      if (orgMembership && orgMembership.organization_id && !orgMembership.organizations?.slug && orgMembership.role !== 'client') {
        console.log('[LOGIN DEBUG] 🔧 Nested org select failed, fetching org separately for organization_id:', orgMembership.organization_id);
        const { data: orgData, error: orgFetchError } = await supabase
          .from('organizations')
          .select('slug')
          .eq('id', orgMembership.organization_id)
          .single();
        
        if (orgData?.slug) {
          console.log('[LOGIN DEBUG] ✅ Defensive fallback successful! Found org slug:', orgData.slug);
          orgSlug = orgData.slug;
          userRole = 'organization_member';
          sessionStorage.setItem('actual_org_role', orgMembership.role);
          sessionStorage.setItem('is_org_member', 'true');
        } else {
          console.error('[LOGIN DEBUG] ❌ Defensive fallback failed:', orgFetchError);
        }
      }
      
      // For clients in organization_members, just use the org slug but keep client role
      if (orgMembership && 
          orgMembership.role === 'client' && 
          orgMembership.organizations?.slug) {
        orgSlug = orgMembership.organizations.slug;
        console.log('[LOGIN DEBUG] Client org from organization_members:', orgSlug);
        
        // CHECK ORGANIZATION STATUS BEFORE EMERGENCY CLIENT REDIRECT
        try {
          const orgStatus = await fetchOrganizationStatusBySlug(supabase, orgSlug);
          const statusCheck = checkTenantStatus(orgStatus);
          
          if (!statusCheck.isAllowed) {
            clearTimeout(timeoutId);
            setLoading(false);
            console.log('[LOGIN DEBUG] ❌ Tenant status blocked (emergency client) - showing toast:', statusCheck.message);
            // Show toast FIRST with unique ID
            toast.error(statusCheck.message, { 
              id: 'tenant-status-blocked',
              duration: 6000 
            });
            console.log('[LOGIN DEBUG] Toast displayed, scheduling signOut in 3 seconds');
            // Delay signOut to allow toast to display
            setTimeout(() => {
              supabase.auth.signOut();
            }, 3000);
            return;
          }
        } catch (error) {
          console.error('[LOGIN DEBUG] Error checking organization status:', error);
          // Continue with login if status check fails (fail open for availability)
        }
        
        // CRITICAL: If early client detection failed but we found client in org_members,
        // force an immediate client redirect here to prevent downstream routing issues
        if (!clientCheck && userRole === 'client' && orgSlug) {
          console.log('[LOGIN DEBUG] 🚨 EMERGENCY CLIENT REDIRECT - Early detection failed but role is client');
          
          // Fetch client details for proper welcome message
          const { data: clientDetails } = await supabase
            .from('clients')
            .select('id, first_name, last_name, email')
            .eq('auth_user_id', authData.user.id)
            .single();
          
          if (clientDetails) {
            sessionStorage.setItem('client_id', clientDetails.id);
            sessionStorage.setItem('client_name', `${clientDetails.first_name} ${clientDetails.last_name}`);
            sessionStorage.setItem('client_email', clientDetails.email || '');
            sessionStorage.setItem('client_auth_confirmed', 'true');
            
            const clientDashboardPath = `/${orgSlug}/client-dashboard`;
            console.log('[LOGIN DEBUG] 🚀 EMERGENCY CLIENT REDIRECT TO:', clientDashboardPath);
            
            toast.success(`Welcome back, ${clientDetails.first_name}!`);
            
            sessionStorage.setItem('redirect_in_progress', 'true');
            sessionStorage.setItem('navigating_to_dashboard', 'true');
            sessionStorage.setItem('target_dashboard', clientDashboardPath);
            sessionStorage.setItem('client_redirect_timestamp', Date.now().toString());
            
            setTimeout(() => {
              sessionStorage.removeItem('redirect_in_progress');
              sessionStorage.removeItem('navigating_to_dashboard');
            }, 3000);
            
            clearTimeout(timeoutId);
            
            try {
              window.location.href = clientDashboardPath;
            } catch (redirectError) {
              console.error('[LOGIN DEBUG] window.location.href failed, using navigate:', redirectError);
              navigate(clientDashboardPath, { replace: true });
            }
            return; // Exit early - critical for preventing downstream issues
          }
        }
      }

      // Handle third-party access redemption first
      if (thirdPartyInfo) {
        console.log('[LOGIN DEBUG] Processing third-party invitation');
        const redeemResult = await redeemThirdPartyInvite(authData.user.id, authData.user.email);
        if (redeemResult) {
          toast.success("Third-party access activated successfully!");
          
          sessionStorage.setItem('redirect_in_progress', 'true');
          sessionStorage.setItem('navigating_to_dashboard', 'true');
          sessionStorage.setItem('target_dashboard', '/third-party/workspace');
          setTimeout(() => sessionStorage.removeItem('redirect_in_progress'), 3000);
          
          window.location.href = '/third-party/workspace';
          return;
        } else {
          // If redemption failed, continue with normal login flow
          toast.error("Failed to activate third-party access, continuing with normal login");
        }
      }

      // Try optimized organization detection first (if not already set by org membership), fallback to direct call
      if (!orgSlug) {
        try {
          console.log('[LOGIN DEBUG] Attempting optimized organization detection');
          orgSlug = await getOrganizationWithOptimization(authData.user.id);
          console.log('[LOGIN DEBUG] Optimized organization detection result:', orgSlug);
        } catch (optimizedOrgError) {
          console.warn('[LOGIN DEBUG] Optimized organization detection failed, using fallback:', optimizedOrgError);
          try {
            orgSlug = await detectUserOrganization(authData.user.id);
            console.log('[LOGIN DEBUG] Fallback organization detection result:', orgSlug);
          } catch (fallbackOrgError) {
            console.error('[LOGIN DEBUG] Both organization detection methods failed:', fallbackOrgError);
            // Don't throw here - some users might not need organization detection
          }
        }
      }

      // CHECK ORGANIZATION STATUS FOR NON-CLIENT USERS
      if (orgSlug && userRole !== 'client') {
        try {
          console.log('[LOGIN DEBUG] Checking organization status for:', orgSlug);
          const orgStatus = await fetchOrganizationStatusBySlug(supabase, orgSlug);
          const statusCheck = checkTenantStatus(orgStatus);
          
          if (!statusCheck.isAllowed) {
            clearTimeout(timeoutId);
            setLoading(false);
            console.log('[LOGIN DEBUG] ❌ Tenant status blocked (non-client) - showing toast:', statusCheck.message);
            // Show toast FIRST with unique ID
            toast.error(statusCheck.message, { 
              id: 'tenant-status-blocked',
              duration: 6000 
            });
            console.log('[LOGIN DEBUG] Toast displayed, scheduling signOut in 3 seconds');
            // Delay signOut to allow toast to display
            setTimeout(() => {
              supabase.auth.signOut();
            }, 3000);
            return;
          }
          console.log('[LOGIN DEBUG] Organization status check passed:', orgStatus);
        } catch (error) {
          console.error('[LOGIN DEBUG] Error checking organization status:', error);
          // Continue with login if status check fails (fail open for availability)
        }
      }

      setLoadingMessage("Redirecting to dashboard...");

      // Check if super admin should be routed as org admin instead
      const actualOrgRole = sessionStorage.getItem('actual_org_role');
      const hasOrgMembership = sessionStorage.getItem('is_org_member') === 'true';

      // For super admins with organization membership as admin, route to org dashboard
      if (userRole === 'super_admin' && hasOrgMembership && 
          ['admin', 'owner', 'branch_admin'].includes(actualOrgRole || '')) {
        console.log('[LOGIN DEBUG] Super admin has org membership, routing as org admin with role:', actualOrgRole);
        
        if (!orgSlug) {
          // Try to get orgSlug if not already set
          try {
            orgSlug = await detectUserOrganization(authData.user.id);
            console.log('[LOGIN DEBUG] Org admin orgSlug via detectUserOrganization:', orgSlug);
          } catch (orgErr) {
            console.error('[LOGIN DEBUG] Org admin org detection failed:', orgErr);
          }
        }

        if (!orgSlug) {
          console.error('[LOGIN DEBUG] Org admin aborting due to missing orgSlug');
          clearTimeout(timeoutId);
          setLoading(false);
          toast.error("Organization assignment missing. Please contact system administrator.");
          await supabase.auth.signOut();
          return;
        }

        const dashboardPath = `/${orgSlug}/dashboard`;
        toast.success(`Login Successful – Role: ${formatRoleName(actualOrgRole || 'admin')}`);
        
        sessionStorage.setItem('redirect_in_progress', 'true');
        sessionStorage.setItem('navigating_to_dashboard', 'true');
        sessionStorage.setItem('target_dashboard', dashboardPath);
        setTimeout(() => sessionStorage.removeItem('redirect_in_progress'), 3000);
        
        console.log('[LOGIN DEBUG] Redirecting to org admin dashboard:', dashboardPath);
        window.location.href = dashboardPath;
        return;
      }

      // For super admins without org membership, route to tenant-specific dashboard if orgSlug available
      if (userRole === 'super_admin' && !hasOrgMembership) {
        console.log('[LOGIN DEBUG] Super admin detected, orgSlug before final check:', orgSlug);

        // Primary method: Use secure RPC that bypasses RLS
        if (!orgSlug) {
          try {
            const { data, error } = await supabase
              .rpc('get_super_admin_org', { p_user_id: authData.user.id })
              .single();

            if (!error && data?.slug) {
              orgSlug = data.slug;
              console.log('[LOGIN DEBUG] Super admin orgSlug via get_super_admin_org RPC:', orgSlug);
            } else {
              console.warn('[LOGIN DEBUG] get_super_admin_org returned no slug or error:', error);
            }
          } catch (rpcErr) {
            console.error('[LOGIN DEBUG] get_super_admin_org RPC failed:', rpcErr);
          }
        }

        // Secondary fallback: detectUserOrganization
        if (!orgSlug) {
          try {
            orgSlug = await detectUserOrganization(authData.user.id);
            console.log('[LOGIN DEBUG] Super admin orgSlug via detectUserOrganization fallback:', orgSlug);
          } catch (orgErr) {
            console.error('[LOGIN DEBUG] Super admin org detection via detectUserOrganization failed:', orgErr);
          }
        }
        
        if (!orgSlug) {
          console.error('[LOGIN DEBUG] Super admin aborting due to missing orgSlug', {
            userId: authData.user.id,
            email: authData.user.email,
            userRole,
            orgSlug,
          });
          clearTimeout(timeoutId);
          setLoading(false);
          toast.error("Organization assignment missing. Please contact system administrator.");
          await supabase.auth.signOut();
          return;
        }
        
        if (orgSlug) {
          console.log('[LOGIN DEBUG] Super admin detected, pre-caching org data');
          
          // PRE-CACHE: Fetch and store organization data
          try {
            const { data: orgData } = await supabase
              .from('organizations')
              .select('*')
              .eq('slug', orgSlug)
              .single();
            
            if (orgData) {
              sessionStorage.setItem('cached_org_data', JSON.stringify(orgData));
              sessionStorage.setItem('cached_org_timestamp', Date.now().toString());
              
              // Also cache the user's role for faster access
              sessionStorage.setItem('cached_user_role', JSON.stringify({
                role: 'super_admin',
                status: 'active'
              }));
              
              // Cache the user's organization role if available (prioritize org membership)
              const { data: orgMemberData } = await supabase
                .from('organization_members')
                .select('role')
                .eq('organization_id', orgData.id)
                .eq('user_id', authData.user.id)
                .eq('status', 'active')
                .maybeSingle();

              if (orgMemberData) {
                // User has organization membership - cache their org role
                sessionStorage.setItem('cached_org_role', orgMemberData.role);
                sessionStorage.setItem('cached_org_role_timestamp', Date.now().toString());
              } else {
                // No org membership - cache super_admin as the role
                sessionStorage.setItem('cached_org_role', 'super_admin');
                sessionStorage.setItem('cached_org_role_timestamp', Date.now().toString());
              }
              
              console.log('[LOGIN DEBUG] Organization data cached successfully');
            }
          } catch (error) {
            console.warn('[LOGIN DEBUG] Failed to pre-cache org data:', error);
            // Continue anyway - dashboard will fetch as fallback
          }
          
          console.log('[LOGIN DEBUG] Redirecting to super admin dashboard:', `/super_admin/${orgSlug}/dashboard`);
          toast.success("Welcome back, Super Administrator!");
          
          sessionStorage.setItem('redirect_in_progress', 'true');
          sessionStorage.setItem('navigating_to_dashboard', 'true');
          sessionStorage.setItem('target_dashboard', `/super_admin/${orgSlug}/dashboard`);
          setTimeout(() => sessionStorage.removeItem('redirect_in_progress'), 3000);
          
          window.location.href = `/super_admin/${orgSlug}/dashboard`;
          return;
        }
      }

      // For app_admin (system administrators), route to system dashboard
      if (userRole === 'app_admin') {
        console.log('[LOGIN DEBUG] App admin detected, redirecting to system dashboard');
        toast.success("Welcome back, System Administrator!");
        
        sessionStorage.setItem('redirect_in_progress', 'true');
        sessionStorage.setItem('navigating_to_dashboard', 'true');
        sessionStorage.setItem('target_dashboard', '/system-dashboard');
        setTimeout(() => sessionStorage.removeItem('redirect_in_progress'), 3000);
        
        window.location.href = '/system-dashboard';
        return;
      }

      // For non-super admin users, organisation is required
      if (!orgSlug) {
        console.warn('[LOGIN DEBUG] No organisation found on first attempt for role:', userRole);
        
        // Retry organization detection once more before giving up
        try {
          console.log('[LOGIN DEBUG] Retrying organization detection...');
          orgSlug = await detectUserOrganization(authData.user.id);
          
          if (!orgSlug) {
            // ULTIMATE FALLBACK: Direct query without nested select
            console.log('[LOGIN DEBUG] 🔍 Attempting direct organization_members query without nested select...');
            
            const { data: directMembership, error: directError } = await supabase
              .from('organization_members')
              .select('organization_id, role, status')
              .eq('user_id', authData.user.id)
              .eq('status', 'active')
              .maybeSingle();
            
            if (directError) {
              console.error('[LOGIN DEBUG] ❌ Direct membership query failed:', directError);
            } else if (directMembership?.organization_id) {
              console.log('[LOGIN DEBUG] ✅ Direct membership found! Fetching organization slug...');
              
              const { data: directOrg, error: directOrgError } = await supabase
                .from('organizations')
                .select('slug')
                .eq('id', directMembership.organization_id)
                .single();
              
              if (directOrg?.slug) {
                console.log('[LOGIN DEBUG] 🎉 Ultimate fallback successful! Org slug:', directOrg.slug);
                orgSlug = directOrg.slug;
                userRole = 'organization_member';
                sessionStorage.setItem('actual_org_role', directMembership.role);
                sessionStorage.setItem('is_org_member', 'true');
              } else {
                console.error('[LOGIN DEBUG] ❌ Could not fetch organization by ID:', directOrgError);
              }
            } else {
              console.log('[LOGIN DEBUG] ℹ️ No active organization membership found in direct query');
            }
          }
          
          // Only show error if ALL fallbacks failed
          if (!orgSlug) {
            console.error('[LOGIN DEBUG] ❌ FINAL FAILURE - No organisation found after all fallbacks');
            console.error('[LOGIN DEBUG] Failed login - user email:', email, 'detected role:', userRole);
            toast.error("Unable to determine your organization assignment. Please contact your administrator.");
            await supabase.auth.signOut();
            return;
          }
          
          console.log('[LOGIN DEBUG] Organization found on retry:', orgSlug);
        } catch (retryError) {
          console.error('[LOGIN DEBUG] Organization retry failed:', retryError);
          toast.error("Unable to verify organization access. Please try again.");
          await supabase.auth.signOut();
          return;
        }
      }

      // Check if user is an organization member (takes priority over system roles)
      let isOrgMember = sessionStorage.getItem('is_org_member') === 'true';
      
      // Safety check: Never route clients through org member logic
      // Check BOTH the sessionStorage flag AND the actual userRole
      if (isOrgMember && (sessionStorage.getItem('actual_org_role') === 'client' || userRole === 'client')) {
        console.log('[LOGIN DEBUG] Client detected in org members OR userRole, clearing org member flag');
        console.log('[LOGIN DEBUG] Clearing flags:', {
          isOrgMember,
          actual_org_role: sessionStorage.getItem('actual_org_role'),
          userRole
        });
        sessionStorage.removeItem('is_org_member');
        sessionStorage.removeItem('actual_org_role');
        isOrgMember = false;
      }
      
      console.log('[LOGIN DEBUG] Pre-routing state check:', {
        isOrgMember,
        userRole,
        orgSlug,
        clientCheckSuccess: !!clientCheck,
        sessionFlags: {
          is_org_member: sessionStorage.getItem('is_org_member'),
          actual_org_role: sessionStorage.getItem('actual_org_role'),
          client_auth_confirmed: sessionStorage.getItem('client_auth_confirmed')
        }
      });

      if (isOrgMember) {
        console.log('[LOGIN DEBUG] Organization member detected, routing to organization dashboard');
        
        // Pre-cache organization data
        try {
          const { data: orgData } = await supabase
            .from('organizations')
            .select('*')
            .eq('slug', orgSlug)
            .single();
          
          if (orgData) {
            sessionStorage.setItem('cached_org_data', JSON.stringify(orgData));
            sessionStorage.setItem('cached_org_timestamp', Date.now().toString());
            
            const actualRole = sessionStorage.getItem('actual_org_role') || 'member';
            sessionStorage.setItem('cached_org_role', actualRole);
            sessionStorage.setItem('cached_org_role_timestamp', Date.now().toString());
            
            console.log('[LOGIN DEBUG] Organization member - data cached, role:', actualRole);
          }
        } catch (error) {
          console.warn('[LOGIN DEBUG] Failed to pre-cache org data:', error);
        }
        
        const dashboardPath = `/${orgSlug}/dashboard`;
        
        const actualRole = sessionStorage.getItem('actual_org_role') || 'member';
        const roleDisplay = formatRoleName(actualRole);
        toast.success(`Login Successful – Role: ${roleDisplay}`);
        
        console.log('[LOGIN DEBUG] Organization member redirecting to:', dashboardPath);
        
        sessionStorage.setItem('redirect_in_progress', 'true');
        sessionStorage.setItem('navigating_to_dashboard', 'true');
        sessionStorage.setItem('target_dashboard', dashboardPath);
        setTimeout(() => {
          sessionStorage.removeItem('redirect_in_progress');
          sessionStorage.removeItem('is_org_member');
          sessionStorage.removeItem('actual_org_role');
        }, 3000);
        
        window.location.href = dashboardPath;
        return;
      }

      // Route to appropriate dashboard based on role
      let dashboardPath = `/${orgSlug}`;
      
      console.log('[LOGIN DEBUG] Determining dashboard path for role:', userRole, 'in org:', orgSlug);
      
      switch (userRole) {
        case 'branch_admin':
          // PRE-CACHE organization data for branch admin
          try {
            const { data: orgData } = await supabase
              .from('organizations')
              .select('*')
              .eq('slug', orgSlug)
              .single();
            
            if (orgData) {
              sessionStorage.setItem('cached_org_data', JSON.stringify(orgData));
              sessionStorage.setItem('cached_org_timestamp', Date.now().toString());
              sessionStorage.setItem('cached_user_role', JSON.stringify({
                role: 'branch_admin',
                status: 'active'
              }));
              
              // Cache branch_admin role explicitly
              sessionStorage.setItem('cached_org_role', 'branch_admin');
              sessionStorage.setItem('cached_org_role_timestamp', Date.now().toString());
              
              console.log('[LOGIN DEBUG] Branch admin - organization data cached');
            }
          } catch (error) {
            console.warn('[LOGIN DEBUG] Failed to pre-cache org data:', error);
          }
          
          dashboardPath = `/${orgSlug}/dashboard`;
          console.log('[LOGIN DEBUG] Branch admin - redirect to org dashboard');
          toast.success("Welcome back, Branch Administrator!");
          break;
        case 'carer':
          console.log('[CARER_LOGIN] Carer role detected, pre-fetching profile');
          
          // CLEAR CARER CONTEXT CACHE to ensure fresh data on new login
          // This prevents stale staffId from causing Service Report visibility issues
          try {
            Object.keys(localStorage).forEach(key => {
              if (key.startsWith('carerContext-')) {
                localStorage.removeItem(key);
                console.log('[CARER_LOGIN] Cleared cached carer context:', key);
              }
            });
          } catch (e) {
            console.warn('[CARER_LOGIN] Failed to clear carer context cache:', e);
          }
          
          // CHECK THIRD-PARTY ACCESS EXPIRY FOR STAFF/CARERS
          console.log('[CARER_LOGIN] Checking third-party access expiry for staff');
          const { data: staffThirdPartyAccess } = await supabase
            .from('third_party_users')
            .select('access_expires_at, is_active')
            .eq('auth_user_id', authData.user.id)
            .maybeSingle();

          if (staffThirdPartyAccess) {
            console.log('[CARER_LOGIN] Third-party access record found:', staffThirdPartyAccess);
            
            // Check if access is revoked
            if (!staffThirdPartyAccess.is_active) {
              console.log('[CARER_LOGIN] Third-party access has been revoked');
              clearTimeout(timeoutId);
              setLoading(false);
              toast.error("Your temporary access has been revoked. Please contact the administrator.");
              await supabase.auth.signOut();
              return;
            }
            
            // Check if access has expired
            if (staffThirdPartyAccess.access_expires_at) {
              const staffExpiryDate = new Date(staffThirdPartyAccess.access_expires_at);
              if (new Date() > staffExpiryDate) {
                console.log('[CARER_LOGIN] Third-party access has expired:', staffThirdPartyAccess.access_expires_at);
                clearTimeout(timeoutId);
                setLoading(false);
                toast.error("Your temporary access has expired. Please contact the administrator.");
                await supabase.auth.signOut();
                return;
              }
            }
            
            console.log('[CARER_LOGIN] Third-party access is valid');
          }
          
          // Pre-fetch and cache staff profile for fast dashboard load
          try {
            const { data: staffProfile } = await supabase
              .from('staff')
              .select('id, first_name, last_name, email, branch_id, auth_user_id')
              .eq('auth_user_id', authData.user.id)
              .maybeSingle();
            
            if (staffProfile) {
              console.log('[CARER_LOGIN] Staff profile fetched and cached');
              localStorage.setItem('carerProfile', JSON.stringify(staffProfile));
              localStorage.setItem('carerName', `${staffProfile.first_name} ${staffProfile.last_name}`);
              sessionStorage.setItem('freshLogin', 'true');
              
              // Always force Light Mode on login (regardless of previous preference)
              localStorage.setItem('theme', 'light');
              document.documentElement.classList.remove('dark');
              document.documentElement.classList.add('light');
              console.log('[CARER_LOGIN] Forced Light Mode on login');
              
              // Set dev-tenant for development environments
              const isDev = window.location.hostname === 'localhost' || 
                           window.location.hostname === '127.0.0.1' || 
                           window.location.hostname.includes('preview');
              
              if (isDev && orgSlug) {
                localStorage.setItem('dev-tenant', orgSlug);
                console.log('[CARER_LOGIN] Set dev-tenant for development:', orgSlug);
              }
            }
          } catch (profileError) {
            console.warn('[CARER_LOGIN] Failed to pre-fetch profile, will fetch on dashboard:', profileError);
          }
          
          dashboardPath += '/carer-dashboard';
          toast.success("Welcome back!");
          break;
        case 'client':
          // Extra defensive check for clients - ensure org is detected
          if (!orgSlug) {
            console.error('[LOGIN DEBUG] Client role detected but no org - forcing detection');
            try {
              // Force a direct query to get client's organization
              const { data: clientData } = await supabase
                .from('clients')
                .select('branch_id')
                .eq('auth_user_id', authData.user.id)
                .single();
              
              if (clientData?.branch_id) {
                const { data: branchData } = await supabase
                  .from('branches')
                  .select('organization_id')
                  .eq('id', clientData.branch_id)
                  .single();
                
                if (branchData?.organization_id) {
                  const { data: orgData } = await supabase
                    .from('organizations')
                    .select('slug')
                    .eq('id', branchData.organization_id)
                    .single();
                  
                  if (orgData?.slug) {
                    orgSlug = orgData.slug;
                    console.log('[LOGIN DEBUG] Forced client org detection:', orgSlug);
                  }
                }
              }
            } catch (error) {
              console.error('[LOGIN DEBUG] Forced client org detection failed:', error);
            }
          }
          
          if (!orgSlug) {
            toast.error("Unable to determine your organization. Please contact support.");
            await supabase.auth.signOut();
            return;
          }
          
          // Always force Light Mode on login (regardless of previous preference)
          localStorage.setItem('theme', 'light');
          document.documentElement.classList.remove('dark');
          document.documentElement.classList.add('light');
          console.log('[CLIENT_LOGIN] Forced Light Mode on login');
          
          dashboardPath += '/client-dashboard';
          toast.success("Welcome back!");
          break;
        default:
          // Fallback to admin dashboard
          // Always force Light Mode on login (regardless of previous preference)
          localStorage.setItem('theme', 'light');
          document.documentElement.classList.remove('dark');
          document.documentElement.classList.add('light');
          console.log('[ADMIN_LOGIN] Forced Light Mode on login');
          
          dashboardPath += '/dashboard';
          toast.success("Login successful!");
          break;
      }

      console.log('[LOGIN DEBUG] Final redirect to:', dashboardPath);
      console.log('[CARER_LOGIN] Redirecting to:', dashboardPath);
      
      sessionStorage.setItem('redirect_in_progress', 'true');
      sessionStorage.setItem('navigating_to_dashboard', 'true');
      sessionStorage.setItem('target_dashboard', dashboardPath);
      setTimeout(() => sessionStorage.removeItem('redirect_in_progress'), 3000);
      
      // Use window.location.href for more reliable navigation after authentication
      window.location.href = dashboardPath;

    } catch (error: any) {
      console.error('[LOGIN DEBUG] Login error occurred:', error);
      
      // Enhanced network error detection
      const isNetworkError = 
        error.name === 'AuthRetryableFetchError' ||
        error.message?.includes('Failed to fetch') ||
        error.message?.includes('ERR_NAME_NOT_RESOLVED') ||
        error.message?.includes('network') ||
        error.message?.includes('connection');
      
      if (isNetworkError) {
        console.error('[LOGIN DEBUG] Network error detected, checking network health');
        toast.error("Cannot reach the authentication server. Please check your internet connection or try again shortly.");
        setShowRecovery(true);
        
        // Check network health for additional diagnostics
        try {
          const health = await checkNetworkHealth();
          console.log('[LOGIN DEBUG] Network health on failure:', health);
          if (!health.isOnline || health.quality === 'offline') {
            toast.error("You appear to be offline or unable to reach the server. Please check your connection.", {
              duration: 6000
            });
          }
        } catch (healthError) {
          console.warn('[LOGIN DEBUG] Network health check failed:', healthError);
        }
      } else if (error.message?.includes('Invalid login credentials')) {
        toast.error("Invalid email or password");
      } else if (error.message?.includes('Email not confirmed')) {
        toast.error("Please check your email and click the confirmation link");
      } else if (error.message?.includes('timeout')) {
        toast.error("Login is taking too long. Try the recovery options below.");
        setShowRecovery(true);
      } else {
        toast.error(error.message || "Login failed. Please try again.");
      }
    } finally {
      console.log('[LOGIN DEBUG] Cleaning up login process');
      clearTimeout(timeoutId);
      setLoading(false);
    }
  };

  const handleClearSession = async () => {
    try {
      toast.loading("Clearing session data...");
      await debugAuthState(); // Log current state
      await clearAllAuthData();
      clearOptimizationCache(); // Clear optimization cache
      setShowRecovery(false);
      toast.success("Session cleared. You can try logging in again.");
    } catch (error) {
      console.error('Clear session error:', error);
      toast.error("Failed to clear session data");
    }
  };

  const handleForceRefresh = () => {
    toast.loading("Refreshing page...");
    setTimeout(() => {
      window.location.reload();
    }, 500);
  };

  const handleNuclearReset = async () => {
    try {
      toast.loading("Performing complete reset...");
      await debugAuthState(); // Log current state before reset
      await nuclearReset();
      clearOptimizationCache(); // Clear optimization cache
      setShowRecovery(false);
      toast.success("Complete reset performed. Page will refresh.");
      // Force refresh after nuclear reset
      setTimeout(() => window.location.reload(), 1000);
    } catch (error) {
      console.error('Nuclear reset error:', error);
      toast.error("Failed to perform complete reset");
    }
  };

  const handleForgotPassword = async () => {
    if (!email) {
      toast.error("Please enter your email address first");
      return;
    }

    setResetLoading(true);
    try {
      const { error } = await supabase.functions.invoke('send-password-reset', {
        body: {
          email: email,
          redirectTo: `${window.location.origin}/reset-password`
        }
      });

      if (error) {
        throw error;
      }

      toast.success("Password reset link sent to your email. Please check your inbox.");
    } catch (error: any) {
      console.error('[UnifiedLogin] Password reset error:', error);
      toast.error(error.message || "Failed to send reset email. Please try again.");
    } finally {
      setResetLoading(false);
    }
  };

  return (
    <div className="login-page-light min-h-screen flex">
      {/* Left Column - Gradient Background with Info */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-blue-600 to-cyan-600 relative">
        {/* Wave Pattern */}
        <div className="absolute inset-0 bg-gradient-to-br from-blue-500/20 to-cyan-500/20">
          <svg className="absolute bottom-0 left-0 w-full h-32 text-blue-600/10" viewBox="0 0 1200 120" preserveAspectRatio="none">
            <path d="M0,60 C240,20 480,100 720,60 C960,20 1200,100 1200,60 L1200,120 L0,120 Z" fill="currentColor"></path>
          </svg>
        </div>
        
        <div className="relative z-10 flex flex-col justify-center px-12 py-16 text-white">
          <div className="max-w-md">
            <div className="flex items-center mb-8">
              <img src="/lovable-uploads/3c8cdaf9-5267-424f-af69-9a1ce56b7ec5.png" alt="Med-Infinite Logo" className="h-8 w-8 mr-3" />
              <h1 className="text-2xl font-bold">Med-Infinite</h1>
            </div>
            
            <h2 className="text-4xl font-bold mb-6 leading-tight">
              Welcome to Med-Infinite
            </h2>
            
            <p className="text-xl text-blue-100 mb-8">
              Your Gateway to Effortless Management
            </p>
            
            <p className="text-blue-100 leading-relaxed">
              Streamline your healthcare administration with our comprehensive platform designed for modern healthcare organizations.
            </p>
          </div>
        </div>
      </div>

      {/* Right Column - Login Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center px-4 py-12 bg-white relative">
        {/* PHASE 2: Non-blocking Loading Banner - only show if form not forced visible */}
        {(loading || authLoading) && !forceShowForm && (
          <div className="absolute top-0 left-0 right-0 bg-blue-50 border-b border-blue-100 py-3 px-4 z-40">
            <div className="flex items-center justify-center gap-3">
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary"></div>
              <p className="text-sm font-medium text-gray-700">
                {authLoading ? 'Checking authentication...' : loadingMessage}
              </p>
            </div>
          </div>
        )}
        
        <div className="w-full max-w-md space-y-8">
          {/* Back to Home Button */}
          <div className="flex justify-start">
            <button
              type="button"
              onClick={() => navigate('/')}
              className="flex items-center text-sm text-gray-600 hover:text-gray-900 transition-colors"
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Back to Home
            </button>
          </div>

          {/* Logo and Title */}
          <div className="text-center">
            <div className="flex justify-center mb-6">
              <img src="/lovable-uploads/3c8cdaf9-5267-424f-af69-9a1ce56b7ec5.png" alt="Med-Infinite Logo" className="w-16 h-16" />
            </div>
            <h2 className="text-3xl font-bold text-gray-900">
              {thirdPartyInfo ? 'Complete Your Third-Party Access' : 'Sign in to your account'}
            </h2>
            <p className="mt-2 text-sm text-gray-600">
              {thirdPartyInfo 
                ? 'Sign in to activate your invited access'
                : 'Access your healthcare management platform'
              }
            </p>
          </div>

          {/* Third-Party Invitation Banner */}
          {thirdPartyInfo && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-start">
                <CheckCircle className="h-5 w-5 text-blue-600 mt-0.5 mr-3 flex-shrink-0" />
                <div className="flex-1">
                  <h3 className="text-sm font-medium text-blue-900">
                    You're invited to access {thirdPartyInfo.branchName}
                  </h3>
                  <div className="mt-2 text-sm text-blue-700">
                    <p><strong>Invited by:</strong> {thirdPartyInfo.branchName}</p>
                    <p><strong>Access type:</strong> {thirdPartyInfo.accessScope} data (read-only)</p>
                    {thirdPartyInfo.accessUntil && (
                      <p><strong>Valid until:</strong> {thirdPartyInfo.accessUntil}</p>
                    )}
                    <p className="mt-2 text-xs">
                      Please sign in with the email address: <strong>{thirdPartyInfo.email}</strong>
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <Label htmlFor="email" className="block text-sm font-medium text-gray-700">
                Email address
              </Label>
              <div className="mt-1 relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <Input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={loading}
                  className="pl-10 block w-full"
                  placeholder="Enter your email"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between">
                <Label htmlFor="password" className="block text-sm font-medium text-gray-700">
                  Password
                </Label>
                <button
                  type="button"
                  onClick={handleForgotPassword}
                  disabled={resetLoading}
                  className="text-sm text-blue-600 hover:text-blue-500 disabled:opacity-50"
                >
                  {resetLoading ? "Sending..." : "Forgot password?"}
                </button>
              </div>
              <div className="mt-1 relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <Input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={loading}
                  className="pl-10 pr-10 block w-full"
                  placeholder="Enter your password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
            </div>

            <div>
              <CustomButton
                type="submit"
                className="w-full bg-blue-600 hover:bg-blue-700"
                disabled={loading || thirdPartyLoading}
              >
                {loading || thirdPartyLoading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                    {thirdPartyInfo ? 'Activating Access...' : 'Signing in...'}
                  </>
                ) : (
                  thirdPartyInfo ? 'Sign In & Activate Access' : 'Sign In'
                )}
              </CustomButton>
            </div>
          </form>

          {/* Recovery Options */}
          {showRecovery && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <div className="flex items-start">
                <AlertCircle className="h-5 w-5 text-yellow-600 mt-0.5 mr-3 flex-shrink-0" />
                <div className="flex-1">
                  <h3 className="text-sm font-medium text-yellow-900 mb-3">
                    Having trouble logging in? Try these recovery options:
                  </h3>
                  <div className="space-y-2">
                    <CustomButton
                      type="button"
                      onClick={handleClearSession}
                      className="w-full bg-yellow-600 hover:bg-yellow-700 text-white"
                      size="sm"
                    >
                      <RefreshCw className="h-4 w-4 mr-2" />
                      Clear Session & Try Again
                    </CustomButton>
                    <CustomButton
                      type="button"
                      onClick={handleNuclearReset}
                      className="w-full bg-red-600 hover:bg-red-700 text-white"
                      size="sm"
                    >
                      <AlertCircle className="h-4 w-4 mr-2" />
                      Complete Reset (Nuclear Option)
                    </CustomButton>
                    <CustomButton
                      type="button"
                      onClick={handleAuthSchemaFix}
                      disabled={resetLoading}
                      variant="secondary"
                      className="w-full"
                      size="sm"
                    >
                      {resetLoading ? (
                        <>
                          <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                          Fixing Auth Schema...
                        </>
                      ) : (
                        <>
                          <RefreshCw className="mr-2 h-4 w-4" />
                          Fix Auth Schema (Admin)
                        </>
                      )}
                    </CustomButton>
                    <CustomButton
                      type="button"
                      onClick={handleForceRefresh}
                      variant="outline"
                      className="w-full border-yellow-300 text-yellow-700 hover:bg-yellow-50"
                      size="sm"
                    >
                      Force Refresh Page
                    </CustomButton>
                    <button
                      type="button"
                      onClick={() => setShowRecovery(false)}
                      className="w-full text-xs text-yellow-600 hover:text-yellow-700 underline mt-2"
                    >
                      Hide recovery options
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Support Link */}
          <div className="text-center">
            <p className="text-sm text-gray-600">
              Need help?{" "}
              <a href="mailto:support@med-infinite.com" className="font-medium text-blue-600 hover:text-blue-500">
                Contact Support
              </a>
            </p>
          </div>
        </div>
      </div>

    </div>
  );
};

export default UnifiedLogin;
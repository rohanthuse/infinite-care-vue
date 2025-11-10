import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CustomButton } from "@/components/ui/CustomButton";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Eye, EyeOff, Mail, Lock, Heart, AlertCircle, CheckCircle, RefreshCw } from "lucide-react";
import { validateSessionState, clearAllAuthData, debugAuthState, nuclearReset, validatePreLoginState, withProgressiveTimeout } from "@/utils/authRecovery";
import { useOptimizedAuth } from "@/hooks/useOptimizedAuth";



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
  const navigate = useNavigate();
  const { getRoleWithOptimization, getOrganizationWithOptimization, clearOptimizationCache } = useOptimizedAuth();

  // Check for third-party invitation token
  useEffect(() => {
    const token = searchParams.get('thirdPartyToken');
    if (token) {
      validateThirdPartyToken(token);
    }
  }, [searchParams]);

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
      
      // First check organization_members (for regular org members and system users)
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
      const { data: systemUser, error: systemUserError } = await supabase
        .from('system_users')
        .select(`
          system_user_organizations(
            organization_id,
            organizations(slug)
          )
        `)
        .eq('auth_user_id', userId)
        .maybeSingle();

      console.log('[detectUserOrganization] System user result:', { systemUser, systemUserError });

      if (systemUser?.system_user_organizations?.[0]?.organizations?.slug) {
        const orgSlug = systemUser.system_user_organizations[0].organizations.slug;
        console.log('[detectUserOrganization] Found organization via system user:', orgSlug);
        return orgSlug;
      }

      console.log('[detectUserOrganization] No organization found for user:', userId);
      return null;
    } catch (error) {
      console.error('[detectUserOrganization] Error detecting organization:', error);
      return null;
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
        throw authError;
      }

      if (!authData.user) {
        console.error('[LOGIN DEBUG] No user data returned');
        throw new Error("Authentication failed");
      }

      console.log('[LOGIN DEBUG] Authentication successful, user ID:', authData.user.id);
      setLoadingMessage("Verifying access level...");

      // Add longer timeout and better error handling for role detection
      let userRole = null;
      let retryCount = 0;
      const maxRetries = 2;

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

      if (!userRole) {
        clearTimeout(timeoutId);
        setLoading(false);
        toast.error("Unable to determine your access level. Please try again or contact support.");
        await supabase.auth.signOut();
        return;
      }

      console.log('[LOGIN DEBUG] Final user role:', userRole);
      setLoadingMessage("Loading your workspace...");

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

      // Try optimized organization detection first, fallback to direct call
      let orgSlug = null;
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

      setLoadingMessage("Redirecting to dashboard...");

      // For super admins, route to tenant-specific dashboard if orgSlug available
      if (userRole === 'super_admin') {
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
              
              console.log('[LOGIN DEBUG] Organization data cached successfully');
            }
          } catch (error) {
            console.warn('[LOGIN DEBUG] Failed to pre-cache org data:', error);
            // Continue anyway - dashboard will fetch as fallback
          }
          
          console.log('[LOGIN DEBUG] Redirecting to tenant dashboard:', `/${orgSlug}/dashboard`);
          toast.success("Welcome back, Super Administrator!");
          
          sessionStorage.setItem('redirect_in_progress', 'true');
          sessionStorage.setItem('navigating_to_dashboard', 'true');
          sessionStorage.setItem('target_dashboard', `/${orgSlug}/dashboard`);
          setTimeout(() => sessionStorage.removeItem('redirect_in_progress'), 3000);
          
          window.location.href = `/${orgSlug}/dashboard`;
          return;
        } else {
          // Fallback: if no organization found, redirect to main dashboard
          console.log('[LOGIN DEBUG] Super admin without organization, redirecting to main dashboard');
          toast.success("Welcome back, Super Administrator!");
          
          sessionStorage.setItem('redirect_in_progress', 'true');
          sessionStorage.setItem('navigating_to_dashboard', 'true');
          sessionStorage.setItem('target_dashboard', '/dashboard');
          setTimeout(() => sessionStorage.removeItem('redirect_in_progress'), 3000);
          
          window.location.href = '/dashboard';
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
            console.error('[LOGIN DEBUG] No organisation found after retry for user role:', userRole);
            toast.error("No organisation access found for your account. Please contact support.");
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
            }
          } catch (profileError) {
            console.warn('[CARER_LOGIN] Failed to pre-fetch profile, will fetch on dashboard:', profileError);
          }
          
          dashboardPath += '/carer-dashboard';
          toast.success("Welcome back!");
          break;
        case 'client':
          dashboardPath += '/client-dashboard';
          toast.success("Welcome back!");
          break;
        default:
          // Fallback to admin dashboard
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
      
      if (error.message?.includes('Invalid login credentials')) {
        toast.error("Invalid email or password");
      } else if (error.message?.includes('Email not confirmed')) {
        toast.error("Please check your email and click the confirmation link");
      } else if (error.message?.includes('timeout')) {
        toast.error("Login is taking too long. Try the recovery options below.");
        setShowRecovery(true);
      } else {
        toast.error(error.message || "Login failed. Please try again.");
        // Show recovery options for persistent errors
        if (error.message?.includes('network') || error.message?.includes('connection')) {
          setShowRecovery(true);
        }
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
        {/* Loading Overlay */}
        {loading && (
          <div className="absolute inset-0 bg-white/90 backdrop-blur-sm flex items-center justify-center z-50">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-3"></div>
              <p className="text-sm font-medium text-gray-700">{loadingMessage}</p>
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
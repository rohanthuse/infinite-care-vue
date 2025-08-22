import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CustomButton } from "@/components/ui/CustomButton";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Eye, EyeOff, Mail, Lock, Heart } from "lucide-react";

const UnifiedLogin = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);
  const navigate = useNavigate();

  const detectUserOrganization = async (userId: string) => {
    try {
      console.log('[detectUserOrganization] Checking organization for user:', userId);
      
      // First check organization_members (for regular org members and system users)
      const { data: membership, error: membershipError } = await supabase
        .from('organization_members')
        .select('organization_id, organizations(slug)')
        .eq('user_id', userId)
        .eq('status', 'active')
        .maybeSingle();

      console.log('[detectUserOrganization] Organization membership result:', { membership, membershipError });

      if (membership?.organizations?.slug) {
        console.log('[detectUserOrganization] Found organization via membership:', membership.organizations.slug);
        return membership.organizations.slug;
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
    
    if (!email || !password) {
      toast.error("Please fill in all fields");
      return;
    }

    setLoading(true);

    try {
      // Authenticate user
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (authError) {
        throw authError;
      }

      if (!authData.user) {
        throw new Error("Authentication failed");
      }

      // Get user's highest priority role first
      const { data: roleData, error: roleError } = await supabase
        .rpc('get_user_highest_role', { p_user_id: authData.user.id })
        .single();

      if (roleError) {
        console.error('Role detection error:', roleError);
        toast.error("Unable to determine your access level. Please contact support.");
        return;
      }

      const userRole = roleData.role;
      console.log('User role detected:', userRole);
      console.log('[AUTH DEBUG] User ID:', authData.user.id, 'Email:', authData.user.email);

      // For super admins, always redirect to system dashboard for full functionality
      if (userRole === 'super_admin') {
        console.log('[AUTH DEBUG] Super admin detected, redirecting to system dashboard for user:', authData.user.email);
        toast.success("Welcome back, System Administrator!");
        navigate('/system-dashboard');
        return;
      }

      // For non-super admin users, detect organization membership
      const orgSlug = await detectUserOrganization(authData.user.id);

      if (!orgSlug) {
        toast.error("No organization access found for your account");
        await supabase.auth.signOut();
        return;
      }

      // Route to appropriate dashboard based on role
      let dashboardPath = `/${orgSlug}`;
      
      switch (userRole) {
        case 'branch_admin':
          dashboardPath += '/dashboard';
          toast.success("Welcome back, Branch Administrator!");
          break;
        case 'carer':
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

      console.log('Redirecting to:', dashboardPath);
      navigate(dashboardPath);

    } catch (error: any) {
      console.error('Login error:', error);
      
      if (error.message?.includes('Invalid login credentials')) {
        toast.error("Invalid email or password");
      } else if (error.message?.includes('Email not confirmed')) {
        toast.error("Please check your email and click the confirmation link");
      } else {
        toast.error(error.message || "Login failed. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    if (!email) {
      toast.error("Please enter your email address first");
      return;
    }

    setResetLoading(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/login`,
      });

      if (error) {
        throw error;
      }

      toast.success("Password reset link sent to your email");
    } catch (error: any) {
      toast.error(error.message || "Failed to send reset email");
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
      <div className="w-full lg:w-1/2 flex items-center justify-center px-4 py-12 bg-white">
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
            <h2 className="text-3xl font-bold text-gray-900">Sign in to your account</h2>
            <p className="mt-2 text-sm text-gray-600">Access your healthcare management platform</p>
          </div>

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
                disabled={loading}
              >
                {loading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                    Signing in...
                  </>
                ) : (
                  "Sign In"
                )}
              </CustomButton>
            </div>
          </form>

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
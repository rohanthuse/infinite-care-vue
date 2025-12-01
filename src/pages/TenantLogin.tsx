import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Mail, Lock, Eye, EyeOff, Building2, AlertTriangle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { CustomButton } from '@/components/ui/CustomButton';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { useTenant } from '@/contexts/TenantContext';
import { LoadingScreen } from '@/components/LoadingScreen';
import { checkTenantStatus } from '@/utils/tenantStatusValidation';

// Helper function to format role names for display
const formatRoleName = (role: string): string => {
  const roleMap: Record<string, string> = {
    'owner': 'Owner',
    'admin': 'Admin',
    'manager': 'Manager',
    'member': 'Member',
    'branch_admin': 'Branch Admin',
    'super_admin': 'Super Admin'
  };
  return roleMap[role] || role.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase());
};

const TenantLogin = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { organization, tenantSlug, isLoading, error } = useTenant();

  // Add debug logging
  console.log('[TenantLogin] Debug info:', {
    organization: organization?.name,
    tenantSlug,
    isLoading,
    error: error?.message,
    pathname: window.location.pathname
  });
  
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.email || !formData.password) {
      toast({
        title: 'Missing Information',
        description: 'Please enter both email and password.',
        variant: 'destructive',
      });
      return;
    }

    if (!organization) {
      toast({
        title: 'Error',
        description: 'Organization not loaded.',
        variant: 'destructive',
      });
      return;
    }

    // Check tenant status before allowing login
    const statusCheck = checkTenantStatus(organization.subscription_status);
    if (!statusCheck.isAllowed) {
      toast({
        title: `Organisation ${statusCheck.status === 'inactive' ? 'Inactive' : 'Suspended'}`,
        description: statusCheck.message,
        variant: 'destructive',
      });
      return;
    }

    setIsSubmitting(true);

    try {
      // PHASE 4: Clear any stale navigation data before login
      console.log('[TenantLogin] Clearing stale navigation data');
      sessionStorage.removeItem('navigating_to_dashboard');
      sessionStorage.removeItem('target_dashboard');
      sessionStorage.removeItem('redirect_in_progress');
      localStorage.removeItem('currentBranchId');
      localStorage.removeItem('currentBranchName');

      // PHASE 7: Set redirect lock to prevent double redirects
      sessionStorage.setItem('redirect_in_progress', 'true');
      setTimeout(() => {
        sessionStorage.removeItem('redirect_in_progress');
      }, 5000);

      // Authenticate with Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: formData.email,
        password: formData.password,
      });

      if (authError) {
        throw authError;
      }

      if (!authData.user) {
        throw new Error('Authentication failed');
      }

      console.log('[TenantLogin] Authentication successful, determining role and target dashboard');

      // PHASE 3: Store tenant context
      localStorage.setItem('current_tenant_slug', tenantSlug || '');
      localStorage.setItem('current_organization_id', organization.id);

      // Check if user is a super admin first by joining through email
      const { data: systemUserRole, error: systemRoleError } = await supabase
        .from('system_user_roles')
        .select('role, system_users!inner(email)')
        .eq('system_users.email', authData.user.email)
        .eq('role', 'super_admin')
        .maybeSingle();

      let memberData = null;
      let isSuperAdmin = !systemRoleError && systemUserRole;

      if (!isSuperAdmin) {
        // For non-super admins, verify organization membership
        const { data: orgMemberData, error: memberError } = await supabase
          .from('organization_members')
          .select('role, status')
          .eq('organization_id', organization.id)
          .eq('user_id', authData.user.id)
          .eq('status', 'active')
          .maybeSingle();

        if (memberError || !orgMemberData) {
          await supabase.auth.signOut();
          sessionStorage.removeItem('redirect_in_progress');
          toast({
            title: 'Access Denied',
            description: 'You don\'t have permission to access this organization.',
            variant: 'destructive',
          });
          return;
        }
        memberData = orgMemberData;
      } else {
        // Check organization membership for ALL users (not just super admins)
        const { data: orgMemberData } = await supabase
          .from('organization_members')
          .select('role, status')
          .eq('organization_id', organization.id)
          .eq('user_id', authData.user.id)
          .eq('status', 'active')
          .maybeSingle();
        
        if (orgMemberData) {
          // User is an organization member - use their org role
          memberData = orgMemberData;
        } else if (isSuperAdmin) {
          // Super admin without org membership - give default admin privileges
          memberData = { role: 'admin', status: 'active' };
        } else {
          // Not an org member and not super admin - use member role
          memberData = { role: 'member', status: 'active' };
        }
      }
      
      // Cache organization role for DashboardHeader access
      if (memberData && memberData.role) {
        sessionStorage.setItem('cached_org_role', memberData.role);
        sessionStorage.setItem('cached_org_role_timestamp', Date.now().toString());
      }

      // Success - show welcome toast with role
      const roleDisplay = formatRoleName(memberData?.role || (isSuperAdmin ? 'super_admin' : 'admin'));
      toast({
        title: 'Login Successful',
        description: `Role: ${roleDisplay}`,
      });

      // PHASE 3 & 6: Determine target path based on role with proper branch context
      let targetPath: string;

      if (isSuperAdmin || memberData.role === 'owner' || memberData.role === 'admin') {
        targetPath = `/${tenantSlug}/dashboard`;
        console.log('[TenantLogin] Admin role detected, redirecting to:', targetPath);
      } else if (memberData.role === 'branch_admin') {
        // PHASE 6: Fetch branch information for branch admins
        console.log('[TenantLogin] Branch admin detected, fetching branch data');
        const { data: adminBranches } = await supabase
          .from('admin_branches')
          .select('branch_id, branches!inner(name)')
          .eq('admin_id', authData.user.id)
          .limit(1)
          .single();
        
        if (adminBranches) {
          const branchId = adminBranches.branch_id;
          const branchName = adminBranches.branches.name;
          localStorage.setItem('currentBranchId', branchId);
          localStorage.setItem('currentBranchName', branchName);
          targetPath = `/${tenantSlug}/branch-dashboard/${branchId}/${encodeURIComponent(branchName)}`;
          console.log('[TenantLogin] Branch admin redirecting to:', targetPath);
        } else {
          // Fallback to branches list if no branch found
          targetPath = `/${tenantSlug}/branches`;
          console.log('[TenantLogin] No branch found, redirecting to branches list');
        }
      } else {
        // Regular member - go to tenant dashboard
        targetPath = `/${tenantSlug}/dashboard`;
        console.log('[TenantLogin] Regular member, redirecting to:', targetPath);
      }

      // PHASE 1 & 3: Set navigation flags and navigate
      sessionStorage.setItem('navigating_to_dashboard', 'true');
      sessionStorage.setItem('target_dashboard', targetPath);
      console.log('[TenantLogin] Navigation flags set, navigating to:', targetPath);
      
      navigate(targetPath, { replace: true });
    } catch (error: any) {
      console.error('[TenantLogin] Login error:', error);
      sessionStorage.removeItem('redirect_in_progress');
      toast({
        title: 'Login Failed',
        description: error.message || 'Invalid email or password.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  if (isLoading) {
    return <LoadingScreen />;
  }

  if (!organization) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Organisation Not Found</h1>
          <p className="text-gray-600 mb-4">
            The organisation "{tenantSlug}" could not be found.
          </p>
          <a href="/" className="text-blue-600 hover:text-blue-800 underline">
            Return to Home
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="login-page-light min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        <Card className="border-0 shadow-xl bg-white/95 backdrop-blur-sm">
          <CardHeader className="space-y-4 text-center">
            <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
              {organization.logo_url ? (
                <img 
                  src={organization.logo_url} 
                  alt={`${organization.name} logo`}
                  className="w-10 h-10 object-contain"
                />
              ) : (
                <Building2 className="w-8 h-8 text-primary" />
              )}
            </div>
            <div>
              <CardTitle className="text-2xl font-bold text-gray-900">
                {organization.name}
              </CardTitle>
              <CardDescription className="text-gray-600 mt-2">
                Sign in to access your organisation
              </CardDescription>
            </div>
          </CardHeader>
          
          <CardContent>
            {organization && organization.subscription_status !== 'active' && (
              <div className="mb-4 p-3 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-lg flex items-start gap-2">
                <AlertTriangle className="h-5 w-5 text-amber-600 mt-0.5 flex-shrink-0" />
                <div className="text-sm">
                  <p className="font-medium text-amber-800 dark:text-amber-200">
                    Organisation {organization.subscription_status === 'inactive' ? 'Inactive' : 'Suspended'}
                  </p>
                  <p className="text-amber-700 dark:text-amber-300">
                    Login is currently disabled. Please contact your administrator.
                  </p>
                </div>
              </div>
            )}
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-medium text-gray-700">
                  Email Address
                </Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    placeholder="Enter your email"
                    className="pl-10"
                    required
                    disabled={isSubmitting}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-sm font-medium text-gray-700">
                  Password
                </Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    value={formData.password}
                    onChange={(e) => handleInputChange('password', e.target.value)}
                    placeholder="Enter your password"
                    className="pl-10 pr-10"
                    required
                    disabled={isSubmitting}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    disabled={isSubmitting}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <CustomButton
                type="submit"
                className="w-full"
                disabled={isSubmitting || !formData.email || !formData.password}
              >
                {isSubmitting ? 'Signing In...' : 'Sign In'}
              </CustomButton>
            </form>

            <div className="mt-6 text-center">
              <p className="text-sm text-gray-600">
                Need help accessing your account?{' '}
                <a 
                  href="mailto:support@example.com" 
                  className="text-primary hover:text-primary/80 font-medium"
                >
                  Contact Support
                </a>
              </p>
            </div>
            
            <div className="mt-4 text-center">
              <a 
                href="/" 
                className="text-sm text-gray-500 hover:text-gray-700"
              >
                ← Back to main site
              </a>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
};

export default TenantLogin;
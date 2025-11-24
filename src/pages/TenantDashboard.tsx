import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  Building2, 
  Users, 
  Settings, 
  BarChart3, 
  Shield, 
  LogOut,
  Calendar,
  FileText,
  Bell
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { CustomButton } from '@/components/ui/CustomButton';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useUserRole } from '@/hooks/useUserRole';
import { DashboardHeader } from "@/components/DashboardHeader";
import { DashboardNavbar } from "@/components/DashboardNavbar";
import { OrganizationAdminsTable } from "@/components/OrganizationAdminsTable";
import { TenantBranchNavigation } from "@/components/dashboard/TenantBranchNavigation";
import { normalizeToHslVar } from '@/lib/colors';

interface Organization {
  id: string;
  name: string;
  slug: string;
  logo_url?: string;
  primary_color?: string;
  secondary_color?: string;
  subscription_plan: string;
  subscription_status: string;
}

interface UserRole {
  role: string;
  status: string;
}

const TenantDashboard = () => {
  const { tenantSlug } = useParams<{ tenantSlug: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, signOut } = useAuth();
  const { data: systemUserRole, isLoading: isRoleLoading } = useUserRole();
  
  const [organization, setOrganization] = useState<Organization | null>(null);
  const [userRole, setUserRole] = useState<UserRole | null>(null);
  const [loading, setLoading] = useState(true);

  // PHASE 1: Clear navigation intent flags AFTER dashboard is fully loaded
  useEffect(() => {
    // Delay clearing to ensure navigation is complete
    const timer = setTimeout(() => {
      console.log('[TenantDashboard] Clearing navigation flags after successful load');
      sessionStorage.removeItem('navigating_to_dashboard');
      sessionStorage.removeItem('target_dashboard');
      sessionStorage.removeItem('redirect_in_progress');
    }, 1000);

    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    const loadCachedDataIfAvailable = () => {
      // Check if we have recently cached data (within last 10 seconds)
      const cachedOrgData = sessionStorage.getItem('cached_org_data');
      const cachedTimestamp = sessionStorage.getItem('cached_org_timestamp');
      const cachedUserRole = sessionStorage.getItem('cached_user_role');
      
      if (cachedOrgData && cachedTimestamp && cachedUserRole) {
        const age = Date.now() - parseInt(cachedTimestamp);
        
        // Use cached data if it's less than 10 seconds old (fresh from login)
        if (age < 10000) {
          console.log('[TenantDashboard] Using cached organization data from login');
          
          try {
            const orgData = JSON.parse(cachedOrgData);
            const roleData = JSON.parse(cachedUserRole);
            
            setOrganization(orgData);
            setUserRole(roleData);
            setLoading(false);
            
            // Apply branding immediately
            try {
              if (orgData.primary_color) {
                const primaryHsl = normalizeToHslVar(orgData.primary_color);
                document.documentElement.style.setProperty('--primary', primaryHsl);
              }
              if (orgData.secondary_color) {
                const secondaryHsl = normalizeToHslVar(orgData.secondary_color);
                document.documentElement.style.setProperty('--secondary', secondaryHsl);
              }
            } catch (colorError) {
              console.error('Error applying organization colors:', colorError);
              document.documentElement.style.setProperty('--primary', '222.2 84% 4.9%');
              document.documentElement.style.setProperty('--secondary', '210 40% 96%');
            }
            
            document.title = `${orgData.name} - Dashboard`;
            
            // Clear cached data after use
            sessionStorage.removeItem('cached_org_data');
            sessionStorage.removeItem('cached_org_timestamp');
            sessionStorage.removeItem('cached_user_role');
            
            return true; // Cached data was used
          } catch (error) {
            console.error('[TenantDashboard] Error parsing cached data:', error);
          }
        } else {
          console.log('[TenantDashboard] Cached data too old, fetching fresh data');
          // Clear old cache
          sessionStorage.removeItem('cached_org_data');
          sessionStorage.removeItem('cached_org_timestamp');
          sessionStorage.removeItem('cached_user_role');
        }
      }
      
      return false; // No cached data available
    };

    const fetchTenantData = async () => {
      if (!user || !tenantSlug) {
        navigate('/');
        return;
      }

      try {
        // Fetch organization
        const { data: orgData, error: orgError } = await supabase
          .from('organizations')
          .select('*')
          .eq('slug', tenantSlug)
          .single();

        if (orgError || !orgData) {
          toast({
            title: 'Organization Not Found',
            description: 'The organization doesn\'t exist.',
            variant: 'destructive',
          });
          navigate('/');
          return;
        }

        // Verify user access - prioritize RPC for Super Admin verification
        let hasSystemAccess = false;
        let isSuperAdminForOrg = false;

        // FIRST: Try authoritative Super Admin verification via RPC (security definer, bypasses RLS)
        try {
          const { data: superAdminOrg, error: superAdminOrgError } = await supabase
            .rpc('get_super_admin_org', { p_user_id: user.id })
            .maybeSingle();

          if (!superAdminOrgError && superAdminOrg?.slug === orgData.slug) {
            hasSystemAccess = true;
            isSuperAdminForOrg = true;
            console.log('[TenantDashboard] Super admin access confirmed via get_super_admin_org RPC');
          } else {
            console.log('[TenantDashboard] Super admin RPC result:', { superAdminOrg, superAdminOrgError });
          }
        } catch (rpcError) {
          console.warn('[TenantDashboard] get_super_admin_org RPC failed:', rpcError);
        }

        // SECOND: Check organization membership (use maybeSingle to handle missing rows gracefully)
        const { data: memberData, error: memberError } = await supabase
          .from('organization_members')
          .select('role, status')
          .eq('organization_id', orgData.id)
          .eq('user_id', user.id)
          .eq('status', 'active')
          .maybeSingle();

        const hasOrgAccess = !!memberData && !memberError;

        // THIRD: Fallback to system_user_organizations check if RPC didn't confirm Super Admin
        if (!hasSystemAccess) {
          const { data: systemUserData } = await supabase
            .from('system_users')
            .select('id')
            .eq('auth_user_id', user.id)
            .maybeSingle();

          if (systemUserData?.id) {
            const { data: systemOrgAssignment } = await supabase
              .from('system_user_organizations')
              .select('role')
              .eq('system_user_id', systemUserData.id)
              .eq('organization_id', orgData.id)
              .maybeSingle();

            if (systemOrgAssignment?.role === 'super_admin') {
              hasSystemAccess = true;
              isSuperAdminForOrg = true;
              console.log('[TenantDashboard] Super admin access confirmed via system_user_organizations fallback');
            }
          }
        }

        console.log('[TenantDashboard] Permission check:', {
          userId: user.id,
          email: user.email,
          organizationId: orgData.id,
          organizationSlug: orgData.slug,
          hasSystemAccess,
          hasOrgAccess,
          isSuperAdminForOrg,
          memberRole: memberData?.role
        });

        // Access denied only if user has NEITHER system access NOR org membership
        if (!hasSystemAccess && !hasOrgAccess) {
          console.warn('[TenantDashboard] Access denied after checks', {
            hasSystemAccess,
            hasOrgAccess,
            isSuperAdminForOrg
          });
          toast({
            title: 'Access Denied',
            description: 'You don\'t have permission to access this organization.',
            variant: 'destructive',
          });
          await signOut();
          navigate('/');
          return;
        }

        setOrganization(orgData);
        
        // Set user role with CORRECTED priority - system roles take precedence
        if (systemUserRole?.role === 'branch_admin') {
          // Branch admins always get restricted view, even if they have org membership
          setUserRole({ role: 'branch_admin', status: 'active' });
          console.log('[TenantDashboard] User is a branch_admin, using restricted view');
        } else if (memberData) {
          // Regular organization members use their org role
          setUserRole(memberData);
        } else if (isSuperAdminForOrg || hasSystemAccess) {
          // Super admins without org membership
          setUserRole({ role: 'super_admin', status: 'active' });
        } else {
          // Fallback for edge cases
          setUserRole({ role: 'member', status: 'active' });
        }
        
        // Apply branding
        try {
          if (orgData.primary_color) {
            const primaryHsl = normalizeToHslVar(orgData.primary_color);
            document.documentElement.style.setProperty('--primary', primaryHsl);
          }
          if (orgData.secondary_color) {
            const secondaryHsl = normalizeToHslVar(orgData.secondary_color);
            document.documentElement.style.setProperty('--secondary', secondaryHsl);
          }
        } catch (error) {
          console.error('Error applying organization colors:', error);
          // Fallback to default colors if normalization fails
          document.documentElement.style.setProperty('--primary', '222.2 84% 4.9%');
          document.documentElement.style.setProperty('--secondary', '210 40% 96%');
        }
        
        document.title = `${orgData.name} - Dashboard`;
      } catch (error) {
        console.error('Error fetching tenant data:', error);
        toast({
          title: 'Error',
          description: 'Failed to load organization data.',
          variant: 'destructive',
        });
        navigate('/');
      } finally {
        setLoading(false);
      }
    };

    // Try to use cached data first, otherwise fetch
    const usedCache = loadCachedDataIfAvailable();
    if (!usedCache) {
      fetchTenantData();
    }
  }, [user, tenantSlug, navigate, toast, signOut, systemUserRole]);

  const handleSignOut = async () => {
    try {
      await signOut();
      toast({
        title: 'Signed Out',
        description: 'You have been successfully signed out.',
      });
      navigate('/');
    } catch (error) {
      console.error('Sign out error:', error);
      toast({
        title: 'Error',
        description: 'Failed to sign out.',
        variant: 'destructive',
      });
    }
  };

  if (loading || isRoleLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="animate-pulse">
          <div className="w-8 h-8 bg-blue-600 rounded-full"></div>
        </div>
      </div>
    );
  }

  if (!organization || !userRole) {
    return null;
  }

  // Split role checks for granular permission control
  // Use systemUserRole for system-level roles like branch_admin
  const isSuperAdmin = 
    (systemUserRole?.role === 'super_admin') || 
    (userRole?.role === 'super_admin');
  
  const isBranchAdmin = systemUserRole?.role === 'branch_admin'; // Check system role first
  
  const isOrganizationAdmin = 
    userRole && 
    (userRole.role === 'owner' || userRole.role === 'admin') &&
    !isBranchAdmin; // Exclude branch admins from org admin view
  
  // Debug logging for role resolution
  console.log('[TenantDashboard] Role resolution:', {
    systemUserRole: systemUserRole?.role,
    orgMemberRole: userRole?.role,
    isBranchAdmin,
    isOrganizationAdmin,
    isSuperAdmin
  });

  // Branch Admin View - LIMITED to assigned branches ONLY
  if (isBranchAdmin) {
    return (
      <div className="min-h-screen flex flex-col bg-gradient-to-br from-gray-50 to-white">
        <DashboardHeader />
        {/* NO DashboardNavbar for Branch Admins */}
        
        <motion.main 
          className="flex-1 px-4 md:px-8 py-6 md:py-8 w-full"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
        >
          <div className="flex justify-between items-center mb-6 md:mb-8">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-gray-800 tracking-tight">
                Organisation Branches
              </h1>
              <p className="text-gray-500 mt-2 font-medium">
                Access your assigned branches below.
              </p>
            </div>
          </div>

          {/* ONLY show branch navigation - automatically filtered to assigned branches */}
          <TenantBranchNavigation organizationId={organization.id} />
          
          {/* NO OrganizationAdminsTable */}
          {/* NO Organization Management heading */}
        </motion.main>
      </div>
    );
  }

  // Super Admin View - FULL organization management access
  if (isSuperAdmin || isOrganizationAdmin) {
    return (
      <div className="min-h-screen flex flex-col bg-gradient-to-br from-gray-50 to-white">
        <DashboardHeader />
        <DashboardNavbar />
        
        <motion.main 
          className="flex-1 px-4 md:px-8 py-6 md:py-8 w-full"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
        >
          {/* Organization Branch Navigation */}
          <TenantBranchNavigation organizationId={organization.id} />
          
          <div className="flex justify-between items-center mb-6 md:mb-8">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-gray-800 tracking-tight">
                {organization.name} - Organisation Management
              </h1>
              <p className="text-gray-500 mt-2 font-medium">
                Manage and monitor all {organization.name} administrators and branches.
              </p>
            </div>
          </div>

          <OrganizationAdminsTable organizationId={organization.id} />
        </motion.main>
      </div>
    );
  }

  // Regular tenant dashboard for non-admin users
  const quickActions = [
    {
      title: 'User Management',
      description: 'Manage organization users and permissions',
      icon: Users,
      href: `/${tenantSlug}/users`,
      color: 'bg-blue-500',
    },
    {
      title: 'Analytics',
      description: 'View organization performance metrics',
      icon: BarChart3,
      href: `/${tenantSlug}/analytics`,
      color: 'bg-green-500',
    },
    {
      title: 'Calendar',
      description: 'Manage schedules and appointments',
      icon: Calendar,
      href: `/${tenantSlug}/calendar`,
      color: 'bg-purple-500',
    },
    {
      title: 'Reports',
      description: 'Generate and view reports',
      icon: FileText,
      href: `/${tenantSlug}/reports`,
      color: 'bg-orange-500',
    },
    {
      title: 'Settings',
      description: 'Configure organization settings',
      icon: Settings,
      href: `/${tenantSlug}/settings`,
      color: 'bg-gray-500',
    },
    {
      title: 'Security',
      description: 'Manage security and compliance',
      icon: Shield,
      href: `/${tenantSlug}/security`,
      color: 'bg-red-500',
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                {organization.logo_url ? (
                  <img 
                    src={organization.logo_url} 
                    alt={`${organization.name} logo`}
                    className="w-6 h-6 object-contain"
                  />
                ) : (
                  <Building2 className="w-6 h-6 text-primary" />
                )}
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">{organization.name}</h1>
                <p className="text-sm text-gray-500 capitalize">{userRole.role.replace('_', ' ')}</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <Bell className="w-5 h-5 text-gray-400" />
                <span className="text-sm text-gray-600">Welcome, {user?.email}</span>
              </div>
              <CustomButton 
                variant="outline" 
                size="sm"
                onClick={handleSignOut}
                className="flex items-center space-x-2"
              >
                <LogOut className="w-4 h-4" />
                <span>Sign Out</span>
              </CustomButton>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          {/* Welcome Section */}
          <div className="mb-8">
            <h2 className="text-3xl font-bold text-gray-900 mb-2">
              Welcome to {organization.name}
            </h2>
            <p className="text-gray-600">
              Manage your organization efficiently with our comprehensive dashboard.
            </p>
          </div>

          {/* Organization Info */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Subscription Plan</CardTitle>
                <Shield className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold capitalize">{organization.subscription_plan}</div>
                <p className="text-xs text-muted-foreground">
                  Status: <span className="capitalize">{organization.subscription_status}</span>
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Your Role</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold capitalize">{userRole.role.replace('_', ' ')}</div>
                <p className="text-xs text-muted-foreground">
                  Status: Active
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Organisation ID</CardTitle>
                <Building2 className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-sm font-mono">{organization.id.slice(0, 8)}...</div>
                <p className="text-xs text-muted-foreground">
                  Slug: /{organization.slug}
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Quick Actions */}
          <div>
            <h3 className="text-xl font-semibold text-gray-900 mb-4">Quick Actions</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {quickActions.map((action, index) => (
                <motion.div
                  key={action.title}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                >
                  <Card className="hover:shadow-lg transition-shadow cursor-pointer"
                        onClick={() => navigate(action.href)}>
                    <CardHeader className="flex flex-row items-center space-y-0 pb-2">
                      <div className={`w-10 h-10 ${action.color} rounded-lg flex items-center justify-center mr-4`}>
                        <action.icon className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <CardTitle className="text-base">{action.title}</CardTitle>
                        <CardDescription className="text-sm">
                          {action.description}
                        </CardDescription>
                      </div>
                    </CardHeader>
                  </Card>
                </motion.div>
              ))}
            </div>
          </div>
        </motion.div>
      </main>
    </div>
  );
};

export default TenantDashboard;
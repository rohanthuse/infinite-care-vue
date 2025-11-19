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
import { SubscriptionDetailsCard } from "@/components/organization/SubscriptionDetailsCard";
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

  useEffect(() => {
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
      const cachedOrgData = sessionStorage.getItem('cached_org_data');
      const cachedTimestamp = sessionStorage.getItem('cached_org_timestamp');
      const cachedUserRole = sessionStorage.getItem('cached_user_role');
      
      if (cachedOrgData && cachedTimestamp && cachedUserRole) {
        const age = Date.now() - parseInt(cachedTimestamp);
        
        if (age < 10000) {
          console.log('[TenantDashboard] Using cached organization data from login');
          
          try {
            const orgData = JSON.parse(cachedOrgData);
            const roleData = JSON.parse(cachedUserRole);
            
            setOrganization(orgData);
            setUserRole(roleData);
            setLoading(false);
            
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
            
            return true;
          } catch (error) {
            console.error('[TenantDashboard] Error parsing cached data:', error);
          }
        }
      }
      
      return false;
    };

    const fetchOrganizationAndRole = async () => {
      if (!user || !tenantSlug) {
        console.error('[TenantDashboard] Missing user or tenantSlug');
        return;
      }

      const usedCache = loadCachedDataIfAvailable();
      if (usedCache) {
        console.log('[TenantDashboard] Successfully used cached data');
        return;
      }

      console.log('[TenantDashboard] No valid cache, fetching fresh data...');
      
      try {
        const { data: orgsData, error: orgsError } = await supabase
          .from('organization_members')
          .select(`
            role,
            organization:organizations(
              id,
              name,
              slug,
              logo_url,
              primary_color,
              secondary_color,
              subscription_plan,
              subscription_status
            )
          `)
          .eq('user_id', user.id);

        if (orgsError) {
          console.error('[TenantDashboard] Error fetching organizations:', orgsError);
          throw orgsError;
        }

        const orgMembership = orgsData?.find(
          (membership: any) => membership.organization?.slug === tenantSlug
        );

        if (!orgMembership || !orgMembership.organization) {
          throw new Error('Organization not found or user is not a member');
        }

        const org = orgMembership.organization as Organization;
        const role = { role: orgMembership.role, status: 'active' };

        setOrganization(org);
        setUserRole(role);

        try {
          if (org.primary_color) {
            const primaryHsl = normalizeToHslVar(org.primary_color);
            document.documentElement.style.setProperty('--primary', primaryHsl);
          }
          if (org.secondary_color) {
            const secondaryHsl = normalizeToHslVar(org.secondary_color);
            document.documentElement.style.setProperty('--secondary', secondaryHsl);
          }
        } catch (colorError) {
          console.error('Error applying organization colors:', colorError);
          document.documentElement.style.setProperty('--primary', '222.2 84% 4.9%');
          document.documentElement.style.setProperty('--secondary', '210 40% 96%');
        }

        setLoading(false);
      } catch (error: any) {
        console.error('[TenantDashboard] Error fetching organization:', error);
        toast({
          title: 'Error',
          description: error.message || 'Failed to load organization',
          variant: 'destructive',
        });
        setLoading(false);
        navigate('/');
      }
    };

    fetchOrganizationAndRole();
  }, [user, tenantSlug, navigate, toast]);

  const handleSignOut = async () => {
    try {
      await signOut();
      sessionStorage.clear();
      navigate('/login');
    } catch (error) {
      console.error('Error signing out:', error);
      toast({
        title: 'Error',
        description: 'Failed to sign out',
        variant: 'destructive',
      });
    }
  };

  if (loading || !organization || !userRole) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  const quickActions = [
    {
      title: 'Dashboard',
      description: 'View overview and analytics',
      icon: BarChart3,
      href: `/${tenantSlug}/dashboard`,
      color: 'bg-blue-500',
    },
    {
      title: 'Branch Management',
      description: 'Manage branches and locations',
      icon: Building2,
      href: `/${tenantSlug}/branches`,
      color: 'bg-green-500',
    },
    {
      title: 'User Management',
      description: 'Manage team members',
      icon: Users,
      href: `/${tenantSlug}/users`,
      color: 'bg-purple-500',
    },
    {
      title: 'Calendar',
      description: 'View and manage events',
      icon: Calendar,
      href: `/${tenantSlug}/calendar`,
      color: 'bg-yellow-500',
    },
    {
      title: 'Reports',
      description: 'Generate and view reports',
      icon: FileText,
      href: `/${tenantSlug}/reports`,
      color: 'bg-indigo-500',
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

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="mb-8">
            <h2 className="text-3xl font-bold text-gray-900 mb-2">
              Welcome to {organization.name}
            </h2>
            <p className="text-gray-600">
              Manage your organization efficiently with our comprehensive dashboard.
            </p>
          </div>

          {/* Conditional layout based on role */}
          {systemUserRole?.role === 'super_admin' ? (
            /* Super Admin Layout - Simple 3-column without subscription card */
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Your Role</CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold capitalize">{userRole.role.replace('_', ' ')}</div>
                  <p className="text-xs text-muted-foreground">Status: Active</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Organization</CardTitle>
                  <Building2 className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{organization.name}</div>
                  <p className="text-xs text-muted-foreground">Slug: /{organization.slug}</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Subscription Plan</CardTitle>
                  <Shield className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{organization.subscription_plan}</div>
                  <p className="text-xs text-muted-foreground">Status: {organization.subscription_status}</p>
                </CardContent>
              </Card>
            </div>
          ) : (
            /* Regular User Layout - 2-column with subscription card */
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
              <SubscriptionDetailsCard organizationId={organization.id} />

              <div className="space-y-6">
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
                    <CardTitle className="text-sm font-medium">Organization ID</CardTitle>
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
            </div>
          )}

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
                  <Card 
                    className="hover:shadow-lg transition-shadow cursor-pointer"
                    onClick={() => navigate(action.href)}
                  >
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

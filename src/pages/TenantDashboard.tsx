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
  const { data: systemUserRole } = useUserRole();
  
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

        // Verify user access - check both organization membership and system role
        const { data: memberData, error: memberError } = await supabase
          .from('organization_members')
          .select('role, status')
          .eq('organization_id', orgData.id)
          .eq('user_id', user.id)
          .eq('status', 'active')
          .single();

        // Allow access if user is a super_admin (system role) or has organization membership
        const hasSystemAccess = systemUserRole?.role === 'super_admin';
        const hasOrgAccess = memberData && !memberError;

        if (!hasSystemAccess && !hasOrgAccess) {
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
        // Prioritize super_admin system role over organization membership role
        if (systemUserRole?.role === 'super_admin') {
          setUserRole({ role: 'super_admin', status: 'active' });
        } else {
          // Use organization role if available, otherwise use system role
          setUserRole(memberData || { role: systemUserRole?.role || 'member', status: 'active' });
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

    fetchTenantData();
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

  if (loading) {
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

  // Check if user has admin role (owner/admin/super_admin) to show old-style dashboard
  const isOrganizationAdmin = userRole && (userRole.role === 'owner' || userRole.role === 'admin' || userRole.role === 'super_admin');

  // If user is organization admin, show the old Dashboard style interface
  if (isOrganizationAdmin) {
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
                {organization.name} - Organization Management
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
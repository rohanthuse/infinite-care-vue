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
  const [shouldRedirect, setShouldRedirect] = useState(false);

  // Clear navigation intent flags once we've reached the dashboard
  useEffect(() => {
    sessionStorage.removeItem('navigating_to_dashboard');
    sessionStorage.removeItem('target_dashboard');
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
  }, [user, tenantSlug, navigate, toast, signOut]);

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

  // Check if user should be redirected based on their role
  useEffect(() => {
    const checkRoleAndRedirect = async () => {
      if (!userRole || !user || !organization || !tenantSlug) return;

      // Define which roles can access the organization management dashboard
      const isOrganizationManager = 
        userRole.role === 'owner' || 
        userRole.role === 'admin' || 
        userRole.role === 'super_admin';

      // If user is an organization manager, don't redirect
      if (isOrganizationManager) {
        setShouldRedirect(false);
        return;
      }

      // User is not an organization manager, check for appropriate redirect
      console.log('[TenantDashboard] User is not an organization manager, checking role:', userRole.role);
      setShouldRedirect(true);

      // Handle redirects based on role
      if (userRole.role === 'branch_admin') {
        // Check if user is a branch admin and find their branch
        try {
          const { data: branchAdminData } = await supabase
            .from('admin_branches')
            .select('branch_id')
            .eq('admin_id', user.id)
            .limit(1)
            .maybeSingle();
          
          if (branchAdminData?.branch_id) {
            // Fetch branch name separately
            const { data: branchData } = await supabase
              .from('branches')
              .select('name')
              .eq('id', branchAdminData.branch_id)
              .single();
            
            const encodedBranchName = encodeURIComponent(branchData?.name || 'branch');
            navigate(`/${tenantSlug}/branch-dashboard/${branchAdminData.branch_id}/${encodedBranchName}`, { replace: true });
            return;
          }
        } catch (error) {
          console.error('Error checking branch admin:', error);
        }
      }

      // For member role or any other role without proper access
      toast({
        title: 'Access Denied',
        description: 'You don\'t have permission to access this dashboard. Please contact your administrator.',
        variant: 'destructive',
      });
      await signOut();
      navigate('/', { replace: true });
    };

    checkRoleAndRedirect();
  }, [userRole, user, organization, tenantSlug, navigate, toast, signOut]);

  // Show loading while checking and redirecting
  if (shouldRedirect) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="animate-pulse">
          <div className="w-8 h-8 bg-blue-600 rounded-full"></div>
        </div>
      </div>
    );
  }

  // For organization managers (owner/admin/super_admin), show the proper dashboard
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
};

export default TenantDashboard;
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useSystemAuth } from '@/contexts/SystemAuthContext';
import { DashboardHeader } from '@/components/DashboardHeader';
import { SystemInfoHeader } from '@/components/system/SystemInfoHeader';
import { SystemDashboardStats } from '@/components/system/SystemDashboardStats';
import { ModernSystemCard } from '@/components/system/ModernSystemCard';
import { Button } from '@/components/ui/button';
import { 
  Shield, 
  Users, 
  Building, 
  BarChart3, 
  Settings,
  Globe,
  Database,
  FileText,
  Plus,
  Activity
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { TenantOrganizationsTab } from '@/components/system/dashboard/TenantOrganizationsTab';
import { SystemUsersTab } from '@/components/system/dashboard/SystemUsersTab';
import { ReportsTab } from '@/components/system/dashboard/ReportsTab';


export default function SystemDashboard() {
  const { user, hasRole } = useSystemAuth();
  const navigate = useNavigate();

  // Debug logging
  React.useEffect(() => {
    console.log('[SystemDashboard] Component mounted');
    console.log('[SystemDashboard] User:', user);
    console.log('[SystemDashboard] Current path:', window.location.pathname);
  }, [user]);

  if (!user) {
    console.log('[SystemDashboard] No user found, redirecting to login');
    navigate('/system-login', { replace: true });
    return null;
  }

  const dashboardItems = [
    {
      title: 'Tenant Organizations',
      description: 'Manage tenant organizations and their settings',
      icon: Building,
      href: '/system-dashboard/tenants',
      roles: ['super_admin', 'tenant_manager'],
      stats: '12 Active Tenants'
    },
    {
      title: 'System Users',
      description: 'Manage system administrators and their roles',
      icon: Users,
      href: '/system-dashboard/users',
      roles: ['super_admin'],
      stats: '5 System Users'
    },
    {
      title: 'Platform Analytics',
      description: 'View platform-wide analytics and performance metrics',
      icon: BarChart3,
      href: '/system-dashboard/analytics',
      roles: ['super_admin', 'analytics_viewer'],
      stats: '99.9% Uptime'
    },
    {
      title: 'Global Settings',
      description: 'Configure platform-wide settings and features',
      icon: Settings,
      href: '/system-dashboard/settings',
      roles: ['super_admin'],
      stats: 'System Health: Good'
    },
    {
      title: 'Audit Logs',
      description: 'Review system activities and security events',
      icon: FileText,
      href: '/system-dashboard/audit',
      roles: ['super_admin', 'support_admin'],
      stats: '1,234 Events Today'
    },
    {
      title: 'Database Management',
      description: 'Monitor database performance and usage',
      icon: Database,
      href: '/system-dashboard/database',
      roles: ['super_admin'],
      stats: '85% Capacity'
    }
  ];

  const accessibleItems = dashboardItems.filter(item => 
    user?.roles && item.roles.some(role => hasRole(role))
  );

  // Mock system statistics - in real app, this would come from API
  const systemStats = {
    totalTenants: 12,
    totalUsers: 5,
    systemUptime: "99.9%",
    databaseHealth: "Excellent",
    activeConnections: 47,
    securityScore: "A+"
  };

  // Mock system info - in real app, this would come from API
  const systemInfo = {
    status: "Operational",
    version: "2.1.4",
    uptime: "15 days, 6 hours",
    serverLocation: "EU-West-1",
    lastUpdate: "2 hours ago"
  };

  const handleStatClick = (statType: string) => {
    switch (statType) {
      case 'tenants':
        navigate('/system-dashboard/tenants');
        break;
      case 'users':
        navigate('/system-dashboard/users');
        break;
      case 'uptime':
      case 'database':
      case 'connections':
      case 'security':
        navigate('/system-dashboard/analytics');
        break;
      default:
        break;
    }
  };

  const handleQuickAction = () => {
    navigate('/system-dashboard/analytics');
  };

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-background to-muted/30">
      <DashboardHeader />
      
      <main className="flex-1 px-4 md:px-8 pt-4 pb-20 md:py-6 w-full">
        <SystemInfoHeader 
          systemInfo={systemInfo}
          onQuickAction={handleQuickAction}
        />

        <Tabs defaultValue="dashboard" className="w-full">
          <TabsList className="w-full grid grid-cols-2 md:grid-cols-4 mb-6">
            <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
            <TabsTrigger value="tenants">Tenant Organizations</TabsTrigger>
            <TabsTrigger value="users">System Users</TabsTrigger>
            <TabsTrigger value="reports">Reports</TabsTrigger>
          </TabsList>

          <TabsContent value="dashboard">
            {/* Welcome Section */}
            <div className="mb-8">
              <h2 className="text-3xl font-bold text-foreground mb-2">
                Welcome back, {user.name}
              </h2>
              <p className="text-muted-foreground">
                Manage the platform, monitor performance, and configure system settings.
              </p>
              
              {/* User Roles */}
              <div className="mt-4 p-4 bg-card border border-border rounded-lg">
                <h3 className="text-sm font-medium text-foreground mb-2">Your Roles:</h3>
                <div className="flex flex-wrap gap-2">
                  {user?.roles && user.roles.length > 0 ? (
                    user.roles.map((role) => (
                      <span
                        key={role}
                        className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary border border-primary/20"
                      >
                        {role.replace('_', ' ').toUpperCase()}
                      </span>
                    ))
                  ) : (
                    <span className="text-sm text-muted-foreground">No roles assigned</span>
                  )}
                </div>
              </div>
            </div>

            {/* System Statistics */}
            <SystemDashboardStats 
              stats={systemStats}
              onStatClick={handleStatClick}
            />

            {/* Dashboard Grid */}
            <div className="mb-8">
              <h3 className="text-xl font-semibold text-foreground mb-6">System Management</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {accessibleItems.map((item) => (
                  <ModernSystemCard
                    key={item.title}
                    title={item.title}
                    description={item.description}
                    icon={item.icon}
                    stats={item.stats}
                    onClick={() => navigate(item.href)}
                  />
                ))}
              </div>
            </div>

            {/* Quick Actions */}
            <div className="mt-12">
              <h3 className="text-xl font-semibold text-foreground mb-6">Quick Actions</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {user?.roles && hasRole('super_admin') && (
                  <>
                    <Button
                      variant="outline"
                      className="h-auto p-6 flex flex-col items-center space-y-3 hover:shadow-md transition-shadow"
                      onClick={() => navigate('/system-dashboard/tenants/new')}
                    >
                      <div className="p-2 bg-primary/10 rounded-lg">
                        <Building className="h-6 w-6 text-primary" />
                      </div>
                      <span className="font-medium">Create Tenant</span>
                    </Button>
                    
                    <Button
                      variant="outline"
                      className="h-auto p-6 flex flex-col items-center space-y-3 hover:shadow-md transition-shadow"
                      onClick={() => navigate('/system-dashboard/users/new')}
                    >
                      <div className="p-2 bg-primary/10 rounded-lg">
                        <Users className="h-6 w-6 text-primary" />
                      </div>
                      <span className="font-medium">Add System User</span>
                    </Button>
                  </>
                )}
                
                <Button
                  variant="outline"
                  className="h-auto p-6 flex flex-col items-center space-y-3 hover:shadow-md transition-shadow"
                  onClick={() => navigate('/system-dashboard/analytics')}
                >
                  <div className="p-2 bg-primary/10 rounded-lg">
                    <BarChart3 className="h-6 w-6 text-primary" />
                  </div>
                  <span className="font-medium">View Analytics</span>
                </Button>
                
                <Button
                  variant="outline"
                  className="h-auto p-6 flex flex-col items-center space-y-3 hover:shadow-md transition-shadow"
                  onClick={() => navigate('/system-dashboard/audit')}
                >
                  <div className="p-2 bg-primary/10 rounded-lg">
                    <FileText className="h-6 w-6 text-primary" />
                  </div>
                  <span className="font-medium">Recent Activity</span>
                </Button>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="tenants">
            <TenantOrganizationsTab />
          </TabsContent>

          <TabsContent value="users">
            <SystemUsersTab />
          </TabsContent>

          <TabsContent value="reports">
            <ReportsTab />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
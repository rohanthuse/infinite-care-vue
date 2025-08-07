import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useSystemAuth } from '@/contexts/SystemAuthContext';
import { CustomButton } from '@/components/ui/CustomButton';
import { 
  Shield, 
  Users, 
  Building, 
  BarChart3, 
  Settings, 
  LogOut,
  Globe,
  Database,
  FileText
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';

export default function SystemDashboard() {
  const { user, signOut, hasRole } = useSystemAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    toast({
      title: "Signed Out",
      description: "You have been signed out of the system portal",
    });
    navigate('/system-login');
  };

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

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
      {/* Header */}
      <header className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm border-b border-border/50 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-primary/20 rounded-lg">
                <Shield className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-foreground">System Portal</h1>
                <p className="text-sm text-muted-foreground">Platform Administration</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="text-right">
                <p className="text-sm font-medium text-foreground">
                  {user.first_name} {user.last_name}
                </p>
                <p className="text-xs text-muted-foreground">{user.email}</p>
              </div>
              <CustomButton
                variant="outline"
                size="sm"
                onClick={handleSignOut}
                className="flex items-center space-x-2"
              >
                <LogOut className="h-4 w-4" />
                <span>Sign Out</span>
              </CustomButton>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-foreground mb-2">
            Welcome back, {user.first_name}
          </h2>
          <p className="text-muted-foreground">
            Manage the platform, monitor performance, and configure system settings.
          </p>
        </div>

        {/* User Roles */}
        <div className="mb-8 p-4 bg-card/50 border border-border/50 rounded-lg">
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

        {/* Dashboard Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {accessibleItems.map((item) => {
            const Icon = item.icon;
            return (
              <div
                key={item.title}
                className="group bg-card/50 backdrop-blur-sm border border-border/50 rounded-xl p-6 hover:shadow-lg transition-all duration-200 cursor-pointer hover:bg-card/70"
                onClick={() => navigate(item.href)}
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="p-3 bg-primary/10 rounded-lg group-hover:bg-primary/20 transition-colors">
                    <Icon className="h-6 w-6 text-primary" />
                  </div>
                  <Globe className="h-4 w-4 text-muted-foreground" />
                </div>
                
                <h3 className="text-lg font-semibold text-foreground mb-2 group-hover:text-primary transition-colors">
                  {item.title}
                </h3>
                
                <p className="text-sm text-muted-foreground mb-4">
                  {item.description}
                </p>
                
                <div className="text-xs font-medium text-primary">
                  {item.stats}
                </div>
              </div>
            );
          })}
        </div>

        {/* Quick Actions */}
        <div className="mt-12">
          <h3 className="text-xl font-semibold text-foreground mb-6">Quick Actions</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {user?.roles && hasRole('super_admin') && (
              <>
                <CustomButton
                  variant="outline"
                  className="h-auto p-4 flex flex-col items-center space-y-2"
                  onClick={() => navigate('/system-dashboard/tenants/new')}
                >
                  <Building className="h-6 w-6" />
                  <span>Create Tenant</span>
                </CustomButton>
                
                <CustomButton
                  variant="outline"
                  className="h-auto p-4 flex flex-col items-center space-y-2"
                  onClick={() => navigate('/system-dashboard/users/new')}
                >
                  <Users className="h-6 w-6" />
                  <span>Add System User</span>
                </CustomButton>
              </>
            )}
            
            <CustomButton
              variant="outline"
              className="h-auto p-4 flex flex-col items-center space-y-2"
              onClick={() => navigate('/system-dashboard/analytics')}
            >
              <BarChart3 className="h-6 w-6" />
              <span>View Analytics</span>
            </CustomButton>
            
            <CustomButton
              variant="outline"
              className="h-auto p-4 flex flex-col items-center space-y-2"
              onClick={() => navigate('/system-dashboard/audit')}
            >
              <FileText className="h-6 w-6" />
              <span>Recent Activity</span>
            </CustomButton>
          </div>
        </div>
      </main>
    </div>
  );
}
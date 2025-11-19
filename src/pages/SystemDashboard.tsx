import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useSystemAuth } from '@/contexts/SystemAuthContext';
import { DashboardHeader } from '@/components/DashboardHeader';
import { SystemInfoHeader } from '@/components/system/SystemInfoHeader';
import { SystemDashboardStats } from '@/components/system/SystemDashboardStats';
import { useDemoRequestStats } from '@/hooks/useDemoRequests';

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
  Activity,
  MessageSquare
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { useLocation } from 'react-router-dom';
import { SystemSectionTabs, SystemTabValue } from '@/components/system/SystemSectionTabs';
import { useSystemDashboard } from '@/hooks/useSystemDashboard';
import { ReportsTab } from '@/components/system/dashboard/ReportsTab';
import { DevTenantSwitcher } from '@/components/system/DevTenantSwitcher';

export default function SystemDashboard() {
  const { user, hasRole } = useSystemAuth();
  const navigate = useNavigate();

  // Control tabs via URL param to keep consistency across pages
  const location = useLocation();
  const getTabFromSearch = (): SystemTabValue => {
    const params = new URLSearchParams(location.search);
    const t = (params.get('tab') || 'dashboard') as SystemTabValue;
    return ['dashboard', 'reports', 'tenants', 'users'].includes(t) ? t : 'dashboard';
  };
  const [tab, setTab] = React.useState<SystemTabValue>(getTabFromSearch());
  React.useEffect(() => {
    setTab(getTabFromSearch());
  }, [location.search]);

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


  const { systemStats, isLoading } = useSystemDashboard();
  const { data: demoStats } = useDemoRequestStats();

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
      case 'demo_requests':
        // Navigate to the reports tab where demo requests are displayed
        navigate('/system-dashboard?tab=reports');
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
      
      <main className="w-full px-4 sm:px-6 lg:px-8 py-8">
        <SystemInfoHeader 
          systemInfo={systemInfo}
          onQuickAction={handleQuickAction}
        />

        <Tabs value={tab === 'tenants' || tab === 'users' ? 'dashboard' : tab} onValueChange={(v) => {
            if (v === 'dashboard' || v === 'reports') setTab(v as SystemTabValue);
          }} className="w-full">
          <SystemSectionTabs value={tab} />
        </Tabs>

        {/* Dashboard Content */}
        {tab === 'dashboard' && (
          <>
            {/* Welcome Section */}
            <div className="bg-card/50 backdrop-blur-sm border border-border/50 rounded-xl p-6 mb-8">
              <h2 className="text-3xl font-bold text-foreground mb-2">
                Welcome back, {user.name}
              </h2>
              <p className="text-muted-foreground">
                Manage the platform, monitor performance, and configure system settings.
              </p>
              
              {/* User Roles */}
              <div className="mt-4 p-4 bg-card/30 border border-border/30 rounded-lg">
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
              isLoading={isLoading}
              onStatClick={handleStatClick}
            />

            {/* Quick Actions */}
            <div className="bg-card/50 backdrop-blur-sm border border-border/50 rounded-xl p-6 mb-8">
              <h3 className="text-xl font-semibold text-foreground mb-6">Quick Actions</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {user?.roles && hasRole('super_admin') && (
                  <>
                    <Button
                      variant="outline"
                      className="h-auto p-6 flex flex-col items-center space-y-3 hover:shadow-md transition-shadow"
                      onClick={() => navigate('/system-dashboard/tenants?action=create')}
                    >
                      <div className="p-2 bg-primary/10 rounded-lg">
                        <Building className="h-6 w-6 text-primary" />
                      </div>
                      <span className="font-medium">Create Tenant</span>
                    </Button>
                    
                    <Button
                      variant="outline"
                      className="h-auto p-6 flex flex-col items-center space-y-3 hover:shadow-md transition-shadow"
                      onClick={() => navigate('/system-dashboard/users?action=create')}
                    >
                      <div className="p-2 bg-primary/10 rounded-lg">
                        <Users className="h-6 w-6 text-primary" />
                      </div>
                      <span className="font-medium">Add Tenant User</span>
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
                
                <Button
                  variant="outline"
                  className="h-auto p-6 flex flex-col items-center space-y-3 hover:shadow-md transition-shadow relative"
                  onClick={() => navigate('/system-dashboard?tab=reports')}
                >
                  <div className="p-2 bg-primary/10 rounded-lg">
                    <MessageSquare className="h-6 w-6 text-primary" />
                  </div>
                  <span className="font-medium">Demo Requests</span>
                  {demoStats?.pendingRequests && demoStats.pendingRequests > 0 && (
                    <span className="absolute -top-2 -right-2 bg-destructive text-destructive-foreground text-xs rounded-full h-6 w-6 flex items-center justify-center font-semibold">
                      {demoStats.pendingRequests}
                    </span>
                  )}
                </Button>
              </div>
            </div>

            {/* Development Tools (localhost only) */}
            {window.location.hostname === 'localhost' && (
              <div className="bg-card/50 backdrop-blur-sm border border-border/50 rounded-xl p-6">
                <h3 className="text-xl font-semibold text-foreground mb-6">Development Tools</h3>
                <DevTenantSwitcher />
              </div>
            )}
          </>
        )}

        {/* Reports Content */}
        {tab === 'reports' && <ReportsTab />}
      </main>
    </div>
  );
}
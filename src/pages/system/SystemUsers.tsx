import React, { useState, useEffect } from 'react';
import { Users, Activity, Clock } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useSystemUserStats } from '@/hooks/useSystemUsers';
import { AddSystemUserDialog } from '@/components/system/AddSystemUserDialog';
import { AddSystemUserDialogControlled } from '@/components/system/AddSystemUserDialogControlled';
import { SystemUsersTable } from '@/components/system/SystemUsersTable';
import { Badge } from '@/components/ui/badge';
import { SystemUsersStats } from '@/components/system/SystemUsersStats';

import { DashboardHeader } from '@/components/DashboardHeader';

import { Tabs } from '@/components/ui/tabs';
import { SystemSectionTabs } from '@/components/system/SystemSectionTabs';
import { SystemInfoHeader } from '@/components/system/SystemInfoHeader';
export default function SystemUsers() {
  const location = useLocation();
  const navigate = useNavigate();
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  
  const { data: stats, isLoading: statsLoading } = useSystemUserStats();

  // Check for action=create URL parameter and auto-open dialog
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    if (params.get('action') === 'create') {
      setIsAddDialogOpen(true);
      // Remove the action parameter from URL
      params.delete('action');
      navigate(`${location.pathname}${params.toString() ? '?' + params.toString() : ''}`, { replace: true });
    }
  }, [location.search, navigate, location.pathname]);
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
      <DashboardHeader />
      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* System Info Header */}
        <SystemInfoHeader
          systemInfo={{
            status: "Operational",
            version: "v1.0.0",
            uptime: "99.99%",
            serverLocation: "EU-West",
            lastUpdate: new Date().toLocaleString(),
          }}
          onQuickAction={() => {}}
        />
        {/* System Tabs */}
        <div className="mb-4">
          <Tabs value="users" className="w-full">
            <SystemSectionTabs value="users" />
          </Tabs>
        </div>
        {/* Info Header - matching Tenant Organizations */}
        <div className="bg-card/50 backdrop-blur-sm border border-border/50 rounded-xl p-6 mb-8">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-primary/10 rounded-lg">
                <Users className="h-8 w-8 text-primary" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-foreground">System Users</h1>
                <p className="text-muted-foreground mt-1">
                  Manage system administrators
                </p>
                <div className="flex items-center gap-4 mt-3">
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary" className="flex items-center gap-1">
                      <Activity className="h-3 w-3" />
                      {stats?.total || 0} Total Users
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      System Operational
                    </Badge>
                  </div>
                </div>
              </div>
            </div>
            {/* Right actions intentionally omitted to match Tenant Organizations header layout */}
          </div>
        </div>

        {/* Stats */}
        <SystemUsersStats stats={stats} isLoading={statsLoading} />

        {/* User List */}
        <div className="bg-card/50 backdrop-blur-sm border border-border/50 rounded-xl">
          <div className="p-6 border-b border-border/50 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h2 className="text-lg font-semibold text-foreground">System Administrator Users</h2>
              <p className="text-sm text-muted-foreground">Manage system user accounts and permissions</p>
            </div>
            <AddSystemUserDialog />
          </div>
          
          <div className="p-6">
            <SystemUsersTable />
          </div>
        </div>

        {/* Controlled dialog for URL parameter triggering */}
        <AddSystemUserDialogControlled 
          open={isAddDialogOpen} 
          onOpenChange={setIsAddDialogOpen} 
        />
      </main>
    </div>
  );
}

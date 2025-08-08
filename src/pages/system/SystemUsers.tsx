import React from 'react';
import { Users, Activity, Clock, ArrowLeft } from 'lucide-react';
import { useSystemUserStats } from '@/hooks/useSystemUsers';
import { AddSystemUserDialog } from '@/components/system/AddSystemUserDialog';
import { SystemUsersTable } from '@/components/system/SystemUsersTable';
import { Badge } from '@/components/ui/badge';
import { SystemUsersStats } from '@/components/system/SystemUsersStats';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
export default function SystemUsers() {
  const navigate = useNavigate();
  const { data: stats, isLoading: statsLoading } = useSystemUserStats();
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-4">
          <Button variant="ghost" size="sm" onClick={() => navigate('/system-dashboard')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Button>
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
      </main>
    </div>
  );
}

import React from 'react';
import { useNavigate } from 'react-router-dom';
import { CustomButton } from '@/components/ui/CustomButton';
import { ArrowLeft, Users, Plus, Shield, UserCheck, UserX } from 'lucide-react';
import { useSystemUserStats } from '@/hooks/useSystemUsers';
import { AddSystemUserDialog } from '@/components/system/AddSystemUserDialog';
import { SystemUsersTable } from '@/components/system/SystemUsersTable';
import { Skeleton } from '@/components/ui/skeleton';

export default function SystemUsers() {
  const navigate = useNavigate();
  const { data: stats, isLoading: statsLoading } = useSystemUserStats();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
      {/* Header */}
      <header className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm border-b border-border/50 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-3">
              <CustomButton
                variant="ghost"
                size="sm"
                onClick={() => navigate('/system-dashboard')}
                className="flex items-center space-x-2"
              >
                <ArrowLeft className="h-4 w-4" />
                <span>Back to Dashboard</span>
              </CustomButton>
            </div>
            
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-primary/20 rounded-lg">
                <Users className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-foreground">System Users</h1>
                <p className="text-sm text-muted-foreground">Manage system administrators</p>
              </div>
            </div>
            
            <AddSystemUserDialog />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-card/50 backdrop-blur-sm border border-border/50 rounded-xl p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Users</p>
                {statsLoading ? (
                  <Skeleton className="h-8 w-8" />
                ) : (
                  <p className="text-2xl font-bold text-foreground">{stats?.total || 0}</p>
                )}
              </div>
              <Users className="h-8 w-8 text-primary" />
            </div>
          </div>
          
          <div className="bg-card/50 backdrop-blur-sm border border-border/50 rounded-xl p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Super Admins</p>
                {statsLoading ? (
                  <Skeleton className="h-8 w-8" />
                ) : (
                  <p className="text-2xl font-bold text-foreground">{stats?.superAdmins || 0}</p>
                )}
              </div>
              <Shield className="h-8 w-8 text-primary" />
            </div>
          </div>
          
          <div className="bg-card/50 backdrop-blur-sm border border-border/50 rounded-xl p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Active Users</p>
                {statsLoading ? (
                  <Skeleton className="h-8 w-8" />
                ) : (
                  <p className="text-2xl font-bold text-foreground">{stats?.active || 0}</p>
                )}
              </div>
              <UserCheck className="h-8 w-8 text-primary" />
            </div>
          </div>
          
          <div className="bg-card/50 backdrop-blur-sm border border-border/50 rounded-xl p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Inactive Users</p>
                {statsLoading ? (
                  <Skeleton className="h-8 w-8" />
                ) : (
                  <p className="text-2xl font-bold text-foreground">{stats?.inactive || 0}</p>
                )}
              </div>
              <UserX className="h-8 w-8 text-primary" />
            </div>
          </div>
        </div>

        {/* User List */}
        <div className="bg-card/50 backdrop-blur-sm border border-border/50 rounded-xl">
          <div className="p-6 border-b border-border/50">
            <h2 className="text-lg font-semibold text-foreground">System Administrator Users</h2>
            <p className="text-sm text-muted-foreground">Manage system user accounts and permissions</p>
          </div>
          
          <div className="p-6">
            <SystemUsersTable />
          </div>
        </div>
      </main>
    </div>
  );
}
import React from 'react';


import { Users, Shield, UserCheck, UserX } from 'lucide-react';
import { useSystemUserStats } from '@/hooks/useSystemUsers';
import { AddSystemUserDialog } from '@/components/system/AddSystemUserDialog';
import { SystemUsersTable } from '@/components/system/SystemUsersTable';
import { Skeleton } from '@/components/ui/skeleton';

export default function SystemUsers() {
  
  const { data: stats, isLoading: statsLoading } = useSystemUserStats();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Info Header */}
        <div className="bg-card/50 backdrop-blur-sm border border-border/50 rounded-xl p-6 mb-8">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-primary/10 rounded-lg">
                <Users className="h-8 w-8 text-primary" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-foreground">System Users</h1>
                <p className="text-muted-foreground mt-1">Manage system administrators</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <AddSystemUserDialog />
            </div>
          </div>
        </div>
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
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { CustomButton } from '@/components/ui/CustomButton';
import { ArrowLeft, Users, Plus, Shield, UserCheck, UserX } from 'lucide-react';

export default function SystemUsers() {
  const navigate = useNavigate();

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
            
            <CustomButton className="flex items-center space-x-2">
              <Plus className="h-4 w-4" />
              <span>Add User</span>
            </CustomButton>
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
                <p className="text-2xl font-bold text-foreground">5</p>
              </div>
              <Users className="h-8 w-8 text-primary" />
            </div>
          </div>
          
          <div className="bg-card/50 backdrop-blur-sm border border-border/50 rounded-xl p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Super Admins</p>
                <p className="text-2xl font-bold text-foreground">2</p>
              </div>
              <Shield className="h-8 w-8 text-primary" />
            </div>
          </div>
          
          <div className="bg-card/50 backdrop-blur-sm border border-border/50 rounded-xl p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Active Users</p>
                <p className="text-2xl font-bold text-foreground">4</p>
              </div>
              <UserCheck className="h-8 w-8 text-primary" />
            </div>
          </div>
          
          <div className="bg-card/50 backdrop-blur-sm border border-border/50 rounded-xl p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Inactive Users</p>
                <p className="text-2xl font-bold text-foreground">1</p>
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
            <div className="text-center py-12">
              <Users className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-foreground mb-2">User Management</h3>
              <p className="text-muted-foreground mb-4">
                This feature will allow you to manage system users, assign roles, and control access permissions.
              </p>
              <CustomButton>
                <Plus className="h-4 w-4 mr-2" />
                Add System User
              </CustomButton>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
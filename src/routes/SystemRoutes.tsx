import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useSystemAuth } from '@/hooks/useSystemAuth';
import { SystemDashboard } from '@/pages/system/SystemDashboard';
import { OrganizationManagement } from '@/pages/system/OrganizationManagement';
import { SubscriptionManagement } from '@/pages/system/SubscriptionManagement';
import SystemTenants from '@/pages/system/SystemTenants';
import { Card, CardContent } from '@/components/ui/card';
import { Shield, AlertCircle } from 'lucide-react';

const SystemAuthGuard: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isLoading, isFullyAuthenticated, isSystemAdmin } = useSystemAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Verifying system access...</p>
        </div>
      </div>
    );
  }

  if (!isFullyAuthenticated || !isSystemAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="w-full max-w-md text-center">
          <CardContent className="pt-6">
            <div className="flex justify-center mb-4">
              <Shield className="h-12 w-12 text-destructive" />
            </div>
            <h1 className="text-xl font-semibold mb-2">Access Denied</h1>
            <p className="text-muted-foreground mb-4">
              You don't have permission to access the system portal. This area is restricted to system administrators only.
            </p>
            <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
              <AlertCircle className="h-4 w-4" />
              <span>Super admin role required</span>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return <>{children}</>;
};

export const SystemRoutes: React.FC = () => {
  return (
    <SystemAuthGuard>
      <Routes>
        <Route path="/" element={<SystemDashboard />} />
        <Route path="/dashboard" element={<SystemDashboard />} />
        <Route path="/organizations" element={<OrganizationManagement />} />
        <Route path="/organizations/new" element={<div>Create Organization Form</div>} />
        <Route path="/organizations/:id" element={<div>Organization Details</div>} />
        <Route path="/subscriptions" element={<SubscriptionManagement />} />
        <Route path="/tenants" element={<SystemTenants />} />
        <Route path="/analytics" element={<div>System Analytics</div>} />
        <Route path="/security" element={<div>Security Dashboard</div>} />
        <Route path="*" element={<Navigate to="/system" replace />} />
      </Routes>
    </SystemAuthGuard>
  );
};
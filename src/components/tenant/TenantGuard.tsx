import React from 'react';
import { Navigate } from 'react-router-dom';
import { useTenantAuth } from '@/hooks/useTenantAuth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertTriangle, Building, Users, Loader2 } from 'lucide-react';

interface TenantGuardProps {
  children: React.ReactNode;
  fallbackPath?: string;
}

export const TenantGuard: React.FC<TenantGuardProps> = ({ 
  children, 
  fallbackPath = '/tenant-setup' 
}) => {
  const { 
    isAuthenticated, 
    isTenantValid, 
    isFullyAuthenticated,
    isLoading,
    user,
    organization,
    tenantError,
    tenantSlug,
    refreshOrganization
  } = useTenantAuth();

  // Show loading state
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="flex flex-col items-center space-y-4">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <div className="text-center space-y-2">
                <h3 className="text-lg font-semibold">Loading...</h3>
                <p className="text-sm text-muted-foreground">
                  Verifying tenant access for {tenantSlug}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // If not authenticated, redirect to login
  if (!isAuthenticated) {
    return <Navigate to="/auth" replace />;
  }

  // If tenant error, show error message
  if (tenantError) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <AlertTriangle className="h-12 w-12 text-destructive" />
            </div>
            <CardTitle className="text-xl">Access Denied</CardTitle>
            <CardDescription>
              You don't have access to organization "{tenantSlug}"
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-sm text-muted-foreground text-center">
              <p>Signed in as: {user?.email}</p>
              <p>Requested tenant: {tenantSlug}</p>
            </div>
            
            <div className="space-y-2">
              <Button 
                onClick={refreshOrganization} 
                className="w-full"
                variant="outline"
              >
                <Users className="mr-2 h-4 w-4" />
                Retry Access
              </Button>
              
              <Button 
                onClick={() => window.location.href = '/'}
                className="w-full"
                variant="secondary"
              >
                <Building className="mr-2 h-4 w-4" />
                Go to Main Site
              </Button>
            </div>

            <div className="text-xs text-muted-foreground text-center">
              If you believe this is an error, please contact your organization administrator.
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // If no valid tenant but authenticated, redirect to tenant setup
  if (!isTenantValid) {
    return <Navigate to={fallbackPath} replace />;
  }

  // All good - render children
  if (isFullyAuthenticated) {
    return <>{children}</>;
  }

  // Fallback loading state
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
    </div>
  );
};
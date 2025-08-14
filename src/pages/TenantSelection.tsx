import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Building, ExternalLink, Settings, Users } from 'lucide-react';
import { useOrganizations } from '@/hooks/useOrganizations';
import { useSystemAuth } from '@/hooks/useSystemAuth';
import { LoadingScreen } from '@/components/LoadingScreen';

export const TenantSelection: React.FC = () => {
  const navigate = useNavigate();
  const { data: organizations, isLoading, error } = useOrganizations();
  const { isSystemAdmin, isLoading: authLoading } = useSystemAuth();

  if (authLoading || isLoading) {
    return <LoadingScreen />;
  }

  if (!isSystemAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="w-full max-w-md text-center">
          <CardHeader>
            <CardTitle>Access Denied</CardTitle>
            <CardDescription>You need super admin access to view this page.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => navigate('/')} className="w-full">
              Go Home
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="w-full max-w-md text-center">
          <CardHeader>
            <CardTitle>Error Loading Organizations</CardTitle>
            <CardDescription>Failed to load tenant organizations.</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">{error.message}</p>
            <Button onClick={() => window.location.reload()} className="w-full">
              Retry
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const handleTenantAccess = (subdomain: string) => {
    // For development, set the tenant in localStorage
    if (window.location.hostname === 'localhost') {
      localStorage.setItem('dev-tenant', subdomain);
      window.location.href = `/${subdomain}/dashboard`;
    } else {
      // For production, navigate to the tenant URL
      window.location.href = `https://med-infinite.care/${subdomain}/dashboard`;
    }
  };

  const handleSystemDashboard = () => {
    navigate('/system');
  };

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold mb-2">Tenant Organizations</h1>
          <p className="text-muted-foreground">
            Select an organization to access as a super admin
          </p>
          <div className="mt-4">
            <Button onClick={handleSystemDashboard} variant="outline">
              <Settings className="mr-2 h-4 w-4" />
              System Dashboard
            </Button>
          </div>
        </div>

        {organizations?.length === 0 ? (
          <Card className="text-center">
            <CardHeader>
              <CardTitle>No Organizations Found</CardTitle>
              <CardDescription>
                No tenant organizations are currently configured.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button onClick={handleSystemDashboard}>
                <Settings className="mr-2 h-4 w-4" />
                Go to System Dashboard
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {organizations?.map((org) => (
              <Card key={org.id} className="cursor-pointer hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
                        <Building className="h-6 w-6 text-primary" />
                      </div>
                      <div>
                        <CardTitle className="text-lg">{org.name}</CardTitle>
                        <CardDescription>{org.subdomain}</CardDescription>
                      </div>
                    </div>
                    <Badge variant={org.subscription_status === 'active' ? 'default' : 'secondary'}>
                      {org.subscription_status}
                    </Badge>
                  </div>
                </CardHeader>
                
                <CardContent className="space-y-4">
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Users className="h-4 w-4" />
                      <span>Max {org.max_users} users</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Building className="h-4 w-4" />
                      <span>Max {org.max_branches} branches</span>
                    </div>
                  </div>
                  
                  <div className="flex gap-2">
                    <Button 
                      onClick={() => handleTenantAccess(org.subdomain)}
                      className="flex-1"
                    >
                      Access Dashboard
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => {
                        const url = window.location.hostname === 'localhost' 
                          ? `http://localhost:3000/${org.subdomain}`
                          : `https://med-infinite.care/${org.subdomain}`;
                        window.open(url, '_blank');
                      }}
                    >
                      <ExternalLink className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
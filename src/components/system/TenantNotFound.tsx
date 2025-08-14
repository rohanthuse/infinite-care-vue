import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertTriangle, Building, Home } from 'lucide-react';

interface TenantNotFoundProps {
  subdomain: string;
}

export const TenantNotFound: React.FC<TenantNotFoundProps> = ({ subdomain }) => {
  const handleGoHome = () => {
    // Clear dev subdomain and redirect to main domain
    if (window.location.hostname === 'localhost') {
      localStorage.removeItem('dev-subdomain');
      window.location.href = '/';
    } else {
      // Redirect to main domain
      const mainDomain = window.location.hostname.split('.').slice(1).join('.');
      window.location.href = `https://${mainDomain}`;
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md text-center">
        <CardHeader>
          <div className="flex justify-center mb-4">
            <AlertTriangle className="h-12 w-12 text-destructive" />
          </div>
          <CardTitle className="text-2xl">Tenant Not Found</CardTitle>
          <CardDescription>
            The organization "{subdomain}" could not be found or is not accessible.
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-4">
          <div className="text-sm text-muted-foreground">
            <p>This could happen if:</p>
            <ul className="list-disc list-inside mt-2 space-y-1 text-left">
              <li>The subdomain doesn't exist</li>
              <li>The organization is inactive</li>
              <li>You don't have access to this organization</li>
              <li>There's a configuration issue</li>
            </ul>
          </div>
          
          <div className="flex flex-col gap-2">
            <Button onClick={handleGoHome} className="w-full">
              <Home className="mr-2 h-4 w-4" />
              Go to Main Site
            </Button>
            
            {window.location.hostname === 'localhost' && (
              <Button 
                variant="outline" 
                onClick={() => window.location.href = '/system-dashboard'}
                className="w-full"
              >
                <Building className="mr-2 h-4 w-4" />
                System Dashboard
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
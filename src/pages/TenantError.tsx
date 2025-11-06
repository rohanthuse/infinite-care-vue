import React from 'react';
import { useSearchParams } from 'react-router-dom';
import { TenantNotFound } from '@/components/system/TenantNotFound';
import { DevTenantSwitcher } from '@/components/system/DevTenantSwitcher';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertTriangle } from 'lucide-react';

export const TenantError: React.FC = () => {
  const [searchParams] = useSearchParams();
  const subdomain = searchParams.get('subdomain');
  const error = searchParams.get('error');

  if (!subdomain) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="w-full max-w-md text-center">
          <CardHeader>
            <div className="flex justify-center mb-4">
              <AlertTriangle className="h-12 w-12 text-destructive" />
            </div>
            <CardTitle>Tenant Error</CardTitle>
            <CardDescription>
              An error occurred while trying to access the tenant organisation.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              {error || 'Unknown error occurred'}
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4 gap-8">
      <TenantNotFound subdomain={subdomain} />
      {window.location.hostname === 'localhost' && <DevTenantSwitcher />}
    </div>
  );
};
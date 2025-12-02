import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertTriangle, Ban } from 'lucide-react';

interface TenantStatusBlockedProps {
  status: string;
  organizationName: string;
}

/**
 * Display component shown when tenant access is blocked
 * Shows appropriate message based on tenant status
 */
export const TenantStatusBlocked: React.FC<TenantStatusBlockedProps> = ({ 
  status, 
  organizationName 
}) => {
  const navigate = useNavigate();

  const getStatusDisplay = () => {
    switch (status) {
      case 'inactive':
        return {
          icon: <AlertTriangle className="h-12 w-12 text-warning" />,
          title: 'Organisation Inactive',
          message: 'Your organisation is currently inactive. Please contact your organisation administrator for assistance.',
          iconBg: 'bg-warning/10'
        };
      case 'suspended':
        return {
          icon: <Ban className="h-12 w-12 text-destructive" />,
          title: 'Organisation Suspended',
          message: 'Your organisation has been suspended. Please contact your organisation administrator for assistance.',
          iconBg: 'bg-destructive/10'
        };
      default:
        return {
          icon: <AlertTriangle className="h-12 w-12 text-muted-foreground" />,
          title: 'Access Restricted',
          message: 'Your organisation access has been restricted. Please contact your organisation administrator.',
          iconBg: 'bg-muted'
        };
    }
  };

  const statusDisplay = getStatusDisplay();

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md text-center">
        <CardHeader>
          <div className={`flex justify-center mb-4 p-4 rounded-full w-fit mx-auto ${statusDisplay.iconBg}`}>
            {statusDisplay.icon}
          </div>
          <CardTitle className="text-2xl">{statusDisplay.title}</CardTitle>
          <CardDescription className="text-base mt-2">
            <span className="font-semibold">{organizationName}</span>
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-muted-foreground">
            {statusDisplay.message}
          </p>
          <Button 
            onClick={() => navigate('/')}
            className="w-full"
          >
            Return to Home
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

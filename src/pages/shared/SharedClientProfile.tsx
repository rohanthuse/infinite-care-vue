import React from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { useSharedClientAccess } from '@/hooks/useSharedClientAccess';
import { SharedClientView } from '@/components/shared/SharedClientView';
import { LoadingScreen } from '@/components/LoadingScreen';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertCircle, Shield } from 'lucide-react';

export const SharedClientProfile: React.FC = () => {
  const { clientId } = useParams<{ clientId: string }>();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');

  const { client, loading, error, isValidToken } = useSharedClientAccess(
    clientId || '',
    token || ''
  );

  if (loading) {
    return <LoadingScreen />;
  }

  if (error || !isValidToken) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50/30 via-white to-red-50/50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md text-center shadow-lg">
          <CardHeader>
            <div className="flex justify-center mb-4">
              <AlertCircle className="h-12 w-12 text-red-500" />
            </div>
            <CardTitle className="text-red-700">Access Denied</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600 mb-4">
              {error || 'Invalid or expired sharing link'}
            </p>
            <div className="flex items-center justify-center gap-2 text-sm text-gray-500">
              <Shield className="h-4 w-4" />
              <span>This link may have expired or been revoked</span>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!client) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50/30 via-white to-gray-50/50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md text-center shadow-lg">
          <CardHeader>
            <div className="flex justify-center mb-4">
              <AlertCircle className="h-12 w-12 text-gray-500" />
            </div>
            <CardTitle className="text-gray-700">Client Not Found</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600">
              The requested client profile could not be found.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return <SharedClientView client={client} />;
};
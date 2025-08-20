import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, RefreshCw, AlertTriangle, CheckCircle, XCircle } from 'lucide-react';

interface UserHealthInfo {
  user_id: string;
  email: string;
  has_auth: boolean;
  has_role: boolean;
  suggested_role: string;
  issue_type: string;
}

export const AuthHealthDebugger: React.FC = () => {
  const [isVisible, setIsVisible] = useState(false);

  const { data: healthData, isLoading, error, refetch } = useQuery({
    queryKey: ['auth-health-check'],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('check_user_role_health');
      if (error) throw error;
      return data as UserHealthInfo[];
    },
    enabled: isVisible,
  });

  const issueCount = healthData?.filter(user => user.issue_type === 'missing_role').length || 0;
  const healthyCount = healthData?.filter(user => user.issue_type === 'healthy').length || 0;

  const fixMissingRoles = async () => {
    try {
      // This would trigger the same migration logic we used earlier
      const missingUsers = healthData?.filter(user => user.issue_type === 'missing_role') || [];
      
      for (const user of missingUsers) {
        if (user.suggested_role && user.suggested_role !== 'unknown') {
          await supabase
            .from('user_roles')
            .insert({ 
              user_id: user.user_id, 
              role: user.suggested_role as any 
            })
            .select();
        }
      }
      
      // Refresh the data
      refetch();
    } catch (error) {
      console.error('Error fixing missing roles:', error);
    }
  };

  if (!isVisible) {
    return (
      <div className="fixed bottom-4 right-4 z-50">
        <Button
          onClick={() => setIsVisible(true)}
          variant="outline"
          size="sm"
          className="bg-card shadow-lg border-border"
        >
          🔧 Auth Debug
        </Button>
      </div>
    );
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 w-96">
      <Card className="shadow-xl border-2">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg">Authentication Health</CardTitle>
              <CardDescription>Debug user authentication issues</CardDescription>
            </div>
            <Button
              onClick={() => setIsVisible(false)}
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0"
            >
              ✕
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-2">
            <Button
              onClick={() => refetch()}
              variant="outline"
              size="sm"
              disabled={isLoading}
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4" />
              )}
              Refresh
            </Button>
            
            {issueCount > 0 && (
              <Button
                onClick={fixMissingRoles}
                variant="destructive"
                size="sm"
              >
                Fix {issueCount} Issues
              </Button>
            )}
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                Error: {error.message}
              </AlertDescription>
            </Alert>
          )}

          {healthData && (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div className="flex items-center gap-1">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span>Healthy: {healthyCount}</span>
                </div>
                <div className="flex items-center gap-1">
                  <XCircle className="h-4 w-4 text-red-500" />
                  <span>Issues: {issueCount}</span>
                </div>
              </div>

              {issueCount > 0 && (
                <div className="space-y-2">
                  <h4 className="text-sm font-medium text-destructive">Users with Issues:</h4>
                  <div className="max-h-32 overflow-y-auto space-y-1">
                    {healthData
                      .filter(user => user.issue_type === 'missing_role')
                      .map(user => (
                        <div
                          key={user.user_id}
                          className="flex items-center justify-between text-xs bg-destructive/10 p-2 rounded"
                        >
                          <span className="truncate" title={user.email}>
                            {user.email.split('@')[0]}
                          </span>
                          <Badge variant="outline" className="text-xs">
                            {user.suggested_role}
                          </Badge>
                        </div>
                      ))}
                  </div>
                </div>
              )}

              {issueCount === 0 && healthData.length > 0 && (
                <div className="flex items-center gap-2 text-green-600 dark:text-green-400 text-sm">
                  <CheckCircle className="h-4 w-4" />
                  <span>All users have proper authentication setup!</span>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
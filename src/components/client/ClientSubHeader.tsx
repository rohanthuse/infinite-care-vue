import React from 'react';
import { Link } from 'react-router-dom';
import { Building2, ArrowLeft, MessageCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useClientContext } from '@/hooks/useClientContext';
import { useAuthSafe } from '@/hooks/useAuthSafe';
import { useTenant } from '@/contexts/TenantContext';

export const ClientSubHeader: React.FC = () => {
  const { data: clientContext, isLoading, isPending, isError, error } = useClientContext();
  const { user, loading: authLoading } = useAuthSafe();
  const { tenantSlug } = useTenant();

  // Helper to create client dashboard paths
  const createClientPath = (path: string) => {
    if (tenantSlug) {
      return `/${tenantSlug}/client-dashboard${path}`;
    }
    return `/client-dashboard${path}`;
  };

  // Show loading if auth is loading OR if query is pending/loading with no data
  const showLoading = authLoading || isLoading || (isPending && !clientContext);

  console.log('[ClientSubHeader] State:', {
    authLoading,
    userId: user?.id,
    isLoading,
    isPending,
    isError,
    hasClientContext: !!clientContext,
    branchInfo: clientContext?.branchInfo,
  });
  
  let branchName: string;
  let organizationName = '';

  if (showLoading) {
    branchName = 'Loading...';
  } else if (isError) {
    branchName = 'Error loading branch';
    console.error('[ClientSubHeader] Query error:', error);
  } else if (clientContext?.branchInfo?.name) {
    branchName = clientContext.branchInfo.name;
    organizationName = clientContext.branchInfo.organization_name || '';
  } else {
    branchName = 'No Branch Assigned';
  }
    
  const branchStatus = clientContext?.branchInfo?.status || 'active';
  
  return (
    <div className="bg-gradient-to-br from-indigo-50/40 via-card to-purple-50/30 dark:from-indigo-950/20 dark:via-card dark:to-purple-950/20 border border-border border-l-4 border-l-indigo-500 px-4 py-3 mb-6 rounded-lg shadow-sm shadow-indigo-100/10 dark:shadow-indigo-900/10">
      <div className="flex items-center justify-between gap-3">
        {/* Left side - Branch & Org Info + Back button */}
        <div className="flex items-center gap-3 min-w-0 flex-1">
          <Building2 className="h-5 w-5 text-primary shrink-0" />
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="font-semibold text-foreground truncate">
                {branchName}
              </h2>
              {!showLoading && (
                <Badge 
                  variant={branchStatus?.toLowerCase() === 'active' ? 'success' : 'secondary'}
                  className="shrink-0"
                >
                  {branchStatus}
                </Badge>
              )}
              <Button variant="outline" size="sm" className="shrink-0" asChild>
                <Link to={createClientPath('')}>
                  <ArrowLeft className="h-4 w-4 md:mr-2" />
                  <span className="hidden md:inline">Back to Dashboard</span>
                </Link>
              </Button>
            </div>
            {organizationName && (
              <p className="text-sm text-muted-foreground truncate">
                {organizationName}
              </p>
            )}
          </div>
        </div>
        
        {/* Right side - Messages button */}
        <Button variant="outline" size="sm" className="shrink-0" asChild>
          <Link to={createClientPath('/messages')}>
            <MessageCircle className="h-4 w-4 md:mr-2" />
            <span className="hidden md:inline">Messages</span>
          </Link>
        </Button>
      </div>
    </div>
  );
};

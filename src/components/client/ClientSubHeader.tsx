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
    <div className="bg-gradient-to-br from-indigo-50/40 via-card to-purple-50/30 dark:from-indigo-950/20 dark:via-card dark:to-purple-950/20 border border-border border-l-4 border-l-indigo-500 px-3 sm:px-4 py-2 sm:py-3 mb-4 sm:mb-6 rounded-lg shadow-sm shadow-indigo-100/10 dark:shadow-indigo-900/10">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-3">
        {/* Left side - Branch & Org Info + Back button */}
        <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
          <Building2 className="h-4 w-4 sm:h-5 sm:w-5 text-primary shrink-0" />
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="font-semibold text-foreground truncate text-sm sm:text-base">
                {branchName}
              </h2>
              {!showLoading && (
                <Badge 
                  variant={branchStatus?.toLowerCase() === 'active' ? 'success' : 'secondary'}
                  className="shrink-0 text-xs"
                >
                  {branchStatus}
                </Badge>
              )}
            </div>
            {organizationName && (
              <p className="text-xs sm:text-sm text-muted-foreground truncate">
                {organizationName}
              </p>
            )}
          </div>
        </div>
        
        {/* Right side - Action buttons */}
        <div className="flex items-center gap-2 shrink-0">
          <Button variant="outline" size="sm" className="h-8 text-xs sm:text-sm" asChild>
            <Link to={createClientPath('')}>
              <ArrowLeft className="h-3.5 w-3.5 sm:h-4 sm:w-4 sm:mr-2" />
              <span className="hidden sm:inline">Back to Dashboard</span>
              <span className="sm:hidden">Back</span>
            </Link>
          </Button>
          <Button variant="outline" size="sm" className="h-8 text-xs sm:text-sm" asChild>
            <Link to={createClientPath('/messages')}>
              <MessageCircle className="h-3.5 w-3.5 sm:h-4 sm:w-4 sm:mr-2" />
              <span className="hidden sm:inline">Messages</span>
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
};

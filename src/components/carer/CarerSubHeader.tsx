import React from 'react';
import { Link } from 'react-router-dom';
import { Building2, ArrowLeft, MessageCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useCarerContext } from '@/hooks/useCarerContext';
import { useCarerNavigation } from '@/hooks/useCarerNavigation';
import { useAuthSafe } from '@/hooks/useAuthSafe';

export const CarerSubHeader: React.FC = () => {
  const { data: carerContext, isLoading, isPending, isError, error } = useCarerContext();
  const { user, loading: authLoading } = useAuthSafe();
  const { createCarerPath } = useCarerNavigation();

  // Show loading if auth is loading OR if query is pending/loading with no data
  const showLoading = authLoading || isLoading || (isPending && !carerContext);

  // Debug current state to help diagnose stuck loading issues
  console.log('[CarerSubHeader] State:', {
    authLoading,
    userId: user?.id,
    isLoading,
    isPending,
    isError,
    hasCarerContext: !!carerContext,
    branchInfo: carerContext?.branchInfo,
  });
  
  let branchName: string;
  let organizationName = '';

  if (showLoading) {
    branchName = 'Loading...';
  } else if (isError) {
    branchName = 'Error loading branch';
    console.error('[CarerSubHeader] Query error:', error);
  } else if (carerContext?.branchInfo?.name) {
    branchName = carerContext.branchInfo.name;
    organizationName = carerContext.branchInfo.organization_name || '';
  } else {
    branchName = 'No Branch Assigned';
  }
    
  const branchStatus = carerContext?.branchInfo?.status || 'active';
  
  return (
    <div className="bg-gradient-to-br from-green-50/40 via-card to-teal-50/30 dark:from-green-950/20 dark:via-card dark:to-teal-950/20 border border-border border-l-4 border-l-green-500 px-3 sm:px-4 py-3 mb-6 rounded-lg shadow-sm shadow-green-100/10 dark:shadow-green-900/10">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
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
                <Link to={createCarerPath('')}>
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
          <Link to={createCarerPath('/messages')}>
            <MessageCircle className="h-4 w-4 md:mr-2" />
            <span className="hidden md:inline">Messages</span>
          </Link>
        </Button>
      </div>
    </div>
  );
};

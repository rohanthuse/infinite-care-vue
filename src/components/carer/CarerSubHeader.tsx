import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Building2, ArrowLeft } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useCarerContext } from '@/hooks/useCarerContext';
import { useCarerNavigation } from '@/hooks/useCarerNavigation';
import { useAuthSafe } from '@/hooks/useAuthSafe';

export const CarerSubHeader: React.FC = () => {
  const { data: carerContext, isLoading, isPending } = useCarerContext();
  const { user, loading: authLoading } = useAuthSafe();
  const { createCarerPath } = useCarerNavigation();
  const location = useLocation();
  
  // Don't show on the main dashboard (overview) page
  const isDashboard = location.pathname.endsWith('/carer-dashboard') || 
                      location.pathname.endsWith('/carer-dashboard/');
  
  if (isDashboard) return null;

  // Show loading if auth is loading OR if query is pending/loading with no data
  const showLoading = authLoading || isLoading || (isPending && !carerContext);
  
  const branchName = showLoading 
    ? 'Loading...' 
    : (carerContext?.branchInfo?.name || 'No Branch Assigned');
    
  const branchStatus = carerContext?.branchInfo?.status || 'active';
  
  const organizationName = showLoading 
    ? '' 
    : (carerContext?.branchInfo?.organization_name || '');
  
  return (
    <div className="bg-card border-b border-border px-4 sm:px-6 lg:px-8 py-3 shrink-0 sticky top-[64px] z-[55]">
      <div className="flex items-center justify-between gap-4">
        {/* Left side - Branch & Org Info */}
        <div className="flex items-center gap-3 min-w-0 flex-1">
          <Building2 className="h-5 w-5 text-primary shrink-0" />
          <div className="min-w-0 flex-1">
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
            </div>
            {organizationName && (
              <p className="text-sm text-muted-foreground truncate">
                {organizationName}
              </p>
            )}
          </div>
        </div>
        
        {/* Right side - Back to Dashboard button */}
        <Button variant="outline" size="sm" className="shrink-0" asChild>
          <Link to={createCarerPath('')}>
            <ArrowLeft className="h-4 w-4 md:mr-2" />
            <span className="hidden md:inline">Back to Dashboard</span>
          </Link>
        </Button>
      </div>
    </div>
  );
};

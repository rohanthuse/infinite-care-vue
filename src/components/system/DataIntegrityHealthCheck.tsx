import React from 'react';
import { AlertTriangle, CheckCircle2, RefreshCw } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { CustomButton } from '@/components/ui/CustomButton';
import { Badge } from '@/components/ui/badge';
import { useDataIntegrityValidation, useRepairDataIntegrity } from '@/hooks/useDataIntegrityValidation';
import { Skeleton } from '@/components/ui/skeleton';

export const DataIntegrityHealthCheck: React.FC = () => {
  const { data: issues, isLoading, refetch } = useDataIntegrityValidation();
  const repairMutation = useRepairDataIntegrity();

  if (isLoading) {
    return (
      <div className="space-y-2">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-20 w-full" />
      </div>
    );
  }

  const hasIssues = issues && issues.length > 0;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-foreground">Data Integrity Status</h3>
        <CustomButton
          variant="ghost"
          size="sm"
          onClick={() => refetch()}
          disabled={isLoading}
        >
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </CustomButton>
      </div>

      {hasIssues ? (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle className="flex items-center gap-2">
            Data Integrity Issues Detected
            <Badge variant="destructive">{issues.length}</Badge>
          </AlertTitle>
          <AlertDescription className="mt-2 space-y-3">
            <p className="text-sm">
              Found {issues.length} user{issues.length !== 1 ? 's' : ''} with inconsistent organization assignments.
            </p>
            
            <div className="space-y-1">
              {issues.slice(0, 3).map((issue) => (
                <div key={`${issue.system_user_id}-${issue.organization_id}`} className="text-xs">
                  • {issue.email} - {issue.organization_name}
                  {issue.missing_in_system_user_organizations && ' (missing assignment link)'}
                  {issue.missing_in_organization_members && ' (missing membership)'}
                </div>
              ))}
              {issues.length > 3 && (
                <div className="text-xs text-muted-foreground">
                  ... and {issues.length - 3} more
                </div>
              )}
            </div>

            <CustomButton
              variant="default"
              size="sm"
              onClick={() => repairMutation.mutate()}
              disabled={repairMutation.isPending}
              className="mt-2"
            >
              {repairMutation.isPending ? (
                <>
                  <RefreshCw className="h-3 w-3 mr-2 animate-spin" />
                  Repairing...
                </>
              ) : (
                'Auto-Repair Issues'
              )}
            </CustomButton>
          </AlertDescription>
        </Alert>
      ) : (
        <Alert>
          <CheckCircle2 className="h-4 w-4 text-success" />
          <AlertTitle>All Systems Normal</AlertTitle>
          <AlertDescription>
            No data integrity issues detected. All user organization assignments are consistent.
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
};

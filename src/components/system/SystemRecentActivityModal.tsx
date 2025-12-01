import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useSystemAuditLogs } from '@/hooks/useSystemAuditLogs';
import { 
  Trash2, 
  Plus, 
  Edit, 
  Eye, 
  Shield, 
  User,
  FileText,
  Database,
  Activity
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { Skeleton } from '@/components/ui/skeleton';

interface SystemRecentActivityModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const getActionIcon = (action: string) => {
  const actionLower = action.toLowerCase();
  if (actionLower.includes('delete') || actionLower.includes('removed')) return Trash2;
  if (actionLower.includes('create') || actionLower.includes('added')) return Plus;
  if (actionLower.includes('update') || actionLower.includes('modified')) return Edit;
  if (actionLower.includes('view') || actionLower.includes('accessed')) return Eye;
  if (actionLower.includes('auth') || actionLower.includes('login')) return Shield;
  return Activity;
};

const getActionColor = (action: string) => {
  const actionLower = action.toLowerCase();
  if (actionLower.includes('delete') || actionLower.includes('removed')) return 'text-red-500';
  if (actionLower.includes('create') || actionLower.includes('added')) return 'text-green-500';
  if (actionLower.includes('update') || actionLower.includes('modified')) return 'text-blue-500';
  return 'text-gray-500';
};

const getActionBgColor = (action: string) => {
  const actionLower = action.toLowerCase();
  if (actionLower.includes('delete') || actionLower.includes('removed')) return 'bg-red-500/10';
  if (actionLower.includes('create') || actionLower.includes('added')) return 'bg-green-500/10';
  if (actionLower.includes('update') || actionLower.includes('modified')) return 'bg-blue-500/10';
  return 'bg-gray-500/10';
};

const formatActionDescription = (log: any) => {
  const action = log.action;
  const resourceType = log.resource_type;
  const details = log.details;
  
  // Try to get a meaningful description from details
  let description = `${action} ${resourceType}`;
  
  if (details) {
    if (details.name) {
      description += `: ${details.name}`;
    } else if (details.email) {
      description += `: ${details.email}`;
    } else if (details.title) {
      description += `: ${details.title}`;
    }
  }
  
  return description;
};

export function SystemRecentActivityModal({ open, onOpenChange }: SystemRecentActivityModalProps) {
  const { data: auditLogs, isLoading, error } = useSystemAuditLogs();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[900px] max-h-[600px] h-[600px] p-0">
        <DialogHeader className="px-6 pt-6 pb-4">
          <DialogTitle className="text-2xl font-bold">Recent Activity</DialogTitle>
          <DialogDescription>
            System-wide activity log showing recent actions and changes
          </DialogDescription>
        </DialogHeader>
        
        <ScrollArea className="h-[calc(600px-120px)] px-6 pb-6">
          {isLoading && (
            <div className="space-y-3">
              {[...Array(8)].map((_, i) => (
                <div key={i} className="flex items-start space-x-4 p-4 bg-card border border-border rounded-lg">
                  <Skeleton className="h-10 w-10 rounded-lg" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-3 w-1/2" />
                  </div>
                </div>
              ))}
            </div>
          )}

          {error && (
            <div className="flex items-center justify-center h-64">
              <p className="text-muted-foreground">Failed to load activity logs</p>
            </div>
          )}

          {!isLoading && !error && auditLogs && auditLogs.length === 0 && (
            <div className="flex flex-col items-center justify-center h-64 space-y-2">
              <Activity className="h-12 w-12 text-muted-foreground opacity-50" />
              <p className="text-muted-foreground">No recent activity</p>
            </div>
          )}

          {!isLoading && !error && auditLogs && auditLogs.length > 0 && (
            <div className="space-y-3">
              {auditLogs.map((log) => {
                const Icon = getActionIcon(log.action);
                const colorClass = getActionColor(log.action);
                const bgColorClass = getActionBgColor(log.action);
                
                return (
                  <div
                    key={log.id}
                    className="flex items-start space-x-4 p-4 bg-card border border-border rounded-lg hover:shadow-md transition-shadow"
                  >
                    <div className={`p-2 rounded-lg ${bgColorClass}`}>
                      <Icon className={`h-5 w-5 ${colorClass}`} />
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-foreground">
                            {formatActionDescription(log)}
                          </p>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-primary/10 text-primary border border-primary/20">
                              {log.resource_type}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              by {log.performed_by_name}
                            </span>
                          </div>
                        </div>
                        <span className="text-xs text-muted-foreground whitespace-nowrap">
                          {formatDistanceToNow(new Date(log.created_at), { addSuffix: true })}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}

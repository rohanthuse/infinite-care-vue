import React from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { formatDistanceToNow } from 'date-fns';

interface ViewTenantDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tenant: {
    id: string;
    name: string;
    slug: string;
    subscription_plan: string;
    subscription_status: string;
    contact_email: string;
    activeUsers: number;
    users?: Array<{
      id: string;
      first_name: string;
      last_name: string;
      email: string;
      last_login_at: string | null;
      user_type: 'staff' | 'client' | 'admin';
    }>;
  } | null;
}

export const ViewTenantDialog: React.FC<ViewTenantDialogProps> = ({ open, onOpenChange, tenant }) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Tenant details</DialogTitle>
          <DialogDescription>Review the organisation information.</DialogDescription>
        </DialogHeader>
        {tenant && (
          <div className="space-y-3">
            <div>
              <div className="text-sm text-muted-foreground">Organisation</div>
              <div className="font-medium">{tenant.name}</div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground">URL Slug</div>
              <div className="font-mono text-sm bg-muted px-2 py-1 rounded">med-infinite.care/{tenant.slug}</div>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="capitalize">{tenant.subscription_plan}</Badge>
              <Badge variant={tenant.subscription_status === 'active' ? 'default' : 'destructive'} className="capitalize">
                {tenant.subscription_status}
              </Badge>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="text-sm text-muted-foreground">Contact email</div>
                <div className="text-sm">{tenant.contact_email || '—'}</div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Active users</div>
                <div className="text-sm">{tenant.activeUsers ?? 0}</div>
              </div>
            </div>
            
            {tenant.users && tenant.users.length > 0 && (
              <div className="space-y-3">
                <div className="text-sm font-medium text-muted-foreground">Users</div>
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {tenant.users.map((user) => (
                    <div key={user.id} className="flex items-center justify-between p-2 border rounded-lg">
                      <div className="flex-1">
                        <div className="font-medium text-sm">
                          {user.first_name} {user.last_name}
                        </div>
                        <div className="text-xs text-muted-foreground">{user.email}</div>
                        <div className="text-xs text-muted-foreground">
                          Last login: {user.last_login_at 
                            ? formatDistanceToNow(new Date(user.last_login_at), { addSuffix: true })
                            : 'Never'
                          }
                        </div>
                      </div>
                      <Badge variant="outline" className="capitalize text-xs">
                        {user.user_type}
                      </Badge>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

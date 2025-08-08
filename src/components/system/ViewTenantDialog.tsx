import React from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';

interface ViewTenantDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tenant: any | null;
}

export const ViewTenantDialog: React.FC<ViewTenantDialogProps> = ({ open, onOpenChange, tenant }) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Tenant details</DialogTitle>
          <DialogDescription>Review the organization information.</DialogDescription>
        </DialogHeader>
        {tenant && (
          <div className="space-y-3">
            <div>
              <div className="text-sm text-muted-foreground">Organization</div>
              <div className="font-medium">{tenant.name}</div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground">Subdomain</div>
              <div className="font-mono text-sm bg-muted px-2 py-1 rounded">{tenant.subdomain}</div>
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
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

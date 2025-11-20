import React from 'react';
import { FileText, Building2, Calendar, User, FileSignature } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { format } from 'date-fns';
import type { SystemTenantAgreement } from '@/types/systemTenantAgreements';

interface ViewSystemTenantAgreementDialogProps {
  agreement: SystemTenantAgreement;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const ViewSystemTenantAgreementDialog: React.FC<ViewSystemTenantAgreementDialogProps> = ({
  agreement,
  open,
  onOpenChange,
}) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="text-2xl">{agreement.title}</DialogTitle>
            <Badge variant={agreement.status === 'Active' ? 'default' : 'secondary'}>
              {agreement.status}
            </Badge>
          </div>
          <DialogDescription>Agreement Details</DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Tenant Information */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Building2 className="h-4 w-4 text-muted-foreground" />
              <h3 className="font-semibold">Tenant Organization</h3>
            </div>
            <p className="text-sm text-muted-foreground">
              {agreement.organizations?.name || 'Unknown Tenant'}
            </p>
          </div>

          <Separator />

          {/* Agreement Details */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <FileText className="h-4 w-4 text-muted-foreground" />
                <h4 className="text-sm font-medium">Agreement Type</h4>
              </div>
              <p className="text-sm text-muted-foreground">
                {agreement.system_tenant_agreement_types?.name || 'N/A'}
              </p>
            </div>

            <div>
              <div className="flex items-center gap-2 mb-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <h4 className="text-sm font-medium">Created Date</h4>
              </div>
              <p className="text-sm text-muted-foreground">
                {format(new Date(agreement.created_at), 'PPP')}
              </p>
            </div>

            {agreement.signed_at && (
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <h4 className="text-sm font-medium">Signed Date</h4>
                </div>
                <p className="text-sm text-muted-foreground">
                  {format(new Date(agreement.signed_at), 'PPP')}
                </p>
              </div>
            )}

            {agreement.expiry_date && (
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <h4 className="text-sm font-medium">Expiry Date</h4>
                </div>
                <p className="text-sm text-muted-foreground">
                  {format(new Date(agreement.expiry_date), 'PPP')}
                </p>
              </div>
            )}
          </div>

          <Separator />

          {/* Signatories */}
          <div className="grid grid-cols-2 gap-4">
            {agreement.signed_by_system && (
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <h4 className="text-sm font-medium">Med-Infinite Representative</h4>
                </div>
                <p className="text-sm text-muted-foreground">{agreement.signed_by_system}</p>
              </div>
            )}

            {agreement.signed_by_tenant && (
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <FileSignature className="h-4 w-4 text-muted-foreground" />
                  <h4 className="text-sm font-medium">Tenant Representative</h4>
                </div>
                <p className="text-sm text-muted-foreground">{agreement.signed_by_tenant}</p>
              </div>
            )}
          </div>

          {agreement.content && (
            <>
              <Separator />
              <div>
                <h3 className="font-semibold mb-3">Agreement Content</h3>
                <div className="bg-muted/50 rounded-lg p-4 max-h-[300px] overflow-y-auto">
                  <p className="text-sm whitespace-pre-wrap">{agreement.content}</p>
                </div>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

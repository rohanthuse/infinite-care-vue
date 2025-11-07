import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Shield, UserCircle } from 'lucide-react';
import { useTenant } from '@/contexts/TenantContext';

interface FillFormOnBehalfDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  formId: string;
  staffId: string;
  staffName: string;
  formTitle: string;
  branchId: string;
  branchName: string;
}

export const FillFormOnBehalfDialog: React.FC<FillFormOnBehalfDialogProps> = ({
  open,
  onOpenChange,
  formId,
  staffId,
  staffName,
  formTitle,
  branchId,
  branchName,
}) => {
  const navigate = useNavigate();
  const { tenantSlug } = useTenant();

  React.useEffect(() => {
    if (open) {
      // Navigate to the form fill page with proxy parameters (no returnTo needed - using role-based navigation)
      const fullPath = tenantSlug
        ? `/${tenantSlug}/branch-dashboard/${branchId}/${encodeURIComponent(branchName)}/forms/fill/${formId}?proxyFor=${staffId}&proxyName=${encodeURIComponent(staffName)}`
        : `/branch-dashboard/${branchId}/${encodeURIComponent(branchName)}/forms/fill/${formId}?proxyFor=${staffId}&proxyName=${encodeURIComponent(staffName)}`;
      
      navigate(fullPath);
      onOpenChange(false);
    }
  }, [open, formId, staffId, staffName, branchId, branchName, tenantSlug, navigate, onOpenChange]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-primary" />
            Fill Form on Behalf
          </DialogTitle>
          <DialogDescription>
            You are filling out this form for <strong>{staffName}</strong>
          </DialogDescription>
        </DialogHeader>
        
        <Alert className="bg-blue-50 border-blue-200">
          <UserCircle className="h-4 w-4 text-blue-600" />
          <AlertDescription className="text-blue-800">
            Filling <strong>{formTitle}</strong> on behalf of {staffName}
          </AlertDescription>
        </Alert>
      </DialogContent>
    </Dialog>
  );
};

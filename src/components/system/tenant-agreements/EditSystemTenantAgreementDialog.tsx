import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useUpdateSystemTenantAgreement } from '@/hooks/useSystemTenantAgreements';
import type { SystemTenantAgreement, UpdateSystemTenantAgreementData } from '@/types/systemTenantAgreements';

interface EditSystemTenantAgreementDialogProps {
  agreement: SystemTenantAgreement;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const EditSystemTenantAgreementDialog: React.FC<EditSystemTenantAgreementDialogProps> = ({
  agreement,
  open,
  onOpenChange,
}) => {
  const [formData, setFormData] = useState<UpdateSystemTenantAgreementData>({});
  const updateAgreement = useUpdateSystemTenantAgreement();

  useEffect(() => {
    if (agreement && open) {
      setFormData({
        title: agreement.title,
        content: agreement.content || '',
        status: agreement.status,
        signed_by_system: agreement.signed_by_system || '',
        signed_by_tenant: agreement.signed_by_tenant || '',
        expiry_date: agreement.expiry_date || '',
      });
    }
  }, [agreement, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await updateAgreement.mutateAsync({ id: agreement.id, data: formData });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Agreement</DialogTitle>
          <DialogDescription>
            Update the agreement details and status.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Agreement Title *</Label>
            <Input
              id="title"
              value={formData.title || ''}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="status">Status</Label>
            <Select
              value={formData.status}
              onValueChange={(value: any) => setFormData({ ...formData, status: value })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Active">Active</SelectItem>
                <SelectItem value="Pending">Pending</SelectItem>
                <SelectItem value="Expired">Expired</SelectItem>
                <SelectItem value="Terminated">Terminated</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="content">Agreement Content</Label>
            <Textarea
              id="content"
              value={formData.content || ''}
              onChange={(e) => setFormData({ ...formData, content: e.target.value })}
              rows={8}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="signed_by_system">Med-Infinite Representative</Label>
              <Input
                id="signed_by_system"
                value={formData.signed_by_system || ''}
                onChange={(e) => setFormData({ ...formData, signed_by_system: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="signed_by_tenant">Tenant Representative</Label>
              <Input
                id="signed_by_tenant"
                value={formData.signed_by_tenant || ''}
                onChange={(e) => setFormData({ ...formData, signed_by_tenant: e.target.value })}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="expiry_date">Expiry Date</Label>
            <Input
              id="expiry_date"
              type="date"
              value={formData.expiry_date || ''}
              onChange={(e) => setFormData({ ...formData, expiry_date: e.target.value })}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={updateAgreement.isPending}>
              {updateAgreement.isPending ? 'Saving...' : 'Save Changes'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

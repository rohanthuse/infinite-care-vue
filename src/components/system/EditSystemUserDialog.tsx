import React, { useEffect, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { CustomButton } from '@/components/ui/CustomButton';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Loader2, Building2, X } from 'lucide-react';
import { useUpdateSystemUser, UpdateSystemUserData } from '@/hooks/useSystemUsers';
import { useOrganizations } from '@/hooks/useOrganizations';
import { useAssignUserToOrganization } from '@/hooks/useOrganizationAssignment';

interface EditSystemUserDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user: {
    id: string;
    email: string;
    first_name: string;
    last_name: string;
    role?: 'super_admin' | 'tenant_manager' | 'support_admin' | 'analytics_viewer';
    organizations?: Array<{ id: string; name: string; role: string }>;
  } | null;
}

export const EditSystemUserDialog: React.FC<EditSystemUserDialogProps> = ({ open, onOpenChange, user }) => {
  const [formData, setFormData] = useState<UpdateSystemUserData | null>(null);
  const [selectedOrgId, setSelectedOrgId] = useState<string>('');
  const [selectedOrgRole, setSelectedOrgRole] = useState<string>('member');
  const updateUser = useUpdateSystemUser();
  const { data: organizations } = useOrganizations();
  const assignUserToOrg = useAssignUserToOrganization();

  useEffect(() => {
    if (user) {
      setFormData({
        id: user.id,
        email: user.email,
        first_name: user.first_name,
        last_name: user.last_name,
        role: (user.role || 'support_admin') as UpdateSystemUserData['role'],
      });
    }
  }, [user]);

  const handleInputChange = (field: keyof UpdateSystemUserData, value: string) => {
    setFormData(prev => prev ? { ...prev, [field]: value } as UpdateSystemUserData : prev);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData) return;
    try {
      await updateUser.mutateAsync(formData);
      onOpenChange(false);
    } catch (_) {
      // toast handled in hook
    }
  };

  const handleAssignToOrganization = async () => {
    if (!user || !selectedOrgId) return;
    try {
      await assignUserToOrg.mutateAsync({
        systemUserId: user.id,
        organizationId: selectedOrgId,
        role: selectedOrgRole
      });
      setSelectedOrgId('');
      setSelectedOrgRole('member');
    } catch (_) {
      // toast handled in hook
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px] max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit System User</DialogTitle>
          <DialogDescription className="sr-only">Update system user information and role.</DialogDescription>
        </DialogHeader>
        {formData && (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="first_name">First Name</Label>
                <Input
                  id="first_name"
                  value={formData.first_name}
                  onChange={(e) => handleInputChange('first_name', e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="last_name">Last Name</Label>
                <Input
                  id="last_name"
                  value={formData.last_name}
                  onChange={(e) => handleInputChange('last_name', e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="role">Role</Label>
              <Select value={formData.role} onValueChange={(value) => handleInputChange('role', value as UpdateSystemUserData['role'])}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="support_admin">Support Admin</SelectItem>
                  <SelectItem value="tenant_manager">Tenant Manager</SelectItem>
                  <SelectItem value="analytics_viewer">Analytics Viewer</SelectItem>
                  <SelectItem value="super_admin">Super Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Organisation Assignments */}
            <div className="space-y-4 pt-4 border-t">
              <div className="flex items-center space-x-2">
                <Building2 className="h-4 w-4 text-muted-foreground" />
                <Label className="text-sm font-medium">Organisation Assignments</Label>
              </div>
              
              {/* Current Assignments */}
              {user?.organizations && user.organizations.length > 0 && (
                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground">Current Assignments</Label>
                  <div className="flex flex-wrap gap-2">
                    {user.organizations.map((org) => (
                      <Badge key={org.id} variant="outline" className="flex items-center space-x-1">
                        <span>{org.name}</span>
                        <span className="text-xs text-muted-foreground">({org.role})</span>
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* Add New Assignment */}
              <div className="grid grid-cols-3 gap-2">
                <div className="col-span-2">
                  <Select value={selectedOrgId} onValueChange={setSelectedOrgId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select organisation" />
                    </SelectTrigger>
                    <SelectContent>
                      {organizations?.map((org) => (
                        <SelectItem key={org.id} value={org.id}>
                          {org.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <Select value={selectedOrgRole} onValueChange={setSelectedOrgRole}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="member">Member</SelectItem>
                    <SelectItem value="admin">Admin</SelectItem>
                    <SelectItem value="owner">Owner</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <CustomButton 
                type="button"
                variant="outline"
                size="sm"
                onClick={handleAssignToOrganization}
                disabled={!selectedOrgId || assignUserToOrg.isPending}
                className="w-full"
              >
                {assignUserToOrg.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Assign to Organisation
              </CustomButton>
            </div>

            <div className="flex justify-end space-x-2 pt-4">
              <CustomButton
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                Cancel
              </CustomButton>
              <CustomButton type="submit" disabled={updateUser.isPending}>
                {updateUser.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Save Changes
              </CustomButton>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
};
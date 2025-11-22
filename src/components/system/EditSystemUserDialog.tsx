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
import { Badge } from '@/components/ui/badge';
import { Loader2, Building2 } from 'lucide-react';
import { useUpdateSystemUser, UpdateSystemUserData } from '@/hooks/useSystemUsers';

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
  const updateUser = useUpdateSystemUser();

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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px] max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Tenant User</DialogTitle>
          <DialogDescription className="sr-only">Update tenant user information and role.</DialogDescription>
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
              <div className="px-3 py-2 bg-muted rounded-md border border-input">
                <span className="text-sm font-medium">Super Admin</span>
              </div>
            </div>

            {/* Assigned Organisation (Read-Only) */}
            <div className="space-y-2 pt-4 border-t">
              <Label className="flex items-center space-x-2">
                <Building2 className="h-4 w-4 text-muted-foreground" />
                <span>Assigned Organisation</span>
              </Label>
              
              {user?.organizations && user.organizations.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {user.organizations.map((org) => (
                    <Badge key={org.id} variant="secondary" className="px-3 py-1.5">
                      {org.name}
                    </Badge>
                  ))}
                </div>
              ) : (
                <div className="flex items-center gap-2 p-3 rounded-md bg-destructive/10 border border-destructive/20">
                  <Badge variant="destructive" className="text-xs">No Organisation Assigned</Badge>
                </div>
              )}
              
              <p className="text-xs text-muted-foreground">
                Organisation assignment is set during user creation and cannot be changed here. 
                Contact system administrator if you need to modify the assigned organisation.
              </p>
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
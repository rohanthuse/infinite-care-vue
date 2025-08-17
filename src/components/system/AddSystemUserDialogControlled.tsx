import React, { useState } from 'react';
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
import { SearchableOrganizationSelect } from './SearchableOrganizationSelect';
import { Plus, Loader2 } from 'lucide-react';
import { useCreateSystemUser } from '@/hooks/useSystemUsers';
import { useOrganizations } from '@/hooks/useOrganizations';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface AddSystemUserDialogControlledProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const AddSystemUserDialogControlled: React.FC<AddSystemUserDialogControlledProps> = ({ 
  open, 
  onOpenChange 
}) => {
  const [formData, setFormData] = useState({
    email: '',
    first_name: '',
    last_name: '',
    password: '',
    confirmPassword: '',
    role: 'super_admin' as 'super_admin' | 'tenant_manager' | 'support_admin' | 'analytics_viewer',
    organization_id: '',
  });

  const [orgError, setOrgError] = useState<string | null>(null);

  const createUser = useCreateSystemUser();
  const { data: organizations, isLoading: orgLoading } = useOrganizations();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (formData.password !== formData.confirmPassword) {
      toast({
        title: "Error",
        description: "Passwords do not match",
        variant: "destructive",
      });
      return;
    }

    if (!formData.organization_id) {
      setOrgError('Please select an organization');
      return;
    }

    try {
      const newUser = await createUser.mutateAsync({
        email: formData.email,
        first_name: formData.first_name,
        last_name: formData.last_name,
        password: formData.password,
        role: formData.role,
      });

      // Assign user to an organization (required)
      try {
        const { data: assignData, error: assignError } = await supabase.functions.invoke(
          'assign-user-to-organization',
          {
            body: {
              system_user_id: newUser.id,
              organization_id: formData.organization_id,
            },
          }
        );
        if (assignError || assignData?.success === false) {
          throw new Error(assignError?.message || assignData?.error || 'Failed to assign user to organization');
        }
      } catch (err: any) {
        console.error('[AddSystemUserDialogControlled] Organization assignment failed:', err);
        toast({
          title: 'Assignment failed',
          description: err?.message || 'Could not link user to organization.',
          variant: 'destructive',
        });
        return;
      }

      // Reset form
      setFormData({
        email: '',
        first_name: '',
        last_name: '',
        password: '',
        confirmPassword: '',
        role: 'super_admin',
        organization_id: '',
      });
      setOrgError(null);
      onOpenChange(false);
    } catch (error) {
      console.error('Error creating user:', error);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData({ ...formData, [field]: value });
    if (field === 'organization_id') {
      setOrgError(null);
    }
  };

  const isFormValid = 
    formData.email && 
    formData.first_name && 
    formData.last_name && 
    formData.password && 
    formData.confirmPassword && 
    formData.password === formData.confirmPassword &&
    formData.organization_id;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Create System User</DialogTitle>
          <DialogDescription>
            Add a new organization super admin user. They will receive an email with login instructions.
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="first_name">First Name</Label>
              <Input
                id="first_name"
                type="text"
                value={formData.first_name}
                onChange={(e) => handleInputChange('first_name', e.target.value)}
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="last_name">Last Name</Label>
              <Input
                id="last_name"
                type="text"
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
            <Label htmlFor="organization">Organization</Label>
            <SearchableOrganizationSelect
              organizations={organizations || []}
              value={formData.organization_id}
              onValueChange={(value) => handleInputChange('organization_id', value)}
              isLoading={orgLoading}
              error={orgError || undefined}
            />
            {orgError && (
              <p className="text-sm text-red-500">{orgError}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="role">Role</Label>
            <Select
              value={formData.role}
              onValueChange={(value) => handleInputChange('role', value as any)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="super_admin">Super Admin</SelectItem>
                <SelectItem value="tenant_manager">Tenant Manager</SelectItem>
                <SelectItem value="support_admin">Support Admin</SelectItem>
                <SelectItem value="analytics_viewer">Analytics Viewer</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={formData.password}
                onChange={(e) => handleInputChange('password', e.target.value)}
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm Password</Label>
              <Input
                id="confirmPassword"
                type="password"
                value={formData.confirmPassword}
                onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                required
              />
            </div>
          </div>

          {formData.password && formData.confirmPassword && formData.password !== formData.confirmPassword && (
            <p className="text-sm text-red-500">Passwords do not match</p>
          )}

          <div className="flex gap-3 pt-4">
            <CustomButton
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={createUser.isPending}
            >
              Cancel
            </CustomButton>
            <CustomButton
              type="submit"
              disabled={!isFormValid || createUser.isPending}
            >
              {createUser.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <Plus className="mr-2 h-4 w-4" />
                  Create User
                </>
              )}
            </CustomButton>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
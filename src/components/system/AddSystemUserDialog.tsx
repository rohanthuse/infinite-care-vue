import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
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
import { Plus, Loader2 } from 'lucide-react';
import { useCreateSystemUser } from '@/hooks/useSystemUsers';
import { useOrganizations } from '@/hooks/useOrganizations';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface AddSystemUserDialogProps {
  children?: React.ReactNode;
}

export const AddSystemUserDialog: React.FC<AddSystemUserDialogProps> = ({ children }) => {
  const [open, setOpen] = useState(false);
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
      return;
    }

    if (!formData.email || !formData.first_name || !formData.last_name || !formData.password) {
      return;
    }

    if (!formData.organization_id) {
      setOrgError('Organization is required');
      toast({
        title: 'Organization required',
        description: 'Please select an organization.',
        variant: 'destructive',
      });
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
        console.error('[AddSystemUserDialog] Organization assignment failed:', err);
        toast({
          title: 'Assignment failed',
          description: err?.message || 'Could not link user to organization.',
          variant: 'destructive',
        });
        return;
      }
      
      setFormData({
        email: '',
        first_name: '',
        last_name: '',
        password: '',
        confirmPassword: '',
        role: 'super_admin',
        organization_id: '',
      });
      setOpen(false);
    } catch (error) {
      // Error handling is done in the hook
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (field === 'organization_id') {
      setOrgError(null);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children || (
          <CustomButton className="flex items-center space-x-2">
            <Plus className="h-4 w-4" />
            <span>Add User</span>
          </CustomButton>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px] max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add Tenant User</DialogTitle>
          <DialogDescription className="sr-only">Create a new tenant user and optionally assign to an organization.</DialogDescription>
        </DialogHeader>
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
            <Label htmlFor="organization">Organisation <span aria-hidden="true">*</span></Label>
            <Select value={formData.organization_id} onValueChange={(value) => handleInputChange('organization_id', value)}>
              <SelectTrigger aria-required="true">
                <SelectValue placeholder={orgLoading ? 'Loading...' : 'Select organisation'} />
              </SelectTrigger>
              <SelectContent>
                {organizations?.map((org) => (
                  <SelectItem key={org.id} value={org.id}>{org.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            {orgError && (
              <p className="text-sm text-destructive">{orgError}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="role">Role</Label>
            <Select value={formData.role} onValueChange={(value) => handleInputChange('role', value)}>
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
            {formData.password !== formData.confirmPassword && formData.confirmPassword && (
              <p className="text-sm text-destructive">Passwords do not match</p>
            )}
          </div>

          <div className="flex justify-end space-x-2 pt-4">
            <CustomButton
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
            >
              Cancel
            </CustomButton>
            <CustomButton
              type="submit"
              disabled={
                createUser.isPending ||
                !formData.organization_id ||
                !formData.email ||
                !formData.first_name ||
                !formData.last_name ||
                !formData.password ||
                formData.password !== formData.confirmPassword
              }
            >
              {createUser.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Create User
            </CustomButton>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
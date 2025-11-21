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
import { useOrganizationsForUserAssignment } from '@/hooks/useOrganizationsForUserAssignment';
import { SearchableOrganizationSelect } from './SearchableOrganizationSelect';
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
    organization_id: '',
  });

  const [selectedOrg, setSelectedOrg] = useState<{
    name: string;
    subscription_plan: string;
  } | null>(null);

  const [orgError, setOrgError] = useState<string | null>(null);

  const createUser = useCreateSystemUser();
  const { data: organizations, isLoading: orgLoading } = useOrganizationsForUserAssignment();
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
        role: 'super_admin', // Hardcoded - always Super Admin
      });

      // Wait for user record to be fully committed before assignment
      console.log('[AddSystemUserDialog] Waiting 800ms for user record to be committed...');
      await new Promise(resolve => setTimeout(resolve, 800));

      // Assign user to organization with retry logic
      let assignmentSuccess = false;
      let retryCount = 0;
      const maxRetries = 3;
      let lastError: Error | null = null;

      while (!assignmentSuccess && retryCount < maxRetries) {
        try {
          console.log(`[AddSystemUserDialog] Assigning user to organization (attempt ${retryCount + 1}/${maxRetries})`, {
            system_user_id: newUser.id,
            organization_id: formData.organization_id,
            role: 'super_admin',
          });
          
          const { data: assignData, error: assignError } = await supabase.functions.invoke(
            'assign-user-to-organization',
            {
              body: {
                system_user_id: newUser.id,
                organization_id: formData.organization_id,
                role: 'super_admin',
              },
              headers: {
                'Content-Type': 'application/json',
              },
            }
          );
          
          console.log('[AddSystemUserDialog] Assignment response:', { assignData, assignError });

          if (assignError) {
            throw new Error(assignError.message || 'Failed to assign user to organization');
          }

          if (!assignData?.success) {
            throw new Error(assignData?.error || 'Assignment operation returned unsuccessful');
          }

          assignmentSuccess = true;
          console.log('[AddSystemUserDialog] Organization assignment successful');
        } catch (err: any) {
          lastError = err;
          retryCount++;
          console.error(`[AddSystemUserDialog] Assignment attempt ${retryCount} failed:`, err);
          
          if (retryCount < maxRetries) {
            // Wait before retrying (exponential backoff)
            await new Promise(resolve => setTimeout(resolve, 1000 * retryCount));
          }
        }
      }

      if (!assignmentSuccess) {
        console.error('[AddSystemUserDialog] All assignment attempts failed:', lastError);
        toast({
          title: 'Assignment failed',
          description: `Could not link user to organization after ${maxRetries} attempts: ${lastError?.message || 'Unknown error'}`,
          variant: 'destructive',
        });
        
        toast({
          title: 'User created but not assigned',
          description: 'The user was created but needs manual organization assignment. Please edit the user to assign them.',
          variant: 'default',
        });
        
        setFormData({
          email: '',
          first_name: '',
          last_name: '',
          password: '',
          confirmPassword: '',
          organization_id: '',
        });
        setSelectedOrg(null);
        setOpen(false);
        return;
      }
      
      setFormData({
        email: '',
        first_name: '',
        last_name: '',
        password: '',
        confirmPassword: '',
        organization_id: '',
      });
      setSelectedOrg(null);
      setOpen(false);
    } catch (error) {
      // Error handling is done in the hook
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (field === 'organization_id') {
      setOrgError(null);
      // Find and store selected organization info
      const selectedOrganization = organizations?.find(org => org.id === value);
      if (selectedOrganization) {
        setSelectedOrg({
          name: selectedOrganization.name,
          subscription_plan: selectedOrganization.subscription_plan,
        });
      } else {
        setSelectedOrg(null);
      }
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

          <div className="bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-md p-3">
            <p className="text-sm text-blue-900 dark:text-blue-100">
              <strong>Role:</strong> Super Admin (automatically assigned)
            </p>
            <p className="text-xs text-blue-700 dark:text-blue-300 mt-1">
              Each organisation can have only one Super Admin user
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="organization">Organisation <span aria-hidden="true">*</span></Label>
            <SearchableOrganizationSelect
              organizations={organizations || []}
              value={formData.organization_id}
              onValueChange={(value) => handleInputChange('organization_id', value)}
              isLoading={orgLoading}
              error={orgError || undefined}
            />
            {orgError && (
              <p className="text-sm text-destructive">{orgError}</p>
            )}
            <p className="text-xs text-muted-foreground">
              Only organisations without an existing Super Admin are shown
            </p>
          </div>

          {organizations && organizations.length === 0 && !orgLoading && (
            <div className="bg-yellow-50 dark:bg-yellow-950 border border-yellow-200 dark:border-yellow-800 rounded-md p-3">
              <p className="text-sm text-yellow-900 dark:text-yellow-100">
                <strong>No organisations available</strong>
              </p>
              <p className="text-xs text-yellow-700 dark:text-yellow-300 mt-1">
                All organisations already have a Super Admin assigned. Create a new organisation first.
              </p>
            </div>
          )}

          {selectedOrg && (
            <div className="space-y-2">
              <Label htmlFor="subscription_plan">Subscription Plan</Label>
              <Input
                id="subscription_plan"
                value={selectedOrg.subscription_plan.charAt(0).toUpperCase() + selectedOrg.subscription_plan.slice(1).replace(/-/g, ' ')}
                disabled
                className="bg-muted cursor-not-allowed"
              />
              <p className="text-xs text-muted-foreground">
                Current plan for {selectedOrg.name}
              </p>
            </div>
          )}
          
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
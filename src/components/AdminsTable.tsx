import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useUserRole } from "@/hooks/useUserRole";
import { useTenant } from "@/contexts/TenantContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { AddAdminForm } from "./AddAdminForm";
import { EditBranchAdminDialog } from "./EditBranchAdminDialog";
import { Search, Plus, Settings, Trash2, Loader2 } from "lucide-react";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useToggleOrganizationMemberStatus } from "@/hooks/useToggleOrganizationMemberStatus";

interface AdminBranch {
  branch_id: string;
  branch_name: string;
}

interface AdminData {
  id: string;
  email: string;
  first_name?: string;
  last_name?: string;
  role: string;
  branches: AdminBranch[];
  created_at: string;
  has_permissions: boolean;
  status: 'active' | 'inactive';
}

export const AdminsTable = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [isAddFormOpen, setIsAddFormOpen] = useState(false);
  const [selectedAdmin, setSelectedAdmin] = useState<AdminData | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

  // Hook for toggling member status
  const toggleStatus = useToggleOrganizationMemberStatus();

  // Get current user authentication state with enhanced error handling
  const { data: currentUser, isLoading: authLoading, error: authError } = useUserRole();
  
  // Safely get tenant context - may not be available in system-level routes
  let organization = null;
  let tenantLoading = false;
  let tenantError = null;

  try {
    const tenantContext = useTenant();
    organization = tenantContext.organization;
    tenantLoading = tenantContext.isLoading;
    tenantError = tenantContext.error;
  } catch (error) {
    console.log('[AdminsTable] Not in tenant context, operating in system-level mode');
  }

  // Fetch branch admins filtered by organization
  const { data: admins = [], isLoading, error, refetch } = useQuery({
    queryKey: ['branch-admins', currentUser?.id, organization?.id],
    queryFn: async () => {
      if (!organization?.id) {
        console.log('No organization context available');
        return [];
      }

      console.log('Fetching branch admins for organization:', { 
        organizationId: organization.id, 
        organizationName: organization.name 
      });
      
      // Get admin branches filtered by organization
      const query = supabase
        .from('admin_branches')
        .select(`
          admin_id,
          branch_id,
          branches!inner(
            id,
            name,
            organization_id
          )
        `)
        .eq('branches.organization_id', organization.id);
      
      const { data: adminBranches, error: branchError } = await query;

      if (branchError) {
        console.error('Error fetching admin branches:', branchError);
        throw branchError;
      }

      console.log('Admin branches data:', adminBranches);

      if (!adminBranches || adminBranches.length === 0) {
        console.log('No admin branches found');
        return [];
      }

      // Get admin IDs for separate profile query
      const adminIds = adminBranches.map(ab => ab.admin_id);
      
      // Fetch profiles separately to avoid RLS conflicts with complex joins
      const { data: profiles, error: profileError } = await supabase
        .from('profiles')
        .select('id, email, first_name, last_name')
        .in('id', adminIds);

      if (profileError) {
        console.error('Error fetching profiles:', profileError);
        // Don't throw here, continue with available data
        console.warn('Continuing without profile data');
      }

      console.log('Profiles data:', profiles);

      // Get admin permissions
      const { data: permissions } = await supabase
        .from('admin_permissions')
        .select('admin_id')
        .in('admin_id', adminIds);

      console.log('Admin permissions data:', permissions);

      // Fetch organization member status for each admin
      const { data: memberStatuses } = await supabase
        .from('organization_members')
        .select('user_id, status')
        .eq('organization_id', organization.id)
        .in('user_id', adminIds);

      console.log('Member statuses:', memberStatuses);

      // Group admins by their ID to avoid duplicates
      const adminMap = new Map<string, AdminData>();

      adminBranches.forEach((item: any) => {
        const profile = profiles?.find(p => p.id === item.admin_id);
        const adminId = item.admin_id;
        const memberStatus = memberStatuses?.find(m => m.user_id === adminId);
        
        if (adminMap.has(adminId)) {
          // Add branch to existing admin
          const existingAdmin = adminMap.get(adminId)!;
          existingAdmin.branches.push({
            branch_id: item.branch_id,
            branch_name: item.branches?.name || 'No Branch'
          });
        } else {
          // Create new admin entry
          adminMap.set(adminId, {
            id: adminId,
            email: profile?.email || 'Unknown',
            first_name: profile?.first_name,
            last_name: profile?.last_name,
            role: 'branch_admin',
            branches: [{
              branch_id: item.branch_id,
              branch_name: item.branches?.name || 'No Branch'
            }],
            created_at: new Date().toISOString(),
            has_permissions: permissions?.some(p => p.admin_id === adminId) || false,
            status: (memberStatus?.status as 'active' | 'inactive') || 'active',
          });
        }
      });

      const transformedData = Array.from(adminMap.values());
      console.log(`Grouped admin data for organization: ${organization?.name}:`, transformedData);
      return transformedData;
    },
    enabled: !!currentUser && !!organization?.id && (currentUser.role === 'super_admin' || currentUser.role === 'branch_admin'),
    retry: 3,
    retryDelay: 1000,
  });

  const handleDeleteAdmin = async (adminId: string) => {
    try {
      // Use the comprehensive deletion function that removes ALL admin data
      const { data, error } = await supabase.rpc('delete_admin_completely', {
        admin_user_id: adminId
      });

      if (error) {
        console.error('Error calling delete_admin_completely:', error);
        throw error;
      }

      // Check the function response
      const result = data as any; // Type assertion for function response
      if (result?.success) {
        toast.success(`Admin deleted completely - email ${result.admin_email} is now available for reuse`);
        refetch();
      } else {
        console.error('Delete function returned error:', result);
        throw new Error(result?.error || 'Unknown error during deletion');
      }
    } catch (error: any) {
      console.error('Delete admin error:', error);
      toast.error("Failed to delete admin: " + error.message);
    }
  };

  const filteredAdmins = admins.filter((admin) =>
    admin.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    `${admin.first_name} ${admin.last_name}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
    admin.branches.some(branch => branch.branch_name.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  // Show loading while authenticating, loading tenant context, or fetching data
  const isLoadingData = authLoading || tenantLoading || isLoading;

  // Show tenant error with debugging info
  if (tenantError && !tenantLoading) {
    return (
      <div className="p-4 text-center space-y-4">
        <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4">
          <h3 className="text-destructive font-medium mb-2">Organisation Context Error</h3>
          <p className="text-destructive/90 text-sm mb-3">{tenantError.message}</p>
          <details className="text-left">
            <summary className="text-destructive/80 cursor-pointer text-sm font-medium">Show Debug Info</summary>
            <div className="mt-2 text-xs text-destructive/80 bg-destructive/5 p-2 rounded border font-mono">
              Unable to load organisation context. Check console for details.
            </div>
          </details>
        </div>
        <Button 
          onClick={() => window.location.reload()} 
          variant="outline"
          className="border-destructive/30 text-destructive hover:bg-destructive/10"
        >
          Refresh Page
        </Button>
      </div>
    );
  }

  // Show authentication error with debugging info
  if (authError && !authLoading) {
    return (
      <div className="p-4 text-center space-y-4">
        <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4">
          <h3 className="text-destructive font-medium mb-2">Authentication Error</h3>
          <p className="text-destructive/90 text-sm mb-3">{authError.message}</p>
          <details className="text-left">
            <summary className="text-destructive/80 cursor-pointer text-sm font-medium">Show Debug Info</summary>
            <div className="mt-2 text-xs text-destructive/80 bg-destructive/5 p-2 rounded border font-mono">
              Open browser console (F12) to see detailed debugging information.
            </div>
          </details>
        </div>
        <Button 
          onClick={() => window.location.reload()} 
          variant="outline"
          className="border-destructive/30 text-destructive hover:bg-destructive/10"
        >
          Refresh Page
        </Button>
      </div>
    );
  }

  // Show authentication message if not authenticated
  if (!authLoading && (!currentUser || (currentUser.role !== 'super_admin' && currentUser.role !== 'branch_admin'))) {
    return (
      <div className="p-4 text-center space-y-4">
        <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-4">
          <h3 className="text-yellow-700 dark:text-yellow-400 font-medium mb-2">Access Denied</h3>
          <p className="text-yellow-600 dark:text-yellow-300">You need admin privileges to view this page.</p>
          {currentUser && (
            <div className="mt-2 text-sm text-yellow-600 dark:text-yellow-300">
              Current role: <code className="bg-yellow-500/10 px-1 rounded">{currentUser.role}</code>
            </div>
          )}
        </div>
        <Button 
          onClick={() => window.location.href = '/'} 
          variant="outline"
        >
          Return to Dashboard
        </Button>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 text-center">
        <p className="text-destructive">Error loading admins: {error.message}</p>
        <Button onClick={() => refetch()} className="mt-2">
          Try Again
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder="Search admins..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Button
          onClick={() => setIsAddFormOpen(true)}
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Branch Admin
        </Button>
      </div>

      {/* Table */}
      <div className="border border-border rounded-lg overflow-hidden bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Branch</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Permissions</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoadingData ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8">
                  <div className="flex items-center justify-center">
                    <Loader2 className="h-6 w-6 animate-spin mr-2" />
                    {authLoading ? "Authenticating..." : "Loading admins..."}
                  </div>
                </TableCell>
              </TableRow>
            ) : filteredAdmins.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                  {searchTerm ? "No admins match your search." : 
                   organization?.name ? `No branch admins found for ${organization.name}.` : 
                   "No branch admins found."}
                </TableCell>
              </TableRow>
            ) : (
              filteredAdmins.map((admin) => (
                <TableRow key={admin.id}>
                  <TableCell className="font-medium">
                    {admin.first_name && admin.last_name
                      ? `${admin.first_name} ${admin.last_name}`
                      : 'N/A'}
                  </TableCell>
                  <TableCell>{admin.email}</TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {admin.branches.map((branch, index) => (
                        <Badge key={branch.branch_id} variant="outline" className="text-xs">
                          {branch.branch_name}
                        </Badge>
                      ))}
                      {admin.branches.length > 1 && (
                        <Badge variant="info" className="text-xs ml-1">
                          {admin.branches.length} branches
                        </Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary" className="capitalize">
                      {admin.role.replace('_', ' ')}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge 
                      variant={admin.has_permissions ? "default" : "destructive"}
                      className="text-xs"
                    >
                      {admin.has_permissions ? "Configured" : "Not Set"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={admin.status === 'active'}
                        onCheckedChange={() => {
                          toggleStatus.mutate({
                            userId: admin.id,
                            currentStatus: admin.status,
                          }, {
                            onSuccess: () => refetch()
                          });
                        }}
                        disabled={toggleStatus.isPending}
                      />
                      <Badge 
                        variant={admin.status === 'active' ? "success" : "destructive"}
                        className="text-xs"
                      >
                        {admin.status === 'active' ? 'Active' : 'Inactive'}
                      </Badge>
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setSelectedAdmin(admin);
                          setIsEditDialogOpen(true);
                        }}
                      >
                        <Settings className="h-4 w-4" />
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="outline" size="sm">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete Admin</AlertDialogTitle>
                            <AlertDialogDescription>
                              Are you sure you want to delete this admin? This action cannot be undone.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => handleDeleteAdmin(admin.id)}
                              className="bg-destructive hover:bg-destructive/90"
                            >
                              Delete
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Add Admin Form */}
      <AddAdminForm
        isOpen={isAddFormOpen}
        onClose={() => setIsAddFormOpen(false)}
        onAdminAdded={() => {
          refetch();
          setIsAddFormOpen(false);
        }}
      />

      {/* Edit Branch Admin Dialog */}
      {selectedAdmin && (
        <EditBranchAdminDialog
          isOpen={isEditDialogOpen}
          onClose={() => {
            setIsEditDialogOpen(false);
            setSelectedAdmin(null);
          }}
          adminId={selectedAdmin.id}
          adminName={selectedAdmin.first_name && selectedAdmin.last_name 
            ? `${selectedAdmin.first_name} ${selectedAdmin.last_name}` 
            : selectedAdmin.email}
          adminEmail={selectedAdmin.email}
          currentBranches={selectedAdmin.branches}
          onSave={() => refetch()}
        />
      )}
    </div>
  );
};

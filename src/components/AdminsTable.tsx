
import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useUserRole } from "@/hooks/useUserRole";
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
import { AddAdminForm } from "./AddAdminForm";
import { EditAdminPermissionsDialog } from "./EditAdminPermissionsDialog";
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

interface AdminData {
  id: string;
  email: string;
  first_name?: string;
  last_name?: string;
  role: string;
  branch_name?: string;
  branch_id?: string;
  created_at: string;
  has_permissions: boolean;
}

export const AdminsTable = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [isAddFormOpen, setIsAddFormOpen] = useState(false);
  const [selectedAdmin, setSelectedAdmin] = useState<AdminData | null>(null);
  const [isPermissionsDialogOpen, setIsPermissionsDialogOpen] = useState(false);

  // Get current user authentication state with enhanced error handling
  const { data: currentUser, isLoading: authLoading, error: authError } = useUserRole();

  // Fetch all branch admins with proper authentication dependency
  const { data: admins = [], isLoading, error, refetch } = useQuery({
    queryKey: ['branch-admins', currentUser?.id],
    queryFn: async () => {
      console.log('Fetching branch admins...', { currentUser });
      
      // First, get admin branches - this is much simpler and avoids RLS conflicts
      const { data: adminBranches, error: branchError } = await supabase
        .from('admin_branches')
        .select(`
          admin_id,
          branch_id,
          branches(
            id,
            name
          )
        `);

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

      // Transform and combine data
      const transformedData: AdminData[] = adminBranches.map((item: any) => {
        const profile = profiles?.find(p => p.id === item.admin_id);
        return {
          id: item.admin_id,
          email: profile?.email || 'Unknown',
          first_name: profile?.first_name,
          last_name: profile?.last_name,
          role: 'branch_admin',
          branch_name: item.branches?.name || 'No Branch',
          branch_id: item.branch_id,
          created_at: new Date().toISOString(),
          has_permissions: permissions?.some(p => p.admin_id === item.admin_id) || false,
        };
      });

      console.log('Transformed admin data:', transformedData);
      return transformedData;
    },
    enabled: !!currentUser && (currentUser.role === 'super_admin' || currentUser.role === 'branch_admin'),
    retry: 3,
    retryDelay: 1000,
  });

  const handleDeleteAdmin = async (adminId: string) => {
    try {
      // Delete admin permissions first
      const { error: permissionsError } = await supabase
        .from('admin_permissions')
        .delete()
        .eq('admin_id', adminId);

      if (permissionsError) {
        console.error('Error deleting admin permissions:', permissionsError);
      }

      // Delete admin-branch association
      const { error: branchError } = await supabase
        .from('admin_branches')
        .delete()
        .eq('admin_id', adminId);

      if (branchError) {
        console.error('Error deleting admin-branch association:', branchError);
      }

      // Delete user role
      const { error: roleError } = await supabase
        .from('user_roles')
        .delete()
        .eq('user_id', adminId)
        .eq('role', 'branch_admin');

      if (roleError) {
        console.error('Error deleting user role:', roleError);
        throw roleError;
      }

      toast.success("Admin deleted successfully");
      refetch();
    } catch (error: any) {
      console.error('Delete admin error:', error);
      toast.error("Failed to delete admin: " + error.message);
    }
  };

  const filteredAdmins = admins.filter((admin) =>
    admin.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    `${admin.first_name} ${admin.last_name}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
    admin.branch_name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Show loading while authenticating or fetching data
  const isLoadingData = authLoading || isLoading;

  // Show authentication error with debugging info
  if (authError && !authLoading) {
    return (
      <div className="p-4 text-center space-y-4">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <h3 className="text-red-800 font-medium mb-2">Authentication Error</h3>
          <p className="text-red-700 text-sm mb-3">{authError.message}</p>
          <details className="text-left">
            <summary className="text-red-600 cursor-pointer text-sm font-medium">Show Debug Info</summary>
            <div className="mt-2 text-xs text-red-600 bg-red-100 p-2 rounded border font-mono">
              Open browser console (F12) to see detailed debugging information.
            </div>
          </details>
        </div>
        <Button 
          onClick={() => window.location.reload()} 
          variant="outline"
          className="border-red-300 text-red-700 hover:bg-red-50"
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
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <h3 className="text-yellow-800 font-medium mb-2">Access Denied</h3>
          <p className="text-yellow-700">You need admin privileges to view this page.</p>
          {currentUser && (
            <div className="mt-2 text-sm text-yellow-600">
              Current role: <code className="bg-yellow-100 px-1 rounded">{currentUser.role}</code>
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
        <p className="text-red-600">Error loading admins: {error.message}</p>
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
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder="Search admins..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Button
          onClick={() => setIsAddFormOpen(true)}
          className="bg-blue-600 hover:bg-blue-700"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Admin
        </Button>
      </div>

      {/* Table */}
      <div className="border rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Branch</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Permissions</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoadingData ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8">
                  <div className="flex items-center justify-center">
                    <Loader2 className="h-6 w-6 animate-spin mr-2" />
                    {authLoading ? "Authenticating..." : "Loading admins..."}
                  </div>
                </TableCell>
              </TableRow>
            ) : filteredAdmins.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-gray-500">
                  {searchTerm ? "No admins match your search." : "No admins found."}
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
                    <span className="text-sm font-medium">
                      {admin.branch_name}
                    </span>
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
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setSelectedAdmin(admin);
                          setIsPermissionsDialogOpen(true);
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
                              className="bg-red-600 hover:bg-red-700"
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

      {/* Edit Permissions Dialog */}
      {selectedAdmin && (
        <EditAdminPermissionsDialog
          isOpen={isPermissionsDialogOpen}
          onClose={() => {
            setIsPermissionsDialogOpen(false);
            setSelectedAdmin(null);
            refetch(); // Refetch data when dialog closes
          }}
          adminId={selectedAdmin.id}
          branchId={selectedAdmin.branch_id || ''}
          adminName={selectedAdmin.first_name && selectedAdmin.last_name 
            ? `${selectedAdmin.first_name} ${selectedAdmin.last_name}` 
            : selectedAdmin.email}
        />
      )}
    </div>
  );
};

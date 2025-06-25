
import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
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

  // Fetch all branch admins using the proven working pattern from client messaging
  const { data: admins = [], isLoading, error, refetch } = useQuery({
    queryKey: ['branch-admins'],
    queryFn: async () => {
      console.log('Fetching branch admins...');
      
      // Use the same proven pattern as in useClientMessaging.ts
      const { data: adminBranches, error } = await supabase
        .from('admin_branches')
        .select(`
          admin_id,
          branch_id,
          branches(
            id,
            name
          ),
          profiles!inner(
            id,
            email,
            first_name,
            last_name
          )
        `);

      if (error) {
        console.error('Error fetching admin branches:', error);
        throw error;
      }

      console.log('Raw admin branches data:', adminBranches);

      // Get admin permissions for each admin
      const adminIds = adminBranches?.map(ab => ab.admin_id) || [];
      const { data: permissions } = await supabase
        .from('admin_permissions')
        .select('admin_id')
        .in('admin_id', adminIds);

      console.log('Admin permissions data:', permissions);

      const transformedData: AdminData[] = (adminBranches || []).map((item: any) => ({
        id: item.admin_id,
        email: item.profiles.email,
        first_name: item.profiles.first_name,
        last_name: item.profiles.last_name,
        role: 'branch_admin', // We know they're branch admins since they're in admin_branches
        branch_name: item.branches?.name || 'No Branch',
        branch_id: item.branch_id,
        created_at: new Date().toISOString(), // We don't have this field, using current date
        has_permissions: permissions?.some(p => p.admin_id === item.admin_id) || false,
      }));

      console.log('Transformed admin data:', transformedData);
      return transformedData;
    },
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
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8">
                  <div className="flex items-center justify-center">
                    <Loader2 className="h-6 w-6 animate-spin mr-2" />
                    Loading admins...
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

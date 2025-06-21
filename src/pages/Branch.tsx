import React, { useState } from "react";
import { DashboardHeader } from "@/components/DashboardHeader";
import { DashboardNavbar } from "@/components/DashboardNavbar";
import { ParameterTable } from "@/components/ParameterTable";
import { Building2, Eye, Loader2, Pencil, Trash2 } from "lucide-react";
import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { AddBranchDialog } from "@/components/AddBranchDialog";
import { EditBranchDialog } from "@/components/EditBranchDialog";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { cn } from "@/lib/utils";
import { format } from 'date-fns';
import { useAuth } from "@/hooks/useAuth";

// Define a comprehensive Branch type to work around outdated generated types
export type Branch = {
    id: string;
    created_at: string;
    name: string;
    country: string;
    currency: string;
    regulatory: string;
    branch_type: string;
    created_by: string | null;
    status: string;
    updated_at: string;
};

const fetchBranches = async (searchQuery: string): Promise<Branch[]> => {
    console.log('Fetching branches with query:', searchQuery);
    let query = supabase.from('branches').select('*').order('name');
    if (searchQuery) {
        query = query.or(`name.ilike.%${searchQuery}%,country.ilike.%${searchQuery}%,branch_type.ilike.%${searchQuery}%,regulatory.ilike.%${searchQuery}%`);
    }
    const { data, error } = await query;
    if (error) {
        console.error('Error fetching branches:', error);
        throw error;
    }
    console.log('Fetched branches:', data);
    return data as Branch[];
};

const Branch = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const { session, loading: authLoading, error: authError } = useAuth();

  const { data: branches, isLoading, error } = useQuery({
      queryKey: ['branches', searchQuery],
      queryFn: () => fetchBranches(searchQuery),
      enabled: !!session, // Only run query when user is authenticated
  });

  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedBranch, setSelectedBranch] = useState<Branch | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<Branch | null>(null);

  const { mutate: deleteBranch, isPending: isDeleting } = useMutation({
    mutationFn: async (id: string) => {
      console.log('Deleting branch with id:', id);
      const { error } = await supabase.from('branches').delete().eq('id', id);
      if (error) {
        console.error('Error deleting branch:', error);
        throw error;
      }
    },
    onSuccess: () => {
      toast({ title: "Branch deleted successfully" });
      queryClient.invalidateQueries({ queryKey: ['branches'] });
      setIsDeleteDialogOpen(false);
      setItemToDelete(null);
    },
    onError: (error: any) => {
      console.error('Delete branch error:', error);
      toast({ title: "Failed to delete branch", description: error.message, variant: "destructive" });
    },
  });

  const handleViewBranchDetails = (branchId: string) => {
    console.log('Navigating to branch details:', branchId);
    navigate(`/branch-details/${branchId}`);
  };

  const handleEdit = (branch: Branch) => {
    console.log('Editing branch:', branch);
    setSelectedBranch(branch);
    setIsEditDialogOpen(true);
  };

  const handleDeleteRequest = (branch: Branch) => {
    console.log('Delete request for branch:', branch);
    setItemToDelete(branch);
    setIsDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (itemToDelete) {
      console.log('Confirming delete for branch:', itemToDelete.id);
      deleteBranch(itemToDelete.id);
    }
  };
  
  const columns = [
    {
      header: "Title",
      accessorKey: "name",
      enableSorting: true,
      className: "font-medium text-gray-800 w-[25%]",
    },
    {
      header: "Country",
      accessorKey: "country",
      enableSorting: true,
      className: "text-gray-700 w-[10%]",
    },
    {
      header: "Currency",
      accessorKey: "currency",
      enableSorting: true,
      className: "text-gray-700 w-[10%]",
    },
    {
      header: "Regulatory",
      accessorKey: "regulatory",
      enableSorting: true,
      className: "text-gray-700 w-[10%]",
    },
    {
      header: "Branch Type",
      accessorKey: "branch_type",
      enableSorting: true,
      className: "text-gray-700 w-[10%]",
    },
    {
      header: "Created On",
      accessorKey: "created_at",
      enableSorting: true,
      className: "text-gray-700 w-[10%]",
      cell: ({ row }: { row: { original: Branch } }) => row.original.created_at ? format(new Date(row.original.created_at), 'dd/MM/yyyy') : '',
    },
    {
      header: "Created By",
      accessorKey: "created_by",
      enableSorting: true,
      className: "text-gray-700 w-[10%]",
    },
    {
      header: "Status",
      accessorKey: "status",
      enableSorting: true,
      className: "w-[10%]",
      cell: ({ row }: { row: { original: Branch } }) => (
        <Badge className={cn(
            "font-medium border-0 rounded-full px-3",
            row.original.status === "Active"
              ? "bg-green-100 text-green-800 hover:bg-green-200/80"
              : "bg-red-100 text-red-800 hover:bg-red-200/80"
          )}>
          {row.original.status}
        </Badge>
      ),
    },
    {
      header: "Actions",
      id: "actions",
      className: "w-[15%] text-right",
      cell: ({ row }: { row: { original: Branch } }) => {
        const branch = row.original;
        return (
          <div className="flex items-center justify-end gap-1">
            <Button
              variant="ghost"
              size="sm"
              className="text-blue-600 hover:text-blue-800 hover:bg-blue-50"
              onClick={() => handleViewBranchDetails(branch.id)}
            >
              <Eye className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="text-gray-600 hover:text-gray-800 hover:bg-gray-100"
              onClick={() => handleEdit(branch)}
            >
              <Pencil className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="text-red-600 hover:text-red-800 hover:bg-red-50"
              onClick={() => handleDeleteRequest(branch)}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
      )},
    },
  ];

  // Add console logs to debug the issue
  console.log('Branch component rendering...');
  console.log('Auth loading:', authLoading);
  console.log('Auth error:', authError);
  console.log('Session:', session?.user?.email || 'No session');
  console.log('IsLoading:', isLoading);
  console.log('Query Error:', error);
  console.log('Branches data:', branches);

  // Handle authentication loading
  if (authLoading) {
    console.log('Showing auth loading state');
    return (
      <div className="min-h-screen flex flex-col bg-gradient-to-br from-gray-50 to-white">
        <DashboardHeader />
        <DashboardNavbar />
        <main className="flex-1 flex items-center justify-center">
          <div className="flex flex-col items-center gap-4">
            <Loader2 className="h-12 w-12 animate-spin text-blue-600" />
            <p className="text-gray-600">Checking authentication...</p>
          </div>
        </main>
      </div>
    );
  }

  // Handle authentication error
  if (authError) {
    console.log('Showing auth error state:', authError);
    return (
      <div className="min-h-screen flex flex-col bg-gradient-to-br from-gray-50 to-white">
        <DashboardHeader />
        <DashboardNavbar />
        <main className="flex-1 flex items-center justify-center bg-red-50">
          <div className="text-center p-8">
            <h2 className="text-xl font-semibold text-red-700 mb-2">Authentication Error</h2>
            <p className="text-red-600 mb-4">{authError}</p>
            <button 
              onClick={() => navigate('/super-admin-login')}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Go to Login
            </button>
          </div>
        </main>
      </div>
    );
  }

  // Handle no session
  if (!session) {
    console.log('No session, redirecting to login');
    navigate('/super-admin-login');
    return null;
  }

  if (isLoading && !branches) {
    console.log('Showing loading state');
    return (
      <div className="min-h-screen flex flex-col bg-gradient-to-br from-gray-50 to-white">
        <DashboardHeader />
        <DashboardNavbar />
        <main className="flex-1 flex items-center justify-center">
            <Loader2 className="h-12 w-12 animate-spin text-blue-600" />
        </main>
      </div>
    );
  }

  if (error) {
    console.error('Showing error state:', error);
    return (
      <div className="min-h-screen flex flex-col bg-gradient-to-br from-gray-50 to-white">
        <DashboardHeader />
        <DashboardNavbar />
        <main className="flex-1 flex items-center justify-center bg-red-50">
          <div className="text-center p-8">
            <h2 className="text-xl font-semibold text-red-700 mb-2">Error Loading Branches</h2>
            <p className="text-red-600 mb-4">{error.message}</p>
            {error.message.includes('JWT') && (
              <p className="text-sm text-red-500 mb-4">
                This appears to be an authentication issue. Please try logging in again.
              </p>
            )}
            <div className="space-x-2">
              <button 
                onClick={() => queryClient.invalidateQueries({ queryKey: ['branches'] })}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                Retry
              </button>
              <button 
                onClick={() => navigate('/super-admin-login')}
                className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
              >
                Login Again
              </button>
            </div>
          </div>
        </main>
      </div>
    );
  }
  
  console.log('Rendering main branch content with', branches?.length, 'branches');
  
  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-gray-50 to-white">
      <DashboardHeader />
      <DashboardNavbar />
      
      <motion.main 
        className="flex-1 px-4 md:px-8 py-6 md:py-8 w-full"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <ParameterTable 
          title="Branch"
          icon={<Building2 className="h-7 w-7 text-blue-600" />}
          columns={columns}
          data={branches || []}
          onSearch={setSearchQuery}
          searchPlaceholder="Search branches..."
          addButton={<AddBranchDialog />}
        />
      </motion.main>

      <EditBranchDialog
        isOpen={isEditDialogOpen}
        onClose={() => setIsEditDialogOpen(false)}
        branch={selectedBranch}
      />

      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the branch "{itemToDelete?.name}".
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} disabled={isDeleting} className="bg-red-600 hover:bg-red-700">
              {isDeleting ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Deleting...</> : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default Branch;

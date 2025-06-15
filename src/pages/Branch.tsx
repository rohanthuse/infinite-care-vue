
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
import { Tables } from "@/integrations/supabase/types";
import { cn } from "@/lib/utils";
import { format } from 'date-fns';

const fetchBranches = async (searchQuery: string) => {
    let query = supabase.from('branches').select('*').order('name');
    if (searchQuery) {
        query = query.or(`name.ilike.%${searchQuery}%,country.ilike.%${searchQuery}%,branch_type.ilike.%${searchQuery}%,regulatory.ilike.%${searchQuery}%`);
    }
    const { data, error } = await query;
    if (error) throw error;
    return data;
};

type BranchRow = Tables<'branches'> & {
    title: string;
    branchType: string;
    createdOn: string;
    createdBy: string | null;
}

const Branch = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");

  const { data: branches, isLoading, error } = useQuery({
      queryKey: ['branches', searchQuery],
      queryFn: () => fetchBranches(searchQuery),
  });

  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedBranch, setSelectedBranch] = useState<Tables<'branches'> | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<Tables<'branches'> | null>(null);

  const { mutate: deleteBranch, isPending: isDeleting } = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('branches').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast({ title: "Branch deleted successfully" });
      queryClient.invalidateQueries({ queryKey: ['branches'] });
      setIsDeleteDialogOpen(false);
      setItemToDelete(null);
    },
    onError: (error: any) => {
      toast({ title: "Failed to delete branch", description: error.message, variant: "destructive" });
    },
  });

  const handleViewBranchDetails = (branchId: string) => {
    navigate(`/branch-details/${branchId}`);
  };

  const handleEdit = (branch: Tables<'branches'>) => {
    setSelectedBranch(branch);
    setIsEditDialogOpen(true);
  };

  const handleDeleteRequest = (branch: Tables<'branches'>) => {
    setItemToDelete(branch);
    setIsDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (itemToDelete) {
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
      accessorKey: "created_on",
      enableSorting: true,
      className: "text-gray-700 w-[10%]",
      cell: (value: string) => value ? format(new Date(value), 'dd/MM/yyyy') : '',
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
      cell: (value: string) => (
        <Badge className={cn(
            "font-medium border-0 rounded-full px-3",
            value === "Active"
              ? "bg-green-100 text-green-800 hover:bg-green-200/80"
              : "bg-red-100 text-red-800 hover:bg-red-200/80"
          )}>
          {value}
        </Badge>
      ),
    },
    {
      header: "Actions",
      id: "actions",
      className: "w-[15%] text-right",
      cell: ({ row }: { row: { original: BranchRow } }) => {
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

  if (isLoading && !branches) {
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
    return (
      <div className="min-h-screen flex flex-col bg-gradient-to-br from-gray-50 to-white">
        <DashboardHeader />
        <DashboardNavbar />
        <main className="flex-1 flex items-center justify-center bg-red-50 text-red-700">
          Error loading data: {error.message}
        </main>
      </div>
    );
  }
  
  const mappedData = branches?.map(branch => ({
    ...branch,
    title: branch.name,
    branchType: branch.branch_type,
    createdOn: branch.created_on,
    createdBy: branch.created_by,
  })) || [];


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
          data={mappedData}
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

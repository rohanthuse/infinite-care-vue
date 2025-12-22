import React, { useState } from "react";
import { DashboardHeader } from "@/components/DashboardHeader";
import { DashboardNavbar } from "@/components/DashboardNavbar";
import { ParameterTable, ParameterItem } from "@/components/ParameterTable";
import { Briefcase, Loader2, Library } from "lucide-react";
import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { AddWorkTypeDialog } from "@/components/AddWorkTypeDialog";
import { EditWorkTypeDialog } from "@/components/EditWorkTypeDialog";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { AdoptSystemTemplatesDialog } from "@/components/system-templates/AdoptSystemTemplatesDialog";
import { useAvailableSystemWorkTypes, useAdoptedTemplates, useAdoptSystemWorkTypes } from "@/hooks/useAdoptSystemTemplates";
import { CustomButton } from "@/components/ui/CustomButton";
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
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { useTenant } from "@/contexts/TenantContext";

const TypeOfWork = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { organization } = useTenant();
  const [showAdoptDialog, setShowAdoptDialog] = useState(false);
  
  const { data: systemWorkTypes = [], isLoading: isLoadingSystem } = useAvailableSystemWorkTypes();
  const { data: adoptedIds = [] } = useAdoptedTemplates('work_types');
  const { mutate: adoptWorkTypes, isPending: isAdopting } = useAdoptSystemWorkTypes();
  
  const { data: workTypes, isLoading, error } = useQuery({
    queryKey: ['work_types', organization?.id],
    queryFn: async () => {
      if (!organization?.id) return [];
      const { data, error } = await supabase
        .from('work_types')
        .select('*')
        .eq('organization_id', organization.id)
        .order('title');
      if (error) throw error;
      return data;
    },
    enabled: !!organization?.id,
  });

  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedWorkType, setSelectedWorkType] = useState<ParameterItem | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<ParameterItem | null>(null);

  const { mutate: deleteWorkType, isPending: isDeleting } = useMutation({
    mutationFn: async (id: string | number) => {
      const { error } = await supabase.from('work_types').delete().eq('id', String(id));
      if (error) throw error;
    },
    onSuccess: () => {
      // Close confirmation first
      setIsDeleteDialogOpen(false);
      setItemToDelete(null);

      toast({ title: "Work Type deleted successfully" });

      // Clean up document body to prevent UI freeze
      document.body.style.pointerEvents = '';
      document.body.removeAttribute('data-scroll-locked');

      // Delay invalidation to avoid focus/aria-hidden race conditions
      setTimeout(() => {
        queryClient.invalidateQueries({ queryKey: ['work_types', organization?.id] });
      }, 300);
    },
    onError: (error: any) => {
      // Ensure dialog closes on error as well
      setIsDeleteDialogOpen(false);
      setItemToDelete(null);
      
      // Clean up document body on error too
      document.body.style.pointerEvents = '';
      document.body.removeAttribute('data-scroll-locked');
      
      toast({ title: "Failed to delete Work Type", description: error.message, variant: "destructive" });
    },
  });

  const handleEdit = (item: ParameterItem) => {
    setSelectedWorkType(item);
    setIsEditDialogOpen(true);
  };

  const handleDeleteRequest = (item: ParameterItem) => {
    setItemToDelete(item);
    setIsDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (itemToDelete) {
      deleteWorkType(itemToDelete.id);
    }
  };

  const columns = [
    {
      header: "Title",
      accessorKey: "title",
      enableSorting: true,
      className: "font-medium text-gray-800 w-[60%]",
    },
    {
      header: "Status",
      accessorKey: "status",
      enableSorting: true,
      className: "w-[40%]",
      cell: ({ row }: { row: { original: ParameterItem } }) => (
        <Badge
          className={cn(
            "font-medium border-0 rounded-full px-3",
            row.original.status === "Active"
              ? "bg-green-100 text-green-800 hover:bg-green-200/80"
              : "bg-red-100 text-red-800 hover:bg-red-200/80"
          )}
        >
          {row.original.status}
        </Badge>
      ),
    },
  ];

  if (isLoading) {
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
          title="Type of Work"
          icon={<Briefcase className="h-7 w-7 text-blue-600" />}
          columns={columns}
          data={workTypes || []}
          searchPlaceholder="Search work types..."
          addButton={
            <div className="flex gap-2">
              <CustomButton 
                variant="outline" 
                className="border-border hover:bg-accent"
                onClick={() => setShowAdoptDialog(true)}
              >
                <Library className="mr-1.5 h-4 w-4" /> Import from System
              </CustomButton>
              <AddWorkTypeDialog />
            </div>
          }
          onEdit={handleEdit}
          onDelete={handleDeleteRequest}
        />

        <AdoptSystemTemplatesDialog
          isOpen={showAdoptDialog}
          onClose={() => setShowAdoptDialog(false)}
          title="Import System Work Types"
          description="Select work types from the system library to add to your organization."
          templates={systemWorkTypes.map(w => ({ id: w.id, title: w.title, status: w.status }))}
          adoptedIds={adoptedIds}
          isLoading={isLoadingSystem}
          isAdopting={isAdopting}
          onAdopt={(selected) => {
            adoptWorkTypes(selected as any);
            setShowAdoptDialog(false);
          }}
          displayField="title"
        />
      </motion.main>

      <EditWorkTypeDialog
        isOpen={isEditDialogOpen}
        onClose={() => setIsEditDialogOpen(false)}
        workType={selectedWorkType}
      />
      
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={(open) => { setIsDeleteDialogOpen(open); if (!open) setItemToDelete(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the work type "{itemToDelete?.title}".
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

export default TypeOfWork;

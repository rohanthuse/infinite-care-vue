
import React, { useState } from "react";
import { DashboardHeader } from "@/components/DashboardHeader";
import { DashboardNavbar } from "@/components/DashboardNavbar";
import { ParameterTable, ParameterItem } from "@/components/ParameterTable";
import { ActivitySquare, Loader2, Library } from "lucide-react";
import { motion } from "framer-motion";
import { AddBodyMapPointDialog } from "@/components/AddBodyMapPointDialog";
import { EditBodyMapPointDialog } from "@/components/EditBodyMapPointDialog";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { AdoptSystemTemplatesDialog } from "@/components/system-templates/AdoptSystemTemplatesDialog";
import { useAvailableSystemBodyMapPoints, useAdoptedTemplates, useAdoptSystemBodyMapPoints } from "@/hooks/useAdoptSystemTemplates";
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
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useTenant } from "@/contexts/TenantContext";

const fetchBodyMapPoints = async (organizationId?: string) => {
    if (!organizationId) return [];
    
    const { data, error } = await supabase
        .from('body_map_points')
        .select('*')
        .eq('organization_id', organizationId)
        .order('letter');
    if (error) throw error;
    return data;
};

const BodyMapPoints = () => {
  const { organization } = useTenant();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { data: bodyMapPoints, isLoading, error } = useQuery({
      queryKey: ['body_map_points', organization?.id],
      queryFn: () => fetchBodyMapPoints(organization?.id),
      enabled: !!organization?.id,
  });

  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedPoint, setSelectedPoint] = useState<ParameterItem | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<ParameterItem | null>(null);

  const { mutate: deletePoint, isPending: isDeleting } = useMutation({
    mutationFn: async (id: string | number) => {
      const { error } = await supabase.from('body_map_points').delete().eq('id', String(id));
      if (error) throw error;
    },
    onSuccess: () => {
      // Close confirmation first
      setIsDeleteDialogOpen(false);
      setItemToDelete(null);

      toast({ title: "Body Map Point deleted successfully" });

      // Clean up document body to prevent UI freeze
      document.body.style.pointerEvents = '';
      document.body.removeAttribute('data-scroll-locked');

      // Delay invalidation to avoid focus/aria-hidden race conditions
      setTimeout(() => {
        queryClient.invalidateQueries({ queryKey: ['body_map_points', organization?.id] });
      }, 300);
    },
    onError: (error: any) => {
      // Ensure dialog closes on error as well
      setIsDeleteDialogOpen(false);
      setItemToDelete(null);
      
      // Clean up document body on error too
      document.body.style.pointerEvents = '';
      document.body.removeAttribute('data-scroll-locked');
      
      toast({ title: "Failed to delete point", description: error.message, variant: "destructive" });
    },
  });
  
  const handleEdit = (item: ParameterItem) => {
    setSelectedPoint(item);
    setIsEditDialogOpen(true);
  };

  const handleDeleteRequest = (item: ParameterItem) => {
    setItemToDelete(item);
    setIsDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (itemToDelete) {
      deletePoint(itemToDelete.id);
    }
  };

  const columns = [
    {
      header: "Letter",
      accessorKey: "letter",
      enableSorting: true,
      className: "font-medium text-gray-800 w-[10%]",
    },
    {
      header: "Title",
      accessorKey: "title",
      enableSorting: true,
      className: "font-medium text-gray-800 w-[50%]",
    },
    {
      header: "Colour",
      accessorKey: "color",
      enableSorting: false,
      className: "w-[20%]",
      cell: ({ row }: { row: { original: ParameterItem } }) => (
        <div 
          className="h-6 w-12 rounded"
          style={{ backgroundColor: row.original.color }}
        ></div>
      ),
    },
    {
      header: "Status",
      accessorKey: "status",
      enableSorting: true,
      className: "w-[20%]",
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
          title="Body Map Points"
          icon={<ActivitySquare className="h-7 w-7 text-blue-600" />}
          columns={columns}
          data={bodyMapPoints || []}
          searchPlaceholder="Search body map points..."
          hasColorColumn={true}
          addButton={<AddBodyMapPointDialog />}
          onEdit={handleEdit}
          onDelete={handleDeleteRequest}
        />
      </motion.main>
      
      <EditBodyMapPointDialog
        isOpen={isEditDialogOpen}
        onClose={() => setIsEditDialogOpen(false)}
        point={selectedPoint}
      />

      <AlertDialog open={isDeleteDialogOpen} onOpenChange={(open) => { setIsDeleteDialogOpen(open); if (!open) setItemToDelete(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the body map point "{itemToDelete?.title}".
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

export default BodyMapPoints;

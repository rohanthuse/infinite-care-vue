import React, { useState } from "react";
import { DashboardHeader } from "@/components/DashboardHeader";
import { DashboardNavbar } from "@/components/DashboardNavbar";
import { ParameterTable, ParameterItem } from "@/components/ParameterTable";
import { Heart, Loader2, Library } from "lucide-react";
import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { AddHobbyDialog } from "@/components/AddHobbyDialog";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { EditHobbyDialog } from "@/components/EditHobbyDialog";
import { useToast } from "@/hooks/use-toast";
import { useTenant } from "@/contexts/TenantContext";
import { useHobbies } from "@/data/hooks/useHobbies";
import { AdoptSystemTemplatesDialog } from "@/components/system-templates/AdoptSystemTemplatesDialog";
import { useAvailableSystemHobbies, useAdoptedTemplates, useAdoptSystemHobbies } from "@/hooks/useAdoptSystemTemplates";
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

const Hobbies = () => {
  const [editingHobby, setEditingHobby] = useState<any>(null);
  const [deletingHobby, setDeletingHobby] = useState<any>(null);
  const [showAdoptDialog, setShowAdoptDialog] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { organization } = useTenant();

  const { data: hobbies, isLoading, error } = useHobbies();
  const { data: systemHobbies = [], isLoading: isLoadingSystem } = useAvailableSystemHobbies();
  const { data: adoptedIds = [] } = useAdoptedTemplates('hobbies');
  const { mutate: adoptHobbies, isPending: isAdopting } = useAdoptSystemHobbies();

  const { mutate: deleteHobby, isPending: isDeleting } = useMutation({
    mutationFn: async (hobbyId: string) => {
      const { error } = await supabase.from('hobbies').delete().eq('id', hobbyId);
      if (error) throw error;
    },
    onSuccess: () => {
      // Close confirmation first
      setDeletingHobby(null);

      toast({ title: "Hobby deleted successfully" });

      // Clean up document body to prevent UI freeze
      document.body.style.pointerEvents = '';
      document.body.removeAttribute('data-scroll-locked');

      // Delay invalidation to avoid focus/aria-hidden race conditions
      setTimeout(() => {
        queryClient.invalidateQueries({ queryKey: ['hobbies', organization?.id] });
      }, 300);
    },
    onError: (error: Error) => {
      // Ensure dialog closes on error as well
      setDeletingHobby(null);
      
      // Clean up document body on error too
      document.body.style.pointerEvents = '';
      document.body.removeAttribute('data-scroll-locked');
      
      toast({ title: "Failed to delete hobby", description: error.message, variant: "destructive" });
    }
  });
  
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
        <Badge className={`${row.original.status === 'Active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'} font-medium border-0 rounded-full px-3`}>
          {row.original.status}
        </Badge>
      ),
    },
  ];
  
  const handleEdit = (hobby: any) => {
    setEditingHobby(hobby);
  };

  const handleDelete = (hobby: any) => {
    setDeletingHobby(hobby);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col bg-gradient-to-br from-gray-50 to-white">
        <DashboardHeader />
        <DashboardNavbar />
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex flex-col bg-gradient-to-br from-gray-50 to-white">
        <DashboardHeader />
        <DashboardNavbar />
        <div className="flex-1 flex items-center justify-center text-red-500">
          Error fetching hobbies: {error.message}
        </div>
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
          title="Hobbies"
          icon={<Heart className="h-7 w-7 text-blue-600" />}
          columns={columns}
          data={hobbies || []}
          onSearch={() => {}} // Pass an empty function to enable the search input
          searchPlaceholder="Search hobbies..."
          addButton={
            <div className="flex gap-2">
              <CustomButton 
                variant="outline" 
                className="border-border hover:bg-accent"
                onClick={() => setShowAdoptDialog(true)}
              >
                <Library className="mr-1.5 h-4 w-4" /> Import from System
              </CustomButton>
              <AddHobbyDialog />
            </div>
          }
          onEdit={handleEdit}
          onDelete={handleDelete}
        />

        <AdoptSystemTemplatesDialog
          isOpen={showAdoptDialog}
          onClose={() => setShowAdoptDialog(false)}
          title="Import System Hobbies"
          description="Select hobbies from the system library to add to your organization."
          templates={systemHobbies.map(h => ({ ...h, status: h.status }))}
          adoptedIds={adoptedIds}
          isLoading={isLoadingSystem}
          isAdopting={isAdopting}
          onAdopt={(selected) => {
            adoptHobbies(selected as any);
            setShowAdoptDialog(false);
          }}
          displayField="title"
        />
      </motion.main>
      
      {editingHobby && (
        <EditHobbyDialog
          isOpen={!!editingHobby}
          onClose={() => setEditingHobby(null)}
          hobby={editingHobby}
        />
      )}

      {deletingHobby && (
        <AlertDialog open={!!deletingHobby} onOpenChange={(open) => { if (!open) setDeletingHobby(null); }}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Are you sure you want to delete this hobby?</AlertDialogTitle>
              <AlertDialogDescription>
                This action cannot be undone. This will permanently delete the hobby titled "{deletingHobby.title}".
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={() => deleteHobby(deletingHobby.id)} disabled={isDeleting}>
                {isDeleting ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Deleting...</> : 'Delete'}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </div>
  );
};

export default Hobbies;

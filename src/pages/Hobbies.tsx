
import React, { useState } from "react";
import { DashboardHeader } from "@/components/DashboardHeader";
import { DashboardNavbar } from "@/components/DashboardNavbar";
import { ParameterTable } from "@/components/ParameterTable";
import { Heart, Loader2 } from "lucide-react";
import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { AddHobbyDialog } from "@/components/AddHobbyDialog";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { EditHobbyDialog } from "@/components/EditHobbyDialog";
import { useToast } from "@/hooks/use-toast";
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

const fetchHobbies = async (searchQuery: string) => {
  let query = supabase.from('hobbies').select('*').order('title', { ascending: true });
  if (searchQuery) {
    query = query.ilike('title', `%${searchQuery}%`);
  }
  const { data, error } = await query;
  if (error) throw error;
  return data;
};

const Hobbies = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [editingHobby, setEditingHobby] = useState<any>(null);
  const [deletingHobby, setDeletingHobby] = useState<any>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: hobbies, isLoading, error } = useQuery({
    queryKey: ['hobbies', searchQuery],
    queryFn: () => fetchHobbies(searchQuery),
  });

  const { mutate: deleteHobby, isPending: isDeleting } = useMutation({
    mutationFn: async (hobbyId: string) => {
      const { error } = await supabase.from('hobbies').delete().eq('id', hobbyId);
      if (error) throw error;
    },
    onSuccess: () => {
      toast({ title: "Hobby deleted successfully" });
      queryClient.invalidateQueries({ queryKey: ['hobbies'] });
      setDeletingHobby(null);
    },
    onError: (error: Error) => {
      toast({ title: "Failed to delete hobby", description: error.message, variant: "destructive" });
      setDeletingHobby(null);
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
      cell: (value: string) => (
        <Badge className={`${value === 'Active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'} font-medium border-0 rounded-full px-3`}>
          {value}
        </Badge>
      ),
    },
  ];
  
  const handleSearch = (query: string) => {
    setSearchQuery(query);
  };

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
          onSearch={handleSearch}
          searchPlaceholder="Search hobbies..."
          addButton={<AddHobbyDialog />}
          onEdit={handleEdit}
          onDelete={handleDelete}
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
        <AlertDialog open={!!deletingHobby} onOpenChange={() => setDeletingHobby(null)}>
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

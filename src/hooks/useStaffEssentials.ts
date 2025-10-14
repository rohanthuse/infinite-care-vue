import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { differenceInDays } from "date-fns";

export interface StaffEssential {
  id: string;
  staff_id: string;
  essential_type: string;
  category: string;
  display_name: string;
  status: 'pending' | 'complete' | 'expiring' | 'expired' | 'not_required';
  required: boolean;
  completion_date: string | null;
  expiry_date: string | null;
  document_id: string | null;
  training_record_id: string | null;
  notes: string | null;
  verified_by: string | null;
  verified_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface AddEssentialData {
  staff_id: string;
  essential_type: string;
  category: string;
  display_name: string;
  required?: boolean;
  expiry_date?: string;
  notes?: string;
}

export interface UpdateEssentialData {
  status?: 'pending' | 'complete' | 'expiring' | 'expired' | 'not_required';
  completion_date?: string;
  expiry_date?: string;
  document_id?: string;
  training_record_id?: string;
  notes?: string;
  verified_by?: string;
  verified_at?: string;
}

export const useStaffEssentials = (staffId: string) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: essentials = [], isLoading } = useQuery({
    queryKey: ["staff-essentials", staffId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("staff_essentials_checklist")
        .select("*")
        .eq("staff_id", staffId)
        .order("category", { ascending: true })
        .order("display_name", { ascending: true });

      if (error) throw error;
      return data as StaffEssential[];
    },
    enabled: !!staffId,
  });

  // Calculate completion percentage
  const completionPercentage = essentials.length > 0
    ? (essentials.filter(e => e.status === 'complete').length / essentials.length) * 100
    : 0;

  // Get items requiring action
  const actionRequiredItems = essentials.filter(
    e => e.status === 'pending' || e.status === 'expiring' || e.status === 'expired'
  );

  // Get days until next expiry
  const getDaysUntilExpiry = (expiryDate: string | null) => {
    if (!expiryDate) return null;
    return differenceInDays(new Date(expiryDate), new Date());
  };

  // Add essential mutation
  const addEssential = useMutation({
    mutationFn: async (data: AddEssentialData) => {
      const { error } = await supabase
        .from("staff_essentials_checklist")
        .insert(data);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["staff-essentials", staffId] });
      toast({
        title: "Essential added",
        description: "The essential item has been added successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error adding essential",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Update essential mutation
  const updateEssential = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: UpdateEssentialData }) => {
      const { error } = await supabase
        .from("staff_essentials_checklist")
        .update(data)
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["staff-essentials", staffId] });
      toast({
        title: "Essential updated",
        description: "The essential item has been updated successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error updating essential",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Delete essential mutation
  const deleteEssential = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("staff_essentials_checklist")
        .delete()
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["staff-essentials", staffId] });
      toast({
        title: "Essential deleted",
        description: "The essential item has been deleted successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error deleting essential",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Mark as complete mutation
  const markAsComplete = useMutation({
    mutationFn: async ({ 
      id, 
      documentId, 
      expiryDate 
    }: { 
      id: string; 
      documentId?: string; 
      expiryDate?: string;
    }) => {
      const updateData: UpdateEssentialData = {
        status: 'complete',
        completion_date: new Date().toISOString().split('T')[0],
        verified_at: new Date().toISOString(),
      };

      if (documentId) updateData.document_id = documentId;
      if (expiryDate) updateData.expiry_date = expiryDate;

      const { error } = await supabase
        .from("staff_essentials_checklist")
        .update(updateData)
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["staff-essentials", staffId] });
      toast({
        title: "Marked as complete",
        description: "The essential item has been marked as complete.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error marking as complete",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Renew essential mutation
  const renewEssential = useMutation({
    mutationFn: async ({ 
      id, 
      newExpiryDate, 
      documentId 
    }: { 
      id: string; 
      newExpiryDate: string; 
      documentId?: string;
    }) => {
      const updateData: UpdateEssentialData = {
        expiry_date: newExpiryDate,
        status: 'complete',
        verified_at: new Date().toISOString(),
      };

      if (documentId) updateData.document_id = documentId;

      const { error } = await supabase
        .from("staff_essentials_checklist")
        .update(updateData)
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["staff-essentials", staffId] });
      toast({
        title: "Essential renewed",
        description: "The essential item has been renewed successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error renewing essential",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  return {
    essentials,
    isLoading,
    completionPercentage,
    actionRequiredItems,
    getDaysUntilExpiry,
    addEssential: addEssential.mutate,
    updateEssential: updateEssential.mutate,
    deleteEssential: deleteEssential.mutate,
    markAsComplete: markAsComplete.mutate,
    renewEssential: renewEssential.mutate,
    isAddingEssential: addEssential.isPending,
    isUpdatingEssential: updateEssential.isPending,
    isDeletingEssential: deleteEssential.isPending,
  };
};
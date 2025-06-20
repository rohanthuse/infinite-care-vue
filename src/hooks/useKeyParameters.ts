
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

// Types for each parameter
export interface ReportType {
  id: string;
  title: string;
  status: "Active" | "Inactive";
  created_at: string;
  updated_at: string;
}

export interface FileCategory {
  id: string;
  title: string;
  status: "Active" | "Inactive";
  created_at: string;
  updated_at: string;
}

export interface BankHoliday {
  id: string;
  title: string;
  status: "Active" | "Inactive";
  registered_by: string;
  registered_on: string;
  created_at: string;
  updated_at: string;
}

export interface TravelRate {
  id: string;
  title: string;
  status: "Active" | "Inactive";
  from_date: string;
  rate_per_mile: number;
  rate_per_hour: number;
  user_type: string;
  created_at: string;
  updated_at: string;
}

export interface CommunicationType {
  id: string;
  title: string;
  status: "Active" | "Inactive";
  created_at: string;
  updated_at: string;
}

export interface ExpenseType {
  id: string;
  title: string;
  status: "Active" | "Inactive";
  type: "Increment" | "Decrement";
  amount: number;
  tax: number;
  created_at: string;
  updated_at: string;
}

// Generic hook factory
function createParameterHook<T>(tableName: string) {
  return function useParameter() {
    const queryClient = useQueryClient();

    // Fetch data
    const {
      data = [],
      isLoading,
      error,
    } = useQuery({
      queryKey: [tableName],
      queryFn: async () => {
        console.log(`Fetching ${tableName}`);
        const { data, error } = await supabase
          .from(tableName)
          .select('*')
          .order('created_at', { ascending: false });

        if (error) {
          console.error(`Error fetching ${tableName}:`, error);
          throw error;
        }
        
        console.log(`Fetched ${tableName}:`, data);
        return data as T[];
      },
    });

    // Create mutation
    const createMutation = useMutation({
      mutationFn: async (newItem: Partial<T>) => {
        console.log(`Creating ${tableName}:`, newItem);
        const { data, error } = await supabase
          .from(tableName)
          .insert([newItem])
          .select()
          .single();

        if (error) {
          console.error(`Error creating ${tableName}:`, error);
          throw error;
        }
        
        console.log(`Created ${tableName}:`, data);
        return data;
      },
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: [tableName] });
        toast({
          title: "Success",
          description: `${tableName.replace('_', ' ')} created successfully`,
        });
      },
      onError: (error) => {
        console.error(`${tableName} creation failed:`, error);
        toast({
          title: "Error",
          description: `Failed to create ${tableName.replace('_', ' ')}: ${error.message}`,
          variant: "destructive",
        });
      },
    });

    // Update mutation
    const updateMutation = useMutation({
      mutationFn: async ({ id, updates }: { id: string; updates: Partial<T> }) => {
        console.log(`Updating ${tableName}:`, { id, updates });
        const { data, error } = await supabase
          .from(tableName)
          .update(updates)
          .eq('id', id)
          .select()
          .single();

        if (error) {
          console.error(`Error updating ${tableName}:`, error);
          throw error;
        }
        
        console.log(`Updated ${tableName}:`, data);
        return data;
      },
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: [tableName] });
        toast({
          title: "Success",
          description: `${tableName.replace('_', ' ')} updated successfully`,
        });
      },
      onError: (error) => {
        console.error(`${tableName} update failed:`, error);
        toast({
          title: "Error",
          description: `Failed to update ${tableName.replace('_', ' ')}: ${error.message}`,
          variant: "destructive",
        });
      },
    });

    // Delete mutation
    const deleteMutation = useMutation({
      mutationFn: async (id: string) => {
        console.log(`Deleting ${tableName}:`, id);
        const { error } = await supabase
          .from(tableName)
          .delete()
          .eq('id', id);

        if (error) {
          console.error(`Error deleting ${tableName}:`, error);
          throw error;
        }
        
        console.log(`Deleted ${tableName}:`, id);
      },
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: [tableName] });
        toast({
          title: "Success",
          description: `${tableName.replace('_', ' ')} deleted successfully`,
        });
      },
      onError: (error) => {
        console.error(`${tableName} deletion failed:`, error);
        toast({
          title: "Error",
          description: `Failed to delete ${tableName.replace('_', ' ')}: ${error.message}`,
          variant: "destructive",
        });
      },
    });

    return {
      data,
      isLoading,
      error,
      create: createMutation.mutate,
      update: updateMutation.mutate,
      delete: deleteMutation.mutate,
      isCreating: createMutation.isPending,
      isUpdating: updateMutation.isPending,
      isDeleting: deleteMutation.isPending,
    };
  };
}

// Export specific hooks
export const useReportTypes = createParameterHook<ReportType>('report_types');
export const useFileCategories = createParameterHook<FileCategory>('file_categories');
export const useBankHolidays = createParameterHook<BankHoliday>('bank_holidays');
export const useTravelRates = createParameterHook<TravelRate>('travel_rates');
export const useCommunicationTypes = createParameterHook<CommunicationType>('communication_types');
export const useExpenseTypes = createParameterHook<ExpenseType>('expense_types');

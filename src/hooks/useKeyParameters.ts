
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { useTenant } from "@/contexts/TenantContext";

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

// Insert types (required fields only)
export interface ReportTypeInsert {
  title: string;
  status?: "Active" | "Inactive";
}

export interface FileCategoryInsert {
  title: string;
  status?: "Active" | "Inactive";
}

export interface BankHolidayInsert {
  title: string;
  status?: "Active" | "Inactive";
  registered_by: string;
  registered_on: string;
}

export interface TravelRateInsert {
  title: string;
  status?: "Active" | "Inactive";
  from_date: string;
  rate_per_mile: number;
  rate_per_hour: number;
  user_type: string;
}

export interface CommunicationTypeInsert {
  title: string;
  status?: "Active" | "Inactive";
}

export interface ExpenseTypeInsert {
  title: string;
  status?: "Active" | "Inactive";
  type: "Increment" | "Decrement";
  amount: number;
  tax?: number;
}

// Report Types hook
export function useReportTypes() {
  const queryClient = useQueryClient();
  const { organization } = useTenant();

  const {
    data = [],
    isLoading,
    error,
  } = useQuery({
    queryKey: ['report_types', organization?.id],
    queryFn: async () => {
      if (!organization?.id) {
        console.log('No organization ID available');
        return [];
      }
      
      console.log('Fetching report_types for organization:', organization.id);
      const { data, error } = await supabase
        .from('report_types')
        .select('*')
        .eq('organization_id', organization.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching report_types:', error);
        throw error;
      }
      
      console.log('Fetched report_types:', data);
      return data as ReportType[];
    },
    enabled: !!organization?.id,
  });

  const createMutation = useMutation({
    mutationFn: async (newItem: ReportTypeInsert) => {
      if (!organization?.id) {
        throw new Error('No organization selected');
      }
      
      const itemWithOrg = { ...newItem, organization_id: organization.id };
      console.log('Creating report_types:', itemWithOrg);
      const { data, error } = await supabase
        .from('report_types')
        .insert([itemWithOrg])
        .select()
        .single();

      if (error) {
        console.error('Error creating report_types:', error);
        throw error;
      }
      
      console.log('Created report_types:', data);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['report_types', organization?.id] });
      toast({
        title: "Success",
        description: "Report type created successfully",
      });
    },
    onError: (error) => {
      console.error('Report type creation failed:', error);
      toast({
        title: "Error",
        description: `Failed to create report type: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<ReportType> }) => {
      console.log('Updating report_types:', { id, updates });
      const { data, error } = await supabase
        .from('report_types')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('Error updating report_types:', error);
        throw error;
      }
      
      console.log('Updated report_types:', data);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['report_types', organization?.id] });
      toast({
        title: "Success",
        description: "Report type updated successfully",
      });
    },
    onError: (error) => {
      console.error('Report type update failed:', error);
      toast({
        title: "Error",
        description: `Failed to update report type: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      console.log('Deleting report_types:', id);
      const { error } = await supabase
        .from('report_types')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Error deleting report_types:', error);
        throw error;
      }
      
      console.log('Deleted report_types:', id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['report_types', organization?.id] });
      toast({
        title: "Success",
        description: "Report type deleted successfully",
      });
    },
    onError: (error) => {
      console.error('Report type deletion failed:', error);
      toast({
        title: "Error",
        description: `Failed to delete report type: ${error.message}`,
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
}

// File Categories hook
export function useFileCategories() {
  const queryClient = useQueryClient();
  const { organization } = useTenant();

  const {
    data = [],
    isLoading,
    error,
  } = useQuery({
    queryKey: ['file_categories', organization?.id],
    queryFn: async () => {
      if (!organization?.id) {
        console.log('No organization ID available');
        return [];
      }
      
      console.log('Fetching file_categories for organization:', organization.id);
      const { data, error } = await supabase
        .from('file_categories')
        .select('*')
        .eq('organization_id', organization.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching file_categories:', error);
        throw error;
      }
      
      console.log('Fetched file_categories:', data);
      return data as FileCategory[];
    },
    enabled: !!organization?.id,
  });

  const createMutation = useMutation({
    mutationFn: async (newItem: FileCategoryInsert) => {
      if (!organization?.id) {
        throw new Error('No organization selected');
      }
      
      const itemWithOrg = { ...newItem, organization_id: organization.id };
      console.log('Creating file_categories:', itemWithOrg);
      const { data, error } = await supabase
        .from('file_categories')
        .insert([itemWithOrg])
        .select()
        .single();

      if (error) {
        console.error('Error creating file_categories:', error);
        throw error;
      }
      
      console.log('Created file_categories:', data);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['file_categories', organization?.id] });
      toast({
        title: "Success",
        description: "File category created successfully",
      });
    },
    onError: (error) => {
      console.error('File category creation failed:', error);
      toast({
        title: "Error",
        description: `Failed to create file category: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<FileCategory> }) => {
      console.log('Updating file_categories:', { id, updates });
      const { data, error } = await supabase
        .from('file_categories')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('Error updating file_categories:', error);
        throw error;
      }
      
      console.log('Updated file_categories:', data);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['file_categories', organization?.id] });
      toast({
        title: "Success",
        description: "File category updated successfully",
      });
    },
    onError: (error) => {
      console.error('File category update failed:', error);
      toast({
        title: "Error",
        description: `Failed to update file category: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      console.log('Deleting file_categories:', id);
      const { error } = await supabase
        .from('file_categories')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Error deleting file_categories:', error);
        throw error;
      }
      
      console.log('Deleted file_categories:', id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['file_categories', organization?.id] });
      toast({
        title: "Success",
        description: "File category deleted successfully",
      });
    },
    onError: (error) => {
      console.error('File category deletion failed:', error);
      toast({
        title: "Error",
        description: `Failed to delete file category: ${error.message}`,
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
}

// Bank Holidays hook
export function useBankHolidays() {
  const queryClient = useQueryClient();
  const { organization } = useTenant();

  const {
    data = [],
    isLoading,
    error,
  } = useQuery({
    queryKey: ['bank_holidays', organization?.id],
    queryFn: async () => {
      if (!organization?.id) {
        console.log('No organization ID available');
        return [];
      }
      
      console.log('Fetching bank_holidays for organization:', organization.id);
      const { data, error } = await supabase
        .from('bank_holidays')
        .select('*')
        .eq('organization_id', organization.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching bank_holidays:', error);
        throw error;
      }
      
      console.log('Fetched bank_holidays:', data);
      return data as BankHoliday[];
    },
    enabled: !!organization?.id,
  });

  const createMutation = useMutation({
    mutationFn: async (newItem: BankHolidayInsert) => {
      if (!organization?.id) {
        throw new Error('No organization selected');
      }
      
      const itemWithOrg = { ...newItem, organization_id: organization.id };
      console.log('Creating bank_holidays:', itemWithOrg);
      const { data, error } = await supabase
        .from('bank_holidays')
        .insert([itemWithOrg])
        .select()
        .single();

      if (error) {
        console.error('Error creating bank_holidays:', error);
        throw error;
      }
      
      console.log('Created bank_holidays:', data);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bank_holidays', organization?.id] });
      toast({
        title: "Success",
        description: "Bank holiday created successfully",
      });
    },
    onError: (error) => {
      console.error('Bank holiday creation failed:', error);
      toast({
        title: "Error",
        description: `Failed to create bank holiday: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<BankHoliday> }) => {
      console.log('Updating bank_holidays:', { id, updates });
      const { data, error } = await supabase
        .from('bank_holidays')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('Error updating bank_holidays:', error);
        throw error;
      }
      
      console.log('Updated bank_holidays:', data);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bank_holidays', organization?.id] });
      toast({
        title: "Success",
        description: "Bank holiday updated successfully",
      });
    },
    onError: (error) => {
      console.error('Bank holiday update failed:', error);
      toast({
        title: "Error",
        description: `Failed to update bank holiday: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      console.log('Deleting bank_holidays:', id);
      const { error } = await supabase
        .from('bank_holidays')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Error deleting bank_holidays:', error);
        throw error;
      }
      
      console.log('Deleted bank_holidays:', id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bank_holidays', organization?.id] });
      toast({
        title: "Success",
        description: "Bank holiday deleted successfully",
      });
    },
    onError: (error) => {
      console.error('Bank holiday deletion failed:', error);
      toast({
        title: "Error",
        description: `Failed to delete bank holiday: ${error.message}`,
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
}

// Travel Rates hook
export function useTravelRates() {
  const queryClient = useQueryClient();
  const { organization } = useTenant();

  const {
    data = [],
    isLoading,
    error,
  } = useQuery({
    queryKey: ['travel_rates', organization?.id],
    queryFn: async () => {
      if (!organization?.id) {
        console.log('No organization ID available');
        return [];
      }
      
      console.log('Fetching travel_rates for organization:', organization.id);
      const { data, error } = await supabase
        .from('travel_rates')
        .select('*')
        .eq('organization_id', organization.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching travel_rates:', error);
        throw error;
      }
      
      console.log('Fetched travel_rates:', data);
      return data as TravelRate[];
    },
    enabled: !!organization?.id,
  });

  const createMutation = useMutation({
    mutationFn: async (newItem: TravelRateInsert) => {
      if (!organization?.id) {
        throw new Error('No organization selected');
      }
      
      const itemWithOrg = { ...newItem, organization_id: organization.id };
      console.log('Creating travel_rates:', itemWithOrg);
      const { data, error } = await supabase
        .from('travel_rates')
        .insert([itemWithOrg])
        .select()
        .single();

      if (error) {
        console.error('Error creating travel_rates:', error);
        throw error;
      }
      
      console.log('Created travel_rates:', data);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['travel_rates', organization?.id] });
      toast({
        title: "Success",
        description: "Travel rate created successfully",
      });
    },
    onError: (error) => {
      console.error('Travel rate creation failed:', error);
      toast({
        title: "Error",
        description: `Failed to create travel rate: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<TravelRate> }) => {
      console.log('Updating travel_rates:', { id, updates });
      const { data, error } = await supabase
        .from('travel_rates')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('Error updating travel_rates:', error);
        throw error;
      }
      
      console.log('Updated travel_rates:', data);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['travel_rates', organization?.id] });
      toast({
        title: "Success",
        description: "Travel rate updated successfully",
      });
    },
    onError: (error) => {
      console.error('Travel rate update failed:', error);
      toast({
        title: "Error",
        description: `Failed to update travel rate: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      console.log('Deleting travel_rates:', id);
      const { error } = await supabase
        .from('travel_rates')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Error deleting travel_rates:', error);
        throw error;
      }
      
      console.log('Deleted travel_rates:', id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['travel_rates', organization?.id] });
      toast({
        title: "Success",
        description: "Travel rate deleted successfully",
      });
    },
    onError: (error) => {
      console.error('Travel rate deletion failed:', error);
      toast({
        title: "Error",
        description: `Failed to delete travel rate: ${error.message}`,
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
}

// Communication Types hook
export function useCommunicationTypes() {
  const queryClient = useQueryClient();
  const { organization } = useTenant();

  const {
    data = [],
    isLoading,
    error,
  } = useQuery({
    queryKey: ['communication_types', organization?.id],
    queryFn: async () => {
      if (!organization?.id) {
        console.log('No organization ID available');
        return [];
      }
      
      console.log('Fetching communication_types for organization:', organization.id);
      const { data, error } = await supabase
        .from('communication_types')
        .select('*')
        .eq('organization_id', organization.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching communication_types:', error);
        throw error;
      }
      
      console.log('Fetched communication_types:', data);
      return data as CommunicationType[];
    },
    enabled: !!organization?.id,
  });

  const createMutation = useMutation({
    mutationFn: async (newItem: CommunicationTypeInsert) => {
      if (!organization?.id) {
        throw new Error('No organization selected');
      }
      
      const itemWithOrg = { ...newItem, organization_id: organization.id };
      console.log('Creating communication_types:', itemWithOrg);
      const { data, error } = await supabase
        .from('communication_types')
        .insert([itemWithOrg])
        .select()
        .single();

      if (error) {
        console.error('Error creating communication_types:', error);
        throw error;
      }
      
      console.log('Created communication_types:', data);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['communication_types', organization?.id] });
      toast({
        title: "Success",
        description: "Communication type created successfully",
      });
    },
    onError: (error) => {
      console.error('Communication type creation failed:', error);
      toast({
        title: "Error",
        description: `Failed to create communication type: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<CommunicationType> }) => {
      console.log('Updating communication_types:', { id, updates });
      const { data, error } = await supabase
        .from('communication_types')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('Error updating communication_types:', error);
        throw error;
      }
      
      console.log('Updated communication_types:', data);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['communication_types', organization?.id] });
      toast({
        title: "Success",
        description: "Communication type updated successfully",
      });
    },
    onError: (error) => {
      console.error('Communication type update failed:', error);
      toast({
        title: "Error",
        description: `Failed to update communication type: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      console.log('Deleting communication_types:', id);
      const { error } = await supabase
        .from('communication_types')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Error deleting communication_types:', error);
        throw error;
      }
      
      console.log('Deleted communication_types:', id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['communication_types', organization?.id] });
      toast({
        title: "Success",
        description: "Communication type deleted successfully",
      });
    },
    onError: (error) => {
      console.error('Communication type deletion failed:', error);
      toast({
        title: "Error",
        description: `Failed to delete communication type: ${error.message}`,
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
}

// Expense Types hook
export function useExpenseTypes() {
  const queryClient = useQueryClient();
  const { organization } = useTenant();

  const {
    data = [],
    isLoading,
    error,
  } = useQuery({
    queryKey: ['expense_types', organization?.id],
    queryFn: async () => {
      if (!organization?.id) {
        console.log('No organization ID available');
        return [];
      }
      
      console.log('Fetching expense_types for organization:', organization.id);
      const { data, error } = await supabase
        .from('expense_types')
        .select('*')
        .eq('organization_id', organization.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching expense_types:', error);
        throw error;
      }
      
      console.log('Fetched expense_types:', data);
      return data as ExpenseType[];
    },
    enabled: !!organization?.id,
  });

  const createMutation = useMutation({
    mutationFn: async (newItem: ExpenseTypeInsert) => {
      if (!organization?.id) {
        throw new Error('No organization selected');
      }
      
      const itemWithOrg = { ...newItem, organization_id: organization.id };
      console.log('Creating expense_types:', itemWithOrg);
      const { data, error } = await supabase
        .from('expense_types')
        .insert([itemWithOrg])
        .select()
        .single();

      if (error) {
        console.error('Error creating expense_types:', error);
        throw error;
      }
      
      console.log('Created expense_types:', data);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expense_types', organization?.id] });
      toast({
        title: "Success",
        description: "Expense type created successfully",
      });
    },
    onError: (error) => {
      console.error('Expense type creation failed:', error);
      toast({
        title: "Error",
        description: `Failed to create expense type: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<ExpenseType> }) => {
      console.log('Updating expense_types:', { id, updates });
      const { data, error } = await supabase
        .from('expense_types')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('Error updating expense_types:', error);
        throw error;
      }
      
      console.log('Updated expense_types:', data);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expense_types', organization?.id] });
      toast({
        title: "Success",
        description: "Expense type updated successfully",
      });
    },
    onError: (error) => {
      console.error('Expense type update failed:', error);
      toast({
        title: "Error",
        description: `Failed to update expense type: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      console.log('Deleting expense_types:', id);
      const { error } = await supabase
        .from('expense_types')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Error deleting expense_types:', error);
        throw error;
      }
      
      console.log('Deleted expense_types:', id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expense_types', organization?.id] });
      toast({
        title: "Success",
        description: "Expense type deleted successfully",
      });
    },
    onError: (error) => {
      console.error('Expense type deletion failed:', error);
      toast({
        title: "Error",
        description: `Failed to delete expense type: ${error.message}`,
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
}

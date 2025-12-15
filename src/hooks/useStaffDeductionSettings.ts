import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface OtherDeduction {
  name: string;
  type: 'fixed' | 'percentage';
  amount: number;
}

export interface StaffDeductionSettings {
  id: string;
  staff_id: string;
  branch_id?: string;
  organization_id?: string;
  
  // Tax Settings
  tax_code: string;
  tax_rate: number;
  use_custom_tax_rate: boolean;
  
  // National Insurance Settings
  ni_category: string;
  ni_rate: number;
  use_custom_ni_rate: boolean;
  
  // Pension Settings
  pension_opted_in: boolean;
  pension_percentage: number;
  employer_pension_percentage: number;
  pension_provider?: string;
  
  // Student Loan Settings
  has_student_loan: boolean;
  student_loan_plan?: string;
  
  // Other Deductions
  other_deductions: OtherDeduction[];
  
  // Metadata
  effective_from: string;
  effective_until?: string;
  is_active: boolean;
  notes?: string;
  created_by?: string;
  created_at: string;
  updated_at: string;
}

export type CreateStaffDeductionSettings = Omit<StaffDeductionSettings, 'id' | 'created_at' | 'updated_at'>;
export type UpdateStaffDeductionSettings = Partial<CreateStaffDeductionSettings> & { id: string };

// UK Tax Code rates lookup
export const TAX_CODES = [
  { code: '1257L', description: 'Standard Personal Allowance (£12,570)' },
  { code: 'BR', description: 'Basic Rate (20%) - No Allowance' },
  { code: 'D0', description: 'Higher Rate (40%) - No Allowance' },
  { code: 'D1', description: 'Additional Rate (45%) - No Allowance' },
  { code: '0T', description: 'No Personal Allowance' },
  { code: 'NT', description: 'No Tax Deducted' },
  { code: 'S1257L', description: 'Scottish Standard Allowance' },
  { code: 'C1257L', description: 'Welsh Standard Allowance' },
];

// UK NI Categories
export const NI_CATEGORIES = [
  { category: 'A', description: 'Standard Rate (Most Employees)' },
  { category: 'B', description: 'Married Women/Widows Reduced Rate' },
  { category: 'C', description: 'Over State Pension Age' },
  { category: 'H', description: 'Apprentice Under 25' },
  { category: 'J', description: 'Deferment (Multiple Jobs)' },
  { category: 'M', description: 'Under 21' },
  { category: 'Z', description: 'Under 21 Deferment' },
];

// Student Loan Plans
export const STUDENT_LOAN_PLANS = [
  { plan: 'plan_1', description: 'Plan 1 (Started before Sept 2012)' },
  { plan: 'plan_2', description: 'Plan 2 (Started after Sept 2012)' },
  { plan: 'plan_4', description: 'Plan 4 (Scottish Students)' },
  { plan: 'plan_5', description: 'Plan 5 (Started after Aug 2023)' },
  { plan: 'postgraduate', description: 'Postgraduate Loan' },
];

// Fetch staff deduction settings
export const useStaffDeductionSettings = (staffId: string) => {
  return useQuery({
    queryKey: ['staff-deduction-settings', staffId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('staff_deduction_settings')
        .select('*')
        .eq('staff_id', staffId)
        .eq('is_active', true)
        .order('effective_from', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) throw error;
      
      if (data) {
        // Parse other_deductions from JSON
        const parsedData = {
          ...data,
          other_deductions: Array.isArray(data.other_deductions) 
            ? data.other_deductions as unknown as OtherDeduction[]
            : []
        };
        return parsedData as StaffDeductionSettings;
      }
      
      return null;
    },
    enabled: !!staffId
  });
};

// Create staff deduction settings
export const useCreateStaffDeductionSettings = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (settings: CreateStaffDeductionSettings) => {
      const { data, error } = await supabase
        .from('staff_deduction_settings')
        .insert([{
          ...settings,
          other_deductions: JSON.stringify(settings.other_deductions || [])
        }])
        .select()
        .single();

      if (error) throw error;
      return data;

      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['staff-deduction-settings', variables.staff_id] });
      toast.success('Deduction settings created successfully');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to create deduction settings');
    }
  });
};

// Update staff deduction settings
export const useUpdateStaffDeductionSettings = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updates }: UpdateStaffDeductionSettings) => {
      const updateData: Record<string, unknown> = { ...updates };
      if (updates.other_deductions) {
        updateData.other_deductions = JSON.stringify(updates.other_deductions);
      }
      
      const { data, error } = await supabase
        .from('staff_deduction_settings')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['staff-deduction-settings', data.staff_id] });
      toast.success('Deduction settings updated successfully');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to update deduction settings');
    }
  });
};

// Helper function to get tax rate from tax code
export const getTaxRateFromCode = (taxCode: string): number => {
  switch (taxCode) {
    case 'BR': return 0.20;
    case 'D0': return 0.40;
    case 'D1': return 0.45;
    case 'NT': return 0;
    case '0T':
    case '1257L':
    case 'S1257L':
    case 'C1257L':
    default:
      return 0.20; // Standard rate after personal allowance
  }
};

// Helper function to get NI rate from category
export const getNIRateFromCategory = (category: string): number => {
  switch (category) {
    case 'A': return 0.12;
    case 'B': return 0.0585;
    case 'C': return 0;
    case 'H':
    case 'M':
    case 'Z':
      return 0.12; // Same as A for most earnings
    case 'J': return 0.02;
    default:
      return 0.12;
  }
};

// Helper function to calculate student loan deduction
export const calculateStudentLoanDeduction = (grossPay: number, plan?: string): number => {
  if (!plan) return 0;
  
  // Monthly thresholds (approximate)
  const thresholds: Record<string, { threshold: number; rate: number }> = {
    plan_1: { threshold: 1682, rate: 0.09 },
    plan_2: { threshold: 2274, rate: 0.09 },
    plan_4: { threshold: 2167, rate: 0.09 },
    plan_5: { threshold: 2083, rate: 0.09 },
    postgraduate: { threshold: 1750, rate: 0.06 },
  };
  
  const planConfig = thresholds[plan];
  if (!planConfig || grossPay <= planConfig.threshold) return 0;
  
  return (grossPay - planConfig.threshold) * planConfig.rate;
};

// Helper function to calculate other deductions
export const calculateOtherDeductions = (grossPay: number, deductions: OtherDeduction[]): number => {
  return deductions.reduce((total, deduction) => {
    if (deduction.type === 'fixed') {
      return total + deduction.amount;
    } else {
      return total + (grossPay * (deduction.amount / 100));
    }
  }, 0);
};

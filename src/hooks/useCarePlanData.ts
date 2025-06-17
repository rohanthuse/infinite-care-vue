
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface CarePlanWithDetails {
  id: string;
  client_id: string;
  title: string;
  provider_name: string;
  start_date: string;
  end_date?: string;
  review_date?: string;
  status: string;
  goals_progress?: number;
  created_by_staff_id?: string;
  approved_by?: string;
  approved_at?: string;
  rejection_reason?: string;
  care_plan_type: string;
  priority: string;
  notes?: string;
  created_at: string;
  updated_at: string;
  goals?: CarePlanGoal[];
  activities?: CarePlanActivity[];
  medications?: CarePlanMedication[];
  approval_history?: CarePlanApproval[];
}

export interface CarePlanGoal {
  id: string;
  care_plan_id: string;
  description: string;
  status: string;
  progress?: number;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface CarePlanActivity {
  id: string;
  care_plan_id: string;
  name: string;
  description?: string;
  frequency: string;
  status: string;
  created_at: string;
  updated_at: string;
}

export interface CarePlanMedication {
  id: string;
  care_plan_id: string;
  name: string;
  dosage: string;
  frequency: string;
  start_date: string;
  end_date?: string;
  status: string;
  created_at: string;
  updated_at: string;
}

export interface CarePlanApproval {
  id: string;
  care_plan_id: string;
  action: string;
  performed_by: string;
  performed_at: string;
  comments?: string;
  previous_status?: string;
  new_status?: string;
}

export interface CreateCarePlanData {
  client_id: string;
  title: string;
  provider_name: string;
  start_date: string;
  end_date?: string;
  review_date?: string;
  care_plan_type: string;
  priority: string;
  notes?: string;
  goals: Omit<CarePlanGoal, 'id' | 'care_plan_id' | 'created_at' | 'updated_at'>[];
  activities: Omit<CarePlanActivity, 'id' | 'care_plan_id' | 'created_at' | 'updated_at'>[];
  medications: Omit<CarePlanMedication, 'id' | 'care_plan_id' | 'created_at' | 'updated_at'>[];
}

// Fetch care plans with full details for a client
export const useClientCarePlansWithDetails = (clientId: string) => {
  return useQuery({
    queryKey: ['client-care-plans-detailed', clientId],
    queryFn: async () => {
      const { data: carePlans, error } = await supabase
        .from('client_care_plans')
        .select(`
          *,
          goals:client_care_plan_goals(*),
          activities:client_activities(*),
          medications:client_medications(*),
          approval_history:client_care_plan_approvals(*)
        `)
        .eq('client_id', clientId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return carePlans as CarePlanWithDetails[];
    },
    enabled: Boolean(clientId),
  });
};

// Fetch care plans by status for admin approval
export const useCarePlansByStatus = (status: string) => {
  return useQuery({
    queryKey: ['care-plans-by-status', status],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('client_care_plans')
        .select(`
          *,
          client:clients(first_name, last_name, preferred_name),
          goals:client_care_plan_goals(*),
          activities:client_activities(*),
          medications:client_medications(*)
        `)
        .eq('status', status)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    },
    enabled: Boolean(status),
  });
};

// Create a new care plan with all components
export const useCreateCarePlan = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (carePlanData: CreateCarePlanData) => {
      // Create the main care plan
      const { data: carePlan, error: carePlanError } = await supabase
        .from('client_care_plans')
        .insert([{
          client_id: carePlanData.client_id,
          title: carePlanData.title,
          provider_name: carePlanData.provider_name,
          start_date: carePlanData.start_date,
          end_date: carePlanData.end_date,
          review_date: carePlanData.review_date,
          care_plan_type: carePlanData.care_plan_type,
          priority: carePlanData.priority,
          notes: carePlanData.notes,
          status: 'draft'
        }])
        .select()
        .single();

      if (carePlanError) throw carePlanError;

      // Create goals
      if (carePlanData.goals.length > 0) {
        const { error: goalsError } = await supabase
          .from('client_care_plan_goals')
          .insert(carePlanData.goals.map(goal => ({
            ...goal,
            care_plan_id: carePlan.id
          })));

        if (goalsError) throw goalsError;
      }

      // Create activities
      if (carePlanData.activities.length > 0) {
        const { error: activitiesError } = await supabase
          .from('client_activities')
          .insert(carePlanData.activities.map(activity => ({
            ...activity,
            care_plan_id: carePlan.id
          })));

        if (activitiesError) throw activitiesError;
      }

      // Create medications
      if (carePlanData.medications.length > 0) {
        const { error: medicationsError } = await supabase
          .from('client_medications')
          .insert(carePlanData.medications.map(medication => ({
            ...medication,
            care_plan_id: carePlan.id
          })));

        if (medicationsError) throw medicationsError;
      }

      return carePlan;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['client-care-plans-detailed', data.client_id] });
      queryClient.invalidateQueries({ queryKey: ['care-plans-by-status'] });
    },
  });
};

// Submit care plan for approval
export const useSubmitCarePlanForApproval = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ carePlanId, staffId }: { carePlanId: string; staffId: string }) => {
      // Update care plan status
      const { error: updateError } = await supabase
        .from('client_care_plans')
        .update({ status: 'pending_approval' })
        .eq('id', carePlanId);

      if (updateError) throw updateError;

      // Add approval history record
      const { error: historyError } = await supabase
        .from('client_care_plan_approvals')
        .insert([{
          care_plan_id: carePlanId,
          action: 'submitted_for_approval',
          performed_by: staffId,
          previous_status: 'draft',
          new_status: 'pending_approval'
        }]);

      if (historyError) throw historyError;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['care-plans-by-status'] });
      queryClient.invalidateQueries({ queryKey: ['client-care-plans-detailed'] });
    },
  });
};

// Approve care plan
export const useApproveCarePlan = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ carePlanId, approvedBy, comments }: { carePlanId: string; approvedBy: string; comments?: string }) => {
      // Update care plan status
      const { error: updateError } = await supabase
        .from('client_care_plans')
        .update({ 
          status: 'approved',
          approved_by: approvedBy,
          approved_at: new Date().toISOString()
        })
        .eq('id', carePlanId);

      if (updateError) throw updateError;

      // Add approval history record
      const { error: historyError } = await supabase
        .from('client_care_plan_approvals')
        .insert([{
          care_plan_id: carePlanId,
          action: 'approved',
          performed_by: approvedBy,
          comments,
          previous_status: 'pending_approval',
          new_status: 'approved'
        }]);

      if (historyError) throw historyError;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['care-plans-by-status'] });
      queryClient.invalidateQueries({ queryKey: ['client-care-plans-detailed'] });
    },
  });
};

// Reject care plan
export const useRejectCarePlan = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ carePlanId, rejectedBy, reason }: { carePlanId: string; rejectedBy: string; reason: string }) => {
      // Update care plan status
      const { error: updateError } = await supabase
        .from('client_care_plans')
        .update({ 
          status: 'rejected',
          rejection_reason: reason
        })
        .eq('id', carePlanId);

      if (updateError) throw updateError;

      // Add approval history record
      const { error: historyError } = await supabase
        .from('client_care_plan_approvals')
        .insert([{
          care_plan_id: carePlanId,
          action: 'rejected',
          performed_by: rejectedBy,
          comments: reason,
          previous_status: 'pending_approval',
          new_status: 'rejected'
        }]);

      if (historyError) throw historyError;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['care-plans-by-status'] });
      queryClient.invalidateQueries({ queryKey: ['client-care-plans-detailed'] });
    },
  });
};

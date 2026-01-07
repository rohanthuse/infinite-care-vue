import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface VisitTask {
  id: string;
  visit_record_id: string;
  task_category: string;
  task_name: string;
  task_description?: string;
  is_completed: boolean;
  completed_at?: string;
  completion_notes?: string;
  completion_time_minutes?: number;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  assigned_by?: string;
  created_at: string;
  updated_at: string;
}

export const useVisitTasks = (visitRecordId?: string) => {
  const queryClient = useQueryClient();

  // Get all tasks for a visit - session-stable for long visits
  const { data: tasks, isLoading } = useQuery({
    queryKey: ['visit-tasks', visitRecordId],
    queryFn: async () => {
      if (!visitRecordId) return [];
      
      const { data, error } = await supabase
        .from('visit_tasks')
        .select('*')
        .eq('visit_record_id', visitRecordId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      return data as VisitTask[];
    },
    enabled: !!visitRecordId,
    // Reduced stale time to allow fresher data after edits
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 30 * 60 * 1000, // 30 minutes
    refetchOnMount: 'always', // Always refetch when component remounts
    refetchOnWindowFocus: false,
  });

  // Add task to visit
  const addTask = useMutation({
    mutationFn: async (taskData: Omit<VisitTask, 'id' | 'created_at' | 'updated_at'>) => {
      const { data, error } = await supabase
        .from('visit_tasks')
        .insert(taskData)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['visit-tasks', visitRecordId] });
    },
    onError: (error: any) => {
      console.error('[useVisitTasks] Error adding task:', error);
      const errorMessage = error?.message || 'Unknown error';
      toast.error(`Failed to add task: ${errorMessage}`, { duration: 5000 });
    },
  });

  // Update task completion
  const updateTask = useMutation({
    mutationFn: async ({ 
      taskId, 
      isCompleted, 
      notes, 
      completionTimeMinutes 
    }: {
      taskId: string;
      isCompleted: boolean;
      notes?: string;
      completionTimeMinutes?: number;
    }) => {
      const updates: Partial<VisitTask> = {
        is_completed: isCompleted,
        completion_notes: notes,
        completion_time_minutes: completionTimeMinutes,
      };

      if (isCompleted) {
        updates.completed_at = new Date().toISOString();
      } else {
        updates.completed_at = undefined;
      }

      const { data, error } = await supabase
        .from('visit_tasks')
        .update(updates)
        .eq('id', taskId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['visit-tasks', visitRecordId] });
    },
    onError: (error: any) => {
      console.error('[useVisitTasks] Error updating task:', error);
      const errorMessage = error?.message || 'Unknown error';
      toast.error(`Failed to update task: ${errorMessage}`, { duration: 5000 });
    },
  });

  // Bulk add common tasks for a visit
  const addCommonTasks = useMutation({
    mutationFn: async (visitRecordId: string) => {
      const commonTasks = [
        {
          visit_record_id: visitRecordId,
          task_category: 'hygiene',
          task_name: 'Personal hygiene assistance',
          task_description: 'Help with washing, grooming, and personal care',
          is_completed: false,
          priority: 'high' as const,
        },
        {
          visit_record_id: visitRecordId,
          task_category: 'meals',
          task_name: 'Meal preparation',
          task_description: 'Prepare and assist with meals',
          is_completed: false,
          priority: 'high' as const,
        },
        {
          visit_record_id: visitRecordId,
          task_category: 'medication',
          task_name: 'Medication administration',
          task_description: 'Administer prescribed medications',
          is_completed: false,
          priority: 'urgent' as const,
        },
        {
          visit_record_id: visitRecordId,
          task_category: 'mobility',
          task_name: 'Mobility exercises',
          task_description: 'Assist with movement and exercises',
          is_completed: false,
          priority: 'medium' as const,
        },
        {
          visit_record_id: visitRecordId,
          task_category: 'housekeeping',
          task_name: 'Light housekeeping',
          task_description: 'Assist with basic household tasks',
          is_completed: false,
          priority: 'low' as const,
        },
      ];

      const { data, error } = await supabase
        .from('visit_tasks')
        .insert(commonTasks)
        .select();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['visit-tasks', visitRecordId] });
      toast.success('Common tasks added');
    },
    onError: (error) => {
      console.error('Error adding common tasks:', error);
      toast.error('Failed to add common tasks');
    },
  });

  const completedTasks = tasks?.filter(task => task.is_completed) || [];
  const pendingTasks = tasks?.filter(task => !task.is_completed) || [];
  const completionPercentage = tasks?.length ? Math.round((completedTasks.length / tasks.length) * 100) : 0;

  return {
    tasks,
    completedTasks,
    pendingTasks,
    completionPercentage,
    isLoading,
    addTask,
    updateTask,
    addCommonTasks,
  };
};
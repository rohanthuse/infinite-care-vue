
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useCarerAuthSafe } from "./useCarerAuthSafe";
import { useCarerBranch } from "./useCarerBranch";

export interface CarerTask {
  id: string;
  title: string;
  description: string;
  status: 'pending' | 'in-progress' | 'done';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  due_date: string | null;
  client_id: string | null;
  category: string;
  created_at: string;
  completed: boolean;
  // Relations
  client?: {
    first_name: string;
    last_name: string;
  };
}

export const useCarerTasks = () => {
  const { user, carerProfile } = useCarerAuthSafe();
  const { data: carerBranch } = useCarerBranch();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: tasks = [], isLoading, error } = useQuery({
    queryKey: ['carer-tasks', carerProfile?.id],
    queryFn: async () => {
      if (!carerProfile?.id) return [];
      
      const { data, error } = await supabase
        .from('tasks')
        .select(`
          *,
          client:clients(first_name, last_name)
        `)
        .eq('assignee_id', carerProfile.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching carer tasks:', error);
        throw error;
      }
      
      return (data || []).map(task => ({
        ...task,
        completed: task.status === 'done',
        client: task.client ? `${task.client.first_name} ${task.client.last_name}` : null,
        dueDate: task.due_date,
        createdAt: task.created_at
      }));
    },
    enabled: !!carerProfile?.id,
  });

  const updateTaskMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<CarerTask> }) => {
      const { data, error } = await supabase
        .from('tasks')
        .update({
          ...updates,
          status: updates.completed ? 'done' : updates.status,
          due_date: updates.due_date,
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['carer-tasks', carerProfile?.id] });
      toast({
        title: "Task updated",
        description: "Task has been updated successfully.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to update task: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  const addTaskMutation = useMutation({
    mutationFn: async (newTask: Omit<CarerTask, 'id' | 'created_at'>) => {
      if (!carerBranch?.branch_id) {
        throw new Error('Branch information not available');
      }

      if (!carerProfile?.id) {
        throw new Error('Carer profile not available');
      }

      console.log('[useCarerTasks] Creating task:', {
        carerProfileId: carerProfile.id,
        branchId: carerBranch.branch_id,
        taskData: newTask
      });

      const taskData = {
        title: newTask.title,
        description: newTask.description,
        status: newTask.completed ? 'done' : 'pending',
        priority: newTask.priority,
        due_date: newTask.due_date,
        assignee_id: carerProfile.id,
        client_id: newTask.client_id,
        category: newTask.category || 'General',
        branch_id: carerBranch.branch_id,
      };

      const { data, error } = await supabase
        .from('tasks')
        .insert(taskData)
        .select()
        .single();

      if (error) {
        console.error('[useCarerTasks] Error creating task:', error);
        throw error;
      }
      
      console.log('[useCarerTasks] Task created successfully:', data);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['carer-tasks', carerProfile?.id] });
      toast({
        title: "Task created",
        description: "New task has been created successfully.",
      });
    },
    onError: (error) => {
      console.error('Error creating task:', error);
      toast({
        title: "Error",
        description: `Failed to create task: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  const completeTask = (taskId: string) => {
    updateTaskMutation.mutate({
      id: taskId,
      updates: { completed: true, status: 'done' }
    });
  };

  const updateTask = (updatedTask: CarerTask) => {
    updateTaskMutation.mutate({
      id: updatedTask.id,
      updates: updatedTask
    });
  };

  const addTask = (taskData: any) => {
    addTaskMutation.mutate(taskData);
  };

  return {
    tasks,
    isLoading,
    error,
    completeTask,
    updateTask,
    addTask,
    isUpdating: updateTaskMutation.isPending,
    isAdding: addTaskMutation.isPending,
  };
};

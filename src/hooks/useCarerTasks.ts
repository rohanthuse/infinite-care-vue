
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useCarerContext } from "./useCarerContext";

export interface CarerTask {
  id: string;
  title: string;
  description: string;
  status: 'todo' | 'in-progress' | 'done';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  due_date: string | null;
  client_id: string | null;
  category: string;
  created_at: string;
  completed: boolean;
  client_visible?: boolean;
  client_can_complete?: boolean;
  // Relations
  client?: {
    first_name: string;
    last_name: string;
  };
}

export const useCarerTasks = () => {
  const { data: carerContext } = useCarerContext();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: tasks = [], isLoading, error } = useQuery({
    queryKey: ['carer-tasks', carerContext?.staffId],
    queryFn: async () => {
      if (!carerContext?.staffId) return [];
      
      const { data, error } = await supabase
        .from('tasks')
        .select(`
          *,
          client:clients(first_name, last_name)
        `)
        .eq('assignee_id', carerContext.staffId)
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
    enabled: !!carerContext?.staffId,
    staleTime: 3 * 60 * 1000, // 3 minutes
    refetchOnWindowFocus: false,
  });

  const updateTaskMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<CarerTask> }) => {
      // Filter out frontend-only fields before sending to database
      const { completed, client, ...dbUpdates } = updates;
      
      // Convert completed status to database status
      const finalUpdates = {
        ...dbUpdates,
        status: completed !== undefined ? (completed ? 'done' : dbUpdates.status || 'todo') : dbUpdates.status,
        due_date: updates.due_date,
      };

      const { data, error } = await supabase
        .from('tasks')
        .update(finalUpdates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['carer-tasks', carerContext?.staffId] });
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
      if (!carerContext?.branchInfo?.id) {
        throw new Error('Branch information not available');
      }

      if (!carerContext?.staffId) {
        throw new Error('Carer context not available');
      }

      console.log('[useCarerTasks] Creating task:', {
        staffId: carerContext.staffId,
        branchId: carerContext.branchInfo.id,
        taskData: newTask
      });

      const taskData = {
        title: newTask.title,
        description: newTask.description,
        status: newTask.completed ? 'done' : 'todo',
        priority: newTask.priority,
        due_date: newTask.due_date,
        assignee_id: carerContext.staffId,
        client_id: newTask.client_id,
        category: newTask.category || 'General',
        branch_id: carerContext.branchInfo.id,
        client_visible: newTask.client_visible || false,
        client_can_complete: newTask.client_can_complete || false,
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
      queryClient.invalidateQueries({ queryKey: ['carer-tasks', carerContext?.staffId] });
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
      updates: { status: 'done' }
    });
  };

  const updateTask = (updatedTask: CarerTask) => {
    updateTaskMutation.mutate({
      id: updatedTask.id,
      updates: updatedTask
    });
  };

  const deleteTaskMutation = useMutation({
    mutationFn: async (taskId: string) => {
      const { error } = await supabase
        .from('tasks')
        .delete()
        .eq('id', taskId);

      if (error) throw error;
      return taskId;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['carer-tasks', carerContext?.staffId] });
      toast({
        title: "Task deleted",
        description: "Task has been deleted successfully.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to delete task: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  const addTask = (taskData: any) => {
    addTaskMutation.mutate(taskData);
  };

  const deleteTask = (taskId: string) => {
    deleteTaskMutation.mutate(taskId);
  };

  return {
    tasks,
    isLoading,
    error,
    completeTask,
    updateTask,
    addTask,
    deleteTask,
    isUpdating: updateTaskMutation.isPending,
    isAdding: addTaskMutation.isPending,
    isDeleting: deleteTaskMutation.isPending,
  };
};

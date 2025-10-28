
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { TaskStatus, TaskPriority } from "@/types/task";

export interface DatabaseTask {
  id: string;
  title: string;
  description: string | null;
  status: TaskStatus;
  priority: TaskPriority;
  branch_id: string;
  assignee_id: string | null;
  client_id: string | null;
  due_date: string | null;
  created_at: string;
  updated_at: string;
  created_by: string | null;
  tags: string[];
  category: string;
  notes: string | null;
  completion_percentage: number;
  // Relations
  assignee?: {
    id: string;
    first_name: string;
    last_name: string;
  };
  client?: {
    id: string;
    first_name: string;
    last_name: string;
  };
  // Multiple assignees support
  assignees?: Array<{
    id: string;
    first_name: string;
    last_name: string;
    specialization?: string;
  }>;
  task_assignees?: Array<{
    staff: {
      id: string;
      first_name: string;
      last_name: string;
      specialization?: string;
    };
  }>;
}

export const useTasks = (branchId: string) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: tasks = [], isLoading, error } = useQuery({
    queryKey: ['tasks', branchId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('tasks')
        .select(`
          *,
          assignee:staff!tasks_assignee_id_fkey(id, first_name, last_name),
          client:clients(id, first_name, last_name),
          task_assignees(
            staff:staff(id, first_name, last_name, specialization)
          )
        `)
        .eq('branch_id', branchId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      // Transform data to flatten task_assignees
      const transformedData = data?.map(task => ({
        ...task,
        assignees: task.task_assignees?.map(ta => ta.staff).filter(Boolean) || []
      }));
      
      return transformedData as DatabaseTask[];
    },
  });

  const createTaskMutation = useMutation({
    mutationFn: async (newTask: Omit<DatabaseTask, 'id' | 'created_at' | 'updated_at' | 'assignee' | 'client' | 'assignees' | 'task_assignees'> & { assignee_ids?: string[] }) => {
      const { assignee_ids, ...taskData } = newTask as any;
      
      // Insert the task
      const { data: createdTask, error: taskError } = await supabase
        .from('tasks')
        .insert(taskData)
        .select()
        .single();

      if (taskError) throw taskError;

      // Insert assignees if provided
      if (assignee_ids && assignee_ids.length > 0) {
        const assigneeRecords = assignee_ids.map((staff_id, index) => ({
          task_id: createdTask.id,
          staff_id: staff_id,
          is_primary: index === 0 // First assignee is primary
        }));

        const { error: assigneeError } = await supabase
          .from('task_assignees')
          .insert(assigneeRecords);

        if (assigneeError) {
          console.error('Error inserting assignees:', assigneeError);
          // Don't throw - task is created, just log the error
        }
      }

      return createdTask;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks', branchId] });
      toast({
        title: "Task created",
        description: "New task has been created successfully.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to create task: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  const updateTaskMutation = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<DatabaseTask> & { id: string }) => {
      const { data, error } = await supabase
        .from('tasks')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks', branchId] });
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

  const deleteTaskMutation = useMutation({
    mutationFn: async (taskId: string) => {
      const { error } = await supabase
        .from('tasks')
        .delete()
        .eq('id', taskId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks', branchId] });
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

  return {
    tasks,
    isLoading,
    error,
    createTask: createTaskMutation.mutate,
    updateTask: updateTaskMutation.mutate,
    deleteTask: deleteTaskMutation.mutate,
    isCreating: createTaskMutation.isPending,
    isUpdating: updateTaskMutation.isPending,
    isDeleting: deleteTaskMutation.isPending,
  };
};

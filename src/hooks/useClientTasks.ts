import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useClientAuth } from '@/hooks/useClientAuth';
import { useToast } from '@/hooks/use-toast';

export interface ClientTask {
  id: string;
  title: string;
  description?: string;
  status: string;
  priority: string;
  due_date?: string;
  created_at: string;
  category?: string;
  notes?: string;
  completion_percentage?: number;
  client_can_complete: boolean;
  assignee_name?: string;
  staff?: {
    first_name: string;
    last_name: string;
  } | null;
}

const fetchClientTasks = async (clientId: string): Promise<ClientTask[]> => {
  if (!clientId) {
    return [];
  }

  console.log('Fetching tasks for client:', clientId);

  const { data, error } = await supabase
    .from('tasks')
    .select(`
      id,
      title,
      description,
      status,
      priority,
      due_date,
      created_at,
      category,
      notes,
      completion_percentage,
      client_can_complete,
      staff:assignee_id (
        first_name,
        last_name
      )
    `)
    .eq('client_id', clientId)
    .eq('client_visible', true)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching client tasks:', error);
    throw error;
  }

  console.log('Found client tasks:', data);

  return (data || []).map(task => ({
    ...task,
    assignee_name: task.staff ? `${task.staff.first_name} ${task.staff.last_name}` : null,
  }));
};

export const useClientTasks = () => {
  const { clientId } = useClientAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const tasksQuery = useQuery({
    queryKey: ['client-tasks', clientId],
    queryFn: () => fetchClientTasks(clientId!),
    enabled: Boolean(clientId),
  });

  const completeTaskMutation = useMutation({
    mutationFn: async (taskId: string) => {
      const { error } = await supabase
        .from('tasks')
        .update({ 
          status: 'done',
          completion_percentage: 100 
        })
        .eq('id', taskId)
        .eq('client_id', clientId)
        .eq('client_can_complete', true);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['client-tasks', clientId] });
      toast({
        title: "Task Completed",
        description: "Task has been marked as completed.",
      });
    },
    onError: (error: any) => {
      console.error('Error completing task:', error);
      toast({
        title: "Error",
        description: `Failed to complete task: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  return {
    tasks: tasksQuery.data || [],
    isLoading: tasksQuery.isLoading,
    error: tasksQuery.error,
    completeTask: completeTaskMutation.mutate,
    isCompleting: completeTaskMutation.isPending,
  };
};
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface CarePlanNotification {
  id: string;
  care_plan_id: string;
  user_id: string;
  notification_type: 'status_change' | 'approval_required' | 'rejection' | 'activation';
  title: string;
  message: string;
  read_at: string | null;
  created_at: string;
  care_plan_title?: string;
  care_plan_display_id?: string;
}

// Get notifications for care plan status changes
export const useCarePlanNotifications = (userId?: string) => {
  return useQuery({
    queryKey: ['care-plan-notifications', userId],
    queryFn: async () => {
      if (!userId) throw new Error('User ID required');

      const { data, error } = await supabase
        .from('notifications')
        .select(`
          id,
          title,
          message,
          read_at,
          created_at,
          type,
          data
        `)
        .eq('user_id', userId)
        .eq('type', 'care_plan')
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;

      return data?.map(notification => {
        const notificationData = notification.data as any;
        return {
          id: notification.id,
          care_plan_id: notificationData?.care_plan_id || '',
          user_id: userId,
          notification_type: notificationData?.action || 'status_change',
          title: notification.title,
          message: notification.message,
          read_at: notification.read_at,
          created_at: notification.created_at,
          care_plan_title: notificationData?.care_plan_title,
          care_plan_display_id: notificationData?.care_plan_display_id,
        };
      }) as CarePlanNotification[] || [];
    },
    enabled: !!userId,
    refetchInterval: 30000, // Refetch every 30 seconds for real-time feel
  });
};

// Create notification when care plan status changes
export const useCreateCarePlanNotification = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      userId,
      carePlanId,
      notificationType,
      title,
      message,
      carePlanTitle,
      carePlanDisplayId
    }: {
      userId: string;
      carePlanId: string;
      notificationType: CarePlanNotification['notification_type'];
      title: string;
      message: string;
      carePlanTitle?: string;
      carePlanDisplayId?: string;
    }) => {
      // Get user's branch for notification
      let branchId = null;
      try {
        const { data: clientData } = await supabase
          .from('clients')
          .select('branch_id')
          .eq('auth_user_id', userId)
          .single();
        
        if (clientData) {
          branchId = clientData.branch_id;
        } else {
          // Try staff table
          const { data: staffData } = await supabase
            .from('staff')
            .select('branch_id')
            .eq('id', userId)
            .single();
          
          if (staffData) {
            branchId = staffData.branch_id;
          }
        }
      } catch (error) {
        console.warn('Could not determine branch for notification:', error);
      }

      const { data, error } = await supabase
        .from('notifications')
        .insert({
          user_id: userId,
          branch_id: branchId,
          type: 'care_plan',
          category: 'info',
          priority: notificationType === 'approval_required' ? 'high' : 'medium',
          title,
          message,
          data: {
            care_plan_id: carePlanId,
            action: notificationType,
            care_plan_title: carePlanTitle,
            care_plan_display_id: carePlanDisplayId
          }
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['care-plan-notifications'] });
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
    onError: (error) => {
      console.error('Failed to create care plan notification:', error);
    }
  });
};

// Mark notification as read
export const useMarkNotificationAsRead = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (notificationId: string) => {
      const { error } = await supabase
        .from('notifications')
        .update({ read_at: new Date().toISOString() })
        .eq('id', notificationId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['care-plan-notifications'] });
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
    onError: (error) => {
      console.error('Failed to mark notification as read:', error);
    }
  });
};

// Get unread care plan notifications count
export const useUnreadCarePlanNotificationsCount = (userId?: string) => {
  return useQuery({
    queryKey: ['unread-care-plan-notifications-count', userId],
    queryFn: async () => {
      if (!userId) return 0;

      const { count, error } = await supabase
        .from('notifications')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
        .eq('type', 'care_plan')
        .is('read_at', null);

      if (error) throw error;
      return count || 0;
    },
    enabled: !!userId,
    refetchInterval: 30000,
  });
};
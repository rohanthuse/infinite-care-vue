import { useMemo } from 'react';
import { useNotifications } from './useNotifications';

interface CategoryCounts {
  staff: { total: number; unread: number };
  client: { total: number; unread: number };
  system: { total: number; unread: number };
  medication: { total: number; unread: number };
  rota: { total: number; unread: number };
  document: { total: number; unread: number };
  reports: { total: number; unread: number };
}

// Map category IDs to notification types in the database
const CATEGORY_TYPE_MAPPING: Record<string, string[]> = {
  staff: ['booking', 'leave_request', 'training'],
  client: ['client_request', 'appointment'],
  system: ['system_alert', 'error'],
  medication: ['medication_reminder', 'medication_alert'],
  rota: ['rota_change', 'schedule_conflict'],
  document: ['document_update', 'document_expiry'],
  reports: ['report_ready', 'report_error'],
};

export const useNotificationCategoryCounts = (branchId?: string) => {
  const { notifications, isLoading, error } = useNotifications(branchId);

  const categoryCounts = useMemo(() => {
    if (!notifications) {
      return {
        staff: { total: 0, unread: 0 },
        client: { total: 0, unread: 0 },
        system: { total: 0, unread: 0 },
        medication: { total: 0, unread: 0 },
        rota: { total: 0, unread: 0 },
        document: { total: 0, unread: 0 },
        reports: { total: 0, unread: 0 },
      };
    }

    const counts: CategoryCounts = {
      staff: { total: 0, unread: 0 },
      client: { total: 0, unread: 0 },
      system: { total: 0, unread: 0 },
      medication: { total: 0, unread: 0 },
      rota: { total: 0, unread: 0 },
      document: { total: 0, unread: 0 },
      reports: { total: 0, unread: 0 },
    };

    notifications.forEach(notification => {
      // Find which category this notification type belongs to
      const categoryEntry = Object.entries(CATEGORY_TYPE_MAPPING).find(([_, types]) => 
        types.includes(notification.type)
      );
      
      if (categoryEntry) {
        const [category] = categoryEntry;
        const categoryKey = category as keyof CategoryCounts;
        
        counts[categoryKey].total++;
        if (!notification.read_at) {
          counts[categoryKey].unread++;
        }
      }
    });

    return counts;
  }, [notifications]);

  return {
    categoryCounts,
    isLoading,
    error
  };
};
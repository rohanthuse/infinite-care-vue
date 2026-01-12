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
  message: { total: number; unread: number };
}

// Map category IDs to notification types in the database
// These types match the actual values stored in the notifications table
const CATEGORY_TYPE_MAPPING: Record<string, string[]> = {
  staff: ['booking', 'task', 'staff', 'leave_request', 'training', 'unassigned_booking', 'booking_unavailability'],
  client: ['client', 'client_request', 'appointment', 'pending_agreement'],
  system: ['system', 'system_alert', 'error', 'demo_request', 'info'],
  medication: ['medication', 'medication_reminder', 'medication_alert'],
  rota: ['rota', 'rota_change', 'schedule_conflict'],
  document: ['document', 'document_update', 'document_expiry'],
  reports: ['care_plan', 'report_ready', 'report_error', 'service_report', 'service_report_status'],
  message: ['message'],
};

export const useNotificationCategoryCounts = (branchId?: string) => {
  const { notifications, isLoading, error } = useNotifications(branchId);

  const categoryCounts = useMemo(() => {
    const defaultCounts: CategoryCounts = {
      staff: { total: 0, unread: 0 },
      client: { total: 0, unread: 0 },
      system: { total: 0, unread: 0 },
      medication: { total: 0, unread: 0 },
      rota: { total: 0, unread: 0 },
      document: { total: 0, unread: 0 },
      reports: { total: 0, unread: 0 },
      message: { total: 0, unread: 0 },
    };

    if (!notifications) {
      return defaultCounts;
    }

    const counts: CategoryCounts = { ...defaultCounts };

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
      } else {
        // Fallback: categorize unknown types as 'system'
        counts.system.total++;
        if (!notification.read_at) {
          counts.system.unread++;
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

import React from "react";
import { Bell, AlertTriangle, CheckCircle, Clock } from "lucide-react";
import { useSystemNotifications } from "@/hooks/useSystemNotifications";
import { SystemNotificationsTable } from "@/components/system/SystemNotificationsTable";
import { Badge } from "@/components/ui/badge";
import NotificationCard from "@/components/workflow/NotificationCard";

export const NotificationsTab: React.FC = () => {
  const { notifications, unreadCount, isLoading } = useSystemNotifications();

  // Calculate statistics
  const totalCount = notifications.length;
  const highPriorityCount = notifications.filter(
    n => (n.priority === 'urgent' || n.priority === 'high') && !n.read_at
  ).length;
  const recentCount = notifications.filter(
    n => {
      const created = new Date(n.created_at);
      const now = new Date();
      const hoursDiff = (now.getTime() - created.getTime()) / (1000 * 60 * 60);
      return hoursDiff <= 24;
    }
  ).length;

  return (
    <div className="space-y-6">
      {/* Info Header */}
      <div className="bg-card rounded-lg shadow-sm border border-border p-6">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2 bg-primary/10 rounded-lg">
            <Bell className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h2 className="text-2xl font-bold">System Notifications</h2>
            <p className="text-sm text-muted-foreground">
              Monitor and manage all system-level notifications
            </p>
          </div>
        </div>
        <div className="flex gap-2 mt-4">
          <Badge variant="default" className="text-xs">
            Total: {totalCount}
          </Badge>
          <Badge variant="destructive" className="text-xs">
            Unread: {unreadCount}
          </Badge>
          <Badge variant="warning" className="text-xs">
            High Priority: {highPriorityCount}
          </Badge>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <NotificationCard
          title="Total Notifications"
          count={totalCount}
          icon={Bell}
          color="text-primary"
          bgColor="bg-primary/5"
          borderColor="border-primary/20"
          description="All notifications"
        />
        <NotificationCard
          title="Unread"
          count={unreadCount}
          icon={AlertTriangle}
          color="text-destructive"
          bgColor="bg-destructive/5"
          borderColor="border-destructive/20"
          description="Requires attention"
        />
        <NotificationCard
          title="High Priority"
          count={highPriorityCount}
          icon={AlertTriangle}
          color="text-orange-600"
          bgColor="bg-orange-50"
          borderColor="border-orange-200"
          description="Urgent or high priority"
        />
        <NotificationCard
          title="Recent (24h)"
          count={recentCount}
          icon={Clock}
          color="text-blue-600"
          bgColor="bg-blue-50"
          borderColor="border-blue-200"
          description="Last 24 hours"
        />
      </div>

      {/* Notifications Table */}
      <div className="bg-card rounded-lg shadow-sm border border-border p-6">
        <h3 className="text-lg font-semibold mb-4">All Notifications</h3>
        <SystemNotificationsTable />
      </div>
    </div>
  );
};

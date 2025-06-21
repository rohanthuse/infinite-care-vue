
import React from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Bell, Clock, AlertTriangle, CheckCircle, User, Calendar } from "lucide-react";
import { useNotifications, Notification } from "@/hooks/useNotifications";
import { formatDistanceToNow } from "date-fns";
import { cn } from "@/lib/utils";
import { ErrorBoundary } from "@/components/care/ErrorBoundary";

interface NotificationDropdownProps {
  branchId?: string;
  onViewAll?: () => void;
}

export const NotificationDropdown: React.FC<NotificationDropdownProps> = ({
  branchId,
  onViewAll,
}) => {
  const { notifications, stats, markAsRead, markAllAsRead, isMarkingAllAsRead, error } = useNotifications(branchId);

  const getIcon = (type: Notification['type'], category: Notification['category']) => {
    const iconClass = "h-4 w-4";
    
    try {
      switch (type) {
        case 'booking':
        case 'appointment':
          return <Calendar className={cn(iconClass, category === 'warning' ? 'text-amber-500' : 'text-blue-500')} />;
        case 'task':
          return <CheckCircle className={cn(iconClass, 'text-green-500')} />;
        case 'system':
          return <AlertTriangle className={cn(iconClass, category === 'error' ? 'text-red-500' : 'text-gray-500')} />;
        default:
          return <Bell className={cn(iconClass, 'text-gray-500')} />;
      }
    } catch (error) {
      console.warn('Error rendering notification icon:', error);
      return <Bell className={cn(iconClass, 'text-gray-500')} />;
    }
  };

  const getPriorityColor = (priority: Notification['priority']) => {
    try {
      switch (priority) {
        case 'urgent':
          return 'border-l-red-500 bg-red-50';
        case 'high':
          return 'border-l-orange-500 bg-orange-50';
        case 'medium':
          return 'border-l-blue-500 bg-blue-50';
        case 'low':
          return 'border-l-gray-500 bg-gray-50';
        default:
          return 'border-l-gray-300';
      }
    } catch (error) {
      console.warn('Error getting priority color:', error);
      return 'border-l-gray-300';
    }
  };

  const handleMarkAsRead = (notificationId: string) => {
    try {
      markAsRead(notificationId);
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const handleMarkAllAsRead = () => {
    try {
      markAllAsRead();
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    }
  };

  if (error) {
    console.warn("Error in notification dropdown:", error);
  }

  const recentNotifications = notifications?.slice(0, 6) || [];

  return (
    <ErrorBoundary fallback={
      <Button variant="outline" size="icon" className="h-9 w-9 rounded-full">
        <Bell className="h-4 w-4" />
      </Button>
    }>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="icon" className="h-9 w-9 rounded-full relative">
            <Bell className="h-4 w-4" />
            {stats && stats.unread_count > 0 && (
              <Badge 
                variant="destructive" 
                className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs"
              >
                {stats.unread_count > 99 ? '99+' : stats.unread_count}
              </Badge>
            )}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-80">
          <DropdownMenuLabel className="flex items-center justify-between">
            <span>Notifications</span>
            {stats && stats.unread_count > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleMarkAllAsRead}
                disabled={isMarkingAllAsRead}
                className="text-xs"
              >
                Mark all read
              </Button>
            )}
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          
          {recentNotifications.length === 0 ? (
            <div className="p-4 text-center text-gray-500 text-sm">
              No notifications yet
            </div>
          ) : (
            <>
              {recentNotifications.map((notification) => (
                <DropdownMenuItem
                  key={notification.id}
                  className={cn(
                    "flex items-start gap-3 p-3 cursor-pointer border-l-4",
                    getPriorityColor(notification.priority),
                    !notification.read_at && "bg-opacity-75"
                  )}
                  onClick={() => handleMarkAsRead(notification.id)}
                >
                  <div className="flex-shrink-0 mt-0.5">
                    {getIcon(notification.type, notification.category)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <p className="font-medium text-sm truncate">{notification.title}</p>
                      {!notification.read_at && (
                        <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0 ml-2" />
                      )}
                    </div>
                    <p className="text-xs text-gray-600 mt-1 line-clamp-2">{notification.message}</p>
                    <div className="flex items-center gap-2 mt-2">
                      <Clock className="h-3 w-3 text-gray-400" />
                      <span className="text-xs text-gray-500">
                        {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}
                      </span>
                    </div>
                  </div>
                </DropdownMenuItem>
              ))}
              <DropdownMenuSeparator />
              <DropdownMenuItem 
                className="text-center justify-center text-blue-600 hover:text-blue-700"
                onClick={onViewAll}
              >
                View all notifications
              </DropdownMenuItem>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    </ErrorBoundary>
  );
};

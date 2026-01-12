import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Bell, Check, CheckCheck, MessageSquare, FileText, AlertCircle } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

import { useSystemNotifications, SystemNotification } from "@/hooks/useSystemNotifications";
import { formatDistanceToNow } from "date-fns";
import { cn } from "@/lib/utils";

export const SystemNotifications: React.FC = () => {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const { notifications, unreadCount, isLoading, markAsRead, markAllAsRead } = useSystemNotifications();

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'demo_request':
        return <MessageSquare className="h-4 w-4" />;
      case 'system':
        return <AlertCircle className="h-4 w-4" />;
      default:
        return <FileText className="h-4 w-4" />;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return 'text-destructive';
      case 'high':
        return 'text-orange-500';
      case 'medium':
        return 'text-yellow-500';
      default:
        return 'text-muted-foreground';
    }
  };

  const handleNotificationClick = (notification: SystemNotification) => {
    // Mark as read if unread
    if (!notification.read_at) {
      markAsRead(notification.id);
    }
    
    // Navigate based on notification type
    if (notification.type === 'demo_request') {
      setOpen(false);
      navigate('/system-dashboard?tab=reports');
    }
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge
              variant="destructive"
              className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs"
            >
              {unreadCount > 9 ? '9+' : unreadCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-96" align="end">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-lg">Notifications</h3>
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => markAllAsRead()}
              className="text-xs"
            >
              <CheckCheck className="h-4 w-4 mr-1" />
              Mark all read
            </Button>
          )}
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
            <Bell className="h-12 w-12 mb-2 opacity-50" />
            <p className="text-sm">No notifications</p>
          </div>
        ) : (
          <div className="max-h-[400px] overflow-y-auto dialog-scrollable -mx-1 px-1">
            <div className="space-y-2">
              {notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={cn(
                    "p-3 rounded-lg border transition-colors cursor-pointer",
                    notification.read_at
                      ? "bg-background border-border hover:bg-accent/50"
                      : "bg-accent/30 border-primary/20 hover:bg-accent/50"
                  )}
                  onClick={() => handleNotificationClick(notification)}
                >
                  <div className="flex gap-3">
                    <div className={cn(
                      "p-2 rounded-full h-fit",
                      notification.read_at ? "bg-muted" : "bg-primary/10"
                    )}>
                      {getNotificationIcon(notification.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <h4 className="font-medium text-sm line-clamp-1">
                          {notification.title}
                        </h4>
                        {!notification.read_at && (
                          <div className="h-2 w-2 rounded-full bg-primary flex-shrink-0 mt-1" />
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground line-clamp-2 mb-2">
                        {notification.message}
                      </p>
                      <div className="flex items-center gap-2 text-xs">
                        <span className={getPriorityColor(notification.priority)}>
                          {notification.priority.toUpperCase()}
                        </span>
                        <span className="text-muted-foreground">
                          {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
        
        <div className="border-t mt-4 pt-4">
          <Button
            variant="outline"
            className="w-full"
            onClick={() => {
              setOpen(false);
              navigate('/system-dashboard?tab=notifications');
            }}
          >
            View All Notifications
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
};

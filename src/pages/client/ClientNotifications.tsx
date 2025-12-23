import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Bell, 
  Clock, 
  AlertTriangle, 
  CheckCircle, 
  Calendar, 
  MessageCircle,
  FileText,
  BookOpen,
  ScrollText,
  Activity,
  CreditCard,
  File,
  BarChart,
} from "lucide-react";
import { useNotifications, Notification } from "@/hooks/useNotifications";
import { formatDistanceToNow } from "date-fns";
import { cn } from "@/lib/utils";
import { ErrorBoundary } from "@/components/care/ErrorBoundary";
import { useNavigate } from "react-router-dom";
import { useClientNavigation } from "@/hooks/useClientNavigation";
import { 
  getNotificationRoute, 
  storeDeepLinkData,
  getEffectiveNotificationType,
} from "@/utils/notificationRouting";

export default function ClientNotifications() {
  const { notifications, stats, markAsRead, markAllAsRead, isMarkingAllAsRead, error } = useNotifications();
  const navigate = useNavigate();
  const { createClientPath } = useClientNavigation();

  const getIcon = (type: string, category: Notification['category']) => {
    const iconClass = "h-5 w-5";
    
    if (type === 'booking' || type === 'appointment') {
      return <Calendar className={cn(iconClass, category === 'warning' ? 'text-amber-500' : 'text-blue-500')} />;
    } else if (type === 'task' || type === 'events_logs') {
      return <AlertTriangle className={cn(iconClass, 'text-orange-500')} />;
    } else if (type === 'message') {
      return <MessageCircle className={cn(iconClass, 'text-blue-500')} />;
    } else if (type === 'care_plan') {
      return <FileText className={cn(iconClass, 'text-green-500')} />;
    } else if (type === 'form') {
      return <FileText className={cn(iconClass, 'text-purple-500')} />;
    } else if (type === 'agreement') {
      return <ScrollText className={cn(iconClass, 'text-indigo-500')} />;
    } else if (type === 'library') {
      return <BookOpen className={cn(iconClass, 'text-cyan-500')} />;
    } else if (type === 'document') {
      return <File className={cn(iconClass, 'text-gray-500')} />;
    } else if (type === 'medication' || type === 'health') {
      return <Activity className={cn(iconClass, 'text-red-500')} />;
    } else if (type === 'payment') {
      return <CreditCard className={cn(iconClass, 'text-emerald-500')} />;
    } else if (type === 'service_report') {
      return <BarChart className={cn(iconClass, 'text-teal-500')} />;
    } else if (type === 'system') {
      return <AlertTriangle className={cn(iconClass, category === 'error' ? 'text-red-500' : 'text-gray-500')} />;
    }
    return <Bell className={cn(iconClass, 'text-gray-500')} />;
  };

  const getPriorityColor = (priority: Notification['priority']) => {
    switch (priority) {
      case 'urgent':
        return 'border-l-red-500 bg-red-50/50 dark:bg-red-950/20';
      case 'high':
        return 'border-l-orange-500 bg-orange-50/50 dark:bg-orange-950/20';
      case 'medium':
        return 'border-l-blue-500 bg-blue-50/50 dark:bg-blue-950/20';
      case 'low':
        return 'border-l-gray-500 bg-gray-50/50 dark:bg-gray-800/20';
      default:
        return 'border-l-gray-300 dark:border-l-gray-600';
    }
  };

  const handleNotificationClick = (notification: Notification) => {
    const effectiveType = getEffectiveNotificationType(notification);
    
    console.log('[ClientNotifications] Click:', {
      id: notification.id,
      type: notification.type,
      dataNotificationType: (notification.data as any)?.notification_type,
      effectiveType,
      data: notification.data
    });
    
    // Mark notification as read
    markAsRead(notification.id);
    
    // Store deep-link data for auto-opening
    storeDeepLinkData(notification);
    
    // Get route for this notification type
    const route = getNotificationRoute(notification, 'client');
    
    if (route) {
      const fullPath = createClientPath(route);
      console.log('[ClientNotifications] Navigating to:', fullPath);
      navigate(fullPath);
    } else {
      console.log('[ClientNotifications] No route found for type:', effectiveType);
    }
  };

  const handleMarkAllAsRead = () => {
    markAllAsRead();
  };

  const getTypeLabel = (type: string): string => {
    const labels: Record<string, string> = {
      booking: 'Appointment',
      appointment: 'Appointment',
      care_plan: 'Care Plan',
      task: 'Task',
      events_logs: 'Event',
      message: 'Message',
      document: 'Document',
      form: 'Form',
      agreement: 'Agreement',
      library: 'Library',
      service_report: 'Service Report',
      medication: 'Medication',
      health: 'Health',
      payment: 'Payment',
      review: 'Feedback',
      system: 'System',
    };
    return labels[type] || type;
  };

  if (error) {
    return (
      <div className="p-6">
        <Card>
          <CardContent className="p-6 text-center">
            <p className="text-red-600 dark:text-red-400">Failed to load notifications. Please try again later.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <ErrorBoundary fallback={<div className="p-6 text-center text-red-600 dark:text-red-400">Error loading notifications</div>}>
      <div className="w-full min-w-0 max-w-full space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl md:text-2xl font-bold text-foreground">Notifications</h1>
            <p className="text-muted-foreground">Stay up to date with your care updates</p>
          </div>
          {stats && stats.unread_count > 0 && (
            <Button
              onClick={handleMarkAllAsRead}
              disabled={isMarkingAllAsRead}
              variant="outline"
            >
              Mark all read ({stats.unread_count})
            </Button>
          )}
        </div>

        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <Bell className="h-5 w-5 text-blue-500" />
                  <div>
                    <p className="text-sm font-medium text-foreground">Total</p>
                    <p className="text-2xl font-bold text-foreground">{stats.total_count}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-blue-500 rounded-full" />
                  <div>
                    <p className="text-sm font-medium text-foreground">Unread</p>
                    <p className="text-2xl font-bold text-foreground">{stats.unread_count}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-orange-500" />
                  <div>
                    <p className="text-sm font-medium text-foreground">High Priority</p>
                    <p className="text-2xl font-bold text-foreground">{stats.high_priority_count}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-green-500" />
                  <div>
                    <p className="text-sm font-medium text-foreground">Care Plans</p>
                    <p className="text-2xl font-bold text-foreground">{stats.by_type?.care_plan?.total || 0}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5" />
              All Notifications
            </CardTitle>
          </CardHeader>
          <CardContent>
            {!notifications || notifications.length === 0 ? (
              <div className="text-center py-8">
                <Bell className="h-12 w-12 text-gray-400 dark:text-muted-foreground mx-auto mb-4" />
                <p className="text-gray-500 dark:text-muted-foreground">No notifications yet</p>
                <p className="text-sm text-gray-400 dark:text-muted-foreground/70">You'll see your care updates here</p>
              </div>
            ) : (
              <div className="space-y-3">
                {notifications.map((notification) => (
                  <div
                    key={notification.id}
                    className={cn(
                      "flex items-start gap-4 p-4 rounded-lg border-l-4 cursor-pointer hover:bg-gray-50 dark:hover:bg-muted/50 transition-colors",
                      getPriorityColor(notification.priority),
                      !notification.read_at && "bg-opacity-75"
                    )}
                    onClick={() => handleNotificationClick(notification)}
                  >
                    <div className="flex-shrink-0 mt-1">
                      {getIcon(notification.type, notification.category)}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className="font-medium text-sm text-foreground">{notification.title}</p>
                            {!notification.read_at && (
                              <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0" />
                            )}
                            <Badge variant={notification.priority === 'urgent' ? 'destructive' : 'secondary'} className="text-xs">
                              {notification.priority}
                            </Badge>
                          </div>
                          <p className="text-sm text-gray-600 dark:text-muted-foreground mt-1">{notification.message}</p>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-4 mt-3 text-xs text-gray-500 dark:text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          <span>{formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}</span>
                        </div>
                        <Badge variant="outline" className="text-xs">
                          {getTypeLabel(notification.type)}
                        </Badge>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </ErrorBoundary>
  );
}

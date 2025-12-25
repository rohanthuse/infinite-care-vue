import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Bell, Clock, AlertTriangle, CheckCircle, User, Calendar, MessageCircle, Filter, FileText, Eye } from "lucide-react";
import { useNotifications, Notification } from "@/hooks/useNotifications";
import { useCarerAssignments } from "@/hooks/useEventsLogs";
import { formatDistanceToNow } from "date-fns";
import { cn } from "@/lib/utils";
import { ErrorBoundary } from "@/components/care/ErrorBoundary";
import { useNavigate } from "react-router-dom";
import { useCarerNavigation } from "@/hooks/useCarerNavigation";
import { 
  getNotificationRoute, 
  storeDeepLinkData,
  getEffectiveNotificationType,
} from "@/utils/notificationRouting";

export default function CarerNotifications() {
  const { notifications, stats, markAsRead, markAllAsRead, isMarkingAllAsRead, error } = useNotifications();
  const { data: assignments = [], isLoading: assignmentsLoading } = useCarerAssignments();
  const navigate = useNavigate();
  const { createCarerPath } = useCarerNavigation();

  const getIcon = (type: Notification['type'], category: Notification['category']) => {
    const iconClass = "h-5 w-5";
    
    switch (type) {
      case 'booking':
      case 'appointment':
        return <Calendar className={cn(iconClass, category === 'warning' ? 'text-amber-500' : 'text-blue-500')} />;
      case 'task':
        return <CheckCircle className={cn(iconClass, 'text-green-500')} />;
      case 'message':
        return <MessageCircle className={cn(iconClass, 'text-blue-500')} />;
      case 'system':
        return <AlertTriangle className={cn(iconClass, category === 'error' ? 'text-red-500' : 'text-muted-foreground')} />;
      default:
        return <Bell className={cn(iconClass, 'text-muted-foreground')} />;
    }
  };

  const getPriorityColor = (priority: Notification['priority']) => {
    switch (priority) {
      case 'urgent':
        return 'border-l-red-500 bg-red-50/50 dark:bg-red-950/30';
      case 'high':
        return 'border-l-orange-500 bg-orange-50/50 dark:bg-orange-950/30';
      case 'medium':
        return 'border-l-blue-500 bg-blue-50/50 dark:bg-blue-950/30';
      case 'low':
        return 'border-l-gray-500 bg-gray-50/50 dark:bg-gray-800/30';
      default:
        return 'border-l-gray-300 dark:border-l-gray-600';
    }
  };

  const handleNotificationClick = (notification: Notification) => {
    const effectiveType = getEffectiveNotificationType(notification);
    
    console.log('[CarerNotifications] Click:', {
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
    
    // Special handling for task/events with client_id - navigate to client page
    if ((effectiveType === 'task' || effectiveType === 'events_logs') && notification.data?.client_id) {
      const path = createCarerPath(`/clients/${notification.data.client_id}`);
      console.log('[CarerNotifications] Navigating to client:', path);
      navigate(path);
      return;
    }
    
    // Special handling for client notifications
    if (effectiveType === 'client' && notification.data?.client_id) {
      const path = createCarerPath(`/clients/${notification.data.client_id}`);
      console.log('[CarerNotifications] Navigating to client:', path);
      navigate(path);
      return;
    }
    
    // Get route for this notification type
    const route = getNotificationRoute(notification, 'carer');
    
    if (route) {
      const fullPath = createCarerPath(route);
      console.log('[CarerNotifications] Navigating to:', fullPath);
      navigate(fullPath);
    } else {
      console.log('[CarerNotifications] No route found for type:', effectiveType);
    }
  };

  const handleMarkAllAsRead = () => {
    markAllAsRead();
  };

  const handleViewAssignment = (assignmentId: string, clientId: string) => {
    // Store event details for auto-opening
    sessionStorage.setItem('openEventId', assignmentId);
    sessionStorage.setItem('openEventClientId', clientId);
    
    // Navigate to client detail page
    navigate(createCarerPath(`/clients/${clientId}`));
  };

  const getSeverityColor = (severity: string) => {
    switch (severity.toLowerCase()) {
      case 'high':
      case 'critical':
        return 'border-l-red-500 bg-red-50/50 dark:bg-red-950/30';
      case 'medium':
        return 'border-l-orange-500 bg-orange-50/50 dark:bg-orange-950/30';
      case 'low':
        return 'border-l-blue-500 bg-blue-50/50 dark:bg-blue-950/30';
      default:
        return 'border-l-gray-300 dark:border-l-gray-600';
    }
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
    <div className="w-full min-w-0 max-w-full space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl md:text-2xl font-bold">Notifications</h1>
          <p className="text-muted-foreground">Stay up to date with your assignments and updates</p>
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
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Bell className="h-5 w-5 text-blue-500" />
                <div>
                  <p className="text-sm font-medium">Total</p>
                  <p className="text-2xl font-bold">{stats.total_count}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-blue-500 rounded-full" />
                <div>
                  <p className="text-sm font-medium">Unread</p>
                  <p className="text-2xl font-bold">{stats.unread_count}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-orange-500" />
                <div>
                  <p className="text-sm font-medium">High Priority</p>
                  <p className="text-2xl font-bold">{stats.high_priority_count}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-green-500" />
                <div>
                  <p className="text-sm font-medium">Tasks</p>
                  <p className="text-2xl font-bold">{stats.by_type?.task?.total || 0}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Your Assignments Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Your Recent Assignments
          </CardTitle>
        </CardHeader>
        <CardContent>
          {assignmentsLoading ? (
            <div className="text-center py-4">
              <p className="text-muted-foreground">Loading assignments...</p>
            </div>
          ) : assignments.length === 0 ? (
            <div className="text-center py-8">
              <FileText className="h-12 w-12 text-muted-foreground/50 mx-auto mb-4" />
              <p className="text-muted-foreground">No recent assignments</p>
              <p className="text-sm text-muted-foreground/70">New client events will appear here</p>
            </div>
          ) : (
            <div className="space-y-3">
              {assignments.slice(0, 5).map((assignment) => (
                <div
                  key={assignment.id}
                  className={cn(
                    "flex items-start gap-4 p-4 rounded-lg border-l-4 cursor-pointer hover:bg-muted transition-colors",
                    getSeverityColor(assignment.severity)
                  )}
                  onClick={() => handleViewAssignment(assignment.id, assignment.client_id)}
                >
                  <div className="flex-shrink-0 mt-1">
                    <AlertTriangle className={cn(
                      "h-5 w-5",
                      assignment.severity === 'high' || assignment.severity === 'critical' 
                        ? "text-red-500" 
                        : assignment.severity === 'medium' 
                        ? "text-orange-500" 
                        : "text-blue-500"
                    )} />
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <p className="font-medium text-sm">{assignment.title}</p>
                          <Badge 
                            variant="custom" 
                            className={cn(
                              "text-xs",
                              (assignment.severity === 'high' || assignment.severity === 'critical') 
                                ? "bg-red-500 text-white dark:bg-red-600"
                                : assignment.severity === 'medium'
                                ? "bg-orange-500 text-white dark:bg-orange-600"
                                : "bg-blue-500 text-white dark:bg-blue-600"
                            )}
                          >
                            {assignment.severity}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">
                          Client: {assignment.client_name}
                        </p>
                        {assignment.description && (
                          <p className="text-sm text-muted-foreground/80 mt-1 overflow-hidden text-ellipsis" style={{
                            display: '-webkit-box',
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: 'vertical'
                          }}>
                            {assignment.description}
                          </p>
                        )}
                      </div>
                      <Button variant="ghost" size="sm">
                        <Eye className="h-4 w-4" />
                      </Button>
                    </div>
                    
                    <div className="flex items-center gap-4 mt-3 text-xs text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        <span>{formatDistanceToNow(new Date(assignment.created_at), { addSuffix: true })}</span>
                      </div>
                      {assignment.category && (
                        <Badge variant="outline" className="text-xs">
                          {assignment.category}
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              ))}
              
              {assignments.length > 5 && (
                <div className="pt-2 text-center">
                  <Button variant="ghost" size="sm">
                    View all assignments ({assignments.length})
                  </Button>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

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
              <Bell className="h-12 w-12 text-muted-foreground/50 mx-auto mb-4" />
              <p className="text-muted-foreground">No notifications yet</p>
              <p className="text-sm text-muted-foreground/70">You'll see your assignments and updates here</p>
            </div>
          ) : (
            <div className="space-y-3">
              {notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={cn(
                    "flex items-start gap-4 p-4 rounded-lg border-l-4 cursor-pointer hover:bg-muted transition-colors",
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
                        <div className="flex items-center gap-2">
                          <p className="font-medium text-sm">{notification.title}</p>
                          {!notification.read_at && (
                            <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0" />
                          )}
                          <Badge 
                            variant="custom" 
                            className={cn(
                              "text-xs",
                              notification.priority === 'urgent' 
                                ? "bg-red-500 text-white dark:bg-red-600"
                                : notification.priority === 'high'
                                ? "bg-orange-500 text-white dark:bg-orange-600"
                                : notification.priority === 'medium'
                                ? "bg-blue-500 text-white dark:bg-blue-600"
                                : "bg-gray-500 text-white dark:bg-gray-600"
                            )}
                          >
                            {notification.priority}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">{notification.message}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-4 mt-3 text-xs text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        <span>{formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}</span>
                      </div>
                      <Badge variant="outline" className="text-xs">
                        {notification.type}
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
  );
}


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

import { Bell, Clock, AlertTriangle, CheckCircle, User, Calendar, MessageCircle, FileText } from "lucide-react";
import { useNotifications, Notification } from "@/hooks/useNotifications";
import { formatDistanceToNow } from "date-fns";
import { cn } from "@/lib/utils";
import { ErrorBoundary } from "@/components/care/ErrorBoundary";
import { useNavigate, useLocation } from "react-router-dom";
import { 
  detectUserContext, 
  getNotificationRoute, 
  storeDeepLinkData,
  getEffectiveNotificationType,
  getOrgNotificationRoute,
  UserContext,
} from "@/utils/notificationRouting";

interface NotificationDropdownProps {
  branchId?: string;
  organizationId?: string;
  onViewAll?: () => void;
}

export const NotificationDropdown: React.FC<NotificationDropdownProps> = ({
  branchId,
  organizationId,
  onViewAll,
}) => {
  const { notifications, stats, markAsRead, markAllAsRead, isMarkingAllAsRead, error } = useNotifications(branchId, organizationId);
  const navigate = useNavigate();
  const location = useLocation();
  const userContext = detectUserContext(location.pathname);

  const getIcon = (type: Notification['type'], category: Notification['category'], notification?: Notification) => {
    const iconClass = "h-4 w-4";
    
    try {
      // Check for tenant_agreement type from data.notification_type
      const dataNotificationType = (notification?.data as any)?.notification_type;
      if (dataNotificationType === 'tenant_agreement') {
        return <FileText className={cn(iconClass, 'text-purple-500')} />;
      }
      
      // Check for meeting type from data.notification_type
      if (dataNotificationType?.startsWith('meeting_')) {
        return <Calendar className={cn(iconClass, 'text-purple-500')} />;
      }
      
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
    } catch (error) {
      console.warn('Error rendering notification icon:', error);
      return <Bell className={cn(iconClass, 'text-muted-foreground')} />;
    }
  };

  const getPriorityColor = (priority: Notification['priority']) => {
    try {
      switch (priority) {
        case 'urgent':
          return 'border-l-red-500 bg-red-50 dark:bg-red-950/50 hover:bg-red-100 dark:hover:bg-red-900/60';
        case 'high':
          return 'border-l-orange-500 bg-orange-50 dark:bg-orange-950/50 hover:bg-orange-100 dark:hover:bg-orange-900/60';
        case 'medium':
          return 'border-l-blue-500 bg-blue-50 dark:bg-blue-950/50 hover:bg-blue-100 dark:hover:bg-blue-900/60';
        case 'low':
          return 'border-l-gray-500 bg-gray-50 dark:bg-gray-800/50 hover:bg-gray-100 dark:hover:bg-gray-700/60';
        default:
          return 'border-l-gray-300 dark:border-l-gray-600 hover:bg-gray-100 dark:hover:bg-gray-800/60';
      }
    } catch (error) {
      console.warn('Error getting priority color:', error);
      return 'border-l-gray-300 dark:border-l-gray-600 hover:bg-gray-100 dark:hover:bg-gray-800/60';
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

  const handleNotificationClick = (notification: Notification) => {
    try {
      const currentPath = location.pathname;
      const effectiveType = getEffectiveNotificationType(notification);
      
      console.log('[NotificationDropdown] Click:', {
        id: notification.id,
        type: notification.type,
        dataNotificationType: (notification.data as any)?.notification_type,
        effectiveType,
        userContext,
        currentPath
      });
      
      // Mark notification as read
      markAsRead(notification.id);
      
      // Store deep-link data for auto-opening
      storeDeepLinkData(notification);
      
      // Handle branch dashboard context
      if (userContext === 'branch') {
        const branchMatch = currentPath.match(/\/branch-dashboard\/([^/]+)\/([^/]+)/);
        
        if (branchMatch) {
          const [, branchId, branchName] = branchMatch;
          
          // Route based on effective notification type
          if (effectiveType === 'message') {
            navigate(`/branch-dashboard/${branchId}/${branchName}/communication`);
          } else if (effectiveType === 'task' || effectiveType === 'events_logs') {
            if (notification.data?.client_id) {
              navigate(`/branch-dashboard/${branchId}/${branchName}/clients/${notification.data.client_id}/events`);
            }
          } else if (effectiveType === 'care_plan') {
            navigate(`/branch-dashboard/${branchId}/${branchName}/careplan`);
          } else if (effectiveType === 'booking' || effectiveType === 'appointment') {
            navigate(`/branch-dashboard/${branchId}/${branchName}/booking`);
          } else if (effectiveType === 'document') {
            navigate(`/branch-dashboard/${branchId}/${branchName}/documents`);
          } else if (effectiveType === 'staff_document') {
            // Staff document upload - redirect to staff profile
            const data = notification.data as any;
            if (data?.staff_id) {
              navigate(`/branch-dashboard/${branchId}/${branchName}/carers/${data.staff_id}`);
            } else {
              navigate(`/branch-dashboard/${branchId}/${branchName}/carers`);
            }
          } else if (effectiveType === 'form') {
            navigate(`/branch-dashboard/${branchId}/${branchName}/forms`);
          } else if (effectiveType === 'form_submission') {
            // Form submission notification - redirect to Form Builder responses tab
            const data = notification.data as any;
            if (data?.form_id) {
              navigate(`/branch-dashboard/${branchId}/${branchName}/form-builder/${data.form_id}?tab=responses`);
            } else {
              navigate(`/branch-dashboard/${branchId}/${branchName}/forms`);
            }
          } else if (effectiveType === 'agreement') {
            navigate(`/branch-dashboard/${branchId}/${branchName}/agreements`);
          } else if (effectiveType === 'agreement_signed') {
            // Agreement signed notification - navigate to agreements with signed tab
            navigate(`/branch-dashboard/${branchId}/${branchName}/agreements?tab=signed`);
          } else if (effectiveType === 'library') {
            navigate(`/branch-dashboard/${branchId}/${branchName}/library`);
          } else if (effectiveType === 'training') {
            navigate(`/branch-dashboard/${branchId}/${branchName}/training`);
          } else if (effectiveType === 'meeting') {
            // Navigate to organization calendar for meeting notifications
            const meetingId = (notification.data as any)?.meeting_id;
            navigate(`/branch-dashboard/${branchId}/${branchName}/organization-calendar${meetingId ? `?meeting=${meetingId}` : ''}`);
          }
        }
        return;
      }
      
      // Handle client dashboard context
      if (userContext === 'client') {
        const tenantMatch = currentPath.match(/\/([^/]+)\/client-dashboard/);
        const tenantSlug = tenantMatch ? tenantMatch[1] : '';
        const route = getNotificationRoute(notification, 'client');
        
        console.log('[NotificationDropdown] Client route:', { tenantSlug, route });
        
        if (route) {
          const fullPath = tenantSlug 
            ? `/${tenantSlug}/client-dashboard${route}`
            : `/client-dashboard${route}`;
          console.log('[NotificationDropdown] Navigating to:', fullPath);
          navigate(fullPath);
        }
        return;
      }
      
      // Handle carer dashboard context
      if (userContext === 'carer') {
        const tenantMatch = currentPath.match(/\/([^/]+)\/carer-dashboard/);
        const tenantSlug = tenantMatch ? tenantMatch[1] : '';
        const route = getNotificationRoute(notification, 'carer');
        
        console.log('[NotificationDropdown] Carer route:', { tenantSlug, route, effectiveType });
        
        // Special handling for task/events with client_id - redirect to care plans instead of clients
        if ((effectiveType === 'task' || effectiveType === 'events_logs') && notification.data?.client_id) {
          const carePlansPath = tenantSlug 
            ? `/${tenantSlug}/carer-dashboard/careplans`
            : `/carer-dashboard/careplans`;
          console.log('[NotificationDropdown] Navigating to care plans:', carePlansPath);
          navigate(carePlansPath);
          return;
        }
        
        if (route) {
          const fullPath = tenantSlug 
            ? `/${tenantSlug}/carer-dashboard${route}`
            : `/carer-dashboard${route}`;
          console.log('[NotificationDropdown] Navigating to:', fullPath);
          navigate(fullPath);
        }
        return;
      }
      
      // Handle organization dashboard context
      if (userContext === 'organization') {
        const tenantMatch = currentPath.match(/^\/([^/]+)\//);
        const tenantSlug = tenantMatch ? tenantMatch[1] : '';
        
        console.log('[NotificationDropdown] Organization context:', { tenantSlug, effectiveType });
        
        // Get organization-specific route
        const orgRoute = getOrgNotificationRoute(effectiveType);
        
        if (orgRoute) {
          const fullPath = tenantSlug ? `/${tenantSlug}${orgRoute}` : orgRoute;
          console.log('[NotificationDropdown] Navigating to org route:', fullPath);
          navigate(fullPath);
          return;
        }
      }
      
      // Unknown context - just mark as read
      console.log('[NotificationDropdown] Unknown user context for notification navigation');
    } catch (error) {
      console.error('[NotificationDropdown] Error handling notification click:', error);
    }
  };

  if (error) {
    console.warn("Error in notification dropdown:", error);
  }

  // Only show unread notifications in dropdown - clicked ones disappear immediately
  const recentNotifications = notifications?.filter(n => !n.read_at).slice(0, 6) || [];

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
              <>
                {/* Small dot for mobile devices */}
                <span className="absolute top-0 right-0 h-2 w-2 bg-red-500 rounded-full md:hidden"></span>
                {/* Numeric badge for larger screens */}
                <Badge 
                  variant="destructive" 
                  className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs hidden md:flex"
                >
                  {stats.unread_count > 99 ? '99+' : stats.unread_count}
                </Badge>
              </>
            )}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-[calc(100vw-1.5rem)] sm:w-80" sideOffset={8}>
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
          
          <div className="max-h-[400px] overflow-y-auto dialog-scrollable">
            {recentNotifications.length === 0 ? (
              <>
                <div className="p-4 text-center text-muted-foreground text-sm">
                  No notifications yet
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem 
                  className="text-center justify-center text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 hover:bg-accent/50 dark:hover:bg-accent/30 transition-colors"
                  onClick={onViewAll}
                >
                  View all notifications
                </DropdownMenuItem>
              </>
            ) : (
              <>
                {recentNotifications.map((notification) => (
                  <DropdownMenuItem
                    key={notification.id}
                    className={cn(
                      "flex items-start gap-3 p-3 cursor-pointer border-l-4 transition-colors",
                      getPriorityColor(notification.priority),
                      !notification.read_at && "bg-opacity-75"
                    )}
                    onClick={() => handleNotificationClick(notification)}
                  >
                    <div className="flex-shrink-0 mt-0.5">
                      {getIcon(notification.type, notification.category, notification)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <p className="font-medium text-sm truncate">{notification.title}</p>
                        {!notification.read_at && (
                          <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0 ml-2" />
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{notification.message}</p>
                      <div className="flex items-center gap-2 mt-2">
                        <Clock className="h-3 w-3 text-muted-foreground/70" />
                        <span className="text-xs text-muted-foreground/80">
                          {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}
                        </span>
                      </div>
                    </div>
                  </DropdownMenuItem>
                ))}
                <DropdownMenuSeparator />
                <DropdownMenuItem 
                  className="text-center justify-center text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 hover:bg-accent/50 dark:hover:bg-accent/30 transition-colors"
                  onClick={onViewAll}
                >
                  View all notifications
                </DropdownMenuItem>
              </>
            )}
          </div>
        </DropdownMenuContent>
      </DropdownMenu>
    </ErrorBoundary>
  );
};

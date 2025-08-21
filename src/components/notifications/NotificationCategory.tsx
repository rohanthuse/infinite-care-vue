import React from "react";
import { useParams, useNavigate } from "react-router-dom";
import { 
  ArrowLeft, Clock, CheckCircle, AlertTriangle, 
  Users, User, Calendar, Pill, FileText, AlertCircle,
  RefreshCw, Filter, ChevronDown, Eye, MoreHorizontal
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";
import { useTenant } from "@/contexts/TenantContext";
import { useNotifications, useDynamicNotificationData } from "@/hooks/useNotifications";

interface NotificationCategoryProps {
  categoryId: string;
  branchId?: string;
  branchName?: string;
}

const categoryConfig = {
  staff: {
    title: "Staff Notifications",
    icon: Users,
    color: "text-blue-600",
    bgColor: "bg-blue-50",
    borderColor: "border-blue-200",
    description: "Overdue bookings and staff alerts"
  },
  system: {
    title: "System Alerts", 
    icon: AlertTriangle,
    color: "text-red-600",
    bgColor: "bg-red-50",
    borderColor: "border-red-200",
    description: "Critical system notifications"
  },
  client: {
    title: "Client Notifications",
    icon: User,
    color: "text-green-600", 
    bgColor: "bg-green-50",
    borderColor: "border-green-200",
    description: "Client requests and appointments"
  },
  medication: {
    title: "Medication Alerts",
    icon: Pill,
    color: "text-purple-600",
    bgColor: "bg-purple-50", 
    borderColor: "border-purple-200",
    description: "Upcoming medication schedules"
  },
  rota: {
    title: "Rota Errors",
    icon: Calendar,
    color: "text-orange-600",
    bgColor: "bg-orange-50",
    borderColor: "border-orange-200", 
    description: "Schedule conflicts and errors"
  },
  document: {
    title: "Document Updates",
    icon: FileText,
    color: "text-gray-600",
    bgColor: "bg-gray-50",
    borderColor: "border-gray-200",
    description: "Recently modified documents"
  }
};

// Helper function to generate dynamic notifications based on category and data
const generateDynamicNotifications = (categoryId: string, dynamicData: any, notifications: any[]) => {
  const formatTime = (date: string) => {
    const diff = Date.now() - new Date(date).getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(hours / 24);
    
    if (days > 0) return `${days} day${days > 1 ? 's' : ''} ago`;
    if (hours > 0) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
    return 'Just now';
  };

  switch (categoryId) {
    case 'staff':
      const staffNotifications = [];
      if (dynamicData?.overdueBookings > 0) {
        staffNotifications.push({
          id: 'staff-overdue',
          title: `${dynamicData.overdueBookings} overdue booking${dynamicData.overdueBookings > 1 ? 's' : ''} requiring attention`,
          message: 'Some bookings are past their scheduled time and need immediate review',
          time: '1 hour ago',
          priority: 'high',
          read: false
        });
      }
      return [...staffNotifications, ...notifications.filter(n => n.category === 'staff').slice(0, 5)];

    case 'client':
      const clientNotifications = [];
      if (dynamicData?.pendingAppointments > 0) {
        clientNotifications.push({
          id: 'client-pending',
          title: `${dynamicData.pendingAppointments} pending appointment${dynamicData.pendingAppointments > 1 ? 's' : ''}`,
          message: 'Client appointments waiting for confirmation',
          time: '30 minutes ago',
          priority: 'high',
          read: false
        });
      }
      return [...clientNotifications, ...notifications.filter(n => n.category === 'client').slice(0, 5)];

    case 'medication':
      const medicationNotifications = [];
      if (dynamicData?.medicationSchedules > 0) {
        medicationNotifications.push({
          id: 'medication-upcoming',
          title: `${dynamicData.medicationSchedules} upcoming medication reminder${dynamicData.medicationSchedules > 1 ? 's' : ''}`,
          message: 'Medications scheduled for administration soon',
          time: '15 minutes ago',
          priority: 'high',
          read: false
        });
      }
      return [...medicationNotifications, ...notifications.filter(n => n.category === 'medication').slice(0, 5)];

    case 'rota':
      const rotaNotifications = [];
      if (dynamicData?.rotaConflicts > 0) {
        rotaNotifications.push({
          id: 'rota-conflicts',
          title: `${dynamicData.rotaConflicts} schedule conflict${dynamicData.rotaConflicts > 1 ? 's' : ''} detected`,
          message: 'Staff scheduling conflicts need resolution',
          time: '45 minutes ago',
          priority: 'high',
          read: false
        });
      }
      return [...rotaNotifications, ...notifications.filter(n => n.category === 'rota').slice(0, 5)];

    case 'document':
      const documentNotifications = [];
      if (dynamicData?.recentReports > 0) {
        documentNotifications.push({
          id: 'document-recent',
          title: `${dynamicData.recentReports} recent document update${dynamicData.recentReports > 1 ? 's' : ''}`,
          message: 'New documents have been uploaded or modified',
          time: '2 hours ago',
          priority: 'medium',
          read: false
        });
      }
      return [...documentNotifications, ...notifications.filter(n => n.category === 'document').slice(0, 5)];

    case 'system':
    default:
      return notifications.filter(n => n.category === 'system' || !n.category).slice(0, 10);
  }
};

const NotificationCategory: React.FC<NotificationCategoryProps> = ({
  categoryId,
  branchId,
  branchName
}) => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { tenantSlug } = useTenant();
  
  // Get dynamic data and notifications from hooks
  const { data: dynamicData, isLoading: dynamicDataLoading } = useDynamicNotificationData(branchId);
  const { notifications: allNotifications, isLoading: notificationsLoading, markAsRead } = useNotifications();
  
  const config = categoryConfig[categoryId as keyof typeof categoryConfig];
  
  // Generate dynamic notifications based on category and data
  const notifications = generateDynamicNotifications(categoryId, dynamicData, allNotifications || []);
  
  if (!config) {
    return (
      <div className="text-center py-8">
        <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-gray-600">Category not found</h3>
        <p className="text-gray-500">The requested notification category does not exist.</p>
      </div>
    );
  }

  const handleBack = () => {
    if (branchId && branchName) {
      // Include tenant slug if available for tenant-aware navigation
      const fullPath = tenantSlug 
        ? `/${tenantSlug}/branch-dashboard/${branchId}/${branchName}/notifications`
        : `/branch-dashboard/${branchId}/${branchName}/notifications`;
      navigate(fullPath);
    } else {
      // Include tenant slug if available for tenant-aware navigation
      const fullPath = tenantSlug 
        ? `/${tenantSlug}/notifications`
        : `/notifications`;
      navigate(fullPath);
    }
  };

  const handleMarkAsRead = (notificationId: string) => {
    markAsRead(notificationId);
    toast({
      title: "Marked as read",
      description: "Notification has been marked as read",
      duration: 2000,
    });
  };

  const handleMarkAllAsRead = () => {
    toast({
      title: "All notifications marked as read",
      description: `All ${config.title.toLowerCase()} have been marked as read`,
      duration: 3000,
    });
  };

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case "high":
        return <Badge className="bg-red-100 text-red-800">High</Badge>;
      case "medium":
        return <Badge className="bg-amber-100 text-amber-800">Medium</Badge>;
      case "low":
        return <Badge className="bg-green-100 text-green-800">Low</Badge>;
      default:
        return <Badge variant="outline">Normal</Badge>;
    }
  };

  const IconComponent = config.icon;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleBack}
            className="flex items-center space-x-2"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Back to Notifications</span>
          </Button>
          <Separator orientation="vertical" className="h-6" />
          <div className="flex items-center space-x-3">
            <div className={`p-2 rounded-lg ${config.bgColor} ${config.borderColor} border`}>
              <IconComponent className={`h-6 w-6 ${config.color}`} />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{config.title}</h1>
              <p className="text-gray-500">{config.description}</p>
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                <Filter className="h-4 w-4 mr-2" />
                Filter
                <ChevronDown className="h-4 w-4 ml-2" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem>All</DropdownMenuItem>
              <DropdownMenuItem>Unread</DropdownMenuItem>
              <DropdownMenuItem>High Priority</DropdownMenuItem>
              <DropdownMenuItem>Today</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          
          <Button variant="outline" size="sm" onClick={handleMarkAllAsRead}>
            <CheckCircle className="h-4 w-4 mr-2" />
            Mark All Read
          </Button>
          
          <Button variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Total</p>
                <p className="text-2xl font-bold">{notifications.length}</p>
              </div>
              <IconComponent className={`h-8 w-8 ${config.color}`} />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Unread</p>
                <p className="text-2xl font-bold text-blue-600">
                  {notifications.filter(n => !n.read).length}
                </p>
              </div>
              <Eye className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">High Priority</p>
                <p className="text-2xl font-bold text-red-600">
                  {notifications.filter(n => n.priority === 'high').length}
                </p>
              </div>
              <AlertTriangle className="h-8 w-8 text-red-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Today</p>
                <p className="text-2xl font-bold text-green-600">
                  {notifications.filter(n => n.time.includes('hour')).length}
                </p>
              </div>
              <Clock className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Notifications List */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Notifications</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {(dynamicDataLoading || notificationsLoading) ? (
            <div className="p-8 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-gray-500">Loading notifications...</p>
            </div>
          ) : notifications.length > 0 ? (
            <div className="divide-y">
              {notifications.map((notification) => (
                <div 
                  key={notification.id}
                  className={`p-4 hover:bg-gray-50 transition-colors ${
                    !notification.read ? 'bg-blue-50/50' : ''
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center space-x-2">
                        {!notification.read && (
                          <div className="w-2 h-2 bg-blue-600 rounded-full" />
                        )}
                        <h4 className="font-medium text-gray-900">
                          {notification.title}
                        </h4>
                        {getPriorityBadge(notification.priority)}
                      </div>
                      <p className="text-gray-600">{notification.message}</p>
                      <div className="flex items-center space-x-4 text-sm text-gray-500">
                        <span className="flex items-center">
                          <Clock className="h-3 w-3 mr-1" />
                          {notification.time}
                        </span>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2 ml-4">
                      {!notification.read && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleMarkAsRead(notification.id)}
                        >
                          <CheckCircle className="h-4 w-4" />
                        </Button>
                      )}
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem>View Details</DropdownMenuItem>
                          <DropdownMenuItem>Mark as Read</DropdownMenuItem>
                          <DropdownMenuItem>Archive</DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <IconComponent className={`h-12 w-12 ${config.color} mx-auto mb-4 opacity-50`} />
              <h3 className="text-lg font-semibold text-gray-600">No notifications</h3>
              <p className="text-gray-500">No {config.title.toLowerCase()} at the moment.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default NotificationCategory;
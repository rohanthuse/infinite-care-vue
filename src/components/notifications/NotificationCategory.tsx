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

// Mock data for demonstration
const mockNotifications = {
  staff: [
    {
      id: "1",
      title: "Staff member John Doe is overdue for training renewal",
      message: "Training certification expires in 2 days",
      time: "2 hours ago",
      priority: "high",
      read: false
    },
    {
      id: "2", 
      title: "New staff application received",
      message: "Sarah Smith has applied for Carer position",
      time: "4 hours ago",
      priority: "medium",
      read: true
    }
  ],
  system: [
    {
      id: "1",
      title: "Database backup completed successfully",
      message: "Daily backup completed at 2:00 AM",
      time: "6 hours ago", 
      priority: "low",
      read: true
    },
    {
      id: "2",
      title: "System maintenance scheduled",
      message: "Maintenance window: Tonight 11 PM - 2 AM",
      time: "1 day ago",
      priority: "medium",
      read: false
    }
  ],
  client: [
    {
      id: "1",
      title: "Client appointment request",
      message: "Mrs. Johnson has requested an appointment for tomorrow",
      time: "30 minutes ago",
      priority: "high",
      read: false
    },
    {
      id: "2",
      title: "Client feedback received",
      message: "5-star rating from Mr. Williams",
      time: "2 hours ago",
      priority: "low", 
      read: true
    }
  ],
  medication: [
    {
      id: "1",
      title: "Medication reminder due",
      message: "Mrs. Thompson - Blood pressure medication at 2 PM",
      time: "1 hour ago",
      priority: "high",
      read: false
    },
    {
      id: "2",
      title: "Prescription renewal needed",
      message: "Mr. Davis prescription expires in 3 days",
      time: "3 hours ago",
      priority: "medium",
      read: false
    }
  ],
  rota: [
    {
      id: "1",
      title: "Schedule conflict detected",
      message: "Double booking for Jane Smith on Thursday 2 PM",
      time: "45 minutes ago",
      priority: "high",
      read: false
    },
    {
      id: "2",
      title: "Staff shortage alert",
      message: "Weekend shift understaffed by 2 carers",
      time: "2 hours ago",
      priority: "medium",
      read: false
    }
  ],
  document: [
    {
      id: "1",
      title: "Care plan updated",
      message: "Mrs. Brown's care plan has been revised",
      time: "1 hour ago", 
      priority: "medium",
      read: false
    },
    {
      id: "2",
      title: "Policy document uploaded",
      message: "New safeguarding policy v2.1 available",
      time: "4 hours ago",
      priority: "low",
      read: true
    }
  ]
};

const NotificationCategory: React.FC<NotificationCategoryProps> = ({
  categoryId,
  branchId,
  branchName
}) => {
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const config = categoryConfig[categoryId as keyof typeof categoryConfig];
  const notifications = mockNotifications[categoryId as keyof typeof mockNotifications] || [];
  
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
      navigate(`/branch-dashboard/${branchId}/${branchName}/notifications`);
    } else {
      navigate('/notifications');
    }
  };

  const handleMarkAsRead = (notificationId: string) => {
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
          {notifications.length > 0 ? (
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
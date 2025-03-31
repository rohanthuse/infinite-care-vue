
import React from "react";
import { useNavigate } from "react-router-dom";
import { 
  Bell, AlertTriangle, Clock, Calendar, CheckCircle, FileWarning, LucideIcon
} from "lucide-react";
import NotificationCard, { NotificationCardProps } from "./NotificationCard";

interface NotificationsOverviewProps {
  branchId?: string;
  branchName?: string;
}

const NotificationsOverview = ({ branchId, branchName }: NotificationsOverviewProps) => {
  const navigate = useNavigate();
  
  const handleNavigate = (path: string) => {
    if (branchId && branchName) {
      navigate(`/branch-dashboard/${branchId}/${branchName}/${path}`);
    } else {
      navigate(`/${path}`);
    }
  };

  // Create an array of notification data with proper typing for icons
  const notificationData: (Omit<NotificationCardProps, "icon"> & { path: string; icon: LucideIcon })[] = [
    {
      title: "System Alerts",
      count: 5,
      color: "text-red-600",
      bgColor: "bg-red-50",
      borderColor: "border-red-200",
      description: "Critical system notifications",
      path: "notifications/system",
      icon: AlertTriangle
    },
    {
      title: "Staff Reviews",
      count: 12,
      color: "text-blue-600",
      bgColor: "bg-blue-50",
      borderColor: "border-blue-200",
      description: "Due for completion",
      path: "notifications/staff-reviews",
      icon: Bell
    },
    {
      title: "Pending Tasks",
      count: 8,
      color: "text-amber-600",
      bgColor: "bg-amber-50",
      borderColor: "border-amber-200",
      description: "Requiring attention",
      path: "notifications/pending",
      icon: Clock
    },
    {
      title: "Upcoming Appointments",
      count: 15,
      color: "text-purple-600",
      bgColor: "bg-purple-50",
      borderColor: "border-purple-200",
      description: "Next 7 days",
      path: "notifications/appointments",
      icon: Calendar
    },
    {
      title: "Completed Actions",
      count: 47,
      color: "text-green-600",
      bgColor: "bg-green-50",
      borderColor: "border-green-200",
      description: "Last 30 days",
      path: "notifications/completed",
      icon: CheckCircle
    },
    {
      title: "Document Updates",
      count: 3,
      color: "text-indigo-600",
      bgColor: "bg-indigo-50",
      borderColor: "border-indigo-200",
      description: "Recently modified",
      path: "notifications/documents",
      icon: FileWarning
    },
  ];

  return (
    <div className="mt-6">
      <h2 className="text-xl font-bold text-gray-800 tracking-tight mb-4">Notification Overview</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
        {notificationData.map((notification, index) => (
          <NotificationCard
            key={index}
            title={notification.title}
            count={notification.count}
            icon={notification.icon}
            color={notification.color}
            bgColor={notification.bgColor}
            borderColor={notification.borderColor}
            description={notification.description}
            onClick={() => handleNavigate(notification.path)}
          />
        ))}
      </div>
    </div>
  );
};

export default NotificationsOverview;

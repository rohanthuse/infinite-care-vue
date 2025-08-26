
import React from "react";
import { useNavigate, useParams } from "react-router-dom";
import { 
  Bell, AlertTriangle, Clock, Calendar, CheckCircle, FileWarning, LucideIcon
} from "lucide-react";
import NotificationCard, { NotificationCardProps } from "./NotificationCard";
import { useNotificationCategoryCounts } from "@/hooks/useNotificationCategoryCounts";
import { ErrorBoundary } from "@/components/care/ErrorBoundary";
import { useTenant } from "@/contexts/TenantContext";

interface NotificationsOverviewProps {
  branchId?: string;
  branchName?: string;
}

const NotificationsOverview = ({ branchId, branchName }: NotificationsOverviewProps) => {
  const navigate = useNavigate();
  const { id, branchName: paramBranchName } = useParams();
  const { tenantSlug } = useTenant();
  
  // Use props if provided, otherwise fall back to URL params
  const effectiveBranchId = branchId || id;
  const effectiveBranchName = branchName || paramBranchName;
  
  // Get notification category counts
  const { categoryCounts, isLoading, error } = useNotificationCategoryCounts(effectiveBranchId);
  
  const handleNavigate = (path: string) => {
    try {
      console.log("Navigating to:", path);
      console.log("Branch ID:", effectiveBranchId);
      console.log("Branch Name:", effectiveBranchName);
      console.log("Tenant Slug:", tenantSlug);
      
      if (effectiveBranchId && effectiveBranchName) {
        // Include tenant slug if available for tenant-aware navigation
        const fullPath = tenantSlug 
          ? `/${tenantSlug}/branch-dashboard/${effectiveBranchId}/${effectiveBranchName}/notifications/${path}`
          : `/branch-dashboard/${effectiveBranchId}/${effectiveBranchName}/notifications/${path}`;
        console.log("Full navigation path:", fullPath);
        navigate(fullPath);
      } else {
        console.log("Navigating without branch context");
        const fullPath = tenantSlug 
          ? `/${tenantSlug}/notifications/${path}`
          : `/notifications/${path}`;
        navigate(fullPath);
      }
    } catch (error) {
      console.error("Navigation error:", error);
    }
  };

  // Create an array of notification data with proper typing for icons
  const notificationData: (Omit<NotificationCardProps, "icon"> & { path: string; icon: LucideIcon })[] = [
    {
      title: "Staff Notifications",
      count: isLoading ? 0 : categoryCounts.staff.total,
      color: "text-blue-600",
      bgColor: "bg-blue-50",
      borderColor: "border-blue-200",
      description: "Overdue bookings and staff alerts",
      path: "staff",
      icon: Bell
    },
    {
      title: "System Alerts",
      count: isLoading ? 0 : categoryCounts.system.total,
      color: "text-red-600",
      bgColor: "bg-red-50",
      borderColor: "border-red-200",
      description: "Critical system notifications",
      path: "system",
      icon: AlertTriangle
    },
    {
      title: "Client Notifications",
      count: isLoading ? 0 : categoryCounts.client.total,
      color: "text-green-600",
      bgColor: "bg-green-50",
      borderColor: "border-green-200",
      description: "Client requests and appointments",
      path: "client",
      icon: Bell
    },
    {
      title: "Medication Alerts",
      count: isLoading ? 0 : categoryCounts.medication.total,
      color: "text-purple-600",
      bgColor: "bg-purple-50",
      borderColor: "border-purple-200",
      description: "Upcoming medication schedules",
      path: "medication",
      icon: Clock
    },
    {
      title: "Rota Errors",
      count: isLoading ? 0 : categoryCounts.rota.total,
      color: "text-amber-600",
      bgColor: "bg-amber-50",
      borderColor: "border-amber-200",
      description: "Schedule conflicts and errors",
      path: "rota",
      icon: Calendar
    },
    {
      title: "Document Updates",
      count: isLoading ? 0 : categoryCounts.document.total,
      color: "text-indigo-600",
      bgColor: "bg-indigo-50",
      borderColor: "border-indigo-200",
      description: "Recently modified documents",
      path: "document",
      icon: FileWarning
    },
  ];

  if (error) {
    console.warn("Error loading notifications overview:", error);
  }

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
        {notificationData.map((_, index) => (
          <div key={index} className="h-32 bg-gray-100 animate-pulse rounded-lg" />
        ))}
      </div>
    );
  }

  return (
    <ErrorBoundary fallback={
      <div className="p-4 text-center">
        <p className="text-gray-500">Unable to load notifications overview</p>
      </div>
    }>
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
            onClick={() => {
              console.log(`Clicked on ${notification.title}`);
              handleNavigate(notification.path);
            }}
          />
        ))}
      </div>
    </ErrorBoundary>
  );
};

export default NotificationsOverview;

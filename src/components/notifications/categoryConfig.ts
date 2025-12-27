import { 
  Users, User, Calendar, Pill, FileText, AlertTriangle 
} from "lucide-react";

export const categoryConfig = {
  staff: {
    title: "Staff Notifications",
    icon: Users,
    color: "text-blue-600 dark:text-blue-400",
    bgColor: "bg-blue-50 dark:bg-blue-900/30",
    borderColor: "border-blue-200 dark:border-blue-700",
    description: "Overdue bookings and staff alerts"
  },
  system: {
    title: "System Alerts", 
    icon: AlertTriangle,
    color: "text-red-600 dark:text-red-400",
    bgColor: "bg-red-50 dark:bg-red-900/30",
    borderColor: "border-red-200 dark:border-red-700",
    description: "Critical system notifications"
  },
  client: {
    title: "Client Notifications",
    icon: User,
    color: "text-green-600 dark:text-green-400", 
    bgColor: "bg-green-50 dark:bg-green-900/30",
    borderColor: "border-green-200 dark:border-green-700",
    description: "Client requests and appointments"
  },
  medication: {
    title: "Medication Alerts",
    icon: Pill,
    color: "text-purple-600 dark:text-purple-400",
    bgColor: "bg-purple-50 dark:bg-purple-900/30", 
    borderColor: "border-purple-200 dark:border-purple-700",
    description: "Upcoming medication schedules"
  },
  rota: {
    title: "Rota Errors",
    icon: Calendar,
    color: "text-orange-600 dark:text-orange-400",
    bgColor: "bg-orange-50 dark:bg-orange-900/30",
    borderColor: "border-orange-200 dark:border-orange-700", 
    description: "Schedule conflicts and errors"
  },
  document: {
    title: "Document Updates",
    icon: FileText,
    color: "text-gray-600 dark:text-gray-400",
    bgColor: "bg-gray-50 dark:bg-gray-900/30",
    borderColor: "border-gray-200 dark:border-gray-700",
    description: "Recently modified documents"
  }
};
import { 
  Users, User, Calendar, Pill, FileText, AlertTriangle 
} from "lucide-react";

export const categoryConfig = {
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
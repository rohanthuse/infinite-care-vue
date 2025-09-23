
import React from "react";
import { Link, useLocation } from "react-router-dom";
import {
  Calendar,
  ClipboardList,
  Clock,
  FileText,
  FileBarChart,
  Home,
  Users,
  X,
  AlertTriangle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useCarerNavigation } from "@/hooks/useCarerNavigation";

interface CarerSidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CarerSidebar: React.FC<CarerSidebarProps> = ({ isOpen, onClose }) => {
  const location = useLocation();
  const { getCarerMenuItems } = useCarerNavigation();
  const carerName = localStorage.getItem("carerName") || "Carer";
  
  const menuItems = [
    { 
      name: "Dashboard", 
      path: getCarerMenuItems().find(item => item.name === "Dashboard")?.path || "/carer-dashboard", 
      icon: Home 
    },
    { 
      name: "My Schedule", 
      path: getCarerMenuItems().find(item => item.name === "Booking Calendar")?.path || "/carer-dashboard/schedule", 
      icon: Calendar 
    },
    { 
      name: "My Clients", 
      path: getCarerMenuItems().find(item => item.name === "Clients")?.path || "/carer-dashboard/clients", 
      icon: Users 
    },
    { 
      name: "My Tasks", 
      path: getCarerMenuItems().find(item => item.name === "Tasks")?.path || "/carer-dashboard/tasks", 
      icon: ClipboardList 
    },
    { 
      name: "My Assignments", 
      path: getCarerMenuItems().find(item => item.name === "My Assignments")?.path || "/carer-dashboard/my-tasks", 
      icon: AlertTriangle 
    },
    { 
      name: "Attendance", 
      path: getCarerMenuItems().find(item => item.name === "Reports")?.path || "/carer-dashboard/attendance", 
      icon: Clock 
    },
    { 
      name: "Service Reports", 
      path: getCarerMenuItems().find(item => item.name === "Service Reports")?.path || "/carer-dashboard/service-reports", 
      icon: FileBarChart 
    },
    { 
      name: "Documents", 
      path: getCarerMenuItems().find(item => item.name === "My Forms")?.path || "/carer-dashboard/documents", 
      icon: FileText 
    },
  ];
  
  return (
    <div className={cn(
      "fixed inset-y-0 left-0 bg-white border-r border-gray-200 w-64 z-40 transition-transform duration-300 transform md:translate-x-0 md:relative",
      isOpen ? "translate-x-0" : "-translate-x-full"
    )}>
      <div className="flex flex-col h-full">
        <div className="p-4 border-b border-gray-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center">
              {carerName.charAt(0).toUpperCase()}
            </div>
            <span className="font-semibold">{carerName}</span>
          </div>
          <Button variant="ghost" size="sm" className="md:hidden" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>
        
        <nav className="flex-1 overflow-y-auto p-4">
          <ul className="space-y-1">
            {menuItems.map((item) => (
              <li key={item.name}>
                <Link
                  to={item.path}
                  className={cn(
                    "flex items-center px-3 py-2 rounded-md text-sm font-medium",
                    location.pathname === item.path
                      ? "bg-blue-100 text-blue-700"
                      : "text-gray-700 hover:bg-gray-100"
                  )}
                >
                  <item.icon className="h-4 w-4 mr-3" />
                  {item.name}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
        
        <div className="p-4 border-t border-gray-200">
          <div className="text-xs text-gray-500 mb-2">Med-Infinite</div>
          <div className="text-xs text-gray-500">Version 1.0.0</div>
        </div>
      </div>
    </div>
  );
};

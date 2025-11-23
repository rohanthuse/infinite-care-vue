import React from "react";
import { Link, useLocation } from "react-router-dom";
import {
  Home,
  Calendar,
  ClipboardList,
  FileText,
  ScrollText,
  BookOpen,
  AlertTriangle,
  Star,
  CreditCard,
  File,
  BarChart,
  Activity,
  MessageCircle,
  User,
  HelpCircle,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useClientNavigation } from "@/hooks/useClientNavigation";
import { useClientAuth } from "@/hooks/useClientAuth";

interface ClientSidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ClientSidebar: React.FC<ClientSidebarProps> = ({ isOpen, onClose }) => {
  const location = useLocation();
  const { createClientPath } = useClientNavigation();
  const { clientName: authClientName, user } = useClientAuth();
  
  // Get the display name from auth or fallback to email prefix or "Client"
  const clientName = authClientName || 
    (user?.email ? user.email.split('@')[0] : "Client");
  
  const menuItems = [
    { 
      name: "Overview", 
      path: createClientPath(""), 
      icon: Home 
    },
    { 
      name: "Appointments", 
      path: createClientPath("/appointments"), 
      icon: Calendar 
    },
    { 
      name: "Tasks", 
      path: createClientPath("/tasks"), 
      icon: ClipboardList 
    },
    { 
      name: "Care Plans", 
      path: createClientPath("/care-plans"), 
      icon: FileText 
    },
    { 
      name: "My Forms", 
      path: createClientPath("/forms"), 
      icon: FileText 
    },
    { 
      name: "My Agreements", 
      path: createClientPath("/agreements"), 
      icon: ScrollText 
    },
    { 
      name: "Library", 
      path: createClientPath("/library"), 
      icon: BookOpen 
    },
    { 
      name: "Events & Logs", 
      path: createClientPath("/events-logs"), 
      icon: AlertTriangle 
    },
    { 
      name: "Feedbacks", 
      path: createClientPath("/reviews"), 
      icon: Star 
    },
    { 
      name: "Payments", 
      path: createClientPath("/payments"), 
      icon: CreditCard 
    },
    { 
      name: "Documents", 
      path: createClientPath("/documents"), 
      icon: File 
    },
    { 
      name: "Service Reports", 
      path: createClientPath("/service-reports"), 
      icon: BarChart 
    },
    { 
      name: "Health Monitoring", 
      path: createClientPath("/health-monitoring"), 
      icon: Activity 
    },
    { 
      name: "Messages", 
      path: createClientPath("/messages"), 
      icon: MessageCircle 
    },
    { 
      name: "Profile", 
      path: createClientPath("/profile"), 
      icon: User 
    },
    { 
      name: "Support", 
      path: createClientPath("/support"), 
      icon: HelpCircle 
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
              {clientName.charAt(0).toUpperCase()}
            </div>
            <span className="font-semibold">{clientName}</span>
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
                  onClick={() => {
                    // Close sidebar on mobile after navigation
                    if (window.innerWidth < 768) {
                      onClose();
                    }
                  }}
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

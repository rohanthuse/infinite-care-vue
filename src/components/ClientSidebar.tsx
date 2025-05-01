
import React, { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { 
  Home, Calendar, FileText, 
  CreditCard, User, File, 
  LogOut, Menu, X
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

interface SidebarItemProps {
  icon: React.ElementType;
  label: string;
  path: string;
  active: boolean;
  onClick: () => void;
}

const SidebarItem: React.FC<SidebarItemProps> = ({ 
  icon: Icon, label, active, onClick 
}) => {
  return (
    <div 
      className={cn(
        "flex items-center gap-3 px-4 py-3 rounded-lg cursor-pointer transition-all",
        active ? 
          "bg-blue-50 text-blue-700 font-medium" : 
          "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
      )}
      onClick={onClick}
    >
      <Icon className="h-5 w-5" />
      <span>{label}</span>
    </div>
  );
};

const ClientSidebar = () => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const currentPath = location.pathname;
  const clientName = localStorage.getItem("clientName") || "Client";
  
  const menuItems = [
    { label: "Overview", icon: Home, path: "/client-dashboard" },
    { label: "Appointments", icon: Calendar, path: "/client-dashboard/appointments" },
    { label: "Care Plans", icon: FileText, path: "/client-dashboard/care-plans" },
    { label: "Payments", icon: CreditCard, path: "/client-dashboard/payments" },
    { label: "Documents", icon: File, path: "/client-dashboard/documents" },
    { label: "Profile", icon: User, path: "/client-dashboard/profile" }
  ];

  const handleNavigation = (path: string) => {
    navigate(path);
  };

  const handleLogout = () => {
    localStorage.removeItem("userType");
    localStorage.removeItem("clientName");
    
    toast({
      title: "Logged out successfully",
      description: "You have been logged out of your account",
    });
    
    navigate("/client-login");
  };

  return (
    <div
      className={cn(
        "flex flex-col bg-white border-r border-gray-200 h-screen transition-all duration-300",
        isCollapsed ? "w-[80px]" : "w-[260px]"
      )}
    >
      {/* Sidebar Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200">
        {!isCollapsed && (
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white font-bold">
              {clientName.charAt(0)}
            </div>
            <div>
              <h3 className="font-medium text-sm">{clientName}</h3>
              <p className="text-xs text-gray-500">Client Portal</p>
            </div>
          </div>
        )}
        
        <button 
          className={cn(
            "text-gray-500 hover:text-gray-700 transition-colors",
            isCollapsed && "mx-auto"
          )}
          onClick={() => setIsCollapsed(!isCollapsed)}
        >
          {isCollapsed ? <Menu className="h-5 w-5" /> : <X className="h-5 w-5" />}
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-4 overflow-y-auto">
        <div className={cn("space-y-1 px-3", isCollapsed && "flex flex-col items-center px-0")}>
          {menuItems.map((item) => 
            isCollapsed ? (
              <div 
                key={item.label}
                className={cn(
                  "p-2 rounded-lg cursor-pointer transition-all",
                  currentPath === item.path ? "bg-blue-50 text-blue-700" : "text-gray-600 hover:bg-gray-50"
                )}
                onClick={() => handleNavigation(item.path)}
                title={item.label}
              >
                <item.icon className="h-5 w-5" />
              </div>
            ) : (
              <SidebarItem
                key={item.label}
                icon={item.icon}
                label={item.label}
                path={item.path}
                active={currentPath === item.path}
                onClick={() => handleNavigation(item.path)}
              />
            )
          )}
        </div>
      </nav>

      {/* Logout */}
      <div className="p-4 border-t border-gray-200">
        {isCollapsed ? (
          <div 
            className="flex justify-center p-2 text-red-600 hover:bg-red-50 rounded-lg cursor-pointer"
            onClick={handleLogout}
            title="Logout"
          >
            <LogOut className="h-5 w-5" />
          </div>
        ) : (
          <div 
            className="flex items-center gap-3 px-3 py-2 text-red-600 hover:bg-red-50 rounded-lg cursor-pointer"
            onClick={handleLogout}
          >
            <LogOut className="h-5 w-5" />
            <span>Logout</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default ClientSidebar;

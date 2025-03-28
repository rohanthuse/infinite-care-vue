
import React, { useState } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { 
  LayoutDashboard, Workflow, ListChecks, Users, 
  Calendar, Star, MessageSquare, Pill, DollarSign, 
  FileText, ClipboardCheck, Bell, ClipboardList, 
  Menu, X, ChevronRight
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

// Group items by category for better organization
const menuGroups = [
  {
    label: "Main",
    items: [
      { icon: LayoutDashboard, label: "Dashboard", path: "dashboard" },
      { icon: Calendar, label: "Bookings", path: "bookings" },
      { icon: Users, label: "Clients", path: "clients" },
      { icon: Users, label: "Carers", path: "carers" },
    ]
  },
  {
    label: "Operations",
    items: [
      { icon: Workflow, label: "Workflow", path: "workflow" },
      { icon: ListChecks, label: "Key Parameters", path: "key-parameters" },
      { icon: Pill, label: "Medication", path: "medication" },
      { icon: ClipboardList, label: "Care Plan", path: "care-plan" },
    ]
  },
  {
    label: "Communication",
    items: [
      { icon: Star, label: "Reviews", path: "reviews" },
      { icon: MessageSquare, label: "Messages", path: "communication" },
      { icon: Bell, label: "Notifications", path: "notifications" },
    ]
  },
  {
    label: "Admin",
    items: [
      { icon: DollarSign, label: "Accounting", path: "accounting" },
      { icon: FileText, label: "Agreements", path: "agreements" },
      { icon: ClipboardCheck, label: "Attendance", path: "attendance" },
    ]
  }
];

interface BranchSidebarProps {
  branchName: string;
}

export const BranchSidebar = ({ branchName }: BranchSidebarProps) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);
  
  const toggleCollapse = () => {
    setCollapsed(!collapsed);
  };
  
  const currentPath = location.pathname;
  const baseUrl = currentPath.split('/').slice(0, 4).join('/');
  
  const isActive = (path: string) => {
    return currentPath.includes(`${baseUrl}/${path}`);
  };
  
  return (
    <motion.aside 
      animate={{ width: collapsed ? 80 : 250 }}
      transition={{ duration: 0.3 }}
      className={cn(
        "fixed top-[4.5rem] left-0 bottom-0 bg-white border-r border-gray-200 z-30",
        collapsed ? "w-20" : "w-64"
      )}
    >
      <div className="flex flex-col h-full">
        <div className="sticky top-0 z-20 bg-white p-3 border-b border-gray-100 flex justify-between items-center">
          {!collapsed && (
            <h2 className="text-lg font-bold text-gray-800 truncate">{branchName}</h2>
          )}
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={toggleCollapse} 
            className="rounded-full hover:bg-gray-100"
          >
            {collapsed ? <Menu className="h-5 w-5" /> : <X className="h-5 w-5" />}
          </Button>
        </div>
        
        <ScrollArea className="flex-1 overflow-auto">
          <div className="p-2">
            <TooltipProvider delayDuration={0}>
              {menuGroups.map((group) => (
                <div key={group.label} className="mb-6">
                  {!collapsed && (
                    <h3 className="text-xs font-semibold text-gray-500 uppercase px-3 mb-2">{group.label}</h3>
                  )}
                  <nav className="space-y-1">
                    {group.items.map((item) => {
                      const Icon = item.icon;
                      const active = isActive(item.path);
                      const itemPath = `${baseUrl}/${item.path}`;
                      
                      return (
                        <Tooltip key={item.label}>
                          <TooltipTrigger asChild>
                            <Link
                              to={itemPath}
                              className={cn(
                                "flex items-center gap-3 px-3 py-2 rounded-md cursor-pointer transition-colors",
                                active 
                                  ? "bg-blue-50 text-blue-600" 
                                  : "text-gray-700 hover:bg-gray-100",
                                collapsed && "justify-center"
                              )}
                            >
                              <Icon className={cn("h-5 w-5", active ? "text-blue-600" : "text-gray-500")} />
                              {!collapsed && (
                                <span className="text-sm font-medium">{item.label}</span>
                              )}
                              {!collapsed && active && (
                                <ChevronRight className="ml-auto h-4 w-4 text-blue-600" />
                              )}
                            </Link>
                          </TooltipTrigger>
                          <TooltipContent side="right" hidden={!collapsed}>
                            {item.label}
                          </TooltipContent>
                        </Tooltip>
                      );
                    })}
                  </nav>
                </div>
              ))}
            </TooltipProvider>
          </div>
        </ScrollArea>
        
        <div className={cn(
          "border-t border-gray-200 p-3",
          collapsed ? "text-center" : "px-4"
        )}>
          <div className={cn(
            "flex items-center text-xs text-gray-500",
            collapsed ? "flex-col" : "justify-between"
          )}>
            <span>Powered by</span>
            <span className="font-medium">Med-Infinite</span>
          </div>
        </div>
      </div>
    </motion.aside>
  );
};

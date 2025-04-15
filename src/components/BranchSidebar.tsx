import React, { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { 
  LayoutDashboard, Workflow, ListChecks, Users, 
  Calendar, Star, MessageSquare, Pill, DollarSign, 
  FileText, ClipboardCheck, Bell, ClipboardList, 
  FileUp, Folder, UserPlus, BarChart4, Settings,
  ChevronRight, ChevronDown, Menu, X, FileArchive
} from "lucide-react";
import { Button } from "@/components/ui/button";

type MenuItem = {
  icon: React.ElementType;
  label: string;
  path: string;
  submenu?: MenuItem[];
  expandable?: boolean;
};

const menuItems: MenuItem[] = [
  { icon: LayoutDashboard, label: "Dashboard", path: "/branch-dashboard" },
  { icon: Workflow, label: "Workflow", path: "/branch-workflow", expandable: true },
  { icon: ListChecks, label: "Key Parameters", path: "/branch-parameters", expandable: true },
  { icon: Users, label: "Staff", path: "/branch-staff", expandable: true },
  { icon: Users, label: "Client", path: "/branch-client", expandable: true },
  { icon: Calendar, label: "Bookings", path: "/branch-bookings" },
  { icon: Star, label: "Reviews", path: "/branch-reviews" },
  { icon: MessageSquare, label: "Communication", path: "/branch-communication" },
  { icon: Pill, label: "Medication", path: "/branch-medication", expandable: true },
  { icon: DollarSign, label: "Accounting", path: "/branch-accounting", expandable: true },
  { icon: ClipboardList, label: "Care Plan", path: "/branch-care-plan", expandable: true },
  { icon: FileText, label: "Agreements", path: "/branch-agreements", expandable: true },
  { icon: Bell, label: "Events & Logs", path: "/branch-events-logs" },
  { icon: ClipboardCheck, label: "Attendance", path: "/branch-attendance" },
  { icon: FileUp, label: "Form Builder", path: "/branch-form-builder" },
  { icon: FileArchive, label: "Documents", path: "/branch-documents" },
  { icon: Bell, label: "Notifications", path: "/branch-notifications", expandable: true },
  { icon: Folder, label: "Library", path: "/branch-library" },
  { icon: UserPlus, label: "Third Party Access", path: "/branch-third-party" },
  { icon: BarChart4, label: "Reports", path: "/branch-reports", expandable: true },
  { icon: Settings, label: "Settings", path: "/branch-settings", expandable: true },
];

type SidebarItemProps = {
  item: MenuItem;
  active: boolean;
  onClick: () => void;
  expanded?: boolean;
  onExpand?: () => void;
  collapsed: boolean;
};

const SidebarItem = ({ item, active, onClick, expanded, onExpand, collapsed }: SidebarItemProps) => {
  const Icon = item.icon;
  
  if (collapsed) {
    return (
      <div 
        className={cn(
          "flex flex-col items-center justify-center p-3 my-1 rounded-md cursor-pointer transition-colors",
          active ? "bg-blue-50 text-blue-600" : "hover:bg-gray-100"
        )}
        onClick={onClick}
        title={item.label}
      >
        <Icon className={cn("h-5 w-5", active ? "text-blue-600" : "text-gray-600")} />
        <span className="text-xs mt-1 text-center">
          {item.label.length > 6 ? `${item.label.substring(0, 6)}...` : item.label}
        </span>
      </div>
    );
  }
  
  return (
    <div className="relative">
      <div 
        className={cn(
          "flex items-center justify-between px-4 py-3 my-1 rounded-md cursor-pointer transition-colors",
          active ? "bg-blue-50 text-blue-600" : "hover:bg-gray-100"
        )}
        onClick={onClick}
      >
        <div className="flex items-center gap-3">
          <Icon className={cn("h-5 w-5", active ? "text-blue-600" : "text-gray-600")} />
          <span className={cn("text-sm font-medium", active ? "text-blue-600" : "text-gray-700")}>
            {item.label}
          </span>
        </div>
        {item.expandable && (
          <button 
            className="p-1 rounded-full hover:bg-gray-200 transition-colors"
            onClick={(e) => {
              e.stopPropagation();
              onExpand?.();
            }}
          >
            {expanded ? 
              <ChevronDown className="h-4 w-4 text-gray-500" /> : 
              <ChevronRight className="h-4 w-4 text-gray-500" />
            }
          </button>
        )}
      </div>
    </div>
  );
};

interface BranchSidebarProps {
  branchName: string;
}

export const BranchSidebar = ({ branchName }: BranchSidebarProps) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [activeItem, setActiveItem] = useState("Dashboard");
  const [expandedItems, setExpandedItems] = useState<string[]>([]);
  const [collapsed, setCollapsed] = useState(false);
  
  const handleItemClick = (item: MenuItem) => {
    setActiveItem(item.label);
    navigate(item.path);
  };
  
  const toggleExpand = (label: string) => {
    setExpandedItems(prev => 
      prev.includes(label) 
        ? prev.filter(item => item !== label)
        : [...prev, label]
    );
  };
  
  const isActive = (item: MenuItem) => {
    return location.pathname === item.path || activeItem === item.label;
  };
  
  const isExpanded = (label: string) => {
    return expandedItems.includes(label);
  };
  
  const toggleCollapse = () => {
    setCollapsed(!collapsed);
  };
  
  return (
    <motion.aside 
      animate={{ width: collapsed ? 80 : 250 }}
      transition={{ duration: 0.3 }}
      className={cn(
        "fixed top-[4.5rem] left-0 bottom-0 bg-white border-r border-gray-200 z-30 overflow-y-auto",
        collapsed ? "w-20" : "w-64"
      )}
    >
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
      
      <div className="p-2 mt-2">
        <nav className="space-y-1">
          {menuItems.map((item) => (
            <SidebarItem 
              key={item.label}
              item={item} 
              active={isActive(item)}
              onClick={() => handleItemClick(item)}
              expanded={isExpanded(item.label)}
              onExpand={() => toggleExpand(item.label)}
              collapsed={collapsed}
            />
          ))}
        </nav>
      </div>
      
      <div className={cn(
        "border-t border-gray-200 mt-auto p-3",
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
    </motion.aside>
  );
};

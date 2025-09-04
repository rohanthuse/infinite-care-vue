import React, { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { 
  LayoutDashboard, Workflow, ListChecks, Users, 
  Calendar, Star, MessageSquare, Pill, PoundSterling, 
  FileText, ClipboardCheck, Bell, ClipboardList, 
  FileUp, Folder, UserPlus, BarChart4, Settings,
  ChevronRight, ChevronDown, Menu, X, FileArchive,
  CalendarDays
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
  { icon: ListChecks, label: "Core Settings", path: "/branch-parameters", expandable: true },
  { icon: Users, label: "Staff", path: "/branch-staff", expandable: true },
  { icon: Users, label: "Client", path: "/branch-client", expandable: true },
  { icon: Calendar, label: "Bookings", path: "/branch-bookings" },
  { icon: CalendarDays, label: "Leave Management", path: "/branch-leave" },
  { icon: Star, label: "Feedbacks", path: "/branch-reviews" },
  { icon: MessageSquare, label: "Communication", path: "/branch-communication" },
  { icon: Pill, label: "Medication", path: "/branch-medication", expandable: true },
  { icon: PoundSterling, label: "Accounting", path: "/branch-accounting", expandable: true },
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
          active ? "bg-primary/10 text-primary" : "hover:bg-muted"
        )}
        onClick={onClick}
        title={item.label}
      >
        <Icon className={cn("h-5 w-5", active ? "text-primary" : "text-muted-foreground")} />
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
          active ? "bg-primary/10 text-primary" : "hover:bg-muted"
        )}
        onClick={onClick}
      >
        <div className="flex items-center gap-3">
          <Icon className={cn("h-5 w-5", active ? "text-primary" : "text-muted-foreground")} />
          <span className={cn("text-sm font-medium", active ? "text-primary" : "text-foreground")}>
            {item.label}
          </span>
        </div>
        {item.expandable && (
          <button 
            className="p-1 rounded-full hover:bg-muted/50 transition-colors"
            onClick={(e) => {
              e.stopPropagation();
              onExpand?.();
            }}
          >
            {expanded ? 
              <ChevronDown className="h-4 w-4 text-muted-foreground" /> : 
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
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
        "fixed top-[4.5rem] left-0 bottom-0 bg-card border-r border-border z-30 overflow-y-auto",
        collapsed ? "w-20" : "w-64"
      )}
    >
      <div className="sticky top-0 z-20 bg-card p-3 border-b border-border flex justify-between items-center">
        {!collapsed && (
          <h2 className="text-lg font-bold text-foreground truncate">{branchName}</h2>
        )}
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={toggleCollapse} 
          className="rounded-full hover:bg-muted/50"
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
        "border-t border-border mt-auto p-3",
        collapsed ? "text-center" : "px-4"
      )}>
        <div className={cn(
          "flex items-center text-xs text-muted-foreground",
          collapsed ? "flex-col" : "justify-between"
        )}>
          <span>Powered by</span>
          <span className="font-medium">Med-Infinite</span>
        </div>
      </div>
    </motion.aside>
  );
};

import React, { useState } from "react";
import { useNavigate, useLocation, useParams } from "react-router-dom";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { useTenant } from "@/contexts/TenantContext";
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
  { icon: LayoutDashboard, label: "Dashboard", path: "", expandable: false },
  { icon: Workflow, label: "Workflow", path: "workflow", expandable: true },
  { icon: ListChecks, label: "Core Settings", path: "key-parameters", expandable: true },
  { icon: Users, label: "Staff", path: "carers", expandable: true },
  { icon: Users, label: "Client", path: "clients", expandable: true },
  { icon: Calendar, label: "Bookings", path: "bookings", expandable: false },
  { icon: CalendarDays, label: "Leave Management", path: "leave", expandable: false },
  { icon: Star, label: "Feedbacks", path: "reviews", expandable: false },
  { icon: MessageSquare, label: "Communication", path: "communication", expandable: false },
  { icon: Pill, label: "Medication", path: "medication", expandable: true },
  { icon: PoundSterling, label: "Accounting", path: "accounting", expandable: true },
  { icon: ClipboardList, label: "Care Plan", path: "care-plan", expandable: true },
  { icon: FileText, label: "Agreements", path: "agreements", expandable: true },
  { icon: Bell, label: "Events & Logs", path: "events-logs", expandable: false },
  { icon: ClipboardCheck, label: "Attendance", path: "attendance", expandable: false },
  { icon: FileUp, label: "Form Builder", path: "form-builder", expandable: false },
  { icon: FileArchive, label: "Documents", path: "documents", expandable: false },
  { icon: Bell, label: "Notifications", path: "notifications", expandable: true },
  { icon: Folder, label: "Library", path: "library", expandable: false },
  { icon: UserPlus, label: "Third Party Access", path: "third-party", expandable: false },
  { icon: BarChart4, label: "Reports", path: "reports", expandable: true },
  { icon: Settings, label: "Settings", path: "settings", expandable: true },
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
  const { tenantSlug } = useTenant();
  const { id, branchName: urlBranchName } = useParams<{ id: string; branchName: string }>();
  const [activeItem, setActiveItem] = useState("Dashboard");
  const [expandedItems, setExpandedItems] = useState<string[]>([]);
  const [collapsed, setCollapsed] = useState(false);
  
  const handleItemClick = (item: MenuItem) => {
    setActiveItem(item.label);
    
    // Construct tenant-aware path
    if (!id || !urlBranchName) {
      console.error('[BranchSidebar] Missing required parameters:', { id, branchName: urlBranchName });
      return;
    }
    
    const basePath = tenantSlug 
      ? `/${tenantSlug}/branch-dashboard/${id}/${urlBranchName}` 
      : `/branch-dashboard/${id}/${urlBranchName}`;
    
    const targetPath = item.path === "" ? basePath : `${basePath}/${item.path}`;
    
    console.log('[BranchSidebar] Navigating to:', targetPath);
    navigate(targetPath);
  };
  
  const toggleExpand = (label: string) => {
    setExpandedItems(prev => 
      prev.includes(label) 
        ? prev.filter(item => item !== label)
        : [...prev, label]
    );
  };
  
  const isActive = (item: MenuItem) => {
    const pathParts = location.pathname.split('/').filter(Boolean);
    const branchDashboardIndex = pathParts.findIndex(part => part === 'branch-dashboard');
    
    if (branchDashboardIndex >= 0 && pathParts.length > branchDashboardIndex + 2) {
      const currentTab = pathParts[branchDashboardIndex + 3];
      return item.path === currentTab || (item.path === "" && !currentTab);
    }
    
    return item.path === "" && location.pathname.includes('branch-dashboard');
  };
  
  const isExpanded = (label: string) => {
    return expandedItems.includes(label);
  };
  
  const toggleCollapse = () => {
    setCollapsed(!collapsed);
  };

  // Handle navigation back to admin dashboard
  const handleAdminNavigation = () => {
    // Navigate to appropriate admin dashboard based on tenant context
    const adminPath = tenantSlug ? `/${tenantSlug}/dashboard` : '/dashboard';
    navigate(adminPath);
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
        <div 
          className={cn(
            "flex items-center text-xs text-muted-foreground cursor-pointer hover:text-primary transition-colors",
            collapsed ? "flex-col" : "justify-between"
          )}
          onClick={handleAdminNavigation}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              handleAdminNavigation();
            }
          }}
          aria-label="Return to Admin Dashboard"
        >
          <span>Powered by</span>
          <span className="font-medium">Med-Infinite</span>
        </div>
      </div>
    </motion.aside>
  );
};

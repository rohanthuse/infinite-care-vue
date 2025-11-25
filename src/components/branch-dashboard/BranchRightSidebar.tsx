import React, { useState } from "react";
import { 
  LayoutDashboard, Workflow, ListChecks, Users, 
  Calendar, CalendarDays, Star, MessageSquare, Pill, PoundSterling, 
  FileText, ClipboardCheck, Bell, ClipboardList, 
  FileUp, Folder, UserPlus, BarChart4, Settings, 
  Search, Plus, UserPlus2, FileSignature, CalendarPlus, 
  UserRoundPlus, ChevronDown, BookText
} from "lucide-react";
import { cn } from "@/lib/utils";
import { 
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarTrigger,
  useSidebar,
  SidebarHeader
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";
import { 
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { toast } from "sonner";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import { useAdminPermissions, hasTabPermission } from "@/hooks/useAdminPermissions";
import { useUserRole } from "@/hooks/useUserRole";
import { useTenant } from "@/contexts/TenantContext";

// Helper to extract tenant slug from URL as fallback
const getTenantSlugFromUrl = (pathname: string): string | null => {
  const parts = pathname.split('/').filter(Boolean);
  if (parts.length > 1 && parts[1] === 'branch-dashboard') {
    return parts[0];
  }
  return null;
};

interface TabItem {
  icon: React.ElementType;
  label: string;
  value: string;
  description?: string;
}

interface TabGroup {
  label: string;
  items: TabItem[];
}

const primaryTabs: TabItem[] = [
  { icon: LayoutDashboard, label: "Dashboard", value: "dashboard", description: "Branch overview" },
  { icon: CalendarDays, label: "Organisation Calendar", value: "organization-calendar", description: "Comprehensive calendar view" },
  { icon: Calendar, label: "Bookings", value: "bookings", description: "Manage appointments" },
  { icon: Users, label: "Clients", value: "clients", description: "Client information" },
  { icon: Users, label: "Staff", value: "carers", description: "Staff management" },
  { icon: BookText, label: "Training", value: "training-matrix", description: "Staff training & development" },
  { icon: ClipboardList, label: "Care Plan", value: "care-plan", description: "Patient care plans" },
  { icon: PoundSterling, label: "Finance", value: "finance", description: "Financial management" },
  { icon: Star, label: "Feedbacks", value: "reviews", description: "Client feedback" },
  { icon: MessageSquare, label: "Communication", value: "communication", description: "Messages & emails" },
];

const secondaryTabGroups: TabGroup[] = [
  {
    label: "Operations",
    items: [
      { icon: Workflow, label: "Workflow", value: "workflow", description: "Process management" },
      { icon: ListChecks, label: "Core Settings", value: "key-parameters", description: "Track metrics" },
      { icon: Pill, label: "Medication", value: "medication", description: "Medicine tracking" },
    ]
  },
  {
    label: "Administration",
    items: [
      { icon: FileText, label: "Agreements", value: "agreements", description: "Legal documents" },
      { icon: Bell, label: "Events & Logs", value: "events-logs", description: "Activity tracking" },
      { icon: ClipboardCheck, label: "Attendance", value: "attendance", description: "Staff attendance" },
    ]
  },
  {
    label: "Resources",
    items: [
      { icon: FileUp, label: "Form Builder", value: "form-builder", description: "Create custom forms" },
      { icon: Folder, label: "Documents", value: "documents", description: "Manage documents" },
      { icon: Bell, label: "Notifications", value: "notifications", description: "Alert management" },
      { icon: Folder, label: "Library", value: "library", description: "Resources & guides" },
      { icon: UserPlus, label: "Third Party Access", value: "third-party", description: "External users" },
    ]
  },
  {
    label: "Reports",
    items: [
      { icon: BarChart4, label: "Reports", value: "reports", description: "Data analysis" },
    ]
  },
];

interface BranchRightSidebarProps {
  activeTab: string;
  onChange: (value: string) => void;
  onNewClient?: () => void;
  onNewBooking?: () => void;
  onNewStaff?: () => void;
  onNewAgreement?: () => void;
  onUploadDocument?: () => void;
}

export const BranchRightSidebar: React.FC<BranchRightSidebarProps> = ({
  activeTab,
  onChange,
  onNewClient,
  onNewBooking,
  onNewStaff,
  onNewAgreement,
  onUploadDocument
}) => {
  const { open } = useSidebar();
  const collapsed = !open;
  const navigate = useNavigate();
  const location = useLocation();
  const { id, branchName } = useParams();
  const { data: userRole } = useUserRole();
  const { data: permissions } = useAdminPermissions(id);
  const { tenantSlug: contextTenantSlug } = useTenant();
  
  // Use context tenant slug or extract from URL as fallback
  const tenantSlug = contextTenantSlug || getTenantSlugFromUrl(location.pathname);
  
  const [searchTerm, setSearchTerm] = useState("");
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({
    "Operations": true,
    "Administration": true,
    "Resources": true,
    "Reports": true,
  });
  const [isQuickActionsOpen, setIsQuickActionsOpen] = useState(false);

  // Filter tabs based on permissions for branch admins
  const filterTabsByPermissions = (tabs: TabItem[]) => {
    if (userRole?.role === 'super_admin') {
      return tabs;
    }
    
    if (userRole?.role === 'branch_admin') {
      return tabs.filter(tab => hasTabPermission(permissions || null, tab.value));
    }
    
    return tabs;
  };
  
  const filteredPrimaryTabs = filterTabsByPermissions(primaryTabs);
  const filteredSecondaryTabGroups = secondaryTabGroups.map(group => ({
    ...group,
    items: filterTabsByPermissions(group.items)
  })).filter(group => group.items.length > 0);

  const allTabs = [...filteredPrimaryTabs, ...filteredSecondaryTabGroups.flatMap(g => g.items)];
  const filteredTabs = allTabs.filter(tab => 
    tab.label.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const cleanupDropdownState = () => {
    // Remove any lingering pointer-events blocks
    document.body.style.removeProperty('pointer-events');
    document.documentElement.style.removeProperty('pointer-events');
    
    // Remove any lingering overlays or portals
    const overlays = document.querySelectorAll('[data-radix-dropdown-menu-content]');
    overlays.forEach(overlay => {
      if (overlay.getAttribute('data-state') === 'closed') {
        overlay.remove();
      }
    });
    
    // Remove inert and aria-hidden from root
    const root = document.getElementById('root');
    if (root) {
      root.removeAttribute('inert');
      root.removeAttribute('aria-hidden');
    }
    
    // Ensure body can scroll
    document.body.style.removeProperty('overflow');
    document.documentElement.style.removeProperty('overflow');
  };

  const handleQuickAddAction = (action: string) => {
    // Force close dropdown first
    setIsQuickActionsOpen(false);
    
    // Small delay to ensure dropdown cleanup completes
    setTimeout(() => {
      switch (action) {
        case "New Client":
          if (onNewClient) {
            onNewClient();
          } else {
            toast.info("Feature coming soon");
          }
          break;
        case "New Booking":
          if (onNewBooking) {
            onNewBooking();
          } else {
            toast.info("Feature coming soon");
          }
          break;
        case "New Staff":
          if (onNewStaff) {
            onNewStaff();
          } else {
            toast.info("Feature coming soon");
          }
          break;
        case "New Agreement":
          if (onNewAgreement) {
            onNewAgreement();
          } else {
            toast.info("Feature coming soon");
          }
          break;
        case "Upload Document":
          if (onUploadDocument) {
            onUploadDocument();
          } else {
            toast.info("Feature coming soon");
          }
          break;
        default:
          toast.info("Feature coming soon");
      }
      
      // Additional cleanup to ensure no lingering state
      cleanupDropdownState();
    }, 50);
  };

  const handleTabNavigation = (tabValue: string) => {
    console.log('[BranchRightSidebar] handleTabNavigation called:', {
      tabValue,
      userRole: userRole?.role,
      permissions,
      tenantSlug,
      id,
      branchName
    });
    
    // Check permissions for branch admins
    if (userRole?.role === 'branch_admin') {
      const hasPermission = hasTabPermission(permissions || null, tabValue);
      console.log('[BranchRightSidebar] Permission check:', {
        tabValue,
        hasPermission,
        permissions
      });
      
      if (!hasPermission) {
        toast.error("Access denied", {
          description: `You don't have permission to access ${tabValue}. Please contact your administrator.`,
          position: "top-center",
        });
        return;
      }
    }
    
    // Ensure we have the required parameters
    if (!id || !branchName) {
      console.error('[BranchRightSidebar] Missing navigation parameters:', { id, branchName });
      toast.error("Navigation error", {
        description: "Branch information is missing. Please refresh the page.",
        position: "top-center",
      });
      return;
    }
    
    // Use proper tenant context
    const basePath = tenantSlug 
      ? `/${tenantSlug}/branch-dashboard/${id}/${branchName}` 
      : `/branch-dashboard/${id}/${branchName}`;
    
    const targetPath = `${basePath}/${tabValue}`;
    
    console.log('[BranchRightSidebar] Navigating to:', {
      basePath,
      tabValue,
      targetPath,
      tenantSlug
    });
    
    // Navigate to dedicated pages
    const dedicatedModules = [
      'events-logs', 'attendance', 'form-builder', 'documents', 
      'library', 'third-party', 'reports', 'bookings', 'accounting', 
      'care-plan', 'agreements', 'forms', 'notifications', 'workflow', 
      'organization-calendar'
    ];
    
    if (dedicatedModules.includes(tabValue)) {
      try {
        navigate(targetPath);
        console.log('[BranchRightSidebar] Navigation completed successfully');
      } catch (error) {
        console.error('[BranchRightSidebar] Navigation failed:', error);
        toast.error("Navigation failed", {
          description: "Unable to navigate to the requested page. Please try again.",
          position: "top-center",
        });
      }
    } else {
      onChange(tabValue);
    }
  };

  const toggleGroup = (groupLabel: string) => {
    setOpenGroups(prev => ({
      ...prev,
      [groupLabel]: !prev[groupLabel]
    }));
  };

  const isActive = (tabValue: string) => activeTab === tabValue;

  return (
    <Sidebar
      side="right"
      className={cn(
        "border-l border-border bg-background text-foreground z-50",
        collapsed ? "w-[72px]" : "w-80"
      )}
      collapsible="icon"
    >
      <SidebarHeader className="border-b border-border p-4 bg-background">
        {!collapsed && (
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-foreground">Navigation</h2>
            <SidebarTrigger className="h-8 w-8 text-foreground hover:bg-accent" />
          </div>
        )}
        {collapsed && (
          <div className="flex justify-center">
            <SidebarTrigger className="h-8 w-8 text-foreground hover:bg-accent" />
          </div>
        )}
      </SidebarHeader>

      <SidebarContent>
        {!collapsed && (
          <div className="p-4 border-b border-border bg-background">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search modules..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 bg-background text-foreground border-input"
              />
            </div>
          </div>
        )}

        {/* Quick Actions */}
        {!collapsed && (
          <div className="p-4 border-b border-border bg-background">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-medium text-foreground">Quick Actions</h3>
              <DropdownMenu open={isQuickActionsOpen} onOpenChange={setIsQuickActionsOpen}>
                <DropdownMenuTrigger asChild>
                  <Button size="sm" className="h-8 w-8 p-0" variant="outline">
                    <Plus className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel>Quick Actions</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => handleQuickAddAction("New Client")} className="cursor-pointer">
                    <UserPlus2 className="mr-2 h-4 w-4" />
                    <span>New Client</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleQuickAddAction("New Booking")} className="cursor-pointer">
                    <CalendarPlus className="mr-2 h-4 w-4" />
                    <span>New Booking</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleQuickAddAction("New Agreement")} className="cursor-pointer">
                    <FileSignature className="mr-2 h-4 w-4" />
                    <span>New Agreement</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleQuickAddAction("New Staff")} className="cursor-pointer">
                    <UserRoundPlus className="mr-2 h-4 w-4" />
                    <span>New Staff</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <Button 
                variant="outline" 
                size="sm" 
                className="h-8 text-xs"
                onClick={() => handleQuickAddAction("New Client")}
              >
                <UserPlus2 className="mr-1 h-3 w-3" />
                Client
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                className="h-8 text-xs"
                onClick={() => handleQuickAddAction("New Booking")}
              >
                <CalendarPlus className="mr-1 h-3 w-3" />
                Booking
              </Button>
            </div>
          </div>
        )}

        {/* Primary Navigation */}
        <SidebarGroup>
          {!collapsed && <SidebarGroupLabel>Main Modules</SidebarGroupLabel>}
          <SidebarGroupContent>
            <SidebarMenu>
              {(searchTerm ? filteredTabs.filter(tab => filteredPrimaryTabs.includes(tab)) : filteredPrimaryTabs).map((tab) => {
                const Icon = tab.icon;
                const active = isActive(tab.value);
                
                return (
                  <SidebarMenuItem key={tab.value}>
                      <SidebarMenuButton 
                        asChild
                        tooltip={collapsed ? tab.label : undefined}
                        className={cn(
                          "w-full justify-start text-foreground hover:bg-accent hover:text-accent-foreground",
                          active && "bg-primary/10 text-primary border-r-2 border-primary"
                        )}
                      >
                        <button onClick={() => handleTabNavigation(tab.value)}>
                          <Icon className={cn("h-4 w-4", collapsed ? "mx-auto" : "mr-2")} />
                          {!collapsed && <span className="text-sm">{tab.label}</span>}
                        </button>
                      </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Secondary Navigation Groups */}
        {filteredSecondaryTabGroups.map((group) => {
          const groupItems = searchTerm 
            ? filteredTabs.filter(tab => group.items.some(item => item.value === tab.value))
            : group.items;
            
          if (groupItems.length === 0) return null;

          return (
            <SidebarGroup key={group.label}>
              {!collapsed && (
                <SidebarGroupLabel className="text-sm font-medium text-muted-foreground">
                  {group.label}
                </SidebarGroupLabel>
              )}
              <SidebarGroupContent>
                <SidebarMenu>
                  {groupItems.map((tab) => {
                    const Icon = tab.icon;
                    const active = isActive(tab.value);
                    
                    return (
                      <SidebarMenuItem key={tab.value}>
                         <SidebarMenuButton 
                           asChild
                           tooltip={collapsed ? tab.label : undefined}
                           className={cn(
                             "w-full justify-start text-foreground hover:bg-accent hover:text-accent-foreground",
                             active && "bg-primary/10 text-primary border-r-2 border-primary"
                           )}
                         >
                           <button onClick={() => handleTabNavigation(tab.value)}>
                             <Icon className={cn("h-4 w-4", collapsed ? "mx-auto" : "mr-2")} />
                             {!collapsed && <span className="text-sm">{tab.label}</span>}
                           </button>
                         </SidebarMenuButton>
                      </SidebarMenuItem>
                    );
                  })}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          );
        })}

      </SidebarContent>
    </Sidebar>
  );
};
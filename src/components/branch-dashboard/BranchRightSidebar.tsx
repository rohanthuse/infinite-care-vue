import React, { useState } from "react";
import { 
  LayoutDashboard, Workflow, ListChecks, Users, 
  Calendar, Star, MessageSquare, Pill, DollarSign, 
  FileText, ClipboardCheck, Bell, ClipboardList, 
  FileUp, Folder, UserPlus, BarChart4, Settings, 
  Search, Plus, UserPlus2, FileSignature, CalendarPlus, 
  UserRoundPlus, ChevronDown
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
import { useNavigate, useParams } from "react-router-dom";
import { useAdminPermissions, hasTabPermission } from "@/hooks/useAdminPermissions";
import { useUserRole } from "@/hooks/useUserRole";

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
  { icon: Calendar, label: "Bookings", value: "bookings", description: "Manage appointments" },
  { icon: Users, label: "Clients", value: "clients", description: "Client information" },
  { icon: Users, label: "Staff", value: "carers", description: "Staff management" },
  { icon: ClipboardList, label: "Care Plan", value: "care-plan", description: "Patient care plans" },
  { icon: DollarSign, label: "Finance", value: "finance", description: "Financial management" },
  { icon: Star, label: "Reviews", value: "reviews", description: "Client feedback" },
  { icon: MessageSquare, label: "Communication", value: "communication", description: "Messages & emails" },
];

const secondaryTabGroups: TabGroup[] = [
  {
    label: "Operations",
    items: [
      { icon: Workflow, label: "Workflow", value: "workflow", description: "Process management" },
      { icon: ListChecks, label: "Key Parameters", value: "key-parameters", description: "Track metrics" },
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
  const { id, branchName } = useParams();
  const { data: userRole } = useUserRole();
  const { data: permissions } = useAdminPermissions(id);
  
  const [searchTerm, setSearchTerm] = useState("");
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({
    "Operations": true,
    "Administration": true,
    "Resources": true,
    "Reports": true,
  });

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

  const handleQuickAddAction = (action: string) => {
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
  };

  const handleTabNavigation = (tabValue: string) => {
    // Check permissions for branch admins
    if (userRole?.role === 'branch_admin' && !hasTabPermission(permissions || null, tabValue)) {
      toast.error("Access denied", {
        description: "You don't have permission to access this section",
        position: "top-center",
      });
      return;
    }
    
    // Get tenant context for all navigations
    const tenantSlug = window.location.pathname.split('/')[1];
    const basePath = tenantSlug ? `/${tenantSlug}/branch-dashboard/${id}/${branchName}` : `/branch-dashboard/${id}/${branchName}`;
    
    // Navigate to dedicated pages for modules that have them
    const dedicatedModules = ['events-logs', 'attendance', 'form-builder', 'documents', 'library', 'third-party', 'reports', 'bookings', 'accounting', 'care-plan', 'agreements', 'forms', 'notifications', 'workflow'];
    
    if (dedicatedModules.includes(tabValue) && id && branchName) {
      navigate(`${basePath}/${tabValue}`);
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
        collapsed ? "w-16" : "w-80"
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
              <DropdownMenu>
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
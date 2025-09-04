
import React, { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { 
  LayoutDashboard, Workflow, ListChecks, Users, 
  Calendar, Star, MessageSquare, Pill, PoundSterling, 
  FileText, ClipboardCheck, Bell, ClipboardList, 
  FileUp, Folder, UserPlus, BarChart4, Settings, 
  Activity, Briefcase, PanelLeft, Paperclip,
  ChevronDown, Menu, Search, Grid, Plus,
  UserPlus2, FileSignature, CalendarPlus, Contact, UserRoundPlus
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuGroup,
  DropdownMenuLabel,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent,
  DropdownMenuPortal
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { toast } from "sonner";
import { useAdminPermissions, hasTabPermission } from "@/hooks/useAdminPermissions";
import { useUserRole } from "@/hooks/useUserRole";
import { NotificationDropdown } from "@/components/notifications/NotificationDropdown";

interface TabItem {
  icon: React.ElementType;
  label: string;
  value: string;
  description?: string;
}

const primaryTabs: TabItem[] = [
  { icon: LayoutDashboard, label: "Dashboard", value: "dashboard", description: "Branch overview" },
  { icon: Calendar, label: "Bookings", value: "bookings", description: "Manage appointments" },
  { icon: Users, label: "Clients", value: "clients", description: "Client information" },
  { icon: Users, label: "Staff", value: "carers", description: "Staff management" },
  { icon: ClipboardList, label: "Care Plan", value: "care-plan", description: "Patient care plans" },
  { icon: PoundSterling, label: "Finance", value: "finance", description: "Financial management" },
  { icon: Star, label: "Feedbacks", value: "reviews", description: "Client feedback" },
  { icon: MessageSquare, label: "Communication", value: "communication", description: "Messages & emails" },
];

const secondaryTabGroups = [
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

const secondaryTabs: TabItem[] = secondaryTabGroups.flatMap(group => group.items);

interface TabNavigationProps {
  activeTab: string;
  onChange: (value: string) => void;
  hideActionsOnMobile?: boolean;
  hideQuickAdd?: boolean;
  onNewClient?: () => void;
  onNewBooking?: () => void;
  onNewStaff?: () => void;
  onNewAgreement?: () => void;
  onUploadDocument?: () => void;
}

export const TabNavigation = ({ 
  activeTab, 
  onChange, 
  hideActionsOnMobile = false, 
  hideQuickAdd = false,
  onNewClient,
  onNewBooking,
  onNewStaff,
  onNewAgreement,
  onUploadDocument
}: TabNavigationProps) => {
  const navigate = useNavigate();
  const { id, branchName } = useParams();
  const { data: userRole } = useUserRole();
  const { data: permissions } = useAdminPermissions(id);
  
  // Filter tabs based on permissions for branch admins
  const filterTabsByPermissions = (tabs: TabItem[]) => {
    console.log('[TabNavigation] Filtering tabs:', {
      userRole: userRole?.role,
      permissions,
      tabs: tabs.map(t => t.value)
    });
    
    // Super admins see all tabs
    if (userRole?.role === 'super_admin') {
      console.log('[TabNavigation] Super admin - showing all tabs');
      return tabs;
    }
    
    // Branch admins see only permitted tabs
    if (userRole?.role === 'branch_admin') {
      const filteredTabs = tabs.filter(tab => {
        const hasPermission = hasTabPermission(permissions || null, tab.value);
        console.log('[TabNavigation] Tab permission check:', {
          tab: tab.value,
          hasPermission,
          permissions
        });
        return hasPermission;
      });
      console.log('[TabNavigation] Branch admin filtered tabs:', filteredTabs.map(t => t.value));
      return filteredTabs;
    }
    
    // Other roles see all tabs (for now)
    console.log('[TabNavigation] Other role - showing all tabs');
    return tabs;
  };
  
  const filteredPrimaryTabs = filterTabsByPermissions(primaryTabs);
  const filteredSecondaryTabs = filterTabsByPermissions(secondaryTabs);
  const allTabs = [...filteredPrimaryTabs, ...filteredSecondaryTabs];
  const activeTabObject = allTabs.find(tab => tab.value === activeTab);
  const [searchTerm, setSearchTerm] = useState("");
  
  const filteredTabs = allTabs.filter(tab => 
    tab.label.toLowerCase().includes(searchTerm.toLowerCase())
  );
  
  const handleQuickAddAction = (action: string) => {
    switch (action) {
      case "New Client":
        if (onNewClient) {
          onNewClient();
        } else {
          toast.info("Feature coming soon", {
            description: "The new client feature will be available soon",
            position: "top-center",
          });
        }
        break;
      case "New Booking":
        if (onNewBooking) {
          onNewBooking();
        } else {
          toast.info("Feature coming soon", {
            description: "The new booking feature will be available soon",
            position: "top-center",
          });
        }
        break;
      case "New Staff":
        if (onNewStaff) {
          onNewStaff();
        } else {
          toast.info("Feature coming soon", {
            description: "The new staff feature will be available soon",
            position: "top-center",
          });
        }
        break;
      case "New Agreement":
        if (onNewAgreement) {
          onNewAgreement();
        } else {
          toast.info("Feature coming soon", {
            description: "The new agreement feature will be available soon",
            position: "top-center",
          });
        }
        break;
      case "Upload Document":
        if (onUploadDocument) {
          onUploadDocument();
        } else {
          toast.info("Feature coming soon", {
            description: "The upload document feature will be available soon",
            position: "top-center",
          });
        }
        break;
      default:
        toast.info("Feature coming soon", {
          description: `The ${action.toLowerCase()} feature will be available soon`,
          position: "top-center",
        });
    }
    console.log(`Quick Add action selected: ${action}`);
  };

  const handleTabNavigation = (tabValue: string) => {
    console.log('[TabNavigation] Tab navigation attempt:', {
      tabValue,
      userRole: userRole?.role,
      hasPermission: hasTabPermission(permissions || null, tabValue),
      permissions
    });
    
    // Check permissions for branch admins
    if (userRole?.role === 'branch_admin' && !hasTabPermission(permissions || null, tabValue)) {
      console.warn('[TabNavigation] Access denied to tab:', tabValue);
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
      // Use the provided onChange for other tabs
      onChange(tabValue);
    }
  };

  // Handle direct Reports menu item click without submenu
  const handleReportsClick = () => {
    onChange("reports");
  };
  
  return (
    <div className="w-full">
      <div className="flex flex-col space-y-4">
        {!hideActionsOnMobile && (
          <div className="flex items-center justify-between md:hidden bg-white p-3 rounded-lg shadow-sm">
            <Button variant="outline" size="icon" className="h-9 w-9 rounded-full">
              <Search className="h-4 w-4" />
            </Button>
            
            <div className="flex items-center space-x-2">
              <NotificationDropdown branchId={id} />
              
              {!hideQuickAdd && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button 
                      variant="default" 
                      size="sm" 
                      className="rounded-full bg-blue-600 hover:bg-blue-700 h-9 w-9 p-0"
                    >
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
              )}
            </div>
          </div>
        )}

        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-2 z-30 md:hidden">
          <div className="flex justify-around">
            {filteredPrimaryTabs.slice(0, 5).map((tab) => {
              const Icon = tab.icon;
              const isActive = tab.value === activeTab;
              return (
                <Button
                  key={tab.value}
                  variant="ghost"
                  size="sm"
                  className={cn(
                    "flex flex-col items-center justify-center gap-1 h-auto px-1 py-2 rounded-lg",
                    isActive ? "bg-blue-50 text-blue-600" : "text-gray-500"
                  )}
                  onClick={() => handleTabNavigation(tab.value)}
                >
                  <Icon className="h-5 w-5" />
                  <span className="text-xs">{tab.label}</span>
                </Button>
              );
            })}
            
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className={cn(
                    "flex flex-col items-center justify-center gap-1 h-auto px-1 py-2 rounded-lg",
                    activeTab !== "dashboard" && 
                    !primaryTabs.slice(0, 5).some(t => t.value === activeTab) 
                      ? "bg-blue-50 text-blue-600" 
                      : "text-gray-500"
                  )}
                >
                  <Grid className="h-5 w-5" />
                  <span className="text-xs">More</span>
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-64" align="end" sideOffset={5}>
                <div className="p-2">
                  <Input
                    placeholder="Search modules..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="mb-2"
                  />
                </div>
                <div className="max-h-[50vh] overflow-y-auto p-1">
                  {filteredTabs.length > 0 ? (
                    <>
                      {filteredPrimaryTabs.slice(5).map((tab) => {
                        const Icon = tab.icon;
                        return (
                          <Button
                            key={tab.value}
                            variant="ghost"
                            className={cn(
                              "w-full justify-start text-left py-2 px-3 rounded-md my-1",
                              tab.value === activeTab ? "bg-blue-50 text-blue-600" : ""
                            )}
                            onClick={() => {
                              handleTabNavigation(tab.value);
                              setSearchTerm("");
                            }}
                          >
                            <Icon className="h-4 w-4 mr-2" />
                            <span>{tab.label}</span>
                          </Button>
                        );
                      })}
                      
                      {secondaryTabGroups.map((group) => {
                        const filteredGroupItems = group.items.filter(item => 
                          filteredSecondaryTabs.some(tab => tab.value === item.value) &&
                          filteredTabs.some(tab => tab.value === item.value)
                        );
                        
                        if (filteredGroupItems.length === 0) return null;
                        
                        return (
                        <div key={group.label} className="py-1">
                          <div className="px-3 py-1 text-xs font-semibold text-gray-500">
                            {group.label}
                          </div>
                          {filteredGroupItems.map((item) => {
                              const Icon = item.icon;
                              return (
                                <Button
                                  key={item.value}
                                  variant="ghost"
                                  className={cn(
                                    "w-full justify-start text-left py-2 px-3 rounded-md my-1",
                                    item.value === activeTab ? "bg-blue-50 text-blue-600" : ""
                                  )}
                                  onClick={() => {
                                    handleTabNavigation(item.value);
                                    setSearchTerm("");
                                  }}
                                >
                                  <Icon className="h-4 w-4 mr-2" />
                                  <span>{item.label}</span>
                                </Button>
                              );
                          })}
                        </div>
                        );
                      })}
                    </>
                  ) : (
                    <div className="text-center py-4 text-gray-500">No modules found</div>
                  )}
                </div>
              </PopoverContent>
            </Popover>
          </div>
        </div>

        <div className="hidden md:flex md:flex-col md:space-y-4">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="w-full overflow-x-auto hide-scrollbar bg-white border border-gray-100 rounded-xl shadow-sm">
              <Tabs 
                value={activeTab} 
                onValueChange={handleTabNavigation}
                className="w-full"
              >
                <TabsList className="bg-white p-1 rounded-xl w-full justify-start">
                  {filteredPrimaryTabs.map((tab) => {
                    const Icon = tab.icon;
                    return (
                      <TabsTrigger 
                        key={tab.value}
                        value={tab.value}
                        className={cn(
                          "flex items-center gap-2 px-4 py-2 rounded-lg data-[state=active]:bg-blue-50 data-[state=active]:text-blue-600",
                          "transition-all duration-200 flex-shrink-0"
                        )}
                      >
                        <Icon className="h-4 w-4" />
                        <span className="hidden sm:inline">{tab.label}</span>
                      </TabsTrigger>
                    );
                  })}
                </TabsList>
              </Tabs>
            </div>
            
            <div className="flex items-center gap-2">
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" size="sm" className="flex items-center gap-2 border-gray-200 bg-white hover:bg-gray-50 text-gray-700">
                    <Search className="h-4 w-4" />
                    <span className="hidden sm:inline">Search</span>
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-80 p-0" align="end">
                  <div className="p-3 border-b">
                    <Input
                      placeholder="Search modules..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full"
                    />
                  </div>
                  <div className="max-h-[300px] overflow-y-auto p-1">
                    {filteredTabs.length > 0 ? (
                      filteredTabs.map((tab) => {
                        const Icon = tab.icon;
                        return (
                          <Button
                            key={tab.value}
                            variant="ghost"
                            className={cn(
                              "w-full justify-start text-left py-2 px-3 rounded-md my-1",
                              tab.value === activeTab ? "bg-blue-50 text-blue-600" : ""
                            )}
                            onClick={() => {
                              handleTabNavigation(tab.value);
                              setSearchTerm("");
                            }}
                          >
                            <Icon className="h-4 w-4 mr-2" />
                            <span>{tab.label}</span>
                          </Button>
                        );
                      })
                    ) : (
                      <div className="text-center py-4 text-gray-500">No modules found</div>
                    )}
                  </div>
                </PopoverContent>
              </Popover>
              
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="flex items-center gap-2 border-gray-200 bg-white hover:bg-gray-50 text-gray-700">
                    <Menu className="h-4 w-4" />
                    <span className="hidden sm:inline">Modules</span>
                    <ChevronDown className="h-4 w-4 opacity-50" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56 p-1 bg-white border border-gray-200 shadow-lg rounded-lg">
                  {secondaryTabGroups.slice(0, 3).map((group) => {
                    const filteredGroupItems = group.items.filter(item => 
                      filteredSecondaryTabs.some(tab => tab.value === item.value)
                    );
                    
                    if (filteredGroupItems.length === 0) return null;
                    
                    return (
                    <DropdownMenuSub key={group.label}>
                      <DropdownMenuSubTrigger className="py-2 px-3 rounded-md my-1 text-sm hover:bg-gray-50">
                        <span>{group.label}</span>
                      </DropdownMenuSubTrigger>
                      <DropdownMenuPortal>
                        <DropdownMenuSubContent className="min-w-[220px] p-1 bg-white border border-gray-200 shadow-lg rounded-lg">
                          {filteredGroupItems.map((item) => {
                            const Icon = item.icon;
                            const isActive = item.value === activeTab;
                            return (
                              <DropdownMenuItem
                                key={item.value}
                                className={cn(
                                  "py-2 px-3 rounded-md my-1 text-sm cursor-pointer",
                                  isActive ? "bg-blue-50 text-blue-600" : "hover:bg-gray-50"
                                )}
                                onClick={() => handleTabNavigation(item.value)}
                              >
                                <Icon className="h-4 w-4 mr-2" />
                                <span>{item.label}</span>
                              </DropdownMenuItem>
                            );
                          })}
                        </DropdownMenuSubContent>
                      </DropdownMenuPortal>
                    </DropdownMenuSub>
                    );
                  })}
                  
                  {/* Direct Reports menu item without submenu */}
                  {secondaryTabGroups[3]?.items.map((item) => {
                    const Icon = item.icon;
                    const isActive = item.value === activeTab;
                    return (
                      <DropdownMenuItem
                        key={item.value}
                        className={cn(
                          "py-2 px-3 rounded-md my-1 text-sm cursor-pointer",
                          isActive ? "bg-blue-50 text-blue-600" : "hover:bg-gray-50"
                        )}
                        onClick={() => handleTabNavigation(item.value)}
                      >
                        <Icon className="h-4 w-4 mr-2" />
                        <span>{item.label}</span>
                      </DropdownMenuItem>
                    );
                  })}
                </DropdownMenuContent>
              </DropdownMenu>
              
              {!hideQuickAdd && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button 
                      variant="default" 
                      size="sm" 
                      className="bg-blue-600 hover:bg-blue-700"
                    >
                      <Paperclip className="h-4 w-4 mr-2" />
                      <span>Quick Add</span>
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
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => handleQuickAddAction("Upload Document")} className="cursor-pointer">
                      <FileUp className="mr-2 h-4 w-4" />
                      <span>Upload Document</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </div>
          </div>
          
          {activeTabObject && (
            <div className="text-sm font-bold text-gray-600 hidden md:block text-base">
              {activeTabObject.description || `View and manage ${activeTabObject.label.toLowerCase()}`}
            </div>
          )}
        </div>
      </div>
      
      <div className="pb-16 md:pb-0"></div>
    </div>
  );
};

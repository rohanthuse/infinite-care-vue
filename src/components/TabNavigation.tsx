import React, { useState } from "react";
import { 
  LayoutDashboard, Workflow, ListChecks, Users, 
  Calendar, Star, MessageSquare, Pill, DollarSign, 
  FileText, ClipboardCheck, Bell, ClipboardList, 
  FileUp, Folder, UserPlus, BarChart4, Settings, 
  Activity, Briefcase, PanelLeft, Paperclip,
  ChevronDown, Menu, Search, Grid, Plus
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
  { icon: Users, label: "Staff", value: "staff", description: "Staff management" },
  { icon: Star, label: "Reviews", value: "reviews", description: "Client feedback" },
  { icon: MessageSquare, label: "Communication", value: "communication", description: "Messages & emails" },
];

// Group secondary tabs by category for better organization
const secondaryTabGroups = [
  {
    label: "Operations",
    items: [
      { icon: Workflow, label: "Workflow", value: "workflow", description: "Process management" },
      { icon: ListChecks, label: "Key Parameters", value: "parameters", description: "Track metrics" },
      { icon: Pill, label: "Medication", value: "medication", description: "Medicine tracking" },
      { icon: ClipboardList, label: "Care Plan", value: "care-plan", description: "Patient care plans" },
    ]
  },
  {
    label: "Administration",
    items: [
      { icon: DollarSign, label: "Accounting", value: "accounting", description: "Financial management" },
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
    label: "Analytics",
    items: [
      { icon: BarChart4, label: "Reports", value: "reports", description: "Data analysis" },
      { icon: Activity, label: "Performance", value: "performance", description: "Metrics & KPIs" },
      { icon: Briefcase, label: "Services Stats", value: "services-stats", description: "Service analytics" },
    ]
  },
];

// Flatten the secondary tabs for easy access
const secondaryTabs: TabItem[] = secondaryTabGroups.flatMap(group => group.items);

interface TabNavigationProps {
  activeTab: string;
  onChange: (value: string) => void;
}

export const TabNavigation = ({ activeTab, onChange }: TabNavigationProps) => {
  const allTabs = [...primaryTabs, ...secondaryTabs];
  const activeTabObject = allTabs.find(tab => tab.value === activeTab);
  const [searchTerm, setSearchTerm] = useState("");
  
  // Filter tabs based on search term
  const filteredTabs = allTabs.filter(tab => 
    tab.label.toLowerCase().includes(searchTerm.toLowerCase())
  );
  
  return (
    <div className="w-full">
      <div className="flex flex-col space-y-4">
        {/* Desktop Navigation Only */}
        <div className="hidden md:flex md:flex-col md:space-y-4">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            {/* Primary Tab Navigation as a scrollable row */}
            <div className="w-full overflow-x-auto hide-scrollbar bg-white border border-gray-100 rounded-xl shadow-sm">
              <Tabs 
                value={activeTab} 
                onValueChange={onChange}
                className="w-full"
              >
                <TabsList className="bg-white p-1 rounded-xl w-full justify-start">
                  {primaryTabs.map((tab) => {
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
              {/* Quick Search Popover */}
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
                              onChange(tab.value);
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
              
              {/* Category-based Modular Menu */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="flex items-center gap-2 border-gray-200 bg-white hover:bg-gray-50 text-gray-700">
                    <Menu className="h-4 w-4" />
                    <span className="hidden sm:inline">Modules</span>
                    <ChevronDown className="h-4 w-4 opacity-50" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56 p-1 bg-white border border-gray-200 shadow-lg rounded-lg">
                  {secondaryTabGroups.map((group) => (
                    <DropdownMenuSub key={group.label}>
                      <DropdownMenuSubTrigger className="py-2 px-3 rounded-md my-1 text-sm hover:bg-gray-50">
                        <span>{group.label}</span>
                      </DropdownMenuSubTrigger>
                      <DropdownMenuPortal>
                        <DropdownMenuSubContent className="min-w-[220px] p-1 bg-white border border-gray-200 shadow-lg rounded-lg">
                          {group.items.map((item) => {
                            const Icon = item.icon;
                            const isActive = item.value === activeTab;
                            return (
                              <DropdownMenuItem
                                key={item.value}
                                className={cn(
                                  "py-2 px-3 rounded-md my-1 text-sm cursor-pointer",
                                  isActive ? "bg-blue-50 text-blue-600" : "hover:bg-gray-50"
                                )}
                                onClick={() => onChange(item.value)}
                              >
                                <Icon className="h-4 w-4 mr-2" />
                                <span>{item.label}</span>
                              </DropdownMenuItem>
                            );
                          })}
                        </DropdownMenuSubContent>
                      </DropdownMenuPortal>
                    </DropdownMenuSub>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
              
              <Button variant="default" size="sm" className="bg-blue-600 hover:bg-blue-700">
                <Paperclip className="h-4 w-4 mr-2" />
                <span>Quick Add</span>
              </Button>
            </div>
          </div>
          
          {activeTabObject && (
            <div className="text-sm text-gray-500 hidden md:block">
              {activeTabObject.description || `View and manage ${activeTabObject.label.toLowerCase()}`}
            </div>
          )}
        </div>
      </div>
      
      {/* Bottom Navigation for Mobile - Redesigned and cleaner */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 py-2 z-30 md:hidden">
        <div className="flex justify-around items-center">
          {/* Main navigation items */}
          <NavButton 
            icon={LayoutDashboard} 
            label="Dashboard" 
            isActive={activeTab === "dashboard"} 
            onClick={() => onChange("dashboard")} 
          />
          <NavButton 
            icon={Calendar} 
            label="Bookings" 
            isActive={activeTab === "bookings"} 
            onClick={() => onChange("bookings")} 
          />
          <NavButton 
            icon={Users} 
            label="Clients" 
            isActive={activeTab === "clients"} 
            onClick={() => onChange("clients")} 
          />
          <NavButton 
            icon={Users} 
            label="Staff" 
            isActive={activeTab === "staff"} 
            onClick={() => onChange("staff")} 
          />
          <NavButton 
            icon={Star} 
            label="Reviews" 
            isActive={activeTab === "reviews"} 
            onClick={() => onChange("reviews")} 
          />
          
          {/* More menu with all other items */}
          <Popover>
            <PopoverTrigger asChild>
              <button className={cn(
                "flex flex-col items-center justify-center w-16",
                activeTab !== "dashboard" && 
                !["dashboard", "bookings", "clients", "staff", "reviews"].includes(activeTab)
                  ? "text-blue-600" 
                  : "text-gray-500"
              )}>
                <Grid className="h-5 w-5 mb-0.5" />
                <span className="text-xs">More</span>
              </button>
            </PopoverTrigger>
            <PopoverContent 
              className="w-64 p-0 mb-1" 
              align="end" 
              side="top"
              sideOffset={12}
            >
              <div className="p-2 border-b">
                <Input
                  placeholder="Search modules..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="mb-0"
                />
              </div>
              
              <div className="max-h-[60vh] overflow-y-auto p-2">
                {filteredTabs.length > 0 ? (
                  <div className="grid grid-cols-2 gap-1">
                    {filteredTabs.map((tab) => {
                      const Icon = tab.icon;
                      return (
                        <Button
                          key={tab.value}
                          variant="ghost"
                          size="sm"
                          className={cn(
                            "h-auto py-2 justify-start rounded-md",
                            tab.value === activeTab ? "bg-blue-50 text-blue-600" : ""
                          )}
                          onClick={() => {
                            onChange(tab.value);
                            setSearchTerm("");
                          }}
                        >
                          <Icon className="h-4 w-4 mr-2 flex-shrink-0" />
                          <span className="text-xs truncate">{tab.label}</span>
                        </Button>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-4 text-gray-500">No modules found</div>
                )}
              </div>
            </PopoverContent>
          </Popover>
        </div>
      </div>
      
      {/* Add spacing at the bottom for mobile to prevent content from being hidden by the bottom bar */}
      <div className="pb-16 md:pb-0"></div>
    </div>
  );
};

// New component for mobile bottom nav buttons
const NavButton = ({ 
  icon: Icon, 
  label, 
  isActive, 
  onClick 
}: { 
  icon: React.ComponentType<any>; 
  label: string; 
  isActive: boolean; 
  onClick: () => void;
}) => (
  <button
    className={cn(
      "flex flex-col items-center justify-center w-16",
      isActive ? "text-blue-600" : "text-gray-500"
    )}
    onClick={onClick}
  >
    <Icon className="h-5 w-5 mb-0.5" />
    <span className="text-xs">{label}</span>
  </button>
);

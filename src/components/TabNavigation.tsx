
import React from "react";
import { 
  LayoutDashboard, Workflow, ListChecks, Users, 
  Calendar, Star, MessageSquare, Pill, DollarSign, 
  FileText, ClipboardCheck, Bell, ClipboardList, 
  FileUp, Folder, UserPlus, BarChart4, Settings, 
  Activity, Briefcase, PanelLeft, Paperclip,
  ChevronDown, Menu
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
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";

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
];

// Secondary tabs that will appear in the top navbar for medium and larger screens
const secondaryTopTabs: TabItem[] = [
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
  const allTabs = [...primaryTabs, ...secondaryTopTabs, ...secondaryTabs];
  const activeTabObject = allTabs.find(tab => tab.value === activeTab);
  
  return (
    <div className="w-full">
      <div className="flex flex-col space-y-4">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          {/* Primary Tab Navigation */}
          <Tabs 
            value={activeTab} 
            onValueChange={onChange}
            className="w-full overflow-x-auto hide-scrollbar"
          >
            <TabsList className="bg-white border border-gray-100 p-1 rounded-xl shadow-sm w-full justify-start">
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
              
              {/* Secondary Top Tabs (hidden on small screens) */}
              {secondaryTopTabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <TabsTrigger 
                    key={tab.value}
                    value={tab.value}
                    className={cn(
                      "flex items-center gap-2 px-4 py-2 rounded-lg data-[state=active]:bg-blue-50 data-[state=active]:text-blue-600",
                      "transition-all duration-200 flex-shrink-0 hidden md:flex"
                    )}
                  >
                    <Icon className="h-4 w-4" />
                    <span className="hidden sm:inline">{tab.label}</span>
                  </TabsTrigger>
                );
              })}
            </TabsList>
          </Tabs>
          
          <div className="flex items-center gap-2">
            {/* Improved More Actions Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="flex items-center gap-2 border-gray-200 bg-white hover:bg-gray-50 text-gray-700">
                  <Menu className="h-4 w-4" />
                  <span>Menu</span>
                  <ChevronDown className="h-4 w-4 opacity-50" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56 p-2 bg-white border border-gray-200 shadow-lg rounded-lg">
                {secondaryTabGroups.map((group) => (
                  <React.Fragment key={group.label}>
                    <DropdownMenuLabel className="font-bold text-gray-700 px-3 py-2">{group.label}</DropdownMenuLabel>
                    <DropdownMenuGroup className="mb-2">
                      {group.items.map((tab) => {
                        const Icon = tab.icon;
                        const isActive = tab.value === activeTab;
                        return (
                          <DropdownMenuItem 
                            key={tab.value}
                            className={cn(
                              "cursor-pointer py-2 px-3 rounded-md my-1 text-sm",
                              isActive ? "bg-blue-50 text-blue-600" : "hover:bg-gray-50"
                            )}
                            onClick={() => onChange(tab.value)}
                          >
                            <Icon className="mr-2 h-4 w-4" />
                            <span>{tab.label}</span>
                          </DropdownMenuItem>
                        );
                      })}
                    </DropdownMenuGroup>
                    <DropdownMenuSeparator className="my-1 bg-gray-100" />
                  </React.Fragment>
                ))}
                <DropdownMenuItem className="cursor-pointer py-2 px-3 rounded-md my-1 text-sm hover:bg-gray-50">
                  <Settings className="mr-2 h-4 w-4" />
                  <span>Customize Menu</span>
                </DropdownMenuItem>
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
  );
};

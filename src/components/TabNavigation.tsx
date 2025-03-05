
import React from "react";
import { 
  LayoutDashboard, Workflow, ListChecks, Users, 
  Calendar, Star, MessageSquare, Pill, DollarSign, 
  FileText, ClipboardCheck, Bell, ClipboardList, 
  FileUp, Folder, UserPlus, BarChart4, Settings
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";

interface TabItem {
  icon: React.ElementType;
  label: string;
  value: string;
}

const primaryTabs: TabItem[] = [
  { icon: LayoutDashboard, label: "Dashboard", value: "dashboard" },
  { icon: Calendar, label: "Bookings", value: "bookings" },
  { icon: Users, label: "Clients", value: "clients" },
  { icon: Users, label: "Staff", value: "staff" },
  { icon: Star, label: "Reviews", value: "reviews" },
  { icon: MessageSquare, label: "Communication", value: "communication" },
];

const secondaryTabs: TabItem[] = [
  { icon: Workflow, label: "Workflow", value: "workflow" },
  { icon: ListChecks, label: "Key Parameters", value: "parameters" },
  { icon: Pill, label: "Medication", value: "medication" },
  { icon: DollarSign, label: "Accounting", value: "accounting" },
  { icon: ClipboardList, label: "Care Plan", value: "care-plan" },
  { icon: FileText, label: "Agreements", value: "agreements" },
  { icon: Bell, label: "Events & Logs", value: "events-logs" },
  { icon: ClipboardCheck, label: "Attendance", value: "attendance" },
  { icon: FileUp, label: "Form Builder", value: "form-builder" },
  { icon: Folder, label: "Documents", value: "documents" },
  { icon: Bell, label: "Notifications", value: "notifications" },
  { icon: Folder, label: "Library", value: "library" },
  { icon: UserPlus, label: "Third Party Access", value: "third-party" },
  { icon: BarChart4, label: "Reports", value: "reports" },
  { icon: Settings, label: "Settings", value: "settings" },
];

interface TabNavigationProps {
  activeTab: string;
  onChange: (value: string) => void;
}

export const TabNavigation = ({ activeTab, onChange }: TabNavigationProps) => {
  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-6">
        <Tabs 
          value={activeTab} 
          onValueChange={onChange}
          className="w-full overflow-x-auto hide-scrollbar"
        >
          <TabsList className="bg-white border border-gray-100 p-1 rounded-xl shadow-sm">
            {primaryTabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <TabsTrigger 
                  key={tab.value}
                  value={tab.value}
                  className={cn(
                    "flex items-center gap-2 px-4 py-2 rounded-lg data-[state=active]:bg-blue-50 data-[state=active]:text-blue-600",
                    "transition-all duration-200"
                  )}
                >
                  <Icon className="h-4 w-4" />
                  <span className="hidden sm:inline">{tab.label}</span>
                </TabsTrigger>
              );
            })}
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="ml-2 px-2">
                  <span className="sr-only">More tabs</span>
                  <span className="flex items-center">
                    More
                    <svg className="ml-1 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                {secondaryTabs.map((tab) => {
                  const Icon = tab.icon;
                  return (
                    <DropdownMenuItem 
                      key={tab.value}
                      className="cursor-pointer"
                      onClick={() => onChange(tab.value)}
                    >
                      <Icon className="mr-2 h-4 w-4" />
                      <span>{tab.label}</span>
                    </DropdownMenuItem>
                  );
                })}
                <DropdownMenuSeparator />
                <DropdownMenuItem>
                  <Settings className="mr-2 h-4 w-4" />
                  <span>Customize Menu</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </TabsList>
        </Tabs>
      </div>
    </div>
  );
};

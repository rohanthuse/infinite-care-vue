
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { 
  LayoutDashboard, ListChecks, Users, 
  Calendar, Star, MessageSquare, Pill, DollarSign, 
  FileText, ClipboardCheck, Bell, ClipboardList, 
  FileUp, Folder, UserPlus, BarChart4, Settings,
  Activity, Briefcase, Search, Command, X
} from "lucide-react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { 
  Command as CommandPrimitive,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList
} from "@/components/ui/command";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface Module {
  icon: React.ElementType;
  label: string;
  value: string;
  description?: string;
}

interface ModuleGroup {
  label: string;
  items: Module[];
}

const primaryModules: Module[] = [
  { icon: LayoutDashboard, label: "Dashboard", value: "dashboard", description: "Branch overview" },
  { icon: Calendar, label: "Bookings", value: "bookings", description: "Manage appointments" },
  { icon: Users, label: "Clients", value: "clients", description: "Client information" },
  { icon: Users, label: "Carers", value: "carers", description: "Carer management" },
  { icon: Star, label: "Reviews", value: "reviews", description: "Client feedback" },
  { icon: MessageSquare, label: "Communication", value: "communication", description: "Messages & emails" },
];

const moduleGroups: ModuleGroup[] = [
  {
    label: "Operations",
    items: [
      { icon: ListChecks, label: "Key Parameters", value: "key-parameters", description: "Track metrics" },
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

// Flatten groups for search
const allModules = [...primaryModules, ...moduleGroups.flatMap(group => group.items)];

interface ModuleNavigationProps {
  activeModule: string;
  onModuleChange: (value: string) => void;
}

export function ModuleNavigation({ activeModule, onModuleChange }: ModuleNavigationProps) {
  const navigate = useNavigate();
  const [commandOpen, setCommandOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  
  const activeModuleObj = allModules.find(module => module.value === activeModule);
  
  // Handle keyboard shortcut to open command menu
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setCommandOpen(prev => !prev);
      }
    };
    
    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);
  
  return (
    <div className="w-full">
      <div className="flex flex-col space-y-4">
        {/* Primary module tabs - visible on all screen sizes */}
        <div className="w-full overflow-x-auto hide-scrollbar bg-white border border-gray-100 rounded-xl shadow-sm">
          <div className="grid grid-cols-3 md:flex md:items-center overflow-x-auto p-1">
            {primaryModules.map((module) => {
              const Icon = module.icon;
              const isActive = module.value === activeModule;
              
              return (
                <Button
                  key={module.value}
                  variant="ghost"
                  className={cn(
                    "flex items-center gap-2 px-3 py-2 md:px-4 rounded-lg transition-all duration-200",
                    isActive ? "bg-blue-50 text-blue-600" : "text-gray-700 hover:bg-gray-50"
                  )}
                  onClick={() => onModuleChange(module.value)}
                >
                  <Icon className="h-4 w-4" />
                  <span className="hidden md:inline">{module.label}</span>
                </Button>
              );
            })}
            
            {/* Command menu button */}
            <Button
              variant="outline"
              className="ml-auto text-gray-600 hidden md:flex"
              onClick={() => setCommandOpen(true)}
            >
              <Search className="h-4 w-4 mr-2" />
              <span>Search modules</span>
              <kbd className="ml-2 bg-gray-100 text-gray-500 py-0.5 px-1.5 text-xs rounded">⌘K</kbd>
            </Button>
          </div>
        </div>
        
        {/* Mobile all modules button */}
        <div className="md:hidden">
          <Button
            variant="outline"
            className="w-full justify-between border-gray-200"
            onClick={() => setCommandOpen(true)}
          >
            <div className="flex items-center">
              <Search className="h-4 w-4 mr-2" />
              <span>Search all modules</span>
            </div>
            <kbd className="bg-gray-100 text-gray-500 py-0.5 px-1.5 text-xs rounded">⌘K</kbd>
          </Button>
        </div>
        
        {/* Module description */}
        {activeModuleObj && (
          <div className="text-sm font-medium text-gray-600 hidden md:block">
            {activeModuleObj.description || `View and manage ${activeModuleObj.label.toLowerCase()}`}
          </div>
        )}
        
        {/* Command menu dialog */}
        <Dialog open={commandOpen} onOpenChange={setCommandOpen}>
          <DialogContent className="p-0 gap-0 max-w-2xl">
            <button
              className="absolute top-4 right-4 text-gray-500 hover:text-gray-700"
              onClick={() => setCommandOpen(false)}
            >
              <X className="h-4 w-4" />
            </button>
            
            <CommandPrimitive className="rounded-lg">
              <CommandInput 
                placeholder="Search modules..." 
                className="h-14"
                value={searchTerm}
                onValueChange={setSearchTerm}
              />
              
              <CommandList className="max-h-[500px] overflow-y-auto py-2">
                <CommandEmpty>No modules found.</CommandEmpty>
                
                <CommandGroup heading="Main">
                  {primaryModules
                    .filter(module => module.label.toLowerCase().includes(searchTerm.toLowerCase()))
                    .map((module) => {
                      const Icon = module.icon;
                      return (
                        <CommandItem
                          key={module.value}
                          onSelect={() => {
                            onModuleChange(module.value);
                            setCommandOpen(false);
                          }}
                          className={cn(
                            "py-2 px-4",
                            module.value === activeModule ? "bg-blue-50 text-blue-600" : ""
                          )}
                        >
                          <Icon className="h-5 w-5 mr-3" />
                          <div className="flex flex-col text-left">
                            <span>{module.label}</span>
                            {module.description && (
                              <span className="text-xs text-gray-500">{module.description}</span>
                            )}
                          </div>
                          {module.value === activeModule && (
                            <Badge className="ml-auto bg-blue-100 text-blue-700 hover:bg-blue-200">
                              Active
                            </Badge>
                          )}
                        </CommandItem>
                      );
                    })}
                </CommandGroup>
                
                {moduleGroups
                  .filter(group => 
                    group.items.some(item => 
                      item.label.toLowerCase().includes(searchTerm.toLowerCase())
                    )
                  )
                  .map((group) => (
                    <CommandGroup key={group.label} heading={group.label}>
                      {group.items
                        .filter(module => 
                          module.label.toLowerCase().includes(searchTerm.toLowerCase())
                        )
                        .map((module) => {
                          const Icon = module.icon;
                          return (
                            <CommandItem
                              key={module.value}
                              onSelect={() => {
                                onModuleChange(module.value);
                                setCommandOpen(false);
                              }}
                              className={cn(
                                "py-2 px-4",
                                module.value === activeModule ? "bg-blue-50 text-blue-600" : ""
                              )}
                            >
                              <Icon className="h-5 w-5 mr-3" />
                              <div className="flex flex-col text-left">
                                <span>{module.label}</span>
                                {module.description && (
                                  <span className="text-xs text-gray-500">{module.description}</span>
                                )}
                              </div>
                              {module.value === activeModule && (
                                <Badge className="ml-auto bg-blue-100 text-blue-700 hover:bg-blue-200">
                                  Active
                                </Badge>
                              )}
                            </CommandItem>
                          );
                        })}
                    </CommandGroup>
                  ))}
              </CommandList>
            </CommandPrimitive>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}

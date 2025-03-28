
import { Home, Settings, FileText, ChevronDown, ListChecks, Users, Calendar, Star, MessageSquare, Pill, DollarSign, ClipboardCheck, Bell, ClipboardList, FileUp, Folder, UserPlus, BarChart4, Brain, Heart, Activity, Briefcase, Stethoscope, Building2, ActivitySquare } from "lucide-react";
import { cn } from "@/lib/utils";
import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

interface SidebarItemProps {
  icon: React.ElementType;
  label: string;
  active?: boolean;
  hasSubmenu?: boolean;
  expanded?: boolean;
  onClick?: () => void;
  onExpand?: () => void;
  path?: string;
}

const SidebarItem = ({ 
  icon: Icon, 
  label, 
  active, 
  hasSubmenu, 
  expanded, 
  onClick, 
  onExpand,
  path 
}: SidebarItemProps) => {
  return (
    <div className="mb-1">
      <div 
        className={cn(
          "flex items-center px-3 py-2 cursor-pointer rounded-md transition-colors",
          active ? "bg-blue-50 text-blue-600" : "hover:bg-gray-50"
        )}
        onClick={onClick}
      >
        <Icon className={cn("h-5 w-5 mr-3", active ? "text-blue-600" : "text-gray-600")} />
        <span className={cn("text-sm flex-1", active ? "font-medium text-blue-600" : "text-gray-700")}>{label}</span>
        {hasSubmenu && (
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-6 w-6 p-0.5 text-gray-500 hover:bg-gray-100 hover:text-gray-700"
            onClick={(e) => {
              e.stopPropagation();
              onExpand?.();
            }}
          >
            <ChevronDown className={cn("h-4 w-4 transition-transform", expanded ? "transform rotate-180" : "")} />
          </Button>
        )}
      </div>
    </div>
  );
};

const ModuleGroup = ({ 
  title, 
  items, 
  activeItem, 
  onItemClick,
  expandedItems,
  onExpandItem 
}: { 
  title: string; 
  items: { icon: React.ElementType; label: string; path: string; items?: { label: string; path: string }[] }[];
  activeItem: string;
  onItemClick: (path: string) => void;
  expandedItems: string[];
  onExpandItem: (label: string) => void;
}) => {
  return (
    <div className="mb-4">
      <div className="px-3 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">
        {title}
      </div>
      <div className="space-y-1">
        {items.map((item) => {
          const isActive = activeItem === item.path;
          const hasSubmenu = item.items && item.items.length > 0;
          const isExpanded = expandedItems.includes(item.label);
          
          return (
            <div key={item.label}>
              {hasSubmenu ? (
                <Collapsible open={isExpanded} onOpenChange={() => onExpandItem(item.label)}>
                  <CollapsibleTrigger className="w-full text-left">
                    <SidebarItem 
                      icon={item.icon} 
                      label={item.label}
                      active={isActive} 
                      hasSubmenu={hasSubmenu}
                      expanded={isExpanded}
                      onClick={() => onItemClick(item.path)}
                    />
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <div className="ml-8 mt-1 border-l-2 border-gray-100 pl-2 space-y-1">
                      {item.items?.map((subItem) => (
                        <div 
                          key={subItem.label}
                          className={cn(
                            "px-3 py-1.5 text-sm rounded-md cursor-pointer transition-colors",
                            activeItem === subItem.path ? "bg-blue-50 text-blue-600 font-medium" : "text-gray-600 hover:bg-gray-50"
                          )}
                          onClick={() => onItemClick(subItem.path)}
                        >
                          {subItem.label}
                        </div>
                      ))}
                    </div>
                  </CollapsibleContent>
                </Collapsible>
              ) : (
                <SidebarItem 
                  icon={item.icon} 
                  label={item.label} 
                  active={isActive}
                  onClick={() => onItemClick(item.path)}
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export function DashboardSidebar() {
  const navigate = useNavigate();
  const location = useLocation();
  const [expandedItems, setExpandedItems] = useState<string[]>([]);
  
  const handleItemClick = (path: string) => {
    navigate(path);
  };
  
  const toggleExpand = (label: string) => {
    setExpandedItems(prev => 
      prev.includes(label) 
        ? prev.filter(item => item !== label)
        : [...prev, label]
    );
  };
  
  const mainItems = [
    { icon: Home, label: "Home", path: "/dashboard" },
    { icon: Calendar, label: "Bookings", path: "/bookings" },
    { icon: Users, label: "Clients", path: "/clients" },
    { icon: Users, label: "Carers", path: "/carers" },
    { icon: Star, label: "Reviews", path: "/reviews" },
    { icon: MessageSquare, label: "Communication", path: "/communication" },
  ];
  
  const keyParametersItems = [
    { icon: ListChecks, label: "Key Parameters", path: "/key-parameters", items: [
      { label: "Services", path: "/services" },
      { label: "Hobbies", path: "/hobbies" },
      { label: "Skills", path: "/skills" },
      { label: "Medical & Mental", path: "/medical-mental" },
      { label: "Type of Work", path: "/type-of-work" },
      { label: "Body Map Injuries", path: "/body-map-points" },
      { label: "Branch", path: "/branch" },
      { label: "Branch Admin", path: "/branch-admins" }
    ]},
  ];
  
  const operationalItems = [
    { icon: Pill, label: "Medication", path: "/medication" },
    { icon: ClipboardList, label: "Care Plan", path: "/care-plan" },
    { icon: DollarSign, label: "Accounting", path: "/accounting" },
    { icon: FileText, label: "Agreements", path: "/agreements" },
    { icon: Bell, label: "Events & Logs", path: "/events-logs" },
    { icon: ClipboardCheck, label: "Attendance", path: "/attendance" },
  ];
  
  const resourceItems = [
    { icon: FileUp, label: "Form Builder", path: "/form-builder" },
    { icon: Folder, label: "Documents", path: "/documents" },
    { icon: Bell, label: "Notifications", path: "/notifications" },
    { icon: Folder, label: "Library", path: "/library" },
    { icon: UserPlus, label: "Third Party Access", path: "/third-party" },
  ];
  
  const analyticsItems = [
    { icon: BarChart4, label: "Reports", path: "/reports" },
    { icon: Activity, label: "Performance", path: "/performance" },
    { icon: Briefcase, label: "Services Stats", path: "/services-stats" },
  ];
  
  const settingsItems = [
    { icon: Settings, label: "Settings", path: "/settings" },
  ];
  
  return (
    <div className="w-64 border-r border-gray-200 h-screen bg-white overflow-y-auto">
      <div className="p-4 border-b border-gray-200">
        <h2 className="text-lg font-bold text-blue-600">Med-Infinite</h2>
      </div>
      
      <div className="py-2 px-2">
        <ModuleGroup 
          title="Main" 
          items={mainItems} 
          activeItem={location.pathname}
          onItemClick={handleItemClick}
          expandedItems={expandedItems}
          onExpandItem={toggleExpand}
        />
        
        <ModuleGroup 
          title="Parameters" 
          items={keyParametersItems} 
          activeItem={location.pathname}
          onItemClick={handleItemClick}
          expandedItems={expandedItems}
          onExpandItem={toggleExpand}
        />
        
        <ModuleGroup 
          title="Operations" 
          items={operationalItems} 
          activeItem={location.pathname}
          onItemClick={handleItemClick}
          expandedItems={expandedItems}
          onExpandItem={toggleExpand}
        />
        
        <ModuleGroup 
          title="Resources" 
          items={resourceItems} 
          activeItem={location.pathname}
          onItemClick={handleItemClick}
          expandedItems={expandedItems}
          onExpandItem={toggleExpand}
        />
        
        <ModuleGroup 
          title="Analytics" 
          items={analyticsItems} 
          activeItem={location.pathname}
          onItemClick={handleItemClick}
          expandedItems={expandedItems}
          onExpandItem={toggleExpand}
        />
        
        <ModuleGroup 
          title="Settings" 
          items={settingsItems} 
          activeItem={location.pathname}
          onItemClick={handleItemClick}
          expandedItems={expandedItems}
          onExpandItem={toggleExpand}
        />
      </div>
    </div>
  );
}

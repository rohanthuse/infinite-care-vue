
import { Home, Settings, FileText, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

interface SidebarItemProps {
  icon: React.ElementType;
  label: string;
  active?: boolean;
  hasSubmenu?: boolean;
  onClick?: () => void;
}

const SidebarItem = ({ icon: Icon, label, active, hasSubmenu, onClick }: SidebarItemProps) => {
  return (
    <div 
      className={cn(
        "flex items-center px-4 py-3 cursor-pointer hover:bg-blue-50 transition-colors",
        active && "bg-blue-50 border-l-4 border-blue-600"
      )}
      onClick={onClick}
    >
      <Icon className="h-5 w-5 mr-3 text-gray-600" />
      <span className="text-gray-700 flex-1">{label}</span>
      {hasSubmenu && <ChevronDown className="h-4 w-4 text-gray-500" />}
    </div>
  );
};

export function DashboardSidebar() {
  return (
    <div className="w-64 border-r border-gray-200 h-screen bg-white">
      <div className="p-4 border-b border-gray-200">
        <h2 className="text-lg font-bold text-blue-600">Med-Infinite</h2>
      </div>
      <div className="py-2">
        <SidebarItem icon={Home} label="Home" active />
        <SidebarItem icon={FileText} label="Key Parameters" hasSubmenu />
        <SidebarItem icon={Settings} label="Settings" />
        <SidebarItem icon={FileText} label="Agreement" />
      </div>
    </div>
  );
}

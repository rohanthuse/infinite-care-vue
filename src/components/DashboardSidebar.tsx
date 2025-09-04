
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
        "flex items-center px-4 py-3 cursor-pointer hover:bg-accent transition-colors",
        active && "bg-accent border-l-4 border-primary"
      )}
      onClick={onClick}
    >
      <Icon className="h-5 w-5 mr-3 text-muted-foreground" />
      <span className="text-card-foreground flex-1">{label}</span>
      {hasSubmenu && <ChevronDown className="h-4 w-4 text-muted-foreground" />}
    </div>
  );
};

export function DashboardSidebar() {
  return (
    <div className="w-64 border-r border-border h-screen bg-card">
      <div className="p-4 border-b border-border">
        <div className="flex items-center space-x-2">
          <img src="/lovable-uploads/3c8cdaf9-5267-424f-af69-9a1ce56b7ec5.png" alt="Med-Infinite Logo" className="h-6 w-6" />
          <div className="flex flex-col">
            <h2 className="text-sm font-bold text-primary">MED-INFINITE</h2>
            <span className="text-xs text-muted-foreground -mt-0.5">ENDLESS CARE</span>
          </div>
        </div>
      </div>
      <div className="py-2">
        <SidebarItem icon={Home} label="Home" active />
        <SidebarItem icon={FileText} label="Core Settings" hasSubmenu />
        <SidebarItem icon={Settings} label="Settings" />
        <SidebarItem icon={FileText} label="Agreement" />
      </div>
    </div>
  );
}

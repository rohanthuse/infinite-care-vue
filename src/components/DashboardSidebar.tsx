
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
        "flex items-center px-4 py-3 cursor-pointer transition-all duration-200",
        active 
          ? "bg-gradient-to-r from-primary/15 to-transparent border-l-4 border-primary shadow-sm" 
          : "hover:bg-gradient-to-r hover:from-accent hover:to-transparent hover:border-l-2 hover:border-primary/30"
      )}
      onClick={onClick}
    >
      <div className={cn(
        "p-1.5 rounded-md mr-3 transition-colors",
        active ? "bg-primary/20" : "bg-muted/50"
      )}>
        <Icon className={cn("h-4 w-4", active ? "text-primary" : "text-muted-foreground")} />
      </div>
      <span className={cn("flex-1", active ? "text-primary font-medium" : "text-card-foreground")}>{label}</span>
      {hasSubmenu && <ChevronDown className="h-4 w-4 text-muted-foreground" />}
    </div>
  );
};

export function DashboardSidebar() {
  return (
    <div className="w-64 border-r border-border h-screen bg-gradient-to-b from-card via-card to-blue-50/20 dark:to-blue-950/10">
      <div className="p-4 border-b border-border bg-gradient-to-r from-primary/5 to-transparent">
        <div className="flex items-center space-x-2">
          <div className="p-1.5 rounded-lg bg-primary/10">
            <img src="/lovable-uploads/3c8cdaf9-5267-424f-af69-9a1ce56b7ec5.png" alt="Med-Infinite Logo" className="h-6 w-6" />
          </div>
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

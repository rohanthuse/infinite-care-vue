
import { Home, Settings, FileText } from "lucide-react";
import { cn } from "@/lib/utils";
import { useState } from "react";

interface NavItemProps {
  icon: React.ElementType;
  label: string;
  active?: boolean;
  onClick?: () => void;
}

const NavItem = ({ icon: Icon, label, active, onClick }: NavItemProps) => {
  return (
    <div 
      className={cn(
        "flex items-center px-6 py-3 cursor-pointer transition-colors text-gray-700 font-medium",
        active 
          ? "border-b-2 border-med-500 text-med-700 bg-med-50" 
          : "hover:bg-gray-50 hover:text-med-600"
      )}
      onClick={onClick}
    >
      <Icon className={cn("h-5 w-5 mr-3", active ? "text-med-600" : "text-gray-600")} />
      <span>{label}</span>
    </div>
  );
};

export function DashboardNavbar() {
  const [activeItem, setActiveItem] = useState("Home");
  
  const handleNavClick = (label: string) => {
    setActiveItem(label);
  };

  return (
    <nav className="bg-white border-b border-gray-200 shadow-sm">
      <div className="flex items-center">
        <NavItem 
          icon={Home} 
          label="Home" 
          active={activeItem === "Home"} 
          onClick={() => handleNavClick("Home")}
        />
        <NavItem 
          icon={FileText} 
          label="Key Parameters" 
          active={activeItem === "Key Parameters"} 
          onClick={() => handleNavClick("Key Parameters")}
        />
        <NavItem 
          icon={Settings} 
          label="Settings" 
          active={activeItem === "Settings"} 
          onClick={() => handleNavClick("Settings")}
        />
        <NavItem 
          icon={FileText} 
          label="Agreement" 
          active={activeItem === "Agreement"} 
          onClick={() => handleNavClick("Agreement")}
        />
      </div>
    </nav>
  );
}

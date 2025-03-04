
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
        "flex items-center px-4 py-3 cursor-pointer hover:bg-blue-50 transition-colors",
        active && "border-b-2 border-blue-600 bg-blue-50"
      )}
      onClick={onClick}
    >
      <Icon className="h-5 w-5 mr-3 text-gray-600" />
      <span className="text-gray-700">{label}</span>
    </div>
  );
};

export function DashboardNavbar() {
  const [activeItem, setActiveItem] = useState("Home");
  
  const handleNavClick = (label: string) => {
    setActiveItem(label);
  };

  return (
    <nav className="bg-white border-b border-gray-200 px-6">
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

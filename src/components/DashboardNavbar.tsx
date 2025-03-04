
import { ChevronDown, ChevronUp, FileText, Home, ListChecks, Settings } from "lucide-react";
import { cn } from "@/lib/utils";
import { useState } from "react";

interface NavItemProps {
  icon: React.ElementType;
  label: string;
  active?: boolean;
  onClick?: () => void;
  hasSubmenu?: boolean;
  isSubmenuOpen?: boolean;
}

const NavItem = ({ 
  icon: Icon, 
  label, 
  active, 
  onClick, 
  hasSubmenu, 
  isSubmenuOpen 
}: NavItemProps) => {
  return (
    <div 
      className={cn(
        "flex items-center px-6 py-3 cursor-pointer transition-colors font-medium",
        active 
          ? "border-b-2 border-med-500 text-med-700 bg-med-50" 
          : "hover:bg-gray-100 hover:text-med-600 text-gray-800"
      )}
      onClick={onClick}
    >
      <Icon className={cn("h-5 w-5 mr-3", active ? "text-med-600" : "text-gray-700")} />
      <span className="font-semibold">{label}</span>
      {hasSubmenu && (
        isSubmenuOpen ? (
          <ChevronUp className="ml-2 h-4 w-4 text-gray-700" />
        ) : (
          <ChevronDown className="ml-2 h-4 w-4 text-gray-700" />
        )
      )}
    </div>
  );
};

interface SubMenuItemProps {
  label: string;
  active?: boolean;
  onClick?: () => void;
}

const SubMenuItem = ({ label, active, onClick }: SubMenuItemProps) => {
  return (
    <div
      className={cn(
        "px-14 py-2 cursor-pointer transition-colors font-medium text-sm",
        active
          ? "bg-med-50 text-med-700"
          : "hover:bg-gray-100 hover:text-med-600 text-gray-700"
      )}
      onClick={onClick}
    >
      {label}
    </div>
  );
};

export function DashboardNavbar() {
  const [activeItem, setActiveItem] = useState("Home");
  const [activeSubItem, setActiveSubItem] = useState("");
  const [isSubmenuOpen, setIsSubmenuOpen] = useState(false);
  
  const handleNavClick = (label: string) => {
    if (label === "Key Parameters") {
      setIsSubmenuOpen(!isSubmenuOpen);
    } else {
      setActiveItem(label);
      setIsSubmenuOpen(false);
    }
  };

  const handleSubMenuClick = (label: string) => {
    setActiveSubItem(label);
    setActiveItem("Key Parameters");
  };

  const keyParametersSubmenu = [
    "Services",
    "Hobbies",
    "Skills",
    "Medical & Mental",
    "Type of Work",
    "Body Map Injuries",
    "Branch",
    "Branch Admin"
  ];

  return (
    <div>
      <nav className="bg-white border-b border-gray-200 shadow-sm">
        <div className="flex items-center">
          <NavItem 
            icon={Home} 
            label="Home" 
            active={activeItem === "Home"} 
            onClick={() => handleNavClick("Home")}
          />
          <NavItem 
            icon={ListChecks} 
            label="Key Parameters" 
            active={activeItem === "Key Parameters" || activeSubItem !== ""} 
            onClick={() => handleNavClick("Key Parameters")}
            hasSubmenu={true}
            isSubmenuOpen={isSubmenuOpen}
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
      
      {isSubmenuOpen && (
        <div className="bg-white border-b border-gray-200 shadow-sm animate-fade-in">
          {keyParametersSubmenu.map((item) => (
            <SubMenuItem 
              key={item}
              label={item}
              active={activeSubItem === item}
              onClick={() => handleSubMenuClick(item)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

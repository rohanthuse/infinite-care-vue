
import { ChevronDown, ChevronUp, FileText, Home, ListChecks, Settings, Search, PanelLeft } from "lucide-react";
import { cn } from "@/lib/utils";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";

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
        "flex items-center px-4 py-2 cursor-pointer rounded-full transition-all duration-200 font-medium text-sm",
        active 
          ? "text-blue-600 bg-blue-50/80" 
          : "hover:bg-gray-50/80 hover:text-blue-600 text-gray-700"
      )}
      onClick={onClick}
    >
      <Icon className={cn("h-4 w-4 mr-2", active ? "text-blue-600" : "text-gray-600")} />
      <span>{label}</span>
      {hasSubmenu && (
        isSubmenuOpen ? (
          <ChevronUp className="ml-1.5 h-3.5 w-3.5 text-gray-600" />
        ) : (
          <ChevronDown className="ml-1.5 h-3.5 w-3.5 text-gray-600" />
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
    <motion.div
      initial={{ opacity: 0, y: -5 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.15 }}
      className={cn(
        "px-4 py-1.5 cursor-pointer transition-all duration-200 text-xs rounded-full mx-1",
        active
          ? "bg-blue-50/80 text-blue-600"
          : "hover:bg-gray-50/80 hover:text-blue-600 text-gray-600"
      )}
      onClick={onClick}
    >
      {label}
    </motion.div>
  );
};

export function DashboardNavbar() {
  const [activeItem, setActiveItem] = useState("Home");
  const [activeSubItem, setActiveSubItem] = useState("");
  const [isSubmenuOpen, setIsSubmenuOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  
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
    <div className="sticky top-[3.5rem] z-10">
      <div className="bg-white/95 backdrop-blur-xl border-b border-gray-100/30 shadow-sm">
        <div className="container mx-auto px-4 md:px-6 flex items-center justify-between">
          <div className="flex items-center overflow-x-auto scrollbar-hide py-2 gap-1">
            <Button 
              variant="ghost" 
              size="icon" 
              className="md:hidden text-gray-700 hover:bg-gray-50/80 rounded-full mr-1"
              onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
            >
              <PanelLeft className="h-4 w-4" />
            </Button>
            
            <div className="hidden md:flex mr-2 px-2 py-1 bg-gray-100/70 rounded-md text-xs text-gray-500 font-medium">
              Dashboard
            </div>
            
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
          
          <div className="hidden md:flex items-center">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
              <input 
                type="text" 
                placeholder="Search..." 
                className="h-8 rounded-full bg-gray-50 border border-gray-200/50 pl-9 pr-4 text-xs focus:outline-none focus:ring-1 focus:ring-blue-400 w-48"
              />
            </div>
          </div>
        </div>
      </div>
      
      <AnimatePresence>
        {isSubmenuOpen && (
          <motion.div 
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="bg-white/95 backdrop-blur-xl border-b border-gray-100/30 shadow-sm"
          >
            <div className="container mx-auto px-4 md:px-6 py-2">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-1">
                {keyParametersSubmenu.map((item) => (
                  <SubMenuItem 
                    key={item}
                    label={item}
                    active={activeSubItem === item}
                    onClick={() => handleSubMenuClick(item)}
                  />
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}


import { ChevronDown, ChevronUp, FileText, Home, ListChecks, Settings } from "lucide-react";
import { cn } from "@/lib/utils";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

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
        "flex items-center px-6 py-3 cursor-pointer rounded-full transition-all font-medium",
        active 
          ? "text-med-700 bg-med-50/80 shadow-sm" 
          : "hover:bg-gray-50/80 hover:text-med-600 text-gray-700"
      )}
      onClick={onClick}
    >
      <Icon className={cn("h-5 w-5 mr-3", active ? "text-med-600" : "text-gray-500")} />
      <span className="font-medium">{label}</span>
      {hasSubmenu && (
        isSubmenuOpen ? (
          <ChevronUp className="ml-2 h-4 w-4 text-gray-600" />
        ) : (
          <ChevronDown className="ml-2 h-4 w-4 text-gray-600" />
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
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className={cn(
        "px-6 py-2.5 cursor-pointer transition-all font-medium text-sm rounded-full",
        active
          ? "bg-med-50/80 text-med-700 shadow-sm"
          : "hover:bg-gray-50/80 hover:text-med-600 text-gray-600"
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
      <nav className="bg-white/80 backdrop-blur-md border-b border-gray-100/40 sticky top-[4.5rem] z-10">
        <div className="container mx-auto px-4">
          <div className="flex gap-2 py-2">
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
        </div>
      </nav>
      
      <AnimatePresence>
        {isSubmenuOpen && (
          <motion.div 
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
            className="bg-white/80 backdrop-blur-md border-b border-gray-100/40 py-3 shadow-sm"
          >
            <div className="container mx-auto px-6">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
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

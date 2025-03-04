
import { ChevronDown, ChevronUp, FileText, Home, ListChecks, Settings } from "lucide-react";
import { cn } from "@/lib/utils";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate, useLocation } from "react-router-dom";

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
        "flex items-center px-4 md:px-6 py-2.5 md:py-3 cursor-pointer rounded-full transition-all font-medium",
        active 
          ? "text-blue-700 bg-blue-50/80 shadow-sm" 
          : "hover:bg-gray-50/80 hover:text-blue-600 text-gray-700"
      )}
      onClick={onClick}
    >
      <Icon className={cn("h-5 w-5 mr-2 md:mr-3", active ? "text-blue-600" : "text-gray-500")} />
      <span className="font-medium text-sm md:text-base">{label}</span>
      {hasSubmenu && (
        isSubmenuOpen ? (
          <ChevronUp className="ml-1 md:ml-2 h-4 w-4 text-gray-600" />
        ) : (
          <ChevronDown className="ml-1 md:ml-2 h-4 w-4 text-gray-600" />
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
        "px-4 md:px-6 py-2 md:py-2.5 cursor-pointer transition-all font-medium text-xs md:text-sm rounded-full",
        active
          ? "bg-blue-50/80 text-blue-700 shadow-sm"
          : "hover:bg-gray-50/80 hover:text-blue-600 text-gray-600"
      )}
      onClick={onClick}
    >
      {label}
    </motion.div>
  );
};

export function DashboardNavbar() {
  const navigate = useNavigate();
  const location = useLocation();
  const [activeItem, setActiveItem] = useState("Home");
  const [activeSubItem, setActiveSubItem] = useState("");
  const [isSubmenuOpen, setIsSubmenuOpen] = useState(false);
  
  const handleNavClick = (label: string) => {
    if (label === "Key Parameters") {
      setIsSubmenuOpen(!isSubmenuOpen);
    } else {
      setActiveItem(label);
      setIsSubmenuOpen(false);
      
      // Navigate based on label
      if (label === "Home") {
        navigate('/dashboard');
      } else if (label === "Settings") {
        // Future implementation
      } else if (label === "Agreement") {
        // Future implementation
      }
    }
  };

  const handleSubMenuClick = (label: string) => {
    setActiveSubItem(label);
    setActiveItem("Key Parameters");
    
    // Navigate based on submenu item
    if (label === "Services") {
      navigate('/services');
    }
    // Add other submenu navigations here as needed
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

  // Determine the active items based on current route
  React.useEffect(() => {
    if (location.pathname === '/dashboard') {
      setActiveItem("Home");
      setActiveSubItem("");
    } else if (location.pathname === '/services') {
      setActiveItem("Key Parameters");
      setActiveSubItem("Services");
      setIsSubmenuOpen(true);
    }
  }, [location.pathname]);

  return (
    <div className="sticky top-[4.5rem] z-10">
      <nav className="bg-white/80 backdrop-blur-md border-b border-gray-100/40">
        <div className="container mx-auto px-2 md:px-4 overflow-x-auto scrollbar-hide">
          <div className="flex gap-1 md:gap-2 py-2 flex-nowrap whitespace-nowrap">
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
            className="bg-white/80 backdrop-blur-md border-b border-gray-100/40 py-2 md:py-3 shadow-sm"
          >
            <div className="container mx-auto px-4 md:px-6 overflow-x-auto scrollbar-hide">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-1 md:gap-2">
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

import React, { useState } from "react";
import { 
  ChevronDown, ChevronUp, FileText, Home, 
  ListChecks, Settings, Heart, Brain, Briefcase,
  ActivitySquare, Building2, Users, Stethoscope
} from "lucide-react";
import { cn } from "@/lib/utils";
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
  icon?: React.ElementType;
}

const SubMenuItem = ({ label, active, onClick, icon: Icon }: SubMenuItemProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className={cn(
        "px-4 md:px-6 py-2 md:py-2.5 cursor-pointer transition-all font-medium text-xs md:text-sm rounded-full flex items-center",
        active
          ? "bg-blue-50/80 text-blue-700 shadow-sm"
          : "hover:bg-gray-50/80 hover:text-blue-600 text-gray-600"
      )}
      onClick={onClick}
    >
      {Icon && <Icon className="h-4 w-4 mr-2 text-gray-500" />}
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
        navigate('/settings');
      } else if (label === "Agreement") {
        navigate('/agreement');
      }
    }
  };

  const handleSubMenuClick = (label: string, path: string) => {
    setActiveSubItem(label);
    setActiveItem("Key Parameters");
    navigate(path);
  };

  const keyParametersSubmenus = [
    { label: "Services", path: "/services", icon: Briefcase },
    { label: "Hobbies", path: "/hobbies", icon: Heart },
    { label: "Skills", path: "/skills", icon: Brain },
    { label: "Medical & Mental", path: "/medical-mental", icon: Stethoscope },
    { label: "Type of Work", path: "/type-of-work", icon: ListChecks },
    { label: "Body Map Injuries", path: "/body-map-points", icon: ActivitySquare },
    { label: "Branch", path: "/branch", icon: Building2 },
    { label: "Branch Admin", path: "/branch-admins", icon: Users },
  ];

  // Determine the active items based on current route
  React.useEffect(() => {
    const path = location.pathname;
    
    if (path === '/dashboard') {
      setActiveItem("Home");
      setActiveSubItem("");
    } else if (path === '/settings') {
      setActiveItem("Settings");
      setActiveSubItem("");
    } else if (path === '/agreement') {
      setActiveItem("Agreement");
      setActiveSubItem("");
    } else {
      // Check if we're on a submenu path
      const submenuItem = keyParametersSubmenus.find(item => item.path === path);
      if (submenuItem) {
        setActiveItem("Key Parameters");
        setActiveSubItem(submenuItem.label);
        setIsSubmenuOpen(true);
      }
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
                {keyParametersSubmenus.map((item) => (
                  <SubMenuItem 
                    key={item.label}
                    label={item.label}
                    icon={item.icon}
                    active={activeSubItem === item.label}
                    onClick={() => handleSubMenuClick(item.label, item.path)}
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

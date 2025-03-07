
import React, { useState, useEffect } from "react";
import { 
  ChevronDown, ChevronUp, FileText, Home, 
  ListChecks, Settings, Heart, Brain, Briefcase,
  ActivitySquare, Building2, Users, Stethoscope
} from "lucide-react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate, useLocation } from "react-router-dom";
import { Badge } from "@/components/ui/badge";

interface NavTileProps {
  icon: React.ElementType;
  label: string;
  active?: boolean;
  onClick?: () => void;
  hasSubmenu?: boolean;
  isSubmenuOpen?: boolean;
  path: string;
}

const NavTile = ({ 
  icon: Icon, 
  label, 
  active, 
  onClick, 
  hasSubmenu, 
  isSubmenuOpen,
  path
}: NavTileProps) => {
  const location = useLocation();
  const isActive = active || location.pathname === path;
  
  return (
    <div 
      className={cn(
        "relative flex flex-col items-center justify-center p-4 cursor-pointer rounded-xl transition-all duration-300",
        "border border-gray-100 w-full",
        isActive 
          ? "bg-blue-50 shadow-sm border-blue-100" 
          : "bg-white hover:bg-gray-50 hover:border-blue-50"
      )}
      onClick={onClick}
    >
      <div className="relative">
        <Icon className={cn(
          "h-6 w-6 mb-2",
          isActive ? "text-blue-600" : "text-gray-500"
        )} />
      </div>
      
      <span className={cn(
        "text-sm font-medium text-center",
        isActive ? "text-blue-700" : "text-gray-700"
      )}>
        {label}
      </span>
      
      {hasSubmenu && (
        <div className="absolute top-2 right-2">
          {isSubmenuOpen ? (
            <ChevronUp className="h-4 w-4 text-gray-400" />
          ) : (
            <ChevronDown className="h-4 w-4 text-gray-400" />
          )}
        </div>
      )}
    </div>
  );
};

interface SubNavTileProps {
  icon: React.ElementType;
  label: string;
  active?: boolean;
  onClick?: () => void;
  path: string;
}

const SubNavTile = ({ 
  icon: Icon, 
  label, 
  active, 
  onClick,
  path
}: SubNavTileProps) => {
  const location = useLocation();
  const isActive = active || location.pathname === path;
  
  return (
    <motion.div
      initial={{ opacity: 0, y: -5 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className={cn(
        "relative cursor-pointer rounded-xl transition-all duration-300 p-3",
        "hover:shadow-soft border", 
        isActive 
          ? "bg-white border-med-200 shadow-soft" 
          : "bg-white/60 backdrop-blur-sm border-transparent hover:border-med-100"
      )}
      onClick={onClick}
    >
      <div className="flex flex-col items-center">
        <div className="relative mb-1.5">
          <Icon className={cn(
            "h-5 w-5",
            isActive ? "text-med-500" : "text-gray-500"
          )} />
        </div>
        
        <span className={cn(
          "text-xs font-medium text-center",
          isActive ? "text-med-600" : "text-gray-600"
        )}>
          {label}
        </span>
      </div>
    </motion.div>
  );
};

export function DashboardNavbar() {
  const navigate = useNavigate();
  const location = useLocation();
  const [activeItem, setActiveItem] = useState("Home");
  
  const handleNavClick = (label: string, path: string) => {
    setActiveItem(label);
    navigate(path);
  };

  const mainNavItems = [
    { label: "Home", icon: Home, path: "/dashboard" },
    { label: "Key Parameters", icon: ListChecks, path: "/key-parameters" },
    { label: "Settings", icon: Settings, path: "/settings" },
    { label: "Agreement", icon: FileText, path: "/agreement" }
  ];

  useEffect(() => {
    const path = location.pathname;
    
    if (path === '/dashboard') {
      setActiveItem("Home");
    } else if (path === '/settings') {
      setActiveItem("Settings");
    } else if (path === '/agreement') {
      setActiveItem("Agreement");
    } else if (path === '/key-parameters' || path.includes('/key-parameters')) {
      setActiveItem("Key Parameters");
    }
  }, [location.pathname]);

  return (
    <div className="sticky top-[4.5rem] z-10">
      <nav className="bg-white/80 backdrop-blur-md border-b border-gray-100/40 py-6">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {mainNavItems.map((item) => (
              <NavTile 
                key={item.label}
                icon={item.icon} 
                label={item.label} 
                path={item.path}
                active={activeItem === item.label}
                onClick={() => handleNavClick(item.label, item.path)}
              />
            ))}
          </div>
        </div>
      </nav>
    </div>
  );
}

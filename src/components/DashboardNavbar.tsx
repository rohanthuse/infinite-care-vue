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
import { useTenant } from "@/contexts/TenantContext";

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
        "border border-border w-full",
        isActive 
          ? "bg-primary/10 shadow-sm border-primary/50" 
          : "bg-card hover:bg-accent hover:border-primary/30"
      )}
      onClick={onClick}
    >
      <div className="relative">
        <Icon className={cn(
          "h-6 w-6 mb-2",
          isActive ? "text-primary" : "text-muted-foreground"
        )} />
      </div>
      
      <span className={cn(
        "text-sm font-medium text-center",
        isActive ? "text-primary" : "text-foreground"
      )}>
        {label}
      </span>
      
      {hasSubmenu && (
        <div className="absolute top-2 right-2">
          {isSubmenuOpen ? (
            <ChevronUp className="h-4 w-4 text-muted-foreground" />
          ) : (
            <ChevronDown className="h-4 w-4 text-muted-foreground" />
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
          ? "bg-card border-primary/50 shadow-soft" 
          : "bg-card/60 backdrop-blur-sm border-transparent hover:border-primary/20"
      )}
      onClick={onClick}
    >
      <div className="flex flex-col items-center">
        <div className="relative mb-1.5">
          <Icon className={cn(
            "h-5 w-5",
            isActive ? "text-primary" : "text-muted-foreground"
          )} />
        </div>
        
        <span className={cn(
          "text-xs font-medium text-center",
          isActive ? "text-primary" : "text-muted-foreground"
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
  
  // Safely get tenant context - may not be available in system-level routes
  let tenantSlug = null;
  try {
    const tenantContext = useTenant();
    tenantSlug = tenantContext.tenantSlug;
  } catch (error) {
    console.log('[DashboardNavbar] Not in tenant context, using system-level routing');
  }
  
  const [activeItem, setActiveItem] = useState("Home");
  const [activeSubItem, setActiveSubItem] = useState("");
  const [isSubmenuOpen, setIsSubmenuOpen] = useState(false);
  
  const getTenantAwarePath = (path: string) => {
    if (tenantSlug && !path.startsWith('#')) {
      return `/${tenantSlug}${path}`;
    }
    return path;
  };

  const handleNavClick = (label: string, path: string) => {
    if (label === "Core Settings") {
      setIsSubmenuOpen(!isSubmenuOpen);
    } else {
      setActiveItem(label);
      setIsSubmenuOpen(false);
      navigate(getTenantAwarePath(path));
    }
  };

  const handleSubNavClick = (label: string, path: string) => {
    setActiveSubItem(label);
    setActiveItem("Core Settings");
    navigate(getTenantAwarePath(path));
  };

  const mainNavItems = [
    { label: "Home", icon: Home, path: "/dashboard" },
    { label: "Core Settings", icon: ListChecks, path: "#", hasSubmenu: true },
    { label: "Settings", icon: Settings, path: "/settings" },
    { label: "Agreement", icon: FileText, path: "/agreement" }
  ];

  const keyParametersSubItems = [
    { label: "Services", icon: Briefcase, path: "/services" },
    { label: "Hobbies", icon: Heart, path: "/hobbies" },
    { label: "Skills", icon: Brain, path: "/skills" },
    { label: "Medical & Mental", icon: Stethoscope, path: "/medical-mental" },
    { label: "Type of Work", icon: ListChecks, path: "/type-of-work" },
    { label: "Body Map Injuries", icon: ActivitySquare, path: "/body-map-points" },
    { label: "Branch", icon: Building2, path: "/branch" },
    { label: "Branch Admin", icon: Users, path: "/branch-admins" }
  ];

  useEffect(() => {
    const path = location.pathname;
    
    // Remove tenant slug prefix for path matching
    const normalizedPath = tenantSlug && path.startsWith(`/${tenantSlug}`) 
      ? path.substring(`/${tenantSlug}`.length) 
      : path;
    
    if (normalizedPath === '/dashboard' || normalizedPath === '') {
      setActiveItem("Home");
      setActiveSubItem("");
    } else if (normalizedPath === '/settings') {
      setActiveItem("Settings");
      setActiveSubItem("");
    } else if (normalizedPath === '/agreement') {
      setActiveItem("Agreement");
      setActiveSubItem("");
    } else {
      const submenuItem = keyParametersSubItems.find(item => item.path === normalizedPath);
      if (submenuItem) {
        setActiveItem("Core Settings");
        setActiveSubItem(submenuItem.label);
        setIsSubmenuOpen(true);
      }
    }
  }, [location.pathname, tenantSlug]);

  return (
    <div className="sticky top-[4.5rem] z-10">
      <nav className="bg-card/80 backdrop-blur-md border-b border-border/40 py-6">
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
                hasSubmenu={item.hasSubmenu}
                isSubmenuOpen={isSubmenuOpen && item.label === "Core Settings"}
              />
            ))}
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
            className="bg-muted/80 backdrop-blur-sm py-8 shadow-sm border-b border-border"
          >
            <div className="container mx-auto px-4">
              <div className="grid grid-cols-4 md:grid-cols-8 gap-4">
                {keyParametersSubItems.map((item) => (
                  <SubNavTile 
                    key={item.label}
                    icon={item.icon}
                    label={item.label}
                    path={item.path}
                    active={activeSubItem === item.label}
                    onClick={() => handleSubNavClick(item.label, item.path)}
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

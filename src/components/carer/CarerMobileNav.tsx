import React from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Home, Calendar, Users, MessageSquare, Menu } from "lucide-react";
import { cn } from "@/lib/utils";
import { useCarerNavigation } from "@/hooks/useCarerNavigation";
import { useSidebar } from "@/components/ui/sidebar";

const navItems = [
  { icon: Home, label: "Home", value: "" },
  { icon: Calendar, label: "Schedule", value: "schedule" },
  { icon: Users, label: "Clients", value: "clients" },
  { icon: MessageSquare, label: "Messages", value: "messages" },
];

export const CarerMobileNav: React.FC = () => {
  const { createCarerPath } = useCarerNavigation();
  const location = useLocation();
  const navigate = useNavigate();
  const { setOpenMobile } = useSidebar();

  const handleNavClick = (value: string) => {
    const path = createCarerPath(value ? `/${value}` : '');
    navigate(path);
  };

  const isActive = (value: string) => {
    const expectedPath = createCarerPath(value ? `/${value}` : '');
    return location.pathname === expectedPath;
  };

  const handleMenuClick = () => {
    setOpenMobile(true);
  };

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-[60] bg-white dark:bg-gray-900 border-t border-border shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)] pb-safe">
      <div className="flex items-center justify-around h-16 px-2">
        {navItems.map((item) => (
          <button
            key={item.value}
            onClick={() => handleNavClick(item.value)}
            className={cn(
              "flex flex-col items-center justify-center flex-1 h-full gap-1 transition-colors",
              isActive(item.value)
                ? "text-primary"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <item.icon className="h-5 w-5" />
            <span className="text-xs font-medium">{item.label}</span>
          </button>
        ))}
        <button
          onClick={handleMenuClick}
          className="flex flex-col items-center justify-center flex-1 h-full gap-1 text-muted-foreground hover:text-foreground transition-colors"
        >
          <Menu className="h-5 w-5" />
          <span className="text-xs font-medium">Menu</span>
        </button>
      </div>
    </nav>
  );
};

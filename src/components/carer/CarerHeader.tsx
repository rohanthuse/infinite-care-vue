
import React, { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { 
  ChevronDown, 
  Heart,
  HelpCircle, 
  LogOut, 
  Menu, 
  Search,
  Settings, 
  User, 
  Calendar, 
  ClipboardList, 
  FileText, 
  Home, 
  Users, 
  Wallet, 
  GraduationCap,
  CalendarDays,
  FileBarChart,
  Newspaper
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { CustomButton } from "@/components/ui/CustomButton";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { NotificationDropdown } from "@/components/notifications/NotificationDropdown";
import { useCarerAuth } from "@/hooks/useCarerAuth";
import { useCarerProfile } from "@/hooks/useCarerProfile";
import { useCarerNavigation } from "@/hooks/useCarerNavigation";

// Icon mapping for carer navigation
const iconMap = {
  Home,
  User,
  Calendar,
  CalendarDays,
  FileText,
  ClipboardList,
  Newspaper,
  FileBarChart,
  Wallet,
  GraduationCap,
  Users,
};

export const CarerHeader: React.FC<{ onMobileMenuToggle: () => void }> = ({ onMobileMenuToggle }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { signOut } = useCarerAuth();
  const { data: carerProfile } = useCarerProfile();
  const { getCarerMenuItems, createCarerPath } = useCarerNavigation();
  const [searchValue, setSearchValue] = useState("");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  
  const menuItems = getCarerMenuItems();

  const handleLogout = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const handleViewAllNotifications = () => {
    navigate(createCarerPath('/notifications'));
  };

  const carerName = carerProfile ? `${carerProfile.first_name} ${carerProfile.last_name}` : "Carer";

  return (
    <header className="bg-white shadow-sm border-b border-gray-100 py-3 md:py-4 sticky top-0 z-50 w-full">
      <div className="container mx-auto px-4 flex justify-between items-center relative">
        {/* Logo aligned to the left - with Heart icon to match Super Admin */}
        <div className="flex items-center gap-2 md:gap-4">
          <img src="/lovable-uploads/3c8cdaf9-5267-424f-af69-9a1ce56b7ec5.png" alt="Med-Infinite Logo" className="w-8 h-8 md:w-10 md:h-10" />
          <div className="flex flex-col">
            <h2 className="text-sm md:text-lg font-bold tracking-tight">
              MED-INFINITE 
            </h2>
            <span className="text-xs text-gray-500 -mt-0.5 hidden md:block">ENDLESS CARE</span>
          </div>
        </div>
        
        {/* Search in center for desktop view */}
        <div className="hidden md:flex items-center justify-center flex-1 mx-4">
          <div className="relative max-w-md w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input 
              placeholder="Search..." 
              className="pl-10 pr-4 py-2 rounded-full bg-white border-gray-200 w-full transition-all duration-300"
              value={searchValue}
              onChange={(e) => setSearchValue(e.target.value)}
            />
          </div>
        </div>
        
        {/* Bell notification on right for desktop view */}
        <div className="hidden md:flex items-center">
          <NotificationDropdown onViewAll={handleViewAllNotifications} />
        </div>
        
        {/* Mobile menu button */}
        <div className="md:hidden">
          <Button variant="outline" size="icon" className="text-blue-600 border border-blue-200 bg-white shadow-sm hover:bg-blue-50 rounded-full" onClick={onMobileMenuToggle}>
            <Menu className="h-5 w-5" />
          </Button>
        </div>
        
        {/* Profile card - styled like Super Admin */}
        <div className="hidden md:flex items-center">
          <div className="flex items-center gap-3 bg-white/80 backdrop-blur-sm py-2 px-4 rounded-full border border-gray-100/60 shadow-sm ml-2">
            <div>
              <div className="text-gray-800 font-semibold">{carerName}</div>
              <div className="text-gray-500 text-xs font-medium">Carer</div>
            </div>
            <div className="h-8 border-r border-gray-200/80 mx-1"></div>
            <CustomButton variant="ghost" size="icon" className="flex items-center p-1.5 hover:bg-gray-100/80 text-gray-700 rounded-full transition-all" onClick={handleLogout}>
              <LogOut className="h-5 w-5" />
            </CustomButton>
          </div>
        </div>
      </div>
      
      {/* Top Navigation Menu */}
      <div className="bg-white border-b border-gray-200 px-4 hidden md:block">
        <nav className="flex flex-wrap">
          {menuItems.map((item) => {
            const IconComponent = iconMap[item.icon as keyof typeof iconMap];
            return (
              <Link
                key={item.name}
                to={item.path}
                className={cn(
                  "flex items-center px-4 py-3 text-sm font-medium border-b-2 transition-colors",
                  location.pathname === item.path || (item.path === "/carer-dashboard" && location.pathname === "/carer-dashboard")
                    ? "border-blue-600 text-blue-700"
                    : "border-transparent text-gray-700 hover:text-blue-600 hover:border-blue-200"
                )}
              >
                {IconComponent && <IconComponent className="h-4 w-4 mr-2" />}
                {item.name}
              </Link>
            );
          })}
        </nav>
      </div>
    </header>
  );
};

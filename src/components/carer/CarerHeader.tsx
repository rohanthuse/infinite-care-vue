
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { 
  LogOut, 
  Search
} from "lucide-react";
import { CustomButton } from "@/components/ui/CustomButton";
import { Input } from "@/components/ui/input";
import { NotificationDropdown } from "@/components/notifications/NotificationDropdown";
import { useCarerAuthSafe } from "@/hooks/useCarerAuthSafe";
import { useCarerProfile } from "@/hooks/useCarerProfile";
import { useCarerNavigation } from "@/hooks/useCarerNavigation";
import { SidebarTrigger } from "@/components/ui/sidebar";

export const CarerHeader: React.FC = () => {
  const navigate = useNavigate();
  const { signOut } = useCarerAuthSafe();
  const { data: carerProfile } = useCarerProfile();
  const { createCarerPath } = useCarerNavigation();
  const [searchValue, setSearchValue] = useState("");

  const handleLogout = async () => {
    console.log('[CarerHeader] Logout button clicked');
    try {
      await signOut();
      console.log('[CarerHeader] Logout completed');
    } catch (error) {
      console.error('[CarerHeader] Logout error:', error);
      // Force navigation as fallback
      window.location.replace('/');
    }
  };

  const handleViewAllNotifications = () => {
    navigate(createCarerPath('/notifications'));
  };

  const carerName = carerProfile ? `${carerProfile.first_name} ${carerProfile.last_name}` : "Carer";

  return (
    <header className="bg-white shadow-sm border-b border-gray-100 py-3 md:py-4 sticky top-0 z-50 w-full">
      <div className="container mx-auto px-4 flex justify-between items-center relative">
        {/* Logo and Sidebar Trigger */}
        <div className="flex items-center gap-2 md:gap-4">
          <SidebarTrigger className="h-8 w-8" />
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
        
        {/* Right side: Notifications and Profile */}
        <div className="flex items-center gap-2">
          <NotificationDropdown onViewAll={handleViewAllNotifications} />
          
          {/* User profile card */}
          <div className="hidden md:flex items-center gap-3 bg-white/80 backdrop-blur-sm py-2 px-4 rounded-full border border-gray-100/60 shadow-sm ml-2">
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
    </header>
  );
};

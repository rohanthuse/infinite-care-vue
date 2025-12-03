import React, { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { 
  LogOut, 
  Search
} from "lucide-react";
import { CustomButton } from "@/components/ui/CustomButton";
import { Input } from "@/components/ui/input";
import { NotificationDropdown } from "@/components/notifications/NotificationDropdown";
import { useUnifiedCarerAuth } from "@/hooks/useUnifiedCarerAuth";
import { useCarerProfile } from "@/hooks/useCarerProfile";
import { useCarerNavigation } from "@/hooks/useCarerNavigation";
import { useCarerContext } from "@/hooks/useCarerContext";
import { BranchSearchDropdown } from "@/components/search/BranchSearchDropdown";
import { SidebarTrigger } from "@/components/ui/sidebar";

export const CarerHeader: React.FC = () => {
  const navigate = useNavigate();
  const { signOut } = useUnifiedCarerAuth();
  const { data: carerProfile } = useCarerProfile();
  const { createCarerPath } = useCarerNavigation();
  const [searchValue, setSearchValue] = useState("");
  const [searchDropdownOpen, setSearchDropdownOpen] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const { data: carerContext } = useCarerContext();
  
  // Get branch ID and name from carer context
  const branchId = carerContext?.branchInfo?.id || carerProfile?.branch_id || '';
  const branchName = carerContext?.branchInfo?.name || 'Branch';

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
    <header 
      className="bg-gradient-to-r from-white via-white to-green-50/40 dark:from-card dark:via-card dark:to-green-950/20 shadow-sm shadow-green-100/20 dark:shadow-green-900/10 border-b border-gray-100 dark:border-border fixed top-0 left-0 right-0 z-[60] w-full h-[72px] flex items-center relative after:absolute after:bottom-0 after:left-0 after:right-0 after:h-[2px] after:bg-gradient-to-r after:from-green-500 after:via-teal-500 after:to-cyan-500"
      style={{ height: 'var(--carer-header-height, 72px)' }}
    >
      <div className="container mx-auto px-4 flex justify-between items-center relative">
        {/* Logo and Sidebar Trigger */}
        <div className="flex items-center gap-2 md:gap-4">
          <SidebarTrigger className="h-8 w-8 md:h-10 md:w-10" />
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
              ref={searchInputRef}
              placeholder="Search clients, bookings, documents..." 
              className="pl-10 pr-4 py-2 rounded-full bg-white border-gray-200 w-full transition-all duration-300"
              value={searchValue}
              onChange={(e) => {
                setSearchValue(e.target.value);
                if (e.target.value.trim().length >= 2) {
                  setSearchDropdownOpen(true);
                } else {
                  setSearchDropdownOpen(false);
                }
              }}
              onFocus={() => {
                if (searchValue.trim().length >= 2) {
                  setSearchDropdownOpen(true);
                }
              }}
            />
            
            {/* Search Results Dropdown */}
            {searchDropdownOpen && searchValue.trim().length >= 2 && branchId && (
              <BranchSearchDropdown
                searchValue={searchValue}
                onClose={() => setSearchDropdownOpen(false)}
                onResultClick={() => {
                  setSearchValue("");
                  setSearchDropdownOpen(false);
                }}
                branchId={branchId}
                branchName={branchName}
                anchorRef={searchInputRef}
              />
            )}
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

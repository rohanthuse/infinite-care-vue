import React, { useState, useEffect } from "react";
import { Search, LogOut } from "lucide-react";
import { Input } from "@/components/ui/input";
import { CustomButton } from "@/components/ui/CustomButton";
import { NotificationDropdown } from "@/components/notifications/NotificationDropdown";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useTenant } from "@/contexts/TenantContext";
import { useClientAuth } from "@/hooks/useClientAuth";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { useClientNavigation } from "@/hooks/useClientNavigation";

const ClientHeader: React.FC<{ title: string }> = ({ title }) => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { tenantSlug } = useTenant();
  const { clientName: authClientName, user } = useClientAuth();
  const { createClientPath } = useClientNavigation();
  
  // Get the display name from auth or fallback to email prefix or "Client"
  const clientName = authClientName || 
    (user?.email ? user.email.split('@')[0] : "Client");
    
  const [searchValue, setSearchValue] = useState("");

  const handleViewAllNotifications = () => {
    navigate(createClientPath('/notifications'));
  };

  const handleLogout = async () => {
    try {
      // Sign out from Supabase first
      const { error } = await supabase.auth.signOut();
      
      if (error) {
        console.error('Logout error:', error);
        toast({
          title: "Logout Error",
          description: "There was an issue logging you out. Please try again.",
          variant: "destructive",
        });
        return;
      }

      // Clear localStorage after successful Supabase signout
      localStorage.removeItem("userType");
      localStorage.removeItem("clientName");
      localStorage.removeItem("clientId");
      
      toast({
        title: "Logged out successfully",
        description: "You have been logged out of your account",
      });
      
      // Always navigate to landing page after logout
      navigate('/', { replace: true });
    } catch (error) {
      console.error('Unexpected logout error:', error);
      toast({
        title: "Logout Error",
        description: "An unexpected error occurred during logout.",
        variant: "destructive",
      });
    }
  };
  
  return (
    <header 
      className="bg-gradient-to-r from-white via-white to-indigo-50/40 dark:from-card dark:via-card dark:to-indigo-950/20 shadow-sm shadow-indigo-100/20 dark:shadow-indigo-900/10 border-b border-gray-100 dark:border-border fixed top-0 left-0 right-0 z-[60] w-full flex items-center relative after:absolute after:bottom-0 after:left-0 after:right-0 after:h-[2px] after:bg-gradient-to-r after:from-blue-500 after:via-indigo-500 after:to-purple-500"
      style={{ height: 'var(--client-header-height, 64px)' }}
    >
      <div className="w-full px-4 md:px-6 lg:px-8 flex justify-between items-center">
        {/* Logo and Sidebar Trigger */}
        <div className="flex items-center gap-2 lg:gap-4">
          <SidebarTrigger className="h-8 w-8 lg:h-10 lg:w-10" />
          <img src="/lovable-uploads/3c8cdaf9-5267-424f-af69-9a1ce56b7ec5.png" alt="Med-Infinite Logo" className="w-8 h-8 lg:w-10 lg:h-10" />
          <div className="flex flex-col">
            <h2 className="text-sm lg:text-lg font-bold tracking-tight">
              MED-INFINITE 
            </h2>
            <span className="text-xs text-gray-500 -mt-0.5 hidden lg:block">ENDLESS CARE</span>
          </div>
        </div>
        
        {/* Search in center - responsive visibility */}
        <div className="hidden sm:flex items-center flex-1 mx-4 max-w-md lg:max-w-lg">
          <div className="relative w-full">
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
          
          {/* User profile card - hidden on mobile */}
          <div className="hidden md:flex items-center gap-3 bg-white/80 backdrop-blur-sm py-2 px-4 rounded-full border border-gray-100/60 shadow-sm ml-2">
            <div>
              <div className="text-gray-800 font-semibold text-sm">{clientName}</div>
              <div className="text-gray-500 text-xs font-medium">Client</div>
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

export default ClientHeader;

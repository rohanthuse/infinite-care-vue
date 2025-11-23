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
    navigate(createClientPath('/messages'));
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
    <header className="bg-white shadow-sm border-b border-gray-100 py-3 md:py-4 sticky top-0 z-50 w-full">
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
              <div className="text-gray-800 font-semibold">{clientName}</div>
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

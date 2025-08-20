import React, { useState, useEffect } from "react";
import { Bell, Search, Heart, Menu, X, LogOut } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { CustomButton } from "@/components/ui/CustomButton";
import { NotificationDropdown } from "@/components/notifications/NotificationDropdown";
import { useNavigate, useLocation } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useTenant } from "@/contexts/TenantContext";

const ClientHeader: React.FC<{ title: string }> = ({ title }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const { tenantSlug } = useTenant();
  const clientName = localStorage.getItem("clientName") || "Client";
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchValue, setSearchValue] = useState("");
  
  // Close mobile menu when resizing to desktop
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 768 && mobileMenuOpen) {
        setMobileMenuOpen(false);
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [mobileMenuOpen]);

  const handleViewAllNotifications = () => {
    // For clients, we'll navigate to their messages page which includes notifications
    if (tenantSlug) {
      navigate(`/${tenantSlug}/client-dashboard/messages`);
    } else {
      navigate("/client-dashboard/messages");
    }
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
      
      // The navigation will be handled by the auth state listener in ClientDashboard
      // But we'll also manually navigate as a fallback to the main landing page
      navigate('/');
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
    <header className="bg-card border-b border-border p-4 sticky top-0 z-50">
      <div className="flex items-center justify-between">
        {/* Logo aligned to the left - with Heart icon to match Super Admin */}
        <div className="flex items-center gap-2 md:gap-4">
          <img src="/lovable-uploads/3c8cdaf9-5267-424f-af69-9a1ce56b7ec5.png" alt="Med-Infinite Logo" className="w-8 h-8 md:w-10 md:h-10" />
          <div className="flex flex-col">
            <h2 className="text-sm md:text-lg font-bold tracking-tight text-foreground">
              MED-INFINITE 
            </h2>
            <span className="text-xs text-muted-foreground -mt-0.5 hidden md:block">ENDLESS CARE</span>
          </div>
        </div>
        
        {/* Search in center for desktop view */}
        <div className="hidden md:flex items-center justify-center flex-1 mx-4">
          <div className="relative max-w-md w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="Search..." 
              className="pl-10 pr-4 py-2 rounded-full bg-card border-border w-full transition-all duration-300"
              value={searchValue}
              onChange={(e) => setSearchValue(e.target.value)}
            />
          </div>
        </div>
        
        {/* Bell notification on right for desktop view - Enhanced */}
        <div className="hidden md:flex items-center">
          <div className="relative">
            <NotificationDropdown onViewAll={handleViewAllNotifications} />
            {/* Prominent message notification pulse indicator */}
            <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full animate-pulse border-2 border-card" 
                 style={{ display: 'none' }} 
                 id="message-pulse-indicator">
            </div>
          </div>
        </div>
        
        {/* Mobile menu button */}
        <div className="md:hidden">
          <Button variant="outline" size="icon" className="text-primary border border-border bg-card shadow-sm hover:bg-accent rounded-full" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </div>
        
        {/* Profile card - styled like Super Admin */}
        <div className="hidden md:flex items-center">
          <div className="flex items-center gap-3 bg-card/80 backdrop-blur-sm py-2 px-4 rounded-full border border-border/60 shadow-sm ml-2">
            <div>
              <div className="text-foreground font-semibold">{clientName}</div>
              <div className="text-muted-foreground text-xs font-medium">Client</div>
            </div>
            <div className="h-8 border-r border-border/80 mx-1"></div>
            <CustomButton variant="ghost" size="icon" className="flex items-center p-1.5 hover:bg-accent text-muted-foreground rounded-full transition-all" onClick={handleLogout}>
              <LogOut className="h-5 w-5" />
            </CustomButton>
          </div>
        </div>
      </div>
      
      {/* Mobile menu overlay */}
      <div className={`
          flex-col md:hidden
          fixed top-[64px] left-0 right-0
          bg-card py-4
          border-b border-border 
          shadow-md z-[500]
          ${mobileMenuOpen ? 'flex' : 'hidden'} 
          items-center gap-3 px-6
        `} style={{
          maxHeight: 'calc(100vh - 64px)',
          overflowY: 'auto'
        }}>
          
        {/* Search for mobile view */}
        <div className="relative w-full mb-3">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input 
            placeholder="Search..." 
            className="pl-10 pr-4 py-2 rounded-full bg-card border-border w-full"
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value)}
          />
        </div>
        
        {/* Notifications for mobile */}
        <div className="w-full flex justify-between items-center py-2">
          <span className="text-sm font-medium text-foreground">Notifications</span>
          <NotificationDropdown onViewAll={handleViewAllNotifications} />
        </div>
        
        {/* Mobile profile and logout */}
        <div className="w-full pt-2 border-t border-border mt-2">
          <div className="flex items-center gap-3 mb-3">
            <Avatar>
              <AvatarFallback className="bg-primary/10 text-primary">
                {clientName.charAt(0)}
              </AvatarFallback>
            </Avatar>
            <div>
              <p className="font-medium text-foreground">{clientName}</p>
              <p className="text-xs text-muted-foreground">Client</p>
            </div>
          </div>
          <Button variant="ghost" className="w-full flex justify-between items-center text-foreground hover:bg-accent rounded-lg py-3" onClick={handleLogout}>
            <span className="font-medium">Logout</span>
            <LogOut className="h-5 w-5" />
          </Button>
        </div>
      </div>
    </header>
  );
};

export default ClientHeader;

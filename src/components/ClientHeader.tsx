import React, { useState, useRef } from "react";
import { Search, LogOut, Sun, Moon, Monitor, User, ChevronDown } from "lucide-react";
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
import { ClientSearchDropdown } from "@/components/search/ClientSearchDropdown";
import { Button } from "@/components/ui/button";
import { useTheme } from "next-themes";
import { ThemeSwitcher } from "@/components/ui/theme-switcher";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

// Theme options component for mobile dropdown
const ThemeMobileOptions: React.FC = () => {
  const { setTheme, theme } = useTheme();
  
  return (
    <>
      <DropdownMenuItem onClick={() => setTheme("light")} className={theme === "light" ? "bg-accent" : ""}>
        <Sun className="mr-2 h-4 w-4" />
        Light
      </DropdownMenuItem>
      <DropdownMenuItem onClick={() => setTheme("dark")} className={theme === "dark" ? "bg-accent" : ""}>
        <Moon className="mr-2 h-4 w-4" />
        Dark
      </DropdownMenuItem>
      <DropdownMenuItem onClick={() => setTheme("system")} className={theme === "system" ? "bg-accent" : ""}>
        <Monitor className="mr-2 h-4 w-4" />
        System
      </DropdownMenuItem>
    </>
  );
};

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
  const [searchDropdownOpen, setSearchDropdownOpen] = useState(false);
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const mobileSearchInputRef = useRef<HTMLInputElement>(null);

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
      className="bg-gradient-to-r from-white via-white to-indigo-50/40 dark:from-card dark:via-card dark:to-indigo-950/20 shadow-sm shadow-indigo-100/20 dark:shadow-indigo-900/10 border-b border-gray-100 dark:border-border fixed top-0 left-0 right-0 z-50 h-[72px] flex items-center after:absolute after:bottom-0 after:left-0 after:right-0 after:h-[2px] after:bg-gradient-to-r after:from-blue-500 after:via-indigo-500 after:to-purple-500"
    >
      <div className="w-full px-4 md:px-6 lg:px-8 flex justify-between items-center">
        {/* Logo and Sidebar Trigger */}
        <div className="flex items-center gap-2 lg:gap-4">
          <SidebarTrigger className="h-8 w-8 lg:h-10 lg:w-10 hidden lg:flex" />
          <img src="/lovable-uploads/3c8cdaf9-5267-424f-af69-9a1ce56b7ec5.png" alt="Med-Infinite Logo" className="w-8 h-8 lg:w-10 lg:h-10" />
          <div className="flex flex-col">
            <h2 className="text-sm lg:text-lg font-bold tracking-tight">
              MED-INFINITE 
            </h2>
            <span className="text-xs text-gray-500 dark:text-muted-foreground -mt-0.5 hidden lg:block">ENDLESS CARE</span>
          </div>
        </div>
        
        {/* Search in center - hidden on mobile, uses sheet instead */}
        <div className="hidden sm:flex items-center flex-1 mx-4 max-w-md lg:max-w-lg">
          <div className="relative w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 dark:text-muted-foreground" />
            <Input 
              ref={searchInputRef}
              placeholder="Search modules, appointments, documents..." 
              className="pl-10 pr-4 py-2 rounded-full bg-white dark:bg-card border-gray-200 dark:border-border w-full transition-all duration-300"
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
            {searchDropdownOpen && searchValue.trim().length >= 2 && (
              <ClientSearchDropdown
                searchValue={searchValue}
                onClose={() => setSearchDropdownOpen(false)}
                onResultClick={() => {
                  setSearchValue("");
                  setSearchDropdownOpen(false);
                }}
                anchorRef={searchInputRef}
              />
            )}
          </div>
        </div>

        {/* Right side: Mobile Search, Notifications, Theme, Logout, and Profile */}
        <div className="flex items-center gap-2">
          {/* Mobile search button */}
          <Sheet open={mobileSearchOpen} onOpenChange={setMobileSearchOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="sm:hidden h-9 w-9">
                <Search className="h-5 w-5 text-muted-foreground" />
              </Button>
            </SheetTrigger>
            <SheetContent side="top" className="h-auto">
              <SheetHeader className="mb-4">
                <SheetTitle>Search</SheetTitle>
              </SheetHeader>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input 
                  ref={mobileSearchInputRef}
                  placeholder="Search..." 
                  className="pl-10 pr-4 py-2 w-full"
                  autoFocus
                />
              </div>
            </SheetContent>
          </Sheet>
          
          <NotificationDropdown onViewAll={handleViewAllNotifications} />
          
          {/* Desktop Theme Switcher */}
          <div className="hidden md:block">
            <ThemeSwitcher />
          </div>
          
          {/* Mobile User Dropdown with Theme Options */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button 
                variant="ghost" 
                className="md:hidden h-9 px-2 gap-1"
              >
                <div className="h-7 w-7 rounded-full bg-primary/10 flex items-center justify-center text-primary text-xs font-semibold">
                  {clientName.charAt(0).toUpperCase()}
                </div>
                <ChevronDown className="h-4 w-4 text-muted-foreground" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56 bg-background border border-border">
              <DropdownMenuLabel>
                <div className="flex flex-col">
                  <span className="font-semibold">{clientName}</span>
                  <span className="text-xs text-muted-foreground font-normal">Client</span>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => navigate(createClientPath('/profile'))}>
                <User className="mr-2 h-4 w-4" />
                My Profile
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuLabel className="text-xs font-normal text-muted-foreground">Theme</DropdownMenuLabel>
              <ThemeMobileOptions />
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleLogout} className="text-destructive focus:text-destructive">
                <LogOut className="mr-2 h-4 w-4" />
                Logout
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          
          {/* User profile card - hidden on mobile */}
          <div className="hidden md:flex items-center gap-3 bg-white/80 dark:bg-card/80 backdrop-blur-sm py-2 px-4 rounded-full border border-gray-100/60 dark:border-border/60 shadow-sm ml-2">
            <div>
              <div className="text-gray-800 dark:text-foreground font-semibold text-sm">{clientName}</div>
              <div className="text-gray-500 dark:text-muted-foreground text-xs font-medium">Client</div>
            </div>
            <div className="h-8 border-r border-gray-200/80 dark:border-border/80 mx-1"></div>
            <CustomButton variant="ghost" size="icon" className="flex items-center p-1.5 hover:bg-gray-100/80 dark:hover:bg-muted/80 text-gray-700 dark:text-foreground rounded-full transition-all" onClick={handleLogout}>
              <LogOut className="h-5 w-5" />
            </CustomButton>
          </div>
        </div>
      </div>
    </header>
  );
};

export default ClientHeader;
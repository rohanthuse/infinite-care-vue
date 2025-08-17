
import { LogOut, HelpCircle, Menu, Heart, Search } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { CustomButton } from "@/components/ui/CustomButton";
import { Input } from "@/components/ui/input";
import { useState, useEffect } from "react";
import { NotificationDropdown } from "@/components/notifications/NotificationDropdown";
import { useAuth } from "@/hooks/useAuth";
import { useUserRole } from "@/hooks/useUserRole";
import { useToast } from "@/hooks/use-toast";

export function DashboardHeader() {
  const navigate = useNavigate();
  const location = useLocation();
  const { signOut } = useAuth();
  const { data: userRole, isLoading: userRoleLoading } = useUserRole();
  const { toast } = useToast();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchValue, setSearchValue] = useState("");

  // Extract branch ID from URL if we're in a branch context
  const branchId = location.pathname.includes('/branch-dashboard/') 
    ? location.pathname.split('/')[2] 
    : undefined;

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
  
  const handleLogout = async () => {
    try {
      await signOut();
      toast({
        title: "Logged out",
        description: "You have been successfully logged out.",
      });
      navigate('/');
    } catch (error) {
      console.error('Logout error:', error);
      toast({
        title: "Logout failed",
        description: "There was an error logging out. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleViewAllNotifications = () => {
    if (branchId) {
      const branchName = location.pathname.split('/')[3];
      navigate(`/branch-dashboard/${branchId}/${branchName}/notifications`);
    } else {
      navigate('/notifications');
    }
  };

  // Display user information
  const getUserDisplayName = () => {
    if (!userRole) return "Loading...";
    
    // Priority: fullName > first/last name > email
    if (userRole.fullName && userRole.fullName.trim()) {
      return userRole.fullName;
    }
    if (userRole.firstName || userRole.lastName) {
      return `${userRole.firstName || ''} ${userRole.lastName || ''}`.trim();
    }
    return userRole.email || "User";
  };

  const getUserRole = () => {
    if (!userRole) return "Loading...";
    
    switch (userRole.role) {
      case 'super_admin':
        return "Super Admin";
      case 'branch_admin':
        return "Branch Admin";
      case 'carer':
        return "Carer";
      case 'client':
        return "Client";
      default:
        return "User";
    }
  };
  
  return <header className="bg-white shadow-sm border-b border-gray-100 py-3 md:py-4 sticky top-0 z-50 w-full">
      <div className="container mx-auto px-4 flex justify-between items-center relative">
        {/* Logo aligned to the left - simplified for mobile */}
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
          <NotificationDropdown 
            branchId={branchId} 
            onViewAll={handleViewAllNotifications}
          />
        </div>
        
        {/* Mobile menu button */}
        <div className="md:hidden">
          <Button variant="outline" size="icon" className="text-blue-600 border border-blue-200 bg-white shadow-sm hover:bg-blue-50 rounded-full" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
            <Menu className="h-5 w-5" />
          </Button>
        </div>
        
        {/* Content aligned to the right - Fixed for mobile viewing */}
        <div className={`
            flex-col md:flex-row 
            fixed md:static 
            top-[56px] md:top-auto
            left-0 md:left-auto
            right-0 md:right-auto
            bg-white md:bg-transparent 
            py-4 md:py-0 
            border-b md:border-b-0 
            border-gray-100 
            shadow-md md:shadow-none 
            z-[500] md:z-auto
            ${mobileMenuOpen ? 'flex' : 'hidden md:flex'} 
            items-center md:items-center 
            gap-3 md:gap-5 
            px-6 md:px-0 
            md:justify-end
          `} style={{
            maxHeight: 'calc(100vh - 56px)',
            overflowY: 'auto'
          }}>
          
          {/* Search and Bell for mobile view */}
          <div className="flex items-center justify-between w-full md:hidden mb-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input 
                placeholder="Search..." 
                className="pl-10 pr-4 py-2 rounded-full bg-white border-gray-200"
                value={searchValue}
                onChange={(e) => setSearchValue(e.target.value)}
              />
            </div>
            <div className="ml-2">
              <NotificationDropdown 
                branchId={branchId} 
                onViewAll={handleViewAllNotifications}
              />
            </div>
          </div>
          
          <div className="flex items-center gap-3 bg-white/80 backdrop-blur-sm py-2 px-4 rounded-full border border-gray-100/60 shadow-sm w-full md:w-auto justify-between md:justify-start ml-0 md:ml-2">
            <div>
              <div className="text-gray-800 font-semibold">
                {location.pathname.startsWith('/system') ? 'Organization Super Admin' : (userRoleLoading ? 'Loading...' : getUserDisplayName())}
              </div>
              <div className="text-gray-500 text-xs font-medium">
                {location.pathname.startsWith('/system') ? 'admin@system.local' : (userRoleLoading ? 'Loading...' : getUserRole())}
              </div>
            </div>
            <div className="h-8 border-r border-gray-200/80 mx-1 hidden md:block"></div>
            <CustomButton variant="ghost" size="icon" className="flex items-center p-1.5 hover:bg-gray-100/80 text-gray-700 rounded-full transition-all" onClick={handleLogout}>
              <LogOut className="h-5 w-5" />
            </CustomButton>
          </div>
          
          {/* Mobile logout option */}
          <div className="md:hidden w-full">
            <Button variant="ghost" className="w-full flex justify-between items-center text-gray-700 hover:bg-gray-50/80 rounded-lg py-3" onClick={handleLogout}>
              <span className="font-medium">Logout</span>
              <LogOut className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </div>
    </header>;
}

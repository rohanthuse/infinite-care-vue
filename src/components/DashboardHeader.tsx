
import { LogOut, HelpCircle, Menu, Heart, Search, PanelRightOpen } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { CustomButton } from "@/components/ui/CustomButton";
import { Input } from "@/components/ui/input";
import { useState, useEffect, useRef } from "react";
import { NotificationDropdown } from "@/components/notifications/NotificationDropdown";
import { useAuth } from "@/hooks/useAuth";
import { useUserRole } from "@/hooks/useUserRole";
import { useToast } from "@/hooks/use-toast";
import { SidebarTrigger, useSidebar } from "@/components/ui/sidebar";
import { ThemeSwitcher } from "@/components/ui/theme-switcher";
import { useTenant } from "@/contexts/TenantContext";
import { BranchSearchDropdown } from "@/components/search/BranchSearchDropdown";
import { SuperAdminSearchDropdown } from "@/components/search/SuperAdminSearchDropdown";

export function DashboardHeader() {
  const navigate = useNavigate();
  const location = useLocation();
  const { signOut } = useAuth();
  const { data: userRole, isLoading: userRoleLoading } = useUserRole();
  const { toast } = useToast();
  
  // Safely get tenant context - may not be available in system-level routes
  let tenantSlug = null;
  try {
    const tenantContext = useTenant();
    tenantSlug = tenantContext.tenantSlug;
  } catch (error) {
    // Not in a tenant context (e.g., system dashboard), use null
    console.log('[DashboardHeader] Not in tenant context, using system-level routing');
  }
  
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchValue, setSearchValue] = useState("");
  const [searchDropdownOpen, setSearchDropdownOpen] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const mobileSearchInputRef = useRef<HTMLInputElement>(null);
  
  // Check if we're in a branch dashboard context where sidebar should be available
  const isBranchDashboard = location.pathname.includes('/branch-dashboard/');
  
  // Only use sidebar hooks if we're in branch dashboard context
  let sidebarState = null;
  try {
    if (isBranchDashboard) {
      sidebarState = useSidebar();
    }
  } catch (error) {
    // Sidebar provider not available, ignore
  }

  // Robust path parsing for branch context detection
  const parseBranchContext = () => {
    const pathParts = location.pathname.split('/').filter(Boolean);
    const branchDashboardIndex = pathParts.findIndex(part => part === 'branch-dashboard');
    
    if (branchDashboardIndex === -1) {
      return { tenantSlug: null, branchId: null, branchName: null, isBranchContext: false };
    }
    
    const tenantSlug = branchDashboardIndex > 0 ? pathParts[0] : null;
    const branchId = pathParts[branchDashboardIndex + 1] || null;
    const branchName = pathParts[branchDashboardIndex + 2] || null;
    
    return { 
      tenantSlug, 
      branchId, 
      branchName, 
      isBranchContext: true 
    };
  };

  const { branchId, branchName, isBranchContext } = parseBranchContext();
  
  // Detect if user is super admin on main dashboard (not in a branch context)
  const isSuperAdminDashboard = userRole?.role === 'super_admin' && !isBranchContext;

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
      toast({
        title: "Signing out...",
        description: "Please wait while we log you out.",
      });
      
      await signOut();
      
      toast({
        title: "Signed out successfully",
        description: "You have been logged out.",
      });
    } catch (error) {
      console.error('Logout error:', error);
      toast({
        title: "Logout Error", 
        description: "Forcing logout. Redirecting to home page.",
        variant: "destructive",
      });
      
      // Force logout by clearing everything and redirecting
      try {
        localStorage.clear();
        sessionStorage.clear();
      } catch (e) {
        console.warn('Failed to clear storage:', e);
      }
      
      setTimeout(() => {
        window.location.href = '/';
      }, 1000);
    }
  };

  const handleViewAllNotifications = () => {
    if (isBranchContext && branchId && branchName) {
      // Branch admin context - navigate to branch notifications
      const targetPath = tenantSlug 
        ? `/${tenantSlug}/branch-dashboard/${branchId}/${branchName}/notifications`
        : `/branch-dashboard/${branchId}/${branchName}/notifications`;
      navigate(targetPath);
    } else {
      // Non-branch context - navigate to general notifications
      const targetPath = tenantSlug ? `/${tenantSlug}/notifications` : '/notifications';
      navigate(targetPath);
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

  // Handle navigation back to admin dashboard
  const handleLogoClick = () => {
    // Super admins go to main dashboard with branch navigation
    if (userRole?.role === 'super_admin') {
      navigate('/dashboard');
      return;
    }
    
    // Other roles navigate to appropriate admin dashboard based on tenant context
    const adminPath = tenantSlug ? `/${tenantSlug}/dashboard` : '/dashboard';
    navigate(adminPath);
  };
  
  return <header className="bg-background shadow-sm border-b border-border py-3 md:py-4 sticky top-0 z-50 w-full">
      <div className="container mx-auto px-4 flex justify-between items-center relative">
        {/* Logo aligned to the left - simplified for mobile */}
        <div 
          className="flex items-center gap-2 md:gap-4 cursor-pointer hover:opacity-80 transition-opacity" 
          onClick={handleLogoClick}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              handleLogoClick();
            }
          }}
          aria-label="Return to Admin Dashboard"
        >
          <img src="/lovable-uploads/3c8cdaf9-5267-424f-af69-9a1ce56b7ec5.png" alt="Med-Infinite Logo" className="w-8 h-8 md:w-10 md:h-10" />
          <div className="flex flex-col">
            <h2 className="text-sm md:text-lg font-bold tracking-tight">
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
              ref={searchInputRef}
              placeholder={isSuperAdminDashboard 
                ? "Search branches, admins, system modules..." 
                : "Search clients, carers, bookings, documents..."
              }
              className="pl-10 pr-4 py-2 rounded-full bg-background border-border w-full transition-all duration-300"
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
            
            {/* Dropdown renders here */}
            {searchDropdownOpen && searchValue.trim().length >= 2 && (
              isSuperAdminDashboard ? (
                <SuperAdminSearchDropdown
                  searchValue={searchValue}
                  onClose={() => setSearchDropdownOpen(false)}
                  onResultClick={() => {
                    setSearchValue("");
                    setSearchDropdownOpen(false);
                  }}
                  anchorRef={searchInputRef}
                />
              ) : isBranchContext && branchId ? (
                <BranchSearchDropdown
                  searchValue={searchValue}
                  onClose={() => setSearchDropdownOpen(false)}
                  onResultClick={() => {
                    setSearchValue("");
                    setSearchDropdownOpen(false);
                  }}
                  branchId={branchId}
                  branchName={branchName || ''}
                  anchorRef={searchInputRef}
                />
              ) : null
            )}
          </div>
        </div>
        
        {/* Bell notification, theme switcher and sidebar trigger on right for desktop view */}
        <div className="hidden md:flex items-center gap-2">
          <NotificationDropdown 
            branchId={branchId} 
            onViewAll={handleViewAllNotifications}
          />
          <ThemeSwitcher />
          {isBranchDashboard && sidebarState && (
            <SidebarTrigger className="h-9 w-9 text-primary hover:bg-primary/10" />
          )}
        </div>
        
        {/* Mobile menu button */}
        <div className="md:hidden">
          <Button variant="outline" size="icon" className="text-primary border border-border bg-card shadow-sm hover:bg-accent rounded-full" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
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
            bg-card md:bg-transparent 
            py-4 md:py-0 
            border-b md:border-b-0 
            border-border
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
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input 
                ref={mobileSearchInputRef}
                placeholder="Search clients, carers, bookings, documents..." 
                className="pl-10 pr-4 py-2 rounded-full bg-background border-border"
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
              
              {/* Mobile Dropdown */}
              {searchDropdownOpen && searchValue.trim().length >= 2 && isBranchContext && branchId && (
                <BranchSearchDropdown
                  searchValue={searchValue}
                  onClose={() => setSearchDropdownOpen(false)}
                  onResultClick={() => {
                    setSearchValue("");
                    setSearchDropdownOpen(false);
                  }}
                  branchId={branchId}
                  branchName={branchName}
                  anchorRef={mobileSearchInputRef}
                />
              )}
            </div>
            <div className="ml-2 flex items-center gap-2">
              <NotificationDropdown 
                branchId={branchId} 
                onViewAll={handleViewAllNotifications}
              />
              <ThemeSwitcher />
            </div>
          </div>
          
          <div className="flex items-center gap-3 bg-card/80 backdrop-blur-sm py-2 px-4 rounded-full border border-border/60 shadow-sm w-full md:w-auto justify-between md:justify-start ml-0 md:ml-2">
            <div>
              <div className="text-foreground font-semibold">
                {location.pathname.startsWith('/system') ? 'Organisation Super Admin' : (userRoleLoading ? 'Loading...' : getUserDisplayName())}
              </div>
              <div className="text-muted-foreground text-xs font-medium">
                {location.pathname.startsWith('/system') ? 'admin@system.local' : (userRoleLoading ? 'Loading...' : getUserRole())}
              </div>
            </div>
            <div className="h-8 border-r border-border/80 mx-1 hidden md:block"></div>
            <CustomButton variant="ghost" size="icon" className="flex items-center p-1.5 hover:bg-accent text-foreground rounded-full transition-all" onClick={handleLogout}>
              <LogOut className="h-5 w-5" />
            </CustomButton>
          </div>
          
          {/* Mobile logout option */}
          <div className="md:hidden w-full">
            <Button variant="ghost" className="w-full flex justify-between items-center text-foreground hover:bg-accent rounded-lg py-3" onClick={handleLogout}>
              <span className="font-medium">Logout</span>
              <LogOut className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </div>

    </header>;
}

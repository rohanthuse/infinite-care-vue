
import { LogOut, HelpCircle, Menu, Heart, Search, PanelRightOpen } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { CustomButton } from "@/components/ui/CustomButton";
import { Input } from "@/components/ui/input";
import { useState, useEffect, useRef } from "react";
import { NotificationDropdown } from "@/components/notifications/NotificationDropdown";
import { SystemNotifications } from "@/components/system/SystemNotifications";
import { useAuth } from "@/hooks/useAuth";
import { useUserRole } from "@/hooks/useUserRole";
import { useToast } from "@/hooks/use-toast";
import { SidebarTrigger, useSidebar } from "@/components/ui/sidebar";
import { ThemeSwitcher } from "@/components/ui/theme-switcher";
import { useTenant } from "@/contexts/TenantContext";
import { BranchSearchDropdown } from "@/components/search/BranchSearchDropdown";
import { SuperAdminSearchDropdown } from "@/components/search/SuperAdminSearchDropdown";
import { SystemPortalSearchDropdown } from "@/components/search/SystemPortalSearchDropdown";
import { supabase } from "@/integrations/supabase/client";

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
  const [organizationId, setOrganizationId] = useState<string | null>(null);
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
    // Decode branchName to prevent double encoding when passed to search components
    const branchName = pathParts[branchDashboardIndex + 2] 
      ? decodeURIComponent(pathParts[branchDashboardIndex + 2]) 
      : null;
    
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
  
  // Detect if we're in the System Portal
  const isSystemPortal = location.pathname.startsWith('/system-dashboard');

  // Fetch organization ID when in organization context (not branch context)
  useEffect(() => {
    const fetchOrganizationId = async () => {
      // Only fetch if we're NOT in a branch context and have a tenant slug
      if (isBranchContext || !tenantSlug) {
        setOrganizationId(null);
        return;
      }

      try {
        const { data: org, error } = await supabase
          .from('organizations')
          .select('id')
          .eq('slug', tenantSlug)
          .single();

        if (error) {
          console.warn('[DashboardHeader] Error fetching organization:', error);
          setOrganizationId(null);
          return;
        }

        if (org) {
          setOrganizationId(org.id);
        }
      } catch (error) {
        console.error('[DashboardHeader] Error in fetchOrganizationId:', error);
        setOrganizationId(null);
      }
    };

    fetchOrganizationId();
  }, [tenantSlug, isBranchContext]);

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

  // Helper function to format role names
  const formatRoleName = (role: string): string => {
    const roleMap: Record<string, string> = {
      'owner': 'Owner',
      'admin': 'Admin',
      'manager': 'Manager',
      'member': 'Member',
      'branch_admin': 'Branch Admin',
      'super_admin': 'Super Admin',
      'carer': 'Carer',
      'client': 'Client'
    };
    return roleMap[role] || role.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  const getUserRole = () => {
    if (!userRole) return "Loading...";
    
    // Try to get cached organization role first
    const cachedOrgRole = sessionStorage.getItem('cached_org_role');
    const cachedTimestamp = sessionStorage.getItem('cached_org_role_timestamp');
    
    // Use cached role if it's less than 10 seconds old (matches org data cache TTL)
    if (cachedOrgRole && cachedTimestamp) {
      const age = Date.now() - parseInt(cachedTimestamp);
      if (age < 10000) {
        return formatRoleName(cachedOrgRole);
      }
    }
    
    // Fallback to system roles from useUserRole hook
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
    // All admin roles navigate to tenant-aware dashboard
    const adminPath = tenantSlug ? `/${tenantSlug}/dashboard` : '/dashboard';
    navigate(adminPath);
  };
  
  return <header className="bg-gradient-to-r from-background via-background to-blue-50/30 dark:to-blue-950/20 shadow-sm shadow-blue-100/20 dark:shadow-blue-900/10 border-b border-border py-3 md:py-4 fixed top-0 left-0 right-0 z-50 w-full after:absolute after:bottom-0 after:left-0 after:right-0 after:h-[2px] after:bg-gradient-to-r after:from-blue-500 after:via-cyan-500 after:to-emerald-500">
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
              placeholder={isSystemPortal 
                ? "Search tenants, users, agreements, subscriptions..." 
                : isSuperAdminDashboard 
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
              isSystemPortal ? (
                <SystemPortalSearchDropdown
                  searchValue={searchValue}
                  onClose={() => setSearchDropdownOpen(false)}
                  onResultClick={() => {
                    setSearchValue("");
                    setSearchDropdownOpen(false);
                  }}
                  anchorRef={searchInputRef}
                />
              ) : isSuperAdminDashboard ? (
                <SuperAdminSearchDropdown
                  searchValue={searchValue}
                  onClose={() => setSearchDropdownOpen(false)}
                  onResultClick={() => {
                    setSearchValue("");
                    setSearchDropdownOpen(false);
                  }}
                  anchorRef={searchInputRef}
                  tenantSlug={tenantSlug}
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
          {isSystemPortal ? (
            <SystemNotifications />
          ) : (
            <NotificationDropdown 
              branchId={branchId || undefined} 
              organizationId={!isBranchContext ? organizationId || undefined : undefined}
              onViewAll={handleViewAllNotifications}
            />
          )}
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
                placeholder={isSystemPortal 
                  ? "Search tenants, users, agreements..." 
                  : "Search clients, carers, bookings, documents..."
                }
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
              {searchDropdownOpen && searchValue.trim().length >= 2 && (
                isSystemPortal ? (
                  <SystemPortalSearchDropdown
                    searchValue={searchValue}
                    onClose={() => setSearchDropdownOpen(false)}
                    onResultClick={() => {
                      setSearchValue("");
                      setSearchDropdownOpen(false);
                    }}
                    anchorRef={mobileSearchInputRef}
                  />
                ) : isSuperAdminDashboard ? (
                  <SuperAdminSearchDropdown
                    searchValue={searchValue}
                    onClose={() => setSearchDropdownOpen(false)}
                    onResultClick={() => {
                      setSearchValue("");
                      setSearchDropdownOpen(false);
                    }}
                    anchorRef={mobileSearchInputRef}
                    tenantSlug={tenantSlug}
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
                    anchorRef={mobileSearchInputRef}
                  />
                ) : null
              )}
            </div>
            <div className="ml-2 flex items-center gap-2">
              {isSystemPortal ? (
                <SystemNotifications />
              ) : (
                <NotificationDropdown 
                  branchId={branchId || undefined} 
                  organizationId={!isBranchContext ? organizationId || undefined : undefined}
                  onViewAll={handleViewAllNotifications}
                />
              )}
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

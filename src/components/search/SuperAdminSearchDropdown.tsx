import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { 
  Users, 
  Building2, 
  Settings, 
  BarChart, 
  LayoutDashboard,
  Loader2,
  User
} from "lucide-react";
import { useSuperAdminSearch } from "@/hooks/useSuperAdminSearch";
import { SearchDropdownItem } from "./SearchDropdownItem";
import { cn } from "@/lib/utils";

interface ModuleShortcut {
  name: string;
  keywords: string[];
  path: string;
  icon: any;
}

const superAdminModules: ModuleShortcut[] = [
  { name: 'Dashboard Home', keywords: ['home', 'dashboard', 'main'], path: '/dashboard', icon: LayoutDashboard },
  { name: 'Tenant Users', keywords: ['user', 'tenant user', 'admin'], path: '/system/users', icon: Users },
  { name: 'System Tenants', keywords: ['tenant', 'organization', 'company'], path: '/system/tenants', icon: Building2 },
  { name: 'System Settings', keywords: ['setting', 'config', 'system'], path: '/system/settings', icon: Settings },
  { name: 'System Analytics', keywords: ['analytic', 'stats', 'report'], path: '/system/analytics', icon: BarChart },
];

interface SuperAdminSearchDropdownProps {
  searchValue: string;
  onClose: () => void;
  onResultClick: () => void;
  anchorRef: React.RefObject<HTMLInputElement>;
}

export function SuperAdminSearchDropdown({
  searchValue,
  onClose,
  onResultClick,
  anchorRef
}: SuperAdminSearchDropdownProps) {
  const navigate = useNavigate();
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  
  const { 
    branches, 
    admins, 
    isLoading
  } = useSuperAdminSearch(searchValue);

  // Get matching module shortcuts
  const matchingModules = superAdminModules.filter(module =>
    module.keywords.some(keyword => 
      keyword.includes(searchValue.toLowerCase()) || 
      searchValue.toLowerCase().includes(keyword)
    )
  );

  // Limit results
  const limitedBranches = branches.slice(0, 5);
  const limitedAdmins = admins.slice(0, 5);

  // Build flat array of all results for keyboard navigation
  const allResults = [
    ...matchingModules.map(m => ({ ...m, type: 'module' as const })),
    ...limitedBranches.map(b => ({ ...b, type: 'branch' as const })),
    ...limitedAdmins.map(a => ({ ...a, type: 'admin' as const }))
  ];

  const handleNavigate = (result: any) => {
    if (result.type === 'module') {
      navigate(result.path);
    } else if (result.type === 'branch') {
      // Navigate to branch dashboard
      const currentPath = window.location.pathname;
      const pathParts = currentPath.split('/').filter(Boolean);
      
      // Check if current URL has a valid tenant slug (not 'dashboard', 'system', etc.)
      let tenantSlug = null;
      if (pathParts.length > 0 && !['dashboard', 'system', 'login'].includes(pathParts[0])) {
        tenantSlug = pathParts[0];
      }
      
      // Construct the navigation path
      const navigationPath = tenantSlug 
        ? `/${tenantSlug}/branch-dashboard/${result.id}/${encodeURIComponent(result.name)}`
        : `/branch-dashboard/${result.id}/${encodeURIComponent(result.name)}`;
      
      navigate(navigationPath);
    } else if (result.type === 'admin') {
      // Navigate to dashboard with admin highlighted
      navigate('/dashboard', { state: { highlightAdminId: result.id } });
    }
    onResultClick();
  };

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex(prev => Math.min(prev + 1, allResults.length - 1));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex(prev => Math.max(prev - 1, -1));
      } else if (e.key === 'Enter' && selectedIndex >= 0) {
        e.preventDefault();
        handleNavigate(allResults[selectedIndex]);
      } else if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedIndex, allResults]);

  // Click outside to close
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        dropdownRef.current && 
        !dropdownRef.current.contains(e.target as Node) &&
        anchorRef.current &&
        !anchorRef.current.contains(e.target as Node)
      ) {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [onClose]);

  // Calculate position
  const [dropdownStyle, setDropdownStyle] = useState<React.CSSProperties>({});
  
  useEffect(() => {
    if (anchorRef.current) {
      const rect = anchorRef.current.getBoundingClientRect();
      setDropdownStyle({
        position: 'fixed',
        top: `${rect.bottom + 8}px`,
        left: `${rect.left}px`,
        width: `${rect.width}px`,
        zIndex: 9999
      });
    }
  }, [searchValue]);

  const totalResults = matchingModules.length + limitedBranches.length + limitedAdmins.length;

  if (totalResults === 0 && !isLoading) {
    return (
      <div
        ref={dropdownRef}
        style={dropdownStyle}
        className="bg-popover border border-border rounded-lg shadow-lg p-4 text-center text-muted-foreground"
      >
        No results found for "{searchValue}"
      </div>
    );
  }

  return (
    <div
      ref={dropdownRef}
      style={dropdownStyle}
      className="bg-popover border border-border rounded-lg shadow-lg overflow-hidden"
    >
      <div className="max-h-[400px] overflow-y-auto p-2">
        {isLoading ? (
          <div className="flex items-center justify-center py-8 text-muted-foreground">
            <Loader2 className="h-5 w-5 animate-spin mr-2" />
            Searching...
          </div>
        ) : (
          <>
            {/* Module Shortcuts */}
            {matchingModules.length > 0 && (
              <div className="mb-2">
                <div className="px-3 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  System Modules
                </div>
                {matchingModules.map((module, index) => (
                  <SearchDropdownItem
                    key={`module-${index}`}
                    icon={module.icon}
                    title={module.name}
                    onClick={() => handleNavigate(module)}
                    isSelected={selectedIndex === index}
                    type="module"
                  />
                ))}
              </div>
            )}

            {/* Branches */}
            {limitedBranches.length > 0 && (
              <div className="mb-2">
                <div className="px-3 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Branches
                  {branches.length > 5 && (
                    <span className="ml-2 text-xs font-normal">
                      (Showing 5 of {branches.length})
                    </span>
                  )}
                </div>
                {limitedBranches.map((branch, index) => (
                  <SearchDropdownItem
                    key={branch.id}
                    icon={Building2}
                    title={branch.name}
                    subtitle={`${branch.branch_type} • ${branch.country}`}
                    badge={branch.status}
                    onClick={() => handleNavigate(branch)}
                    isSelected={selectedIndex === matchingModules.length + index}
                    type="client"
                  />
                ))}
              </div>
            )}

            {/* Branch Administrators */}
            {limitedAdmins.length > 0 && (
              <div>
                <div className="px-3 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Branch Administrators
                  {admins.length > 5 && (
                    <span className="ml-2 text-xs font-normal">
                      (Showing 5 of {admins.length})
                    </span>
                  )}
                </div>
                {limitedAdmins.map((admin, index) => (
                  <SearchDropdownItem
                    key={admin.id}
                    icon={User}
                    title={admin.full_name}
                    subtitle={admin.email}
                    badge={admin.branch_name || 'No Branch'}
                    onClick={() => handleNavigate(admin)}
                    isSelected={selectedIndex === matchingModules.length + limitedBranches.length + index}
                    type="staff"
                  />
                ))}
              </div>
            )}
          </>
        )}
      </div>

      {/* Footer with result count */}
      {!isLoading && totalResults > 0 && (
        <div className="border-t border-border px-3 py-2 text-xs text-muted-foreground bg-muted/30">
          {totalResults} result{totalResults !== 1 ? 's' : ''} found
        </div>
      )}
    </div>
  );
}

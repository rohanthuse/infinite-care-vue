import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { 
  Building2, 
  User, 
  FileSignature, 
  CreditCard, 
  LayoutDashboard,
  Settings,
  BarChart,
  Loader2,
  Users
} from "lucide-react";
import { useSystemPortalSearch } from "@/hooks/useSystemPortalSearch";
import { SearchDropdownItem } from "./SearchDropdownItem";
import { cn } from "@/lib/utils";

interface ModuleShortcut {
  name: string;
  keywords: string[];
  path: string;
  icon: any;
}

const systemPortalModules: ModuleShortcut[] = [
  { name: 'Dashboard', keywords: ['dashboard', 'home', 'overview'], path: '/system-dashboard', icon: LayoutDashboard },
  { name: 'Tenants', keywords: ['tenant', 'organization', 'company'], path: '/system-dashboard/tenants', icon: Building2 },
  { name: 'Users', keywords: ['user', 'admin', 'people'], path: '/system-dashboard/users', icon: Users },
  { name: 'Agreements', keywords: ['agreement', 'contract', 'sign'], path: '/system-dashboard/tenant-agreements', icon: FileSignature },
  { name: 'Subscriptions', keywords: ['subscription', 'plan', 'pricing', 'billing'], path: '/system-dashboard/subscription-plans', icon: CreditCard },
  { name: 'Analytics', keywords: ['analytic', 'stats', 'report', 'data'], path: '/system-dashboard/analytics', icon: BarChart },
  { name: 'Settings', keywords: ['setting', 'config', 'preference'], path: '/system-dashboard/settings', icon: Settings },
];

interface SystemPortalSearchDropdownProps {
  searchValue: string;
  onClose: () => void;
  onResultClick: () => void;
  anchorRef: React.RefObject<HTMLInputElement>;
}

export function SystemPortalSearchDropdown({
  searchValue,
  onClose,
  onResultClick,
  anchorRef
}: SystemPortalSearchDropdownProps) {
  const navigate = useNavigate();
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  
  const { 
    tenants, 
    users, 
    agreements, 
    subscriptions,
    isLoading,
    totalResults
  } = useSystemPortalSearch(searchValue);

  // Get matching module shortcuts
  const matchingModules = systemPortalModules.filter(module =>
    module.keywords.some(keyword => 
      keyword.includes(searchValue.toLowerCase()) || 
      searchValue.toLowerCase().includes(keyword)
    )
  );

  // Limit results to top 10 per category
  const limitedTenants = tenants.slice(0, 10);
  const limitedUsers = users.slice(0, 10);
  const limitedAgreements = agreements.slice(0, 10);
  const limitedSubscriptions = subscriptions.slice(0, 10);

  // Build flat array of all results for keyboard navigation
  const allResults = [
    ...matchingModules.map(m => ({ ...m, type: 'module' as const })),
    ...limitedTenants.map(t => ({ ...t, type: 'tenant' as const })),
    ...limitedUsers.map(u => ({ ...u, type: 'user' as const })),
    ...limitedAgreements.map(a => ({ ...a, type: 'agreement' as const })),
    ...limitedSubscriptions.map(s => ({ ...s, type: 'subscription' as const }))
  ];

  const handleNavigate = (result: any) => {
    let targetPath = '';
    if (result.type === 'module') {
      targetPath = result.path;
    } else if (result.type === 'tenant') {
      targetPath = `/system-dashboard/tenants?selected=${result.id}`;
    } else if (result.type === 'user') {
      targetPath = `/system-dashboard/users?selected=${result.id}`;
    } else if (result.type === 'agreement') {
      targetPath = `/system-dashboard/tenant-agreements?selected=${result.id}`;
    } else if (result.type === 'subscription') {
      targetPath = `/system-dashboard/subscription-plans?selected=${result.id}`;
    }
    
    navigate(targetPath);
    requestAnimationFrame(() => {
      onResultClick();
    });
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

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [selectedIndex, allResults, onClose]);

  // Click outside to close
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      setTimeout(() => {
        if (
          dropdownRef.current && 
          !dropdownRef.current.contains(e.target as Node) &&
          anchorRef.current &&
          !anchorRef.current.contains(e.target as Node)
        ) {
          onClose();
        }
      }, 100);
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [onClose, anchorRef]);

  // Calculate position
  const [position, setPosition] = useState({ top: 0, left: 0, width: 0 });

  useEffect(() => {
    if (anchorRef.current) {
      const rect = anchorRef.current.getBoundingClientRect();
      setPosition({
        top: rect.bottom + 8,
        left: rect.left,
        width: Math.max(rect.width, 500)
      });
    }
  }, [anchorRef]);

  const hasResults = totalResults > 0 || matchingModules.length > 0;

  return (
    <div
      ref={dropdownRef}
      className={cn(
        "fixed bg-card border border-border rounded-lg shadow-lg z-[100]",
        "animate-in fade-in-0 zoom-in-95 duration-200",
        "max-h-[400px] overflow-y-auto"
      )}
      style={{
        top: `${position.top}px`,
        left: `${position.left}px`,
        width: `${position.width}px`
      }}
    >
      <div className="p-2">
        {isLoading ? (
          <div className="flex items-center justify-center py-8 text-muted-foreground">
            <Loader2 className="h-5 w-5 animate-spin mr-2" />
            <span className="text-sm">Searching system portal...</span>
          </div>
        ) : !hasResults ? (
          <div className="py-8 text-center text-muted-foreground">
            <p className="text-sm font-medium mb-2">No results for "{searchValue}"</p>
            <div className="text-xs space-y-1">
              <p>Try searching for:</p>
              <p>• Tenant name or slug</p>
              <p>• User email or name</p>
              <p>• Agreement title</p>
              <p>• Subscription plan name</p>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            {/* Module Shortcuts */}
            {matchingModules.length > 0 && (
              <div>
                <div className="px-3 py-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  📍 Quick Navigation
                </div>
                <div className="space-y-1">
                  {matchingModules.map((module, idx) => (
                    <SearchDropdownItem
                      key={`module-${idx}`}
                      icon={module.icon}
                      title={module.name}
                      onClick={() => handleNavigate({ ...module, type: 'module' })}
                      isSelected={selectedIndex === idx}
                      type="module"
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Tenants */}
            {limitedTenants.length > 0 && (
              <div>
                <div className="px-3 py-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground border-t border-border pt-3">
                  🏢 Tenants ({tenants.length})
                </div>
                <div className="space-y-1">
                  {limitedTenants.map((tenant, idx) => {
                    const globalIdx = matchingModules.length + idx;
                    return (
                      <SearchDropdownItem
                        key={tenant.id}
                        icon={Building2}
                        title={tenant.name}
                        subtitle={`${tenant.slug} • ${tenant.subscription_plan}`}
                        badge={tenant.status}
                        onClick={() => handleNavigate({ ...tenant, type: 'tenant' })}
                        isSelected={selectedIndex === globalIdx}
                        type="client"
                      />
                    );
                  })}
                </div>
                {tenants.length > 10 && (
                  <button
                    onClick={() => {
                      navigate('/system-dashboard/tenants');
                      onResultClick();
                    }}
                    className="w-full text-xs text-primary hover:underline py-2 text-center"
                  >
                    View all {tenants.length} tenants →
                  </button>
                )}
              </div>
            )}

            {/* Users */}
            {limitedUsers.length > 0 && (
              <div>
                <div className="px-3 py-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground border-t border-border pt-3">
                  👤 Users ({users.length})
                </div>
                <div className="space-y-1">
                  {limitedUsers.map((user, idx) => {
                    const globalIdx = matchingModules.length + limitedTenants.length + idx;
                    return (
                      <SearchDropdownItem
                        key={user.id}
                        icon={User}
                        title={user.name}
                        subtitle={`${user.email} • ${user.tenant_name}`}
                        badge={user.is_active ? 'Active' : 'Inactive'}
                        onClick={() => handleNavigate({ ...user, type: 'user' })}
                        isSelected={selectedIndex === globalIdx}
                        type="staff"
                      />
                    );
                  })}
                </div>
                {users.length > 10 && (
                  <button
                    onClick={() => {
                      navigate('/system-dashboard/users');
                      onResultClick();
                    }}
                    className="w-full text-xs text-primary hover:underline py-2 text-center"
                  >
                    View all {users.length} users →
                  </button>
                )}
              </div>
            )}

            {/* Agreements */}
            {limitedAgreements.length > 0 && (
              <div>
                <div className="px-3 py-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground border-t border-border pt-3">
                  📄 Agreements ({agreements.length})
                </div>
                <div className="space-y-1">
                  {limitedAgreements.map((agreement, idx) => {
                    const globalIdx = matchingModules.length + limitedTenants.length + limitedUsers.length + idx;
                    return (
                      <SearchDropdownItem
                        key={agreement.id}
                        icon={FileSignature}
                        title={agreement.title}
                        subtitle={agreement.tenant_name}
                        badge={agreement.status}
                        onClick={() => handleNavigate({ ...agreement, type: 'agreement' })}
                        isSelected={selectedIndex === globalIdx}
                        type="document"
                      />
                    );
                  })}
                </div>
                {agreements.length > 10 && (
                  <button
                    onClick={() => {
                      navigate('/system-dashboard/tenant-agreements');
                      onResultClick();
                    }}
                    className="w-full text-xs text-primary hover:underline py-2 text-center"
                  >
                    View all {agreements.length} agreements →
                  </button>
                )}
              </div>
            )}

            {/* Subscriptions */}
            {limitedSubscriptions.length > 0 && (
              <div>
                <div className="px-3 py-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground border-t border-border pt-3">
                  💳 Subscriptions ({subscriptions.length})
                </div>
                <div className="space-y-1">
                  {limitedSubscriptions.map((subscription, idx) => {
                    const globalIdx = matchingModules.length + limitedTenants.length + limitedUsers.length + limitedAgreements.length + idx;
                    return (
                      <SearchDropdownItem
                        key={subscription.id}
                        icon={CreditCard}
                        title={subscription.name}
                        subtitle={`£${subscription.price_monthly}/month`}
                        badge={subscription.is_active ? 'Active' : 'Inactive'}
                        onClick={() => handleNavigate({ ...subscription, type: 'subscription' })}
                        isSelected={selectedIndex === globalIdx}
                        type="booking"
                      />
                    );
                  })}
                </div>
                {subscriptions.length > 10 && (
                  <button
                    onClick={() => {
                      navigate('/system-dashboard/subscription-plans');
                      onResultClick();
                    }}
                    className="w-full text-xs text-primary hover:underline py-2 text-center"
                  >
                    View all {subscriptions.length} subscriptions →
                  </button>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Footer with result count */}
      {!isLoading && hasResults && (
        <div className="border-t border-border px-3 py-2 text-xs text-muted-foreground bg-muted/30">
          {totalResults + matchingModules.length} result{(totalResults + matchingModules.length) !== 1 ? 's' : ''} found
        </div>
      )}
    </div>
  );
}

import { useEffect, useState, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { 
  User, 
  Users, 
  Calendar, 
  FileText, 
  Pill, 
  ClipboardList, 
  LayoutDashboard,
  Loader2,
  Heart,
  FileSignature,
  MessageCircle,
  Star,
  Clock,
  BookOpen
} from "lucide-react";
import { useBranchSearch } from "@/hooks/useBranchSearch";
import { SearchDropdownItem } from "./SearchDropdownItem";
import { cn } from "@/lib/utils";

interface ModuleShortcut {
  name: string;
  keywords: string[];
  path: string;
  icon: any;
}

const moduleShortcuts: ModuleShortcut[] = [
  { name: 'Clients Management', keywords: ['client', 'cli', 'customer'], path: '/clients', icon: User },
  { name: 'Carers Management', keywords: ['carer', 'car', 'staff', 'nurse'], path: '/carers', icon: Users },
  { name: 'Schedule & Bookings', keywords: ['book', 'schedule', 'appointment'], path: '/bookings', icon: Calendar },
  { name: 'Documents', keywords: ['doc', 'document', 'file'], path: '/documents', icon: FileText },
  { name: 'Medication Management', keywords: ['med', 'medication', 'prescription'], path: '/medication', icon: Pill },
  { name: 'Reports', keywords: ['report', 'service', 'serv'], path: '/reports', icon: ClipboardList },
  { name: 'Branch Overview', keywords: ['overview', 'dashboard', 'home'], path: '', icon: LayoutDashboard },
  { name: 'Care Plans', keywords: ['care', 'plan', 'careplan'], path: '/care-plan', icon: Heart },
  { name: 'Agreements', keywords: ['agreement', 'contract', 'sign'], path: '/agreements', icon: FileSignature },
  { name: 'Communication', keywords: ['comm', 'message', 'chat'], path: '/communication', icon: MessageCircle },
  { name: 'Reviews & Feedback', keywords: ['review', 'feedback', 'rating'], path: '/reviews', icon: Star },
  { name: 'Attendance', keywords: ['attend', 'attendance', 'checkin'], path: '/attendance', icon: Clock },
  { name: 'Library', keywords: ['library', 'resource'], path: '/library', icon: BookOpen },
];

interface BranchSearchDropdownProps {
  searchValue: string;
  onClose: () => void;
  onResultClick: () => void;
  branchId: string;
  branchName: string;
  anchorRef: React.RefObject<HTMLInputElement>;
}

export function BranchSearchDropdown({
  searchValue,
  onClose,
  onResultClick,
  branchId,
  branchName,
  anchorRef
}: BranchSearchDropdownProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  
  const { 
    clientResults, 
    staffResults, 
    bookingResults, 
    documentResults,
    isLoading,
    totalResults
  } = useBranchSearch(branchId, searchValue);

  // Get matching module shortcuts
  const matchingModules = moduleShortcuts.filter(module =>
    module.keywords.some(keyword => 
      keyword.includes(searchValue.toLowerCase()) || 
      searchValue.toLowerCase().includes(keyword)
    )
  );

  // Limit results to top 5 per category
  const limitedClients = clientResults.slice(0, 5);
  const limitedStaff = staffResults.slice(0, 5);
  const limitedBookings = bookingResults.slice(0, 5);
  const limitedDocuments = documentResults.slice(0, 5);

  // Build flat array of all results for keyboard navigation
  const allResults = [
    ...matchingModules.map(m => ({ ...m, type: 'module' as const })),
    ...limitedClients,
    ...limitedStaff,
    ...limitedBookings,
    ...limitedDocuments
  ];

  // URL encode the branch name to handle spaces and special characters
  const tenantSlug = location.pathname.split('/')[1];
  const encodedBranchName = encodeURIComponent(branchName);
  const basePath = `/${tenantSlug}/branch-dashboard/${branchId}/${encodedBranchName}`;

  const handleNavigate = (result: any) => {
    console.log('[BranchSearchDropdown] handleNavigate called:', { 
      type: result.type, 
      id: result.id, 
      basePath,
      branchName,
      encodedBranchName
    });
    
    let targetPath = '';
    if (result.type === 'module') {
      targetPath = `${basePath}${result.path}`;
    } else if (result.type === 'client') {
      targetPath = `${basePath}/clients?selected=${result.id}`;
    } else if (result.type === 'staff') {
      targetPath = `${basePath}/carers?selected=${result.id}`;
    } else if (result.type === 'booking') {
      targetPath = `${basePath}/bookings?selected=${result.id}`;
    } else if (result.type === 'document') {
      targetPath = `${basePath}/documents?selected=${result.id}`;
    }
    
    console.log('[BranchSearchDropdown] Navigating to:', targetPath);
    
    // Navigate FIRST, then close dropdown
    navigate(targetPath);
    
    // Close after navigation has started
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

  // Click outside to close - use timeout to allow click handlers to fire first
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      // Use longer timeout to allow click handlers on dropdown items to fire first
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
      // For fixed positioning, use viewport coordinates directly (no scroll offsets)
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
            <span className="text-sm">Searching...</span>
          </div>
        ) : !hasResults ? (
          <div className="py-8 text-center text-muted-foreground">
            <p className="text-sm font-medium mb-2">No results for "{searchValue}"</p>
            <div className="text-xs space-y-1">
              <p>Try searching for:</p>
              <p>• Client name or email</p>
              <p>• Carer name</p>
              <p>• Booking date or ID</p>
              <p>• Document name</p>
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
                      onClick={() => handleNavigate(module)}
                      isSelected={selectedIndex === idx}
                      type="module"
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Clients */}
            {limitedClients.length > 0 && (
              <div>
                <div className="px-3 py-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground border-t border-border pt-3">
                  👤 Clients ({clientResults.length})
                </div>
                <div className="space-y-1">
                  {limitedClients.map((client, idx) => {
                    const globalIdx = matchingModules.length + idx;
                    return (
                      <SearchDropdownItem
                        key={client.id}
                        icon={User}
                        title={client.title}
                        subtitle={client.subtitle}
                        badge={client.status}
                        onClick={() => handleNavigate(client)}
                        isSelected={selectedIndex === globalIdx}
                        type="client"
                      />
                    );
                  })}
                </div>
                {clientResults.length > 5 && (
                  <button
                    onClick={() => {
                      navigate(`${basePath}/clients`);
                      onResultClick();
                    }}
                    className="w-full text-xs text-primary hover:underline py-2 text-center"
                  >
                    View all {clientResults.length} clients →
                  </button>
                )}
              </div>
            )}

            {/* Staff/Carers */}
            {limitedStaff.length > 0 && (
              <div>
                <div className="px-3 py-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground border-t border-border pt-3">
                  👥 Carers ({staffResults.length})
                </div>
                <div className="space-y-1">
                  {limitedStaff.map((staff, idx) => {
                    const globalIdx = matchingModules.length + limitedClients.length + idx;
                    return (
                      <SearchDropdownItem
                        key={staff.id}
                        icon={Users}
                        title={staff.title}
                        subtitle={staff.subtitle}
                        badge={staff.status}
                        onClick={() => handleNavigate(staff)}
                        isSelected={selectedIndex === globalIdx}
                        type="staff"
                      />
                    );
                  })}
                </div>
                {staffResults.length > 5 && (
                  <button
                    onClick={() => {
                      navigate(`${basePath}/carers`);
                      onResultClick();
                    }}
                    className="w-full text-xs text-primary hover:underline py-2 text-center"
                  >
                    View all {staffResults.length} carers →
                  </button>
                )}
              </div>
            )}

            {/* Bookings */}
            {limitedBookings.length > 0 && (
              <div>
                <div className="px-3 py-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground border-t border-border pt-3">
                  📅 Bookings ({bookingResults.length})
                </div>
                <div className="space-y-1">
                  {limitedBookings.map((booking, idx) => {
                    const globalIdx = matchingModules.length + limitedClients.length + limitedStaff.length + idx;
                    return (
                      <SearchDropdownItem
                        key={booking.id}
                        icon={Calendar}
                        title={booking.title}
                        subtitle={booking.subtitle}
                        badge={booking.status}
                        onClick={() => handleNavigate(booking)}
                        isSelected={selectedIndex === globalIdx}
                        type="booking"
                      />
                    );
                  })}
                </div>
                {bookingResults.length > 5 && (
                  <button
                    onClick={() => {
                      navigate(`${basePath}/bookings`);
                      onResultClick();
                    }}
                    className="w-full text-xs text-primary hover:underline py-2 text-center"
                  >
                    View all {bookingResults.length} bookings →
                  </button>
                )}
              </div>
            )}

            {/* Documents */}
            {limitedDocuments.length > 0 && (
              <div>
                <div className="px-3 py-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground border-t border-border pt-3">
                  📄 Documents ({documentResults.length})
                </div>
                <div className="space-y-1">
                  {limitedDocuments.map((doc, idx) => {
                    const globalIdx = matchingModules.length + limitedClients.length + limitedStaff.length + limitedBookings.length + idx;
                    return (
                      <SearchDropdownItem
                        key={doc.id}
                        icon={FileText}
                        title={doc.title}
                        subtitle={doc.subtitle}
                        onClick={() => handleNavigate(doc)}
                        isSelected={selectedIndex === globalIdx}
                        type="document"
                      />
                    );
                  })}
                </div>
                {documentResults.length > 5 && (
                  <button
                    onClick={() => {
                      navigate(`${basePath}/documents`);
                      onResultClick();
                    }}
                    className="w-full text-xs text-primary hover:underline py-2 text-center"
                  >
                    View all {documentResults.length} documents →
                  </button>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

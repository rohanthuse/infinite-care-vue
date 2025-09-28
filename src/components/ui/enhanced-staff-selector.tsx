import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import {
  SafeSelectWrapper as Select,
  SafeSelectContent as SelectContent,
  SafeSelectItem as SelectItem,
  SafeSelectTrigger as SelectTrigger,
  SafeSelectValue as SelectValue,
} from '@/components/ui/safe-select';
import { useSearchableStaff, useRecentStaff, EnhancedStaff } from '@/hooks/useSearchableStaff';
import { useDebounce } from '@/hooks/useDebounce';
import { 
  ChevronDown, 
  Search, 
  Users, 
  Mail, 
  Phone,
  X, 
  Clock,
  Filter,
  CheckCircle,
  UserCheck
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface EnhancedStaffSelectorProps {
  branchId: string;
  selectedStaffId?: string | null;
  onStaffSelect: (staffId: string, staffData: EnhancedStaff) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  allowClear?: boolean;
}

export const EnhancedStaffSelector: React.FC<EnhancedStaffSelectorProps> = ({
  branchId,
  selectedStaffId,
  onStaffSelect,
  placeholder = "Search and select staff...",
  className,
  disabled = false,
  allowClear = true
}) => {
  const [open, setOpen] = useState(false);
  const [searchInput, setSearchInput] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const debouncedSearch = useDebounce(searchInput, 300);
  const inputRef = useRef<HTMLInputElement>(null);

  const {
    staff,
    totalCount,
    isLoading,
    searchTerm,
    setSearchTerm,
    staffStatus,
    setStaffStatus,
    hasNextPage,
    nextPage,
    resetPage
  } = useSearchableStaff(branchId);

  const { data: recentStaff } = useRecentStaff(branchId);

  // Sync debounced search with hook
  useEffect(() => {
    setSearchTerm(debouncedSearch);
    resetPage();
  }, [debouncedSearch, setSearchTerm, resetPage]);

  // Focus input when popover opens
  useEffect(() => {
    if (open && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [open]);

  // Find selected staff for display
  const selectedStaff = staff.find(s => s.id === selectedStaffId) || 
    recentStaff?.find(s => s.id === selectedStaffId);

  const handleStaffSelect = useCallback((staffMember: EnhancedStaff) => {
    onStaffSelect(staffMember.id, staffMember);
    setOpen(false);
    setSearchInput('');
  }, [onStaffSelect]);

  const handleClearSelection = useCallback(() => {
    onStaffSelect('', {} as EnhancedStaff);
  }, [onStaffSelect]);

  // Clean up when component unmounts or staff changes
  useEffect(() => {
    return () => {
      setSearchInput('');
      setOpen(false);
    };
  }, [selectedStaffId]);

  // Close selector when component is about to unmount or parent dialog closes
  useEffect(() => {
    return () => {
      setOpen(false);
    };
  }, []);

  const getStatusBadge = (status?: string) => {
    if (!status) return null;
    
    const variant = status === 'Active' ? 'default' : 'secondary';
    const color = status === 'Active' ? 'text-green-700 bg-green-100' : 'text-gray-700 bg-gray-100';
    
    return (
      <Badge variant={variant} className={cn("text-xs", color)}>
        {status}
      </Badge>
    );
  };

  const renderStaffItem = (staffMember: EnhancedStaff, isSelected = false) => (
    <div
      key={staffMember.id}
      className={cn(
        "flex items-center justify-between p-3 cursor-pointer transition-colors rounded-md",
        "hover:bg-accent hover:text-accent-foreground",
        isSelected && "bg-accent text-accent-foreground"
      )}
      onClick={() => handleStaffSelect(staffMember)}
    >
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <div className="font-medium text-sm truncate">
            {staffMember.full_name}
          </div>
          {isSelected && <CheckCircle className="h-4 w-4 text-primary" />}
        </div>
        
        <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
          {staffMember.specialization && (
            <div className="flex items-center gap-1">
              <UserCheck className="h-3 w-3" />
              <span>{staffMember.specialization}</span>
            </div>
          )}
          {staffMember.email && (
            <div className="flex items-center gap-1 truncate">
              <Mail className="h-3 w-3 flex-shrink-0" />
              <span className="truncate">{staffMember.email}</span>
            </div>
          )}
          {staffMember.phone && (
            <div className="flex items-center gap-1 truncate">
              <Phone className="h-3 w-3 flex-shrink-0" />
              <span className="truncate">{staffMember.phone}</span>
            </div>
          )}
        </div>
      </div>
      
      <div className="flex items-center gap-2 ml-2">
        {getStatusBadge(staffMember.status)}
      </div>
    </div>
  );

  return (
    <div className={cn("relative", className)}>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className={cn(
              "w-full justify-between",
              !selectedStaff && "text-muted-foreground"
            )}
            disabled={disabled}
          >
            <div className="flex items-center gap-2 min-w-0 flex-1">
              <Users className="h-4 w-4 flex-shrink-0" />
              {selectedStaff ? (
                <div className="flex items-center gap-2 min-w-0">
                  <span className="truncate">{selectedStaff.full_name}</span>
                  {selectedStaff.specialization && (
                    <Badge variant="outline" className="text-xs">
                      {selectedStaff.specialization}
                    </Badge>
                  )}
                </div>
              ) : (
                <span className="truncate">{placeholder}</span>
              )}
            </div>
            <div className="flex items-center gap-1 flex-shrink-0">
              {selectedStaff && allowClear && (
                <X 
                  className="h-4 w-4 opacity-50 hover:opacity-100" 
                  onClick={(e) => {
                    e.stopPropagation();
                    handleClearSelection();
                  }}
                />
              )}
              <ChevronDown className="h-4 w-4 opacity-50" />
            </div>
          </Button>
        </PopoverTrigger>
        
        <PopoverContent className="w-full p-0" style={{ width: 'var(--radix-popover-trigger-width)' }}>
          <div className="flex flex-col">
            {/* Search Header */}
            <div className="p-3 border-b">
              <div className="flex items-center gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    ref={inputRef}
                    placeholder="Search by name, email, specialization..."
                    value={searchInput}
                    onChange={(e) => setSearchInput(e.target.value)}
                    className="pl-8"
                  />
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowFilters(!showFilters)}
                  className={cn(showFilters && "bg-accent")}
                >
                  <Filter className="h-4 w-4" />
                </Button>
              </div>
              
              {/* Filters */}
              {showFilters && (
                <div className="mt-3">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">Status:</span>
                    <Select 
                      value={staffStatus} 
                      onValueChange={(value: 'all' | 'active' | 'inactive') => setStaffStatus(value)}
                    >
                      <SelectTrigger className="w-32">
                        <SelectValue />
                      </SelectTrigger>
                       <SelectContent>
                         <SelectItem value="all">All</SelectItem>
                         <SelectItem value="active">Active</SelectItem>  
                         <SelectItem value="inactive">Inactive</SelectItem>
                       </SelectContent>
                    </Select>
                  </div>
                </div>
              )}
            </div>

            {/* Results */}
            <ScrollArea className="max-h-80">
              {isLoading ? (
                <div className="p-3 space-y-2">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <Skeleton className="h-4 w-4 rounded-full" />
                      <div className="space-y-1 flex-1">
                        <Skeleton className="h-4 w-3/4" />
                        <Skeleton className="h-3 w-1/2" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <>
                  {/* Recent Staff (when no search) */}
                  {!searchInput && recentStaff && recentStaff.length > 0 && (
                    <div className="p-2">
                      <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground mb-2">
                        <Clock className="h-3 w-3" />
                        Recently Added
                      </div>
                      {recentStaff.slice(0, 3).map(staffMember => 
                        renderStaffItem(staffMember, staffMember.id === selectedStaffId)
                      )}
                    </div>
                  )}

                  {/* Search Results */}
                  {staff.length > 0 ? (
                    <div className="p-2">
                      {searchInput && (
                        <div className="text-xs text-muted-foreground mb-2">
                          {totalCount} staff member{totalCount !== 1 ? 's' : ''} found
                        </div>
                      )}
                      {staff.map(staffMember => 
                        renderStaffItem(staffMember, staffMember.id === selectedStaffId)
                      )}
                      
                      {/* Load More */}
                      {hasNextPage && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={nextPage}
                          className="w-full mt-2"
                        >
                          Load more staff...
                        </Button>
                      )}
                    </div>
                  ) : searchInput ? (
                    <div className="p-4 text-center text-sm text-muted-foreground">
                      No staff found matching "{searchInput}"
                    </div>
                  ) : (
                    <div className="p-4 text-center text-sm text-muted-foreground">
                      Start typing to search for staff
                    </div>
                  )}
                </>
              )}
            </ScrollArea>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
};
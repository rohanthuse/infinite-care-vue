import React, { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useSearchableStaff, EnhancedStaff } from '@/hooks/useSearchableStaff';
import { ChevronDown, X, Search, Users, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StaffMultiSelectProps {
  branchId: string;
  selectedIds: string[];
  onChange: (ids: string[], staffData: EnhancedStaff[]) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
}

export const StaffMultiSelect: React.FC<StaffMultiSelectProps> = ({
  branchId,
  selectedIds,
  onChange,
  placeholder = "Select staff members...",
  disabled = false,
  className
}) => {
  const [open, setOpen] = useState(false);
  const [searchInput, setSearchInput] = useState('');

  const {
    staff,
    isLoading,
    setSearchTerm,
    resetPage
  } = useSearchableStaff(branchId);

  // Debounced search
  React.useEffect(() => {
    const timer = setTimeout(() => {
      setSearchTerm(searchInput);
      resetPage();
    }, 300);
    return () => clearTimeout(timer);
  }, [searchInput, setSearchTerm, resetPage]);

  // Keep track of selected staff data
  const [selectedStaffMap, setSelectedStaffMap] = useState<Map<string, EnhancedStaff>>(new Map());

  // Update map when staff data is available
  React.useEffect(() => {
    const newMap = new Map(selectedStaffMap);
    staff.forEach(member => {
      if (selectedIds.includes(member.id)) {
        newMap.set(member.id, member);
      }
    });
    setSelectedStaffMap(newMap);
  }, [staff, selectedIds]);

  const handleToggle = (member: EnhancedStaff) => {
    const newMap = new Map(selectedStaffMap);
    let newIds: string[];
    
    if (selectedIds.includes(member.id)) {
      newIds = selectedIds.filter(id => id !== member.id);
      newMap.delete(member.id);
    } else {
      newIds = [...selectedIds, member.id];
      newMap.set(member.id, member);
    }
    
    setSelectedStaffMap(newMap);
    onChange(newIds, Array.from(newMap.values()));
  };

  const handleClearAll = (e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedStaffMap(new Map());
    onChange([], []);
  };

  const getDisplayText = () => {
    if (selectedIds.length === 0) return placeholder;
    if (selectedIds.length === 1) {
      const member = selectedStaffMap.get(selectedIds[0]);
      return member?.full_name || 'Selected staff';
    }
    return `${selectedIds.length} staff selected`;
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn(
            "w-full justify-between",
            !selectedIds.length && "text-muted-foreground",
            className
          )}
          disabled={disabled}
        >
          <div className="flex items-center gap-2 min-w-0 flex-1">
            <Users className="h-4 w-4 flex-shrink-0" />
            <span className="truncate">{getDisplayText()}</span>
          </div>
          <div className="flex items-center gap-1 flex-shrink-0">
            {selectedIds.length > 0 && (
              <X
                className="h-4 w-4 opacity-50 hover:opacity-100"
                onClick={handleClearAll}
              />
            )}
            <ChevronDown className="h-4 w-4 opacity-50" />
          </div>
        </Button>
      </PopoverTrigger>

      <PopoverContent className="w-full p-0 bg-popover" style={{ width: 'var(--radix-popover-trigger-width)' }}>
        <div className="p-2 border-b">
          <div className="relative">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search staff..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="pl-8"
            />
          </div>
        </div>

        <ScrollArea className="max-h-[200px]">
          {isLoading ? (
            <div className="flex items-center justify-center p-4">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span className="ml-2 text-sm text-muted-foreground">Loading...</span>
            </div>
          ) : staff.length === 0 ? (
            <div className="p-4 text-center text-sm text-muted-foreground">
              No staff found
            </div>
          ) : (
            <div className="p-2 space-y-1">
              {staff.map((member) => (
                <div
                  key={member.id}
                  className="flex items-center gap-2 p-2 hover:bg-accent rounded-md cursor-pointer"
                  onClick={() => handleToggle(member)}
                >
                  <Checkbox
                    checked={selectedIds.includes(member.id)}
                    onCheckedChange={() => handleToggle(member)}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium truncate">{member.full_name}</div>
                    {member.specialization && (
                      <div className="text-xs text-muted-foreground">{member.specialization}</div>
                    )}
                  </div>
                  {member.status && (
                    <Badge variant={member.status === 'Active' ? 'default' : 'secondary'} className="text-xs">
                      {member.status}
                    </Badge>
                  )}
                </div>
              ))}
            </div>
          )}
        </ScrollArea>

        {selectedIds.length > 0 && (
          <div className="p-2 border-t bg-muted/50">
            <div className="text-xs text-muted-foreground">
              {selectedIds.length} staff member{selectedIds.length !== 1 ? 's' : ''} selected
            </div>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
};

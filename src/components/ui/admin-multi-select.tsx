import React from 'react';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Checkbox } from '@/components/ui/checkbox';
import { ChevronDown, X } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface AdminOption {
  id: string;
  auth_user_id: string;
  first_name: string;
  last_name: string;
  email: string;
}

interface AdminMultiSelectProps {
  admins: AdminOption[];
  selectedIds: string[];
  onChange: (ids: string[]) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
}

export const AdminMultiSelect: React.FC<AdminMultiSelectProps> = ({
  admins,
  selectedIds,
  onChange,
  placeholder = 'Select admins (optional)',
  disabled = false,
  className,
}) => {
  const [open, setOpen] = React.useState(false);

  // Deduplicate admins by auth_user_id to prevent auto-selection bugs
  const uniqueAdmins = React.useMemo(() => {
    const seen = new Set<string>();
    return admins.filter(admin => {
      if (seen.has(admin.auth_user_id)) {
        return false;
      }
      seen.add(admin.auth_user_id);
      return true;
    });
  }, [admins]);

  const handleToggle = (adminId: string) => {
    if (selectedIds.includes(adminId)) {
      onChange(selectedIds.filter(id => id !== adminId));
    } else {
      onChange([...selectedIds, adminId]);
    }
  };

  const handleClearAll = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange([]);
  };

  const selectedAdmins = uniqueAdmins.filter(admin => selectedIds.includes(admin.auth_user_id));
  const displayText = selectedAdmins.length > 0
    ? selectedAdmins.length === 1
      ? `${selectedAdmins[0].first_name} ${selectedAdmins[0].last_name}`
      : `${selectedAdmins.length} selected`
    : placeholder;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          disabled={disabled || uniqueAdmins.length === 0}
          className={cn(
            'w-full h-10 justify-between text-sm font-normal',
            !selectedIds.length && 'text-muted-foreground',
            className
          )}
        >
          <span className="truncate">{uniqueAdmins.length === 0 ? 'No admins available' : displayText}</span>
          <div className="flex items-center gap-1 ml-2 shrink-0">
            {selectedIds.length > 0 && (
              <X
                className="h-4 w-4 hover:text-destructive"
                onClick={handleClearAll}
              />
            )}
            <ChevronDown className="h-4 w-4 opacity-50" />
          </div>
        </Button>
      </PopoverTrigger>
      <PopoverContent 
        className="p-0 bg-popover border shadow-lg z-[100]" 
        style={{ width: 'var(--radix-popover-trigger-width)', minWidth: '280px' }}
        sideOffset={4}
        align="start"
      >
        <div className="max-h-[200px] overflow-y-auto">
          <div className="p-2 space-y-1">
            {uniqueAdmins.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-2">
                No admins available
              </p>
            ) : (
              uniqueAdmins.map((admin) => (
                <div
                  key={`${admin.id}-${admin.auth_user_id}`}
                  className="flex items-center space-x-2 p-2 rounded-md hover:bg-accent cursor-pointer"
                  onClick={() => handleToggle(admin.auth_user_id)}
                >
                  <Checkbox
                    checked={selectedIds.includes(admin.auth_user_id)}
                  />
                  <div className="flex flex-col flex-1 min-w-0">
                    <span className="text-sm font-medium truncate">
                      {admin.first_name} {admin.last_name}
                    </span>
                    {admin.email && (
                      <span className="text-xs text-muted-foreground truncate">
                        {admin.email}
                      </span>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
};

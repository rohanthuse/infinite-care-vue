import React, { useState, useMemo } from 'react';
import { Check, ChevronDown, X, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Badge } from '@/components/ui/badge';

export interface MultiSelectOption {
  label: string;
  value: string;
  description?: string;
  isCustom?: boolean;
}

interface MultiSelectProps {
  options: MultiSelectOption[];
  selected: string[];
  onSelectionChange: (selected: string[]) => void;
  placeholder?: string;
  searchPlaceholder?: string;
  emptyText?: string;
  maxDisplay?: number;
  disabled?: boolean;
  showSelectAll?: boolean;
  allowCustom?: boolean;
  onCustomOptionAdd?: (value: string) => void;
  customPrefix?: string;
  showAddManualOption?: boolean;
  addManualLabel?: string;
  onAddManualClick?: () => void;
}

export function MultiSelect({
  options,
  selected,
  onSelectionChange,
  placeholder = "Select items...",
  searchPlaceholder = "Search...",
  emptyText = "No items found.",
  maxDisplay = 3,
  disabled = false,
  showSelectAll = false,
  allowCustom = false,
  onCustomOptionAdd,
  customPrefix = "custom:",
  showAddManualOption = false,
  addManualLabel = "Add Manually",
  onAddManualClick,
}: MultiSelectProps) {
  const [open, setOpen] = useState(false);
  const [searchValue, setSearchValue] = useState("");

  const handleSelect = (value: string) => {
    const newSelection = selected.includes(value)
      ? selected.filter((item) => item !== value)
      : [...selected, value];
    console.log('🔍 MultiSelect - Selection changed:', newSelection);
    onSelectionChange(newSelection);
  };

  const handleRemove = (value: string) => {
    const newSelection = selected.filter((item) => item !== value);
    console.log('🔍 MultiSelect - Removed item, new selection:', newSelection);
    onSelectionChange(newSelection);
  };

  const handleSelectAll = () => {
    const allValues = options.map(option => option.value);
    console.log('🔍 MultiSelect - Select All:', allValues);
    onSelectionChange(allValues);
  };

  const handleDeselectAll = () => {
    console.log('🔍 MultiSelect - Deselect All');
    onSelectionChange([]);
  };

  const handleAddCustom = () => {
    if (searchValue.trim() && onCustomOptionAdd) {
      console.log('🔍 MultiSelect - Adding custom option:', searchValue.trim());
      onCustomOptionAdd(searchValue.trim());
      setSearchValue("");
    }
  };

  // Check if search matches any existing option exactly
  const searchMatchesExactly = options.some(opt => 
    opt.label.toLowerCase() === searchValue.toLowerCase().trim()
  );

  // Show "Add" option when: allowCustom=true, has search text, doesn't match existing exactly
  const showAddOption = allowCustom && searchValue.trim() && !searchMatchesExactly;

  const allSelected = selected.length === options.length && options.length > 0;
  const selectedOptions = options.filter(option => selected.includes(option.value));

  // Memoized lookup map for reliable filtering
  const optionsMap = useMemo(() => {
    const map = new Map<string, MultiSelectOption>();
    options.forEach(opt => map.set(opt.value, opt));
    return map;
  }, [options]);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between h-auto min-h-[2.5rem] px-3 py-2"
          disabled={disabled}
        >
          <div className="flex flex-wrap gap-1 flex-1">
            {selected.length === 0 ? (
              <span className="text-muted-foreground">{placeholder}</span>
            ) : (
              <>
                {selectedOptions.slice(0, maxDisplay).map((option) => (
                  <Badge
                    key={option.value}
                    variant="secondary"
                    className={cn(
                      "text-xs",
                      option.isCustom ? "bg-purple-100 text-purple-800" : ""
                    )}
                  >
                    {option.label}
                    {option.isCustom && " (Custom)"}
                    <button
                      className="ml-1 ring-offset-background rounded-full outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          handleRemove(option.value);
                        }
                      }}
                      onMouseDown={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                      }}
                      onClick={() => handleRemove(option.value)}
                    >
                      <X className="h-3 w-3 text-muted-foreground hover:text-foreground" />
                    </button>
                  </Badge>
                ))}
                {selected.length > maxDisplay && (
                  <Badge variant="secondary" className="text-xs">
                    +{selected.length - maxDisplay} more
                  </Badge>
                )}
              </>
            )}
          </div>
          <ChevronDown className="h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent 
        className="w-[var(--radix-popover-trigger-width)] min-w-[300px] p-0 z-50 bg-popover shadow-md border" 
        align="start"
        style={{ maxHeight: '350px' }}
      >
        <Command
          filter={(value, search) => {
            if (!search) return 1;
            // Use memoized map for reliable lookup
            const option = optionsMap.get(value);
            const labelToMatch = option?.label?.toLowerCase() || value.toLowerCase();
            const normalizedSearch = search.toLowerCase().trim();
            // Match if label or value contains search string
            if (labelToMatch.includes(normalizedSearch) || value.toLowerCase().includes(normalizedSearch)) return 1;
            return 0;
          }}
        >
          <CommandInput 
            placeholder={searchPlaceholder} 
            value={searchValue}
            onValueChange={setSearchValue}
          />
          {showSelectAll && options.length > 0 && (
            <div className="border-b px-3 py-2">
              <button
                type="button"
                onClick={allSelected ? handleDeselectAll : handleSelectAll}
                className="text-sm text-blue-600 hover:text-blue-700 font-medium w-full text-left"
              >
                {allSelected ? '✓ Deselect All' : 'Select All Staff'}
              </button>
            </div>
          )}
          <CommandList className="max-h-[200px] overflow-y-auto dialog-scrollable">
            <CommandEmpty>
              {showAddOption ? null : emptyText}
            </CommandEmpty>
            <CommandGroup>
              {/* Permanent "Add Manually" option - always visible at top */}
              {showAddManualOption && (
                <CommandItem
                  value="__add_manual__"
                  onSelect={() => {
                    onAddManualClick?.();
                    setOpen(false);
                  }}
                  className="text-primary font-medium border-b border-border mb-1 pb-2"
                >
                  <Plus className="mr-2 h-4 w-4" />
                  {addManualLabel}
                </CommandItem>
              )}
              {/* Add custom option when typing and no exact match */}
              {showAddOption && (
                <CommandItem
                  onSelect={handleAddCustom}
                  className="text-primary cursor-pointer"
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Add "{searchValue.trim()}"
                </CommandItem>
              )}
              {options.map((option) => (
                <CommandItem
                  key={option.value}
                  value={option.value}
                  keywords={[option.label]}
                  onSelect={() => handleSelect(option.value)}
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      selected.includes(option.value) ? "opacity-100" : "opacity-0"
                    )}
                  />
                  <div className="flex-1">
                    <div className={cn(
                      "font-medium",
                      option.isCustom ? "text-purple-700" : ""
                    )}>
                      {option.label}
                      {option.isCustom && (
                        <span className="text-xs ml-1 text-purple-500">(Custom)</span>
                      )}
                    </div>
                    {option.description && (
                      <div className="text-xs text-muted-foreground">
                        {option.description}
                      </div>
                    )}
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
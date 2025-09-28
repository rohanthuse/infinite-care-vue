import React, { useState } from 'react';
import { Check, ChevronsUpDown, Building2 } from 'lucide-react';
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
import { cn } from '@/lib/utils';
import { useAuthoritiesForBilling } from '@/hooks/useAuthorityBilling';

interface AuthoritySelectorProps {
  branchId?: string;
  selectedAuthorityId?: string;
  onAuthoritySelect: (authorityId: string, authorityName: string) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
}

export const AuthoritySelector = ({
  branchId,
  selectedAuthorityId,
  onAuthoritySelect,
  placeholder = "Select authority...",
  className,
  disabled = false
}: AuthoritySelectorProps) => {
  const [open, setOpen] = useState(false);
  const { data: authorities = [], isLoading } = useAuthoritiesForBilling(branchId);

  const selectedAuthority = authorities.find(auth => auth.id === selectedAuthorityId);

  return (
    <div className={cn("w-full", className)}>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-full justify-between"
            disabled={disabled || isLoading}
          >
            <div className="flex items-center gap-2">
              <Building2 className="h-4 w-4 shrink-0" />
              {selectedAuthority ? (
                <span className="truncate">{selectedAuthority.name}</span>
              ) : (
                <span className="text-muted-foreground">{placeholder}</span>
              )}
            </div>
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-full p-0" align="start">
          <Command>
            <CommandInput placeholder="Search authorities..." className="h-9" />
            <CommandList>
              <CommandEmpty>
                {isLoading ? 'Loading authorities...' : 'No authorities found.'}
              </CommandEmpty>
              <CommandGroup>
                {authorities.map((authority) => (
                  <CommandItem
                    key={authority.id}
                    value={`${authority.name} ${authority.id}`}
                    onSelect={() => {
                      onAuthoritySelect(authority.id, authority.name);
                      setOpen(false);
                    }}
                  >
                    <div className="flex items-center gap-2">
                      <Building2 className="h-4 w-4 text-muted-foreground" />
                      <div className="flex flex-col">
                        <span className="font-medium">{authority.name}</span>
                        {authority.email && (
                          <span className="text-xs text-muted-foreground">{authority.email}</span>
                        )}
                      </div>
                    </div>
                    <Check
                      className={cn(
                        "ml-auto h-4 w-4",
                        selectedAuthorityId === authority.id ? "opacity-100" : "opacity-0"
                      )}
                    />
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  );
};
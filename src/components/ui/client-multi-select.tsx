import React, { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useSearchableClients, EnhancedClient } from '@/hooks/useSearchableClients';
import { ChevronDown, X, Search, User, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ClientMultiSelectProps {
  branchId: string;
  selectedIds: string[];
  onChange: (ids: string[], clientsData: EnhancedClient[]) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  /** When true (default), only shows active clients. Set to false for historical data views. */
  activeOnly?: boolean;
}

export const ClientMultiSelect: React.FC<ClientMultiSelectProps> = ({
  branchId,
  selectedIds,
  onChange,
  placeholder = "Select clients...",
  disabled = false,
  className,
  activeOnly = true  // Default to active-only for new booking creation
}) => {
  const [open, setOpen] = useState(false);
  const [searchInput, setSearchInput] = useState('');

  const {
    clients,
    isLoading,
    setSearchTerm,
    resetPage,
    setClientStatus
  } = useSearchableClients(branchId);

  // Set client status filter based on activeOnly prop
  // For new bookings: show only active clients
  // For historical views: show all clients including inactive
  React.useEffect(() => {
    setClientStatus(activeOnly ? 'active' : 'all');
  }, [setClientStatus, activeOnly]);

  // Debounced search
  React.useEffect(() => {
    const timer = setTimeout(() => {
      setSearchTerm(searchInput);
      resetPage();
    }, 300);
    return () => clearTimeout(timer);
  }, [searchInput, setSearchTerm, resetPage]);

  // Keep track of selected clients data
  const [selectedClientsMap, setSelectedClientsMap] = useState<Map<string, EnhancedClient>>(new Map());

  // Update map when clients data is available
  React.useEffect(() => {
    const newMap = new Map(selectedClientsMap);
    clients.forEach(client => {
      if (selectedIds.includes(client.id)) {
        newMap.set(client.id, client);
      }
    });
    setSelectedClientsMap(newMap);
  }, [clients, selectedIds]);

  const handleToggle = (client: EnhancedClient) => {
    const newMap = new Map(selectedClientsMap);
    let newIds: string[];
    
    if (selectedIds.includes(client.id)) {
      newIds = selectedIds.filter(id => id !== client.id);
      newMap.delete(client.id);
    } else {
      newIds = [...selectedIds, client.id];
      newMap.set(client.id, client);
    }
    
    setSelectedClientsMap(newMap);
    onChange(newIds, Array.from(newMap.values()));
  };

  const handleClearAll = (e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedClientsMap(new Map());
    onChange([], []);
  };

  const getDisplayText = () => {
    if (selectedIds.length === 0) return placeholder;
    if (selectedIds.length === 1) {
      const client = selectedClientsMap.get(selectedIds[0]);
      return client?.full_name || 'Selected client';
    }
    return `${selectedIds.length} clients selected`;
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn(
            "w-full h-10 justify-between text-sm font-normal",
            !selectedIds.length && "text-muted-foreground",
            className
          )}
          disabled={disabled}
        >
          <div className="flex items-center gap-2 min-w-0 flex-1">
            <User className="h-4 w-4 flex-shrink-0" />
            <span className="truncate">{getDisplayText()}</span>
          </div>
          <div className="flex items-center gap-1 shrink-0">
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

      <PopoverContent 
        className="p-0 bg-popover border shadow-lg z-[100]" 
        style={{ width: 'var(--radix-popover-trigger-width)', minWidth: '280px' }}
        sideOffset={4}
        align="start"
      >
        <div className="p-2 border-b">
          <div className="relative">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search clients..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="pl-8 h-9"
            />
          </div>
        </div>

        <div className="max-h-[200px] overflow-y-auto">
          {isLoading ? (
            <div className="flex items-center justify-center p-4">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span className="ml-2 text-sm text-muted-foreground">Loading...</span>
            </div>
          ) : clients.length === 0 ? (
            <div className="p-4 text-center text-sm text-muted-foreground">
              No clients found
            </div>
          ) : (
            <div className="p-2 space-y-1">
              {clients.map((client) => (
                <div
                  key={client.id}
                  className="flex items-center gap-2 p-2 hover:bg-accent rounded-md cursor-pointer"
                  onClick={() => handleToggle(client)}
                >
                  <Checkbox
                    checked={selectedIds.includes(client.id)}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium truncate">{client.full_name}</div>
                    {client.pin_code && (
                      <div className="text-xs text-muted-foreground">PIN: {client.pin_code}</div>
                    )}
                  </div>
                  {client.status && (
                    <Badge variant={client.status === 'Active' ? 'default' : 'secondary'} className="text-xs">
                      {client.status}
                    </Badge>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {selectedIds.length > 0 && (
          <div className="p-2 border-t bg-muted/50">
            <div className="text-xs text-muted-foreground">
              {selectedIds.length} client{selectedIds.length !== 1 ? 's' : ''} selected
            </div>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
};

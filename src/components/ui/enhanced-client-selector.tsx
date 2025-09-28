import React, { useState, useEffect, useRef } from 'react';
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
import { useSearchableClients, useRecentClients, EnhancedClient } from '@/hooks/useSearchableClients';
import { useDebounce } from '@/hooks/useDebounce';
import { 
  ChevronDown, 
  Search, 
  User, 
  MapPin, 
  Mail, 
  X, 
  Clock,
  Filter,
  CheckCircle
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface EnhancedClientSelectorProps {
  branchId: string;
  selectedClientId?: string | null;
  onClientSelect: (clientId: string, clientData: EnhancedClient) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  allowClear?: boolean;
}

export const EnhancedClientSelector: React.FC<EnhancedClientSelectorProps> = ({
  branchId,
  selectedClientId,
  onClientSelect,
  placeholder = "Search and select a client...",
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
    clients,
    totalCount,
    isLoading,
    searchTerm,
    setSearchTerm,
    clientStatus,
    setClientStatus,
    hasNextPage,
    nextPage,
    resetPage
  } = useSearchableClients(branchId);

  const { data: recentClients } = useRecentClients(branchId);

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

  // Find selected client for display
  const selectedClient = clients.find(c => c.id === selectedClientId) || 
    recentClients?.find(c => c.id === selectedClientId);

  const handleClientSelect = (client: EnhancedClient) => {
    onClientSelect(client.id, client);
    setOpen(false);
    setSearchInput('');
  };

  const handleClearSelection = () => {
    onClientSelect('', {} as EnhancedClient);
  };

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

  const renderClientItem = (client: EnhancedClient, isSelected = false) => (
    <div
      key={client.id}
      className={cn(
        "flex items-center justify-between p-3 cursor-pointer transition-colors rounded-md",
        "hover:bg-accent hover:text-accent-foreground",
        isSelected && "bg-accent text-accent-foreground"
      )}
      onClick={() => handleClientSelect(client)}
    >
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <div className="font-medium text-sm truncate">
            {client.full_name}
          </div>
          {isSelected && <CheckCircle className="h-4 w-4 text-primary" />}
        </div>
        
        <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
          {client.pin_code && (
            <div className="flex items-center gap-1">
              <User className="h-3 w-3" />
              <span>{client.pin_code}</span>
            </div>
          )}
          {client.address && (
            <div className="flex items-center gap-1 truncate">
              <MapPin className="h-3 w-3 flex-shrink-0" />
              <span className="truncate">{client.address}</span>
            </div>
          )}
          {client.email && (
            <div className="flex items-center gap-1 truncate">
              <Mail className="h-3 w-3 flex-shrink-0" />
              <span className="truncate">{client.email}</span>
            </div>
          )}
        </div>
      </div>
      
      <div className="flex items-center gap-2 ml-2">
        {getStatusBadge(client.status)}
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
              !selectedClient && "text-muted-foreground"
            )}
            disabled={disabled}
          >
            <div className="flex items-center gap-2 min-w-0 flex-1">
              <User className="h-4 w-4 flex-shrink-0" />
              {selectedClient ? (
                <div className="flex items-center gap-2 min-w-0">
                  <span className="truncate">{selectedClient.full_name}</span>
                  {selectedClient.pin_code && (
                    <Badge variant="outline" className="text-xs">
                      {selectedClient.pin_code}
                    </Badge>
                  )}
                </div>
              ) : (
                <span className="truncate">{placeholder}</span>
              )}
            </div>
            <div className="flex items-center gap-1 flex-shrink-0">
              {selectedClient && allowClear && (
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
                    placeholder="Search by name, ID, address..."
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
                      value={clientStatus} 
                      onValueChange={(value: 'all' | 'active' | 'former') => setClientStatus(value)}
                    >
                      <SelectTrigger className="w-32">
                        <SelectValue />
                      </SelectTrigger>
                       <SelectContent>
                         <SelectItem value="all">All</SelectItem>
                         <SelectItem value="active">Active</SelectItem>  
                         <SelectItem value="former">Former</SelectItem>
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
                  {/* Recent Clients (when no search) */}
                  {!searchInput && recentClients && recentClients.length > 0 && (
                    <div className="p-2">
                      <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground mb-2">
                        <Clock className="h-3 w-3" />
                        Recently Updated
                      </div>
                      {recentClients.slice(0, 3).map(client => 
                        renderClientItem(client, client.id === selectedClientId)
                      )}
                    </div>
                  )}

                  {/* Search Results */}
                  {clients.length > 0 ? (
                    <div className="p-2">
                      {searchInput && (
                        <div className="text-xs text-muted-foreground mb-2">
                          {totalCount} client{totalCount !== 1 ? 's' : ''} found
                        </div>
                      )}
                      {clients.map(client => 
                        renderClientItem(client, client.id === selectedClientId)
                      )}
                      
                      {/* Load More */}
                      {hasNextPage && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={nextPage}
                          className="w-full mt-2"
                        >
                          Load more clients...
                        </Button>
                      )}
                    </div>
                  ) : searchInput ? (
                    <div className="p-4 text-center text-sm text-muted-foreground">
                      No clients found matching "{searchInput}"
                    </div>
                  ) : (
                    <div className="p-4 text-center text-sm text-muted-foreground">
                      Start typing to search for clients
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
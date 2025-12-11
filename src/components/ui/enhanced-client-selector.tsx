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
  CheckCircle,
  Loader2
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
  const scrollViewportRef = useRef<HTMLDivElement>(null);

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

  // Focus input when popover opens and cleanup when parent dialog closes
  useEffect(() => {
    if (open && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 100);
    } else if (!open) {
      // Clean up search state when selector closes to prevent re-renders
      setSearchInput('');
      setShowFilters(false);
    }
  }, [open]);

  // Clean up when component unmounts or client changes
  useEffect(() => {
    return () => {
      setSearchInput('');
      setShowFilters(false);
      setOpen(false);
    };
  }, [selectedClientId]);

  // Close selector when component is about to unmount or parent dialog closes
  useEffect(() => {
    return () => {
      setOpen(false);
    };
  }, []);

  // Find selected client for display
  const selectedClient = clients.find(c => c.id === selectedClientId) || 
    recentClients?.find(c => c.id === selectedClientId);

  const handleClientSelect = useCallback((client: EnhancedClient) => {
    onClientSelect(client.id, client);
    setOpen(false);
    setSearchInput('');
  }, [onClientSelect]);

  const handleClearSelection = useCallback(() => {
    onClientSelect('', {} as EnhancedClient);
  }, [onClientSelect]);

  // Auto-load more clients on scroll
  const handleScroll = useCallback((event: React.UIEvent<HTMLDivElement>) => {
    const target = event.currentTarget;
    const scrollThreshold = 0.8; // Trigger at 80% scroll
    const scrollPercentage = (target.scrollTop + target.clientHeight) / target.scrollHeight;
    
    if (scrollPercentage > scrollThreshold && hasNextPage && !isLoading) {
      nextPage();
    }
  }, [hasNextPage, isLoading, nextPage]);

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
                    placeholder="Search by name, PIN, email, or address..."
                    value={searchInput}
                    onChange={(e) => setSearchInput(e.target.value)}
                    className="pl-8 pr-8"
                  />
                  {searchInput && searchInput !== debouncedSearch && (
                    <Loader2 className="absolute right-2 top-2.5 h-4 w-4 text-muted-foreground animate-spin" />
                  )}
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

            {/* Total Count Indicator */}
            {!isLoading && totalCount > 0 && (
              <div className="px-3 py-2 border-b bg-muted/50">
                <div className="text-xs text-muted-foreground">
                  Showing {clients.length} of {totalCount} client{totalCount !== 1 ? 's' : ''}
                  {!searchInput && totalCount > clients.length && (
                    <span className="ml-1">- scroll to load more</span>
                  )}
                </div>
              </div>
            )}

            {/* Results */}
            <div className="relative">
              {/* Scroll gradient indicators */}
              {clients.length > 5 && (
                <>
                  <div className="absolute top-0 left-0 right-0 h-4 bg-gradient-to-b from-background to-transparent pointer-events-none z-10" />
                  <div className="absolute bottom-0 left-0 right-0 h-4 bg-gradient-to-t from-background to-transparent pointer-events-none z-10" />
                </>
              )}
              
              <ScrollArea 
                className="max-h-96"
                onScrollCapture={handleScroll}
              >
              <div ref={scrollViewportRef}>
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

              {/* Search Results - Filter out recent clients to avoid duplicates */}
              {(() => {
                const recentClientIds = new Set(recentClients?.map(c => c.id) || []);
                const filteredClients = searchInput ? clients : clients.filter(c => !recentClientIds.has(c.id));
                
                return filteredClients.length > 0 ? (
                <div className="p-2">
                  {filteredClients.map(client =>
                        renderClientItem(client, client.id === selectedClientId)
                      )}
                      
                      {/* Load More Button (backup for manual loading) */}
                      {hasNextPage && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={nextPage}
                          className="w-full mt-2"
                          disabled={isLoading}
                        >
                          {isLoading ? 'Loading...' : 'Load more clients...'}
                        </Button>
                      )}
                    </div>
                ) : searchInput ? (
                    <div className="p-4 text-center text-sm text-muted-foreground">
                      No clients found matching "{searchInput}"
                    </div>
                  ) : (
                    <div className="p-6 text-center space-y-2">
                      <div className="text-sm font-medium text-foreground">
                        {totalCount} client{totalCount !== 1 ? 's' : ''} available
                      </div>
                      <div className="text-xs text-muted-foreground">
                        Type to search by name, PIN, email, or address
                      </div>
                      <div className="text-xs text-muted-foreground italic">
                        Example: "John", "12345", or "London"
                      </div>
                    </div>
                  );
              })()}
                </>
              )}
              </div>
              </ScrollArea>
              
              {/* Scroll hint for large lists */}
              {clients.length > 10 && hasNextPage && (
                <div className="absolute bottom-0 left-0 right-0 text-center pb-2 text-xs text-muted-foreground bg-gradient-to-t from-background via-background to-transparent pt-8 pointer-events-none">
                  Scroll for more clients
                </div>
              )}
            </div>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
};
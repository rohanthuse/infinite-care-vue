import React, { useState, useEffect } from "react";
import { format } from "date-fns";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Search, CheckCircle2, XCircle, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { formatCurrency } from "@/utils/currencyFormatter";
import type { PeriodDetails } from "@/hooks/useBulkInvoiceGeneration";

interface ClientSelectorItem {
  clientId: string;
  clientName: string;
  bookingCount: number;
  hasRateSchedule: boolean;
}

interface MultiClientSelectorDialogProps {
  isOpen: boolean;
  onClose: () => void;
  periodDetails: PeriodDetails;
  branchId: string;
  organizationId: string;
  onConfirm: (selectedClientIds: string[]) => void;
}

export const MultiClientSelectorDialog: React.FC<MultiClientSelectorDialogProps> = ({
  isOpen,
  onClose,
  periodDetails,
  branchId,
  organizationId,
  onConfirm,
}) => {
  const [loading, setLoading] = useState(false);
  const [clients, setClients] = useState<ClientSelectorItem[]>([]);
  const [selectedClients, setSelectedClients] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState('');
  const [filterRateStatus, setFilterRateStatus] = useState<'all' | 'with_rate' | 'no_rate'>('all');

  useEffect(() => {
    if (isOpen && periodDetails) {
      fetchClients();
    }
  }, [isOpen, periodDetails, branchId]);

  const fetchClients = async () => {
    setLoading(true);
    try {
      // Fetch bookings for the period (all statuses)
      const { data: bookings, error } = await supabase
        .from('bookings')
        .select(`
          id,
          client_id,
          clients (
            id,
            first_name,
            last_name
          )
        `)
        .eq('branch_id', branchId)
        .gte('start_time', periodDetails.startDate)
        .lte('end_time', periodDetails.endDate);

      if (error) throw error;

      // Group by client
      const clientMap = new Map<string, { name: string; count: number }>();
      
      bookings?.forEach((booking) => {
        if (booking.client_id && booking.clients) {
          const clientName = `${booking.clients.first_name} ${booking.clients.last_name}`;
          const existing = clientMap.get(booking.client_id);
          if (existing) {
            existing.count++;
          } else {
            clientMap.set(booking.client_id, { name: clientName, count: 1 });
          }
        }
      });

      // Check rate schedules for each client
      const clientIds = Array.from(clientMap.keys());
      const { data: rateSchedules } = await supabase
        .from('client_rate_schedules')
        .select('client_id')
        .in('client_id', clientIds)
        .eq('is_active', true);

      const clientsWithRates = new Set(rateSchedules?.map(r => r.client_id) || []);

      // Build client list
      const clientList: ClientSelectorItem[] = Array.from(clientMap.entries()).map(([clientId, info]) => ({
        clientId,
        clientName: info.name,
        bookingCount: info.count,
        hasRateSchedule: clientsWithRates.has(clientId),
      }));

      setClients(clientList);
    } catch (error) {
      console.error('[fetchClients] Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredClients = clients.filter((client) => {
    const matchesSearch = client.clientName.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = 
      filterRateStatus === 'all' ||
      (filterRateStatus === 'with_rate' && client.hasRateSchedule) ||
      (filterRateStatus === 'no_rate' && !client.hasRateSchedule);
    
    return matchesSearch && matchesFilter;
  });

  const handleToggleClient = (clientId: string) => {
    const newSelected = new Set(selectedClients);
    if (newSelected.has(clientId)) {
      newSelected.delete(clientId);
    } else {
      newSelected.add(clientId);
    }
    setSelectedClients(newSelected);
  };

  const handleSelectAll = () => {
    const eligibleClients = filteredClients.filter(c => c.hasRateSchedule);
    const newSelected = new Set(eligibleClients.map(c => c.clientId));
    setSelectedClients(newSelected);
  };

  const handleDeselectAll = () => {
    setSelectedClients(new Set());
  };

  const handleConfirm = () => {
    onConfirm(Array.from(selectedClients));
    onClose();
  };

  const eligibleSelectedCount = Array.from(selectedClients).filter(id => 
    clients.find(c => c.clientId === id)?.hasRateSchedule
  ).length;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Select Clients for Invoice Generation</DialogTitle>
          <DialogDescription>
            Period: {periodDetails?.type?.charAt(0).toUpperCase()}{periodDetails?.type?.slice(1)} 
            ({format(new Date(periodDetails.startDate), 'MMM d')} - {format(new Date(periodDetails.endDate), 'MMM d, yyyy')})
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 flex-1 overflow-hidden flex flex-col">
          {/* Search and Filters */}
          <div className="space-y-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search clients..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>

            <div className="flex items-center gap-3">
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant={filterRateStatus === 'all' ? 'default' : 'outline'}
                  onClick={() => setFilterRateStatus('all')}
                >
                  All
                </Button>
                <Button
                  size="sm"
                  variant={filterRateStatus === 'with_rate' ? 'default' : 'outline'}
                  onClick={() => setFilterRateStatus('with_rate')}
                >
                  With Rate
                </Button>
                <Button
                  size="sm"
                  variant={filterRateStatus === 'no_rate' ? 'default' : 'outline'}
                  onClick={() => setFilterRateStatus('no_rate')}
                >
                  No Rate
                </Button>
              </div>

              <div className="flex-1" />

              <Button size="sm" variant="outline" onClick={handleSelectAll}>
                Select All Eligible
              </Button>
              <Button size="sm" variant="outline" onClick={handleDeselectAll}>
                Deselect All
              </Button>
            </div>
          </div>

          {/* Client List */}
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : (
            <ScrollArea className="flex-1 border rounded-lg">
              <div className="p-4 space-y-2">
                {filteredClients.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">
                    No clients found matching your criteria
                  </p>
                ) : (
                  filteredClients.map((client) => (
                    <div
                      key={client.clientId}
                      className="flex items-center gap-3 p-3 border rounded-lg hover:bg-accent transition-colors"
                    >
                      <Checkbox
                        checked={selectedClients.has(client.clientId)}
                        onCheckedChange={() => handleToggleClient(client.clientId)}
                        disabled={!client.hasRateSchedule}
                      />
                      
                      <div className="flex-1">
                        <p className="font-medium">{client.clientName}</p>
                        <p className="text-sm text-muted-foreground">
                          {client.bookingCount} booking{client.bookingCount !== 1 ? 's' : ''}
                        </p>
                      </div>

                      {client.hasRateSchedule ? (
                        <Badge variant="outline" className="gap-1">
                          <CheckCircle2 className="h-3 w-3 text-green-500" />
                          Ready
                        </Badge>
                      ) : (
                        <Badge variant="destructive" className="gap-1">
                          <XCircle className="h-3 w-3" />
                          No Rate
                        </Badge>
                      )}
                    </div>
                  ))
                )}
              </div>
            </ScrollArea>
          )}

          {/* Summary */}
          <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
            <div>
              <p className="text-sm text-muted-foreground">Selected Clients</p>
              <p className="text-2xl font-bold">{eligibleSelectedCount}</p>
            </div>
            <div className="text-right">
              <p className="text-sm text-muted-foreground">Total Eligible</p>
              <p className="text-2xl font-bold">{clients.filter(c => c.hasRateSchedule).length}</p>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button 
            onClick={handleConfirm}
            disabled={selectedClients.size === 0 || eligibleSelectedCount === 0}
          >
            Generate {eligibleSelectedCount} Invoice{eligibleSelectedCount !== 1 ? 's' : ''}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

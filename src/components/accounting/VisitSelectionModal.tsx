import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { CalendarIcon, Search, Plus } from "lucide-react";
import { format, parseISO } from "date-fns";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { formatCurrency } from "@/utils/currencyFormatter";

interface VisitSelectionModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  branchId: string;
  clientId: string;
  onVisitsSelected: (visits: any[]) => void;
}

interface VisitRecord {
  id: string;
  bookingId: string;
  clientId: string;
  clientName: string;
  visitDate: string;
  serviceStartTime: string;
  serviceEndTime: string;
  durationMinutes: number;
  dayType: string;
  rateType: string;
  rate: number;
  bankHolidayMultiplier?: number;
  total: number;
  isSelected: boolean;
  alreadyInvoiced: boolean;
}

export function VisitSelectionModal({
  open,
  onOpenChange,
  branchId,
  clientId,
  onVisitsSelected
}: VisitSelectionModalProps) {
  const [visits, setVisits] = useState<VisitRecord[]>([]);
  const [filteredVisits, setFilteredVisits] = useState<VisitRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [dateRange, setDateRange] = useState({
    from: undefined as Date | undefined,
    to: undefined as Date | undefined
  });
  const [selectedVisits, setSelectedVisits] = useState<Set<string>>(new Set());

  const { toast } = useToast();

  // Fetch available visits
  useEffect(() => {
    if (open && clientId) {
      fetchAvailableVisits();
    }
  }, [open, clientId, branchId]);

  // Filter visits based on search and date range
  useEffect(() => {
    let filtered = visits;

    if (searchTerm) {
      filtered = filtered.filter(visit =>
        visit.clientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        visit.dayType.toLowerCase().includes(searchTerm.toLowerCase()) ||
        visit.rateType.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (dateRange.from) {
      filtered = filtered.filter(visit =>
        new Date(visit.visitDate) >= dateRange.from!
      );
    }

    if (dateRange.to) {
      filtered = filtered.filter(visit =>
        new Date(visit.visitDate) <= dateRange.to!
      );
    }

    setFilteredVisits(filtered);
  }, [visits, searchTerm, dateRange]);

  const fetchAvailableVisits = async () => {
    setLoading(true);
    try {
      // Fetch visit records that haven't been invoiced yet
      const { data: visitData, error } = await supabase
        .from('visit_records')
        .select(`
          id,
          booking_id,
          client_id,
          visit_start_time,
          visit_end_time,
          actual_duration_minutes,
          status,
          bookings!inner(
            start_time,
            end_time,
            revenue,
            clients!inner(
              first_name,
              last_name
            )
          )
        `)
        .eq('client_id', clientId)
        .eq('status', 'completed')
        .is('invoice_line_item_id', null) // Not yet invoiced
        .order('visit_date', { ascending: false });

      if (error) throw error;

      // Transform the data
      const transformedVisits: VisitRecord[] = (visitData || []).map(visit => {
        const clientName = `${visit.bookings[0].clients.first_name} ${visit.bookings[0].clients.last_name}`;
        const startTime = new Date(visit.visit_start_time);
        const endTime = new Date(visit.visit_end_time);
        const durationMinutes = visit.actual_duration_minutes || Math.floor((endTime.getTime() - startTime.getTime()) / (1000 * 60));
        
        // Use booking revenue as base rate calculation
        const bookingRevenue = visit.bookings[0].revenue || 0;
        const baseRate = bookingRevenue > 0 ? bookingRevenue : 25; // Default £25/hour
        
        // Determine day type
        const visitDate = format(startTime, 'yyyy-MM-dd');
        const dayOfWeek = startTime.getDay();
        let dayType = '📅 Weekday';
        if (dayOfWeek === 0 || dayOfWeek === 6) {
          dayType = '🌅 Weekend';
        }
        
        // Apply business rules
        let finalRate = baseRate;
        let rateType = 'Rate per Hour';
        
        // If > 60 minutes, automatically charged hourly
        if (durationMinutes > 60) {
          rateType = 'Rate per Hour';
          finalRate = baseRate;
        } else {
          rateType = 'Rate per Minutes (Pro Rata)';
        }
        
        const total = (durationMinutes / 60) * finalRate;

        return {
          id: visit.id,
          bookingId: visit.booking_id,
          clientId: visit.client_id,
          clientName,
          visitDate,
          serviceStartTime: format(startTime, 'HH:mm'),
          serviceEndTime: format(endTime, 'HH:mm'),
          durationMinutes,
          dayType,
          rateType,
          rate: finalRate,
          bankHolidayMultiplier: 1,
          total,
          isSelected: false,
          alreadyInvoiced: false
        };
      });

      setVisits(transformedVisits);
    } catch (error: any) {
      toast({
        title: "Error",
        description: `Failed to fetch visits: ${error.message}`,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const formatDayType = (dayType?: string): string => {
    switch (dayType) {
      case 'bank_holiday': return '🏛️ Bank Holiday';
      case 'weekend': return '🌅 Weekend';
      case 'weekday': return '📅 Weekday';
      default: return '📅 Weekday';
    }
  };

  const formatHoursMinutes = (totalMinutes: number): string => {
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
  };

  const handleVisitToggle = (visitId: string) => {
    setSelectedVisits(prev => {
      const newSet = new Set(prev);
      if (newSet.has(visitId)) {
        newSet.delete(visitId);
      } else {
        newSet.add(visitId);
      }
      return newSet;
    });
  };

  const handleSelectAll = () => {
    const availableVisitIds = filteredVisits
      .filter(visit => !visit.alreadyInvoiced)
      .map(visit => visit.id);
    
    if (selectedVisits.size === availableVisitIds.length) {
      setSelectedVisits(new Set());
    } else {
      setSelectedVisits(new Set(availableVisitIds));
    }
  };

  const handleAddSelectedVisits = () => {
    const visitsToAdd = visits.filter(visit => selectedVisits.has(visit.id));
    
    if (visitsToAdd.length === 0) {
      toast({
        title: "No Visits Selected",
        description: "Please select at least one visit to add to the invoice.",
        variant: "destructive"
      });
      return;
    }

    onVisitsSelected(visitsToAdd.map(visit => ({
      visitRecordId: visit.id,
      visitDate: visit.visitDate,
      serviceStartTime: visit.serviceStartTime,
      serviceEndTime: visit.serviceEndTime,
      durationMinutes: visit.durationMinutes,
      dayType: visit.dayType,
      rateType: visit.rateType,
      rate: visit.rate,
      total: visit.total
    })));

    // Reset selections and close modal
    setSelectedVisits(new Set());
    onOpenChange(false);

    toast({
      title: "Visits Added",
      description: `${visitsToAdd.length} visit(s) added to the invoice.`,
    });
  };

  const selectedTotal = visits
    .filter(visit => selectedVisits.has(visit.id))
    .reduce((sum, visit) => sum + visit.total, 0);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Plus className="w-5 h-5" />
            Add Visits to Invoice
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Filters */}
          <div className="flex flex-col md:flex-row gap-4 p-4 border rounded-lg">
            <div className="flex-1">
              <Label htmlFor="search">Search Visits</Label>
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="search"
                  placeholder="Search by client, day type, or rate type..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>

            <div>
              <Label>Date From</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !dateRange.from && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {dateRange.from ? format(dateRange.from, "PPP") : "Pick date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={dateRange.from}
                    onSelect={(date) => setDateRange(prev => ({ ...prev, from: date }))}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div>
              <Label>Date To</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !dateRange.to && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {dateRange.to ? format(dateRange.to, "PPP") : "Pick date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={dateRange.to}
                    onSelect={(date) => setDateRange(prev => ({ ...prev, to: date }))}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>

          {/* Visit Selection Table */}
          <div className="border rounded-lg overflow-hidden">
            <div className="flex items-center justify-between p-4 bg-muted/50 border-b">
              <div className="flex items-center gap-2">
                <Checkbox
                  checked={selectedVisits.size > 0 && selectedVisits.size === filteredVisits.filter(v => !v.alreadyInvoiced).length}
                  onCheckedChange={handleSelectAll}
                />
                <span className="font-medium">
                  Select All ({selectedVisits.size} of {filteredVisits.filter(v => !v.alreadyInvoiced).length} selected)
                </span>
              </div>
              {selectedVisits.size > 0 && (
                <Badge variant="secondary">
                  Selected Total: {formatCurrency(selectedTotal)}
                </Badge>
              )}
            </div>

            {loading ? (
              <div className="p-8 text-center text-muted-foreground">
                Loading visits...
              </div>
            ) : filteredVisits.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[50px]"></TableHead>
                    <TableHead>Date & Time</TableHead>
                    <TableHead>Day Type</TableHead>
                    <TableHead>Duration</TableHead>
                    <TableHead>Rate Type</TableHead>
                    <TableHead>Rate</TableHead>
                    <TableHead>Total</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredVisits.map((visit) => (
                    <TableRow key={visit.id} className={visit.alreadyInvoiced ? "opacity-50" : ""}>
                      <TableCell>
                        <Checkbox
                          checked={selectedVisits.has(visit.id)}
                          onCheckedChange={() => handleVisitToggle(visit.id)}
                          disabled={visit.alreadyInvoiced}
                        />
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">
                            {format(parseISO(visit.visitDate), 'EEEE - dd/MM/yyyy')}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {visit.serviceStartTime}–{visit.serviceEndTime}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>{visit.dayType}</TableCell>
                      <TableCell>{formatHoursMinutes(visit.durationMinutes)}</TableCell>
                      <TableCell>{visit.rateType}</TableCell>
                      <TableCell>
                        {formatCurrency(visit.rate)}
                        {visit.bankHolidayMultiplier && visit.bankHolidayMultiplier > 1 && (
                          <Badge variant="secondary" className="ml-1 text-xs">
                            {visit.bankHolidayMultiplier}x
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="font-medium">{formatCurrency(visit.total)}</TableCell>
                      <TableCell>
                        {visit.alreadyInvoiced ? (
                          <Badge variant="secondary">Invoiced</Badge>
                        ) : (
                          <Badge variant="outline">Available</Badge>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <div className="p-8 text-center text-muted-foreground">
                No visits found for the selected criteria.
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex justify-between items-center">
            <div className="text-sm text-muted-foreground">
              {selectedVisits.size > 0 && (
                <span>
                  {selectedVisits.size} visit(s) selected • Total: {formatCurrency(selectedTotal)}
                </span>
              )}
            </div>

            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                Cancel
              </Button>
              <Button
                onClick={handleAddSelectedVisits}
                disabled={selectedVisits.size === 0}
                className="flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                Add Selected Visits ({selectedVisits.size})
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
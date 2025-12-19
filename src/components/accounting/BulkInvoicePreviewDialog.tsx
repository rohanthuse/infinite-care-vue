import React, { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, Users, Calendar, DollarSign, AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import type { PeriodDetails } from "@/hooks/useBulkInvoiceGeneration";

interface BulkInvoicePreviewDialogProps {
  isOpen: boolean;
  onClose: () => void;
  periodDetails: PeriodDetails | null;
  branchId: string;
  organizationId: string;
  onConfirm: () => void;
}

interface ClientPreview {
  clientId: string;
  clientName: string;
  bookingCount: number;
  hasRateSchedule: boolean;
}

export const BulkInvoicePreviewDialog: React.FC<BulkInvoicePreviewDialogProps> = ({
  isOpen,
  onClose,
  periodDetails,
  branchId,
  organizationId,
  onConfirm,
}) => {
  const [loading, setLoading] = useState(false);
  const [clientPreviews, setClientPreviews] = useState<ClientPreview[]>([]);
  const [totalBookings, setTotalBookings] = useState(0);

  useEffect(() => {
    if (isOpen && periodDetails) {
      fetchPreviewData();
    }
  }, [isOpen, periodDetails]);

  const fetchPreviewData = async () => {
    if (!periodDetails) return;
    
    setLoading(true);
    try {
      // Fetch all bookings for the period (all statuses)
      const { data: bookings, error: bookingsError } = await supabase
        .from('bookings')
        .select(`
          id,
          client_id,
          clients!inner(first_name, last_name)
        `)
        .eq('branch_id', branchId)
        .gte('start_time', periodDetails.startDate)
        .lte('start_time', periodDetails.endDate);

      if (bookingsError) throw bookingsError;

      // Group by client
      const clientMap = new Map<string, { name: string; count: number }>();
      bookings?.forEach(booking => {
        const clientId = booking.client_id;
        const clientName = `${booking.clients.first_name} ${booking.clients.last_name}`;
        
        if (clientMap.has(clientId)) {
          clientMap.get(clientId)!.count++;
        } else {
          clientMap.set(clientId, { name: clientName, count: 1 });
        }
      });

      setTotalBookings(bookings?.length || 0);

      // Check rate schedules for each client (check BOTH tables)
      const clientIds = Array.from(clientMap.keys());
      
      // Check client_rate_schedules (ad-hoc rates)
      const { data: rateSchedules } = await supabase
        .from('client_rate_schedules')
        .select('client_id')
        .in('client_id', clientIds)
        .eq('is_active', true);

      // Also check client_rate_assignments (assigned service rates)
      const { data: rateAssignments } = await supabase
        .from('client_rate_assignments')
        .select('client_id')
        .in('client_id', clientIds)
        .eq('is_active', true);

      // Combine both sources - client has rate if in either table
      const clientsWithRates = new Set([
        ...(rateSchedules?.map(rs => rs.client_id) || []),
        ...(rateAssignments?.map(ra => ra.client_id) || [])
      ]);

      const previews: ClientPreview[] = Array.from(clientMap.entries()).map(([clientId, data]) => ({
        clientId,
        clientName: data.name,
        bookingCount: data.count,
        hasRateSchedule: clientsWithRates.has(clientId)
      }));

      setClientPreviews(previews);
    } catch (error) {
      console.error('Error fetching preview data:', error);
    } finally {
      setLoading(false);
    }
  };

  const clientsWithoutRates = clientPreviews.filter(c => !c.hasRateSchedule).length;
  const eligibleClients = clientPreviews.filter(c => c.hasRateSchedule).length;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Bulk Invoice Generation Preview</DialogTitle>
          <DialogDescription>
            Review clients eligible for automatic invoice generation for{" "}
            <strong>{periodDetails?.label}</strong>
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <span className="ml-2">Loading preview data...</span>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Summary Cards */}
            <div className="grid grid-cols-3 gap-4">
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-2">
                    <Users className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="text-2xl font-bold">{eligibleClients}</p>
                      <p className="text-sm text-muted-foreground">Eligible Clients</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="text-2xl font-bold">{totalBookings}</p>
                      <p className="text-sm text-muted-foreground">Total Bookings</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-2">
                    <AlertCircle className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="text-2xl font-bold">{clientsWithoutRates}</p>
                      <p className="text-sm text-muted-foreground">No Rate Schedule</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Warning for clients without rates */}
            {clientsWithoutRates > 0 && (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  {clientsWithoutRates} client{clientsWithoutRates !== 1 ? 's' : ''} will be skipped due to missing active rate schedules.
                </AlertDescription>
              </Alert>
            )}

            {/* Client List */}
            <div className="border rounded-lg">
              <div className="max-h-[300px] overflow-y-auto">
                <table className="w-full">
                  <thead className="bg-muted sticky top-0">
                    <tr>
                      <th className="text-left p-3 text-sm font-medium">Client Name</th>
                      <th className="text-center p-3 text-sm font-medium">Bookings</th>
                      <th className="text-center p-3 text-sm font-medium">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {clientPreviews.map((client) => (
                      <tr key={client.clientId} className="border-t">
                        <td className="p-3">{client.clientName}</td>
                        <td className="text-center p-3">{client.bookingCount}</td>
                        <td className="text-center p-3">
                          {client.hasRateSchedule ? (
                            <Badge variant="default" className="bg-green-500">✓ Ready</Badge>
                          ) : (
                            <Badge variant="destructive">⚠ No Rate</Badge>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button 
            onClick={onConfirm} 
            disabled={loading || eligibleClients === 0 || !organizationId}
          >
            Generate {eligibleClients} Invoice{eligibleClients !== 1 ? 's' : ''}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

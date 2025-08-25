import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { format } from 'date-fns';
import { MyTravelRecord } from '@/hooks/useMyTravel';
import { formatCurrency } from '@/utils/currencyFormatter';
import { Eye } from 'lucide-react';

interface ViewMyTravelDialogProps {
  open: boolean;
  onClose: () => void;
  travel: MyTravelRecord | null;
}

export const ViewMyTravelDialog: React.FC<ViewMyTravelDialogProps> = ({
  open,
  onClose,
  travel,
}) => {
  if (!travel) return null;

  const getStatusBadge = (status: string) => {
    const variants = {
      approved: 'bg-success/10 text-success',
      pending: 'bg-warning/10 text-warning',
      rejected: 'bg-destructive/10 text-destructive',
      paid: 'bg-success/10 text-success',
    } as const;

    return (
      <Badge variant="secondary" className={variants[status as keyof typeof variants] || variants.pending}>
        {status}
      </Badge>
    );
  };

  const handleViewReceipt = () => {
    if (travel.receipt_url) {
      window.open(travel.receipt_url, '_blank');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Travel Record Details</DialogTitle>
          <DialogDescription>
            View travel claim details and status
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <h4 className="text-sm font-medium text-muted-foreground mb-2">Purpose</h4>
              <p className="text-sm">{travel.purpose}</p>
            </div>
            <div>
              <h4 className="text-sm font-medium text-muted-foreground mb-2">Status</h4>
              {getStatusBadge(travel.reimbursed_at ? 'paid' : travel.status)}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <h4 className="text-sm font-medium text-muted-foreground mb-2">From</h4>
              <p className="text-sm">{travel.start_location}</p>
            </div>
            <div>
              <h4 className="text-sm font-medium text-muted-foreground mb-2">To</h4>
              <p className="text-sm">{travel.end_location}</p>
            </div>
          </div>

          <div className="grid grid-cols-4 gap-4">
            <div>
              <h4 className="text-sm font-medium text-muted-foreground mb-2">Date</h4>
              <p className="text-sm">{format(new Date(travel.travel_date), 'dd/MM/yyyy')}</p>
            </div>
            <div>
              <h4 className="text-sm font-medium text-muted-foreground mb-2">Distance</h4>
              <p className="text-sm">{travel.distance_miles} miles</p>
            </div>
            <div>
              <h4 className="text-sm font-medium text-muted-foreground mb-2">Rate</h4>
              <p className="text-sm">{formatCurrency(travel.mileage_rate)}/mile</p>
            </div>
            <div>
              <h4 className="text-sm font-medium text-muted-foreground mb-2">Total Cost</h4>
              <p className="text-lg font-semibold">{formatCurrency(travel.total_cost)}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <h4 className="text-sm font-medium text-muted-foreground mb-2">Vehicle Type</h4>
              <p className="text-sm capitalize">{travel.vehicle_type.replace('_', ' ')}</p>
            </div>
            {travel.travel_time_minutes && (
              <div>
                <h4 className="text-sm font-medium text-muted-foreground mb-2">Travel Time</h4>
                <p className="text-sm">{Math.floor(travel.travel_time_minutes / 60)}h {travel.travel_time_minutes % 60}m</p>
              </div>
            )}
          </div>

          <div>
            <h4 className="text-sm font-medium text-muted-foreground mb-2">Submitted</h4>
            <p className="text-sm">{format(new Date(travel.created_at), 'dd/MM/yyyy HH:mm')}</p>
          </div>

          {travel.notes && (
            <div>
              <h4 className="text-sm font-medium text-muted-foreground mb-2">Notes</h4>
              <p className="text-sm bg-muted/50 p-3 rounded-md">{travel.notes}</p>
            </div>
          )}

          {travel.approved_at && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <h4 className="text-sm font-medium text-muted-foreground mb-2">Approved Date</h4>
                <p className="text-sm">{format(new Date(travel.approved_at), 'dd/MM/yyyy HH:mm')}</p>
              </div>
              {travel.approved_by && (
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground mb-2">Approved By</h4>
                  <p className="text-sm">{travel.approved_by}</p>
                </div>
              )}
            </div>
          )}

          {travel.reimbursed_at && (
            <div>
              <h4 className="text-sm font-medium text-muted-foreground mb-2">Reimbursed Date</h4>
              <p className="text-sm">{format(new Date(travel.reimbursed_at), 'dd/MM/yyyy HH:mm')}</p>
            </div>
          )}

          {travel.receipt_url && (
            <div>
              <h4 className="text-sm font-medium text-muted-foreground mb-2">Receipt</h4>
              <Button 
                variant="outline" 
                size="sm"
                onClick={handleViewReceipt}
                className="gap-2"
              >
                <Eye className="h-4 w-4" />
                View Receipt
              </Button>
            </div>
          )}

          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={onClose}>
              Close
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
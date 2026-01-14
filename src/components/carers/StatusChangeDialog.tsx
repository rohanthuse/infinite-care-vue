
import React, { useState, useCallback, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { useControlledDialog } from "@/hooks/useDialogManager";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, CheckCircle, Clock, UserX } from "lucide-react";
import { CarerDB } from "@/data/hooks/useBranchCarers";
import { supabase } from "@/integrations/supabase/client";

interface StatusChangeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  carers: CarerDB[];
  onStatusChange: (carerIds: string[], newStatus: string, reason?: string) => void;
}

const statusOptions = [
  { value: "Active", label: "Active", icon: CheckCircle, color: "bg-green-100 text-green-800 border-green-200" },
  { value: "Inactive", label: "Inactive", icon: UserX, color: "bg-red-100 text-red-800 border-red-200" },
  { value: "On Leave", label: "On Leave", icon: AlertTriangle, color: "bg-blue-100 text-blue-800 border-blue-200" },
  { value: "Training", label: "Training", icon: Clock, color: "bg-purple-100 text-purple-800 border-purple-200" },
];

export const StatusChangeDialog = ({ open, onOpenChange, carers, onStatusChange }: StatusChangeDialogProps) => {
  // Add controlled dialog integration
  const dialogId = `status-change-${carers.map(c => c.id).join('-')}`;
  const controlledDialog = useControlledDialog(dialogId, open);
  
  const [newStatus, setNewStatus] = useState("");
  const [reason, setReason] = useState("");
  const [futureBookingsCount, setFutureBookingsCount] = useState<number>(0);
  const [isCheckingBookings, setIsCheckingBookings] = useState(false);

  // Check for future bookings when "Inactive" is selected
  useEffect(() => {
    const checkFutureBookings = async () => {
      if (newStatus !== "Inactive") {
        setFutureBookingsCount(0);
        return;
      }
      
      setIsCheckingBookings(true);
      try {
        const carerIds = carers.map(c => c.id);
        const now = new Date().toISOString();
        
        const { count, error } = await supabase
          .from('bookings')
          .select('id', { count: 'exact', head: true })
          .in('staff_id', carerIds)
          .gte('start_time', now)
          .neq('status', 'cancelled');
        
        if (!error) {
          setFutureBookingsCount(count || 0);
        }
      } catch (err) {
        console.error('Error checking future bookings:', err);
      } finally {
        setIsCheckingBookings(false);
      }
    };
    
    checkFutureBookings();
  }, [newStatus, carers]);

  // Sync with parent state and ensure proper cleanup
  const handleOpenChange = useCallback((newOpen: boolean) => {
    if (!newOpen) {
      setFutureBookingsCount(0);
      setIsCheckingBookings(false);
    }
    controlledDialog.onOpenChange(newOpen);
    onOpenChange(newOpen);
  }, [controlledDialog, onOpenChange]);

  const handleSubmit = () => {
    if (!newStatus) return;
    
    const carerIds = carers.map(carer => carer.id);
    onStatusChange(carerIds, newStatus, reason);
    
    // Reset form
    setNewStatus("");
    setReason("");
    handleOpenChange(false);
  };

  const selectedStatusOption = statusOptions.find(option => option.value === newStatus);

  // Force UI unlock function for comprehensive cleanup
  const forceUIUnlock = useCallback(() => {
    // Remove any stuck overlays
    const overlays = document.querySelectorAll('[data-radix-dialog-overlay], [data-radix-alert-dialog-overlay]');
    overlays.forEach(overlay => overlay.remove());
    
    // Remove aria-hidden and inert from any elements
    document.querySelectorAll('[aria-hidden="true"], [inert]').forEach(el => {
      el.removeAttribute('aria-hidden');
      el.removeAttribute('inert');
    });
    
    // Aggressive body/html cleanup
    document.body.style.removeProperty('overflow');
    document.body.style.removeProperty('pointer-events');
    document.documentElement.style.removeProperty('overflow');
    document.body.classList.remove('overflow-hidden');
    document.documentElement.classList.remove('overflow-hidden');
    document.body.removeAttribute('data-scroll-locked');
    document.documentElement.removeAttribute('data-scroll-locked');
  }, []);

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent 
        className="max-w-md"
        onCloseAutoFocus={() => setTimeout(forceUIUnlock, 50)}
        onEscapeKeyDown={() => {
          handleOpenChange(false);
          setTimeout(forceUIUnlock, 50);
        }}
        onPointerDownOutside={() => {
          handleOpenChange(false);
          setTimeout(forceUIUnlock, 50);
        }}
      >
        <DialogHeader>
          <DialogTitle>
            Change Status for {carers.length} Carer{carers.length > 1 ? 's' : ''}
          </DialogTitle>
          <DialogDescription>
            Update the status for the selected carer{carers.length > 1 ? 's' : ''}. Choose the appropriate status and optionally provide a reason for the change.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Selected Carers</Label>
            <div className="max-h-32 overflow-y-auto border rounded-md p-2 space-y-1">
              {carers.map(carer => (
                <div key={carer.id} className="flex items-center justify-between text-sm">
                  <span>{carer.first_name} {carer.last_name}</span>
                  <Badge variant="outline" className="text-xs">
                    {carer.status}
                  </Badge>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="new-status">New Status *</Label>
            <Select value={newStatus} onValueChange={setNewStatus}>
              <SelectTrigger>
                <SelectValue placeholder="Select new status" />
              </SelectTrigger>
              <SelectContent>
                {statusOptions.map(option => {
                  const Icon = option.icon;
                  return (
                    <SelectItem key={option.value} value={option.value}>
                      <div className="flex items-center gap-2">
                        <Icon className="h-4 w-4" />
                        {option.label}
                      </div>
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
          </div>

          {selectedStatusOption && (
            <div className="p-3 border rounded-md bg-gray-50">
              <Badge variant="outline" className={selectedStatusOption.color}>
                <selectedStatusOption.icon className="h-3 w-3 mr-1" />
                {selectedStatusOption.label}
              </Badge>
              <p className="text-sm text-gray-600 mt-1">
                {newStatus === "Active" && "Carer will be able to receive new bookings and access the system."}
                {newStatus === "Inactive" && "Carer will be blocked from logging in. They can be reactivated later."}
                {newStatus === "On Leave" && "Carer is temporarily unavailable but will return. Can still log in."}
                {newStatus === "Training" && "Carer is currently in training and has limited availability. Can still log in."}
              </p>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="reason">Reason for Change (Optional)</Label>
            <Textarea
              id="reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Enter reason for status change..."
              rows={3}
            />
          </div>

          {/* Future bookings warning for Inactive status */}
          {newStatus === "Inactive" && isCheckingBookings && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground p-3 border rounded-md bg-muted/50">
              <div className="animate-spin h-4 w-4 border-2 border-primary border-t-transparent rounded-full"></div>
              Checking for future bookings...
            </div>
          )}
          
          {newStatus === "Inactive" && !isCheckingBookings && futureBookingsCount > 0 && (
            <div className="p-3 border border-amber-300 rounded-md bg-amber-50">
              <div className="flex items-start gap-2">
                <AlertTriangle className="h-5 w-5 text-amber-600 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-sm font-medium text-amber-800">
                    Warning: {futureBookingsCount} future booking{futureBookingsCount > 1 ? 's' : ''} assigned
                  </p>
                  <p className="text-sm text-amber-700 mt-1">
                    These bookings will become orphaned in the Unified Schedule. 
                    Consider reassigning them before marking this carer as inactive.
                  </p>
                </div>
              </div>
            </div>
          )}
          
          {newStatus === "Inactive" && !isCheckingBookings && futureBookingsCount === 0 && (
            <div className="flex items-center gap-2 text-sm text-green-600 p-3 border border-green-200 rounded-md bg-green-50">
              <CheckCircle className="h-4 w-4" />
              No future bookings assigned
            </div>
          )}

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={() => handleOpenChange(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleSubmit} 
              disabled={!newStatus}
              className="bg-blue-600 hover:bg-blue-700"
            >
              Update Status
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

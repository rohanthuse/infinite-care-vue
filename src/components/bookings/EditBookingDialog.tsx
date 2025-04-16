
import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Booking, Client, Carer } from "./BookingTimeGrid";
import { toast } from "sonner";

interface EditBookingDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  booking: Booking | null;
  clients: Client[];
  carers: Carer[];
  onUpdateBooking: (booking: Booking) => void;
}

export const EditBookingDialog: React.FC<EditBookingDialogProps> = ({
  open,
  onOpenChange,
  booking,
  clients,
  carers,
  onUpdateBooking,
}) => {
  const [selectedClientId, setSelectedClientId] = useState<string>("");
  const [selectedCarerId, setSelectedCarerId] = useState<string>("");
  const [notes, setNotes] = useState<string>("");
  const [status, setStatus] = useState<string>("");
  
  useEffect(() => {
    if (booking) {
      setSelectedClientId(booking.clientId);
      setSelectedCarerId(booking.carerId);
      setNotes(booking.notes || "");
      setStatus(booking.status);
    }
  }, [booking]);
  
  const handleSave = () => {
    if (!booking) return;
    
    const selectedClient = clients.find(c => c.id === selectedClientId);
    const selectedCarer = carers.find(c => c.id === selectedCarerId);
    
    if (!selectedClient || !selectedCarer) {
      toast.error("Please select both client and carer");
      return;
    }
    
    const updatedBooking: Booking = {
      ...booking,
      clientId: selectedClient.id,
      clientName: selectedClient.name,
      clientInitials: selectedClient.initials,
      carerId: selectedCarer.id,
      carerName: selectedCarer.name,
      notes: notes,
      status: status as Booking["status"],
    };
    
    onUpdateBooking(updatedBooking);
    toast.success("Booking updated successfully");
    onOpenChange(false);
  };
  
  if (!booking) return null;
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Edit Booking</DialogTitle>
        </DialogHeader>
        
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="client">Client</Label>
            <Select
              value={selectedClientId}
              onValueChange={setSelectedClientId}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select client" />
              </SelectTrigger>
              <SelectContent>
                {clients.map((client) => (
                  <SelectItem key={client.id} value={client.id}>
                    <div className="flex items-center">
                      <div className="h-6 w-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-xs font-medium mr-2">
                        {client.initials}
                      </div>
                      <span>{client.name}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div className="grid gap-2">
            <Label htmlFor="carer">Carer</Label>
            <Select
              value={selectedCarerId}
              onValueChange={setSelectedCarerId}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select carer" />
              </SelectTrigger>
              <SelectContent>
                {carers.map((carer) => (
                  <SelectItem key={carer.id} value={carer.id}>
                    <div className="flex items-center">
                      <div className="h-6 w-6 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center text-xs font-medium mr-2">
                        {carer.initials}
                      </div>
                      <span>{carer.name}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div className="grid gap-2">
            <Label htmlFor="status">Status</Label>
            <Select
              value={status}
              onValueChange={setStatus}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="assigned">Assigned</SelectItem>
                <SelectItem value="unassigned">Unassigned</SelectItem>
                <SelectItem value="done">Done</SelectItem>
                <SelectItem value="in-progress">In Progress</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
                <SelectItem value="departed">Departed</SelectItem>
                <SelectItem value="suspended">Suspended</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="grid gap-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add any notes about this booking"
              className="resize-none"
            />
          </div>
        </div>
        
        <DialogFooter className="sm:justify-between">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </Button>
          <Button onClick={handleSave}>
            Save Changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

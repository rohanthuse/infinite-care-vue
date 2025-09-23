
import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, CheckCircle, Clock, UserX } from "lucide-react";
import { CarerDB } from "@/data/hooks/useBranchCarers";

interface StatusChangeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  carers: CarerDB[];
  onStatusChange: (carerIds: string[], newStatus: string, reason?: string) => void;
}

const statusOptions = [
  { value: "Active", label: "Active", icon: CheckCircle, color: "bg-green-100 text-green-800 border-green-200" },
  { value: "Inactive", label: "Inactive", icon: UserX, color: "bg-red-100 text-red-800 border-red-200" },
  { value: "Pending Invitation", label: "Pending Invitation", icon: Clock, color: "bg-yellow-100 text-yellow-800 border-yellow-200" },
  { value: "On Leave", label: "On Leave", icon: AlertTriangle, color: "bg-blue-100 text-blue-800 border-blue-200" },
  { value: "Training", label: "Training", icon: Clock, color: "bg-purple-100 text-purple-800 border-purple-200" },
];

export const StatusChangeDialog = ({ open, onOpenChange, carers, onStatusChange }: StatusChangeDialogProps) => {
  const [newStatus, setNewStatus] = useState("");
  const [reason, setReason] = useState("");

  const handleSubmit = () => {
    if (!newStatus) return;
    
    const carerIds = carers.map(carer => carer.id);
    onStatusChange(carerIds, newStatus, reason);
    
    // Reset form
    setNewStatus("");
    setReason("");
    onOpenChange(false);
  };

  const selectedStatusOption = statusOptions.find(option => option.value === newStatus);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
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
                {newStatus === "Inactive" && "Carer will not receive new bookings but will retain system access."}
                {newStatus === "Pending Invitation" && "Carer has not yet accepted their invitation to join."}
                {newStatus === "On Leave" && "Carer is temporarily unavailable but will return."}
                {newStatus === "Training" && "Carer is currently in training and has limited availability."}
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

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
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

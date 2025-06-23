
import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useCreateNews2Patient } from "@/hooks/useNews2Data";
import { useBranchClients } from "@/data/hooks/useBranchClients";
import { useCarerAuth } from "@/hooks/useCarerAuth";
import { UserPlus } from "lucide-react";

interface AddPatientToNews2DialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  existingPatientIds?: string[];
}

export function AddPatientToNews2Dialog({ 
  open, 
  onOpenChange, 
  existingPatientIds = [] 
}: AddPatientToNews2DialogProps) {
  const [selectedClientId, setSelectedClientId] = useState("");
  const [assignedCarerId, setAssignedCarerId] = useState("");
  const [notes, setNotes] = useState("");

  const { carerProfile } = useCarerAuth();
  const createNews2Patient = useCreateNews2Patient();

  // Fetch clients from the current branch
  const { data: clientsResponse, isLoading: clientsLoading } = useBranchClients(carerProfile?.branch_id || "");

  // Filter out clients who are already enrolled in NEWS2
  const availableClients = clientsResponse?.clients?.filter(
    client => !existingPatientIds.includes(client.id)
  ) || [];

  const handleSubmit = async () => {
    if (!selectedClientId || !carerProfile?.branch_id) {
      return;
    }

    try {
      await createNews2Patient.mutateAsync({
        clientId: selectedClientId,
        branchId: carerProfile.branch_id,
        assignedCarerId: assignedCarerId || undefined,
      });

      // Reset form and close dialog
      setSelectedClientId("");
      setAssignedCarerId("");
      setNotes("");
      onOpenChange(false);
    } catch (error) {
      console.error('Error adding patient to NEWS2:', error);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserPlus className="h-5 w-5" />
            Add Patient to NEWS2 Monitoring
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="client">Select Client</Label>
            {clientsLoading ? (
              <div className="text-sm text-gray-500">Loading clients...</div>
            ) : availableClients.length === 0 ? (
              <div className="text-sm text-gray-500">
                All clients in this branch are already enrolled in NEWS2 monitoring.
              </div>
            ) : (
              <Select value={selectedClientId} onValueChange={setSelectedClientId}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose a client to enroll" />
                </SelectTrigger>
                <SelectContent>
                  {availableClients.map((client) => (
                    <SelectItem key={client.id} value={client.id}>
                      {client.first_name} {client.last_name}
                      {client.date_of_birth && (
                        <span className="text-sm text-gray-500 ml-2">
                          (DOB: {new Date(client.date_of_birth).toLocaleDateString()})
                        </span>
                      )}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notes (Optional)</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Any additional notes about this patient's NEWS2 monitoring..."
              rows={3}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button 
            onClick={handleSubmit} 
            disabled={!selectedClientId || createNews2Patient.isPending || availableClients.length === 0}
          >
            {createNews2Patient.isPending ? "Adding..." : "Add Patient"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

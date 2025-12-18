import React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { format } from "date-fns";

interface Medication {
  id?: string;
  name: string;
  dosage: string;
  frequency: string;
  start_date: string;
  end_date?: string;
  status?: string;
  shape?: string;
  route?: string;
  who_administers?: string;
  level?: string;
  instruction?: string;
  warning?: string;
  side_effect?: string;
}

interface MedicationDetailsDialogProps {
  isOpen: boolean;
  onClose: () => void;
  medication: Medication | null;
}

export function MedicationDetailsDialog({ isOpen, onClose, medication }: MedicationDetailsDialogProps) {
  if (!medication) return null;

  const formatFrequency = (frequency: string) => {
    // Handle weekly with day: "weekly_monday" format
    if (frequency.startsWith("weekly_")) {
      const day = frequency.split("_")[1];
      const dayLabel = day.charAt(0).toUpperCase() + day.slice(1);
      return `Weekly (${dayLabel})`;
    }
    
    const freqMap: Record<string, string> = {
      once_daily: "Once daily",
      twice_daily: "Twice daily", 
      three_times_daily: "Three times daily",
      four_times_daily: "Four times daily",
      every_other_day: "Every other day",
      weekly: "Weekly",
      monthly: "Monthly",
      as_needed: "As needed"
    };
    return freqMap[frequency] || frequency;
  };

  const formatDate = (dateStr: string) => {
    try {
      return format(new Date(dateStr), "PPP");
    } catch {
      return dateStr;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Medication Details</DialogTitle>
        </DialogHeader>

        <ScrollArea className="max-h-[70vh] pr-2">
          <div className="space-y-6">
            {/* Basic Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-600">Name</label>
                <p className="font-semibold">{medication.name}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600">Dosage</label>
                <p>{medication.dosage}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600">Shape</label>
                <p>{medication.shape || "—"}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600">Route</label>
                <p>{medication.route || "—"}</p>
              </div>
            </div>

            {/* Administration */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-600">Who Administers</label>
                <p>{medication.who_administers || "—"}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600">Level</label>
                <p>{medication.level || "—"}</p>
              </div>
            </div>

            {/* Schedule */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-600">Frequency</label>
                <p>{formatFrequency(medication.frequency)}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600">Start Date</label>
                <p>{formatDate(medication.start_date)}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600">End Date</label>
                <p>{medication.end_date ? formatDate(medication.end_date) : "—"}</p>
              </div>
            </div>

            {/* Status */}
            <div>
              <label className="text-sm font-medium text-gray-600">Status</label>
              <div className="mt-1">
                <Badge variant={medication.status === "active" ? "default" : "secondary"}>
                  {medication.status || "active"}
                </Badge>
              </div>
            </div>

            {/* Additional Information */}
            {(medication.instruction || medication.warning || medication.side_effect) && (
              <div className="space-y-4">
                <h4 className="font-medium">Additional Information</h4>
                
                {medication.instruction && (
                  <div>
                    <label className="text-sm font-medium text-gray-600">Instructions</label>
                    <p className="text-sm bg-gray-50 p-3 rounded-md">{medication.instruction}</p>
                  </div>
                )}
                
                {medication.warning && (
                  <div>
                    <label className="text-sm font-medium text-amber-600">Warnings</label>
                    <p className="text-sm bg-amber-50 p-3 rounded-md text-amber-800">{medication.warning}</p>
                  </div>
                )}
                
                {medication.side_effect && (
                  <div>
                    <label className="text-sm font-medium text-red-600">Side Effects</label>
                    <p className="text-sm bg-red-50 p-3 rounded-md text-red-800">{medication.side_effect}</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </ScrollArea>

        <DialogFooter>
          <Button onClick={onClose}>Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
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
  time_of_day?: string[];
}

interface MedicationDetailsDialogProps {
  isOpen: boolean;
  onClose: () => void;
  medication: Medication | null;
}

const TIME_OF_DAY_LABELS: Record<string, string> = {
  morning: "Morning (6 AM - 12 PM)",
  afternoon: "Afternoon (12 PM - 5 PM)",
  evening: "Evening (5 PM - 9 PM)",
  night: "Night (9 PM - 6 AM)"
};

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
                <label className="text-sm font-medium text-muted-foreground">Name</label>
                <p className="font-semibold">{medication.name}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Dosage</label>
                <p>{medication.dosage}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Shape</label>
                <p>{medication.shape || "—"}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Route</label>
                <p>{medication.route || "—"}</p>
              </div>
            </div>

            {/* Administration */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-muted-foreground">Who Administers</label>
                <p>{medication.who_administers || "—"}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Level</label>
                <p>{medication.level || "—"}</p>
              </div>
            </div>

            {/* Schedule */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="text-sm font-medium text-muted-foreground">Frequency</label>
                <p>{formatFrequency(medication.frequency)}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Start Date</label>
                <p>{formatDate(medication.start_date)}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">End Date</label>
                <p>{medication.end_date ? formatDate(medication.end_date) : "—"}</p>
              </div>
            </div>

            {/* Time of Day */}
            {medication.time_of_day && medication.time_of_day.length > 0 && (
              <div>
                <label className="text-sm font-medium text-muted-foreground">Time of Day</label>
                <div className="flex flex-wrap gap-2 mt-1">
                  {medication.time_of_day.map(time => (
                    <Badge key={time} variant="secondary">
                      {TIME_OF_DAY_LABELS[time] || time}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Status */}
            <div>
              <label className="text-sm font-medium text-muted-foreground">Status</label>
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
                    <label className="text-sm font-medium text-muted-foreground">Instructions</label>
                    <p className="text-sm bg-muted p-3 rounded-md">{medication.instruction}</p>
                  </div>
                )}
                
                {medication.warning && (
                  <div>
                    <label className="text-sm font-medium text-amber-600">Warnings</label>
                    <p className="text-sm bg-amber-50 dark:bg-amber-950 p-3 rounded-md text-amber-800 dark:text-amber-200">{medication.warning}</p>
                  </div>
                )}
                
                {medication.side_effect && (
                  <div>
                    <label className="text-sm font-medium text-red-600">Side Effects</label>
                    <p className="text-sm bg-red-50 dark:bg-red-950 p-3 rounded-md text-red-800 dark:text-red-200">{medication.side_effect}</p>
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

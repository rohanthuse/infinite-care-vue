import React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
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

  const DetailRow = ({ label, value }: { label: string; value: string | undefined | null }) => (
    <div>
      <label className="text-sm font-medium text-muted-foreground">{label}</label>
      <p className="mt-1">{value || "—"}</p>
    </div>
  );

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle>Medication Details</DialogTitle>
        </DialogHeader>

        <ScrollArea className="max-h-[70vh] pr-4">
          <div className="space-y-6">
            {/* Section 1: Basic Information */}
            <div>
              <h4 className="font-medium text-sm text-muted-foreground mb-3">Basic Information</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <DetailRow label="Name" value={medication.name} />
                <DetailRow label="Dosage" value={medication.dosage} />
                <DetailRow label="Shape" value={medication.shape} />
                <DetailRow label="Route" value={medication.route} />
              </div>
            </div>

            <Separator />

            {/* Section 2: Schedule */}
            <div>
              <h4 className="font-medium text-sm text-muted-foreground mb-3">Schedule</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <DetailRow label="Frequency" value={formatFrequency(medication.frequency)} />
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Time of Day</label>
                  <div className="flex flex-wrap gap-2 mt-1">
                    {medication.time_of_day && medication.time_of_day.length > 0 ? (
                      medication.time_of_day.map(time => (
                        <Badge key={time} variant="secondary">
                          {TIME_OF_DAY_LABELS[time] || time}
                        </Badge>
                      ))
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <Separator />

            {/* Section 3: Administration */}
            <div>
              <h4 className="font-medium text-sm text-muted-foreground mb-3">Administration</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <DetailRow label="Who Administers" value={medication.who_administers} />
                <DetailRow label="Level" value={medication.level} />
              </div>
            </div>

            <Separator />

            {/* Section 4: Dates & Status */}
            <div>
              <h4 className="font-medium text-sm text-muted-foreground mb-3">Dates & Status</h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <DetailRow label="Start Date" value={formatDate(medication.start_date)} />
                <DetailRow label="End Date" value={medication.end_date ? formatDate(medication.end_date) : undefined} />
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Status</label>
                  <div className="mt-1">
                    <Badge variant={medication.status === "active" ? "default" : "secondary"}>
                      {medication.status || "active"}
                    </Badge>
                  </div>
                </div>
              </div>
            </div>

            <Separator />

            {/* Section 5: Additional Notes */}
            <div>
              <h4 className="font-medium text-sm text-muted-foreground mb-3">Additional Notes</h4>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Instructions</label>
                  <p className="text-sm bg-muted p-3 rounded-md mt-1">
                    {medication.instruction || "—"}
                  </p>
                </div>
                
                <div>
                  <label className="text-sm font-medium text-amber-600">Warnings</label>
                  <p className="text-sm bg-amber-50 dark:bg-amber-950 p-3 rounded-md text-amber-800 dark:text-amber-200 mt-1">
                    {medication.warning || "—"}
                  </p>
                </div>
                
                <div>
                  <label className="text-sm font-medium text-red-600">Side Effects</label>
                  <p className="text-sm bg-red-50 dark:bg-red-950 p-3 rounded-md text-red-800 dark:text-red-200 mt-1">
                    {medication.side_effect || "—"}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </ScrollArea>

        <DialogFooter>
          <Button onClick={onClose}>Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Clock } from "lucide-react";
import { format } from "date-fns";

interface ScheduleMessageDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (date: string, time: string) => void;
}

export const ScheduleMessageDialog: React.FC<ScheduleMessageDialogProps> = ({
  open,
  onOpenChange,
  onConfirm,
}) => {
  const [scheduledDate, setScheduledDate] = useState("");
  const [scheduledTime, setScheduledTime] = useState("");

  // Set default values when dialog opens
  useEffect(() => {
    if (open) {
      const now = new Date();
      const tomorrow = new Date(now);
      tomorrow.setDate(tomorrow.getDate() + 1);
      
      const dateStr = tomorrow.toISOString().split('T')[0];
      const timeStr = "09:00";
      
      setScheduledDate(dateStr);
      setScheduledTime(timeStr);
    }
  }, [open]);

  const handleConfirm = () => {
    if (!scheduledDate || !scheduledTime) {
      return;
    }
    onConfirm(scheduledDate, scheduledTime);
    onOpenChange(false);
  };

  const getScheduledDateTime = () => {
    if (!scheduledDate || !scheduledTime) return null;
    try {
      const dateTime = new Date(`${scheduledDate}T${scheduledTime}`);
      return format(dateTime, "PPp");
    } catch {
      return null;
    }
  };

  const scheduledDateTime = getScheduledDateTime();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Schedule Message
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="schedule-date">Date</Label>
            <Input
              id="schedule-date"
              type="date"
              value={scheduledDate}
              onChange={(e) => setScheduledDate(e.target.value)}
              min={new Date().toISOString().split('T')[0]}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="schedule-time">Time</Label>
            <Input
              id="schedule-time"
              type="time"
              value={scheduledTime}
              onChange={(e) => setScheduledTime(e.target.value)}
            />
          </div>

          {scheduledDateTime && (
            <div className="p-3 bg-blue-50 border border-blue-200 rounded-md">
              <p className="text-sm text-blue-900">
                <span className="font-medium">Scheduled for:</span> {scheduledDateTime}
              </p>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={!scheduledDate || !scheduledTime}
          >
            <Clock className="h-4 w-4 mr-2" />
            Schedule
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

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
import { Badge } from "@/components/ui/badge";
import { Clock, Calendar } from "lucide-react";
import { toast } from "sonner";
import { useEditScheduledMessage } from "@/hooks/useEditScheduledMessage";
import { ScrollArea } from "@/components/ui/scroll-area";

interface EditScheduledMessageDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  message: any;
  branchId: string;
}

export const EditScheduledMessageDialog: React.FC<EditScheduledMessageDialogProps> = ({
  open,
  onOpenChange,
  message,
  branchId
}) => {
  const [scheduledDate, setScheduledDate] = useState("");
  const [scheduledTime, setScheduledTime] = useState("");

  const editMessage = useEditScheduledMessage();

  useEffect(() => {
    if (open && message) {
      const scheduledFor = new Date(message.scheduled_for);
      const dateStr = scheduledFor.toISOString().split('T')[0];
      const timeStr = scheduledFor.toTimeString().slice(0, 5);
      setScheduledDate(dateStr);
      setScheduledTime(timeStr);
    }
  }, [open, message]);

  const handleSave = async () => {
    if (!scheduledDate || !scheduledTime) {
      toast.error('Please select scheduled date and time');
      return;
    }

    const scheduledDateTime = new Date(`${scheduledDate}T${scheduledTime}`);
    if (scheduledDateTime <= new Date()) {
      toast.error('Scheduled time must be in the future');
      return;
    }

    await editMessage.mutateAsync({
      messageId: message.id,
      scheduled_for: scheduledDateTime.toISOString()
    });

    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle>Edit Scheduled Message</DialogTitle>
        </DialogHeader>

        <ScrollArea className="max-h-[calc(90vh-200px)] pr-4">
          <div className="space-y-6">
            {/* Read-only Message Details */}
            <div className="bg-muted/50 rounded-lg p-4 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-muted-foreground">Message Details</h3>
                <Badge variant="secondary" className="text-xs">Read-only</Badge>
              </div>
              
              {message?.subject && (
                <div>
                  <Label className="text-xs text-muted-foreground">Subject</Label>
                  <p className="text-sm mt-1">{message.subject}</p>
                </div>
              )}

              <div>
                <Label className="text-xs text-muted-foreground">Type</Label>
                <div className="mt-1">
                  <Badge variant="outline">{message?.message_type || 'N/A'}</Badge>
                </div>
              </div>

              <div>
                <Label className="text-xs text-muted-foreground">Priority</Label>
                <div className="mt-1">
                  <Badge variant={
                    message?.priority === 'high' ? 'destructive' : 
                    message?.priority === 'medium' ? 'default' : 
                    'secondary'
                  }>
                    {message?.priority || 'medium'}
                  </Badge>
                </div>
              </div>

              <div>
                <Label className="text-xs text-muted-foreground">Recipients</Label>
                <div className="mt-1">
                  <Badge variant="outline">
                    {message?.recipient_ids?.length || 0} recipient(s)
                  </Badge>
                </div>
              </div>

              <div>
                <Label className="text-xs text-muted-foreground">Content</Label>
                <ScrollArea className="max-h-32 mt-1">
                  <p className="text-sm whitespace-pre-wrap">{message?.content}</p>
                </ScrollArea>
              </div>

              {message?.action_required && (
                <Badge variant="outline" className="text-xs">Action Required</Badge>
              )}
              {message?.admin_eyes_only && (
                <Badge variant="outline" className="text-xs">Admin Eyes Only</Badge>
              )}
            </div>

            {/* Editable Schedule Section */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-primary" />
                <h3 className="text-sm font-semibold">Reschedule Message</h3>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="scheduled-date" className="flex items-center gap-2">
                    <Calendar className="h-3 w-3" />
                    Scheduled Date *
                  </Label>
                  <Input
                    id="scheduled-date"
                    type="date"
                    value={scheduledDate}
                    onChange={(e) => setScheduledDate(e.target.value)}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="scheduled-time" className="flex items-center gap-2">
                    <Clock className="h-3 w-3" />
                    Scheduled Time *
                  </Label>
                  <Input
                    id="scheduled-time"
                    type="time"
                    value={scheduledTime}
                    onChange={(e) => setScheduledTime(e.target.value)}
                    className="mt-1"
                  />
                </div>
              </div>
            </div>
          </div>
        </ScrollArea>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={editMessage.isPending}>
            <Clock className="h-4 w-4 mr-2" />
            {editMessage.isPending ? "Updating..." : "Update Schedule"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

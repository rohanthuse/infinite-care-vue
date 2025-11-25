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
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Save } from "lucide-react";
import { toast } from "sonner";
import { useEditScheduledMessage } from "@/hooks/useEditScheduledMessage";
import { useAdminContacts } from "@/hooks/useAdminMessaging";
import { CommunicationTypeSelector } from "@/components/messaging/CommunicationTypeSelector";
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
  const [subject, setSubject] = useState("");
  const [content, setContent] = useState("");
  const [selectedRecipients, setSelectedRecipients] = useState<string[]>([]);
  const [messageType, setMessageType] = useState("");
  const [priority, setPriority] = useState<"low" | "medium" | "high">("medium");
  const [actionRequired, setActionRequired] = useState(false);
  const [adminEyesOnly, setAdminEyesOnly] = useState(false);
  const [scheduledDate, setScheduledDate] = useState("");
  const [scheduledTime, setScheduledTime] = useState("");
  const [notificationMethods, setNotificationMethods] = useState({
    email: false,
    mobileApp: false,
    otherEmail: false
  });
  const [otherEmailAddress, setOtherEmailAddress] = useState("");

  const editMessage = useEditScheduledMessage();
  const { data: contacts = [] } = useAdminContacts(branchId);

  useEffect(() => {
    if (open && message) {
      setSubject(message.subject || "");
      setContent(message.content || "");
      setSelectedRecipients(message.recipient_ids || []);
      setMessageType(message.message_type || "");
      setPriority(message.priority || "medium");
      setActionRequired(message.action_required || false);
      setAdminEyesOnly(message.admin_eyes_only || false);
      
      const scheduledFor = new Date(message.scheduled_for);
      const dateStr = scheduledFor.toISOString().split('T')[0];
      const timeStr = scheduledFor.toTimeString().slice(0, 5);
      setScheduledDate(dateStr);
      setScheduledTime(timeStr);

      const methods = message.notification_methods || [];
      setNotificationMethods({
        email: methods.includes('email'),
        mobileApp: methods.includes('mobileApp'),
        otherEmail: methods.includes('otherEmail')
      });
      setOtherEmailAddress(message.other_email_address || "");
    }
  }, [open, message]);

  const handleSave = async () => {
    if (!content.trim()) {
      toast.error('Please enter message content');
      return;
    }
    if (!messageType) {
      toast.error('Please select a message type');
      return;
    }
    if (selectedRecipients.length === 0) {
      toast.error('Please select at least one recipient');
      return;
    }
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
      updates: {
        subject: subject.trim() || null,
        content: content.trim(),
        recipient_ids: selectedRecipients,
        scheduled_for: scheduledDateTime.toISOString(),
        message_type: messageType,
        priority,
        action_required: actionRequired,
        admin_eyes_only: adminEyesOnly,
        notification_methods: Object.entries(notificationMethods)
          .filter(([_, enabled]) => enabled)
          .map(([method, _]) => method),
        other_email_address: notificationMethods.otherEmail ? otherEmailAddress.trim() : null,
        attachments: message.attachments || []
      }
    });

    onOpenChange(false);
  };

  const toggleRecipient = (recipientId: string) => {
    setSelectedRecipients(prev =>
      prev.includes(recipientId)
        ? prev.filter(id => id !== recipientId)
        : [...prev, recipientId]
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle>Edit Scheduled Message</DialogTitle>
        </DialogHeader>

        <ScrollArea className="max-h-[calc(90vh-200px)] pr-4">
          <div className="space-y-6">
            <div>
              <Label htmlFor="subject">Subject (Optional)</Label>
              <Input
                id="subject"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="Enter subject"
              />
            </div>

            <div>
              <Label>Message Type *</Label>
              <CommunicationTypeSelector
                value={messageType}
                onValueChange={setMessageType}
              />
            </div>

            <div>
              <Label htmlFor="content">Message Content *</Label>
              <Textarea
                id="content"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Enter your message"
                className="min-h-[120px]"
              />
            </div>

            <div>
              <Label>Recipients * ({selectedRecipients.length} selected)</Label>
              <ScrollArea className="h-48 border rounded-md p-4">
                <div className="space-y-2">
                  {contacts.map((contact: any) => (
                    <div key={contact.id} className="flex items-center gap-2">
                      <Checkbox
                        checked={selectedRecipients.includes(contact.auth_user_id)}
                        onCheckedChange={() => toggleRecipient(contact.auth_user_id)}
                      />
                      <span className="text-sm">{contact.name}</span>
                      <Badge variant="outline" className="text-xs">
                        {contact.type}
                      </Badge>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="scheduled-date">Scheduled Date *</Label>
                <Input
                  id="scheduled-date"
                  type="date"
                  value={scheduledDate}
                  onChange={(e) => setScheduledDate(e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="scheduled-time">Scheduled Time *</Label>
                <Input
                  id="scheduled-time"
                  type="time"
                  value={scheduledTime}
                  onChange={(e) => setScheduledTime(e.target.value)}
                />
              </div>
            </div>

            <div>
              <Label>Priority</Label>
              <div className="flex gap-2 mt-2">
                {(['low', 'medium', 'high'] as const).map((p) => (
                  <Button
                    key={p}
                    size="sm"
                    variant={priority === p ? "default" : "outline"}
                    onClick={() => setPriority(p)}
                  >
                    {p.charAt(0).toUpperCase() + p.slice(1)}
                  </Button>
                ))}
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Checkbox
                  checked={actionRequired}
                  onCheckedChange={(checked) => setActionRequired(!!checked)}
                />
                <Label className="cursor-pointer">Action Required</Label>
              </div>
              <div className="flex items-center gap-2">
                <Checkbox
                  checked={adminEyesOnly}
                  onCheckedChange={(checked) => setAdminEyesOnly(!!checked)}
                />
                <Label className="cursor-pointer">Admin Eyes Only</Label>
              </div>
            </div>

            <div>
              <Label>Notification Methods</Label>
              <div className="space-y-2 mt-2">
                <div className="flex items-center gap-2">
                  <Checkbox
                    checked={notificationMethods.email}
                    onCheckedChange={(checked) =>
                      setNotificationMethods((prev) => ({ ...prev, email: !!checked }))
                    }
                  />
                  <Label className="cursor-pointer">Email</Label>
                </div>
                <div className="flex items-center gap-2">
                  <Checkbox
                    checked={notificationMethods.mobileApp}
                    onCheckedChange={(checked) =>
                      setNotificationMethods((prev) => ({ ...prev, mobileApp: !!checked }))
                    }
                  />
                  <Label className="cursor-pointer">Mobile App</Label>
                </div>
                <div className="flex items-center gap-2">
                  <Checkbox
                    checked={notificationMethods.otherEmail}
                    onCheckedChange={(checked) =>
                      setNotificationMethods((prev) => ({ ...prev, otherEmail: !!checked }))
                    }
                  />
                  <Label className="cursor-pointer">Other Email</Label>
                </div>
                {notificationMethods.otherEmail && (
                  <Input
                    placeholder="Enter email address"
                    value={otherEmailAddress}
                    onChange={(e) => setOtherEmailAddress(e.target.value)}
                    className="mt-2"
                  />
                )}
              </div>
            </div>
          </div>
        </ScrollArea>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={editMessage.isPending}>
            <Save className="h-4 w-4 mr-2" />
            {editMessage.isPending ? "Saving..." : "Save Changes"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

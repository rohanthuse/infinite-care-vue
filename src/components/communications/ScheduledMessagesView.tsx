import React, { useState } from 'react';
import { useScheduledMessages, useCancelScheduledMessage } from '@/hooks/useMessageDraftsAndScheduled';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Clock, X, Calendar, Pencil } from 'lucide-react';
import { format } from 'date-fns';
import { EditScheduledMessageDialog } from './EditScheduledMessageDialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface ScheduledMessagesViewProps {
  branchId?: string;
}

export const ScheduledMessagesView: React.FC<ScheduledMessagesViewProps> = ({ 
  branchId = "1" 
}) => {
  const { data: scheduledMessages = [], isLoading } = useScheduledMessages();
  const cancelMessage = useCancelScheduledMessage();
  const [editDialog, setEditDialog] = useState<{
    open: boolean;
    message: any | null;
  }>({ open: false, message: null });
  const [cancelDialog, setCancelDialog] = useState<{
    open: boolean;
    messageId: string | null;
  }>({ open: false, messageId: null });

  const handleCancelClick = (messageId: string) => {
    setCancelDialog({ open: true, messageId });
  };

  const handleConfirmCancel = async () => {
    if (cancelDialog.messageId) {
      await cancelMessage.mutateAsync(cancelDialog.messageId);
      setCancelDialog({ open: false, messageId: null });
    }
  };

  if (isLoading) {
    return <div className="p-8 text-center text-muted-foreground">Loading scheduled messages...</div>;
  }

  if (scheduledMessages.length === 0) {
    return (
      <div className="p-8 text-center">
        <Calendar className="h-16 w-16 mx-auto text-muted mb-4" />
        <h3 className="text-lg font-medium text-foreground mb-2">No Scheduled Messages</h3>
        <p className="text-muted-foreground">Messages you schedule for later will appear here.</p>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      <div className="flex-1 overflow-auto p-6 pt-4 space-y-4">
        <h2 className="text-2xl font-bold mb-4 text-foreground">Scheduled Messages ({scheduledMessages.length})</h2>
        {scheduledMessages.map((msg: any) => (
          <Card key={msg.id} className="border-l-4 border-l-primary">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <CardTitle className="text-base mb-2 text-foreground">
                    {msg.subject || 'No Subject'}
                  </CardTitle>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Clock className="h-4 w-4" />
                    <span className="font-medium">
                      Scheduled for: {format(new Date(msg.scheduled_for), 'PPp')}
                    </span>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setEditDialog({ open: true, message: msg })}
                  >
                    <Pencil className="h-4 w-4 mr-1" />
                    Edit
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => handleCancelClick(msg.id)}
                  >
                    <X className="h-4 w-4 mr-1" />
                    Cancel
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex gap-2 flex-wrap">
                  {msg.priority && msg.priority !== 'medium' && (
                    <Badge variant={msg.priority === 'high' ? 'destructive' : 'secondary'}>
                      {msg.priority}
                    </Badge>
                  )}
                  {msg.action_required && <Badge variant="destructive">Action Required</Badge>}
                  {msg.admin_eyes_only && <Badge>Admin Only</Badge>}
                </div>
                <p className="text-sm text-foreground line-clamp-3">{msg.content}</p>
                <div className="text-xs text-muted-foreground">
                  Recipients: {msg.recipient_ids?.length || 0} people
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
      
      <EditScheduledMessageDialog
        open={editDialog.open}
        onOpenChange={(open) => setEditDialog({ open, message: null })}
        message={editDialog.message}
        branchId={branchId}
      />

      <AlertDialog open={cancelDialog.open} onOpenChange={(open) => setCancelDialog({ open, messageId: null })}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cancel Scheduled Message?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to cancel this scheduled message? This action cannot be undone.
              The message will not be sent to recipients.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>No, Keep It</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmCancel}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Yes, Cancel Message
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

import React from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { CheckCheck, Clock } from 'lucide-react';
import { useMessageReadReceipts } from '@/hooks/useMessageReadReceipts';
import { format } from 'date-fns';

interface MessageInfoSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  messageId: string;
  threadId: string;
}

export const MessageInfoSheet = ({ open, onOpenChange, messageId, threadId }: MessageInfoSheetProps) => {
  const { data: readStatus, isLoading } = useMessageReadReceipts(messageId, threadId);

  const formatTimestamp = (timestamp: string) => {
    return format(new Date(timestamp), 'MMM d, h:mm a');
  };

  const getAvatarInitials = (name: string) => {
    return name.split(' ').map(n => n.charAt(0)).join('').slice(0, 2).toUpperCase();
  };

  const deliveredRecipients = readStatus?.readers.filter(r => r.deliveredAt) || [];
  const seenRecipients = readStatus?.readers.filter(r => r.readAt) || [];
  const notSeenRecipients = readStatus?.readers.filter(r => r.deliveredAt && !r.readAt) || [];

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-md overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Message Info</SheetTitle>
        </SheetHeader>

        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <div className="text-muted-foreground">Loading...</div>
          </div>
        ) : (
          <div className="space-y-6 mt-6">
            {/* Seen By Section */}
            {seenRecipients.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <CheckCheck className="h-4 w-4 text-blue-500" />
                  <h3 className="font-semibold text-sm uppercase text-muted-foreground">
                    Seen By ({seenRecipients.length})
                  </h3>
                </div>
                <div className="space-y-3">
                  {seenRecipients.map((recipient, index) => (
                    <div key={index} className="flex items-start gap-3 py-2">
                      <Avatar className="h-10 w-10">
                        <AvatarFallback className="text-xs bg-primary/10">
                          {getAvatarInitials(recipient.userName)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate">{recipient.userName}</p>
                        {recipient.readAt && (
                          <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                            <Clock className="h-3 w-3" />
                            {formatTimestamp(recipient.readAt)}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Delivered To Section */}
            {notSeenRecipients.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <CheckCheck className="h-4 w-4 text-muted-foreground" />
                  <h3 className="font-semibold text-sm uppercase text-muted-foreground">
                    Delivered But Not Seen ({notSeenRecipients.length})
                  </h3>
                </div>
                <div className="space-y-3">
                  {notSeenRecipients.map((recipient, index) => (
                    <div key={index} className="flex items-start gap-3 py-2">
                      <Avatar className="h-10 w-10">
                        <AvatarFallback className="text-xs bg-muted">
                          {getAvatarInitials(recipient.userName)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate">{recipient.userName}</p>
                        {recipient.deliveredAt && (
                          <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                            <Clock className="h-3 w-3" />
                            Delivered: {formatTimestamp(recipient.deliveredAt)}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* All Delivered Section - shows all recipients with delivery time */}
            {deliveredRecipients.length > 0 && seenRecipients.length === 0 && notSeenRecipients.length === 0 && (
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <CheckCheck className="h-4 w-4 text-muted-foreground" />
                  <h3 className="font-semibold text-sm uppercase text-muted-foreground">
                    Delivered To ({deliveredRecipients.length})
                  </h3>
                </div>
                <div className="space-y-3">
                  {deliveredRecipients.map((recipient, index) => (
                    <div key={index} className="flex items-start gap-3 py-2">
                      <Avatar className="h-10 w-10">
                        <AvatarFallback className="text-xs bg-muted">
                          {getAvatarInitials(recipient.userName)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate">{recipient.userName}</p>
                        {recipient.deliveredAt && (
                          <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                            <Clock className="h-3 w-3" />
                            {formatTimestamp(recipient.deliveredAt)}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {readStatus?.readers.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                No delivery information available
              </div>
            )}
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
};

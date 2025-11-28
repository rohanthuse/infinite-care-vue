import React, { useState } from 'react';
import { MessageView } from '@/components/communications/MessageView';
import { SupportReplyComposer } from './SupportReplyComposer';
import { Button } from '@/components/ui/button';
import { X, Reply } from 'lucide-react';

interface SupportConversationViewProps {
  ticketId: string;
  onClose: () => void;
}

export const SupportConversationView: React.FC<SupportConversationViewProps> = ({
  ticketId,
  onClose
}) => {
  const [showReply, setShowReply] = useState(false);

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b border-border bg-card flex items-center justify-between">
        <h3 className="font-semibold text-foreground">Support Conversation</h3>
        <div className="flex items-center gap-2">
          {!showReply && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowReply(true)}
            >
              <Reply className="h-4 w-4 mr-1" />
              Reply
            </Button>
          )}
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Conversation */}
      <div className="flex-1 overflow-hidden">
        {showReply ? (
          <SupportReplyComposer
            threadId={ticketId}
            onClose={() => setShowReply(false)}
          />
        ) : (
          <MessageView
            messageId={ticketId}
            onReply={() => setShowReply(true)}
          />
        )}
      </div>
    </div>
  );
};

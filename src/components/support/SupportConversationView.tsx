import React from 'react';
import { MessageView } from '@/components/communications/MessageView';
import { SupportMessageInputBar } from './SupportMessageInputBar';
import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';

interface SupportConversationViewProps {
  ticketId: string;
  onClose: () => void;
}

export const SupportConversationView: React.FC<SupportConversationViewProps> = ({
  ticketId,
  onClose
}) => {
  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b border-border bg-card flex items-center justify-between">
        <h3 className="font-semibold text-foreground">Support Conversation</h3>
        <Button variant="ghost" size="icon" onClick={onClose}>
          <X className="h-4 w-4" />
        </Button>
      </div>

      {/* Messages Area - Always visible */}
      <div className="flex-1 overflow-y-auto">
        <MessageView
          messageId={ticketId}
          onReply={() => {}}
        />
      </div>

      {/* Input Bar - Always visible at bottom */}
      <SupportMessageInputBar threadId={ticketId} />
    </div>
  );
};

import React from 'react';
import { Check, CheckCheck } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useMessageReadReceipts } from '@/hooks/useMessageReadReceipts';
import { cn } from '@/lib/utils';

interface MessageReadReceiptProps {
  messageId: string;
  senderId: string;
  threadId: string;
  isCurrentUserSender: boolean;
  className?: string;
}

export const MessageReadReceipt = ({ 
  messageId, 
  senderId, 
  threadId, 
  isCurrentUserSender,
  className 
}: MessageReadReceiptProps) => {
  const { data: readStatus, isLoading } = useMessageReadReceipts(messageId, threadId);

  // Only show ticks for the sender's messages
  if (!isCurrentUserSender || isLoading || !readStatus) {
    return null;
  }

  const getTickColor = () => {
    if (readStatus.status === 'all_read') return 'text-blue-500';
    return 'text-gray-400';
  };

  const getTooltipContent = () => {
    if (readStatus.status === 'sent') {
      return 'Sent';
    }
    
    if (readStatus.status === 'delivered') {
      return 'Delivered';
    }

    if (readStatus.status === 'all_read') {
      return (
        <div className="space-y-1">
          <div className="font-semibold text-xs mb-2">Read by all</div>
          {readStatus.readers
            .filter(r => r.readAt)
            .map((reader, index) => (
              <div key={index} className="text-xs">
                {reader.userName} - {new Date(reader.readAt!).toLocaleString()}
              </div>
            ))}
        </div>
      );
    }

    if (readStatus.status === 'partially_read') {
      const readRecipients = readStatus.readers.filter(r => r.readAt);
      const unreadRecipients = readStatus.readers.filter(r => !r.readAt);
      
      return (
        <div className="space-y-1">
          <div className="font-semibold text-xs mb-2">
            Read by {readRecipients.length} of {readStatus.totalRecipients}
          </div>
          {readRecipients.length > 0 && (
            <>
              <div className="text-xs font-medium text-blue-400">Read:</div>
              {readRecipients.map((reader, index) => (
                <div key={index} className="text-xs ml-2">
                  {reader.userName} - {new Date(reader.readAt!).toLocaleString()}
                </div>
              ))}
            </>
          )}
          {unreadRecipients.length > 0 && (
            <>
              <div className="text-xs font-medium text-gray-400 mt-2">Not read:</div>
              {unreadRecipients.map((reader, index) => (
                <div key={index} className="text-xs ml-2">
                  {reader.userName}
                </div>
              ))}
            </>
          )}
        </div>
      );
    }

    return 'Sent';
  };

  const renderTicks = () => {
    if (readStatus.status === 'sent') {
      return <Check className="h-4 w-4" />;
    }

    return (
      <div className="relative">
        <CheckCheck className={cn("h-4 w-4", getTickColor())} />
      </div>
    );
  };

  return (
    <TooltipProvider>
      <Tooltip delayDuration={200}>
        <TooltipTrigger asChild>
          <div className={cn("inline-flex items-center cursor-help", className)}>
            {renderTicks()}
          </div>
        </TooltipTrigger>
        <TooltipContent side="top" className="max-w-xs">
          {getTooltipContent()}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

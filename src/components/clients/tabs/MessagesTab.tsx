import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { MessageCircle, Send, Users, Clock, ArrowLeft } from 'lucide-react';
import { useClientMessageThreads, useClientThreadMessages, useSendMessageToClient } from '@/hooks/useClientProfileMessaging';
import { format } from 'date-fns';
import { toast } from 'sonner';

interface MessagesTabProps {
  clientId: string;
}

const MessagesTab: React.FC<MessagesTabProps> = ({ clientId }) => {
  const [selectedThreadId, setSelectedThreadId] = useState<string | null>(null);
  const [newMessage, setNewMessage] = useState('');
  const [isSending, setIsSending] = useState(false);

  const { data: threads = [], isLoading: threadsLoading } = useClientMessageThreads(clientId);
  const { data: messages = [], isLoading: messagesLoading } = useClientThreadMessages(selectedThreadId || '');
  const sendMessageMutation = useSendMessageToClient();

  const handleSendMessage = async () => {
    if (!selectedThreadId || !newMessage.trim()) return;

    setIsSending(true);
    try {
      await sendMessageMutation.mutateAsync({
        threadId: selectedThreadId,
        content: newMessage.trim()
      });
      setNewMessage('');
      toast.success('Message sent successfully');
    } catch (error) {
      console.error('Error sending message:', error);
      toast.error('Failed to send message');
    } finally {
      setIsSending(false);
    }
  };

  const selectedThread = threads.find(t => t.id === selectedThreadId);

  if (threadsLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center p-8">
          <div className="text-muted-foreground">Loading messages...</div>
        </CardContent>
      </Card>
    );
  }

  if (threads.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center p-8">
          <MessageCircle className="h-12 w-12 text-muted-foreground mb-4" />
          <div className="text-lg font-medium text-muted-foreground mb-2">No Messages Found</div>
          <div className="text-sm text-muted-foreground text-center">
            This client has no message history yet. Messages will appear here when conversations begin.
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {selectedThreadId ? (
        // Message thread view
        <Card>
          <CardHeader className="pb-4">
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSelectedThreadId(null)}
                className="p-1 h-8 w-8"
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <div className="flex-1">
                <CardTitle className="text-lg">{selectedThread?.subject}</CardTitle>
                <div className="flex items-center gap-2 mt-1">
                  <Users className="h-3 w-3 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">
                    {selectedThread?.participants.map(p => p.name).join(', ')}
                  </span>
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* Messages */}
              <ScrollArea className="h-96 pr-4">
                {messagesLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="text-muted-foreground">Loading messages...</div>
                  </div>
                ) : messages.length === 0 ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="text-muted-foreground">No messages in this thread</div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {messages.map((message, index) => (
                      <div key={message.id} className="space-y-2">
                        <div className="flex items-start gap-3">
                          <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                            <span className="text-xs font-medium text-primary">
                              {message.senderName.charAt(0).toUpperCase()}
                            </span>
                          </div>
                          <div className="flex-1 space-y-1">
                            <div className="flex items-center gap-2">
                              <span className="font-medium text-sm">{message.senderName}</span>
                              <Badge variant="outline" className="text-xs">
                                {message.senderType}
                              </Badge>
                              <span className="text-xs text-muted-foreground">
                                {format(message.timestamp, 'MMM d, yyyy at h:mm a')}
                              </span>
                            </div>
                            <div className="text-sm text-foreground bg-muted/30 rounded-lg p-3">
                              {message.content}
                            </div>
                            {message.hasAttachments && (
                              <div className="text-xs text-muted-foreground">
                                📎 Has attachments
                              </div>
                            )}
                          </div>
                        </div>
                        {index < messages.length - 1 && <Separator className="my-3" />}
                      </div>
                    ))}
                  </div>
                )}
              </ScrollArea>

              {/* Send message */}
              <div className="space-y-3 border-t pt-4">
                <Textarea
                  placeholder="Type your message here..."
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSendMessage();
                    }
                  }}
                  rows={3}
                />
                <div className="flex justify-end">
                  <Button
                    onClick={handleSendMessage}
                    disabled={!newMessage.trim() || isSending}
                    size="sm"
                  >
                    <Send className="h-4 w-4 mr-2" />
                    {isSending ? 'Sending...' : 'Send Message'}
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      ) : (
        // Thread list view
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageCircle className="h-5 w-5" />
              Message Threads ({threads.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {threads.map((thread) => (
                <div
                  key={thread.id}
                  className="border rounded-lg p-4 cursor-pointer hover:bg-muted/50 transition-colors"
                  onClick={() => setSelectedThreadId(thread.id)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center gap-2">
                        <h4 className="font-medium">{thread.subject}</h4>
                        {thread.unreadCount > 0 && (
                          <Badge variant="secondary" className="text-xs">
                            {thread.unreadCount} new
                          </Badge>
                        )}
                      </div>
                      
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Users className="h-3 w-3" />
                        <span>{thread.participants.map(p => p.name).join(', ')}</span>
                      </div>

                      {thread.lastMessage && (
                        <div className="space-y-1">
                          <div className="text-sm text-foreground">
                            <span className="font-medium">{thread.lastMessage.senderName}:</span>{' '}
                            {thread.lastMessage.content.length > 100
                              ? `${thread.lastMessage.content.substring(0, 100)}...`
                              : thread.lastMessage.content}
                          </div>
                        </div>
                      )}
                    </div>
                    
                    <div className="flex flex-col items-end gap-1">
                      {thread.lastMessage && (
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Clock className="h-3 w-3" />
                          {format(thread.lastMessage.timestamp, 'MMM d')}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default MessagesTab;
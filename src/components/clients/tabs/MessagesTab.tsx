import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { MessageCircle, Send, Users, Clock, ArrowLeft, MessageCirclePlus, ShieldAlert } from 'lucide-react';
import { useClientMessageThreads, useClientThreadMessages, useSendMessageToClient } from '@/hooks/useClientProfileMessaging';
import { MessageComposer } from '@/components/communications/MessageComposer';
import { useUserRole } from '@/hooks/useUserRole';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { useClientMessageRecipients } from '@/hooks/useClientMessageRecipients';
import { supabase } from '@/integrations/supabase/client';
import { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';

interface MessagesTabProps {
  clientId: string;
}

const MessagesTab: React.FC<MessagesTabProps> = ({ clientId }) => {
  const [selectedThreadId, setSelectedThreadId] = useState<string | null>(null);
  const [newMessage, setNewMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [showComposer, setShowComposer] = useState(false);

  const { data: threads = [], isLoading: threadsLoading, refetch: refetchThreads } = useClientMessageThreads(clientId);
  const { data: messages = [], isLoading: messagesLoading } = useClientThreadMessages(selectedThreadId || '');
  const sendMessageMutation = useSendMessageToClient();
  const { data: currentUser } = useUserRole();
  // Only fetch recipients when composer is open (lazy loading)
  const { data: clientRecipients = [], isLoading: recipientsLoading } = useClientMessageRecipients(
    showComposer ? clientId : ''
  );

  // Fetch scheduled messages for selected thread
  const { data: scheduledMessages = [] } = useQuery({
    queryKey: ['scheduled-messages', selectedThreadId],
    queryFn: async () => {
      if (!selectedThreadId) return [];
      
      const { data, error } = await supabase
        .from('scheduled_messages')
        .select('*')
        .eq('thread_id', selectedThreadId)
        .eq('status', 'pending')
        .order('scheduled_for', { ascending: true });
      
      if (error) throw error;
      return data || [];
    },
    enabled: !!selectedThreadId
  });

  // Real-time subscription for new messages
  useEffect(() => {
    if (!selectedThreadId) return;
    
    const channel = supabase
      .channel('thread-messages')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `thread_id=eq.${selectedThreadId}`
        },
        (payload) => {
          console.log('New message received:', payload);
          refetchThreads();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [selectedThreadId, refetchThreads]);

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

  const handleComposeMessage = () => {
    setShowComposer(true);
    setSelectedThreadId(null);
  };

  const handleCloseComposer = () => {
    setShowComposer(false);
    refetchThreads();
  };

  if (threadsLoading) {
    return (
      <Card>
        <CardContent className="p-4 space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex items-start gap-3 animate-pulse">
              <div className="w-10 h-10 bg-muted rounded-full flex-shrink-0" />
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-muted rounded w-3/4" />
                <div className="h-3 bg-muted rounded w-1/2" />
                <div className="h-3 bg-muted rounded w-2/3" />
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    );
  }

  if (threads.length === 0 && !showComposer) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center p-8">
          <MessageCircle className="h-12 w-12 text-muted-foreground mb-4" />
          <div className="text-lg font-medium text-muted-foreground mb-2">No Messages Found</div>
          <div className="text-sm text-muted-foreground text-center mb-4">
            This client has no message history yet. Start a conversation to begin messaging.
          </div>
          <Button onClick={handleComposeMessage} className="flex items-center gap-2">
            <MessageCirclePlus className="h-4 w-4" />
            Start Conversation
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {showComposer ? (
        // Message composer for new conversations
        <Card>
          <CardContent className="p-0">
            <MessageComposer
              branchId={currentUser?.branchId || ''}
              onClose={handleCloseComposer}
              selectedContactId={null}
              clientId={clientId}
              availableRecipients={clientRecipients}
              restrictToClientContext={true}
            />
          </CardContent>
        </Card>
      ) : selectedThreadId ? (
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
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-medium text-sm">{message.senderName}</span>
                              <Badge variant="outline" className="text-xs">
                                {message.senderType}
                              </Badge>
                              {message.adminEyesOnly && (
                                <Badge variant="secondary" className="text-xs bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400">
                                  <ShieldAlert className="h-3 w-3 mr-1" />
                                  Admin Only
                                </Badge>
                              )}
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

              {/* Scheduled Messages */}
              {scheduledMessages.length > 0 && (
                <div className="border-t pt-4 mt-4">
                  <h4 className="text-sm font-semibold mb-2 text-muted-foreground">
                    📅 Scheduled Messages ({scheduledMessages.length})
                  </h4>
                  {scheduledMessages.map((scheduled: any) => (
                    <div key={scheduled.id} className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-2">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <Badge variant="outline" className="mb-1 bg-yellow-100 text-yellow-800">
                            Scheduled for {format(new Date(scheduled.scheduled_for), 'PPp')}
                          </Badge>
                          <p className="text-sm mt-1">{scheduled.content}</p>
                        </div>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={async () => {
                            if (confirm('Cancel this scheduled message?')) {
                              await supabase
                                .from('scheduled_messages')
                                .update({ status: 'cancelled' })
                                .eq('id', scheduled.id);
                              toast.success('Scheduled message cancelled');
                            }
                          }}
                        >
                          Cancel
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

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
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <MessageCircle className="h-5 w-5" />
                Message Threads ({threads.length})
              </CardTitle>
              <Button onClick={handleComposeMessage} size="sm" variant="outline" className="flex items-center gap-2">
                <MessageCirclePlus className="h-4 w-4" />
                New Message
              </Button>
            </div>
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
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4 className="font-medium">{thread.subject}</h4>
                        {thread.adminOnly && (
                          <Badge variant="secondary" className="text-xs bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400">
                            <ShieldAlert className="h-3 w-3 mr-1" />
                            Admin Only
                          </Badge>
                        )}
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
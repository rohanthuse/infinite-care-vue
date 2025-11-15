import React, { useState } from "react";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MessageCircle, Plus, Search, Clock, User } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useUnifiedMessageThreads, useUnifiedThreadMessages, useUnifiedSendMessage } from "@/hooks/useUnifiedMessaging";
import { format } from "date-fns";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import CarerMessageComposer from "@/components/carer/CarerMessageComposer";

const CarerMessages = () => {
  const { toast } = useToast();
  const [selectedThreadId, setSelectedThreadId] = useState<string | null>(null);
  const [messageContent, setMessageContent] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [showComposer, setShowComposer] = useState(false);
  
  const { data: threads, isLoading: threadsLoading } = useUnifiedMessageThreads();
  const { data: messages, isLoading: messagesLoading } = useUnifiedThreadMessages(selectedThreadId || '');
  const sendMessageMutation = useUnifiedSendMessage();

  // Filter threads based on search term
  const filteredThreads = threads?.filter(thread => 
    thread.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
    thread.participants.some(p => p.name.toLowerCase().includes(searchTerm.toLowerCase()))
  ) || [];

  const handleSendMessage = async () => {
    if (!selectedThreadId || !messageContent.trim()) return;
    
    try {
      await sendMessageMutation.mutateAsync({
        threadId: selectedThreadId,
        content: messageContent.trim(),
        messageType: 'reply',
        priority: 'normal'
      });
      
      setMessageContent("");
      toast({
        title: "Message sent",
        description: "Your message has been sent successfully.",
      });
    } catch (error) {
      console.error('Error sending message:', error);
      toast({
        title: "Error",
        description: "Failed to send message. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleThreadSelect = (threadId: string) => {
    setSelectedThreadId(threadId);
  };

  if (threadsLoading) {
  return (
    <div className="w-full">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-10 w-32" />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <Skeleton key={i} className="h-20" />
            ))}
          </div>
          <div className="lg:col-span-2">
            <Skeleton className="h-96" />
          </div>
        </div>
      </div>
    </div>
    );
  }

  return (
    <div className="w-full">
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <MessageCircle className="h-5 w-5 md:h-6 md:w-6 text-primary" />
          <h1 className="text-xl md:text-2xl font-bold text-card-foreground">Messages</h1>
        </div>
        <div className="flex items-center gap-2">
          <Button onClick={() => setShowComposer(true)} size="sm" className="flex-1 sm:flex-initial">
            <Plus className="h-4 w-4 mr-2" />
            New Message
          </Button>
          <Badge variant="secondary" className="px-3 py-1 whitespace-nowrap">
            {filteredThreads.reduce((total, thread) => total + thread.unreadCount, 0)} unread
          </Badge>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search conversations..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6 w-full">
        {/* Thread List */}
        <Card className={`lg:col-span-1 ${selectedThreadId ? 'hidden lg:block' : ''}`}>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Conversations</span>
              <Badge variant="outline">{filteredThreads.length}</Badge>
            </CardTitle>
          </CardHeader>
          <div className="max-h-96 overflow-y-auto">
            {filteredThreads.length === 0 ? (
              <div className="p-6 text-center">
                <MessageCircle className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                <p className="text-muted-foreground">No conversations found</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Messages from clients and coordinators will appear here
                </p>
              </div>
            ) : (
              <div className="space-y-2 p-4">
                {filteredThreads.map((thread) => (
                  <div
                    key={thread.id}
                    onClick={() => handleThreadSelect(thread.id)}
                    className={`p-3 rounded-lg cursor-pointer transition-colors border ${
                      selectedThreadId === thread.id
                        ? 'bg-accent border-primary'
                        : 'hover:bg-accent/50 border-transparent'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <p className="font-medium text-sm truncate">{thread.subject}</p>
                          {thread.unreadCount > 0 && (
                            <Badge variant="secondary" className="text-xs px-1.5 py-0.5">
                              {thread.unreadCount}
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
                          <User className="h-3 w-3" />
                          <span>{thread.participants.map(p => p.name).join(', ')}</span>
                        </div>
                        {thread.lastMessage && (
                          <p className="text-xs text-muted-foreground truncate">
                            {thread.lastMessage.content}
                          </p>
                        )}
                      </div>
                      <div className="flex flex-col items-end gap-1">
                        {thread.lastMessage && (
                          <div className="flex items-center gap-1 text-xs text-muted-foreground">
                            <Clock className="h-3 w-3" />
                            <span>{format(thread.lastMessage.timestamp, 'MMM d')}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </Card>

        {/* Message View */}
        <Card className={`lg:col-span-2 ${!selectedThreadId ? 'hidden lg:block' : ''}`}>
          {selectedThreadId ? (
            <div className="flex flex-col h-full">
              <CardHeader className="border-b">
                <Button 
                  variant="ghost" 
                  size="sm"
                  className="lg:hidden mb-2 w-fit"
                  onClick={() => setSelectedThreadId(null)}
                >
                  <span className="mr-2">←</span>
                  Back to threads
                </Button>
                <CardTitle className="text-base sm:text-lg">
                  {threads?.find(t => t.id === selectedThreadId)?.subject || 'Conversation'}
                </CardTitle>
              </CardHeader>
              
              {/* Messages */}
              <div className="flex-1 p-4 space-y-4 max-h-64 overflow-y-auto">
                {messagesLoading ? (
                  <div className="space-y-4">
                    {[...Array(3)].map((_, i) => (
                      <Skeleton key={i} className="h-16" />
                    ))}
                  </div>
                ) : messages && messages.length > 0 ? (
                  messages.map((message) => (
                    <div key={message.id} className="flex gap-3">
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                        <span className="text-xs font-medium text-primary">
                          {message.senderName.split(' ').map(n => n.charAt(0)).join('').substring(0, 2)}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <p className="font-medium text-sm">{message.senderName}</p>
                          <span className="text-xs text-muted-foreground">
                            {format(message.timestamp, 'MMM d, h:mm a')}
                          </span>
                          {message.priority && message.priority !== 'normal' && (
                            <Badge variant="outline" className="text-xs">
                              {message.priority}
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-card-foreground whitespace-pre-wrap">
                          {message.content}
                        </p>
                        {message.actionRequired && (
                          <Badge variant="secondary" className="mt-2 text-xs">
                            Action Required
                          </Badge>
                        )}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8">
                    <MessageCircle className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                    <p className="text-muted-foreground">No messages in this conversation</p>
                  </div>
                )}
              </div>
              
              {/* Reply Form */}
              <div className="border-t p-4 space-y-3">
                <Textarea
                  placeholder="Type your reply..."
                  value={messageContent}
                  onChange={(e) => setMessageContent(e.target.value)}
                  rows={3}
                  className="resize-none"
                />
                <div className="flex justify-end">
                  <Button 
                    onClick={handleSendMessage} 
                    disabled={!messageContent.trim() || sendMessageMutation.isPending}
                    size="sm"
                  >
                    {sendMessageMutation.isPending ? 'Sending...' : 'Send Reply'}
                  </Button>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-64 text-center">
              <MessageCircle className="h-12 w-12 text-muted-foreground mb-3" />
              <p className="text-muted-foreground mb-2">Select a conversation</p>
              <p className="text-sm text-muted-foreground">
                Choose a conversation from the list to view messages and reply
              </p>
            </div>
          )}
        </Card>
      </div>

      {/* Message Composer Modal */}
      <CarerMessageComposer 
        open={showComposer} 
        onOpenChange={setShowComposer} 
      />
    </div>
    </div>
  );
};

export default CarerMessages;
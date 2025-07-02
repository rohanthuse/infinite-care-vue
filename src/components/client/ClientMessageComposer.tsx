
import React, { useState, useEffect } from "react";
import { X, Send, Paperclip } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useClientCareTeam, useClientCreateThread, useClientSendMessage } from "@/hooks/useClientMessaging";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface ClientMessageComposerProps {
  selectedContactId?: string | null;
  selectedThreadId?: string | null;
  onClose: () => void;
  onSend: () => void;
}

export const ClientMessageComposer = ({ 
  selectedContactId, 
  selectedThreadId,
  onClose, 
  onSend 
}: ClientMessageComposerProps) => {
  const [recipientId, setRecipientId] = useState(selectedContactId || "");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [authDebugInfo, setAuthDebugInfo] = useState<any>(null);
  
  const { data: careTeam = [] } = useClientCareTeam();
  const createThread = useClientCreateThread();
  const sendMessage = useClientSendMessage();
  
  const isReply = !!selectedThreadId;
  const selectedRecipient = careTeam.find(contact => contact.id === recipientId);

  // Debug authentication on component mount
  useEffect(() => {
    const debugAuth = async () => {
      try {
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        const { data: { user }, error: userError } = await supabase.auth.getUser();
        
        console.log('[ClientMessageComposer] Auth Debug:', {
          session: session?.user?.id,
          user: user?.id,
          email: user?.email,
          sessionError,
          userError
        });

        // Check user role
        if (user) {
          const { data: roleData, error: roleError } = await supabase
            .from('user_roles')
            .select('role')
            .eq('user_id', user.id)
            .single();
          
          console.log('[ClientMessageComposer] Role Check:', {
            userId: user.id,
            role: roleData?.role,
            roleError
          });

          setAuthDebugInfo({
            userId: user.id,
            email: user.email,
            role: roleData?.role,
            hasSession: !!session,
            errors: { sessionError, userError, roleError }
          });
        }
      } catch (error) {
        console.error('[ClientMessageComposer] Auth debug error:', error);
        toast.error('Authentication check failed. Please try logging in again.');
      }
    };

    debugAuth();
  }, []);
  
  const handleSend = async () => {
    if (!message.trim()) {
      toast.error('Please enter a message');
      return;
    }

    // Verify authentication before sending
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      toast.error('Please log in to send messages');
      return;
    }

    console.log('[ClientMessageComposer] Sending message with auth:', {
      userId: user.id,
      isReply,
      recipientId,
      threadId: selectedThreadId
    });
    
    try {
      if (isReply && selectedThreadId) {
        // Send reply to existing thread
        await sendMessage.mutateAsync({
          threadId: selectedThreadId,
          content: message.trim()
        });
      } else {
        // Create new thread
        if (!recipientId || !subject.trim()) {
          toast.error('Please select a recipient and enter a subject');
          return;
        }
        
        const recipient = careTeam.find(contact => contact.id === recipientId);
        if (!recipient) {
          toast.error('Selected recipient not found');
          return;
        }
        
        console.log('[ClientMessageComposer] Creating thread with recipient:', {
          recipientId: recipient.id,
          recipientName: recipient.name,
          recipientType: recipient.type,
          subject: subject.trim(),
          messageLength: message.trim().length
        });
        
        await createThread.mutateAsync({
          recipientId: recipient.id,
          recipientName: recipient.name,
          recipientType: recipient.type,
          subject: subject.trim(),
          initialMessage: message.trim()
        });
      }
      
      // Reset form
      setMessage("");
      if (!isReply) {
        setSubject("");
        setRecipientId("");
      }
      
      onSend();
    } catch (error: any) {
      console.error('[ClientMessageComposer] Send error:', error);
      
      // Provide specific error messages based on the error type
      if (error.message?.includes('row-level security')) {
        toast.error('Permission denied. Please ensure you are properly logged in as a client.');
      } else if (error.message?.includes('not authenticated')) {
        toast.error('Authentication expired. Please log in again.');
      } else {
        toast.error(`Failed to send message: ${error.message || 'Unknown error'}`);
      }
    }
  };
  
  const isLoading = createThread.isPending || sendMessage.isPending;
  
  return (
    <div className="flex flex-col h-full max-h-screen">
      {/* Header - Fixed */}
      <div className="flex-shrink-0 p-4 border-b border-gray-200 flex items-center justify-between">
        <h2 className="text-lg font-semibold">
          {isReply ? "Reply to Care Coordinator" : "Message Care Coordinator"}
        </h2>
        <Button variant="ghost" size="icon" onClick={onClose}>
          <X className="h-4 w-4" />
        </Button>
      </div>
      
      {/* Debug info for development */}
      {authDebugInfo && process.env.NODE_ENV === 'development' && (
        <div className="p-2 bg-yellow-50 text-xs border-b">
          Auth: {authDebugInfo.email} | Role: {authDebugInfo.role} | Session: {authDebugInfo.hasSession ? 'Yes' : 'No'}
        </div>
      )}
      
      {/* Content - Scrollable */}
      <div className="flex-1 overflow-y-auto p-4">
        <div className="space-y-4">
          {!isReply && (
            <>
              <div>
                <label className="block text-sm font-medium mb-2">To:</label>
                <Select value={recipientId} onValueChange={setRecipientId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a care coordinator" />
                  </SelectTrigger>
                  <SelectContent>
                    {careTeam.map((contact) => (
                      <SelectItem key={contact.id} value={contact.id}>
                        <div className="flex items-center gap-2">
                          <span>{contact.name}</span>
                          <span className="text-xs px-2 py-1 rounded bg-purple-100 text-purple-700">
                            Care Coordinator
                          </span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2">Subject:</label>
                <Input
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="What's this message about?"
                  className="w-full"
                />
              </div>
            </>
          )}
          
          <div>
            <label className="block text-sm font-medium mb-2">Message:</label>
            <Textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Type your message here..."
              className="w-full h-32 resize-none"
            />
          </div>
          
          <div className="p-3 bg-blue-50 rounded-md">
            <p className="text-sm text-blue-700">
              <strong>Note:</strong> Your message will be sent to your care coordinator who will coordinate with your care team as needed. For urgent matters, please call your care provider directly.
            </p>
          </div>
        </div>
      </div>
      
      {/* Footer - Fixed */}
      <div className="flex-shrink-0 p-4 border-t border-gray-200">
        <div className="flex items-center justify-between">
          <Button variant="ghost" size="sm" disabled>
            <Paperclip className="h-4 w-4 mr-2" />
            Attach File
          </Button>
          
          <div className="flex gap-2">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button 
              onClick={handleSend}
              disabled={
                isLoading || 
                !message.trim() || 
                (!isReply && (!recipientId || !subject.trim()))
              }
            >
              {isLoading ? (
                <>Sending...</>
              ) : (
                <>
                  <Send className="h-4 w-4 mr-2" />
                  Send
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};


import React, { useState, useEffect } from "react";
import { X, Send, Paperclip } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useClientCareTeam, useClientCreateThread, useClientSendMessage } from "@/hooks/useClientMessaging";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useClientAuth } from "@/contexts/ClientAuthContext";

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
  const [sessionDebugInfo, setSessionDebugInfo] = useState<any>(null);
  
  const { user, session, isAuthenticated, clientProfile } = useClientAuth();
  const { data: careTeam = [] } = useClientCareTeam();
  const createThread = useClientCreateThread();
  const sendMessage = useClientSendMessage();
  
  const isReply = !!selectedThreadId;
  const selectedRecipient = careTeam.find(contact => contact.id === recipientId);

  // Debug session and authentication state
  useEffect(() => {
    const debugSessionState = async () => {
      try {
        const { data: { session: currentSession } } = await supabase.auth.getSession();
        const { data: { user: currentUser } } = await supabase.auth.getUser();
        
        // Test database connectivity with a simple query
        const { data: testQuery, error: testError } = await supabase
          .from('clients')
          .select('id')
          .limit(1);
        
        const debugInfo = {
          frontendAuth: {
            hasUser: !!user,
            hasSession: !!session,
            userId: user?.id,
            email: user?.email,
            isAuthenticated,
            hasClientProfile: !!clientProfile
          },
          supabaseAuth: {
            hasCurrentSession: !!currentSession,
            hasCurrentUser: !!currentUser,
            currentUserId: currentUser?.id,
            sessionExpiry: currentSession?.expires_at,
            sessionValid: currentSession && new Date(currentSession.expires_at || 0) > new Date()
          },
          databaseConnectivity: {
            canQueryDatabase: !testError,
            testError: testError?.message,
            authUidWorks: !!currentUser?.id
          },
          localStorage: {
            userType: localStorage.getItem("userType"),
            clientId: localStorage.getItem("clientId"),
            clientName: localStorage.getItem("clientName")
          }
        };
        
        console.log('[ClientMessageComposer] Session Debug:', debugInfo);
        setSessionDebugInfo(debugInfo);
        
        // Alert if there are authentication issues
        if (!currentSession || !currentUser) {
          console.error('[ClientMessageComposer] Authentication issue detected:', {
            noSession: !currentSession,
            noUser: !currentUser
          });
          toast.error('Authentication issue detected. Please try logging out and back in.');
        }
        
      } catch (error) {
        console.error('[ClientMessageComposer] Session debug error:', error);
        toast.error('Failed to verify authentication status.');
      }
    };

    debugSessionState();
  }, [user, session, isAuthenticated, clientProfile]);
  
  const handleSend = async () => {
    if (!message.trim()) {
      toast.error('Please enter a message');
      return;
    }

    // Verify authentication state before attempting to send
    if (!isAuthenticated || !user || !session) {
      toast.error('You are not authenticated. Please log in again.');
      console.error('[ClientMessageComposer] Not authenticated:', {
        isAuthenticated,
        hasUser: !!user,
        hasSession: !!session
      });
      return;
    }

    // Double-check Supabase session
    const { data: { session: currentSession, user: currentUser } } = await supabase.auth.getSession();
    if (!currentSession || !currentUser) {
      toast.error('Your session has expired. Please log in again.');
      console.error('[ClientMessageComposer] Session expired:', {
        hasCurrentSession: !!currentSession,
        hasCurrentUser: !!currentUser
      });
      return;
    }

    console.log('[ClientMessageComposer] Sending message with session:', {
      userId: currentUser.id,
      sessionExpiry: currentSession.expires_at,
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
          messageLength: message.trim().length,
          clientId: clientProfile?.id,
          clientName: clientProfile?.first_name
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
        toast.error('Permission denied. Your session may have expired. Please try logging out and back in.');
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
      {sessionDebugInfo && process.env.NODE_ENV === 'development' && (
        <div className="p-2 bg-yellow-50 text-xs border-b">
          <div>Auth: {sessionDebugInfo.frontendAuth.email} | Authenticated: {sessionDebugInfo.frontendAuth.isAuthenticated ? 'Yes' : 'No'}</div>
          <div>DB Session: {sessionDebugInfo.supabaseAuth.sessionValid ? 'Valid' : 'Invalid'} | DB Query: {sessionDebugInfo.databaseConnectivity.canQueryDatabase ? 'OK' : 'Failed'}</div>
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
                (!isReply && (!recipientId || !subject.trim())) ||
                !isAuthenticated
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

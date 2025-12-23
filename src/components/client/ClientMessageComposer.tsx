
import React, { useState, useEffect, useRef } from "react";
import { X, Send, Paperclip, Upload, FileText, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useClientCareTeam, useClientCreateThread, useClientSendMessage } from "@/hooks/useClientMessaging";
import { useFileUpload } from "@/hooks/useFileUpload";
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
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const { data: careTeam = [] } = useClientCareTeam();
  const createThread = useClientCreateThread();
  const sendMessage = useClientSendMessage();
  const { uploadFile, uploading } = useFileUpload();
  
  const isReply = !!selectedThreadId;
  const selectedRecipient = careTeam.find(contact => contact.id === recipientId);

  // Handle file selection
  const handleFileSelect = () => {
    fileInputRef.current?.click();
  };

  // Handle file input change
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files) {
      const newFiles = Array.from(files);
      setSelectedFiles(prev => [...prev, ...newFiles]);
      toast.success(`${newFiles.length} file(s) selected`);
    }
    // Reset the input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Handle file removal
  const removeFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  };

  // Format file size
  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

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
      threadId: selectedThreadId,
      hasFiles: selectedFiles.length > 0
    });
    
    try {
      // Upload files first if any are selected
      let uploadedFiles: any[] = [];
      if (selectedFiles.length > 0) {
        toast.info('Uploading files...');
        
        for (const file of selectedFiles) {
          try {
            const uploadedFile = await uploadFile(file, {
              category: 'attachment',
              maxSizeInMB: 10,
              allowedTypes: [
                'application/pdf',
                'application/msword',
                'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
                'image/jpeg',
                'image/png',
                'image/gif',
                'text/plain'
              ]
            });
            
            uploadedFiles.push({
              id: uploadedFile.id,
              name: file.name,
              size: file.size,
              type: file.type,
              url: uploadedFile.storage_path
            });
          } catch (error) {
            console.error('File upload failed:', error);
            toast.error(`Failed to upload ${file.name}: ${error.message}`);
            return; // Stop if any file upload fails
          }
        }
      }

      if (isReply && selectedThreadId) {
        // Send reply to existing thread
        await sendMessage.mutateAsync({
          threadId: selectedThreadId,
          content: message.trim(),
          attachments: uploadedFiles
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
          attachmentsCount: uploadedFiles.length
        });
        
        await createThread.mutateAsync({
          recipientId: recipient.id,
          recipientName: recipient.name,
          recipientType: recipient.type,
          subject: subject.trim(),
          initialMessage: message.trim(),
          attachments: uploadedFiles
        });
      }
      
      // Reset form
      setMessage("");
      setSelectedFiles([]);
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
  
  const isLoading = createThread.isPending || sendMessage.isPending || uploading;
  
  return (
    <div className="flex flex-col h-full max-h-screen">
      {/* Header - Fixed */}
      <div className="flex-shrink-0 p-4 border-b border-gray-200 dark:border-border flex items-center justify-between">
        <h2 className="text-lg font-semibold text-foreground">
          {isReply ? "Reply to Message" : "Send Message"}
        </h2>
        <Button variant="ghost" size="icon" onClick={onClose}>
          <X className="h-4 w-4" />
        </Button>
      </div>
      
      {/* Content - Scrollable */}
      <div className="flex-1 overflow-y-auto p-4">
        <div className="space-y-4">
          {!isReply && (
            <>
              <div>
                <label className="block text-sm font-medium mb-2 text-foreground">To:</label>
                <Select value={recipientId} onValueChange={setRecipientId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select care coordinator or carer" />
                  </SelectTrigger>
                  <SelectContent className="bg-white dark:bg-card z-50">
                    {careTeam.length > 0 ? (
                      careTeam.map((contact) => (
                        <SelectItem key={contact.id} value={contact.id}>
                          <div className="flex items-center gap-2">
                            <span>{contact.name}</span>
                            <span className={`text-xs px-2 py-1 rounded ${
                              contact.type === 'admin' 
                                ? 'bg-purple-100 dark:bg-purple-950/30 text-purple-700 dark:text-purple-300' 
                                : 'bg-blue-100 dark:bg-blue-950/30 text-blue-700 dark:text-blue-300'
                            }`}>
                              {contact.type === 'admin' ? 'Care Coordinator' : 'Carer'}
                            </span>
                          </div>
                        </SelectItem>
                      ))
                    ) : (
                      <div className="p-2 text-sm text-gray-500 dark:text-muted-foreground">
                        No care team members found for your branch
                      </div>
                    )}
                  </SelectContent>
                </Select>
                {careTeam.length === 0 && (
                  <p className="text-xs text-gray-500 dark:text-muted-foreground mt-1">
                    No care team members available. Please contact support if you need assistance.
                  </p>
                )}
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2 text-foreground">Subject:</label>
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
            <label className="block text-sm font-medium mb-2 text-foreground">Message:</label>
            <Textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Type your message here..."
              className="w-full h-32 resize-none"
            />
          </div>

          {/* Selected Files Display */}
          {selectedFiles.length > 0 && (
            <div>
              <label className="block text-sm font-medium mb-2 text-foreground">
                Attachments ({selectedFiles.length}):
              </label>
              <div className="space-y-2 max-h-32 overflow-y-auto">
                {selectedFiles.map((file, index) => (
                  <div key={index} className="flex items-center justify-between p-2 bg-gray-50 dark:bg-muted rounded-md">
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      <FileText className="h-4 w-4 text-gray-500 dark:text-muted-foreground flex-shrink-0" />
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium truncate text-foreground">{file.name}</p>
                        <p className="text-xs text-gray-500 dark:text-muted-foreground">{formatFileSize(file.size)}</p>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeFile(index)}
                      className="h-6 w-6 p-0 text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}
          
          <div className="p-3 bg-blue-50 dark:bg-blue-950/30 rounded-md">
            <p className="text-sm text-blue-700 dark:text-blue-300">
              <strong>Note:</strong> Your message will be sent to {selectedRecipient ? 
                (selectedRecipient.type === 'admin' ? 'your care coordinator' : 'your carer') : 
                'your selected care team member'}. For urgent matters, please call your care provider directly.
            </p>
          </div>
        </div>
      </div>
      
      {/* Hidden File Input */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        onChange={handleFileChange}
        className="hidden"
        accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.gif,.txt"
      />
      
      {/* Footer - Fixed */}
      <div className="flex-shrink-0 p-4 border-t border-gray-200 dark:border-border">
        <div className="flex items-center justify-between">
          <Button variant="ghost" size="sm" onClick={handleFileSelect}>
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

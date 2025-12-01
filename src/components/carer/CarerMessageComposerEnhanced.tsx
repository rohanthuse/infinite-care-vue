
import React, { useState, useRef } from "react";
import { X, Send, Paperclip, FileText, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useCarerAdminContacts } from "@/hooks/useCarerMessaging";
import { useUnifiedCreateThread, useUnifiedSendMessage } from "@/hooks/useUnifiedMessaging";
import { useFileUpload } from "@/hooks/useFileUpload";
import { toast } from "sonner";

interface CarerMessageComposerEnhancedProps {
  selectedContactId?: string | null;
  selectedThreadId?: string | null;
  onClose: () => void;
  onSend: () => void;
}

export const CarerMessageComposerEnhanced = ({ 
  selectedContactId, 
  selectedThreadId,
  onClose, 
  onSend 
}: CarerMessageComposerEnhancedProps) => {
  const [recipientId, setRecipientId] = useState(selectedContactId || "");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const { data: contacts = [] } = useCarerAdminContacts();
  const createThread = useUnifiedCreateThread();
  const sendMessage = useUnifiedSendMessage();
  const { uploadFile, uploading } = useFileUpload();
  
  const isReply = !!selectedThreadId;
  const selectedRecipient = contacts.find(contact => contact.id === recipientId);

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
  
  const handleSend = async () => {
    if (!message.trim()) {
      toast.error('Please enter a message');
      return;
    }
    
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
          } catch (error: any) {
            console.error('File upload failed:', error);
            toast.error(`Failed to upload ${file.name}: ${error.message}`);
            return;
          }
        }
      }

      if (isReply && selectedThreadId) {
        // Send reply to existing thread
        await sendMessage.mutateAsync({
          threadId: selectedThreadId,
          content: message.trim(),
          messageType: 'reply',
          priority: 'normal',
          attachments: uploadedFiles
        });
      } else {
        // Create new thread
        if (!recipientId || !subject.trim()) {
          toast.error('Please select a recipient and enter a subject');
          return;
        }
        
        const recipient = contacts.find(contact => contact.id === recipientId);
        if (!recipient) {
          toast.error('Selected recipient not found');
          return;
        }
        
        await createThread.mutateAsync({
          recipientIds: [recipient.id],
          recipientNames: [recipient.name],
          recipientTypes: [recipient.type],
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
      
      toast.success('Message sent successfully');
      onSend();
    } catch (error: any) {
      console.error('[CarerMessageComposer] Send error:', error);
      toast.error(`Failed to send message: ${error.message || 'Unknown error'}`);
    }
  };
  
  const isLoading = createThread.isPending || sendMessage.isPending || uploading;
  
  return (
    <div className="flex flex-col h-full max-h-screen">
      {/* Header - Fixed */}
      <div className="flex-shrink-0 p-4 border-b border-gray-200 flex items-center justify-between">
        <h2 className="text-lg font-semibold">
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
                <label className="block text-sm font-medium mb-2">To:</label>
                <Select value={recipientId} onValueChange={setRecipientId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select recipient" />
                  </SelectTrigger>
                  <SelectContent className="bg-white z-50">
                    {contacts.length > 0 ? (
                      contacts.map((contact) => (
                        <SelectItem key={contact.id} value={contact.id}>
                          <div className="flex items-center gap-2">
                            <span>{contact.name}</span>
                            <span className={`text-xs px-2 py-1 rounded ${
                              contact.type === 'branch_admin' 
                                ? 'bg-blue-100 text-blue-700' 
                                : 'bg-purple-100 text-purple-700'
                            }`}>
                              {contact.type === 'branch_admin' ? 'Branch Admin' : 'Super Admin'}
                            </span>
                          </div>
                        </SelectItem>
                      ))
                    ) : (
                      <div className="p-2 text-sm text-gray-500">
                        No recipients found
                      </div>
                    )}
                  </SelectContent>
                </Select>
                {contacts.length === 0 && (
                  <p className="text-xs text-gray-500 mt-1">
                    No recipients available. Please contact support if you need assistance.
                  </p>
                )}
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

          {/* Selected Files Display */}
          {selectedFiles.length > 0 && (
            <div>
              <label className="block text-sm font-medium mb-2">
                Attachments ({selectedFiles.length}):
              </label>
              <div className="space-y-2 max-h-32 overflow-y-auto">
                {selectedFiles.map((file, index) => (
                  <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded-md">
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      <FileText className="h-4 w-4 text-gray-500 flex-shrink-0" />
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium truncate">{file.name}</p>
                        <p className="text-xs text-gray-500">{formatFileSize(file.size)}</p>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeFile(index)}
                      className="h-6 w-6 p-0 text-red-500 hover:text-red-700"
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}
          
          <div className="p-3 bg-blue-50 rounded-md">
            <p className="text-sm text-blue-700">
              <strong>Note:</strong> Your message will be sent to {selectedRecipient ? 
                `your ${selectedRecipient.type === 'branch_admin' ? 'Branch Admin' : 'Super Admin'}` : 
                'your selected recipient'}. They will receive your message and respond as soon as possible.
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
      <div className="flex-shrink-0 p-4 border-t border-gray-200">
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

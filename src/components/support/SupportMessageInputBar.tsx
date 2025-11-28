import React, { useState, useRef, KeyboardEvent } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { useFileUpload } from '@/hooks/useFileUpload';
import { useUnifiedSendMessage } from '@/hooks/useUnifiedMessaging';
import { Paperclip, Send, X, Loader2 } from 'lucide-react';

interface SupportMessageInputBarProps {
  threadId: string;
}

export const SupportMessageInputBar: React.FC<SupportMessageInputBarProps> = ({
  threadId
}) => {
  const [content, setContent] = useState('');
  const [attachedFiles, setAttachedFiles] = useState<File[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const { uploadFile, uploading } = useFileUpload();
  const sendMessage = useUnifiedSendMessage();

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setAttachedFiles(prev => [...prev, ...files]);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const removeFile = (index: number) => {
    setAttachedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleSend = async () => {
    if (!content.trim() && attachedFiles.length === 0) return;

    try {
      let attachments: any[] = [];

      // Upload files first if any
      if (attachedFiles.length > 0) {
        for (const file of attachedFiles) {
          const uploadedFile = await uploadFile(file, { category: 'attachment' });
          attachments.push({
            id: uploadedFile.id,
            name: uploadedFile.file_name,
            path: uploadedFile.storage_path,
            type: uploadedFile.file_type,
            size: uploadedFile.file_size,
            bucket: 'agreement-files'
          });
        }
      }

      // Send the message
      await sendMessage.mutateAsync({
        threadId,
        content: content.trim(),
        messageType: 'support',
        priority: 'normal',
        actionRequired: false,
        adminEyesOnly: false,
        attachments,
        notificationMethods: []
      });

      // Clear inputs
      setContent('');
      setAttachedFiles([]);
    } catch (error: any) {
      console.error('Error sending message:', error);
      toast.error(`Failed to send message: ${error.message}`);
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setContent(e.target.value);
    // Auto-resize
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 100) + 'px';
    }
  };

  const isSending = sendMessage.isPending || uploading;
  const isDisabled = (!content.trim() && attachedFiles.length === 0) || isSending;

  return (
    <div className="border-t border-border bg-card p-2 sm:p-3 shrink-0">
      {/* Attached files preview */}
      {attachedFiles.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-2">
          {attachedFiles.map((file, index) => (
            <div
              key={index}
              className="flex items-center gap-1 px-2 py-1 bg-secondary text-secondary-foreground rounded text-xs"
            >
              <span className="truncate max-w-[150px]">{file.name}</span>
              <button
                onClick={() => removeFile(index)}
                className="hover:text-destructive"
                disabled={isSending}
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Input row */}
      <div className="flex items-end gap-2">
        {/* Hidden file input */}
        <input
          ref={fileInputRef}
          type="file"
          multiple
          onChange={handleFileSelect}
          className="hidden"
          disabled={isSending}
        />

        {/* Attachment button */}
        <Button
          variant="ghost"
          size="icon"
          onClick={() => fileInputRef.current?.click()}
          disabled={isSending}
          className="shrink-0"
        >
          <Paperclip className="h-4 w-4" />
        </Button>

        {/* Text input */}
        <Textarea
          ref={textareaRef}
          value={content}
          onChange={handleTextareaChange}
          onKeyDown={handleKeyDown}
          placeholder="Type a message..."
          disabled={isSending}
          className="min-h-[40px] max-h-[100px] resize-none flex-1 text-sm"
          rows={1}
        />

        {/* Send button */}
        <Button
          size="icon"
          onClick={handleSend}
          disabled={isDisabled}
          className="shrink-0"
        >
          {isSending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Send className="h-4 w-4" />
          )}
        </Button>
      </div>
    </div>
  );
};

import React, { useState, useRef } from 'react';
import { X, Send, Paperclip, FileUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { useUnifiedSendMessage } from '@/hooks/useUnifiedMessaging';
import { useFileUpload } from '@/hooks/useFileUpload';
import { cn } from '@/lib/utils';

interface SupportReplyComposerProps {
  threadId: string;
  onClose: () => void;
}

export const SupportReplyComposer: React.FC<SupportReplyComposerProps> = ({
  threadId,
  onClose
}) => {
  const [content, setContent] = useState('');
  const [files, setFiles] = useState<File[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const sendMessage = useUnifiedSendMessage();
  const { uploadFile, uploading: uploadingFiles } = useFileUpload();

  const isSending = sendMessage.isPending || uploadingFiles;

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const droppedFiles = Array.from(e.dataTransfer.files);
    setFiles(prev => [...prev, ...droppedFiles]);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const selectedFiles = Array.from(e.target.files);
      setFiles(prev => [...prev, ...selectedFiles]);
    }
  };

  const handleRemoveFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleSend = async () => {
    if (!content.trim() && files.length === 0) {
      toast.error('Please enter a message or attach a file');
      return;
    }

    try {
      let attachments: any[] = [];

      // Upload files if any
      if (files.length > 0) {
        toast.info(`Uploading ${files.length} file(s)...`);
        for (const file of files) {
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
        notificationMethods: [],
      });

      // Reset form
      setContent('');
      setFiles([]);
      onClose();
    } catch (error: any) {
      console.error('Send reply error:', error);
      toast.error(`Failed to send reply: ${error.message}`);
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  return (
    <div className="flex flex-col h-full bg-card">
      {/* Header */}
      <div className="p-4 border-b border-border flex items-center justify-between">
        <h3 className="font-semibold text-foreground">Reply to Support Ticket</h3>
        <Button variant="ghost" size="icon" onClick={onClose} disabled={isSending}>
          <X className="h-4 w-4" />
        </Button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Message Textarea */}
        <div className="space-y-2">
          <Textarea
            placeholder="Type your reply here..."
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="min-h-[200px] resize-none"
            disabled={isSending}
          />
        </div>

        {/* File Attachments Section */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-foreground">Attachments</span>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => fileInputRef.current?.click()}
              disabled={isSending}
            >
              <Paperclip className="h-4 w-4 mr-1" />
              Attach Files
            </Button>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              onChange={handleFileSelect}
              className="hidden"
              disabled={isSending}
            />
          </div>

          {/* Drag and Drop Area */}
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={cn(
              "border-2 border-dashed rounded-lg p-6 text-center transition-colors",
              isDragging ? "border-primary bg-primary/5" : "border-border",
              isSending && "opacity-50 pointer-events-none"
            )}
          >
            <FileUp className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">
              Drag and drop files here, or click "Attach Files" button
            </p>
          </div>

          {/* File List */}
          {files.length > 0 && (
            <div className="space-y-2">
              {files.map((file, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-2 bg-muted rounded-md"
                >
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    <Paperclip className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                    <span className="text-sm truncate">{file.name}</span>
                    <span className="text-xs text-muted-foreground flex-shrink-0">
                      ({formatFileSize(file.size)})
                    </span>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleRemoveFile(index)}
                    disabled={isSending}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="p-4 border-t border-border flex items-center justify-end gap-2">
        <Button
          variant="outline"
          onClick={onClose}
          disabled={isSending}
        >
          Cancel
        </Button>
        <Button
          onClick={handleSend}
          disabled={isSending || (!content.trim() && files.length === 0)}
        >
          <Send className="h-4 w-4 mr-2" />
          {isSending ? 'Sending...' : 'Send Reply'}
        </Button>
      </div>
    </div>
  );
};

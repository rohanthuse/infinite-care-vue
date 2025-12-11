import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Paperclip } from 'lucide-react';

interface EditMessageDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (newContent: string) => void;
  isLoading: boolean;
  currentContent: string;
  attachments?: any[];
}

export const EditMessageDialog = ({
  open,
  onOpenChange,
  onConfirm,
  isLoading,
  currentContent,
  attachments = []
}: EditMessageDialogProps) => {
  const [content, setContent] = useState(currentContent);

  // Reset content when dialog opens with new message
  useEffect(() => {
    if (open) {
      setContent(currentContent);
    }
  }, [open, currentContent]);

  const handleConfirm = () => {
    if (content.trim()) {
      onConfirm(content.trim());
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      handleConfirm();
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Edit Message</DialogTitle>
          <DialogDescription>
            Make changes to your message. Press Cmd/Ctrl + Enter to save.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <Textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Enter your message..."
            className="min-h-[120px] resize-none"
            autoFocus
          />
          
          {/* Display attachments as read-only */}
          {attachments.length > 0 && (
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">Attachments (cannot be edited):</p>
              <div className="flex flex-wrap gap-2">
                {attachments.map((attachment, index) => (
                  <div
                    key={index}
                    className="flex items-center gap-1 px-2 py-1 bg-muted rounded text-xs"
                  >
                    <Paperclip className="h-3 w-3" />
                    <span className="truncate max-w-[150px]">
                      {attachment.file_name || attachment.name || 'Attachment'}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={isLoading || !content.trim() || content.trim() === currentContent}
          >
            {isLoading ? 'Saving...' : 'Save Changes'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

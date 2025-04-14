
import React from 'react';
import { Button } from '@/components/ui/button';
import { formatFileSize } from '@/lib/utils';
import { FileTextIcon, ImageIcon, FileIcon, Trash2, FileX2, Paperclip } from 'lucide-react';

interface Attachment {
  id: string;
  name: string;
  type: string;
  size: number;
}

interface AttachmentsListProps {
  attachments: Attachment[];
  setAttachments: React.Dispatch<React.SetStateAction<Attachment[]>>;
}

export function AttachmentsList({ attachments, setAttachments }: AttachmentsListProps) {
  const handleRemoveAttachment = (id: string) => {
    setAttachments(prev => prev.filter(attachment => attachment.id !== id));
  };

  const getFileIcon = (type: string) => {
    if (type.startsWith('image/')) {
      return <ImageIcon className="h-6 w-6 text-blue-500" />;
    } else if (type.includes('pdf')) {
      return <FileTextIcon className="h-6 w-6 text-red-500" />;
    } else {
      return <FileIcon className="h-6 w-6 text-gray-500" />;
    }
  };

  if (attachments.length === 0) {
    return (
      <div className="text-center py-8">
        <div className="mx-auto w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mb-3">
          <Paperclip className="h-6 w-6 text-gray-400" />
        </div>
        <h3 className="text-sm font-medium text-gray-900 mb-1">No attachments</h3>
        <p className="text-xs text-gray-500">Upload files related to this event</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {attachments.map((attachment) => (
        <div 
          key={attachment.id} 
          className="flex items-center justify-between p-3 border border-gray-200 rounded-lg bg-white"
        >
          <div className="flex items-center">
            {getFileIcon(attachment.type)}
            <div className="ml-3">
              <p className="text-sm font-medium">{attachment.name}</p>
              <p className="text-xs text-gray-500">{formatFileSize(attachment.size)}</p>
            </div>
          </div>
          <Button 
            type="button" 
            variant="ghost" 
            size="sm"
            onClick={() => handleRemoveAttachment(attachment.id)}
          >
            <Trash2 className="h-4 w-4 text-red-500" />
          </Button>
        </div>
      ))}
      
      <div className="mt-4">
        <div className="relative">
          <input
            id="file-upload"
            name="file-upload"
            type="file"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) {
                setAttachments(prev => [
                  ...prev, 
                  { 
                    id: crypto.randomUUID(), 
                    name: file.name, 
                    type: file.type, 
                    size: file.size 
                  }
                ]);
              }
            }}
          />
          <label
            htmlFor="file-upload"
            className="cursor-pointer flex items-center justify-center w-full px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50"
          >
            <Paperclip className="h-4 w-4 mr-2" />
            <span>Upload files</span>
          </label>
        </div>
      </div>
    </div>
  );
}

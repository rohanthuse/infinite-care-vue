import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { FileText, Download, Image, FileIcon, Calendar } from 'lucide-react';
import { format } from 'date-fns';

interface EventAttachmentsViewProps {
  attachments?: any[];
}

export function EventAttachmentsView({ attachments }: EventAttachmentsViewProps) {
  if (!attachments || attachments.length === 0) return null;

  const getFileIcon = (fileType: string) => {
    if (fileType.startsWith('image/')) return <Image className="h-4 w-4" />;
    if (fileType === 'application/pdf') return <FileText className="h-4 w-4" />;
    return <FileIcon className="h-4 w-4" />;
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const handleDownload = async (attachment: any) => {
    try {
      // This would integrate with your file storage system
      console.log('Downloading file:', attachment);
      // Implementation would depend on your storage setup (Supabase Storage, etc.)
    } catch (error) {
      console.error('Error downloading file:', error);
    }
  };

  return (
    <div className="space-y-4">
      <h4 className="font-medium text-sm flex items-center gap-2">
        <FileText className="h-4 w-4" />
        Attachments ({attachments.length})
      </h4>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {attachments.map((attachment, index) => (
          <div key={index} className="border rounded-lg p-3 hover:bg-gray-50 transition-colors">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-2 flex-1 min-w-0">
                <div className="text-gray-600 mt-1">
                  {getFileIcon(attachment.type)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-sm truncate" title={attachment.name}>
                    {attachment.name}
                  </div>
                  <div className="flex items-center gap-2 text-xs text-gray-500 mt-1">
                    <span>{formatFileSize(attachment.size)}</span>
                    {attachment.uploadDate && (
                      <>
                        <span>•</span>
                        <div className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {format(new Date(attachment.uploadDate), 'MMM d, yyyy')}
                        </div>
                      </>
                    )}
                  </div>
                  {attachment.type && (
                    <Badge variant="outline" className="text-xs mt-1">
                      {attachment.type.split('/')[1]?.toUpperCase()}
                    </Badge>
                  )}
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleDownload(attachment)}
                className="h-8 w-8 p-0"
              >
                <Download className="h-3 w-3" />
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
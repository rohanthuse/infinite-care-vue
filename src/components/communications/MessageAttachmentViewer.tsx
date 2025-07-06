import React from "react";
import { FileText, Download, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface MessageAttachmentViewerProps {
  attachments: any[];
  onPreview?: (attachment: any) => void;
  onDownload?: (attachment: any) => void;
}

export const MessageAttachmentViewer: React.FC<MessageAttachmentViewerProps> = ({
  attachments,
  onPreview,
  onDownload,
}) => {
  if (!attachments || attachments.length === 0) {
    return null;
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="mt-3 space-y-2">
      <div className="text-xs text-gray-500">
        {attachments.length} attachment{attachments.length > 1 ? 's' : ''}
      </div>
      {attachments.map((attachment, index) => (
        <div
          key={index}
          className="flex items-center justify-between p-2 bg-gray-50 rounded-md border"
        >
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <FileText className="h-4 w-4 text-gray-500 flex-shrink-0" />
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium truncate">{attachment.name}</p>
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-500">
                  {formatFileSize(attachment.size || 0)}
                </span>
                {attachment.type && (
                  <Badge variant="outline" className="text-xs">
                    {attachment.type.split('/')[1]?.toUpperCase() || 'FILE'}
                  </Badge>
                )}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-1">
            {onPreview && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onPreview(attachment)}
                className="h-6 w-6 p-0"
              >
                <Eye className="h-3 w-3" />
              </Button>
            )}
            {onDownload && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onDownload(attachment)}
                className="h-6 w-6 p-0"
              >
                <Download className="h-3 w-3" />
              </Button>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};
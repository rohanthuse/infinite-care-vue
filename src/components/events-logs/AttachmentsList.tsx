
import React from "react";
import { FileText, X } from "lucide-react";
import { Button } from "@/components/ui/button";

interface AttachmentsListProps {
  attachments: Array<{ id: string; name: string; type: string; size: number }>;
  setAttachments: React.Dispatch<React.SetStateAction<Array<{ id: string; name: string; type: string; size: number }>>>;
}

export function AttachmentsList({ attachments, setAttachments }: AttachmentsListProps) {
  if (attachments.length === 0) {
    return (
      <div className="text-center py-6 border border-dashed border-gray-300 rounded-md">
        <p className="text-gray-500">No attachments added yet</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {attachments.map((file) => (
        <div 
          key={file.id} 
          className="flex items-center justify-between p-3 border rounded-md bg-white"
        >
          <div className="flex items-center">
            <FileText className="h-5 w-5 text-blue-500 mr-2" />
            <div>
              <p className="text-sm font-medium">{file.name}</p>
              <p className="text-xs text-gray-500">
                {(file.size / 1024).toFixed(1)} KB
              </p>
            </div>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="text-red-500 hover:text-red-700 hover:bg-red-50"
            onClick={() => {
              setAttachments(attachments.filter((a) => a.id !== file.id));
            }}
          >
            <X className="h-4 w-4" />
            <span className="sr-only">Remove</span>
          </Button>
        </div>
      ))}
    </div>
  );
}

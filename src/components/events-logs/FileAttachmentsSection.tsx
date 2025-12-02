import React, { useState, useCallback } from "react";
import { UseFormReturn } from "react-hook-form";
import { useDropzone } from "react-dropzone";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { FileText, Upload, X, Image, AlertCircle } from "lucide-react";
import { toast } from "sonner";

interface FileAttachmentsSectionProps {
  form: UseFormReturn<any>;
}

interface AttachedFile {
  id: string;
  name: string;
  size: number;
  type: string;
  file: File;
  uploadProgress?: number;
}

export function FileAttachmentsSection({ form }: FileAttachmentsSectionProps) {
  const [attachedFiles, setAttachedFiles] = useState<AttachedFile[]>([]);
  const [isUploading, setIsUploading] = useState(false);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const newFiles: AttachedFile[] = acceptedFiles.map(file => ({
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      name: file.name,
      size: file.size,
      type: file.type,
      file: file,
      uploadProgress: 0
    }));

    const updatedFiles = [...attachedFiles, ...newFiles];
    setAttachedFiles(updatedFiles);
    
    // Update form with actual File objects for upload
    form.setValue('attachments', updatedFiles.map(f => ({
      id: f.id,
      name: f.name,
      size: f.size,
      type: f.type,
      file: f.file // Include the actual File object for upload
    })));

    toast.success(`${acceptedFiles.length} file(s) added`);
  }, [attachedFiles, form]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png', '.gif'],
      'application/pdf': ['.pdf'],
      'application/msword': ['.doc'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
      'text/plain': ['.txt']
    },
    maxSize: 10 * 1024 * 1024, // 10MB
    multiple: true
  });

  const removeFile = (fileId: string) => {
    const updatedFiles = attachedFiles.filter(f => f.id !== fileId);
    setAttachedFiles(updatedFiles);
    form.setValue('attachments', updatedFiles.map(f => ({
      id: f.id,
      name: f.name,
      size: f.size,
      type: f.type,
      file: f.file // Include the actual File object
    })));
    toast.info("File removed");
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getFileIcon = (fileType: string) => {
    if (fileType.startsWith('image/')) {
      return <Image className="h-5 w-5 text-green-500" />;
    }
    return <FileText className="h-5 w-5 text-blue-500" />;
  };

  return (
    <div className="space-y-4 bg-white rounded-lg border border-gray-100 p-5 shadow-sm">
      <h3 className="text-lg font-semibold text-gray-800 border-b border-gray-100 pb-2">
        File Attachments
      </h3>
      
      <div className="space-y-4">
        {/* Upload Area */}
        <div
          {...getRootProps()}
          className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${
            isDragActive
              ? 'border-blue-500 bg-blue-50'
              : 'border-gray-300 hover:border-gray-400'
          }`}
        >
          <input {...getInputProps()} />
          <Upload className="h-8 w-8 text-gray-400 mx-auto mb-2" />
          {isDragActive ? (
            <p className="text-blue-600">Drop files here...</p>
          ) : (
            <div>
              <p className="text-gray-600 mb-1">
                <strong>Click to upload</strong> or drag and drop
              </p>
              <p className="text-sm text-gray-500">
                Photos, PDFs, Word documents (max 10MB each)
              </p>
            </div>
          )}
        </div>

        {/* File List */}
        {attachedFiles.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium text-gray-700">
              Attached Files ({attachedFiles.length})
            </h4>
            <div className="space-y-2">
              {attachedFiles.map((file) => (
                <div key={file.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-md border">
                  <div className="flex items-center space-x-3 flex-1">
                    {getFileIcon(file.type)}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {file.name}
                      </p>
                      <p className="text-xs text-gray-500">
                        {formatFileSize(file.size)}
                      </p>
                    </div>
                  </div>
                  <Button
                    type="button"
                    onClick={() => removeFile(file.id)}
                    variant="ghost"
                    size="sm"
                    className="text-red-500 hover:text-red-700 hover:bg-red-50"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}

        {attachedFiles.length === 0 && (
          <div className="text-center py-4 text-gray-500">
            <FileText className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">No files attached yet</p>
          </div>
        )}

        <div className="flex items-start space-x-2 p-3 bg-blue-50 rounded-md">
          <AlertCircle className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
          <p className="text-xs text-blue-800">
            Attach photos of injuries, damage, or relevant documents. 
            Files help provide visual evidence and support the incident report.
          </p>
        </div>
      </div>
    </div>
  );
}
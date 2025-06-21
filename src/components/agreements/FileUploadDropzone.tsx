import React, { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, File, X, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { useFileUpload, type FileCategory, type UploadOptions } from '@/hooks/useFileUpload';
import { useAgreementFiles } from '@/hooks/useAgreementFiles';
import { cn } from '@/lib/utils';

interface FileUploadDropzoneProps {
  agreementId?: string;
  templateId?: string;
  scheduledAgreementId?: string;
  category: FileCategory;
  maxFiles?: number;
  acceptedFileTypes?: string[];
  onUploadComplete?: (files: any[]) => void;
  className?: string;
}

export const FileUploadDropzone: React.FC<FileUploadDropzoneProps> = ({
  agreementId,
  templateId,
  scheduledAgreementId,
  category,
  maxFiles = 5,
  acceptedFileTypes,
  onUploadComplete,
  className
}) => {
  const { uploadFile, deleteFile, getFileUrl, uploading, progress } = useFileUpload();
  const [uploadQueue, setUploadQueue] = useState<File[]>([]);
  
  const { data: existingFiles, refetch } = useAgreementFiles({
    agreementId,
    templateId,
    scheduledAgreementId,
    category
  });

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    const totalFiles = (existingFiles?.length || 0) + acceptedFiles.length;
    if (totalFiles > maxFiles) {
      alert(`Maximum ${maxFiles} files allowed`);
      return;
    }

    setUploadQueue(acceptedFiles);
    
    try {
      const uploadOptions: UploadOptions = {
        agreementId,
        templateId,
        scheduledAgreementId,
        category,
        allowedTypes: acceptedFileTypes
      };

      const uploadedFiles = [];
      for (const file of acceptedFiles) {
        const result = await uploadFile(file, uploadOptions);
        uploadedFiles.push(result);
      }
      
      await refetch();
      onUploadComplete?.(uploadedFiles);
    } catch (error) {
      console.error('Upload failed:', error);
    } finally {
      setUploadQueue([]);
    }
  }, [uploadFile, agreementId, templateId, scheduledAgreementId, category, existingFiles, maxFiles, acceptedFileTypes, onUploadComplete, refetch]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: acceptedFileTypes ? Object.fromEntries(acceptedFileTypes.map(type => [type, []])) : {
      'application/pdf': ['.pdf'],
      'application/msword': ['.doc'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
      'image/*': ['.jpg', '.jpeg', '.png', '.gif', '.webp']
    },
    multiple: maxFiles > 1,
    disabled: uploading
  });

  const handleDeleteFile = async (fileId: string) => {
    try {
      await deleteFile(fileId);
      await refetch();
    } catch (error) {
      console.error('Delete failed:', error);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className={cn("space-y-4", className)}>
      {/* Dropzone */}
      <div
        {...getRootProps()}
        className={cn(
          "border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors",
          isDragActive ? "border-blue-400 bg-blue-50" : "border-gray-300 hover:border-gray-400",
          uploading && "cursor-not-allowed opacity-50"
        )}
      >
        <input {...getInputProps()} />
        <Upload className="mx-auto h-8 w-8 text-gray-400 mb-2" />
        {isDragActive ? (
          <p className="text-blue-600">Drop the files here...</p>
        ) : (
          <div>
            <p className="text-gray-600">
              Drag & drop files here, or <span className="text-blue-600">click to select</span>
            </p>
            <p className="text-sm text-gray-400 mt-1">
              PDF, DOC, DOCX, Images (max {maxFiles} files, 50MB each)
            </p>
          </div>
        )}
      </div>

      {/* Upload Progress */}
      {uploading && uploadQueue.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <div className="h-2 bg-gray-200 rounded-full flex-1">
              <div 
                className="h-2 bg-blue-600 rounded-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
            <span className="text-sm text-gray-600">{progress}%</span>
          </div>
          <p className="text-sm text-gray-600">
            Uploading {uploadQueue.length} file(s)...
          </p>
        </div>
      )}

      {/* Existing Files */}
      {existingFiles && existingFiles.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-gray-700">Uploaded Files</h4>
          <div className="space-y-2">
            {existingFiles.map((file) => (
              <div key={file.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                <File className="h-5 w-5 text-gray-400" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {file.file_name}
                  </p>
                  <p className="text-xs text-gray-500">
                    {formatFileSize(file.file_size)} • {new Date(file.created_at).toLocaleDateString()}
                  </p>
                </div>
                <div className="flex gap-1">
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-8 w-8 p-0"
                    onClick={() => window.open(getFileUrl(file.storage_path), '_blank')}
                  >
                    <Download className="h-4 w-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-8 w-8 p-0 hover:bg-red-50 hover:text-red-600"
                    onClick={() => handleDeleteFile(file.id)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

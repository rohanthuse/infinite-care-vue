
import React, { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, File, X, Download, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { useFileUpload, type FileCategory } from '@/hooks/useFileUpload';
import { useAgreementFiles } from '@/hooks/useAgreementFiles';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface FileUploadDropzoneProps {
  agreementId?: string;
  templateId?: string;
  scheduledAgreementId?: string;
  category: FileCategory;
  maxFiles?: number;
  acceptedFileTypes?: string[];
  onUploadComplete?: (files: any[]) => void;
  onFilesSelected?: (files: File[]) => void;
  className?: string;
  disabled?: boolean;
}

export const FileUploadDropzone: React.FC<FileUploadDropzoneProps> = ({
  agreementId,
  templateId,
  scheduledAgreementId,
  category,
  maxFiles = 5,
  acceptedFileTypes,
  onUploadComplete,
  onFilesSelected,
  className,
  disabled = false
}) => {
  const { uploadFile, deleteFile, getFileUrl, uploading, progress } = useFileUpload();
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [uploadQueue, setUploadQueue] = useState<File[]>([]);
  
  const { data: existingFiles, refetch } = useAgreementFiles({
    agreementId,
    templateId,
    scheduledAgreementId,
    category
  });

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    if (disabled) return;
    
    const totalFiles = (existingFiles?.length || 0) + acceptedFiles.length + selectedFiles.length;
    if (totalFiles > maxFiles) {
      toast.error(`Maximum ${maxFiles} files allowed`);
      return;
    }

    // If we have an agreement ID, upload immediately
    if (agreementId || templateId || scheduledAgreementId) {
      setUploadQueue(acceptedFiles);
      
      try {
        const uploadOptions = {
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
        toast.success(`${uploadedFiles.length} file(s) uploaded successfully`);
      } catch (error) {
        console.error('Upload failed:', error);
        toast.error('Upload failed');
      } finally {
        setUploadQueue([]);
      }
    } else {
      // Store files temporarily for later upload
      setSelectedFiles(prev => [...prev, ...acceptedFiles]);
      onFilesSelected?.(acceptedFiles);
      toast.success(`${acceptedFiles.length} file(s) selected for upload`);
    }
  }, [
    disabled, agreementId, templateId, scheduledAgreementId, category, 
    existingFiles, selectedFiles, maxFiles, acceptedFileTypes, 
    uploadFile, refetch, onUploadComplete, onFilesSelected
  ]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: acceptedFileTypes ? Object.fromEntries(acceptedFileTypes.map(type => [type, []])) : {
      'application/pdf': ['.pdf'],
      'application/msword': ['.doc'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
      'image/*': ['.jpg', '.jpeg', '.png', '.gif', '.webp']
    },
    multiple: maxFiles > 1,
    disabled: disabled || uploading
  });

  const handleDeleteFile = async (fileId: string) => {
    try {
      await deleteFile(fileId);
      await refetch();
      toast.success('File deleted successfully');
    } catch (error) {
      console.error('Delete failed:', error);
      toast.error('Delete failed');
    }
  };

  const removeSelectedFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const totalFiles = (existingFiles?.length || 0) + selectedFiles.length;

  return (
    <div className={cn("space-y-4", className)}>
      {/* Dropzone */}
      <div
        {...getRootProps()}
        className={cn(
          "border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors",
          isDragActive ? "border-blue-400 bg-blue-50 dark:bg-blue-950/30" : "border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500",
          (uploading || disabled) && "cursor-not-allowed opacity-50"
        )}
      >
        <input {...getInputProps()} />
        <Upload className="mx-auto h-8 w-8 text-gray-400 mb-2" />
        {isDragActive ? (
          <p className="text-blue-600 dark:text-blue-400">Drop the files here...</p>
        ) : (
          <div>
            <p className="text-muted-foreground">
              Drag & drop files here, or <span className="text-blue-600 dark:text-blue-400">click to select</span>
            </p>
            <p className="text-sm text-muted-foreground/70 mt-1">
              PDF, DOC, DOCX, Images (max {maxFiles} files, 50MB each)
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              {totalFiles}/{maxFiles} files selected
            </p>
          </div>
        )}
      </div>

      {/* Upload Progress */}
      {uploading && uploadQueue.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Progress value={progress} className="flex-1" />
            <span className="text-sm text-gray-600">{progress}%</span>
          </div>
          <div className="flex items-center gap-2">
            <Loader2 className="h-4 w-4 animate-spin" />
            <p className="text-sm text-gray-600">
              Uploading {uploadQueue.length} file(s)...
            </p>
          </div>
        </div>
      )}

      {/* Selected Files (not yet uploaded) */}
      {selectedFiles.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-foreground">Selected Files (pending upload)</h4>
          <div className="space-y-2">
            {selectedFiles.map((file, index) => (
              <div key={index} className="flex items-center gap-3 p-3 bg-yellow-50 dark:bg-yellow-950/30 rounded-lg border border-yellow-200 dark:border-yellow-700">
                <File className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">
                    {file.name}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {formatFileSize(file.size)} • Selected for upload
                  </p>
                </div>
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-8 w-8 p-0 hover:bg-yellow-100 hover:text-yellow-700"
                  onClick={() => removeSelectedFile(index)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Existing Files */}
      {existingFiles && existingFiles.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-foreground">Uploaded Files</h4>
          <div className="space-y-2">
            {existingFiles.map((file) => (
              <div key={file.id} className="flex items-center gap-3 p-3 bg-green-50 dark:bg-green-950/30 rounded-lg border border-green-200 dark:border-green-700">
                <File className="h-5 w-5 text-green-600 dark:text-green-400" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">
                    {file.file_name}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {formatFileSize(file.file_size)} • {new Date(file.created_at).toLocaleDateString()}
                  </p>
                </div>
                <div className="flex gap-1">
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-8 w-8 p-0 hover:bg-green-100"
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

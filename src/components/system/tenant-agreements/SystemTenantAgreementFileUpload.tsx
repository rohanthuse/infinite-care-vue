import { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, File, Download, Trash2, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useSystemTenantAgreementFileUpload } from '@/hooks/useSystemTenantAgreementFileUpload';
import { useSystemTenantAgreementFiles } from '@/hooks/useSystemTenantAgreementFiles';
import { formatDistanceToNow } from 'date-fns';
import { cn } from '@/lib/utils';

interface SystemTenantAgreementFileUploadProps {
  agreementId?: string;
  category?: 'document' | 'attachment' | 'template';
  maxFiles?: number;
  onPendingFilesChange?: (files: File[]) => void;
  pendingFiles?: File[];
}

const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
};

const getFileIcon = (fileName: string) => {
  const ext = fileName.split('.').pop()?.toLowerCase();
  if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext || '')) {
    return '🖼️';
  }
  if (ext === 'pdf') return '📄';
  if (['doc', 'docx'].includes(ext || '')) return '📝';
  return '📎';
};

export const SystemTenantAgreementFileUpload = ({
  agreementId,
  category = 'attachment',
  maxFiles = 5,
  onPendingFilesChange,
  pendingFiles = []
}: SystemTenantAgreementFileUploadProps) => {
  const { uploadFile, deleteFile, getFileUrl, uploading, progress, validateFile } = useSystemTenantAgreementFileUpload();
  const { data: uploadedFiles = [], refetch } = useSystemTenantAgreementFiles({
    agreementId,
    category
  });

  const [localPendingFiles, setLocalPendingFiles] = useState<File[]>([]);
  const effectivePendingFiles = onPendingFilesChange ? pendingFiles : localPendingFiles;

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const validFiles: File[] = [];
    const totalFiles = effectivePendingFiles.length + uploadedFiles.length + acceptedFiles.length;

    if (totalFiles > maxFiles) {
      alert(`Maximum ${maxFiles} files allowed`);
      return;
    }

    for (const file of acceptedFiles) {
      const validation = validateFile(file);
      if (validation.valid) {
        validFiles.push(file);
      } else {
        alert(validation.error);
      }
    }

    if (validFiles.length > 0) {
      const newFiles = [...effectivePendingFiles, ...validFiles];
      if (onPendingFilesChange) {
        onPendingFilesChange(newFiles);
      } else {
        setLocalPendingFiles(newFiles);
      }
    }
  }, [effectivePendingFiles, uploadedFiles, maxFiles, validateFile, onPendingFilesChange]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'application/msword': ['.doc'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
      'image/jpeg': ['.jpg', '.jpeg'],
      'image/png': ['.png'],
      'image/gif': ['.gif'],
      'image/webp': ['.webp']
    },
    maxSize: 20 * 1024 * 1024,
    disabled: uploading
  });

  const removePendingFile = (index: number) => {
    const newFiles = effectivePendingFiles.filter((_, i) => i !== index);
    if (onPendingFilesChange) {
      onPendingFilesChange(newFiles);
    } else {
      setLocalPendingFiles(newFiles);
    }
  };

  const handleDeleteUploaded = async (fileId: string, storagePath: string) => {
    if (confirm('Are you sure you want to delete this file?')) {
      await deleteFile(fileId, storagePath);
      refetch();
    }
  };

  const handleDownload = (storagePath: string, fileName: string) => {
    const url = getFileUrl(storagePath);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    link.target = '_blank';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-4">
      {/* Dropzone */}
      <Card
        {...getRootProps()}
        className={cn(
          "border-2 border-dashed p-6 cursor-pointer transition-colors",
          isDragActive && "border-primary bg-primary/5",
          uploading && "opacity-50 cursor-not-allowed"
        )}
      >
        <input {...getInputProps()} />
        <div className="flex flex-col items-center gap-2 text-center">
          <Upload className="h-8 w-8 text-muted-foreground" />
          <div>
            <p className="text-sm font-medium">
              {isDragActive ? 'Drop files here' : 'Drag & drop files or click to browse'}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              PDF, DOC, DOCX, JPG, PNG, GIF, WEBP (max 20MB each)
            </p>
          </div>
        </div>
      </Card>

      {/* Upload Progress */}
      {uploading && (
        <Card className="p-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span>Uploading...</span>
              <span>{progress}%</span>
            </div>
            <Progress value={progress} />
          </div>
        </Card>
      )}

      {/* File Limit Warning */}
      {effectivePendingFiles.length + uploadedFiles.length >= maxFiles && (
        <div className="flex items-center gap-2 text-sm text-amber-600 bg-amber-50 border border-amber-200 rounded-md p-3">
          <AlertCircle className="h-4 w-4" />
          <span>Maximum {maxFiles} files allowed</span>
        </div>
      )}

      {/* Pending Files (before agreement creation) */}
      {effectivePendingFiles.length > 0 && (
        <div className="space-y-2">
          <p className="text-sm font-medium">Pending Files ({effectivePendingFiles.length})</p>
          {effectivePendingFiles.map((file, index) => (
            <Card key={index} className="p-3 bg-amber-50/50 border-amber-200">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <span className="text-2xl">{getFileIcon(file.name)}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{file.name}</p>
                    <p className="text-xs text-muted-foreground">{formatFileSize(file.size)}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="bg-amber-100 text-amber-700 border-amber-300">
                    Pending
                  </Badge>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removePendingFile(index)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Uploaded Files */}
      {uploadedFiles.length > 0 && (
        <div className="space-y-2">
          <p className="text-sm font-medium">Uploaded Files ({uploadedFiles.length})</p>
          {uploadedFiles.map((file) => (
            <Card key={file.id} className="p-3 bg-green-50/50 border-green-200">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <span className="text-2xl">{getFileIcon(file.file_name)}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{file.file_name}</p>
                    <p className="text-xs text-muted-foreground">
                      {formatFileSize(file.file_size)} • {formatDistanceToNow(new Date(file.created_at), { addSuffix: true })}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDownload(file.storage_path, file.file_name)}
                  >
                    <Download className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDeleteUploaded(file.id, file.storage_path)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Empty State */}
      {effectivePendingFiles.length === 0 && uploadedFiles.length === 0 && (
        <p className="text-sm text-muted-foreground text-center py-4">
          No files uploaded yet
        </p>
      )}
    </div>
  );
};

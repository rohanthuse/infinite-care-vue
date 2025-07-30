import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Upload, FileText, X, Download, AlertCircle } from "lucide-react";
import { useTrainingFileUpload } from "@/hooks/useTrainingFileUpload";
import { toast } from "sonner";

interface TrainingFileUploadProps {
  trainingRecordId: string;
  staffId: string;
  evidenceFiles: any[];
  onFilesUpdate: (files: any[]) => void;
}

export function TrainingFileUpload({ 
  trainingRecordId, 
  staffId, 
  evidenceFiles = [],
  onFilesUpdate 
}: TrainingFileUploadProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const { uploadTrainingFile, deleteTrainingFile, getFileUrl, uploading, progress } = useTrainingFileUpload();

  const handleFileSelect = async (files: FileList) => {
    const file = files[0]; // Only handle one file at a time for training evidence
    if (!file) return;

    try {
      const newFile = await uploadTrainingFile(file, {
        trainingRecordId,
        staffId
      });

      // Update the files list
      const updatedFiles = [...evidenceFiles, newFile];
      onFilesUpdate(updatedFiles);
    } catch (error) {
      console.error('File upload failed:', error);
    }
  };

  const handleDeleteFile = async (fileId: string) => {
    try {
      await deleteTrainingFile(trainingRecordId, fileId);
      
      // Update the files list
      const updatedFiles = evidenceFiles.filter(f => f.id !== fileId);
      onFilesUpdate(updatedFiles);
    } catch (error) {
      console.error('File deletion failed:', error);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleFileSelect(files);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const formatFileSize = (bytes: number) => {
    const units = ['B', 'KB', 'MB', 'GB'];
    let size = bytes;
    let unitIndex = 0;
    
    while (size >= 1024 && unitIndex < units.length - 1) {
      size /= 1024;
      unitIndex++;
    }
    
    return `${size.toFixed(1)} ${units[unitIndex]}`;
  };

  const getFileTypeColor = (type: string) => {
    if (type.includes('pdf')) return 'destructive';
    if (type.includes('image')) return 'secondary';
    if (type.includes('word') || type.includes('document')) return 'outline';
    return 'default';
  };

  return (
    <div className="space-y-4">
      {/* Upload Area */}
      <div
        className={`relative border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
          isDragging 
            ? 'border-primary bg-primary/5' 
            : 'border-muted-foreground/30 hover:border-primary/50'
        } ${uploading ? 'pointer-events-none opacity-50' : ''}`}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
      >
        <input
          ref={fileInputRef}
          type="file"
          className="hidden"
          accept=".pdf,.jpg,.jpeg,.png,.webp,.doc,.docx"
          onChange={(e) => e.target.files && handleFileSelect(e.target.files)}
        />
        
        {uploading ? (
          <div className="space-y-3">
            <Upload className="h-8 w-8 mx-auto text-primary animate-pulse" />
            <div className="space-y-2">
              <p className="text-sm font-medium">Uploading certificate...</p>
              <Progress value={progress} className="w-full max-w-xs mx-auto" />
              <p className="text-xs text-muted-foreground">{progress}% complete</p>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            <Upload className="h-8 w-8 mx-auto text-muted-foreground" />
            <div className="space-y-2">
              <p className="font-medium">Upload Training Certificate</p>
              <p className="text-sm text-muted-foreground">
                Drag and drop your certificate here, or click to browse
              </p>
              <p className="text-xs text-muted-foreground">
                Supports PDF, images, and document files (max 10MB)
              </p>
            </div>
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => fileInputRef.current?.click()}
              className="mt-3"
            >
              Choose File
            </Button>
          </div>
        )}
      </div>

      {/* File Type Guidelines */}
      <div className="p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg">
        <div className="flex items-start gap-2">
          <AlertCircle className="h-4 w-4 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
          <div className="text-sm">
            <p className="font-medium text-blue-900 dark:text-blue-100 mb-1">Accepted file types:</p>
            <ul className="text-blue-800 dark:text-blue-200 space-y-0.5">
              <li>• PDF certificates and documents</li>
              <li>• Images (JPG, PNG, WebP) of certificates</li>
              <li>• Word documents (.doc, .docx)</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Uploaded Files */}
      {evidenceFiles.length > 0 && (
        <div className="space-y-3">
          <h4 className="font-medium text-sm">Uploaded Certificates ({evidenceFiles.length})</h4>
          <div className="grid gap-2">
            {evidenceFiles.map((file: any) => (
              <div 
                key={file.id} 
                className="flex items-center gap-3 p-3 border rounded-lg bg-background hover:bg-muted/50 transition-colors"
              >
                <FileText className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{file.name}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge variant={getFileTypeColor(file.type)} className="text-xs">
                      {file.type.split('/')[1]?.toUpperCase() || 'FILE'}
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      {formatFileSize(file.size)}
                    </span>
                    {file.uploadedAt && (
                      <span className="text-xs text-muted-foreground">
                        {new Date(file.uploadedAt).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-1">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      const url = getFileUrl(file.storagePath);
                      window.open(url, '_blank');
                    }}
                  >
                    <Download className="h-3 w-3" />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDeleteFile(file.id)}
                    className="text-destructive hover:text-destructive"
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
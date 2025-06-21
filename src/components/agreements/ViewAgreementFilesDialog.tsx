
import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useAgreementFiles } from '@/hooks/useAgreementFiles';
import { useFileUpload } from '@/hooks/useFileUpload';
import { Button } from '@/components/ui/button';
import { Download, Eye, File, Loader2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface ViewAgreementFilesDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  agreementId?: string;
  templateId?: string;
  scheduledAgreementId?: string;
  title: string;
}

export const ViewAgreementFilesDialog: React.FC<ViewAgreementFilesDialogProps> = ({
  open,
  onOpenChange,
  agreementId,
  templateId,
  scheduledAgreementId,
  title
}) => {
  const { data: files, isLoading } = useAgreementFiles({
    agreementId,
    templateId,
    scheduledAgreementId
  });
  
  const { getFileUrl } = useFileUpload();

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'document': return 'bg-blue-100 text-blue-800';
      case 'signature': return 'bg-green-100 text-green-800';
      case 'template': return 'bg-purple-100 text-purple-800';
      case 'attachment': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (isLoading) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Agreement Files</DialogTitle>
            <DialogDescription>{title}</DialogDescription>
          </DialogHeader>
          <div className="flex items-center justify-center p-8">
            <Loader2 className="h-6 w-6 animate-spin" />
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Agreement Files</DialogTitle>
          <DialogDescription>{title}</DialogDescription>
        </DialogHeader>

        {files && files.length > 0 ? (
          <div className="space-y-4">
            {files.map((file) => (
              <div key={file.id} className="flex items-center gap-4 p-4 border rounded-lg">
                <File className="h-8 w-8 text-gray-400" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {file.file_name}
                    </p>
                    <Badge className={getCategoryColor(file.file_category)}>
                      {file.file_category}
                    </Badge>
                  </div>
                  <p className="text-xs text-gray-500">
                    {formatFileSize(file.file_size)} • {file.file_type} • {new Date(file.created_at).toLocaleDateString()}
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => window.open(getFileUrl(file.storage_path), '_blank')}
                  >
                    <Eye className="h-4 w-4 mr-1" />
                    View
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      const link = document.createElement('a');
                      link.href = getFileUrl(file.storage_path);
                      link.download = file.file_name;
                      link.click();
                    }}
                  >
                    <Download className="h-4 w-4 mr-1" />
                    Download
                  </Button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <File className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">No files uploaded for this agreement</p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

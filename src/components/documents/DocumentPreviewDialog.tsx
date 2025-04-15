
import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Download, 
  FileText, 
  Calendar, 
  Clock, 
  User, 
  FileArchive,
  Tag, 
  Lock, 
  Unlock, 
  Share2, 
  Trash2
} from "lucide-react";
import { format } from 'date-fns';

interface Document {
  id: string;
  title: string;
  category: string;
  uploadedBy: string;
  uploadDate: Date;
  fileType: string;
  fileSize: number;
  isPrivate: boolean;
  accessRoles: string[];
  description?: string;
  expiryDate?: Date;
}

interface DocumentPreviewDialogProps {
  isOpen: boolean;
  onClose: () => void;
  document: Document | null;
}

const categories = [
  { id: "policies", name: "Policies & Procedures" },
  { id: "forms", name: "Forms" },
  { id: "training", name: "Training Materials" },
  { id: "reports", name: "Reports" },
  { id: "templates", name: "Templates" },
  { id: "guides", name: "User Guides" },
  { id: "legal", name: "Legal Documents" },
  { id: "other", name: "Other Resources" },
];

export const DocumentPreviewDialog: React.FC<DocumentPreviewDialogProps> = ({ 
  isOpen, 
  onClose, 
  document 
}) => {
  if (!document) return null;

  // Get category name
  const getCategoryName = (categoryId: string): string => {
    return categories.find(cat => cat.id === categoryId)?.name || categoryId;
  };

  // Format file size
  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1048576) return `${(bytes / 1024).toFixed(2)} KB`;
    return `${(bytes / 1048576).toFixed(2)} MB`;
  };

  // Get document preview component based on file type
  const getDocumentPreview = () => {
    const fileType = document.fileType.toLowerCase();
    
    if (fileType === 'jpg' || fileType === 'png') {
      return (
        <div className="flex justify-center py-4">
          <div className="max-h-[400px] overflow-hidden rounded-md border border-gray-200">
            <img
              src={`https://picsum.photos/seed/${document.id}/800/600`}
              alt={document.title}
              className="object-contain"
            />
          </div>
        </div>
      );
    }
    
    if (fileType === 'pdf') {
      return (
        <div className="flex justify-center py-4">
          <div className="w-full h-[400px] bg-gray-100 rounded-md border border-gray-200 flex items-center justify-center">
            <div className="text-center">
              <FileText className="h-16 w-16 text-red-500 mx-auto mb-2" />
              <p className="font-medium text-gray-600">PDF Preview</p>
              <p className="text-sm text-gray-500 mt-1">Click download to view the full document</p>
            </div>
          </div>
        </div>
      );
    }
    
    // For other file types
    return (
      <div className="flex justify-center py-4">
        <div className="w-full h-[300px] bg-gray-100 rounded-md border border-gray-200 flex items-center justify-center">
          <div className="text-center">
            <FileArchive className="h-16 w-16 text-gray-500 mx-auto mb-2" />
            <p className="font-medium text-gray-600">{document.fileType.toUpperCase()} Document</p>
            <p className="text-sm text-gray-500 mt-1">Preview not available. Download to view.</p>
          </div>
        </div>
      </div>
    );
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <FileText className="h-5 w-5 text-blue-600" />
            {document.title}
          </DialogTitle>
        </DialogHeader>
        
        {document.description && (
          <p className="text-gray-600 mt-1">{document.description}</p>
        )}
        
        <div className="flex flex-wrap gap-2 mt-2">
          <Badge variant="secondary">
            <Tag className="h-3.5 w-3.5 mr-1" />
            {getCategoryName(document.category)}
          </Badge>
          <Badge variant="outline" className={`${document.isPrivate ? 'text-amber-600 border-amber-200' : 'text-green-600 border-green-200'}`}>
            {document.isPrivate ? <Lock className="h-3 w-3 mr-1" /> : <Unlock className="h-3 w-3 mr-1" />}
            {document.isPrivate ? 'Private' : 'Public'}
          </Badge>
          {document.expiryDate && (
            <Badge variant={document.expiryDate < new Date() ? 'destructive' : 'outline'} className={document.expiryDate < new Date() ? '' : 'text-amber-600 border-amber-200'}>
              <Clock className="h-3 w-3 mr-1" />
              {document.expiryDate < new Date() ? 'Expired' : 'Expires'}: {format(document.expiryDate, 'dd MMM yyyy')}
            </Badge>
          )}
        </div>
        
        <div className="grid grid-cols-2 gap-4 text-sm text-gray-700 mt-4">
          <div className="flex items-center gap-2">
            <User className="h-4 w-4 text-gray-500" />
            <span>Uploaded by: </span>
            <span className="font-medium">{document.uploadedBy}</span>
          </div>
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-gray-500" />
            <span>Upload date: </span>
            <span className="font-medium">{format(document.uploadDate, 'dd MMM yyyy')}</span>
          </div>
          <div className="flex items-center gap-2">
            <FileArchive className="h-4 w-4 text-gray-500" />
            <span>File type: </span>
            <span className="font-medium">{document.fileType.toUpperCase()}</span>
          </div>
          <div className="flex items-center gap-2">
            <FileText className="h-4 w-4 text-gray-500" />
            <span>Size: </span>
            <span className="font-medium">{formatFileSize(document.fileSize)}</span>
          </div>
        </div>
        
        {document.isPrivate && (
          <div className="mt-4">
            <p className="text-sm font-medium text-gray-700 mb-1">Access permissions:</p>
            <div className="flex flex-wrap gap-2">
              {document.accessRoles.map(role => (
                <Badge key={role} variant="outline" className="text-gray-700">
                  {role.charAt(0).toUpperCase() + role.slice(1).replace('-', ' ')}
                </Badge>
              ))}
            </div>
          </div>
        )}
        
        {getDocumentPreview()}
        
        <div className="flex flex-wrap justify-end gap-3 mt-4">
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
          <Button variant="outline">
            <Share2 className="h-4 w-4 mr-2" />
            Share
          </Button>
          <Button variant="outline" className="text-red-600 border-red-200 hover:bg-red-50">
            <Trash2 className="h-4 w-4 mr-2" />
            Delete
          </Button>
          <Button>
            <Download className="h-4 w-4 mr-2" />
            Download
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

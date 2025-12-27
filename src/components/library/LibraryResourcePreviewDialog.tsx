
import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Download, 
  FileText, 
  Calendar, 
  Clock, 
  User, 
  Video,
  Tag, 
  Lock, 
  Unlock, 
  Share2, 
  Trash2,
  Star,
  BookOpen,
  FileImage,
  FileSpreadsheet,
  AudioLines,
  Files,
  Link as LinkIcon,
  Eye,
  ArrowDownToLine,
  ExternalLink
} from "lucide-react";
import { format } from 'date-fns';

interface LibraryResource {
  id: string;
  title: string;
  description?: string;
  category: string;
  resourceType: string;
  uploadedBy: string;
  uploadDate: Date;
  expiryDate?: Date;
  isPrivate: boolean;
  accessRoles: string[];
  fileSize?: number;
  url?: string;
  rating?: number;
  author?: string;
  version?: string;
  tags?: string[];
  views: number;
  downloads: number;
}

interface LibraryResourcePreviewDialogProps {
  isOpen: boolean;
  onClose: () => void;
  resource: LibraryResource | null;
  showEngagementMetrics?: boolean;
  onOpenDocumentFile?: (resource: LibraryResource) => void;
}

const categories = [
  { id: "care_protocols", name: "Care Protocols" },
  { id: "training", name: "Training Materials" },
  { id: "research", name: "Research Papers" },
  { id: "guidelines", name: "Clinical Guidelines" },
  { id: "reference", name: "Reference Materials" },
  { id: "presentations", name: "Presentations" },
  { id: "courses", name: "Courses" },
  { id: "tools", name: "Tools & Calculators" },
];

export const LibraryResourcePreviewDialog: React.FC<LibraryResourcePreviewDialogProps> = ({ 
  isOpen, 
  onClose, 
  resource,
  showEngagementMetrics = true,
  onOpenDocumentFile
}) => {
  if (!resource) return null;

  // Get category name
  const getCategoryName = (categoryId: string): string => {
    return categories.find(cat => cat.id === categoryId)?.name || categoryId;
  };

  // Format file size
  const formatFileSize = (bytes?: number): string => {
    if (!bytes) return "N/A";
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1048576) return `${(bytes / 1024).toFixed(2)} KB`;
    return `${(bytes / 1048576).toFixed(2)} MB`;
  };

  // Render stars for rating
  const renderRating = (rating?: number) => {
    if (!rating) return <span className="text-muted-foreground text-sm">Not rated</span>;
    
    return (
      <div className="flex items-center">
        {[...Array(5)].map((_, i) => (
          <Star 
            key={i} 
            className={`h-4 w-4 ${i < rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`} 
          />
        ))}
        <span className="ml-2 text-sm font-medium">{rating}/5</span>
      </div>
    );
  };


  // Get resource preview component based on resource type
  const getResourcePreview = () => {
    const resourceType = resource.resourceType.toLowerCase();
    
    if (resourceType === 'image') {
      return (
        <div className="flex justify-center py-4">
          <div className="max-h-[400px] overflow-hidden rounded-md border border-border">
            <img
              src={`https://picsum.photos/seed/${resource.id}/800/600`}
              alt={resource.title}
              className="object-contain"
            />
          </div>
        </div>
      );
    }
    
    if (resourceType === 'video') {
      return (
        <div className="flex justify-center py-4">
        <div className="w-full h-[400px] bg-muted rounded-md border border-border flex items-center justify-center">
            <div className="text-center">
              <Video className="h-16 w-16 text-blue-500 dark:text-blue-400 mx-auto mb-2" />
              <p className="font-medium text-muted-foreground">Video Preview</p>
              <p className="text-sm text-muted-foreground mt-1">Click play to watch or download for full video</p>
              
              <Button variant="outline" className="mt-4">
                <Eye className="h-4 w-4 mr-2" />
                Play Preview
              </Button>
            </div>
          </div>
        </div>
      );
    }
    
    if (resourceType === 'pdf') {
      return (
        <div className="flex justify-center py-4">
        <div className="w-full h-[400px] bg-muted rounded-md border border-border flex items-center justify-center">
            <div className="text-center">
              <FileText className="h-16 w-16 text-red-500 dark:text-red-400 mx-auto mb-2" />
              <p className="font-medium text-muted-foreground">PDF Preview</p>
              <p className="text-sm text-muted-foreground mt-1">Click download to view the full document</p>
              
            </div>
          </div>
        </div>
      );
    }
    
    if (resourceType === 'audio') {
      return (
        <div className="flex justify-center py-4">
        <div className="w-full h-[200px] bg-muted rounded-md border border-border flex items-center justify-center">
            <div className="text-center">
              <AudioLines className="h-16 w-16 text-purple-500 dark:text-purple-400 mx-auto mb-2" />
              <p className="font-medium text-muted-foreground">Audio Preview</p>
              <p className="text-sm text-muted-foreground mt-1">Download to listen to the full audio</p>
              
              <Button variant="outline" className="mt-4">
                <Eye className="h-4 w-4 mr-2" />
                Play Sample
              </Button>
            </div>
          </div>
        </div>
      );
    }
    
    if (resourceType === 'spreadsheet') {
      return (
        <div className="flex justify-center py-4">
        <div className="w-full h-[300px] bg-muted rounded-md border border-border flex items-center justify-center">
            <div className="text-center">
              <FileSpreadsheet className="h-16 w-16 text-green-500 dark:text-green-400 mx-auto mb-2" />
              <p className="font-medium text-muted-foreground">Spreadsheet Preview</p>
              <p className="text-sm text-muted-foreground mt-1">Download to use the spreadsheet</p>
              
            </div>
          </div>
        </div>
      );
    }
    
    if (resourceType === 'link') {
      return (
        <div className="flex justify-center py-4">
          <div className="w-full h-[200px] bg-gray-100 rounded-md border border-gray-200 flex items-center justify-center">
            <div className="text-center">
              <LinkIcon className="h-16 w-16 text-cyan-500 mx-auto mb-2" />
              <p className="font-medium text-gray-600">External Resource</p>
              <a 
                href={resource.url} 
                target="_blank" 
                rel="noopener noreferrer" 
                className="mt-3 inline-flex items-center text-blue-600 hover:text-blue-800 no-underline"
              >
                <Button>
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Visit Resource
                </Button>
              </a>
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
            <BookOpen className="h-16 w-16 text-gray-500 mx-auto mb-2" />
            <p className="font-medium text-gray-600">{resource.resourceType.toUpperCase()} Resource</p>
            <p className="text-sm text-gray-500 mt-1">Preview not available. Download to view.</p>
            
          </div>
        </div>
      </div>
    );
  };

  // Get the appropriate icon for the resource type
  const getResourceTypeIcon = () => {
    const resourceType = resource.resourceType.toLowerCase();
    
    switch (resourceType) {
      case 'pdf':
        return <FileText className="h-5 w-5 text-red-600" />;
      case 'video':
        return <Video className="h-5 w-5 text-blue-600" />;
      case 'audio':
        return <AudioLines className="h-5 w-5 text-purple-600" />;
      case 'spreadsheet':
        return <FileSpreadsheet className="h-5 w-5 text-green-600" />;
      case 'presentation':
        return <Files className="h-5 w-5 text-amber-600" />;
      case 'document':
        return <FileText className="h-5 w-5 text-blue-600" />;
      case 'image':
        return <FileImage className="h-5 w-5 text-pink-600" />;
      case 'link':
        return <LinkIcon className="h-5 w-5 text-cyan-600" />;
      default:
        return <BookOpen className="h-5 w-5 text-gray-600" />;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            {getResourceTypeIcon()}
            {resource.title}
          </DialogTitle>
        </DialogHeader>
        
        {resource.description && (
          <p className="text-muted-foreground mt-1">{resource.description}</p>
        )}
        
        <div className="flex flex-wrap gap-2 mt-2">
          <Badge variant="secondary">
            <Tag className="h-3.5 w-3.5 mr-1" />
            {getCategoryName(resource.category)}
          </Badge>
          <Badge variant="outline" className={`${resource.isPrivate ? 'text-amber-600 border-amber-200' : 'text-green-600 border-green-200'}`}>
            {resource.isPrivate ? <Lock className="h-3 w-3 mr-1" /> : <Unlock className="h-3 w-3 mr-1" />}
            {resource.isPrivate ? 'Private' : 'Public'}
          </Badge>
          {resource.expiryDate && (
            <Badge variant={resource.expiryDate < new Date() ? 'destructive' : 'outline'} className={resource.expiryDate < new Date() ? '' : 'text-amber-600 border-amber-200'}>
              <Clock className="h-3 w-3 mr-1" />
              {resource.expiryDate < new Date() ? 'Expired' : 'Expires'}: {format(resource.expiryDate, 'dd MMM yyyy')}
            </Badge>
          )}
        </div>
        
        <div className="mt-4">
          {renderRating(resource.rating)}
        </div>
        
        <div className="grid grid-cols-2 gap-4 text-sm text-foreground mt-4">
          <div className="flex items-center gap-2">
            <User className="h-4 w-4 text-muted-foreground" />
            <span>Added by: </span>
            <span className="font-medium">{resource.uploadedBy}</span>
          </div>
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <span>Date added: </span>
            <span className="font-medium">{format(resource.uploadDate, 'dd MMM yyyy')}</span>
          </div>
          {resource.author && (
            <div className="flex items-center gap-2">
              <User className="h-4 w-4 text-muted-foreground" />
              <span>Author/Source: </span>
              <span className="font-medium">{resource.author}</span>
            </div>
          )}
          {resource.version && (
            <div className="flex items-center gap-2">
              <FileText className="h-4 w-4 text-muted-foreground" />
              <span>Version: </span>
              <span className="font-medium">{resource.version}</span>
            </div>
          )}
          {resource.fileSize && (
            <div className="flex items-center gap-2">
              <FileText className="h-4 w-4 text-muted-foreground" />
              <span>Size: </span>
              <span className="font-medium">{formatFileSize(resource.fileSize)}</span>
            </div>
          )}
          {showEngagementMetrics && (
            <>
              <div className="flex items-center gap-2">
                <Eye className="h-4 w-4 text-muted-foreground" />
                <span>Views: </span>
                <span className="font-medium">{resource.views}</span>
              </div>
              <div className="flex items-center gap-2">
                <ArrowDownToLine className="h-4 w-4 text-muted-foreground" />
                <span>Downloads: </span>
                <span className="font-medium">{resource.downloads}</span>
              </div>
            </>
          )}
        </div>
        
        {resource.isPrivate && (
          <div className="mt-4">
            <p className="text-sm font-medium text-foreground mb-1">Access permissions:</p>
            <div className="flex flex-wrap gap-2">
              {resource.accessRoles.map(role => (
                <Badge key={role} variant="outline" className="text-muted-foreground">
                  {role.charAt(0).toUpperCase() + role.slice(1).replace('-', ' ')}
                </Badge>
              ))}
            </div>
          </div>
        )}
        
        {resource.tags && resource.tags.length > 0 && (
          <div className="mt-4">
            <p className="text-sm font-medium text-foreground mb-1">Tags:</p>
            <div className="flex flex-wrap gap-2">
              {resource.tags.map((tag, index) => (
                <span key={index} className="text-xs bg-muted text-muted-foreground px-2 py-1 rounded">
                  #{tag}
                </span>
              ))}
            </div>
          </div>
        )}
        
        {/* Link Section - Show whenever resource.url exists */}
        {resource.url && (
          <div className="mt-4">
            <p className="text-sm font-medium text-foreground mb-2">Resource Link:</p>
            <div className="flex items-center gap-2 p-3 bg-muted rounded-md border border-border">
              <ExternalLink className="h-4 w-4 text-blue-500 flex-shrink-0" />
              <a 
                href={resource.url} 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-blue-600 hover:text-blue-800 truncate flex-1 no-underline"
              >
                {resource.url.length > 60 ? `${resource.url.substring(0, 57)}...` : resource.url}
              </a>
            </div>
          </div>
        )}
        
        {getResourcePreview()}
        
        <DialogFooter className="flex flex-wrap justify-end gap-3 mt-4">
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
          {onOpenDocumentFile && (
            <Button onClick={() => onOpenDocumentFile(resource)}>
              <Download className="h-4 w-4 mr-2" />
              Download File
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

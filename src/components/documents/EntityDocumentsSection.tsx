import React, { useState } from 'react';
import { FileText, Download, Eye, Loader2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { useMutation } from '@tanstack/react-query';
import { 
  useClientEntityDocuments, 
  useStaffEntityDocuments, 
  downloadEntityDocument,
  EntityDocument 
} from '@/hooks/useEntityDocuments';

interface EntityDocumentsSectionProps {
  entityType: 'client' | 'staff';
  entityId: string;
}

export const EntityDocumentsSection: React.FC<EntityDocumentsSectionProps> = ({
  entityType,
  entityId,
}) => {
  const { toast } = useToast();
  const [downloadingDocIds, setDownloadingDocIds] = useState<Set<string>>(new Set());

  // Fetch documents based on entity type
  const clientDocsQuery = useClientEntityDocuments(entityType === 'client' ? entityId : '');
  const staffDocsQuery = useStaffEntityDocuments(entityType === 'staff' ? entityId : '');

  const { data: documents = [], isLoading } = entityType === 'client' ? clientDocsQuery : staffDocsQuery;

  // Download mutation
  const downloadMutation = useMutation({
    mutationFn: ({ filePath, fileName }: { filePath: string; fileName: string }) => 
      downloadEntityDocument(filePath, fileName),
    onSuccess: (_, variables) => {
      setDownloadingDocIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(variables.filePath);
        return newSet;
      });
      toast({
        title: "Download Started",
        description: "File download has begun",
      });
    },
    onError: (error: Error, variables) => {
      setDownloadingDocIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(variables.filePath);
        return newSet;
      });
      toast({
        title: "Download Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleDownload = (doc: EntityDocument) => {
    if (!doc.file_path || doc.file_path.trim() === '') {
      toast({
        title: "Download Error",
        description: "File path not available for this document",
        variant: "destructive",
      });
      return;
    }

    setDownloadingDocIds(prev => new Set(prev).add(doc.file_path!));
    downloadMutation.mutate({ 
      filePath: doc.file_path, 
      fileName: doc.name 
    });
  };

  const handleView = (doc: EntityDocument) => {
    if (!doc.file_path) {
      toast({
        title: "View Error",
        description: "File not available",
        variant: "destructive",
      });
      return;
    }
    // For now, trigger download. Can be enhanced to open in new tab for PDFs
    handleDownload(doc);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  // Group documents by uploader type
  const systemDocs = documents.filter(doc => doc.uploader_type === 'system');
  const staffDocs = documents.filter(doc => doc.uploader_type === 'staff');
  const clientDocs = documents.filter(doc => doc.uploader_type === 'client');

  const renderDocumentCard = (doc: EntityDocument) => {
    const isDownloading = downloadingDocIds.has(doc.file_path || '');

    return (
      <div 
        key={doc.id} 
        className="flex items-center justify-between p-4 bg-muted/30 rounded-lg border border-border hover:bg-muted/50 transition-colors"
      >
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <FileText className="h-4 w-4 text-muted-foreground flex-shrink-0" />
            <p className="font-medium text-foreground truncate">{doc.name}</p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <Badge variant="outline" className="text-xs">
              {doc.type}
            </Badge>
            <Badge variant="secondary" className="text-xs">
              {doc.category}
            </Badge>
          </div>
          <div className="mt-2 space-y-1 text-xs text-muted-foreground">
            {doc.uploaded_by_name && (
              <p>Uploaded by: {doc.uploaded_by_name}</p>
            )}
            <p>Date: {formatDate(doc.created_at)}</p>
            {doc.file_size && <p>Size: {doc.file_size}</p>}
          </div>
          {doc.description && (
            <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{doc.description}</p>
          )}
        </div>
        <div className="flex items-center gap-2 ml-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleView(doc)}
            disabled={isDownloading}
          >
            <Eye className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleDownload(doc)}
            disabled={isDownloading}
          >
            {isDownloading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Download className="h-4 w-4" />
            )}
          </Button>
        </div>
      </div>
    );
  };

  const renderSection = (title: string, docs: EntityDocument[], emptyMessage: string) => {
    if (docs.length === 0) {
      return (
        <div className="text-center py-4 text-sm text-muted-foreground">
          {emptyMessage}
        </div>
      );
    }

    return (
      <div className="space-y-3">
        {docs.map(renderDocumentCard)}
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2 text-muted-foreground">Loading documents...</span>
      </div>
    );
  }

  if (documents.length === 0) {
    return (
      <div className="text-center py-12">
        <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
        <h3 className="text-lg font-medium text-foreground">No Documents Found</h3>
        <p className="text-sm text-muted-foreground mt-2">
          No documents have been uploaded for this {entityType} yet.
        </p>
      </div>
    );
  }

  return (
    <div>
      {/* Updated by System */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Updated by System
          </CardTitle>
        </CardHeader>
        <CardContent>
          {renderSection(
            'Updated by System',
            systemDocs,
            'No system-generated documents'
          )}
        </CardContent>
      </Card>
    </div>
  );
};

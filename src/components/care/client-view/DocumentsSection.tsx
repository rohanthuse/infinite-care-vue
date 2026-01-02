import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FileText, Download, Calendar, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useViewClientDocument, useDownloadClientDocument } from '@/hooks/useClientDocuments';
import { toast } from 'sonner';

interface DocumentsSectionProps {
  documents: any[];
}

export function DocumentsSection({ documents }: DocumentsSectionProps) {
  const viewDocumentMutation = useViewClientDocument();
  const downloadDocumentMutation = useDownloadClientDocument();

  const handleViewDocument = (doc: any) => {
    const filePath = doc.storage_path || doc.file_path;
    if (filePath) {
      viewDocumentMutation.mutate({ filePath });
    } else {
      toast.error('Document file path not available');
    }
  };

  const handleDownloadDocument = (doc: any) => {
    const filePath = doc.storage_path || doc.file_path;
    const fileName = doc.name || doc.file_name || 'document';
    if (filePath) {
      downloadDocumentMutation.mutate({ filePath, fileName });
    } else {
      toast.error('Document file path not available');
    }
  };

  if (!documents || documents.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-primary" />
            Documents
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">No documents attached yet.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5 text-primary" />
          Documents ({documents.length})
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {documents.map((doc, idx) => (
          <Card key={idx} className="hover:shadow-md transition-shadow">
            <CardContent className="pt-4">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-3 flex-1">
                  <FileText className="h-5 w-5 text-muted-foreground flex-shrink-0 mt-1" />
                  <div className="flex-1 min-w-0">
                    <h4 className="font-semibold text-base truncate">{doc.name || doc.file_name}</h4>
                    <div className="flex flex-wrap items-center gap-3 mt-2 text-sm text-muted-foreground">
                      {doc.category && (
                        <Badge variant="outline">{doc.category}</Badge>
                      )}
                      {doc.file_size && (
                        <span>{(doc.file_size / 1024).toFixed(1)} KB</span>
                      )}
                      {doc.created_at && (
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {new Date(doc.created_at).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                    {doc.description && (
                      <p className="text-sm text-muted-foreground mt-2">{doc.description}</p>
                    )}
                  </div>
                </div>
                {(doc.storage_path || doc.file_path) && (
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <Button 
                      variant="outline" 
                      size="sm"
                      className="document-action-button pointer-events-auto gap-1"
                      onClick={() => handleViewDocument(doc)}
                      disabled={viewDocumentMutation.isPending}
                    >
                      {viewDocumentMutation.isPending ? (
                        <span className="animate-spin h-4 w-4 border-2 border-current border-t-transparent rounded-full" />
                      ) : (
                        <>
                          <Eye className="h-4 w-4" />
                          <span>View</span>
                        </>
                      )}
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm"
                      className="document-action-button pointer-events-auto gap-1"
                      onClick={() => handleDownloadDocument(doc)}
                      disabled={downloadDocumentMutation.isPending}
                    >
                      {downloadDocumentMutation.isPending ? (
                        <span className="animate-spin h-4 w-4 border-2 border-current border-t-transparent rounded-full" />
                      ) : (
                        <>
                          <Download className="h-4 w-4" />
                          <span>Download</span>
                        </>
                      )}
                    </Button>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </CardContent>
    </Card>
  );
}

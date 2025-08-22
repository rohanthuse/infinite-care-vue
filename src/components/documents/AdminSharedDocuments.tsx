import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { FileText, Download, Eye, Calendar, AlertCircle } from 'lucide-react';
import { format } from 'date-fns';
import { AdminSharedDocument, useSharedDocumentActions } from '@/hooks/useAdminSharedDocuments';

interface AdminSharedDocumentsProps {
  documents: AdminSharedDocument[];
  isLoading: boolean;
  title: string;
  emptyMessage: string;
}

export const AdminSharedDocuments: React.FC<AdminSharedDocumentsProps> = ({
  documents,
  isLoading,
  title,
  emptyMessage,
}) => {
  const { viewDocument, downloadDocument } = useSharedDocumentActions();

  const formatDate = (dateStr: string) => {
    try {
      return format(new Date(dateStr), "MMM d, yyyy");
    } catch (e) {
      return dateStr;
    }
  };

  const getDocIcon = (type: string) => {
    return <FileText className="h-5 w-5 text-blue-500" />;
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            {title}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-32">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          {title}
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          {documents.length} document{documents.length !== 1 ? 's' : ''} shared with you
        </p>
      </CardHeader>
      <CardContent>
        {documents.length > 0 ? (
          <div className="space-y-3">
            {documents.map((doc) => (
              <div key={doc.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50">
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  {getDocIcon(doc.type)}
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{doc.name}</p>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Badge variant="outline" className="text-xs">
                        {doc.category}
                      </Badge>
                      <Calendar className="h-3 w-3" />
                      <span>{formatDate(doc.created_at)}</span>
                      {doc.uploaded_by_name && (
                        <>
                          <span>•</span>
                          <span>by {doc.uploaded_by_name}</span>
                        </>
                      )}
                    </div>
                    {doc.description && (
                      <p className="text-xs text-muted-foreground mt-1 truncate">
                        {doc.description}
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => viewDocument(doc.file_path)}
                    title="View Document"
                  >
                    <Eye className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => downloadDocument(doc.file_path, doc.name)}
                    title="Download Document"
                  >
                    <Download className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <AlertCircle className="h-8 w-8 text-gray-400 mx-auto mb-3" />
            <p className="text-muted-foreground">{emptyMessage}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
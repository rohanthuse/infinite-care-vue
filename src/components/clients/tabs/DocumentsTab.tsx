
import React, { useState } from "react";
import { format } from "date-fns";
import { File, FileText, FilePlus, Clock, Download, Eye } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { UploadDocumentDialog } from "../dialogs/UploadDocumentDialog";
import { useClientDocuments, useUploadClientDocument } from "@/hooks/useClientDocuments";

interface DocumentsTabProps {
  clientId: string;
  documents?: any[];
}

export const DocumentsTab: React.FC<DocumentsTabProps> = ({ clientId }) => {
  const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false);
  const { data: documents = [], isLoading } = useClientDocuments(clientId);
  const uploadDocumentMutation = useUploadClientDocument();

  const handleUploadDocument = async (documentData: { name: string; type: string; uploaded_by: string; file: File }) => {
    await uploadDocumentMutation.mutateAsync({
      clientId,
      file: documentData.file,
      name: documentData.name,
      type: documentData.type,
      uploaded_by: documentData.uploaded_by,
    });
  };

  const getDocIcon = (type: string) => {
    switch(type.toLowerCase()) {
      case 'medical report': 
      case 'care plan': 
      case 'assessment': 
        return <File className="text-red-500" />;
      case 'legal document': 
      case 'insurance': 
        return <FileText className="text-blue-500" />;
      default: 
        return <FileText className="text-gray-500" />;
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-32">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="pb-2 bg-gradient-to-r from-blue-50 to-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-blue-600" />
              <CardTitle className="text-lg">Client Documents</CardTitle>
            </div>
            <Button size="sm" className="gap-1" onClick={() => setIsUploadDialogOpen(true)}>
              <FilePlus className="h-4 w-4 mr-1" />
              <span>Upload Document</span>
            </Button>
          </div>
          <CardDescription>Documents and files for client {clientId}</CardDescription>
        </CardHeader>
        <CardContent className="pt-4">
          {documents.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <FileText className="h-12 w-12 mx-auto mb-3 text-gray-300" />
              <p className="text-sm">No documents available for this client</p>
            </div>
          ) : (
            <div className="divide-y">
              {documents.map((doc) => (
                <div key={doc.id} className="flex items-center justify-between py-3 hover:bg-gray-50 px-2 rounded-md">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-gray-100 rounded-md">
                      {getDocIcon(doc.type)}
                    </div>
                    <div>
                      <p className="font-medium">{doc.name}</p>
                      <div className="flex items-center text-sm text-gray-500">
                        <span>{doc.uploaded_by}</span>
                        <span className="mx-1">•</span>
                        <Clock className="h-3 w-3 mr-1" />
                        <span>{format(new Date(doc.upload_date), 'MMM dd, yyyy')}</span>
                        {doc.file_size && (
                          <>
                            <span className="mx-1">•</span>
                            <span>{doc.file_size}</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge>{doc.type}</Badge>
                    <Button variant="outline" size="icon" title="View Document">
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button variant="outline" size="icon" title="Download Document">
                      <Download className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <UploadDocumentDialog
        open={isUploadDialogOpen}
        onOpenChange={setIsUploadDialogOpen}
        onSave={handleUploadDocument}
      />
    </div>
  );
};

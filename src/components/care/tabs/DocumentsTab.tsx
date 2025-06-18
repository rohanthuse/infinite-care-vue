
import React from "react";
import { format } from "date-fns";
import { FileText, Download, Eye, FileBox, Calendar, User, Clock, Plus } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useViewClientDocument, useDownloadClientDocument } from "@/hooks/useClientDocuments";

interface Document {
  name: string;
  date: Date;
  type: string;
  author: string;
  file_path?: string;
}

interface DocumentsTabProps {
  documents: Document[];
  onUploadDocument?: () => void;
}

export const DocumentsTab: React.FC<DocumentsTabProps> = ({ documents, onUploadDocument }) => {
  const viewDocumentMutation = useViewClientDocument();
  const downloadDocumentMutation = useDownloadClientDocument();

  const handleViewDocument = (document: Document) => {
    if (document.file_path) {
      viewDocumentMutation.mutate({ filePath: document.file_path });
    } else {
      console.error('Document has no file path');
    }
  };

  const handleDownloadDocument = (document: Document) => {
    if (document.file_path) {
      downloadDocumentMutation.mutate({ 
        filePath: document.file_path, 
        fileName: document.name 
      });
    } else {
      console.error('Document has no file path');
    }
  };

  const getDocumentTypeIcon = (type: string) => {
    switch (type) {
      case "PDF":
        return <FileText className="h-4 w-4 text-red-500" />;
      case "DOCX":
        return <FileText className="h-4 w-4 text-blue-500" />;
      default:
        return <FileBox className="h-4 w-4 text-gray-500" />;
    }
  };

  const getDocumentTypeBadge = (type: string) => {
    switch (type) {
      case "PDF":
        return "bg-red-50 text-red-700 border-red-200";
      case "DOCX":
        return "bg-blue-50 text-blue-700 border-blue-200";
      default:
        return "bg-gray-50 text-gray-700 border-gray-200";
    }
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="pb-2 bg-gradient-to-r from-blue-50 to-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-blue-600" />
              <CardTitle className="text-lg">Documents</CardTitle>
            </div>
            <Button size="sm" className="gap-1" onClick={onUploadDocument}>
              <Plus className="h-4 w-4" />
              <span>Upload Document</span>
            </Button>
          </div>
          <CardDescription>Medical reports and care plan documents</CardDescription>
        </CardHeader>
        <CardContent className="pt-4">
          {documents.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <FileBox className="h-12 w-12 mx-auto mb-3 text-gray-300" />
              <p className="text-sm">No documents available</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Document</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Author</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {documents.map((doc, index) => (
                  <TableRow key={index} className="hover:bg-gray-50">
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {getDocumentTypeIcon(doc.type)}
                        <span className="font-medium">{doc.name}</span>
                        <Badge variant="outline" className={`${getDocumentTypeBadge(doc.type)} text-xs`}>
                          {doc.type}
                        </Badge>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1 text-sm text-gray-600">
                        <Calendar className="h-3.5 w-3.5" />
                        <span>{format(doc.date, 'MMM dd, yyyy')}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1 text-sm text-gray-600">
                        <User className="h-3.5 w-3.5" />
                        <span>{doc.author}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="h-8 w-8 p-0"
                          onClick={() => handleViewDocument(doc)}
                          disabled={viewDocumentMutation.isPending}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="h-8 w-8 p-0"
                          onClick={() => handleDownloadDocument(doc)}
                          disabled={downloadDocumentMutation.isPending}
                        >
                          <Download className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

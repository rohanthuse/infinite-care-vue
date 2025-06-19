
import React, { useState } from "react";
import { format } from "date-fns";
import { File, FileText, FilePlus, Clock, Download, Eye, Edit, Trash2, Upload } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  useClientDocuments, 
  useUploadClientDocument, 
  useUpdateClientDocument, 
  useDeleteClientDocument,
  useViewClientDocument,
  useDownloadClientDocument,
  ClientDocument 
} from "@/hooks/useClientDocuments";

interface DocumentsTabProps {
  clientId: string;
}

export const DocumentsTab: React.FC<DocumentsTabProps> = ({ clientId }) => {
  const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [dragActive, setDragActive] = useState(false);
  
  const { data: documents = [], isLoading } = useClientDocuments(clientId);
  const uploadDocumentMutation = useUploadClientDocument();
  const viewDocumentMutation = useViewClientDocument();
  const downloadDocumentMutation = useDownloadClientDocument();

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setSelectedFile(e.dataTransfer.files[0]);
      setIsUploadDialogOpen(true);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
      setIsUploadDialogOpen(true);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) return;
    
    try {
      await uploadDocumentMutation.mutateAsync({
        clientId,
        file: selectedFile,
        name: selectedFile.name,
        type: "General Document",
        uploaded_by: "Current User",
      });
      setIsUploadDialogOpen(false);
      setSelectedFile(null);
    } catch (error) {
      console.error('Upload failed:', error);
    }
  };

  const handleViewDocument = (document: ClientDocument) => {
    if (document.file_path) {
      viewDocumentMutation.mutate({ filePath: document.file_path });
    }
  };

  const handleDownloadDocument = (document: ClientDocument) => {
    if (document.file_path) {
      downloadDocumentMutation.mutate({ 
        filePath: document.file_path, 
        fileName: document.name 
      });
    }
  };

  const getDocIcon = (type: string) => {
    switch(type.toLowerCase()) {
      case 'medical report': 
      case 'care plan': 
      case 'assessment': 
        return <File className="h-4 w-4 text-red-500" />;
      case 'legal document': 
      case 'insurance': 
        return <FileText className="h-4 w-4 text-blue-500" />;
      default: 
        return <FileText className="h-4 w-4 text-gray-500" />;
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
    <Card>
      <CardHeader className="pb-2 bg-gradient-to-r from-blue-50 to-white">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg flex items-center gap-2">
              <FileText className="h-5 w-5 text-blue-600" />
              <span>Documents</span>
            </CardTitle>
            <CardDescription>Client documents and files</CardDescription>
          </div>
          <div className="flex gap-2">
            <input
              type="file"
              onChange={handleFileSelect}
              className="hidden"
              id="file-upload"
              accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
            />
            <label htmlFor="file-upload">
              <Button variant="outline" size="sm" asChild>
                <span className="cursor-pointer">
                  <Upload className="h-4 w-4 mr-2" />
                  Upload
                </span>
              </Button>
            </label>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-4">
        {/* Drag and Drop Zone */}
        <div
          className={`border-2 border-dashed rounded-lg p-6 mb-4 text-center transition-colors ${
            dragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300'
          }`}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
        >
          <FilePlus className="h-8 w-8 mx-auto mb-2 text-gray-400" />
          <p className="text-sm text-gray-600">
            Drag and drop files here or{' '}
            <label htmlFor="file-upload" className="text-blue-600 cursor-pointer hover:underline">
              browse to upload
            </label>
          </p>
        </div>

        {documents.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <FileText className="h-12 w-12 mx-auto mb-3 text-gray-300" />
            <p className="text-sm">No documents available for this client</p>
          </div>
        ) : (
          <div className="divide-y">
            {documents.map((doc) => (
              <div key={doc.id} className="flex items-center justify-between py-3 hover:bg-gray-50 px-2 rounded-md group">
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
                  <Button 
                    variant="outline" 
                    size="icon" 
                    title="View Document"
                    onClick={() => handleViewDocument(doc)}
                    disabled={viewDocumentMutation.isPending}
                  >
                    <Eye className="h-4 w-4" />
                  </Button>
                  <Button 
                    variant="outline" 
                    size="icon" 
                    title="Download Document"
                    onClick={() => handleDownloadDocument(doc)}
                    disabled={downloadDocumentMutation.isPending}
                  >
                    <Download className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Simple Upload Dialog */}
        {isUploadDialogOpen && selectedFile && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center">
            <div className="bg-white rounded-lg p-6 w-96">
              <h3 className="text-lg font-semibold mb-4">Upload Document</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">File</label>
                  <p className="text-sm text-gray-600">{selectedFile.name}</p>
                </div>
                <div className="flex justify-end gap-2">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setIsUploadDialogOpen(false);
                      setSelectedFile(null);
                    }}
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleUpload}
                    disabled={uploadDocumentMutation.isPending}
                  >
                    {uploadDocumentMutation.isPending ? "Uploading..." : "Upload"}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

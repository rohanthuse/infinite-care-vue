
import React, { useState } from "react";
import { format } from "date-fns";
import { File, FileText, FilePlus, Clock, Download, Eye, Edit, Trash2, CheckSquare } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { UploadDocumentDialog } from "../dialogs/UploadDocumentDialog";
import { EditDocumentDialog } from "../dialogs/EditDocumentDialog";
import { DeleteDocumentDialog } from "../dialogs/DeleteDocumentDialog";
import { ClientDocumentBulkActionsBar } from "../ClientDocumentBulkActionsBar";
import { BulkDeleteClientDocumentsDialog } from "../BulkDeleteClientDocumentsDialog";
import { 
  useClientDocuments, 
  useUploadClientDocument, 
  useUpdateClientDocument, 
  useDeleteClientDocument,
  useBulkDeleteClientDocuments,
  useViewClientDocument,
  useDownloadClientDocument,
  ClientDocument 
} from "@/hooks/useClientDocuments";

interface DocumentsTabProps {
  clientId: string;
  documents?: any[];
}

export const DocumentsTab: React.FC<DocumentsTabProps> = ({ clientId }) => {
  const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState<ClientDocument | null>(null);
  const [selectedDocumentIds, setSelectedDocumentIds] = useState<string[]>([]);
  const [bulkDeleteDialogOpen, setBulkDeleteDialogOpen] = useState(false);
  
  const { data: documents = [], isLoading } = useClientDocuments(clientId);
  const uploadDocumentMutation = useUploadClientDocument();
  const updateDocumentMutation = useUpdateClientDocument();
  const deleteDocumentMutation = useDeleteClientDocument();
  const bulkDeleteMutation = useBulkDeleteClientDocuments();
  const viewDocumentMutation = useViewClientDocument();
  const downloadDocumentMutation = useDownloadClientDocument();

  // For now, assuming all users are super admins - this should be replaced with proper role checking
  const canManageDocuments = true;

  const handleDeleteDialogChange = React.useCallback((open: boolean) => {
    setIsDeleteDialogOpen(open);
    if (!open) {
      // Small delay to allow dialog close animation
      setTimeout(() => setSelectedDocument(null), 150);
    }
  }, []);

  const handleUploadDocument = async (documentData: { name: string; type: string; uploaded_by: string; file: File }) => {
    try {
      await uploadDocumentMutation.mutateAsync({
        clientId,
        file: documentData.file,
        name: documentData.name,
        type: documentData.type,
        uploaded_by: documentData.uploaded_by,
      });
      setIsUploadDialogOpen(false);
    } catch (error) {
      console.error('Upload failed:', error);
      // Error handling is done in the mutation
    }
  };

  const handleViewDocument = (document: ClientDocument) => {
    if (document.file_path) {
      viewDocumentMutation.mutate({ filePath: document.file_path });
    } else {
      console.error('Document has no file path');
    }
  };

  const handleDownloadDocument = (document: ClientDocument) => {
    if (document.file_path) {
      downloadDocumentMutation.mutate({ 
        filePath: document.file_path, 
        fileName: document.name 
      });
    } else {
      console.error('Document has no file path');
    }
  };

  const handleEditDocument = (document: ClientDocument) => {
    setSelectedDocument(document);
    setIsEditDialogOpen(true);
  };

  const handleUpdateDocument = async (documentData: { id: string; name: string; type: string; uploaded_by: string }) => {
    try {
      await updateDocumentMutation.mutateAsync({
        id: documentData.id,
        name: documentData.name,
        type: documentData.type,
        uploaded_by: documentData.uploaded_by,
      });
      setSelectedDocument(null);
    } catch (error) {
      console.error('Update failed:', error);
      // Error handling is done in the mutation
    }
  };

  const handleDeleteDocument = React.useCallback((document: ClientDocument) => {
    setSelectedDocument(document);
    setIsDeleteDialogOpen(true);
  }, []);

  const handleConfirmDelete = React.useCallback(async () => {
    if (selectedDocument) {
      try {
        await deleteDocumentMutation.mutateAsync(selectedDocument.id);
        setIsDeleteDialogOpen(false);
        setSelectedDocument(null);
      } catch (error) {
        console.error('Delete failed:', error);
        // Error handling is done in the mutation
      }
    }
  }, [selectedDocument, deleteDocumentMutation]);

  // Handle individual document selection
  const handleSelectDocument = (documentId: string, checked: boolean) => {
    if (checked) {
      setSelectedDocumentIds(prev => [...prev, documentId]);
    } else {
      setSelectedDocumentIds(prev => prev.filter(id => id !== documentId));
    }
  };

  // Handle select all
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedDocumentIds(documents.map(doc => doc.id));
    } else {
      setSelectedDocumentIds([]);
    }
  };

  // Clear selection
  const handleClearSelection = () => {
    setSelectedDocumentIds([]);
  };

  // Open bulk delete dialog
  const handleBulkDelete = () => {
    if (selectedDocumentIds.length > 0) {
      setBulkDeleteDialogOpen(true);
    }
  };

  // Confirm bulk delete
  const handleConfirmBulkDelete = async () => {
    try {
      await bulkDeleteMutation.mutateAsync(selectedDocumentIds);
      setBulkDeleteDialogOpen(false);
      setSelectedDocumentIds([]);
    } catch (error) {
      console.error('Bulk delete failed:', error);
    }
  };

  const allSelected = documents.length > 0 && selectedDocumentIds.length === documents.length;

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
        return <FileText className="text-muted-foreground" />;
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
        <CardHeader className="pb-2 bg-gradient-to-r from-blue-50 to-white dark:from-blue-950/30 dark:to-background">
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
            <div className="text-center py-8 text-muted-foreground">
              <FileText className="h-12 w-12 mx-auto mb-3 text-muted-foreground/50" />
              <p className="text-sm">No documents available for this client</p>
            </div>
          ) : (
            <>
              {/* Select All Row */}
              <div className="flex items-center gap-3 py-2 px-2 bg-muted rounded-md mb-2">
                <Checkbox
                  checked={allSelected}
                  onCheckedChange={handleSelectAll}
                  aria-label="Select all documents"
                />
                <span className="text-sm font-medium text-foreground">
                  Select All ({documents.length} document{documents.length > 1 ? 's' : ''})
                </span>
              </div>
              
              {/* Document List */}
              <div className="divide-y">
                {documents.map((doc) => {
                  const isSelected = selectedDocumentIds.includes(doc.id);
                  
                  return (
                    <div 
                      key={doc.id} 
                      className={`flex items-center justify-between py-3 px-2 rounded-md group transition-colors ${
                        isSelected ? 'bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-700' : 'hover:bg-muted'
                      }`}
                    >
                      <div className="flex items-center space-x-3 flex-1">
                        <Checkbox
                          checked={isSelected}
                          onCheckedChange={(checked) => handleSelectDocument(doc.id, checked as boolean)}
                          aria-label={`Select ${doc.name}`}
                        />
                        <div className="p-2 bg-muted rounded-md">
                          {getDocIcon(doc.type)}
                        </div>
                        <div className="flex-1">
                          <p className="font-medium">{doc.name}</p>
                          <div className="flex items-center text-sm text-muted-foreground">
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
                        {canManageDocuments && (
                          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Button
                              variant="outline"
                              size="icon"
                              onClick={() => handleEditDocument(doc)}
                              title="Edit Document"
                              className="h-8 w-8 hover:bg-blue-50"
                            >
                              <Edit className="h-4 w-4 text-blue-600" />
                            </Button>
                            <Button
                              variant="outline"
                              size="icon"
                              onClick={() => handleDeleteDocument(doc)}
                              title="Delete Document"
                              className="h-8 w-8 hover:bg-red-50"
                            >
                              <Trash2 className="h-4 w-4 text-red-600" />
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </CardContent>
      </Card>

      <UploadDocumentDialog
        open={isUploadDialogOpen}
        onOpenChange={setIsUploadDialogOpen}
        onSave={handleUploadDocument}
      />

      <EditDocumentDialog
        open={isEditDialogOpen}
        onOpenChange={setIsEditDialogOpen}
        onSave={handleUpdateDocument}
        document={selectedDocument}
      />

      <DeleteDocumentDialog
        open={isDeleteDialogOpen}
        onOpenChange={handleDeleteDialogChange}
        onConfirm={handleConfirmDelete}
        document={selectedDocument}
      />

      {/* Bulk Actions Bar */}
      <ClientDocumentBulkActionsBar
        selectedCount={selectedDocumentIds.length}
        onClearSelection={handleClearSelection}
        onBulkDelete={handleBulkDelete}
        isDeleting={bulkDeleteMutation.isPending}
      />

      {/* Bulk Delete Confirmation Dialog */}
      <BulkDeleteClientDocumentsDialog
        documentCount={selectedDocumentIds.length}
        open={bulkDeleteDialogOpen}
        onOpenChange={setBulkDeleteDialogOpen}
        onConfirm={handleConfirmBulkDelete}
        isLoading={bulkDeleteMutation.isPending}
      />
    </div>
  );
};

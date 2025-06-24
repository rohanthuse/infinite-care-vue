
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Search, FileText, Calendar, Download, Upload, Eye, Filter, AlertCircle, Edit, Trash2 } from "lucide-react";
import { format } from "date-fns";
import { useClientDocuments, useUploadClientDocument, useUpdateClientDocument, useDeleteClientDocument, useViewClientDocument, useDownloadClientDocument } from "@/hooks/useClientDocuments";
import { UploadDocumentDialog } from "@/components/clients/dialogs/UploadDocumentDialog";
import { EditDocumentDialog } from "@/components/clients/dialogs/EditDocumentDialog";
import { DeleteDocumentDialog } from "@/components/clients/dialogs/DeleteDocumentDialog";
import { Badge } from "@/components/ui/badge";

const ClientDocuments = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [activeFilter, setActiveFilter] = useState("all");
  const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState(null);

  // Get authenticated client ID from localStorage
  const getClientId = () => {
    const clientId = localStorage.getItem("clientId");
    return clientId || '';
  };

  const clientId = getClientId();
  const { data: documents = [], isLoading, error } = useClientDocuments(clientId);
  const uploadDocumentMutation = useUploadClientDocument();
  const updateDocumentMutation = useUpdateClientDocument();
  const deleteDocumentMutation = useDeleteClientDocument();
  const viewDocumentMutation = useViewClientDocument();
  const downloadDocumentMutation = useDownloadClientDocument();

  // Filter documents based on search term and active filter
  const filterDocuments = (docs) => {
    let filtered = docs;
    
    // Filter by category/type
    if (activeFilter !== "all") {
      filtered = filtered.filter(doc => {
        switch (activeFilter) {
          case "medical":
            return doc.type === "Medical Report" || doc.type === "Care Plan" || doc.type === "Assessment";
          case "legal":
            return doc.type === "Legal Document" || doc.type === "Insurance" || doc.type === "Consent Form";
          case "personal":
            return doc.uploaded_by === "Client";
          default:
            return true;
        }
      });
    }

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(doc => 
        doc.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
        doc.type.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    return filtered;
  };

  // Format date
  const formatDate = (dateStr) => {
    try {
      return format(new Date(dateStr), "MMM d, yyyy");
    } catch (e) {
      return dateStr;
    }
  };

  // Get document icon and color based on type
  const getDocIcon = (type) => {
    switch(type.toLowerCase()) {
      case 'medical report': 
      case 'care plan': 
      case 'assessment': 
        return <FileText className="h-5 w-5 text-red-500" />;
      case 'legal document': 
      case 'insurance': 
      case 'consent form':
        return <FileText className="h-5 w-5 text-blue-500" />;
      default: 
        return <FileText className="h-5 w-5 text-gray-500" />;
    }
  };

  // Handle document actions
  const handleUploadDocument = async (documentData) => {
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
    }
  };

  const handleViewDocument = (document) => {
    if (document.file_path) {
      viewDocumentMutation.mutate({ filePath: document.file_path });
    }
  };

  const handleDownloadDocument = (document) => {
    if (document.file_path) {
      downloadDocumentMutation.mutate({ 
        filePath: document.file_path, 
        fileName: document.name 
      });
    }
  };

  const handleEditDocument = (document) => {
    setSelectedDocument(document);
    setIsEditDialogOpen(true);
  };

  const handleUpdateDocument = async (documentData) => {
    try {
      await updateDocumentMutation.mutateAsync({
        id: documentData.id,
        name: documentData.name,
        type: documentData.type,
        uploaded_by: documentData.uploaded_by,
      });
      setSelectedDocument(null);
      setIsEditDialogOpen(false);
    } catch (error) {
      console.error('Update failed:', error);
    }
  };

  const handleDeleteDocument = (document) => {
    setSelectedDocument(document);
    setIsDeleteDialogOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (selectedDocument) {
      try {
        await deleteDocumentMutation.mutateAsync(selectedDocument.id);
        setSelectedDocument(null);
        setIsDeleteDialogOpen(false);
      } catch (error) {
        console.error('Delete failed:', error);
      }
    }
  };

  // Render document row
  const renderDocumentRow = (doc) => (
    <div key={doc.id} className="flex flex-col sm:flex-row sm:items-center py-4 border-b border-gray-200 hover:bg-gray-50 px-2 rounded-md group">
      <div className="flex-1 min-w-0">
        <div className="flex items-center">
          {getDocIcon(doc.type)}
          <div className="ml-3 truncate">
            <p className="font-medium truncate">{doc.name}</p>
            <div className="flex flex-col sm:flex-row sm:items-center text-xs text-gray-500 mt-1">
              <Badge variant="outline" className="mr-2 mb-1 sm:mb-0">
                {doc.type}
              </Badge>
              <span>Uploaded by: {doc.uploaded_by}</span>
              {doc.file_size && (
                <>
                  <span className="hidden sm:inline mx-2">•</span>
                  <span>{doc.file_size}</span>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
      <div className="flex items-center gap-2 mt-3 sm:mt-0">
        <div className="flex items-center text-xs text-gray-500 mr-4">
          <Calendar className="h-3 w-3 mr-1" />
          {formatDate(doc.upload_date)}
        </div>
        <div className="flex items-center gap-1">
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
        </div>
      </div>
    </div>
  );

  if (!clientId) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Authentication Required</h3>
          <p className="text-gray-500">Please log in to view your documents.</p>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your documents...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">Error loading documents</h3>
        <p className="text-gray-600">Unable to load your documents. Please try refreshing the page.</p>
      </div>
    );
  }

  const filteredDocuments = filterDocuments(documents);

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-xl border border-gray-200">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div>
            <h2 className="text-xl font-bold">Your Documents</h2>
            <p className="text-gray-500 text-sm">
              {documents.length} total documents • {filteredDocuments.length} showing
            </p>
          </div>
          
          <div className="flex items-center gap-3">
            <div className="relative flex-1 min-w-0 sm:w-64">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search documents..."
                className="pl-9"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Button 
              variant="outline" 
              className="flex items-center gap-2"
              onClick={() => setActiveFilter(activeFilter === "all" ? "medical" : "all")}
            >
              <Filter className="h-4 w-4" />
              <span className="hidden sm:inline">Filter</span>
            </Button>
            <Button 
              className="flex items-center gap-2"
              onClick={() => setIsUploadDialogOpen(true)}
              disabled={uploadDocumentMutation.isPending}
            >
              <Upload className="h-4 w-4" />
              <span className="hidden sm:inline">
                {uploadDocumentMutation.isPending ? 'Uploading...' : 'Upload'}
              </span>
            </Button>
          </div>
        </div>
        
        <Tabs value={activeFilter} onValueChange={setActiveFilter}>
          <TabsList>
            <TabsTrigger value="all">All Documents</TabsTrigger>
            <TabsTrigger value="medical">Medical</TabsTrigger>
            <TabsTrigger value="legal">Legal & Insurance</TabsTrigger>
            <TabsTrigger value="personal">Uploaded by Me</TabsTrigger>
          </TabsList>
          
          <TabsContent value={activeFilter} className="pt-6">
            <div className="space-y-1">
              {filteredDocuments.length > 0 ? 
                filteredDocuments.map(renderDocumentRow) : 
                <div className="text-center py-12">
                  <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No documents found</h3>
                  <p className="text-gray-500 mb-4">
                    {searchTerm ? "No documents match your search criteria." : "You haven't uploaded any documents yet."}
                  </p>
                  {!searchTerm && (
                    <Button onClick={() => setIsUploadDialogOpen(true)}>
                      <Upload className="h-4 w-4 mr-2" />
                      Upload Your First Document
                    </Button>
                  )}
                </div>
              }
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* Upload Dialog */}
      <UploadDocumentDialog
        open={isUploadDialogOpen}
        onOpenChange={setIsUploadDialogOpen}
        onSave={handleUploadDocument}
      />

      {/* Edit Dialog */}
      <EditDocumentDialog
        open={isEditDialogOpen}
        onOpenChange={setIsEditDialogOpen}
        onSave={handleUpdateDocument}
        document={selectedDocument}
      />

      {/* Delete Dialog */}
      <DeleteDocumentDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
        onConfirm={handleConfirmDelete}
        document={selectedDocument}
      />
    </div>
  );
};

export default ClientDocuments;

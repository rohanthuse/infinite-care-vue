
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Search, FileText, Calendar, Download, Upload, Eye, Filter, AlertCircle, Edit, Trash2 } from "lucide-react";
import { format } from "date-fns";
import { useClientDocuments, useUploadClientDocument, useUpdateClientDocument, useDeleteClientDocument, useViewClientDocument, useDownloadClientDocument } from "@/hooks/useClientDocuments";
import { useClientSharedDocuments } from "@/hooks/useAdminSharedDocuments";
import { useClientAuth } from "@/hooks/useClientAuth";
import { AdminSharedDocuments } from "@/components/documents/AdminSharedDocuments";
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
  const [downloadingId, setDownloadingId] = useState(null);

  const { isAuthenticated, clientId, isLoading: clientAuthLoading, error: clientAuthError } = useClientAuth();
  const { data: documents = [], isLoading, error } = useClientDocuments(clientId);
  const { data: sharedDocuments = [], isLoading: isLoadingShared } = useClientSharedDocuments(clientId);
  const uploadDocumentMutation = useUploadClientDocument();
  const updateDocumentMutation = useUpdateClientDocument();
  const deleteDocumentMutation = useDeleteClientDocument();
  const viewDocumentMutation = useViewClientDocument();
  const downloadDocumentMutation = useDownloadClientDocument();

  const filterDocuments = (docs) => {
    let filtered = docs;
    if (activeFilter !== "all") {
      filtered = filtered.filter(doc => {
        switch (activeFilter) {
          case "medical": return doc.type === "Medical Report" || doc.type === "Care Plan" || doc.type === "Assessment";
          case "legal": return doc.type === "Legal Document" || doc.type === "Insurance" || doc.type === "Consent Form";
          case "personal": return doc.uploaded_by === "Client";
          default: return true;
        }
      });
    }
    if (searchTerm) {
      filtered = filtered.filter(doc => doc.name.toLowerCase().includes(searchTerm.toLowerCase()) || doc.type.toLowerCase().includes(searchTerm.toLowerCase()));
    }
    return filtered;
  };

  const formatDate = (dateStr) => {
    try { return format(new Date(dateStr), "MMM d, yyyy"); } catch (e) { return dateStr; }
  };

  const getDocIcon = (type) => {
    switch(type.toLowerCase()) {
      case 'medical report': case 'care plan': case 'assessment': return <FileText className="h-5 w-5 text-red-500" />;
      case 'legal document': case 'insurance': case 'consent form': return <FileText className="h-5 w-5 text-blue-500" />;
      default: return <FileText className="h-5 w-5 text-gray-500 dark:text-muted-foreground" />;
    }
  };

  const handleUploadDocument = async (documentData) => {
    try {
      await uploadDocumentMutation.mutateAsync({ clientId, file: documentData.file, name: documentData.name, type: documentData.type, uploaded_by: documentData.uploaded_by });
      setIsUploadDialogOpen(false);
    } catch (error) { console.error('Upload failed:', error); }
  };

  const handleViewDocument = (document) => { if (document.file_path) viewDocumentMutation.mutate({ filePath: document.file_path }); };
  const handleDownloadDocument = async (document, e) => {
    if (e) e.stopPropagation();
    if (document.file_path) {
      try { setDownloadingId(document.id); await downloadDocumentMutation.mutateAsync({ filePath: document.file_path, fileName: document.name }); } 
      catch (error) { console.error('Download failed:', error); } 
      finally { setDownloadingId(null); }
    }
  };
  const handleEditDocument = (document) => { setSelectedDocument(document); setIsEditDialogOpen(true); };
  const handleUpdateDocument = async (documentData) => {
    try { await updateDocumentMutation.mutateAsync({ id: documentData.id, name: documentData.name, type: documentData.type, uploaded_by: documentData.uploaded_by }); setSelectedDocument(null); setIsEditDialogOpen(false); } 
    catch (error) { console.error('Update failed:', error); }
  };
  const handleDeleteDocument = (document) => { setSelectedDocument(document); setIsDeleteDialogOpen(true); };
  const handleConfirmDelete = async () => {
    if (selectedDocument) {
      try { await deleteDocumentMutation.mutateAsync(selectedDocument.id); setSelectedDocument(null); setIsDeleteDialogOpen(false); } 
      catch (error) { console.error('Delete failed:', error); }
    }
  };

  const renderDocumentRow = (doc) => (
    <div key={doc.id} className="flex flex-col sm:flex-row sm:items-center py-4 border-b border-gray-200 dark:border-border hover:bg-gray-50 dark:hover:bg-muted/50 px-2 rounded-md group">
      <div className="flex-1 min-w-0">
        <div className="flex items-center">
          {getDocIcon(doc.type)}
          <div className="ml-3 truncate">
            <p className="font-medium truncate text-foreground">{doc.name}</p>
            <div className="flex flex-col sm:flex-row sm:items-center text-xs text-gray-500 dark:text-muted-foreground mt-1">
              <Badge variant="outline" className="mr-2 mb-1 sm:mb-0">{doc.type}</Badge>
              <span>Uploaded by: {doc.uploaded_by}</span>
              {doc.file_size && (<><span className="hidden sm:inline mx-2">•</span><span>{doc.file_size}</span></>)}
            </div>
          </div>
        </div>
      </div>
      <div className="flex items-center gap-2 mt-3 sm:mt-0">
        <div className="flex items-center text-xs text-gray-500 dark:text-muted-foreground mr-4"><Calendar className="h-3 w-3 mr-1" />{formatDate(doc.upload_date)}</div>
        <div className="flex items-center gap-1">
          <Button variant="outline" size="icon" title="View Document" onClick={() => handleViewDocument(doc)} disabled={viewDocumentMutation.isPending}><Eye className="h-4 w-4" /></Button>
          <Button variant="outline" size="icon" title="Download Document" onClick={(e) => handleDownloadDocument(doc, e)} disabled={downloadingId === doc.id}><Download className="h-4 w-4" /></Button>
          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <Button variant="outline" size="icon" onClick={() => handleEditDocument(doc)} title="Edit Document" className="h-8 w-8 hover:bg-blue-50 dark:hover:bg-blue-950/30"><Edit className="h-4 w-4 text-blue-600" /></Button>
            <Button variant="outline" size="icon" onClick={() => handleDeleteDocument(doc)} title="Delete Document" className="h-8 w-8 hover:bg-red-50 dark:hover:bg-red-950/30"><Trash2 className="h-4 w-4 text-red-600" /></Button>
          </div>
        </div>
      </div>
    </div>
  );

  if (clientAuthLoading) return (<div className="flex items-center justify-center h-64"><div className="text-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div><p className="text-gray-600 dark:text-muted-foreground">Loading authentication...</p></div></div>);
  if (!isAuthenticated || !clientId) return (<div className="flex items-center justify-center h-64"><div className="text-center"><AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" /><h3 className="text-lg font-medium text-gray-900 dark:text-foreground mb-2">Authentication Required</h3><p className="text-gray-500 dark:text-muted-foreground">Please log in as a client to view your documents.</p>{clientAuthError && (<p className="text-red-500 text-sm mt-2">Error: {clientAuthError.message}</p>)}</div></div>);
  if (isLoading) return (<div className="flex items-center justify-center h-64"><div className="text-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div><p className="text-gray-600 dark:text-muted-foreground">Loading your documents...</p></div></div>);
  if (error) return (<div className="text-center py-12"><AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" /><h3 className="text-lg font-medium text-gray-900 dark:text-foreground mb-2">Error loading documents</h3><p className="text-gray-600 dark:text-muted-foreground">Unable to load your documents. Please try refreshing the page.</p></div>);

  const filteredDocuments = filterDocuments(documents);

  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-card p-6 rounded-xl border border-gray-200 dark:border-border">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div>
            <h2 className="text-xl font-bold text-foreground">Your Documents</h2>
            <p className="text-gray-500 dark:text-muted-foreground text-sm">{documents.length} total documents • {filteredDocuments.length} showing</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="relative flex-1 min-w-0 sm:w-64">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400 dark:text-muted-foreground" />
              <Input placeholder="Search documents..." className="pl-9" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
            </div>
            <Button variant="outline" className="flex items-center gap-2" onClick={() => setActiveFilter(activeFilter === "all" ? "medical" : "all")}><Filter className="h-4 w-4" /><span className="hidden sm:inline">Filter</span></Button>
            <Button className="flex items-center gap-2" onClick={() => setIsUploadDialogOpen(true)} disabled={uploadDocumentMutation.isPending}><Upload className="h-4 w-4" /><span className="hidden sm:inline">{uploadDocumentMutation.isPending ? 'Uploading...' : 'Upload'}</span></Button>
          </div>
        </div>
        <Tabs value={activeFilter} onValueChange={setActiveFilter}>
          <TabsList><TabsTrigger value="all">All Documents</TabsTrigger><TabsTrigger value="medical">Medical</TabsTrigger><TabsTrigger value="legal">Legal & Insurance</TabsTrigger><TabsTrigger value="personal">Uploaded by Me</TabsTrigger></TabsList>
          <TabsContent value={activeFilter} className="pt-6">
            <div className="space-y-1">
              {filteredDocuments.length > 0 ? filteredDocuments.map(renderDocumentRow) : (
                <div className="text-center py-12"><FileText className="h-12 w-12 text-gray-400 dark:text-muted-foreground mx-auto mb-4" /><h3 className="text-lg font-medium text-gray-900 dark:text-foreground mb-2">No documents found</h3><p className="text-gray-500 dark:text-muted-foreground mb-4">{searchTerm ? "No documents match your search criteria." : "You haven't uploaded any documents yet."}</p>{!searchTerm && (<Button onClick={() => setIsUploadDialogOpen(true)}><Upload className="h-4 w-4 mr-2" />Upload Your First Document</Button>)}</div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>
      <UploadDocumentDialog open={isUploadDialogOpen} onOpenChange={setIsUploadDialogOpen} onSave={handleUploadDocument} />
      <EditDocumentDialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen} onSave={handleUpdateDocument} document={selectedDocument} />
      <DeleteDocumentDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen} onConfirm={handleConfirmDelete} document={selectedDocument} />
      <AdminSharedDocuments documents={sharedDocuments} isLoading={isLoadingShared} title="Documents Shared by Admin" emptyMessage="No documents have been shared with you by your care team." />
    </div>
  );
};

export default ClientDocuments;

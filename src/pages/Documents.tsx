import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { BranchLayout } from "@/components/branch-dashboard/BranchLayout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { UnifiedDocumentsList } from "@/components/documents/UnifiedDocumentsList";
import { UnifiedUploadDialog } from "@/components/documents/UnifiedUploadDialog";
import { UnifiedInlineUploadForm } from "@/components/documents/UnifiedInlineUploadForm";
import { useUnifiedDocuments } from "@/hooks/useUnifiedDocuments";
import { Upload, Eye } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

const Documents = () => {
  const [activeTab, setActiveTab] = useState("view");
  const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false);
  const { id, branchName } = useParams<{ id: string; branchName: string }>();
  const queryClient = useQueryClient();

  const {
    documents,
    isLoading: documentsLoading,
    uploadDocument,
    isUploading,
    deleteDocument,
    deleteBulkDocuments,
    downloadDocument,
    viewDocument
  } = useUnifiedDocuments(id || '');

  // Fetch clients and staff for the upload dialog
  const { data: clients = [] } = useQuery({
    queryKey: ['clients', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('clients')
        .select('id, first_name, last_name')
        .eq('branch_id', id)
        .order('first_name');
      
      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });

  const { data: staff = [] } = useQuery({
    queryKey: ['staff', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('staff')
        .select('id, first_name, last_name')
        .eq('branch_id', id)
        .order('first_name');
      
      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });

  useEffect(() => {
    if (branchName) {
      document.title = `Documents - ${decodeURIComponent(branchName)}`;
    }
  }, [branchName]);

  const handleTabChange = (value: string) => {
    setActiveTab(value);
  };

  const handleUploadDocument = async (uploadData: any) => {
    try {
      await uploadDocument(uploadData);
      setIsUploadDialogOpen(false);
    } catch (error) {
      console.error('Upload failed:', error);
      // Error is already handled by the uploadDocument function with toast notifications
    }
  };

  const handleDeleteDocument = async (documentId: string) => {
    if (window.confirm('Are you sure you want to delete this document? This action cannot be undone.')) {
      await deleteDocument(documentId);
    }
  };

  const handleBulkDeleteDocuments = async (documentIds: string[]) => {
    await deleteBulkDocuments(documentIds);
  };

  return (
    <BranchLayout onUploadDocument={() => setIsUploadDialogOpen(true)}>
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-xl font-bold mb-1">Documents</h2>
            <p className="text-sm text-muted-foreground">Manage and organize branch documents</p>
          </div>
          <Button 
            onClick={() => setIsUploadDialogOpen(true)}
            className="bg-blue-600 hover:bg-blue-700"
          >
            <Upload className="h-4 w-4 mr-2" />
            Upload Document
          </Button>
        </div>
        
        <Tabs value={activeTab} onValueChange={handleTabChange} className="mt-2">
          <TabsList className="grid grid-cols-2 mb-6 w-full lg:w-auto">
            <TabsTrigger value="view" className="flex items-center gap-1">
              <Eye className="h-4 w-4" />
              <span>View Documents</span>
            </TabsTrigger>
            <TabsTrigger value="upload" className="flex items-center gap-1">
              <Upload className="h-4 w-4" />
              <span>Upload Documents</span>
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="view" className="space-y-6">
            <UnifiedDocumentsList
              documents={documents}
              isLoading={documentsLoading}
              onDeleteDocument={handleDeleteDocument}
              onBulkDeleteDocuments={handleBulkDeleteDocuments}
              onDownloadDocument={downloadDocument}
              onViewDocument={viewDocument}
              branchId={id || ""}
            />
          </TabsContent>
          
          <TabsContent value="upload" className="space-y-6">
            <UnifiedInlineUploadForm
              onSave={handleUploadDocument}
              isUploading={isUploading}
              clients={clients || []}
              staff={staff || []}
            />
          </TabsContent>
        </Tabs>
      </div>

      {/* Upload Dialog */}
      <UnifiedUploadDialog
        open={isUploadDialogOpen}
        onOpenChange={setIsUploadDialogOpen}
        onSave={handleUploadDocument}
        clients={clients || []}
        staff={staff || []}
      />
    </BranchLayout>
  );
};

export default Documents;
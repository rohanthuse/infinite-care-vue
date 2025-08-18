
import React, { useState, useEffect } from "react";
import { DashboardHeader } from "@/components/DashboardHeader";
import { BranchInfoHeader } from "@/components/BranchInfoHeader";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { useParams, useNavigate } from "react-router-dom";
import { FilePlus } from "lucide-react";
import { TabNavigation } from "@/components/TabNavigation";
import { UnifiedDocumentsList } from "@/components/documents/UnifiedDocumentsList";
import { UnifiedUploadDialog } from "@/components/documents/UnifiedUploadDialog";
import { useUnifiedDocuments } from "@/hooks/useUnifiedDocuments";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

const Documents = () => {
  const { id, branchName } = useParams();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("view");
  const [activeNavTab, setActiveNavTab] = useState("documents");
  const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false);
  const decodedBranchName = decodeURIComponent(branchName || "Med-Infinite Branch");

  const {
    documents,
    isLoading,
    uploadDocument,
    deleteDocument,
    downloadDocument,
    viewDocument,
    isUploading
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

  // Set page title
  useEffect(() => {
    document.title = `Documents | ${decodedBranchName}`;
  }, [decodedBranchName]);
  
  const handleTabChange = (value: string) => {
    setActiveTab(value);
  };
  
  const handleNavTabChange = (value: string) => {
    setActiveNavTab(value);
    
    if (value !== "documents") {
      navigate(`/branch-dashboard/${id}/${encodeURIComponent(decodedBranchName)}/${value}`);
    }
  };

  const handleUploadDocument = async (documentData: any) => {
    await uploadDocument(documentData);
    setIsUploadDialogOpen(false);
  };

  const handleDeleteDocument = async (documentId: string) => {
    if (window.confirm('Are you sure you want to delete this document? This action cannot be undone.')) {
      await deleteDocument(documentId);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-gray-50 to-white">
      <DashboardHeader />
      
      <main className="flex-1 px-4 md:px-8 pt-4 pb-8 md:py-6 w-full max-w-[1600px] mx-auto">
        <BranchInfoHeader 
          branchName={decodedBranchName} 
          branchId={id || ""}
          onNewBooking={() => {}}
        />
        
        <div className="mt-6">
          <TabNavigation 
            activeTab={activeNavTab} 
            onChange={handleNavTabChange} 
            hideActionsOnMobile={true}
          />
        </div>
        
        <div className="mt-6 bg-white rounded-lg border border-gray-200 shadow-sm flex flex-col">
          <div className="p-6 border-b border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold">Documents & Resources</h2>
                <p className="text-gray-500 mt-1">
                  Unified document management system - {documents.length} documents across all sources
                </p>
              </div>
              <Button onClick={() => setIsUploadDialogOpen(true)} disabled={isUploading}>
                <FilePlus className="mr-2 h-4 w-4" />
                {isUploading ? 'Uploading...' : 'Upload Document'}
              </Button>
            </div>
          </div>
          
          <Tabs 
            value={activeTab} 
            onValueChange={handleTabChange} 
            className="w-full flex flex-col flex-1"
          >
            <div className="bg-gray-50 border-b border-gray-100 p-1.5 sm:p-2.5 sticky top-0 z-20">
              <TabsList className="w-full grid grid-cols-2 rounded-md overflow-hidden bg-gray-100/80 p-0.5 sm:p-1">
                <TabsTrigger 
                  value="view" 
                  className="text-base font-medium py-2.5 rounded-md transition-all duration-200 data-[state=active]:text-white data-[state=active]:shadow-sm data-[state=active]:bg-green-500"
                >
                  View Documents
                </TabsTrigger>
                <TabsTrigger 
                  value="upload" 
                  className="text-base font-medium py-2.5 rounded-md transition-all duration-200 data-[state=active]:text-white data-[state=active]:shadow-sm data-[state=active]:bg-green-500"
                >
                  Upload Document
                </TabsTrigger>
              </TabsList>
            </div>
            
            <div className="flex-1 overflow-hidden">
              <TabsContent 
                value="view" 
                className="p-0 focus:outline-none m-0 h-full overflow-y-auto"
              >
                <div className="p-4 md:p-6 max-w-full">
                  <UnifiedDocumentsList
                    documents={documents}
                    onViewDocument={viewDocument}
                    onDownloadDocument={downloadDocument}
                    onDeleteDocument={handleDeleteDocument}
                    isLoading={isLoading}
                  />
                </div>
              </TabsContent>
              
              <TabsContent 
                value="upload" 
                className="p-0 focus:outline-none m-0 h-full overflow-y-auto"
              >
                <div className="p-4 md:p-6 max-w-full">
                  <div className="max-w-2xl mx-auto">
                    <div className="text-center mb-8">
                      <h3 className="text-lg font-semibold mb-2">Upload New Document</h3>
                      <p className="text-gray-600">
                        Upload documents with proper categorization, tagging, and relationships to clients, staff, or other entities.
                      </p>
                    </div>
                    <Button 
                      onClick={() => setIsUploadDialogOpen(true)} 
                      size="lg"
                      className="w-full"
                      disabled={isUploading}
                    >
                      <FilePlus className="mr-2 h-5 w-5" />
                      {isUploading ? 'Uploading...' : 'Choose File to Upload'}
                    </Button>
                  </div>
                </div>
              </TabsContent>
            </div>
          </Tabs>
        </div>
      </main>

      <UnifiedUploadDialog
        open={isUploadDialogOpen}
        onOpenChange={setIsUploadDialogOpen}
        onSave={handleUploadDocument}
        clients={clients}
        staff={staff}
      />
    </div>
  );
};

export default Documents;

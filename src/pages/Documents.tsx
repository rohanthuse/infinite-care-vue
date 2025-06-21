
import React, { useState, useEffect } from "react";
import { DashboardHeader } from "@/components/DashboardHeader";
import { BranchInfoHeader } from "@/components/BranchInfoHeader";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useParams, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { TabNavigation } from "@/components/TabNavigation";
import { UnifiedDocumentsList } from "@/components/documents/UnifiedDocumentsList";
import { UnifiedUploadDialog, UploadDocumentData } from "@/components/documents/UnifiedUploadDialog";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

const Documents = () => {
  const { id, branchName } = useParams();
  const navigate = useNavigate();
  const [activeNavTab, setActiveNavTab] = useState("documents");
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const decodedBranchName = decodeURIComponent(branchName || "Med-Infinite Branch");

  useEffect(() => {
    document.title = `Documents | ${decodedBranchName}`;
  }, [decodedBranchName]);
  
  const handleNavTabChange = (value: string) => {
    setActiveNavTab(value);
    
    if (value !== "documents") {
      if (id && branchName) {
        navigate(`/admin/branch-dashboard/${id}/${encodeURIComponent(decodedBranchName)}/${value}`);
      } else {
        navigate(`/admin/${value}`);
      }
    }
  };
  
  const handleNewBooking = () => {
    toast.info("New booking functionality will be implemented soon");
  };

  // Mock documents data - this would normally come from a hook/API
  const mockDocuments = [
    {
      id: "1",
      name: "Sample Document.pdf",
      type: "PDF",
      category: "Medical Report",
      description: "Sample medical report",
      file_path: "documents/sample.pdf",
      file_size: "2.1 MB",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      uploaded_by: "admin",
      uploaded_by_name: "Admin User",
      tags: ["medical", "report"],
      access_level: "branch",
      source_table: "documents",
      related_entity: "Client",
      client_name: "John Doe",
      staff_name: null,
      has_file: true
    }
  ];

  const handleViewDocument = (filePath: string) => {
    toast.info("Document viewer will be implemented soon");
    console.log("Viewing document:", filePath);
  };

  const handleDownloadDocument = (filePath: string, fileName: string) => {
    toast.info("Document download will be implemented soon");
    console.log("Downloading document:", filePath, fileName);
  };

  const handleDeleteDocument = (documentId: string) => {
    toast.info("Document deletion will be implemented soon");
    console.log("Deleting document:", documentId);
  };

  const handleSaveDocument = async (documentData: UploadDocumentData) => {
    try {
      console.log("Saving document:", documentData);
      toast.success("Document uploaded successfully");
      // Here you would normally call your upload API
    } catch (error) {
      console.error("Upload error:", error);
      toast.error("Failed to upload document");
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-gray-50 to-white">
      <DashboardHeader />
      
      <main className="flex-1 px-4 md:px-8 pt-4 pb-8 md:py-6 w-full max-w-[1600px] mx-auto">
        <BranchInfoHeader 
          branchName={decodedBranchName} 
          branchId={id || ""}
          onNewBooking={handleNewBooking}
        />
        
        <div className="mt-6">
          <TabNavigation 
            activeTab={activeNavTab} 
            onChange={handleNavTabChange} 
            hideActionsOnMobile={true}
          />
        </div>
        
        <div className="mt-6 bg-white rounded-lg border border-gray-200 shadow-sm">
          <div className="p-6 border-b border-gray-100 flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold">Document Management</h2>
              <p className="text-gray-500 mt-1">Manage and organize all branch documents</p>
            </div>
            <Button onClick={() => setUploadDialogOpen(true)} className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Upload Document
            </Button>
          </div>
          
          <div className="p-6">
            <UnifiedDocumentsList 
              documents={mockDocuments}
              onViewDocument={handleViewDocument}
              onDownloadDocument={handleDownloadDocument}
              onDeleteDocument={handleDeleteDocument}
              isLoading={false}
            />
          </div>
        </div>
        
        <UnifiedUploadDialog
          open={uploadDialogOpen}
          onOpenChange={setUploadDialogOpen}
          onSave={handleSaveDocument}
        />
      </main>
    </div>
  );
};

export default Documents;


import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { DashboardHeader } from "@/components/DashboardHeader";
import { BranchInfoHeader } from "@/components/BranchInfoHeader";
import { TabNavigation } from "@/components/TabNavigation";
import { UnifiedDocumentsList } from "@/components/documents/UnifiedDocumentsList";
import { UnifiedUploadDialog } from "@/components/documents/UnifiedUploadDialog";
import { Button } from "@/components/ui/button";
import { Plus, FileText, AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useUserRoleCheck } from "@/hooks/useUserRoleCheck";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";

const Documents = () => {
  const { id: branchId, branchName } = useParams();
  const [activeNavTab, setActiveNavTab] = useState("documents");
  const [showUploadDialog, setShowUploadDialog] = useState(false);
  
  console.log('Documents page - branchId:', branchId, 'branchName:', branchName);
  
  // Get user role information
  const { data: roleInfo, isLoading: roleLoading, error: roleError } = useUserRoleCheck();
  
  console.log('Documents page - roleInfo:', roleInfo, 'loading:', roleLoading, 'error:', roleError);
  
  // Determine if we're in branch context or standalone
  const isStandalone = !branchId;
  const decodedBranchName = branchName ? decodeURIComponent(branchName) : "Documents";
  
  console.log('Documents page - isStandalone:', isStandalone, 'decodedBranchName:', decodedBranchName);
  
  // Get the first available branch for standalone mode
  const selectedBranchId = isStandalone && roleInfo?.associatedBranches?.length 
    ? roleInfo.associatedBranches[0] 
    : branchId;

  console.log('Documents page - selectedBranchId:', selectedBranchId);

  // Set page title
  useEffect(() => {
    document.title = isStandalone ? "Documents" : `Documents | ${decodedBranchName}`;
  }, [isStandalone, decodedBranchName]);

  const handleNavTabChange = (value: string) => {
    setActiveNavTab(value);
    // Navigation logic would go here if needed
  };

  const handleNewBooking = () => {
    toast.info("New booking functionality will be implemented soon");
  };

  const handleUploadSuccess = () => {
    setShowUploadDialog(false);
    toast.success("Document uploaded successfully");
  };

  // Show loading state while checking roles
  if (roleLoading) {
    console.log('Documents page - showing loading state');
    return (
      <div className="min-h-screen flex flex-col bg-gradient-to-br from-gray-50 to-white">
        <DashboardHeader />
        <main className="flex-1 px-4 md:px-8 pt-4 pb-8 md:py-6 w-full max-w-[1600px] mx-auto">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Loading user permissions...</p>
            </div>
          </div>
        </main>
      </div>
    );
  }

  // Show error if role check failed
  if (roleError) {
    console.log('Documents page - showing error state:', roleError);
    return (
      <div className="min-h-screen flex flex-col bg-gradient-to-br from-gray-50 to-white">
        <DashboardHeader />
        <main className="flex-1 px-4 md:px-8 pt-4 pb-8 md:py-6 w-full max-w-[1600px] mx-auto">
          <Alert className="border-red-200 bg-red-50 max-w-md mx-auto mt-8">
            <AlertCircle className="h-4 w-4 text-red-600" />
            <AlertDescription className="text-red-800">
              Failed to load user permissions. Please refresh the page or contact support.
              <br />
              <small className="text-gray-600 mt-2 block">Error: {roleError.message}</small>
            </AlertDescription>
          </Alert>
        </main>
      </div>
    );
  }

  // Allow access even without specific role info for now - better UX
  if (!roleInfo) {
    console.log('Documents page - no role info, allowing basic access');
  }

  // Show branch selection for standalone mode if no branch is available
  if (isStandalone && !selectedBranchId && roleInfo && !roleInfo.isSuperAdmin) {
    console.log('Documents page - no branch available for standalone mode');
    return (
      <div className="min-h-screen flex flex-col bg-gradient-to-br from-gray-50 to-white">
        <DashboardHeader />
        <main className="flex-1 px-4 md:px-8 pt-4 pb-8 md:py-6 w-full max-w-[1600px] mx-auto">
          <Card className="max-w-md mx-auto mt-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Documents
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 mb-4">
                No branch context available. Please access documents through a specific branch.
              </p>
              <Button onClick={() => window.history.back()} variant="outline">
                Go Back
              </Button>
            </CardContent>
          </Card>
        </main>
      </div>
    );
  }

  console.log('Documents page - rendering main content');

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-gray-50 to-white">
      <DashboardHeader />
      
      <main className="flex-1 px-4 md:px-8 pt-4 pb-8 md:py-6 w-full max-w-[1600px] mx-auto">
        {/* Show branch header only in branch context */}
        {!isStandalone && (
          <BranchInfoHeader 
            branchName={decodedBranchName} 
            branchId={branchId || ""}
            onNewBooking={handleNewBooking}
          />
        )}
        
        {/* Show standalone header for standalone mode */}
        {isStandalone && (
          <div className="mb-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Documents</h1>
                <p className="text-gray-600 mt-1">Manage and organize your documents</p>
              </div>
              <Button onClick={() => setShowUploadDialog(true)} className="flex items-center gap-2">
                <Plus className="h-4 w-4" />
                Upload Document
              </Button>
            </div>
          </div>
        )}
        
        {/* Show tab navigation only in branch context */}
        {!isStandalone && (
          <div className="mt-6">
            <TabNavigation 
              activeTab={activeNavTab} 
              onChange={handleNavTabChange} 
              hideActionsOnMobile={true}
            />
          </div>
        )}
        
        {/* Documents content */}
        <div className={isStandalone ? "mt-0" : "mt-6"}>
          <div className="space-y-6">
            {!isStandalone && (
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-semibold text-gray-900">Branch Documents</h2>
                  <p className="text-sm text-gray-600 mt-1">
                    Manage documents for {decodedBranchName}
                  </p>
                </div>
                <Button onClick={() => setShowUploadDialog(true)} className="flex items-center gap-2">
                  <Plus className="h-4 w-4" />
                  Upload Document
                </Button>
              </div>
            )}
            
            <UnifiedDocumentsList branchId={selectedBranchId || branchId || ""} />
          </div>
        </div>
      </main>

      <UnifiedUploadDialog
        open={showUploadDialog}
        onOpenChange={setShowUploadDialog}
        branchId={selectedBranchId || branchId || ""}
        onSuccess={handleUploadSuccess}
      />
    </div>
  );
};

export default Documents;

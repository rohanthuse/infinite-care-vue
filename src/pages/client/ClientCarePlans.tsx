import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FileText, Clock, CheckCircle, AlertCircle, Printer, FileDown, PenTool, MessageSquare } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { useClientCarePlansWithDetails } from "@/hooks/useCarePlanData";
import { useToast } from "@/hooks/use-toast";
import { ClientCarePlanApprovalDialog } from "@/components/client/ClientCarePlanApprovalDialog";
import { ClientChangeRequestDialog } from "@/components/client/ClientChangeRequestDialog";
import { useApproveCarePlan, useRejectCarePlan, useCarePlanRequiresApproval, useCarePlanStatus, useRequestChanges, useCarePlanHasChangeRequest } from "@/hooks/useCarePlanApproval";
import { useSimpleClientAuth } from "@/hooks/useSimpleClientAuth";
import { CarePlanDataEnhancer } from "@/components/care/CarePlanDataEnhancer";
import { CarePlanViewDialog } from "@/components/care/CarePlanViewDialog";
const ClientCarePlans = () => {
  const {
    toast
  } = useToast();
  const [approvalDialogOpen, setApprovalDialogOpen] = useState(false);
  const [changeRequestDialogOpen, setChangeRequestDialogOpen] = useState(false);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [selectedCarePlan, setSelectedCarePlan] = useState<any>(null);
  const approveCarePlanMutation = useApproveCarePlan();
  const rejectCarePlanMutation = useRejectCarePlan();
  const requestChangesMutation = useRequestChanges();

  // Get authenticated client using proper Supabase auth
  const {
    data: authData,
    isLoading: authLoading,
    error: authError
  } = useSimpleClientAuth();
  const clientId = authData?.client?.id;
  const {
    data: carePlans,
    isLoading,
    error
  } = useClientCarePlansWithDetails(clientId || '');
  const handleOpenChangeRequestDialog = (carePlan: any) => {
    setSelectedCarePlan(carePlan);
    setChangeRequestDialogOpen(true);
  };

  const handleOpenViewDialog = (carePlan: any) => {
    setSelectedCarePlan(carePlan);
    setViewDialogOpen(true);
  };

  const handleSubmitChangeRequest = (comments: string) => {
    if (!selectedCarePlan) return;
    
    requestChangesMutation.mutate(
      { carePlanId: selectedCarePlan.id, comments },
      {
        onSuccess: () => {
          setChangeRequestDialogOpen(false);
          setSelectedCarePlan(null);
        }
      }
    );
  };
  const handlePrintPlan = () => {
    window.print();
    toast({
      title: "Print Care Plan",
      description: "Print dialog opened. You can now print or save as PDF."
    });
  };
  if (authLoading || isLoading) {
    return <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your care plans...</p>
        </div>
      </div>;
  }
  if (authError || !clientId) {
    return <div className="text-center py-12">
        <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">Authentication Required</h3>
        <p className="text-gray-600">Please log in to view your care plans.</p>
      </div>;
  }
  if (error) {
    return <div className="text-center py-12">
        <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">Error loading care plans</h3>
        <p className="text-gray-600">Unable to load your care plans. Please try refreshing the page.</p>
      </div>;
  }
  if (!carePlans || carePlans.length === 0) {
    return <div className="text-center py-12">
        <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">No care plans found</h3>
        <p className="text-gray-600">You don't have any care plans at this time. Please contact your care provider if you believe this is an error.</p>
      </div>;
  }
  const handleApproveCarePlan = async (signatureData: string, comments: string) => {
    if (!selectedCarePlan) return;
    await approveCarePlanMutation.mutateAsync({
      carePlanId: selectedCarePlan.id,
      signatureData,
      comments
    });
  };
  const handleRejectCarePlan = async (comments: string) => {
    if (!selectedCarePlan) return;
    await rejectCarePlanMutation.mutateAsync({
      carePlanId: selectedCarePlan.id,
      comments
    });
  };
  const handleOpenApprovalDialog = (carePlan: any) => {
    setSelectedCarePlan(carePlan);
    setApprovalDialogOpen(true);
  };

  // Count pending approvals for summary
  const pendingApprovals = carePlans.filter(cp => useCarePlanRequiresApproval(cp)).length;

  // Function to render goal status badge
  const renderGoalStatus = (status: string) => {
    switch (status) {
      case "completed":
        return <span className="text-xs font-medium bg-green-100 text-green-800 px-2 py-1 rounded-full">Completed</span>;
      case "in-progress":
        return <span className="text-xs font-medium bg-blue-100 text-blue-800 px-2 py-1 rounded-full">In Progress</span>;
      case "not-started":
        return <span className="text-xs font-medium bg-gray-100 text-gray-800 px-2 py-1 rounded-full">Not Started</span>;
      default:
        return null;
    }
  };
  return <div className="space-y-6">
      {/* Summary Header */}
      <div className="bg-white p-6 rounded-xl border border-gray-200">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold flex items-center">
              <FileText className="h-6 w-6 mr-3 text-blue-600" />
              Your Care Plans
            </h1>
            <p className="text-gray-600 mt-1">
              You have {carePlans.length} care plan{carePlans.length !== 1 ? 's' : ''}
              {pendingApprovals > 0 && <span className="text-orange-600 font-medium">
                  {' • '}{pendingApprovals} requiring your approval
                </span>}
            </p>
          </div>
          <Button variant="outline" onClick={handlePrintPlan} className="gap-2">
            <Printer className="h-4 w-4" />
            Print All Plans
          </Button>
        </div>
      </div>

      {/* Global Approval Alert */}
      {pendingApprovals > 0 && <Card className="border-orange-200 bg-orange-50">
          <CardContent className="pt-6">
            <div className="flex items-start gap-4">
              <div className="p-2 bg-orange-100 rounded-full">
                <AlertCircle className="h-5 w-5 text-orange-600" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-orange-800 mb-1">
                  Care Plan{pendingApprovals > 1 ? 's' : ''} Approval Required
                </h3>
                <p className="text-sm text-orange-700 mb-3">
                  You have {pendingApprovals} care plan{pendingApprovals > 1 ? 's' : ''} that require{pendingApprovals === 1 ? 's' : ''} your review and approval. 
                  Please review each plan below and provide your digital signature.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>}

      {/* Care Plans List */}
      <div className="space-y-4">
        {carePlans.map(carePlan => {
        // Add data enhancer for each care plan
        const enhanceCarePlanData = clientId && (
          <CarePlanDataEnhancer 
            key={`enhancer-${carePlan.id}`}
            carePlanId={carePlan.id} 
            clientId={clientId} 
          />
        );
        const requiresApproval = useCarePlanRequiresApproval(carePlan);
        const statusInfo = useCarePlanStatus(carePlan);
        const changeRequestInfo = useCarePlanHasChangeRequest(carePlan);
        return (
          <>
            {enhanceCarePlanData}
            <Card key={carePlan.id} className={`${requiresApproval ? 'border-orange-200 bg-orange-50/30' : 'border-gray-200'}`}>
              <CardHeader className="pb-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <CardTitle className="text-lg">{carePlan.title}</CardTitle>
                      <Badge variant={statusInfo.variant}>
                        {statusInfo.label}
                      </Badge>
                    </div>
                    <div className="space-y-1 text-sm text-gray-600">
                      <div>Care Provider: {carePlan.provider_name}</div>
                      <div>Plan ID: {carePlan.display_id}</div>
                      <div>Last updated: {new Date(carePlan.updated_at).toLocaleDateString()}</div>
                      {carePlan.client_acknowledged_at && <div className="text-green-600">
                          ✓ Approved by you on: {new Date(carePlan.client_acknowledged_at).toLocaleDateString()}
                        </div>}
                      {changeRequestInfo.hasRequest && (
                        <div className="text-amber-600">
                          <MessageSquare className="h-4 w-4 inline mr-1" />
                          Changes requested on: {new Date(changeRequestInfo.requestDate).toLocaleDateString()}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="pt-0">
                {/* Action Required Notice for Approval */}
                {requiresApproval && <div className="p-4 bg-orange-50 border border-orange-200 rounded-lg mb-6">
                    <div className="flex items-center gap-2 text-orange-800 mb-2">
                      <AlertCircle className="h-5 w-5" />
                      <span className="font-semibold">Your Approval Required</span>
                    </div>
                    <p className="text-sm text-orange-700 mb-3">
                      Your care team has prepared and approved this comprehensive care plan for you. Please review all sections, then click "Sign & Approve Care Plan" to provide your digital signature and approval.
                    </p>
                    <div className="text-xs text-orange-600 font-medium">
                      ✓ Plan reviewed by healthcare team  •  ⏳ Awaiting your signature
                    </div>
                  </div>}

                {/* Care Plan Summary Statistics */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium text-blue-800 text-sm">Goals</h4>
                      <FileText className="h-5 w-5 text-blue-600" />
                    </div>
                    <p className="text-2xl font-bold text-blue-900">{carePlan.goals?.length || 0}</p>
                    <p className="text-xs text-blue-600 mt-1">Active goals</p>
                  </div>
                  
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium text-green-800 text-sm">Medications</h4>
                      <FileText className="h-5 w-5 text-green-600" />
                    </div>
                    <p className="text-2xl font-bold text-green-900">{carePlan.medications?.length || 0}</p>
                    <p className="text-xs text-green-600 mt-1">Current medications</p>
                  </div>
                  
                  <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium text-purple-800 text-sm">Activities</h4>
                      <FileText className="h-5 w-5 text-purple-600" />
                    </div>
                    <p className="text-2xl font-bold text-purple-900">{carePlan.activities?.length || 0}</p>
                    <p className="text-xs text-purple-600 mt-1">Scheduled activities</p>
                  </div>
                  
                  <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium text-orange-800 text-sm">Risk Items</h4>
                      <AlertCircle className="h-5 w-5 text-orange-600" />
                    </div>
                    <p className="text-2xl font-bold text-orange-900">{carePlan.risk_assessments?.length || 0}</p>
                    <p className="text-xs text-orange-600 mt-1">Risk assessments</p>
                  </div>
                </div>

                {/* Next Review Date */}
                {carePlan.review_date && (
                  <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-6">
                    <div className="flex items-center gap-3">
                      <Clock className="h-5 w-5 text-gray-600" />
                      <div>
                        <p className="text-sm font-medium text-gray-900">Next Review Date</p>
                        <p className="text-sm text-gray-600">{new Date(carePlan.review_date).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex flex-col gap-3">
                  <Button 
                    variant="outline" 
                    size="lg"
                    className="w-full"
                    onClick={() => handleOpenViewDialog(carePlan)}
                  >
                    <FileText className="h-5 w-5 mr-2" />
                    View Details
                  </Button>
                  
                  {requiresApproval && (
                    <Button 
                      size="lg"
                      className="w-full bg-green-600 hover:bg-green-700"
                      onClick={() => handleOpenApprovalDialog(carePlan)}
                    >
                      <PenTool className="h-5 w-5 mr-2" />
                      Sign & Approve Care Plan
                    </Button>
                  )}
                  
                  {(requiresApproval || carePlan.status === 'approved' || carePlan.status === 'active') && (
                    <Button 
                      variant="outline" 
                      size="lg"
                      className={`w-full ${changeRequestInfo.hasRequest ? "border-amber-300 text-amber-700 hover:bg-amber-50" : ""}`}
                      onClick={() => handleOpenChangeRequestDialog(carePlan)}
                    >
                      <MessageSquare className="h-5 w-5 mr-2" />
                      {changeRequestInfo.hasRequest ? "Changes Requested" : "Need to Add Some Changes"}
                    </Button>
                  )}
                </div>

              </CardContent>
            </Card>
          </>
        );
        })}
      </div>

      {/* Approval Dialog */}
      {selectedCarePlan && <ClientCarePlanApprovalDialog open={approvalDialogOpen} onOpenChange={setApprovalDialogOpen} carePlan={selectedCarePlan} onApprove={handleApproveCarePlan} onReject={handleRejectCarePlan} isLoading={approveCarePlanMutation.isPending || rejectCarePlanMutation.isPending} />}

      {/* Change Request Dialog */}
      {selectedCarePlan && <ClientChangeRequestDialog 
        open={changeRequestDialogOpen}
        onOpenChange={setChangeRequestDialogOpen}
        onSubmitRequest={handleSubmitChangeRequest}
        carePlan={selectedCarePlan}
        isLoading={requestChangesMutation.isPending}
        hasExistingRequest={useCarePlanHasChangeRequest(selectedCarePlan).hasRequest}
        existingRequestDate={selectedCarePlan?.changes_requested_at ? new Date(selectedCarePlan.changes_requested_at).toLocaleDateString() : undefined}
        existingComments={selectedCarePlan?.change_request_comments}
      />}

      {/* View Details Dialog */}
      {selectedCarePlan && (
        <CarePlanViewDialog
          carePlanId={selectedCarePlan.id}
          open={viewDialogOpen}
          onOpenChange={setViewDialogOpen}
          context="client"
        />
      )}
    </div>;
};
export default ClientCarePlans;
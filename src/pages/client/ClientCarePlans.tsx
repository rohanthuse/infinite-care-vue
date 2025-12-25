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
        return <span className="text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300 px-2 py-1 rounded-full">Completed</span>;
      case "in-progress":
        return <span className="text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300 px-2 py-1 rounded-full">In Progress</span>;
      case "not-started":
        return <span className="text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300 px-2 py-1 rounded-full">Not Started</span>;
      default:
        return null;
    }
  };
  return <div className="space-y-6">
      {/* Summary Header */}
      <div className="-mx-4 sm:-mx-6 lg:-mx-8 px-4 sm:px-6 lg:px-8 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/50 dark:to-indigo-950/50 py-6 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold flex items-center text-gray-900 dark:text-gray-100">
              <FileText className="h-8 w-8 mr-3 text-blue-600" />
              Your Care Plans
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-2 text-sm">
              {carePlans.length} active plan{carePlans.length !== 1 ? 's' : ''}
              {pendingApprovals > 0 && (
                <span className="ml-2 inline-flex items-center gap-1.5 text-orange-600 font-semibold">
                  <AlertCircle className="h-4 w-4" />
                  {pendingApprovals} requiring approval
                </span>
              )}
            </p>
          </div>
          <Button variant="outline" onClick={handlePrintPlan} className="gap-2 bg-white hover:bg-gray-50">
            <Printer className="h-4 w-4" />
            Print All
          </Button>
        </div>
      </div>

      {/* Global Alert for Pending Approvals */}
      {pendingApprovals > 0 && (
        <div>
          <div>
            <Card className="border-2 border-orange-400 bg-gradient-to-r from-orange-50 to-amber-50 dark:from-orange-950/50 dark:to-amber-950/50 shadow-lg">
              <CardContent className="pt-5 pb-5">
                <div className="flex items-start gap-4">
                  <div className="p-2.5 bg-orange-500 rounded-full shadow-md">
                    <AlertCircle className="h-6 w-6 text-white" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-bold text-orange-900 dark:text-orange-200 mb-1.5 text-lg">
                      Action Required: Care Plan Approval
                    </h3>
                    <p className="text-sm text-orange-800 dark:text-orange-300 leading-relaxed">
                      {pendingApprovals} care plan{pendingApprovals > 1 ? 's need' : ' needs'} your review and digital signature.
                      Please review each plan thoroughly before approving.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

    {/* Care Plans List */}
    <div className="space-y-6">
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
        <Card 
          key={carePlan.id} 
            className={`
              transition-all duration-300 hover:shadow-xl
              border-2 rounded-xl overflow-hidden
              ${requiresApproval 
                ? 'border-orange-400 bg-gradient-to-br from-orange-50 to-orange-100/50 dark:from-orange-950/50 dark:to-orange-900/30' 
                : 'border-gray-200 dark:border-gray-700 bg-gradient-to-br from-white to-gray-50 dark:from-gray-900 dark:to-gray-800/50'
              }
            `}
        >
          <CardHeader className="relative pb-4 border-b-2">
            {/* Colored accent bar */}
            <div className={`absolute top-0 left-0 right-0 h-1 ${requiresApproval ? 'bg-gradient-to-r from-orange-400 to-orange-600' : 'bg-gradient-to-r from-blue-400 to-blue-600'}`} />
            
            <div className="pt-2">
              <div className="flex items-start justify-between gap-3 mb-4">
                <CardTitle className="text-lg font-bold text-gray-900 dark:text-gray-100 line-clamp-2 flex-1">
                  {carePlan.title}
                </CardTitle>
                <Badge variant={statusInfo.variant} className="text-xs font-semibold px-3 py-1 shrink-0">
                  {statusInfo.label}
                </Badge>
              </div>
              
              {/* Compact info grid */}
              <div className="space-y-1.5 text-xs text-gray-600 dark:text-gray-400">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-gray-700 dark:text-gray-300">Provider:</span>
                  <span className="truncate">{carePlan.provider_name}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-gray-700 dark:text-gray-300">Updated:</span>
                  <span>{new Date(carePlan.updated_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                </div>
                {carePlan.client_acknowledged_at && (
                  <div className="flex items-center gap-2 text-green-600">
                    <CheckCircle className="h-3.5 w-3.5" />
                    <span>Approved: {new Date(carePlan.client_acknowledged_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                  </div>
                )}
                {changeRequestInfo.hasRequest && (
                  <div className="flex items-center gap-2 text-amber-600">
                    <MessageSquare className="h-3.5 w-3.5" />
                    <span>Changes requested: {new Date(changeRequestInfo.requestDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                  </div>
                )}
              </div>
            </div>
          </CardHeader>

          <CardContent className="pt-4 space-y-4">
            {/* Action Required Notice */}
            {requiresApproval && (
              <div className="p-3 bg-orange-50 dark:bg-orange-950/50 border border-orange-200 dark:border-orange-800 rounded-md">
                <div className="flex items-center gap-2 text-orange-800 dark:text-orange-300 mb-1.5">
                  <AlertCircle className="h-4 w-4" />
                  <span className="font-semibold text-sm">Your Approval Required</span>
                </div>
                <p className="text-sm text-orange-700 dark:text-orange-400 mb-2">
                  Your care team has prepared this care plan. Please review and sign to approve.
                </p>
                <div className="text-xs text-orange-600 dark:text-orange-500 font-medium">
                  ✓ Healthcare team reviewed  •  ⏳ Awaiting your signature
                </div>
              </div>
            )}

            {/* Statistics with Icon-First Design */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              <div className="flex items-center gap-3 p-3 rounded-lg border border-blue-200 dark:border-blue-800 bg-blue-50/50 dark:bg-blue-950/50 hover:bg-blue-50 dark:hover:bg-blue-900/50 transition-colors">
                <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center shrink-0">
                  <FileText className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-blue-900 dark:text-blue-100">{carePlan.goals?.length || 0}</p>
                  <p className="text-xs text-blue-700 dark:text-blue-300 font-medium">Goals</p>
                </div>
              </div>
              
              <div className="flex items-center gap-3 p-3 rounded-lg border border-green-200 dark:border-green-800 bg-green-50/50 dark:bg-green-950/50 hover:bg-green-50 dark:hover:bg-green-900/50 transition-colors">
                <div className="w-10 h-10 rounded-full bg-green-100 dark:bg-green-900 flex items-center justify-center shrink-0">
                  <FileText className="h-5 w-5 text-green-600 dark:text-green-400" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-green-900 dark:text-green-100">{carePlan.medications?.length || 0}</p>
                  <p className="text-xs text-green-700 dark:text-green-300 font-medium">Meds</p>
                </div>
              </div>
              
              <div className="flex items-center gap-3 p-3 rounded-lg border border-purple-200 dark:border-purple-800 bg-purple-50/50 dark:bg-purple-950/50 hover:bg-purple-50 dark:hover:bg-purple-900/50 transition-colors">
                <div className="w-10 h-10 rounded-full bg-purple-100 dark:bg-purple-900 flex items-center justify-center shrink-0">
                  <FileText className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-purple-900 dark:text-purple-100">{carePlan.activities?.length || 0}</p>
                  <p className="text-xs text-purple-700 dark:text-purple-300 font-medium">Activities</p>
                </div>
              </div>
              
              <div className="flex items-center gap-3 p-3 rounded-lg border border-orange-200 dark:border-orange-800 bg-orange-50/50 dark:bg-orange-950/50 hover:bg-orange-50 dark:hover:bg-orange-900/50 transition-colors">
                <div className="w-10 h-10 rounded-full bg-orange-100 dark:bg-orange-900 flex items-center justify-center shrink-0">
                  <AlertCircle className="h-5 w-5 text-orange-600 dark:text-orange-400" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-orange-900 dark:text-orange-100">{carePlan.risk_assessments?.length || 0}</p>
                  <p className="text-xs text-orange-700 dark:text-orange-300 font-medium">Risks</p>
                </div>
              </div>
            </div>

            {/* Next Review Date */}
            {carePlan.review_date && (
              <div className="flex items-center gap-2 p-2.5 rounded-lg bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
                <Clock className="h-4 w-4 text-gray-600 dark:text-gray-400" />
                <div className="flex-1">
                  <span className="text-xs font-medium text-gray-700 dark:text-gray-300">Next Review: </span>
                  <span className="text-xs text-gray-900 dark:text-gray-100 font-semibold">
                    {new Date(carePlan.review_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                  </span>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex flex-col gap-2 pt-2">
              <Button
                variant="default"
                size="sm"
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold shadow-md hover:shadow-lg transition-all"
                onClick={() => handleOpenViewDialog(carePlan)}
              >
                <FileText className="h-4 w-4 mr-2" />
                View Full Details
              </Button>

              {requiresApproval && (
                <Button
                  size="sm"
                  className="w-full bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white font-semibold shadow-md hover:shadow-lg transition-all"
                  onClick={() => handleOpenApprovalDialog(carePlan)}
                >
                  <PenTool className="h-4 w-4 mr-2" />
                  Sign & Approve Now
                </Button>
              )}

              {(requiresApproval || carePlan.status === 'approved' || carePlan.status === 'active') && (
                <Button
                  variant="outline"
                  size="sm"
                  className={`w-full font-semibold transition-all ${changeRequestInfo.hasRequest ? "border-amber-400 bg-amber-50 text-amber-700 hover:bg-amber-100" : "hover:bg-gray-50"}`}
                  onClick={() => handleOpenChangeRequestDialog(carePlan)}
                >
                  <MessageSquare className="h-4 w-4 mr-2" />
                  {changeRequestInfo.hasRequest ? "View Changes" : "Request Changes"}
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

      {selectedCarePlan && (
        <CarePlanViewDialog
          carePlanId={selectedCarePlan.id}
          open={viewDialogOpen}
          onOpenChange={(next) => {
            setViewDialogOpen(next);
            if (!next) {
              setTimeout(() => setSelectedCarePlan(null), 250);
            }
          }}
          context="client"
        />
      )}
    </div>;
};
export default ClientCarePlans;
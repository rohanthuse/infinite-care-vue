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
import { useClientApproveCarePlan, useClientRejectCarePlan, useClientCarePlanStatus } from "@/hooks/useClientCarePlanApproval";
import { CarePlanStatusTracker } from "@/components/care-plan/CarePlanStatusTracker";
import { useSimpleClientAuth } from "@/hooks/useSimpleClientAuth";
import { CarePlanDataEnhancer } from "@/components/care/CarePlanDataEnhancer";

const ClientCarePlans = () => {
  console.log('[DEBUG] ClientCarePlans component starting');
  
  const { toast } = useToast();
  const [approvalDialogOpen, setApprovalDialogOpen] = useState(false);
  const [changeRequestDialogOpen, setChangeRequestDialogOpen] = useState(false);
  const [selectedCarePlan, setSelectedCarePlan] = useState<any>(null);
  const approveCarePlanMutation = useClientApproveCarePlan();
  const rejectCarePlanMutation = useClientRejectCarePlan();

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

  const handleSubmitChangeRequest = (comments: string) => {
    if (!selectedCarePlan) return;
    
    rejectCarePlanMutation.mutate(
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
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your care plans...</p>
        </div>
      </div>
    );
  }

  if (authError || !clientId) {
    return (
      <div className="text-center py-12">
        <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">Authentication Required</h3>
        <p className="text-gray-600">Please log in to view your care plans.</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">Error loading care plans</h3>
        <p className="text-gray-600">Unable to load your care plans. Please try refreshing the page.</p>
      </div>
    );
  }

  if (!carePlans || carePlans.length === 0) {
    return (
      <div className="text-center py-12">
        <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">No care plans found</h3>
        <p className="text-gray-600">You don't have any care plans at this time. Please contact your care provider if you believe this is an error.</p>
      </div>
    );
  }

  const handleApproveCarePlan = async (signatureData: string, comments: string) => {
    if (!selectedCarePlan) return;
    await approveCarePlanMutation.mutateAsync({
      carePlanId: selectedCarePlan.id,
      signatureData,
      comments
    });
    setApprovalDialogOpen(false);
    setSelectedCarePlan(null);
  };

  const handleRejectCarePlan = async (comments: string) => {
    if (!selectedCarePlan) return;
    await rejectCarePlanMutation.mutateAsync({
      carePlanId: selectedCarePlan.id,
      comments
    });
    setApprovalDialogOpen(false);
    setSelectedCarePlan(null);
  };

  const handleOpenApprovalDialog = (carePlan: any) => {
    setSelectedCarePlan(carePlan);
    setApprovalDialogOpen(true);
  };

  // Helper functions
  const requiresClientApproval = (carePlan: any) => {
    return (carePlan.status === 'pending_client_approval') || 
           (carePlan.status === 'approved' && !carePlan.client_acknowledged_at);
  };

  // Separate care plans into categories
  const pendingApprovalPlans = carePlans.filter(requiresClientApproval);
  const otherPlans = carePlans.filter(cp => !requiresClientApproval(cp));

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

  console.log('[DEBUG] About to render component');
  
  return (
    <div className="space-y-6">
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
              {pendingApprovalPlans.length > 0 && (
                <span className="text-orange-600 font-medium">
                  {' • '}{pendingApprovalPlans.length} requiring your approval
                </span>
              )}
            </p>
          </div>
          <Button variant="outline" onClick={handlePrintPlan} className="gap-2">
            <Printer className="h-4 w-4" />
            Print All Plans
          </Button>
        </div>
      </div>

      {/* Awaiting Your Approval Section */}
      {pendingApprovalPlans.length > 0 && (
        <div className="space-y-4">
          <Card className="border-orange-200 bg-gradient-to-r from-orange-50 to-red-50">
            <CardHeader className="pb-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-orange-100 rounded-full">
                  <PenTool className="h-5 w-5 text-orange-600" />
                </div>
                <div>
                  <CardTitle className="text-orange-800">Awaiting Your Approval</CardTitle>
                  <p className="text-sm text-orange-700 mt-1">
                    {pendingApprovalPlans.length} care plan{pendingApprovalPlans.length > 1 ? 's' : ''} ready for your review and signature
                  </p>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="space-y-3">
                {pendingApprovalPlans.map(carePlan => {
                  const statusInfo = useClientCarePlanStatus(carePlan);
                  return (
                    <div key={carePlan.id} className="bg-white border border-orange-200 rounded-lg p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h4 className="font-medium">{carePlan.title}</h4>
                            <Badge variant={statusInfo.variant}>{statusInfo.label}</Badge>
                          </div>
                          <p className="text-sm text-gray-600">Provider: {carePlan.provider_name}</p>
                        </div>
                        <div className="flex gap-2">
                          <Button onClick={() => handleOpenApprovalDialog(carePlan)} className="bg-green-600 hover:bg-green-700">
                            <PenTool className="h-4 w-4 mr-2" />
                            Review & Sign
                          </Button>
                          <Button 
                            variant="outline" 
                            onClick={() => handleOpenChangeRequestDialog(carePlan)}
                          >
                            <MessageSquare className="h-4 w-4 mr-2" />
                            Request Changes
                          </Button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Empty state for no pending approvals */}
      {pendingApprovalPlans.length === 0 && (
        <Card className="border-green-200 bg-green-50">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-2 bg-green-100 rounded-full">
                <CheckCircle className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <h3 className="font-semibold text-green-800 mb-1">All Set!</h3>
                <p className="text-sm text-green-700">
                  No care plans need your approval right now. Your care team is working on your plans or they're already active.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* All Care Plans */}
      {(otherPlans.length > 0 || pendingApprovalPlans.length > 0) && (
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">All Care Plans</h2>
          {carePlans.map(carePlan => {
            // Add data enhancer for each care plan
            const enhanceCarePlanData = clientId && (
              <CarePlanDataEnhancer 
                key={`enhancer-${carePlan.id}`}
                carePlanId={carePlan.id} 
                clientId={clientId} 
              />
            );
            const requiresApproval = requiresClientApproval(carePlan);
            const statusInfo = useClientCarePlanStatus(carePlan);
            const changeRequestInfo = { 
              hasRequest: !!(carePlan as any).changes_requested_at,
              requestDate: (carePlan as any).changes_requested_at 
            };
            
            return (
              <>
                {enhanceCarePlanData}
                <Card key={carePlan.id} className={`${requiresApproval ? 'border-orange-200 bg-orange-50/30' : 'border-gray-200'}`}>
                  <CardHeader className="pb-4">
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
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
                          {carePlan.client_acknowledged_at && (
                            <div className="text-green-600">
                              ✓ Approved by you on: {new Date(carePlan.client_acknowledged_at).toLocaleDateString()}
                            </div>
                          )}
                          {changeRequestInfo.hasRequest && (
                            <div className="text-amber-600">
                              <MessageSquare className="h-4 w-4 inline mr-1" />
                              Changes requested on: {new Date(changeRequestInfo.requestDate).toLocaleDateString()}
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="flex flex-col sm:flex-row gap-2">
                        {requiresApproval ? (
                          <>
                            <Button onClick={() => handleOpenApprovalDialog(carePlan)} className="bg-green-600 hover:bg-green-700">
                              <PenTool className="h-4 w-4 mr-2" />
                              Review & Sign
                            </Button>
                            <Button 
                              variant="outline" 
                              onClick={() => handleOpenChangeRequestDialog(carePlan)}
                              className={changeRequestInfo.hasRequest ? "border-amber-300 text-amber-700" : ""}
                            >
                              <MessageSquare className="h-4 w-4 mr-2" />
                              {changeRequestInfo.hasRequest ? "Changes Requested" : "Request Changes"}
                            </Button>
                          </>
                        ) : carePlan.status === 'approved' || carePlan.status === 'active' ? (
                          <Button 
                            variant="outline" 
                            onClick={() => handleOpenChangeRequestDialog(carePlan)}
                            className={changeRequestInfo.hasRequest ? "border-amber-300 text-amber-700" : ""}
                          >
                            <MessageSquare className="h-4 w-4 mr-2" />
                            {changeRequestInfo.hasRequest ? "Changes Requested" : "Request Changes"}
                          </Button>
                        ) : null}
                      </div>
                    </div>
                  </CardHeader>

                  <CardContent className="pt-0">
                    {/* Status Tracker */}
                    <div className="mb-4">
                      <CarePlanStatusTracker carePlan={carePlan} viewerType="client" />
                    </div>

                    {/* Action Required Notice for Approval */}
                    {requiresApproval && (
                      <div className="p-4 bg-orange-50 border border-orange-200 rounded-lg mb-4">
                        <div className="flex items-center gap-2 text-orange-800 mb-2">
                          <AlertCircle className="h-5 w-5" />
                          <span className="font-semibold">Your Approval Required</span>
                        </div>
                        <p className="text-sm text-orange-700 mb-3">
                          Your care team has prepared and approved this comprehensive care plan for you. Please review all sections below including goals, medications, and activities, then click "Review & Sign" to provide your digital signature and approval.
                        </p>
                        <div className="text-xs text-orange-600 font-medium">
                          ✓ Plan reviewed by healthcare team  •  ⏳ Awaiting your signature
                        </div>
                      </div>
                    )}

                    {/* Care Plan Summary */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-blue-600" />
                        <span className="text-sm">
                          Review: {carePlan.review_date ? new Date(carePlan.review_date).toLocaleDateString() : 'Not scheduled'}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <FileText className="h-4 w-4 text-green-600" />
                        <span className="text-sm">
                          Provider: {carePlan.provider_name || 'Not assigned'}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-purple-600" />
                        <span className="text-sm">
                          Status: {carePlan.status?.replace('_', ' ') || 'Unknown'}
                        </span>
                      </div>
                    </div>

                    {/* Goals Progress */}
                    {carePlan.goals_progress !== undefined && (
                      <div className="mb-4">
                        <Progress value={carePlan.goals_progress} className="h-2" />
                      </div>
                    )}

                    {/* Expandable Content */}
                    <Tabs defaultValue="summary" className="w-full">
                      <TabsList className="grid grid-cols-3 w-full mb-2">
                        <TabsTrigger value="summary">Summary</TabsTrigger>
                        <TabsTrigger value="goals">Goals ({carePlan.goals?.length || 0})</TabsTrigger>
                        <TabsTrigger value="medications">Medications ({carePlan.medications?.length || 0})</TabsTrigger>
                      </TabsList>
                      
                      <TabsContent value="summary" className="mt-4">
                        <div className="space-y-4">
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                              <h4 className="font-medium text-blue-800 text-sm">Goals & Activities</h4>
                              <p className="text-blue-600 text-xs">{carePlan.goals?.length || 0} goals • {carePlan.activities?.length || 0} activities</p>
                              {carePlan.goals_progress !== undefined && (
                                <div className="mt-2">
                                  <div className="flex items-center gap-2">
                                    <div className="flex-1 bg-blue-200 rounded-full h-1">
                                      <div 
                                        className="bg-blue-600 h-1 rounded-full" 
                                        style={{ width: `${carePlan.goals_progress}%` }}
                                      ></div>
                                    </div>
                                    <span className="text-xs text-blue-700">{carePlan.goals_progress}%</span>
                                  </div>
                                </div>
                              )}
                            </div>
                            <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                              <h4 className="font-medium text-green-800 text-sm">Medical Care</h4>
                              <p className="text-green-600 text-xs">{carePlan.medications?.length || 0} medications</p>
                              {carePlan.medical_info && Object.keys(carePlan.medical_info).length > 0 && (
                                <p className="text-green-600 text-xs mt-1">
                                  {carePlan.medical_info.conditions?.length || 0} conditions • 
                                  {carePlan.medical_info.allergies?.length || 0} allergies
                                </p>
                              )}
                            </div>
                          </div>
                        </div>
                      </TabsContent>

                      <TabsContent value="goals" className="mt-4">
                        <div className="space-y-3">
                          {carePlan.goals && carePlan.goals.length > 0 ? (
                            carePlan.goals.map((goal: any) => (
                              <div key={goal.id} className="border border-gray-200 rounded-lg p-4">
                                <div className="flex items-center justify-between mb-3">
                                  <h5 className="font-medium text-sm">{goal.description}</h5>
                                  {renderGoalStatus(goal.status)}
                                </div>
                                <div className="flex items-center gap-2 mb-2">
                                  <div className="flex-1">
                                    <Progress value={goal.progress || 0} className="h-2" />
                                  </div>
                                  <span className="text-xs font-medium">{goal.progress || 0}%</span>
                                </div>
                                {goal.notes && <p className="text-xs text-gray-600 mt-1">{goal.notes}</p>}
                              </div>
                            ))
                          ) : (
                            <p className="text-gray-500 text-sm">No goals defined for this care plan.</p>
                          )}
                        </div>
                      </TabsContent>

                      <TabsContent value="medications" className="mt-4">
                        <div className="space-y-3">
                          {carePlan.medications && carePlan.medications.length > 0 ? (
                            carePlan.medications.map((med: any) => (
                              <div key={med.id} className="border border-gray-200 rounded-lg p-4">
                                <div className="flex justify-between items-start mb-2">
                                  <div className="flex-1">
                                    <h5 className="font-medium text-sm">{med.name}</h5>
                                    <p className="text-xs text-gray-600 mt-1">{med.dosage} • {med.frequency}</p>
                                  </div>
                                  <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">
                                    {med.status}
                                  </span>
                                </div>
                                <div className="text-xs text-gray-500 mt-2">
                                  Start: {new Date(med.start_date).toLocaleDateString()}
                                  {med.end_date && <span> • End: {new Date(med.end_date).toLocaleDateString()}</span>}
                                </div>
                              </div>
                            ))
                          ) : (
                            <p className="text-gray-500 text-sm">No medications defined for this care plan.</p>
                          )}
                        </div>
                      </TabsContent>
                    </Tabs>
                  </CardContent>
                </Card>
              </>
            );
          })}
        </div>
      )}

      {/* Approval Dialog */}
      {selectedCarePlan && (
        <ClientCarePlanApprovalDialog 
          open={approvalDialogOpen} 
          onOpenChange={setApprovalDialogOpen} 
          carePlan={selectedCarePlan} 
          onApprove={handleApproveCarePlan} 
          onReject={handleRejectCarePlan} 
          isLoading={approveCarePlanMutation.isPending || rejectCarePlanMutation.isPending} 
        />
      )}

      {/* Change Request Dialog */}
      {selectedCarePlan && (
        <ClientChangeRequestDialog 
          open={changeRequestDialogOpen}
          onOpenChange={setChangeRequestDialogOpen}
          onSubmitRequest={handleSubmitChangeRequest}
          carePlan={selectedCarePlan}
          isLoading={rejectCarePlanMutation.isPending}
          hasExistingRequest={!!((selectedCarePlan as any)?.changes_requested_at)}
          existingRequestDate={(selectedCarePlan as any)?.changes_requested_at ? new Date((selectedCarePlan as any).changes_requested_at).toLocaleDateString() : undefined}
          existingComments={(selectedCarePlan as any)?.change_request_comments}
        />
      )}
    </div>
  );
};

export default ClientCarePlans;
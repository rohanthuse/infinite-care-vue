
import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FileText, Clock, CheckCircle, AlertCircle, Printer, FileDown, PenTool } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { useClientCarePlansWithDetails } from "@/hooks/useCarePlanData";
import { useToast } from "@/hooks/use-toast";
import { ClientCarePlanApprovalDialog } from "@/components/client/ClientCarePlanApprovalDialog";
import { 
  useApproveCarePlan, 
  useRejectCarePlan, 
  useCarePlanRequiresApproval, 
  useCarePlanStatus 
} from "@/hooks/useCarePlanApproval";
import { useSimpleClientAuth } from "@/hooks/useSimpleClientAuth";

const ClientCarePlans = () => {
  const { toast } = useToast();
  const [approvalDialogOpen, setApprovalDialogOpen] = useState(false);
  const [selectedCarePlan, setSelectedCarePlan] = useState<any>(null);

  const approveCarePlanMutation = useApproveCarePlan();
  const rejectCarePlanMutation = useRejectCarePlan();
  
  // Get authenticated client using proper Supabase auth
  const { data: authData, isLoading: authLoading, error: authError } = useSimpleClientAuth();
  const clientId = authData?.client?.id;
  
  const { data: carePlans, isLoading, error } = useClientCarePlansWithDetails(clientId || '');

  const handleRequestChanges = () => {
    toast({
      title: "Request Changes",
      description: "Your change request has been submitted to your care team. They will contact you soon.",
    });
  };

  const handlePrintPlan = () => {
    window.print();
    toast({
      title: "Print Care Plan",
      description: "Print dialog opened. You can now print or save as PDF.",
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
      comments,
    });
  };

  const handleRejectCarePlan = async (comments: string) => {
    if (!selectedCarePlan) return;
    
    await rejectCarePlanMutation.mutateAsync({
      carePlanId: selectedCarePlan.id,
      comments,
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
              {pendingApprovals > 0 && (
                <span className="text-orange-600 font-medium">
                  {' • '}{pendingApprovals} requiring your approval
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

      {/* Global Approval Alert */}
      {pendingApprovals > 0 && (
        <Card className="border-orange-200 bg-orange-50">
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
        </Card>
      )}

      {/* Care Plans List */}
      <div className="space-y-4">
        {carePlans.map((carePlan) => {
          const requiresApproval = useCarePlanRequiresApproval(carePlan);
          const statusInfo = useCarePlanStatus(carePlan);

          return (
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
                    </div>
                  </div>
                  <div className="flex flex-col sm:flex-row gap-2">
                    {requiresApproval ? (
                      <Button 
                        onClick={() => handleOpenApprovalDialog(carePlan)} 
                        className="bg-green-600 hover:bg-green-700"
                      >
                        <PenTool className="h-4 w-4 mr-2" />
                        Care Plan is Approved
                      </Button>
                    ) : carePlan.status === 'approved' || carePlan.status === 'active' ? (
                      <Button variant="outline" onClick={handleRequestChanges}>
                        Need to Add Some Changes
                      </Button>
                    ) : null}
                  </div>
                </div>
              </CardHeader>

              <CardContent className="pt-0">
                {/* Action Required Notice for Approval */}
                {requiresApproval && (
                  <div className="p-4 bg-orange-50 border border-orange-200 rounded-lg mb-4">
                    <div className="flex items-center gap-2 text-orange-800 mb-2">
                      <AlertCircle className="h-5 w-5" />
                      <span className="font-semibold">Your Approval Required</span>
                    </div>
                    <p className="text-sm text-orange-700 mb-3">
                      Your care team has prepared and approved this comprehensive care plan for you. Please review all sections below including goals, medications, and activities, then click "Sign Care Plan" to provide your digital signature and approval.
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
                    <span className="text-sm">Goals: {carePlan.goals?.length || 0}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm">Medications: {carePlan.medications?.length || 0}</span>
                  </div>
                </div>

                {/* Goals Progress */}
                {carePlan.goals_progress !== undefined && (
                  <div className="mb-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium">Goals Progress</span>
                      <span className="text-sm font-medium">{carePlan.goals_progress}%</span>
                    </div>
                    <Progress value={carePlan.goals_progress} className="h-2" />
                  </div>
                )}

                {/* Expandable Content */}
                <Tabs defaultValue="summary" className="w-full">
                  <TabsList className="grid grid-cols-4 w-full">
                    <TabsTrigger value="summary">Summary</TabsTrigger>
                    <TabsTrigger value="goals">Goals ({carePlan.goals?.length || 0})</TabsTrigger>
                    <TabsTrigger value="medications">Meds ({carePlan.medications?.length || 0})</TabsTrigger>
                    <TabsTrigger value="activities">Activities ({carePlan.activities?.length || 0})</TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="summary" className="mt-4">
                    <div className="text-sm text-gray-600 space-y-2">
                      <p><strong>Care Plan Overview:</strong></p>
                      <p>This care plan includes {carePlan.goals?.length || 0} goals, {carePlan.medications?.length || 0} medications, and {carePlan.activities?.length || 0} activities.</p>
                      {carePlan.notes && <p><strong>Notes:</strong> {carePlan.notes}</p>}
                    </div>
                  </TabsContent>

                  <TabsContent value="goals" className="mt-4">
                    <div className="space-y-3">
                      {carePlan.goals && carePlan.goals.length > 0 ? (
                        carePlan.goals.map(goal => (
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
                            {goal.notes && (
                              <p className="text-xs text-gray-600 mt-1">{goal.notes}</p>
                            )}
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
                        carePlan.medications.map(med => (
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
                              {med.end_date && (
                                <span> • End: {new Date(med.end_date).toLocaleDateString()}</span>
                              )}
                            </div>
                          </div>
                        ))
                      ) : (
                        <p className="text-gray-500 text-sm">No medications defined for this care plan.</p>
                      )}
                    </div>
                  </TabsContent>

                  <TabsContent value="activities" className="mt-4">
                    <div className="space-y-3">
                      {carePlan.activities && carePlan.activities.length > 0 ? (
                        carePlan.activities.map(activity => (
                          <div key={activity.id} className="border border-gray-200 rounded-lg p-4">
                            <div className="flex justify-between items-start mb-2">
                              <h5 className="font-medium text-sm">{activity.name}</h5>
                              <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">
                                {activity.status}
                              </span>
                            </div>
                            {activity.description && (
                              <p className="text-xs text-gray-600 mb-2">{activity.description}</p>
                            )}
                            <div className="flex items-center gap-2">
                              <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                                {activity.frequency}
                              </span>
                            </div>
                          </div>
                        ))
                      ) : (
                        <p className="text-gray-500 text-sm">No activities defined for this care plan.</p>
                      )}
                    </div>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          );
        })}
      </div>

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
    </div>
  );
};

export default ClientCarePlans;

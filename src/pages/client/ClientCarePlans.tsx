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
import { useApproveCarePlan, useRejectCarePlan, useCarePlanRequiresApproval, useCarePlanStatus } from "@/hooks/useCarePlanApproval";
import { useSimpleClientAuth } from "@/hooks/useSimpleClientAuth";
const ClientCarePlans = () => {
  const {
    toast
  } = useToast();
  const [approvalDialogOpen, setApprovalDialogOpen] = useState(false);
  const [selectedCarePlan, setSelectedCarePlan] = useState<any>(null);
  const approveCarePlanMutation = useApproveCarePlan();
  const rejectCarePlanMutation = useRejectCarePlan();

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
  const handleRequestChanges = () => {
    toast({
      title: "Request Changes",
      description: "Your change request has been submitted to your care team. They will contact you soon."
    });
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
        const requiresApproval = useCarePlanRequiresApproval(carePlan);
        const statusInfo = useCarePlanStatus(carePlan);
        return <Card key={carePlan.id} className={`${requiresApproval ? 'border-orange-200 bg-orange-50/30' : 'border-gray-200'}`}>
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
                      {carePlan.client_acknowledged_at && <div className="text-green-600">
                          ✓ Approved by you on: {new Date(carePlan.client_acknowledged_at).toLocaleDateString()}
                        </div>}
                    </div>
                  </div>
                  <div className="flex flex-col sm:flex-row gap-2">
                    {requiresApproval ? (
                      <>
                        <Button onClick={() => handleOpenApprovalDialog(carePlan)} className="bg-green-600 hover:bg-green-700">
                          <PenTool className="h-4 w-4 mr-2" />
                          Care Plan is Approved
                        </Button>
                        <Button variant="outline" onClick={handleRequestChanges}>
                          Need to Add Some Changes
                        </Button>
                      </>
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
                {requiresApproval && <div className="p-4 bg-orange-50 border border-orange-200 rounded-lg mb-4">
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
                  </div>}

                {/* Care Plan Summary */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-blue-600" />
                    <span className="text-sm">
                      Review: {carePlan.review_date ? new Date(carePlan.review_date).toLocaleDateString() : 'Not scheduled'}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    
                  </div>
                  <div className="flex items-center gap-2">
                    
                  </div>
                </div>

                {/* Goals Progress */}
                {carePlan.goals_progress !== undefined && <div className="mb-4">
                    
                    <Progress value={carePlan.goals_progress} className="h-2" />
                  </div>}

                {/* Expandable Content */}
                <Tabs defaultValue="summary" className="w-full">
                  <TabsList className="grid grid-cols-5 w-full mb-2">
                    <TabsTrigger value="summary">Summary</TabsTrigger>
                    <TabsTrigger value="goals">Goals ({carePlan.goals?.length || 0})</TabsTrigger>
                    <TabsTrigger value="medications">Medications ({carePlan.medications?.length || 0})</TabsTrigger>
                    <TabsTrigger value="activities">Activities ({carePlan.activities?.length || 0})</TabsTrigger>
                    <TabsTrigger value="personal">Personal</TabsTrigger>
                  </TabsList>
                  <TabsList className="grid grid-cols-5 w-full">
                    <TabsTrigger value="medical">Medical</TabsTrigger>
                    <TabsTrigger value="care">Personal Care</TabsTrigger>
                    <TabsTrigger value="dietary">Dietary</TabsTrigger>
                    <TabsTrigger value="services">Services ({(carePlan.service_plans?.length || 0) + (carePlan.service_actions?.length || 0)})</TabsTrigger>
                    <TabsTrigger value="safety">Safety & Risk ({(carePlan.risk_assessments?.length || 0) + (carePlan.equipment?.length || 0)})</TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="summary" className="mt-4">
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                          <h4 className="font-medium text-blue-800 text-sm">Goals & Activities</h4>
                          <p className="text-blue-600 text-xs">{carePlan.goals?.length || 0} goals • {carePlan.activities?.length || 0} activities</p>
                        </div>
                        <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                          <h4 className="font-medium text-green-800 text-sm">Medical Care</h4>
                          <p className="text-green-600 text-xs">{carePlan.medications?.length || 0} medications</p>
                        </div>
                        <div className="bg-purple-50 border border-purple-200 rounded-lg p-3">
                          <h4 className="font-medium text-purple-800 text-sm">Services</h4>
                          <p className="text-purple-600 text-xs">{(carePlan.service_plans?.length || 0) + (carePlan.service_actions?.length || 0)} service items</p>
                        </div>
                        <div className="bg-orange-50 border border-orange-200 rounded-lg p-3">
                          <h4 className="font-medium text-orange-800 text-sm">Safety</h4>
                          <p className="text-orange-600 text-xs">{carePlan.risk_assessments?.length || 0} risk assessments • {carePlan.equipment?.length || 0} equipment items</p>
                        </div>
                      </div>
                      {carePlan.notes && <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                          <h4 className="font-medium text-gray-800 text-sm mb-2">Care Plan Notes</h4>
                          <p className="text-gray-600 text-sm">{carePlan.notes}</p>
                        </div>}
                      {carePlan.documents && carePlan.documents.length > 0 && <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                          <h4 className="font-medium text-blue-800 text-sm mb-2">Documents ({carePlan.documents.length})</h4>
                          <div className="space-y-2">
                            {carePlan.documents.slice(0, 3).map((doc: any) => <div key={doc.id} className="flex items-center justify-between text-sm">
                                <span className="text-blue-600">{doc.document_name || doc.document_type}</span>
                                <span className={`px-2 py-1 rounded-full text-xs ${doc.consent_given ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                                  {doc.consent_given ? 'Signed' : 'Pending'}
                                </span>
                              </div>)}
                            {carePlan.documents.length > 3 && <p className="text-blue-600 text-xs">+ {carePlan.documents.length - 3} more documents</p>}
                          </div>
                        </div>}
                    </div>
                  </TabsContent>

                  <TabsContent value="goals" className="mt-4">
                    <div className="space-y-3">
                      {carePlan.goals && carePlan.goals.length > 0 ? carePlan.goals.map(goal => <div key={goal.id} className="border border-gray-200 rounded-lg p-4">
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
                          </div>) : <p className="text-gray-500 text-sm">No goals defined for this care plan.</p>}
                    </div>
                  </TabsContent>

                  <TabsContent value="medications" className="mt-4">
                    <div className="space-y-3">
                      {carePlan.medications && carePlan.medications.length > 0 ? carePlan.medications.map(med => <div key={med.id} className="border border-gray-200 rounded-lg p-4">
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
                          </div>) : <p className="text-gray-500 text-sm">No medications defined for this care plan.</p>}
                    </div>
                  </TabsContent>

                  <TabsContent value="activities" className="mt-4">
                    <div className="space-y-3">
                      {carePlan.activities && carePlan.activities.length > 0 ? carePlan.activities.map(activity => <div key={activity.id} className="border border-gray-200 rounded-lg p-4">
                            <div className="flex justify-between items-start mb-2">
                              <h5 className="font-medium text-sm">{activity.name}</h5>
                              <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">
                                {activity.status}
                              </span>
                            </div>
                            {activity.description && <p className="text-xs text-gray-600 mb-2">{activity.description}</p>}
                            <div className="flex items-center gap-2">
                              <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                                {activity.frequency}
                              </span>
                            </div>
                          </div>) : <p className="text-gray-500 text-sm">No activities defined for this care plan.</p>}
                    </div>
                  </TabsContent>

                  <TabsContent value="personal" className="mt-4">
                    <div className="space-y-4">
                      {carePlan.personal_info && Object.keys(carePlan.personal_info).length > 0 ? <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {carePlan.personal_info.emergency_contact_name && <div className="border border-gray-200 rounded-lg p-4">
                              <h5 className="font-medium text-sm mb-2">Emergency Contact</h5>
                              <p className="text-sm">{carePlan.personal_info.emergency_contact_name}</p>
                              {carePlan.personal_info.emergency_contact_phone && <p className="text-xs text-gray-600">Phone: {carePlan.personal_info.emergency_contact_phone}</p>}
                              {carePlan.personal_info.emergency_contact_relationship && <p className="text-xs text-gray-600">Relationship: {carePlan.personal_info.emergency_contact_relationship}</p>}
                            </div>}
                          {carePlan.personal_info.next_of_kin_name && <div className="border border-gray-200 rounded-lg p-4">
                              <h5 className="font-medium text-sm mb-2">Next of Kin</h5>
                              <p className="text-sm">{carePlan.personal_info.next_of_kin_name}</p>
                              {carePlan.personal_info.next_of_kin_phone && <p className="text-xs text-gray-600">Phone: {carePlan.personal_info.next_of_kin_phone}</p>}
                              {carePlan.personal_info.next_of_kin_relationship && <p className="text-xs text-gray-600">Relationship: {carePlan.personal_info.next_of_kin_relationship}</p>}
                            </div>}
                          {carePlan.personal_info.gp_name && <div className="border border-gray-200 rounded-lg p-4">
                              <h5 className="font-medium text-sm mb-2">GP Information</h5>
                              <p className="text-sm">{carePlan.personal_info.gp_name}</p>
                              {carePlan.personal_info.gp_practice && <p className="text-xs text-gray-600">Practice: {carePlan.personal_info.gp_practice}</p>}
                              {carePlan.personal_info.gp_phone && <p className="text-xs text-gray-600">Phone: {carePlan.personal_info.gp_phone}</p>}
                            </div>}
                          {carePlan.personal_info.communication_preferences && <div className="border border-gray-200 rounded-lg p-4">
                              <h5 className="font-medium text-sm mb-2">Communication Preferences</h5>
                              <p className="text-sm">{carePlan.personal_info.communication_preferences}</p>
                            </div>}
                        </div> : <p className="text-gray-500 text-sm">No personal information available for this care plan.</p>}
                    </div>
                  </TabsContent>

                  <TabsContent value="medical" className="mt-4">
                    <div className="space-y-4">
                      {carePlan.medical_info && Object.keys(carePlan.medical_info).length > 0 ? <div className="space-y-4">
                          {carePlan.medical_info.medical_conditions && Array.isArray(carePlan.medical_info.medical_conditions) && carePlan.medical_info.medical_conditions.length > 0 && <div className="border border-gray-200 rounded-lg p-4">
                              <h5 className="font-medium text-sm mb-2">Medical Conditions</h5>
                              <div className="space-y-2">
                                {carePlan.medical_info.medical_conditions.map((condition: any, index: number) => <div key={index} className="bg-gray-50 rounded p-2">
                                    <p className="text-sm font-medium">{condition.condition}</p>
                                    {condition.diagnosed_date && <p className="text-xs text-gray-600">Diagnosed: {condition.diagnosed_date}</p>}
                                    {condition.severity && <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full">
                                        {condition.severity}
                                      </span>}
                                  </div>)}
                              </div>
                            </div>}
                          
                          {carePlan.medical_info.allergies && Array.isArray(carePlan.medical_info.allergies) && carePlan.medical_info.allergies.length > 0 && <div className="border border-red-200 rounded-lg p-4 bg-red-50">
                              <h5 className="font-medium text-sm mb-2 text-red-800">Allergies & Reactions</h5>
                              <div className="space-y-2">
                                {carePlan.medical_info.allergies.map((allergy: any, index: number) => <div key={index} className="bg-white rounded p-2 border border-red-100">
                                    <p className="text-sm font-medium text-red-800">{allergy.allergen}</p>
                                    {allergy.reaction && <p className="text-xs text-red-600">Reaction: {allergy.reaction}</p>}
                                    {allergy.severity && <span className="text-xs bg-red-100 text-red-800 px-2 py-1 rounded-full">
                                        {allergy.severity}
                                      </span>}
                                  </div>)}
                              </div>
                            </div>}

                          {carePlan.medical_info.mobility_status && <div className="border border-gray-200 rounded-lg p-4">
                              <h5 className="font-medium text-sm mb-2">Mobility Status</h5>
                              <p className="text-sm">{carePlan.medical_info.mobility_status}</p>
                              {carePlan.medical_info.mobility_aids && <p className="text-xs text-gray-600 mt-1">Aids: {carePlan.medical_info.mobility_aids}</p>}
                            </div>}

                          {carePlan.medical_info.mental_health_status && <div className="border border-gray-200 rounded-lg p-4">
                              <h5 className="font-medium text-sm mb-2">Mental Health</h5>
                              <p className="text-sm">{carePlan.medical_info.mental_health_status}</p>
                            </div>}

                          {carePlan.dietary_requirements && Object.keys(carePlan.dietary_requirements).length > 0 && <div className="border border-gray-200 rounded-lg p-4">
                              <h5 className="font-medium text-sm mb-2">Dietary Requirements</h5>
                              {carePlan.dietary_requirements.dietary_restrictions && <p className="text-sm mb-1">Restrictions: {carePlan.dietary_requirements.dietary_restrictions}</p>}
                              {carePlan.dietary_requirements.food_allergies && <p className="text-sm mb-1">Food Allergies: {carePlan.dietary_requirements.food_allergies}</p>}
                              {carePlan.dietary_requirements.texture_preference && <p className="text-sm mb-1">Texture Preference: {carePlan.dietary_requirements.texture_preference}</p>}
                              {carePlan.dietary_requirements.nutritional_supplements && <p className="text-sm">Supplements: {carePlan.dietary_requirements.nutritional_supplements}</p>}
                            </div>}

                          {carePlan.risk_assessments && Array.isArray(carePlan.risk_assessments) && carePlan.risk_assessments.length > 0 && <div className="border border-yellow-200 rounded-lg p-4 bg-yellow-50">
                              <h5 className="font-medium text-sm mb-2 text-yellow-800">Risk Assessments</h5>
                              <div className="space-y-2">
                                {carePlan.risk_assessments.map((risk: any, index: number) => <div key={index} className="bg-white rounded p-2 border border-yellow-100">
                                    <p className="text-sm font-medium">{risk.risk_factor}</p>
                                    {risk.likelihood && <p className="text-xs text-gray-600">Likelihood: {risk.likelihood}</p>}
                                    {risk.mitigation_strategies && <p className="text-xs text-gray-600">Mitigation: {risk.mitigation_strategies}</p>}
                                  </div>)}
                              </div>
                            </div>}
                        </div> : <p className="text-gray-500 text-sm">No medical information available for this care plan.</p>}
                    </div>
                  </TabsContent>

                  <TabsContent value="care" className="mt-4">
                    <div className="space-y-4">
                      {carePlan.personal_care && Object.keys(carePlan.personal_care).length > 0 ? <div className="space-y-4">
                          {carePlan.personal_care.bathing_preferences && <div className="border border-gray-200 rounded-lg p-4">
                              <h5 className="font-medium text-sm mb-2">Bathing Preferences</h5>
                              <p className="text-sm">{carePlan.personal_care.bathing_preferences}</p>
                            </div>}
                          {carePlan.personal_care.assistance_level && <div className="border border-gray-200 rounded-lg p-4">
                              <h5 className="font-medium text-sm mb-2">Assistance Level</h5>
                              <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                                {carePlan.personal_care.assistance_level}
                              </span>
                            </div>}
                          {carePlan.personal_care.behavioral_notes && <div className="border border-gray-200 rounded-lg p-4">
                              <h5 className="font-medium text-sm mb-2">Behavioral Notes</h5>
                              <p className="text-sm">{carePlan.personal_care.behavioral_notes}</p>
                            </div>}
                          {carePlan.personal_care.comfort_measures && <div className="border border-gray-200 rounded-lg p-4">
                              <h5 className="font-medium text-sm mb-2">Comfort Measures</h5>
                              <p className="text-sm">{carePlan.personal_care.comfort_measures}</p>
                            </div>}
                        </div> : <p className="text-gray-500 text-sm">No personal care information available for this care plan.</p>}
                    </div>
                  </TabsContent>

                  <TabsContent value="dietary" className="mt-4">
                    <div className="space-y-4">
                      {carePlan.dietary_requirements && Object.keys(carePlan.dietary_requirements).length > 0 ? <div className="space-y-4">
                          {carePlan.dietary_requirements.dietary_restrictions && <div className="border border-gray-200 rounded-lg p-4">
                              <h5 className="font-medium text-sm mb-2">Dietary Restrictions</h5>
                              <p className="text-sm">{carePlan.dietary_requirements.dietary_restrictions}</p>
                            </div>}
                          {carePlan.dietary_requirements.food_allergies && <div className="border border-red-200 rounded-lg p-4 bg-red-50">
                              <h5 className="font-medium text-sm mb-2 text-red-800">Food Allergies</h5>
                              <p className="text-sm text-red-700">{carePlan.dietary_requirements.food_allergies}</p>
                            </div>}
                          {carePlan.dietary_requirements.food_preferences && <div className="border border-gray-200 rounded-lg p-4">
                              <h5 className="font-medium text-sm mb-2">Food Preferences</h5>
                              <p className="text-sm">{carePlan.dietary_requirements.food_preferences}</p>
                            </div>}
                          {carePlan.dietary_requirements.texture_preference && <div className="border border-gray-200 rounded-lg p-4">
                              <h5 className="font-medium text-sm mb-2">Texture Requirements</h5>
                              <p className="text-sm">{carePlan.dietary_requirements.texture_preference}</p>
                            </div>}
                          {carePlan.dietary_requirements.special_equipment && <div className="border border-gray-200 rounded-lg p-4">
                              <h5 className="font-medium text-sm mb-2">Special Equipment</h5>
                              <p className="text-sm">{carePlan.dietary_requirements.special_equipment}</p>
                            </div>}
                          {carePlan.dietary_requirements.nutritional_supplements && <div className="border border-gray-200 rounded-lg p-4">
                              <h5 className="font-medium text-sm mb-2">Nutritional Supplements</h5>
                              <p className="text-sm">{carePlan.dietary_requirements.nutritional_supplements}</p>
                            </div>}
                        </div> : <p className="text-gray-500 text-sm">No dietary requirements specified for this care plan.</p>}
                    </div>
                  </TabsContent>

                  <TabsContent value="services" className="mt-4">
                    <div className="space-y-4">
                      {/* Service Plans */}
                      {carePlan.service_plans && carePlan.service_plans.length > 0 && <div>
                          <h4 className="font-medium text-sm mb-3 text-purple-800">Service Plans ({carePlan.service_plans.length})</h4>
                          <div className="space-y-3">
                            {carePlan.service_plans.map((plan: any) => <div key={plan.id} className="border border-purple-200 rounded-lg p-4 bg-purple-50">
                                <div className="flex justify-between items-start mb-2">
                                  <h5 className="font-medium text-sm">{plan.service_name}</h5>
                                  <span className="text-xs bg-purple-100 text-purple-800 px-2 py-1 rounded-full">
                                    {plan.service_category}
                                  </span>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs text-gray-600">
                                  <p>Provider: {plan.provider_name}</p>
                                  <p>Frequency: {plan.frequency}</p>
                                  <p>Duration: {plan.duration}</p>
                                  <p>Start: {plan.start_date ? new Date(plan.start_date).toLocaleDateString() : 'Not specified'}</p>
                                </div>
                                {plan.goals && plan.goals.length > 0 && <div className="mt-2">
                                    <p className="text-xs font-medium text-gray-700">Goals:</p>
                                    <ul className="text-xs text-gray-600 list-disc list-inside">
                                      {plan.goals.map((goal: string, index: number) => <li key={index}>{goal}</li>)}
                                    </ul>
                                  </div>}
                                {plan.notes && <p className="text-xs text-gray-600 mt-2">{plan.notes}</p>}
                              </div>)}
                          </div>
                        </div>}

                      {/* Service Actions */}
                      {carePlan.service_actions && carePlan.service_actions.length > 0 && <div>
                          <h4 className="font-medium text-sm mb-3 text-blue-800">Service Actions ({carePlan.service_actions.length})</h4>
                          <div className="space-y-3">
                            {carePlan.service_actions.map((action: any) => <div key={action.id} className="border border-blue-200 rounded-lg p-4 bg-blue-50">
                                <div className="flex justify-between items-start mb-2">
                                  <h5 className="font-medium text-sm">{action.service_name}</h5>
                                  <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                                    {action.status}
                                  </span>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs text-gray-600">
                                  <p>Category: {action.service_category}</p>
                                  <p>Provider: {action.provider_name}</p>
                                  <p>Frequency: {action.frequency}</p>
                                  <p>Duration: {action.duration}</p>
                                </div>
                                {action.objectives && <div className="mt-2">
                                    <p className="text-xs font-medium text-gray-700">Objectives:</p>
                                    <p className="text-xs text-gray-600">{action.objectives}</p>
                                  </div>}
                                {action.schedule_notes && <p className="text-xs text-gray-600 mt-2">Schedule: {action.schedule_notes}</p>}
                              </div>)}
                          </div>
                        </div>}

                      {(!carePlan.service_plans || carePlan.service_plans.length === 0) && (!carePlan.service_actions || carePlan.service_actions.length === 0) && <p className="text-gray-500 text-sm">No services specified for this care plan.</p>}
                    </div>
                  </TabsContent>

                  <TabsContent value="safety" className="mt-4">
                    <div className="space-y-4">
                      {/* Risk Assessments */}
                      {carePlan.risk_assessments && carePlan.risk_assessments.length > 0 && <div>
                          <h4 className="font-medium text-sm mb-3 text-orange-800">Risk Assessments ({carePlan.risk_assessments.length})</h4>
                          <div className="space-y-3">
                            {carePlan.risk_assessments.map((risk: any) => <div key={risk.id} className="border border-orange-200 rounded-lg p-4 bg-orange-50">
                                <div className="flex justify-between items-start mb-2">
                                  <h5 className="font-medium text-sm">{risk.risk_type}</h5>
                                  <span className={`text-xs px-2 py-1 rounded-full ${risk.risk_level === 'high' ? 'bg-red-100 text-red-800' : risk.risk_level === 'medium' ? 'bg-yellow-100 text-yellow-800' : 'bg-green-100 text-green-800'}`}>
                                    {risk.risk_level} risk
                                  </span>
                                </div>
                                {risk.risk_factors && risk.risk_factors.length > 0 && <div className="mb-2">
                                    <p className="text-xs font-medium text-gray-700">Risk Factors:</p>
                                    <ul className="text-xs text-gray-600 list-disc list-inside">
                                      {risk.risk_factors.map((factor: string, index: number) => <li key={index}>{factor}</li>)}
                                    </ul>
                                  </div>}
                                {risk.mitigation_strategies && risk.mitigation_strategies.length > 0 && <div className="mb-2">
                                    <p className="text-xs font-medium text-gray-700">Mitigation Strategies:</p>
                                    <ul className="text-xs text-gray-600 list-disc list-inside">
                                      {risk.mitigation_strategies.map((strategy: string, index: number) => <li key={index}>{strategy}</li>)}
                                    </ul>
                                  </div>}
                                <div className="text-xs text-gray-500">
                                  Assessed: {risk.assessment_date ? new Date(risk.assessment_date).toLocaleDateString() : 'Not specified'}
                                  {risk.next_review_date && <span> • Next review: {new Date(risk.next_review_date).toLocaleDateString()}</span>}
                                </div>
                              </div>)}
                          </div>
                        </div>}

                      {/* Equipment */}
                      {carePlan.equipment && carePlan.equipment.length > 0 && <div>
                          <h4 className="font-medium text-sm mb-3 text-gray-800">Equipment ({carePlan.equipment.length})</h4>
                          <div className="space-y-3">
                            {carePlan.equipment.map((item: any) => <div key={item.id} className="border border-gray-200 rounded-lg p-4">
                                <div className="flex justify-between items-start mb-2">
                                  <h5 className="font-medium text-sm">{item.equipment_name}</h5>
                                  <span className="text-xs bg-gray-100 text-gray-800 px-2 py-1 rounded-full">
                                    {item.status}
                                  </span>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs text-gray-600">
                                  <p>Type: {item.equipment_type}</p>
                                  <p>Location: {item.location}</p>
                                  {item.manufacturer && <p>Manufacturer: {item.manufacturer}</p>}
                                  {item.model && <p>Model: {item.model}</p>}
                                  {item.serial_number && <p>Serial: {item.serial_number}</p>}
                                  {item.installation_date && <p>Installed: {new Date(item.installation_date).toLocaleDateString()}</p>}
                                </div>
                                {item.maintenance_schedule && <p className="text-xs text-gray-600 mt-2">Maintenance: {item.maintenance_schedule}</p>}
                                {item.next_maintenance && <p className="text-xs text-orange-600 mt-1">
                                    Next maintenance: {new Date(item.next_maintenance).toLocaleDateString()}
                                  </p>}
                              </div>)}
                          </div>
                        </div>}

                      {/* Documents Section in Safety Tab */}
                      {carePlan.documents && carePlan.documents.length > 0 && <div>
                          <h4 className="font-medium text-sm mb-3 text-blue-800">Documents & Consents ({carePlan.documents.length})</h4>
                          <div className="space-y-3">
                            {carePlan.documents.map((doc: any) => <div key={doc.id} className="border border-blue-200 rounded-lg p-4 bg-blue-50">
                                <div className="flex justify-between items-start mb-2">
                                  <h5 className="font-medium text-sm">{doc.document_name || doc.document_type}</h5>
                                  <span className={`text-xs px-2 py-1 rounded-full ${doc.consent_given ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                                    {doc.consent_given ? 'Signed' : 'Pending'}
                                  </span>
                                </div>
                                {doc.consent_date && <p className="text-xs text-gray-600">Signed on: {new Date(doc.consent_date).toLocaleDateString()}</p>}
                                {doc.witness_name && <p className="text-xs text-gray-600">Witnessed by: {doc.witness_name}</p>}
                                {doc.notes && <p className="text-xs text-gray-600 mt-1">{doc.notes}</p>}
                              </div>)}
                          </div>
                        </div>}

                      {(!carePlan.risk_assessments || carePlan.risk_assessments.length === 0) && (!carePlan.equipment || carePlan.equipment.length === 0) && (!carePlan.documents || carePlan.documents.length === 0) && <p className="text-gray-500 text-sm">No safety information or equipment specified for this care plan.</p>}
                    </div>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>;
      })}
      </div>

      {/* Approval Dialog */}
      {selectedCarePlan && <ClientCarePlanApprovalDialog open={approvalDialogOpen} onOpenChange={setApprovalDialogOpen} carePlan={selectedCarePlan} onApprove={handleApproveCarePlan} onReject={handleRejectCarePlan} isLoading={approveCarePlanMutation.isPending || rejectCarePlanMutation.isPending} />}
    </div>;
};
export default ClientCarePlans;
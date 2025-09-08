import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CarePlanWizardSidebar } from '@/components/clients/dialogs/wizard/CarePlanWizardSidebar';
import { Edit, FileText, Calendar, User, Target, Activity, Pill, Heart, Utensils, ShieldCheck, Clock, 
         Phone, MapPin, AlertTriangle, Briefcase, FileX, Settings, Info, 
         UserCheck, Stethoscope, Home, UtensilsCrossed, CheckCircle2, Download, UserX, 
         ClipboardCheck, Syringe, ListChecks } from 'lucide-react';
import { format } from 'date-fns';
import { useCarePlanData, CarePlanWithDetails } from '@/hooks/useCarePlanData';
import { useTenant } from '@/contexts/TenantContext';
import { useStaffApproveCarePlan, useStaffRejectCarePlan } from '@/hooks/useStaffCarePlanApproval';
import { useToast } from '@/hooks/use-toast';

interface CarePlanViewDialogProps {
  carePlanId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const viewSteps = [
  { id: 1, name: "Overview", description: "Care plan summary and details" },
  { id: 2, name: "Personal Information", description: "Client personal details" },
  { id: 3, name: "About Me", description: "Client preferences and background" },
  { id: 4, name: "General", description: "General preferences and safety notes" },
  { id: 5, name: "Hobbies", description: "Client hobbies and interests" },
  { id: 6, name: "Medical and Mental", description: "Health conditions and medications" },
  { id: 7, name: "Medication", description: "Medication management and calendar" },
  { id: 8, name: "Admin Medication", description: "Medication administration details" },
  { id: 9, name: "Goals", description: "Care goals and objectives" },
  { id: 10, name: "Activities", description: "Daily activities and routines" },
  { id: 11, name: "Personal Care", description: "Personal care requirements" },
  { id: 12, name: "Dietary", description: "Dietary needs and restrictions" },
  { id: 13, name: "Risk Assessments", description: "Safety and risk evaluations" },
  { id: 14, name: "Equipment", description: "Required equipment and aids" },
  { id: 15, name: "Service Plans", description: "Service delivery plans" },
  { id: 16, name: "Service Actions", description: "Specific service actions" },
  { id: 17, name: "Documents", description: "Supporting documents" },
  { id: 18, name: "Consent", description: "Consent and capacity assessment" },
  { id: 19, name: "Review Summary", description: "Complete care plan summary" },
];

export function CarePlanViewDialog({ carePlanId, open, onOpenChange }: CarePlanViewDialogProps) {
  const navigate = useNavigate();
  const { id: branchId, branchName } = useParams();
  const { tenantSlug } = useTenant();
  const [currentStep, setCurrentStep] = useState(1);
  const [showApprovalDialog, setShowApprovalDialog] = useState(false);
  const [approvalAction, setApprovalAction] = useState<'approve' | 'reject'>('approve');
  const [approvalComments, setApprovalComments] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');
  const { data: carePlan, isLoading } = useCarePlanData(carePlanId);
  const { toast } = useToast();
  
  const approveMutation = useStaffApproveCarePlan();
  const rejectMutation = useStaffRejectCarePlan();
  
  // Type assertion to access extended properties
  const carePlanWithDetails = carePlan as CarePlanWithDetails;

  // Helper functions for completion logic (adapted from wizard)
  const isNonEmptyString = (value: any): boolean => {
    return typeof value === 'string' && value.trim().length > 0;
  };

  const hasAnyValue = (obj: any): boolean => {
    if (!obj || typeof obj !== 'object' || Array.isArray(obj)) return false;
    
    return Object.values(obj).some(value => {
      if (typeof value === 'string') return value.trim().length > 0;
      if (typeof value === 'boolean') return value === true;
      if (Array.isArray(value)) return value.length > 0 && value.some(item => item && (typeof item === 'string' ? item.trim() : true));
      if (typeof value === 'object' && value !== null) return hasAnyValue(value);
      return value !== null && value !== undefined && value !== '';
    });
  };

  const hasPersonalInfo = (personalInfo: any): boolean => {
    if (!personalInfo || typeof personalInfo !== 'object') return false;
    
    const meaningfulFields = [
      'first_name', 'last_name', 'date_of_birth', 'gender', 'ethnicity',
      'nationality', 'language', 'religion', 'marital_status', 'address',
      'phone', 'email', 'emergency_contact_name', 'emergency_contact_phone',
      'gp_name', 'gp_address', 'gp_phone'
    ];
    
    return meaningfulFields.some(field => isNonEmptyString(personalInfo[field]));
  };

  const hasMedicalInfo = (medicalInfo: any): boolean => {
    if (!medicalInfo || typeof medicalInfo !== 'object') return false;
    
    if (Array.isArray(medicalInfo.physical_health_conditions) && medicalInfo.physical_health_conditions.length > 0) return true;
    if (Array.isArray(medicalInfo.mental_health_conditions) && medicalInfo.mental_health_conditions.length > 0) return true;
    if (medicalInfo.medication_manager?.medications && Array.isArray(medicalInfo.medication_manager.medications) && medicalInfo.medication_manager.medications.length > 0) return true;
    
    const medicalFields = ['allergies', 'current_medications', 'medical_history', 'service_band'];
    return medicalFields.some(field => isNonEmptyString(medicalInfo[field]));
  };

  const hasHobbiesInfo = (hobbies: any): boolean => {
    if (!hobbies || typeof hobbies !== 'object') return false;
    return Array.isArray(hobbies.selected_hobbies) && hobbies.selected_hobbies.length > 0;
  };

  const hasConsentInfo = (consent: any): boolean => {
    if (!consent || typeof consent !== 'object') return false;
    
    const consentFields = [
      'discuss_health_and_risks', 'medication_support_consent', 'care_plan_importance_understood',
      'share_info_with_professionals', 'regular_reviews_understood', 'may_need_capacity_assessment',
      'consent_to_care_and_support', 'consent_to_personal_care', 'consent_to_medication_administration',
      'consent_to_healthcare_professionals', 'consent_to_emergency_services', 'consent_to_data_sharing',
      'consent_to_care_plan_changes'
    ];
    
    const hasConsentAnswers = consentFields.some(field => consent[field] === 'yes' || consent[field] === 'no');
    const hasCapacityInfo = consent.has_capacity === true || consent.lacks_capacity === true;
    const textFields = ['typed_full_name', 'extra_information', 'capacity_notes', 'best_interest_notes'];
    const hasTextInfo = textFields.some(field => isNonEmptyString(consent[field]));
    
    return hasConsentAnswers || hasCapacityInfo || hasTextInfo;
  };

  const hasRiskAssessments = (data: any): boolean => {
    if (Array.isArray(data.risk_assessments) && data.risk_assessments.length > 0) return true;
    
    const riskObjects = [
      data.risk_equipment_dietary,
      data.risk_medication, 
      data.risk_dietary_food,
      data.risk_warning_instructions,
      data.risk_choking,
      data.risk_pressure_damage
    ];
    
    return riskObjects.some(riskObj => {
      if (!riskObj || typeof riskObj !== 'object') return false;
      
      return Object.values(riskObj).some(value => {
        if (typeof value === 'boolean') return value === true;
        if (typeof value === 'string') return value.trim().length > 0;
        if (Array.isArray(value)) return value.length > 0;
        return false;
      });
    });
  };

  // Calculate completed steps based on care plan data
  const getCompletedSteps = (): number[] => {
    if (!carePlanWithDetails) return [];
    
    const completedSteps: number[] = [];
    
    // Step 1: Overview - always completed if we have a care plan
    if (carePlanWithDetails.title || carePlanWithDetails.provider_name) completedSteps.push(1);
    
    // Step 2: Personal Information
    if (hasPersonalInfo(carePlanWithDetails.personal_info)) completedSteps.push(2);
    
    // Step 3: About Me
    if (hasAnyValue(carePlanWithDetails.about_me)) completedSteps.push(3);
    
    // Step 4: General
    if (hasAnyValue(carePlanWithDetails.general)) completedSteps.push(4);
    
    // Step 5: Hobbies
    if (hasHobbiesInfo(carePlanWithDetails.hobbies)) completedSteps.push(5);
    
    // Step 6: Medical and Mental
    if (hasMedicalInfo(carePlanWithDetails.medical_info)) completedSteps.push(6);
    
    // Step 7: Medication
    if (carePlanWithDetails.medical_info?.medication_manager?.medications && 
        Array.isArray(carePlanWithDetails.medical_info.medication_manager.medications) && 
        carePlanWithDetails.medical_info.medication_manager.medications.length > 0) completedSteps.push(7);
    
    // Step 8: Admin Medication
    if (carePlanWithDetails.medical_info?.medication_manager?.medications && 
        Array.isArray(carePlanWithDetails.medical_info.medication_manager.medications) && 
        carePlanWithDetails.medical_info.medication_manager.medications.some(med => 
          isNonEmptyString(med?.who_administers) || isNonEmptyString(med?.level) || isNonEmptyString(med?.instruction)
        )) completedSteps.push(8);
    
    // Step 9: Goals
    if (Array.isArray(carePlanWithDetails.goals) && carePlanWithDetails.goals.length > 0) completedSteps.push(9);
    
    // Step 10: Activities
    if (Array.isArray(carePlanWithDetails.activities) && carePlanWithDetails.activities.length > 0) completedSteps.push(10);
    
    // Step 11: Personal Care
    if (hasAnyValue(carePlanWithDetails.personal_care)) completedSteps.push(11);
    
    // Step 12: Dietary
    if (hasAnyValue(carePlanWithDetails.dietary_requirements)) completedSteps.push(12);
    
    // Step 13: Risk Assessments
    if (hasRiskAssessments(carePlanWithDetails)) completedSteps.push(13);
    
    // Step 14: Equipment
    if (carePlanWithDetails.equipment && (
        (Array.isArray(carePlanWithDetails.equipment) && carePlanWithDetails.equipment.length > 0) ||
        hasAnyValue(carePlanWithDetails.equipment)
      )) completedSteps.push(14);
    
    // Step 15: Service Plans
    if (Array.isArray(carePlanWithDetails.service_plans) && carePlanWithDetails.service_plans.length > 0) completedSteps.push(15);
    
    // Step 16: Service Actions
    if (Array.isArray(carePlanWithDetails.service_actions) && carePlanWithDetails.service_actions.length > 0) completedSteps.push(16);
    
    // Step 17: Documents
    if (Array.isArray(carePlanWithDetails.documents) && carePlanWithDetails.documents.length > 0) completedSteps.push(17);
    
    // Step 18: Consent
    if (hasConsentInfo(carePlanWithDetails.consent)) completedSteps.push(18);
    
    // Step 19: Review Summary - always available
    completedSteps.push(19);
    
    return completedSteps;
  };

  const completedSteps = getCompletedSteps();
  const completionPercentage = Math.round((completedSteps.length / viewSteps.length) * 100);

  const getStatusColor = (status: string) => {
    const colors = {
      active: 'bg-green-100 text-green-800 border-green-200',
      pending_approval: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      draft: 'bg-gray-100 text-gray-800 border-gray-200',
      completed: 'bg-blue-100 text-blue-800 border-blue-200',
      cancelled: 'bg-red-100 text-red-800 border-red-200'
    };
    return colors[status as keyof typeof colors] || colors.draft;
  };

  const handleEditToggle = () => {
    // Close the dialog and navigate to care tab to open edit wizard
    onOpenChange(false);
    if (branchId && branchName && carePlan?.client?.id) {
      const basePath = tenantSlug ? `/${tenantSlug}` : '';
      const encodedBranchName = encodeURIComponent(branchName);
      const careTabPath = `${basePath}/branch-dashboard/${branchId}/${encodedBranchName}/care-plan?editCarePlan=${carePlanId}&clientId=${carePlan.client.id}`;
      navigate(careTabPath);
    }
  };

  const handleExport = () => {
    // Export functionality - to be implemented
    console.log('Export care plan:', carePlanId);
  };

  const handleApprovalAction = (action: 'approve' | 'reject') => {
    setApprovalAction(action);
    setShowApprovalDialog(true);
    setApprovalComments('');
    setRejectionReason('');
  };

  const handleConfirmApproval = async () => {
    try {
      if (approvalAction === 'approve') {
        await approveMutation.mutateAsync({
          carePlanId,
          comments: approvalComments
        });
        toast({
          title: "Care plan approved",
          description: "The care plan has been approved and sent to the client for review.",
        });
      } else {
        await rejectMutation.mutateAsync({
          carePlanId,
          comments: approvalComments,
          reason: rejectionReason
        });
        toast({
          title: "Care plan rejected",
          description: "The care plan has been rejected and returned for changes.",
        });
      }
      setShowApprovalDialog(false);
      onOpenChange(false);
    } catch (error) {
      console.error('Error processing approval:', error);
    }
  };

  // Render step content based on current step
  const renderStepContent = () => {
    if (!carePlanWithDetails) return null;

    switch (currentStep) {
      case 1: // Overview
        return (
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Info className="h-5 w-5" />
                  Care Plan Overview
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Provider</label>
                    <p className="text-sm">
                      {carePlan.provider_name || (carePlan.staff ? `${carePlan.staff.first_name} ${carePlan.staff.last_name}` : 'Not assigned')}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Provider Type</label>
                    <p className="text-sm capitalize">{carePlan.staff_id ? 'Internal Staff' : 'External Provider'}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Start Date</label>
                    <p className="text-sm">
                      {carePlan.start_date ? format(new Date(carePlan.start_date), 'PPP') : 'Not set'}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">End Date</label>
                    <p className="text-sm">
                      {carePlan.end_date ? format(new Date(carePlan.end_date), 'PPP') : 'Not set'}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Review Date</label>
                    <p className="text-sm">
                      {carePlanWithDetails.review_date ? format(new Date(carePlanWithDetails.review_date), 'PPP') : 'Not scheduled'}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Created</label>
                    <p className="text-sm">
                      {format(new Date(carePlan.created_at), 'PPP')}
                    </p>
                  </div>
                </div>
                
                {carePlanWithDetails.notes && (
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Notes</label>
                    <p className="text-sm mt-1 p-3 bg-muted rounded-md">{carePlanWithDetails.notes}</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Client Approval & Signature Section */}
            {(carePlanWithDetails.client_acknowledged_at || carePlanWithDetails.client_signature_data) && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CheckCircle2 className="h-5 w-5 text-green-600" />
                    Client Approval & Signature
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {carePlanWithDetails.client_acknowledged_at && (
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">Approved On</label>
                        <p className="text-sm">
                          {format(new Date(carePlanWithDetails.client_acknowledged_at), 'PPP p')}
                        </p>
                      </div>
                    )}
                    {carePlanWithDetails.acknowledgment_method && (
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">Method</label>
                        <p className="text-sm capitalize">{carePlanWithDetails.acknowledgment_method}</p>
                      </div>
                    )}
                    {carePlanWithDetails.client_acknowledgment_ip && (
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">IP Address</label>
                        <p className="text-sm font-mono">{carePlanWithDetails.client_acknowledgment_ip}</p>
                      </div>
                    )}
                  </div>
                  
                  {carePlanWithDetails.client_comments && (
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Client Comments</label>
                      <p className="text-sm mt-1 p-3 bg-muted rounded-md">{carePlanWithDetails.client_comments}</p>
                    </div>
                  )}

                  {carePlanWithDetails.client_signature_data && (
                    <div>
                      <label className="text-sm font-medium text-muted-foreground mb-2 block">Digital Signature</label>
                      <div className="border rounded-lg p-4 bg-white">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs text-muted-foreground">Client's digital signature</span>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => {
                              const link = document.createElement('a');
                              link.href = carePlanWithDetails.client_signature_data;
                              link.download = `care-plan-signature-${carePlan.display_id}.png`;
                              link.click();
                            }}
                          >
                            <Download className="h-3 w-3 mr-1" />
                            Download
                          </Button>
                        </div>
                        <div className="flex justify-center">
                          <img 
                            src={carePlanWithDetails.client_signature_data} 
                            alt="Client signature"
                            className="max-h-24 max-w-full border rounded"
                            onError={(e) => {
                              e.currentTarget.style.display = 'none';
                              e.currentTarget.nextElementSibling?.classList.remove('hidden');
                            }}
                          />
                          <div className="hidden text-center text-muted-foreground text-xs p-4">
                            <UserX className="h-8 w-8 mx-auto mb-2" />
                            Signature could not be displayed
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </div>
        );

      case 2: // Personal Information
        return (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <UserCheck className="h-5 w-5" />
                Client Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {carePlanWithDetails.personal_info ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Name</label>
                    <p className="text-sm">
                      {carePlan.client ? `${carePlan.client.first_name} ${carePlan.client.last_name}` : 'Not available'}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Date of Birth</label>
                    <p className="text-sm">
                      {carePlanWithDetails.personal_info.date_of_birth ? format(new Date(carePlanWithDetails.personal_info.date_of_birth), 'PPP') : 'Not available'}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Phone</label>
                    <p className="text-sm">{carePlanWithDetails.personal_info.phone || 'Not available'}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Address</label>
                    <p className="text-sm">{carePlanWithDetails.personal_info.address || 'Not available'}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Emergency Contact</label>
                    <p className="text-sm">{carePlanWithDetails.personal_info.emergency_contact_name || 'Not available'}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Emergency Phone</label>
                    <p className="text-sm">{carePlanWithDetails.personal_info.emergency_contact_phone || 'Not available'}</p>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <UserCheck className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">No client information available</p>
                </div>
              )}
            </CardContent>
          </Card>
        );

      case 3: // About Me
        return (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                About Me
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {carePlanWithDetails.about_me && Object.keys(carePlanWithDetails.about_me).length > 0 ? (
                <div className="space-y-4">
                  {carePlanWithDetails.about_me.life_history && (
                    <div>
                      <label className="text-sm font-medium text-muted-foreground mb-2 block">Life History</label>
                      <p className="text-sm p-3 bg-muted rounded-md">{carePlanWithDetails.about_me.life_history}</p>
                    </div>
                  )}
                  
                  {carePlanWithDetails.about_me.personality_traits && (
                    <div>
                      <label className="text-sm font-medium text-muted-foreground mb-2 block">Personality Traits</label>
                      <p className="text-sm p-3 bg-muted rounded-md">{carePlanWithDetails.about_me.personality_traits}</p>
                    </div>
                  )}
                  
                  {carePlanWithDetails.about_me.communication_style && (
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Communication Style</label>
                      <p className="text-sm">{carePlanWithDetails.about_me.communication_style}</p>
                    </div>
                  )}
                  
                  {carePlanWithDetails.about_me.important_people && (
                    <div>
                      <label className="text-sm font-medium text-muted-foreground mb-2 block">Important People</label>
                      <p className="text-sm p-3 bg-muted rounded-md">{carePlanWithDetails.about_me.important_people}</p>
                    </div>
                  )}
                  
                  {carePlanWithDetails.about_me.meaningful_activities && (
                    <div>
                      <label className="text-sm font-medium text-muted-foreground mb-2 block">Meaningful Activities</label>
                      <p className="text-sm p-3 bg-muted rounded-md">{carePlanWithDetails.about_me.meaningful_activities}</p>
                    </div>
                  )}
                  
                  {carePlanWithDetails.about_me.what_is_most_important_to_me && (
                    <div>
                      <label className="text-sm font-medium text-muted-foreground mb-2 block">What is most important to me</label>
                      <p className="text-sm p-3 bg-muted rounded-md">{carePlanWithDetails.about_me.what_is_most_important_to_me}</p>
                    </div>
                  )}
                  
                  {carePlanWithDetails.about_me.how_to_communicate_with_me && (
                    <div>
                      <label className="text-sm font-medium text-muted-foreground mb-2 block">How to communicate with me</label>
                      <p className="text-sm p-3 bg-muted rounded-md">{carePlanWithDetails.about_me.how_to_communicate_with_me}</p>
                    </div>
                  )}
                  
                  {carePlanWithDetails.about_me.please_do && (
                    <div>
                      <label className="text-sm font-medium text-muted-foreground mb-2 block">Please do</label>
                      <p className="text-sm p-3 bg-muted rounded-md">{carePlanWithDetails.about_me.please_do}</p>
                    </div>
                  )}
                  
                  {carePlanWithDetails.about_me.please_dont && (
                    <div>
                      <label className="text-sm font-medium text-muted-foreground mb-2 block">Please don't</label>
                      <p className="text-sm p-3 bg-muted rounded-md">{carePlanWithDetails.about_me.please_dont}</p>
                    </div>
                  )}
                  
                  {carePlanWithDetails.about_me.my_wellness && (
                    <div>
                      <label className="text-sm font-medium text-muted-foreground mb-2 block">My wellness</label>
                      <p className="text-sm p-3 bg-muted rounded-md">{carePlanWithDetails.about_me.my_wellness}</p>
                    </div>
                  )}
                  
                  {carePlanWithDetails.about_me.how_and_when_to_support_me && (
                    <div>
                      <label className="text-sm font-medium text-muted-foreground mb-2 block">How and when to support me</label>
                      <p className="text-sm p-3 bg-muted rounded-md">{carePlanWithDetails.about_me.how_and_when_to_support_me}</p>
                    </div>
                  )}
                  
                  {carePlanWithDetails.about_me.also_worth_knowing_about_me && (
                    <div>
                      <label className="text-sm font-medium text-muted-foreground mb-2 block">Also worth knowing about me</label>
                      <p className="text-sm p-3 bg-muted rounded-md">{carePlanWithDetails.about_me.also_worth_knowing_about_me}</p>
                    </div>
                  )}
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {carePlanWithDetails.about_me.date && (
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">Date</label>
                        <p className="text-sm">{carePlanWithDetails.about_me.date}</p>
                      </div>
                    )}
                    
                    {carePlanWithDetails.about_me.time && (
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">Time</label>
                        <p className="text-sm">{carePlanWithDetails.about_me.time}</p>
                      </div>
                    )}
                    
                    {carePlanWithDetails.about_me.supported_to_write_this_by && (
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">Supported by</label>
                        <p className="text-sm">{carePlanWithDetails.about_me.supported_to_write_this_by}</p>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <User className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">No personal information available</p>
                </div>
              )}
            </CardContent>
          </Card>
        );

      case 18: // Consent
        return (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ClipboardCheck className="h-5 w-5" />
                Consent Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {carePlanWithDetails.consent && Object.keys(carePlanWithDetails.consent).length > 0 ? (
                <div className="space-y-4">
                  {Object.entries(carePlanWithDetails.consent).map(([key, value]) => (
                    <div key={key}>
                      <label className="text-sm font-medium text-muted-foreground mb-2 block">{key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}</label>
                      <p className="text-sm p-3 bg-muted rounded-md">{String(value)}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <ClipboardCheck className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">No consent information available</p>
                </div>
              )}
            </CardContent>
          </Card>
        );

      case 4: // General
        return (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                General Preferences
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {carePlanWithDetails.general && Object.keys(carePlanWithDetails.general).length > 0 ? (
                <div className="space-y-4">
                  {Object.entries(carePlanWithDetails.general).map(([key, value]) => {
                    if (!value) return null;
                    return (
                      <div key={key}>
                        <label className="text-sm font-medium text-muted-foreground mb-2 block">
                          {key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                        </label>
                        <p className="text-sm p-3 bg-muted rounded-md">{String(value)}</p>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Settings className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">No general preferences available</p>
                </div>
              )}
            </CardContent>
          </Card>
        );

      case 5: // Hobbies
        return (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Heart className="h-5 w-5" />
                Hobbies & Interests
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {carePlanWithDetails.hobbies && (carePlanWithDetails.hobbies.selected_hobbies?.length > 0 || Object.keys(carePlanWithDetails.hobbies).length > 0) ? (
                <div className="space-y-4">
                  {carePlanWithDetails.hobbies.selected_hobbies && carePlanWithDetails.hobbies.selected_hobbies.length > 0 && (
                    <div>
                      <label className="text-sm font-medium text-muted-foreground mb-2 block">Selected Hobbies</label>
                      <div className="flex flex-wrap gap-2">
                        {carePlanWithDetails.hobbies.selected_hobbies.map((hobby: string, index: number) => (
                          <Badge key={index} variant="secondary">{hobby}</Badge>
                        ))}
                      </div>
                    </div>
                  )}
                  {Object.entries(carePlanWithDetails.hobbies).filter(([key]) => key !== 'selected_hobbies').map(([key, value]) => {
                    if (!value) return null;
                    return (
                      <div key={key}>
                        <label className="text-sm font-medium text-muted-foreground mb-2 block">
                          {key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                        </label>
                        <p className="text-sm p-3 bg-muted rounded-md">{String(value)}</p>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Heart className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">No hobbies or interests recorded</p>
                </div>
              )}
            </CardContent>
          </Card>
        );

      case 6: // Medical and Mental
        return (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Stethoscope className="h-5 w-5" />
                Medical & Mental Health
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {carePlanWithDetails.medical_info && Object.keys(carePlanWithDetails.medical_info).length > 0 ? (
                <div className="space-y-4">
                  {carePlanWithDetails.medical_info.physical_health_conditions && carePlanWithDetails.medical_info.physical_health_conditions.length > 0 && (
                    <div>
                      <label className="text-sm font-medium text-muted-foreground mb-2 block">Physical Health Conditions</label>
                      <div className="flex flex-wrap gap-2">
                        {carePlanWithDetails.medical_info.physical_health_conditions.map((condition: string, index: number) => (
                          <Badge key={index} variant="outline" className="bg-red-50 text-red-700 border-red-200">{condition}</Badge>
                        ))}
                      </div>
                    </div>
                  )}
                  {carePlanWithDetails.medical_info.mental_health_conditions && carePlanWithDetails.medical_info.mental_health_conditions.length > 0 && (
                    <div>
                      <label className="text-sm font-medium text-muted-foreground mb-2 block">Mental Health Conditions</label>
                      <div className="flex flex-wrap gap-2">
                        {carePlanWithDetails.medical_info.mental_health_conditions.map((condition: string, index: number) => (
                          <Badge key={index} variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">{condition}</Badge>
                        ))}
                      </div>
                    </div>
                  )}
                  {Object.entries(carePlanWithDetails.medical_info).filter(([key]) => !['physical_health_conditions', 'mental_health_conditions', 'medication_manager'].includes(key)).map(([key, value]) => {
                    if (!value) return null;
                    return (
                      <div key={key}>
                        <label className="text-sm font-medium text-muted-foreground mb-2 block">
                          {key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                        </label>
                        <p className="text-sm p-3 bg-muted rounded-md">{String(value)}</p>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Stethoscope className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">No medical information available</p>
                </div>
              )}
            </CardContent>
          </Card>
        );

      case 7: // Medication
        return (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Pill className="h-5 w-5" />
                Medications
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {((carePlanWithDetails.medications && carePlanWithDetails.medications.length > 0) || 
                (carePlanWithDetails.medical_info?.medication_manager?.medications && carePlanWithDetails.medical_info.medication_manager.medications.length > 0)) ? (
                <div className="space-y-4">
                  {(carePlanWithDetails.medications || carePlanWithDetails.medical_info?.medication_manager?.medications || []).map((medication: any, index: number) => (
                    <div key={index} className="p-4 border rounded-lg">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="text-sm font-medium text-muted-foreground">Medication</label>
                          <p className="text-sm font-medium">{medication.name || medication.medication_name || 'Unknown medication'}</p>
                        </div>
                        <div>
                          <label className="text-sm font-medium text-muted-foreground">Dosage</label>
                          <p className="text-sm">{medication.dosage || 'Not specified'}</p>
                        </div>
                        <div>
                          <label className="text-sm font-medium text-muted-foreground">Frequency</label>
                          <p className="text-sm">{medication.frequency || 'Not specified'}</p>
                        </div>
                        <div>
                          <label className="text-sm font-medium text-muted-foreground">Status</label>
                          <Badge variant="outline" className={medication.status === 'active' ? 'bg-green-50 text-green-700 border-green-200' : 'bg-gray-50 text-gray-700 border-gray-200'}>
                            {medication.status || 'Active'}
                          </Badge>
                        </div>
                      </div>
                      {medication.instructions && (
                        <div className="mt-3">
                          <label className="text-sm font-medium text-muted-foreground mb-1 block">Instructions</label>
                          <p className="text-sm p-2 bg-muted rounded">{medication.instructions}</p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Pill className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">No medications recorded</p>
                </div>
              )}
            </CardContent>
          </Card>
        );

      case 8: // Admin Medication
        return (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Syringe className="h-5 w-5" />
                Medication Administration
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {((carePlanWithDetails.medications && carePlanWithDetails.medications.length > 0) || 
                (carePlanWithDetails.medical_info?.medication_manager?.medications && carePlanWithDetails.medical_info.medication_manager.medications.length > 0)) ? (
                <div className="space-y-4">
                  {(carePlanWithDetails.medications || carePlanWithDetails.medical_info?.medication_manager?.medications || []).map((medication: any, index: number) => (
                    <div key={index} className="p-4 border rounded-lg">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="text-sm font-medium text-muted-foreground">Medication</label>
                          <p className="text-sm font-medium">{medication.name || medication.medication_name || 'Unknown medication'}</p>
                        </div>
                        <div>
                          <label className="text-sm font-medium text-muted-foreground">Who Administers</label>
                          <p className="text-sm">{medication.who_administers || 'Not specified'}</p>
                        </div>
                        <div>
                          <label className="text-sm font-medium text-muted-foreground">Administration Level</label>
                          <p className="text-sm">{medication.level || 'Not specified'}</p>
                        </div>
                        <div>
                          <label className="text-sm font-medium text-muted-foreground">Times</label>
                          <p className="text-sm">{medication.times?.join(', ') || 'Not specified'}</p>
                        </div>
                      </div>
                      {medication.instruction && (
                        <div className="mt-3">
                          <label className="text-sm font-medium text-muted-foreground mb-1 block">Administration Instructions</label>
                          <p className="text-sm p-2 bg-muted rounded">{medication.instruction}</p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Syringe className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">No medication administration details available</p>
                </div>
              )}
            </CardContent>
          </Card>
        );

      case 9: // Goals
        return (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5" />
                Care Goals
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {carePlanWithDetails.goals && carePlanWithDetails.goals.length > 0 ? (
                <div className="space-y-4">
                  {carePlanWithDetails.goals.map((goal: any, index: number) => (
                    <div key={index} className="p-4 border rounded-lg">
                      <div className="flex items-start justify-between mb-2">
                        <h4 className="font-medium">{goal.description || goal.goal_description || `Goal ${index + 1}`}</h4>
                        <Badge variant="outline" className={goal.status === 'completed' ? 'bg-green-50 text-green-700 border-green-200' : 'bg-blue-50 text-blue-700 border-blue-200'}>
                          {goal.status || 'Active'}
                        </Badge>
                      </div>
                      {goal.progress !== undefined && (
                        <div className="mb-3">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-sm text-muted-foreground">Progress</span>
                            <span className="text-sm font-medium">{goal.progress}%</span>
                          </div>
                          <Progress value={goal.progress} className="h-2" />
                        </div>
                      )}
                      {goal.notes && (
                        <div className="mt-2">
                          <label className="text-sm font-medium text-muted-foreground mb-1 block">Notes</label>
                          <p className="text-sm p-2 bg-muted rounded">{goal.notes}</p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Target className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">No care goals defined</p>
                </div>
              )}
            </CardContent>
          </Card>
        );

      case 10: // Activities
        return (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5" />
                Care Activities
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {carePlanWithDetails.activities && carePlanWithDetails.activities.length > 0 ? (
                <div className="space-y-4">
                  {carePlanWithDetails.activities.map((activity: any, index: number) => (
                    <div key={index} className="p-4 border rounded-lg">
                      <div className="flex items-start justify-between mb-2">
                        <h4 className="font-medium">{activity.name || activity.activity_name || `Activity ${index + 1}`}</h4>
                        <Badge variant="outline" className={activity.status === 'active' ? 'bg-green-50 text-green-700 border-green-200' : 'bg-gray-50 text-gray-700 border-gray-200'}>
                          {activity.status || 'Active'}
                        </Badge>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="text-sm font-medium text-muted-foreground">Frequency</label>
                          <p className="text-sm">{activity.frequency || 'Not specified'}</p>
                        </div>
                        {activity.duration && (
                          <div>
                            <label className="text-sm font-medium text-muted-foreground">Duration</label>
                            <p className="text-sm">{activity.duration}</p>
                          </div>
                        )}
                      </div>
                      {activity.description && (
                        <div className="mt-3">
                          <label className="text-sm font-medium text-muted-foreground mb-1 block">Description</label>
                          <p className="text-sm p-2 bg-muted rounded">{activity.description}</p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Activity className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">No activities recorded</p>
                </div>
              )}
            </CardContent>
          </Card>
        );

      case 11: // Personal Care
        return (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Home className="h-5 w-5" />
                Personal Care
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {carePlanWithDetails.personal_care && Object.keys(carePlanWithDetails.personal_care).length > 0 ? (
                <div className="space-y-4">
                  {Object.entries(carePlanWithDetails.personal_care).map(([key, value]) => {
                    if (!value) return null;
                    return (
                      <div key={key}>
                        <label className="text-sm font-medium text-muted-foreground mb-2 block">
                          {key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                        </label>
                        <p className="text-sm p-3 bg-muted rounded-md">{String(value)}</p>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Home className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">No personal care information available</p>
                </div>
              )}
            </CardContent>
          </Card>
        );

      case 12: // Dietary
        return (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Utensils className="h-5 w-5" />
                Dietary Requirements
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {carePlanWithDetails.dietary_requirements && Object.keys(carePlanWithDetails.dietary_requirements).length > 0 ? (
                <div className="space-y-4">
                  {Object.entries(carePlanWithDetails.dietary_requirements).map(([key, value]) => {
                    if (!value) return null;
                    return (
                      <div key={key}>
                        <label className="text-sm font-medium text-muted-foreground mb-2 block">
                          {key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                        </label>
                        <p className="text-sm p-3 bg-muted rounded-md">{String(value)}</p>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Utensils className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">No dietary requirements specified</p>
                </div>
              )}
            </CardContent>
          </Card>
        );

      case 13: // Risk Assessments
        return (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ShieldCheck className="h-5 w-5" />
                Risk Assessments
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {carePlanWithDetails.risk_assessments && carePlanWithDetails.risk_assessments.length > 0 ? (
                <div className="space-y-4">
                  {carePlanWithDetails.risk_assessments.map((risk: any, index: number) => (
                    <div key={index} className="p-4 border rounded-lg">
                      <div className="flex items-start justify-between mb-2">
                        <h4 className="font-medium">{risk.risk_type || `Risk Assessment ${index + 1}`}</h4>
                        <Badge variant="outline" className={
                          risk.risk_level === 'high' ? 'bg-red-50 text-red-700 border-red-200' :
                          risk.risk_level === 'medium' ? 'bg-yellow-50 text-yellow-700 border-yellow-200' :
                          'bg-green-50 text-green-700 border-green-200'
                        }>
                          {risk.risk_level || 'Not specified'}
                        </Badge>
                      </div>
                      {risk.description && (
                        <div className="mb-3">
                          <label className="text-sm font-medium text-muted-foreground mb-1 block">Description</label>
                          <p className="text-sm p-2 bg-muted rounded">{risk.description}</p>
                        </div>
                      )}
                      {risk.mitigation && (
                        <div>
                          <label className="text-sm font-medium text-muted-foreground mb-1 block">Mitigation</label>
                          <p className="text-sm p-2 bg-muted rounded">{risk.mitigation}</p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <ShieldCheck className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">No risk assessments recorded</p>
                </div>
              )}
            </CardContent>
          </Card>
        );

      case 14: // Equipment
        return (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Equipment
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {carePlanWithDetails.equipment && carePlanWithDetails.equipment.length > 0 ? (
                <div className="space-y-4">
                  {carePlanWithDetails.equipment.map((item: any, index: number) => (
                    <div key={index} className="p-4 border rounded-lg">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="text-sm font-medium text-muted-foreground">Equipment</label>
                          <p className="text-sm font-medium">{item.equipment_name || item.name || `Equipment ${index + 1}`}</p>
                        </div>
                        <div>
                          <label className="text-sm font-medium text-muted-foreground">Type</label>
                          <p className="text-sm">{item.equipment_type || item.type || 'Not specified'}</p>
                        </div>
                        {item.location && (
                          <div>
                            <label className="text-sm font-medium text-muted-foreground">Location</label>
                            <p className="text-sm">{item.location}</p>
                          </div>
                        )}
                        {item.status && (
                          <div>
                            <label className="text-sm font-medium text-muted-foreground">Status</label>
                            <Badge variant="outline" className={item.status === 'active' ? 'bg-green-50 text-green-700 border-green-200' : 'bg-gray-50 text-gray-700 border-gray-200'}>
                              {item.status}
                            </Badge>
                          </div>
                        )}
                      </div>
                      {item.notes && (
                        <div className="mt-3">
                          <label className="text-sm font-medium text-muted-foreground mb-1 block">Notes</label>
                          <p className="text-sm p-2 bg-muted rounded">{item.notes}</p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Settings className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">No equipment recorded</p>
                </div>
              )}
            </CardContent>
          </Card>
        );

      case 15: // Service Plans
        return (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Briefcase className="h-5 w-5" />
                Service Plans
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {carePlanWithDetails.service_plans && carePlanWithDetails.service_plans.length > 0 ? (
                <div className="space-y-4">
                  {carePlanWithDetails.service_plans.map((plan: any, index: number) => (
                    <div key={index} className="p-4 border rounded-lg">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-3">
                        <div>
                          <label className="text-sm font-medium text-muted-foreground">Service</label>
                          <p className="text-sm font-medium">{plan.service_name || `Service Plan ${index + 1}`}</p>
                        </div>
                        <div>
                          <label className="text-sm font-medium text-muted-foreground">Category</label>
                          <p className="text-sm">{plan.service_category || 'Not specified'}</p>
                        </div>
                        <div>
                          <label className="text-sm font-medium text-muted-foreground">Provider</label>
                          <p className="text-sm">{plan.provider_name || 'Not specified'}</p>
                        </div>
                        <div>
                          <label className="text-sm font-medium text-muted-foreground">Frequency</label>
                          <p className="text-sm">{plan.frequency || 'Not specified'}</p>
                        </div>
                      </div>
                      {plan.goals && plan.goals.length > 0 && (
                        <div className="mb-3">
                          <label className="text-sm font-medium text-muted-foreground mb-2 block">Goals</label>
                          <div className="flex flex-wrap gap-2">
                            {plan.goals.map((goal: string, goalIndex: number) => (
                              <Badge key={goalIndex} variant="secondary">{goal}</Badge>
                            ))}
                          </div>
                        </div>
                      )}
                      {plan.notes && (
                        <div>
                          <label className="text-sm font-medium text-muted-foreground mb-1 block">Notes</label>
                          <p className="text-sm p-2 bg-muted rounded">{plan.notes}</p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Briefcase className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">No service plans defined</p>
                </div>
              )}
            </CardContent>
          </Card>
        );

      case 16: // Service Actions
        return (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ListChecks className="h-5 w-5" />
                Service Actions
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {carePlanWithDetails.service_actions && carePlanWithDetails.service_actions.length > 0 ? (
                <div className="space-y-4">
                  {carePlanWithDetails.service_actions.map((action: any, index: number) => (
                    <div key={index} className="p-4 border rounded-lg">
                      <div className="flex items-start justify-between mb-3">
                        <h4 className="font-medium">{action.service_name || `Service Action ${index + 1}`}</h4>
                        <Badge variant="outline" className={action.status === 'active' ? 'bg-green-50 text-green-700 border-green-200' : 'bg-gray-50 text-gray-700 border-gray-200'}>
                          {action.status || 'Active'}
                        </Badge>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="text-sm font-medium text-muted-foreground">Category</label>
                          <p className="text-sm">{action.service_category || 'Not specified'}</p>
                        </div>
                        <div>
                          <label className="text-sm font-medium text-muted-foreground">Provider</label>
                          <p className="text-sm">{action.provider_name || 'Not specified'}</p>
                        </div>
                        <div>
                          <label className="text-sm font-medium text-muted-foreground">Frequency</label>
                          <p className="text-sm">{action.frequency || 'Not specified'}</p>
                        </div>
                        <div>
                          <label className="text-sm font-medium text-muted-foreground">Duration</label>
                          <p className="text-sm">{action.duration || 'Not specified'}</p>
                        </div>
                      </div>
                      {action.objectives && (
                        <div className="mt-3">
                          <label className="text-sm font-medium text-muted-foreground mb-1 block">Objectives</label>
                          <p className="text-sm p-2 bg-muted rounded">{action.objectives}</p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <ListChecks className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">No service actions defined</p>
                </div>
              )}
            </CardContent>
          </Card>
        );

      case 17: // Documents
        return (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Documents
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {carePlanWithDetails.documents && carePlanWithDetails.documents.length > 0 ? (
                <div className="space-y-4">
                  {carePlanWithDetails.documents.map((doc: any, index: number) => (
                    <div key={index} className="p-4 border rounded-lg">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <h4 className="font-medium">{doc.name || doc.file_name || `Document ${index + 1}`}</h4>
                          <p className="text-sm text-muted-foreground">{doc.type || doc.file_type || 'Unknown type'}</p>
                        </div>
                        <Badge variant="outline">
                          {doc.category || 'General'}
                        </Badge>
                      </div>
                      {doc.description && (
                        <div className="mt-2">
                          <label className="text-sm font-medium text-muted-foreground mb-1 block">Description</label>
                          <p className="text-sm p-2 bg-muted rounded">{doc.description}</p>
                        </div>
                      )}
                      {doc.created_at && (
                        <div className="mt-2">
                          <label className="text-sm font-medium text-muted-foreground">Upload Date</label>
                          <p className="text-sm">{format(new Date(doc.created_at), 'PPP')}</p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">No documents available</p>
                </div>
              )}
            </CardContent>
          </Card>
        );

      case 19: // Review Summary
        return (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5" />
                Care Plan Summary
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {viewSteps.slice(0, -1).map((step) => (
                  <div key={step.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <div className="font-medium text-sm">{step.name}</div>
                      <div className="text-xs text-muted-foreground">{step.description}</div>
                    </div>
                    {completedSteps.includes(step.id) ? (
                      <Badge variant="default" className="bg-green-100 text-green-800">
                        Complete
                      </Badge>
                    ) : (
                      <Badge variant="outline">
                        Empty
                      </Badge>
                    )}
                  </div>
                ))}
              </div>
              
              <div className="mt-6 p-4 bg-primary/10 rounded-lg border border-primary/20">
                <div className="flex items-center gap-2 mb-2">
                  <Progress value={completionPercentage} className="flex-1" />
                  <span className="text-sm font-medium">{completionPercentage}%</span>
                </div>
                <p className="text-sm text-primary">
                  {completedSteps.length} of {viewSteps.length - 1} sections completed
                </p>
              </div>
            </CardContent>
          </Card>
        );

      default:
        return (
          <div className="text-center py-8">
            <Info className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">Section content will be available soon</p>
          </div>
        );
    }
  };

  if (isLoading) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-4xl max-h-[90vh]">
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  if (!carePlan) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-4xl max-h-[90vh]">
          <div className="flex items-center justify-center h-64">
            <p className="text-muted-foreground">Care plan not found</p>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-7xl h-[95vh] flex flex-col p-0">
        <DialogHeader className="px-6 py-4 border-b flex-shrink-0">
          <div className="flex items-start justify-between">
            <div className="space-y-2">
              <DialogTitle className="text-2xl font-bold flex items-center gap-2">
                <FileText className="h-6 w-6" />
                {carePlan.title || `Care Plan - ${carePlan.client ? `${carePlan.client.first_name} ${carePlan.client.last_name}` : 'Unknown Client'}`}
              </DialogTitle>
              <div className="flex items-center gap-4 flex-wrap">
                <Badge className={getStatusColor(carePlan.status)}>
                  {carePlan.status?.replace('_', ' ').toUpperCase()}
                </Badge>
                <span className="text-sm text-muted-foreground">
                  ID: {carePlan.display_id}
                </span>
                {carePlanWithDetails.care_plan_type && (
                  <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                    {carePlanWithDetails.care_plan_type}
                  </Badge>
                )}
                {carePlan.priority && (
                  <Badge variant={carePlan.priority === "high" ? "destructive" : carePlan.priority === "medium" ? "default" : "secondary"}>
                    {carePlan.priority.toUpperCase()} PRIORITY
                  </Badge>
                )}
                {carePlanWithDetails.client_acknowledged_at && (
                  <Badge variant="default" className="bg-green-100 text-green-800 border-green-200">
                    <CheckCircle2 className="h-3 w-3 mr-1" />
                    Client Approved
                  </Badge>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={handleExport}>
                <FileText className="h-4 w-4 mr-2" />
                Export
              </Button>
              
              {carePlan.status === 'pending_approval' && (
                <>
                  <Button 
                    variant="default" 
                    size="sm" 
                    onClick={() => handleApprovalAction('approve')}
                    disabled={approveMutation.isPending}
                  >
                    <CheckCircle2 className="h-4 w-4 mr-2" />
                    Approve
                  </Button>
                  <Button 
                    variant="destructive" 
                    size="sm" 
                    onClick={() => handleApprovalAction('reject')}
                    disabled={rejectMutation.isPending}
                  >
                    <FileX className="h-4 w-4 mr-2" />
                    Request Changes
                  </Button>
                </>
              )}
              
              <Button 
                variant="default" 
                size="sm" 
                onClick={handleEditToggle}
              >
                <Edit className="h-4 w-4 mr-2" />
                Edit Plan
              </Button>
            </div>
          </div>
        </DialogHeader>

        <div className="flex flex-1 min-h-0">
          {/* Sidebar - Hidden on mobile, visible on lg+ */}
          <div className="hidden lg:block flex-shrink-0">
            <CarePlanWizardSidebar
              steps={viewSteps}
              currentStep={currentStep}
              completedSteps={completedSteps}
              onStepClick={setCurrentStep}
              completionPercentage={completionPercentage}
            />
          </div>

          {/* Main Content */}
          <div className="flex-1 flex flex-col min-h-0">
            {/* Mobile Step Selector */}
            <div className="lg:hidden p-4 border-b">
              <Select value={currentStep.toString()} onValueChange={(value) => setCurrentStep(parseInt(value))}>
                <SelectTrigger>
                  <SelectValue placeholder="Select section" />
                </SelectTrigger>
                <SelectContent>
                  {viewSteps.map((step) => (
                    <SelectItem key={step.id} value={step.id.toString()}>
                      <div className="flex items-center gap-2">
                        {completedSteps.includes(step.id) ? (
                          <CheckCircle2 className="h-3 w-3 text-green-600" />
                        ) : (
                          <div className="h-3 w-3 rounded-full border border-muted-foreground" />
                        )}
                        {step.name}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <ScrollArea className="flex-1 min-h-0">
              <div className="p-6">
                {renderStepContent()}
              </div>
            </ScrollArea>
          </div>
        </div>

        {/* Approval Dialog */}
        {showApprovalDialog && (
          <Dialog open={showApprovalDialog} onOpenChange={setShowApprovalDialog}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>
                  {approvalAction === 'approve' ? 'Approve Care Plan' : 'Request Changes'}
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                {approvalAction === 'reject' && (
                  <div>
                    <label className="text-sm font-medium">Reason for changes</label>
                    <Input
                      value={rejectionReason}
                      onChange={(e) => setRejectionReason(e.target.value)}
                      placeholder="Brief reason for requesting changes"
                    />
                  </div>
                )}
                <div>
                  <label className="text-sm font-medium">Comments (Optional)</label>
                  <Textarea
                    value={approvalComments}
                    onChange={(e) => setApprovalComments(e.target.value)}
                    placeholder="Additional comments..."
                    rows={3}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setShowApprovalDialog(false)}>
                  Cancel
                </Button>
                <Button 
                  onClick={handleConfirmApproval}
                  variant={approvalAction === 'approve' ? 'default' : 'destructive'}
                  disabled={approveMutation.isPending || rejectMutation.isPending}
                >
                  {approvalAction === 'approve' ? 'Approve' : 'Request Changes'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}
      </DialogContent>
    </Dialog>
  );
}

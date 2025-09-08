import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Progress } from '@/components/ui/progress';
import { Form } from '@/components/ui/form';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CarePlanWizardSidebar } from '@/components/clients/dialogs/wizard/CarePlanWizardSidebar';
import { CarePlanWizardSteps } from '@/components/clients/dialogs/wizard/CarePlanWizardSteps';
import { Edit, Download, CheckCircle2, UserX } from 'lucide-react';
import { format } from 'date-fns';
import { useCarePlanData, CarePlanWithDetails } from '@/hooks/useCarePlanData';
import { useTenant } from '@/contexts/TenantContext';
import { useStaffApproveCarePlan, useStaffRejectCarePlan } from '@/hooks/useStaffCarePlanApproval';
import { useToast } from '@/hooks/use-toast';

interface CarePlanViewDialogProps {
  carePlanId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  context?: 'staff' | 'client'; // Add context to control which actions to show
}

const viewSteps = [
  { id: 1, name: "Basic Information", description: "Care plan title and basic details" },
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
  { id: 19, name: "Review", description: "Review and finalize care plan" },
];

// Mapping function to convert care plan data to wizard form format
const mapCarePlanToWizardDefaults = (carePlan: CarePlanWithDetails) => {
  const safeArray = (value: any) => Array.isArray(value) ? value : [];
  const safeObject = (value: any) => (value && typeof value === 'object' && !Array.isArray(value)) ? value : {};
  const safeString = (value: any) => typeof value === 'string' ? value : '';

  return {
    title: safeString(carePlan.title),
    provider_name: safeString(carePlan.provider_name || carePlan.staff?.first_name + ' ' + carePlan.staff?.last_name),
    provider_type: carePlan.staff_id ? 'staff' : 'external',
    start_date: carePlan.start_date ? new Date(carePlan.start_date).toISOString().split('T')[0] : '',
    priority: carePlan.priority || 'medium',
    personal_info: {
      ...safeObject(carePlan.personal_info),
      first_name: safeString(carePlan.client?.first_name),
      last_name: safeString(carePlan.client?.last_name),
    },
    about_me: safeObject(carePlan.about_me),
    general: safeObject(carePlan.general),
    hobbies: { selected_hobbies: safeArray(carePlan.hobbies?.selected_hobbies) },
    medical_info: {
      ...safeObject(carePlan.medical_info),
      medication_manager: {
        medications: safeArray(carePlan.medical_info?.medication_manager?.medications),
      },
    },
    goals: safeArray(carePlan.goals),
    activities: safeArray(carePlan.activities),
    personal_care: safeObject(carePlan.personal_care),
    dietary: safeObject(carePlan.dietary_requirements),
    risk_assessments: safeArray(carePlan.risk_assessments),
    equipment: safeObject(carePlan.equipment),
    service_plans: safeArray(carePlan.service_plans),
    service_actions: safeArray(carePlan.service_actions),
    documents: safeArray(carePlan.documents),
    consent: safeObject(carePlan.consent),
    additional_notes: safeString(carePlan.notes),
  };
};

export function CarePlanViewDialog({ carePlanId, open, onOpenChange, context = 'staff' }: CarePlanViewDialogProps) {
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
  
  const carePlanWithDetails = carePlan as CarePlanWithDetails;

  // Initialize form with care plan data
  const form = useForm({ defaultValues: {} });

  // Update form when care plan data is loaded
  useEffect(() => {
    if (carePlanWithDetails && !isLoading) {
      const wizardDefaults = mapCarePlanToWizardDefaults(carePlanWithDetails);
      form.reset(wizardDefaults);
    }
  }, [carePlanWithDetails, isLoading, form]);

  const completedSteps = viewSteps.map(step => step.id); // All steps considered completed for viewing
  const completionPercentage = 100;

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
    onOpenChange(false);
    if (branchId && branchName && carePlan?.client?.id) {
      const basePath = tenantSlug ? `/${tenantSlug}` : '';
      const encodedBranchName = encodeURIComponent(branchName);
      const careTabPath = `${basePath}/branch-dashboard/${branchId}/${encodedBranchName}/care-plan?editCarePlan=${carePlanId}&clientId=${carePlan.client.id}`;
      navigate(careTabPath);
    }
  };

  const handleExport = () => {
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

  const renderStepContent = () => {
    if (!carePlanWithDetails) return null;

    return (
      <div className="[&_input]:pointer-events-none [&_input]:bg-muted/50 [&_textarea]:pointer-events-none [&_textarea]:bg-muted/50 [&_select]:pointer-events-none [&_button[role=combobox]]:pointer-events-none [&_button[role=combobox]]:bg-muted/50">
        <Form {...form}>
          <CarePlanWizardSteps 
            currentStep={currentStep} 
            form={form} 
            clientId={carePlanWithDetails.client_id} 
            effectiveCarePlanId={carePlanId}
          />
        </Form>
      </div>
    );
  };

  if (isLoading) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-7xl max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle>Loading Care Plan...</DialogTitle>
          </DialogHeader>
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
              <p className="text-sm text-muted-foreground">Loading care plan details...</p>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  if (!carePlanWithDetails) {
    return null;
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-7xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle>
                {carePlan.title || `Care Plan #${carePlan.display_id}`}
              </DialogTitle>
              <div className="flex items-center gap-2 mt-2">
                <Badge className={getStatusColor(carePlan.status)} variant="outline">
                  {carePlan.status?.replace('_', ' ')}
                </Badge>
                <span className="text-sm text-muted-foreground">
                  {carePlan.client ? `${carePlan.client.first_name} ${carePlan.client.last_name}` : 'Client not found'}
                </span>
              </div>
            </div>
            {context === 'staff' && (
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={handleExport}>
                  <Download className="h-4 w-4 mr-2" />
                  Export
                </Button>
                <Button variant="outline" size="sm" onClick={handleEditToggle}>
                  <Edit className="h-4 w-4 mr-2" />
                  Edit Plan
                </Button>
                {carePlan.status === 'pending_approval' && (
                  <>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => handleApprovalAction('reject')}
                      className="text-destructive border-destructive hover:bg-destructive hover:text-destructive-foreground"
                    >
                      <UserX className="h-4 w-4 mr-2" />
                      Request Changes
                    </Button>
                    <Button 
                      size="sm" 
                      onClick={() => handleApprovalAction('approve')}
                      className="bg-green-600 hover:bg-green-700 text-white"
                    >
                      <CheckCircle2 className="h-4 w-4 mr-2" />
                      Approve
                    </Button>
                  </>
                )}
              </div>
            )}
          </div>
          <div className="flex items-center gap-4 mt-4">
            <div className="flex-1">
              <div className="flex items-center justify-between text-sm mb-2">
                <span className="text-muted-foreground">Completion Progress</span>
                <span className="font-medium">{completionPercentage}%</span>
              </div>
              <Progress value={completionPercentage} className="h-2" />
            </div>
          </div>
        </DialogHeader>

        <div className="flex-1 flex min-h-0 gap-6">
          <div className="lg:hidden w-full">
            <ScrollArea className="h-full">
              <div className="p-4 space-y-6">
                {renderStepContent()}
              </div>
            </ScrollArea>
          </div>

          <div className="hidden lg:flex flex-1 min-h-0 gap-6">
            <div className="hidden lg:block flex-shrink-0">
              <CarePlanWizardSidebar
                steps={viewSteps}
                currentStep={currentStep}
                completedSteps={completedSteps}
                onStepClick={(stepId) => setCurrentStep(stepId)}
                completionPercentage={completionPercentage}
              />
            </div>

            <div className="flex-1 min-h-0 overflow-hidden">
              <ScrollArea className="h-full">
                <div className="p-6 space-y-6">
                  {renderStepContent()}
                </div>
              </ScrollArea>
            </div>
          </div>
        </div>
      </DialogContent>

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
                <label className="text-sm font-medium">Reason for rejection</label>
                <Select value={rejectionReason} onValueChange={setRejectionReason}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a reason" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="incomplete_information">Incomplete Information</SelectItem>
                    <SelectItem value="inaccurate_details">Inaccurate Details</SelectItem>
                    <SelectItem value="missing_signatures">Missing Signatures</SelectItem>
                    <SelectItem value="policy_violation">Policy Violation</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
            <div>
              <label className="text-sm font-medium">
                {approvalAction === 'approve' ? 'Approval comments (optional)' : 'Additional comments'}
              </label>
              <Textarea
                value={approvalComments}
                onChange={(e) => setApprovalComments(e.target.value)}
                placeholder={
                  approvalAction === 'approve' 
                    ? 'Add any comments about the approval...' 
                    : 'Provide specific details about what needs to be changed...'
                }
                rows={4}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowApprovalDialog(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleConfirmApproval}
              disabled={approveMutation.isPending || rejectMutation.isPending}
              className={approvalAction === 'approve' ? 'bg-green-600 hover:bg-green-700' : ''}
            >
              {(approveMutation.isPending || rejectMutation.isPending) && (
                <div className="animate-spin h-4 w-4 border-2 border-current border-t-transparent rounded-full mr-2" />
              )}
              {approvalAction === 'approve' ? 'Approve Plan' : 'Request Changes'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Dialog>
  );
}

export default CarePlanViewDialog;
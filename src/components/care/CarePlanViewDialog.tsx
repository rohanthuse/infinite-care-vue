import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { useQueryClient } from '@tanstack/react-query';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogOverlay, DialogPortal } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Progress } from '@/components/ui/progress';
import { Form } from '@/components/ui/form';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CarePlanWizardSidebar } from '@/components/clients/dialogs/wizard/CarePlanWizardSidebar';
import { CarePlanWizardSteps } from '@/components/clients/dialogs/wizard/CarePlanWizardSteps';
import { CarePlanCreationWizard } from '@/components/clients/dialogs/CarePlanCreationWizard';
import { Edit, Download, CheckCircle2, UserX, Activity } from 'lucide-react';
import { format } from 'date-fns';
import { useCarePlanData, CarePlanWithDetails } from '@/hooks/useCarePlanData';
import { useTenant } from '@/contexts/TenantContext';
import { useToast } from '@/hooks/use-toast';

import { generateCarePlanDetailPDF } from '@/services/enhancedPdfGenerator';

// Import client-friendly section components
import { BasicInfoSection } from '@/components/care/client-view/BasicInfoSection';
import { AboutMeSection } from '@/components/care/client-view/AboutMeSection';
import { MedicalSection } from '@/components/care/client-view/MedicalSection';
import { News2Section } from '@/components/care/client-view/News2Section';
import { MedicationSection } from '@/components/care/client-view/MedicationSection';
import { AdminMedicationSection } from '@/components/care/client-view/AdminMedicationSection';
import { GoalsSection } from '@/components/care/client-view/GoalsSection';
import { ActivitiesSection } from '@/components/care/client-view/ActivitiesSection';
import { PersonalCareSection } from '@/components/care/client-view/PersonalCareSection';
import { DietarySection } from '@/components/care/client-view/DietarySection';
import { RiskAssessmentSection } from '@/components/care/client-view/RiskAssessmentSection';
import { EquipmentSection } from '@/components/care/client-view/EquipmentSection';
import { ServicePlansSection } from '@/components/care/client-view/ServicePlansSection';
import { ServiceActionsSection } from '@/components/care/client-view/ServiceActionsSection';
import { DocumentsSection } from '@/components/care/client-view/DocumentsSection';
import { ConsentSection } from '@/components/care/client-view/ConsentSection';
import { KeyContactsSection } from '@/components/care/client-view/KeyContactsSection';
import { ReviewSection } from '@/components/care/client-view/ReviewSection';
import { BehaviorSupportSection } from '@/components/care/client-view/BehaviorSupportSection';
import { EducationDevelopmentSection } from '@/components/care/client-view/EducationDevelopmentSection';
import { SafeguardingRisksSection } from '@/components/care/client-view/SafeguardingRisksSection';

interface CarePlanViewDialogProps {
  carePlanId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  context?: 'staff' | 'client'; // Add context to control which actions to show
}

const viewSteps = [
  { id: 1, name: "Basic Information", description: "Care plan details and personal information", childOnly: false },
  { id: 2, name: "About Me", description: "Client preferences and background", childOnly: false },
  { id: 3, name: "Diagnosis", description: "Health conditions and medications", childOnly: false },
  { id: 4, name: "NEWS2 Health Monitoring", description: "Vital signs monitoring configuration", childOnly: false },
  { id: 5, name: "Medication Schedule", description: "Medication management and calendar", childOnly: false },
  { id: 6, name: "Medication", description: "Medication administration details", childOnly: false },
  { id: 7, name: "Goals", description: "Care goals and objectives", childOnly: false },
  { id: 8, name: "Activities", description: "Daily activities and routines", childOnly: false },
  { id: 9, name: "Personal Care", description: "Personal care requirements", childOnly: false },
  { id: 10, name: "Dietary", description: "Dietary needs and restrictions", childOnly: false },
  { id: 11, name: "Risk Assessments", description: "Safety and risk evaluations", childOnly: false },
  { id: 12, name: "Equipment", description: "Required equipment and aids", childOnly: false },
  { id: 13, name: "Service Plans", description: "Service delivery plans", childOnly: false },
  { id: 14, name: "Service Actions", description: "Specific service actions", childOnly: false },
  { id: 15, name: "Documents", description: "Supporting documents", childOnly: false },
  { id: 16, name: "Consent", description: "Consent and capacity assessment", childOnly: false },
  { id: 17, name: "Key Contacts", description: "Emergency and family contacts", childOnly: false },
  // Young Person (0-17 years) specific tabs
  { id: 18, name: "Behavior Support", description: "Challenging behaviors and crisis management", childOnly: true },
  { id: 19, name: "Education & Development", description: "Educational placement and development goals", childOnly: true },
  { id: 20, name: "Safeguarding & Risks", description: "Safeguarding assessments and risk plans", childOnly: true },
  // Review is always last
  { id: 21, name: "Review", description: "Review and finalize care plan", childOnly: false },
];

// Transform care plan data for PDF generation
const transformCarePlanForPDF = (carePlan: CarePlanWithDetails) => {
  const carePlanData = {
    title: carePlan.title || 'Untitled Care Plan',
    assignedTo: carePlan.provider_name || `${carePlan.staff?.first_name || ''} ${carePlan.staff?.last_name || ''}`.trim(),
    assignedToType: carePlan.staff_id ? 'Staff Member' : 'External Provider',
    status: carePlan.status || 'draft',
    dateCreated: carePlan.created_at ? new Date(carePlan.created_at) : new Date(),
    lastUpdated: carePlan.updated_at ? new Date(carePlan.updated_at) : new Date(),
    patientName: carePlan.client ? `${carePlan.client.first_name} ${carePlan.client.last_name}` : 'Unknown Patient'
  };

  const clientData = {
    clientProfile: {
      first_name: carePlan.client?.first_name || '',
      last_name: carePlan.client?.last_name || '',
      date_of_birth: carePlan.personal_info?.date_of_birth || '',
      address: carePlan.personal_info?.address || '',
      phone: carePlan.personal_info?.phone || '',
      email: carePlan.personal_info?.email || ''
    },
    medicalInfo: {
      allergies: carePlan.medical_info?.allergies || [],
      medical_conditions: carePlan.medical_info?.medical_conditions || [],
      current_medications: carePlan.medical_info?.medication_manager?.medications?.map(med => 
        `${med.name} - ${med.dosage}${med.frequency ? ' (' + med.frequency + ')' : ''}`
      ) || [],
      mobility_status: carePlan.medical_info?.mobility_status || '',
      communication_needs: carePlan.medical_info?.communication_needs || ''
    },
    personalCare: {
      personal_hygiene_needs: carePlan.personal_care?.personal_hygiene_needs || '',
      bathing_preferences: carePlan.personal_care?.bathing_preferences || '',
      dressing_assistance_level: carePlan.personal_care?.dressing_assistance_level || '',
      toileting_assistance_level: carePlan.personal_care?.toileting_assistance_level || '',
      sleep_patterns: carePlan.personal_care?.sleep_patterns || ''
    },
    dietaryRequirements: {
      dietary_restrictions: carePlan.dietary_requirements?.dietary_restrictions || [],
      food_allergies: carePlan.dietary_requirements?.food_allergies || [],
      food_preferences: carePlan.dietary_requirements?.food_preferences || [],
      nutritional_needs: carePlan.dietary_requirements?.nutritional_needs || '',
      supplements: carePlan.dietary_requirements?.supplements || []
    },
    riskAssessments: carePlan.risk_assessments || [],
    equipment: carePlan.equipment || [],
    serviceActions: carePlan.service_actions || [],
    assessments: [],
    goals: carePlan.goals || [],
    activities: carePlan.activities || [],
    aboutMe: carePlan.about_me || {},
    general: carePlan.general || {},
    consent: carePlan.consent || {},
    additionalNotes: (carePlan as any).additional_notes || (carePlan as any).review?.additional_notes || ''
  };

  return { carePlanData, clientData };
};

// Mapping function to convert care plan data to wizard form format
const mapCarePlanToWizardDefaults = (carePlan: CarePlanWithDetails) => {
  const safeArray = (value: any) => Array.isArray(value) ? value : [];
  const safeObject = (value: any) => (value && typeof value === 'object' && !Array.isArray(value)) ? value : {};
  const safeString = (value: any) => typeof value === 'string' ? value : '';
  const safeBool = (value: any) => typeof value === 'boolean' ? value : false;

  // Enhanced extraction from auto_save_data for comprehensive field mapping
  const autoSaveData = safeObject((carePlan as any).auto_save_data);
  
  return {
    // Basic Information - Enhanced with missing fields
    title: safeString(carePlan.title || autoSaveData.title),
    provider_name: safeString(carePlan.provider_name || carePlan.staff?.first_name + ' ' + carePlan.staff?.last_name || autoSaveData.provider_name),
    provider_type: carePlan.staff_id ? 'staff' : 'external',
    staff_id: carePlan.staff_id || autoSaveData.staff_id,
    start_date: carePlan.start_date ? new Date(carePlan.start_date).toISOString().split('T')[0] : (autoSaveData.start_date ? new Date(autoSaveData.start_date).toISOString().split('T')[0] : ''),
    end_date: carePlan.end_date ? new Date(carePlan.end_date).toISOString().split('T')[0] : (autoSaveData.end_date ? new Date(autoSaveData.end_date).toISOString().split('T')[0] : ''),
    review_date: carePlan.review_date ? new Date(carePlan.review_date).toISOString().split('T')[0] : (autoSaveData.review_date ? new Date(autoSaveData.review_date).toISOString().split('T')[0] : ''),
    priority: carePlan.priority || autoSaveData.priority || 'medium',
    care_plan_type: carePlan.care_plan_type || autoSaveData.care_plan_type || 'standard',
    
    // Personal Information
    personal_info: {
      ...safeObject(carePlan.personal_info),
      ...safeObject(autoSaveData.personal_info),
      first_name: safeString(carePlan.client?.first_name),
      last_name: safeString(carePlan.client?.last_name),
    },
    
    // About Me - preserve all fields as stored in database, no field remapping
    about_me: autoSaveData.about_me || carePlan.about_me || {},
    
    // Medical Info - Enhanced with admin medication and complex structures
    medical_info: {
      ...safeObject(carePlan.medical_info),
      ...safeObject(autoSaveData.medical_info),
      medication_manager: {
        medications: safeArray(carePlan.medications || carePlan.medical_info?.medication_manager?.medications || autoSaveData.medical_info?.medication_manager?.medications),
        ...safeObject(carePlan.medical_info?.medication_manager || autoSaveData.medical_info?.medication_manager),
      },
      admin_medication: {
        ...safeObject(carePlan.medical_info?.admin_medication || autoSaveData.medical_info?.admin_medication),
      },
    },
    
    // NEWS2 Monitoring
    news2_monitoring_enabled: (carePlan as any).news2_monitoring_enabled || autoSaveData.news2_monitoring_enabled || false,
    news2_monitoring_frequency: safeString((carePlan as any).news2_monitoring_frequency || autoSaveData.news2_monitoring_frequency) || 'daily',
    news2_monitoring_notes: safeString((carePlan as any).news2_monitoring_notes || autoSaveData.news2_monitoring_notes),
    
    // Goals and Activities
    goals: safeArray(carePlan.goals?.length > 0 ? carePlan.goals : autoSaveData.goals),
    activities: safeArray(carePlan.activities?.length > 0 ? carePlan.activities : autoSaveData.activities),
    
    // Medications
    medications: safeArray(carePlan.medications || autoSaveData.medications),
    
    // Admin Medication
    admin_medication: {
      admin_method: safeString(carePlan.medical_info?.admin_medication?.admin_method || autoSaveData.admin_medication?.admin_method),
      administration_times: safeArray(carePlan.medical_info?.admin_medication?.administration_times || autoSaveData.admin_medication?.administration_times),
      special_instructions: safeString(carePlan.medical_info?.admin_medication?.special_instructions || autoSaveData.admin_medication?.special_instructions),
      trained_staff_required: carePlan.medical_info?.admin_medication?.trained_staff_required || autoSaveData.admin_medication?.trained_staff_required || false,
      medication_storage: safeString(carePlan.medical_info?.admin_medication?.medication_storage || autoSaveData.admin_medication?.medication_storage),
      disposal_method: safeString(carePlan.medical_info?.admin_medication?.disposal_method || autoSaveData.admin_medication?.disposal_method),
      monitoring_requirements: safeString(carePlan.medical_info?.admin_medication?.monitoring_requirements || autoSaveData.admin_medication?.monitoring_requirements),
      side_effects_to_monitor: safeString(carePlan.medical_info?.admin_medication?.side_effects_to_monitor || autoSaveData.admin_medication?.side_effects_to_monitor),
      ...safeObject(carePlan.medical_info?.admin_medication || autoSaveData.admin_medication),
    },
    
    // Personal Care - Enhanced with detailed sleep and assistance fields
    personal_care: {
      ...safeObject(carePlan.personal_care),
      ...safeObject(autoSaveData.personal_care),
      // Sleep schedule fields
      sleep_go_to_bed_time: safeString(carePlan.personal_care?.sleep_go_to_bed_time || autoSaveData.personal_care?.sleep_go_to_bed_time),
      sleep_wake_up_time: safeString(carePlan.personal_care?.sleep_wake_up_time || autoSaveData.personal_care?.sleep_wake_up_time),
      sleep_get_out_of_bed_time: safeString(carePlan.personal_care?.sleep_get_out_of_bed_time || autoSaveData.personal_care?.sleep_get_out_of_bed_time),
      sleep_prepare_duration: safeString(carePlan.personal_care?.sleep_prepare_duration || autoSaveData.personal_care?.sleep_prepare_duration),
      // Assistance preferences
      assist_going_to_bed: safeBool(carePlan.personal_care?.assist_going_to_bed || autoSaveData.personal_care?.assist_going_to_bed),
      assist_getting_out_of_bed: safeBool(carePlan.personal_care?.assist_getting_out_of_bed || autoSaveData.personal_care?.assist_getting_out_of_bed),
      // Incontinence
      incontinence_products_required: safeBool(carePlan.personal_care?.incontinence_products_required || autoSaveData.personal_care?.incontinence_products_required),
      // Detailed care fields
      dressing_assistance_level: safeString(carePlan.personal_care?.dressing_assistance_level || autoSaveData.personal_care?.dressing_assistance_level),
      toileting_assistance_level: safeString(carePlan.personal_care?.toileting_assistance_level || autoSaveData.personal_care?.toileting_assistance_level),
      continence_status: safeString(carePlan.personal_care?.continence_status || autoSaveData.personal_care?.continence_status),
      bathing_preferences: safeString(carePlan.personal_care?.bathing_preferences || autoSaveData.personal_care?.bathing_preferences),
      personal_hygiene_needs: safeString(carePlan.personal_care?.personal_hygiene_needs || autoSaveData.personal_care?.personal_hygiene_needs),
      skin_care_needs: safeString(carePlan.personal_care?.skin_care_needs || autoSaveData.personal_care?.skin_care_needs),
      pain_management: safeString(carePlan.personal_care?.pain_management || autoSaveData.personal_care?.pain_management),
      comfort_measures: safeString(carePlan.personal_care?.comfort_measures || autoSaveData.personal_care?.comfort_measures),
      behavioral_notes: safeString(carePlan.personal_care?.behavioral_notes || autoSaveData.personal_care?.behavioral_notes),
    },
    
    // Dietary Requirements
    dietary: {
      ...safeObject(carePlan.dietary_requirements),
      ...safeObject(autoSaveData.dietary_requirements || autoSaveData.dietary),
    },
    
    // Risk Assessments - Enhanced with review dates and all fields
    risk_assessments: safeArray(carePlan.risk_assessments?.length > 0 ? carePlan.risk_assessments : autoSaveData.risk_assessments).map((assessment: any) => ({
      ...assessment,
      risk_type: assessment.risk_type || assessment.type || assessment.category,
      risk_level: assessment.risk_level || assessment.level,
      description: assessment.description || assessment.risk_description,
      mitigation_strategies: safeArray(assessment.mitigation_strategies || assessment.strategies || assessment.control_measures),
      review_date: assessment.review_date ? new Date(assessment.review_date).toISOString().split('T')[0] : '',
      assessed_by: assessment.assessed_by || assessment.reviewed_by || '',
      notes: assessment.notes || assessment.additional_notes || '',
      assessment_date: assessment.assessment_date ? new Date(assessment.assessment_date).toISOString().split('T')[0] : '',
    })),
    
    // Service Actions - Enhanced with all fields and dates
    service_actions: safeArray(carePlan.service_actions?.length > 0 ? carePlan.service_actions : autoSaveData.service_actions).map((action: any) => ({
      ...action,
      id: action.id || crypto.randomUUID(),
      action_type: action.action_type || 'new',
      action_name: action.action_name || action.action || action.name || action.action_description || '',
      has_instructions: action.has_instructions || false,
      instructions: action.instructions || action.schedule_details || '',
      required_written_outcome: action.required_written_outcome || false,
      written_outcome: action.written_outcome || '',
      is_service_specific: action.is_service_specific || false,
      linked_service_id: action.linked_service_id || '',
      linked_service_name: action.linked_service_name || '',
      start_date: action.start_date ? new Date(action.start_date).toISOString().split('T')[0] : '',
      end_date: action.end_date ? new Date(action.end_date).toISOString().split('T')[0] : '',
      schedule_type: action.schedule_type || 'shift',
      shift_times: action.shift_times || [],
      start_time: action.start_time || '',
      end_time: action.end_time || '',
      selected_days: action.selected_days || [],
      frequency: action.frequency || '',
      notes: action.notes || action.additional_notes || '',
      status: action.status || 'active',
      registered_on: action.registered_on,
      registered_by: action.registered_by,
      registered_by_name: action.registered_by_name || '',
      is_saved: true,
    })),
    
    // Equipment - Handle both old array and new object structure
    equipment: (() => {
      const equipData = carePlan.equipment || autoSaveData.equipment;
      
      // If already in new object format with equipment_blocks
      if (equipData && typeof equipData === 'object' && !Array.isArray(equipData) && equipData.equipment_blocks) {
        return equipData;
      }
      
      // If array format (old), convert to new structure
      if (Array.isArray(equipData)) {
        return {
          equipment_blocks: equipData.map((item: any) => ({
            ...item,
            equipment_name: item.equipment_name || item.name,
            equipment_type: item.equipment_type || item.type,
            quantity: item.quantity || 1,
            location: item.location || '',
            maintenance_required: item.maintenance_required || false,
            maintenance_schedule: item.maintenance_schedule || '',
            maintenance_notes: item.maintenance_notes || '',
            supplier: item.supplier || '',
            notes: item.notes || item.additional_notes || '',
          })),
          moving_handling: {},
          environment_checks: {},
          home_repairs: {}
        };
      }
      
      // Default empty structure
      return { equipment_blocks: [], moving_handling: {}, environment_checks: {}, home_repairs: {} };
    })(),
    
    // Service Plans - Enhanced with all required fields
    service_plans: safeArray(carePlan.service_plans?.length > 0 ? carePlan.service_plans : autoSaveData.service_plans).map((plan: any) => ({
      ...plan,
      id: plan.id || crypto.randomUUID(),
      caption: plan.caption || '',
      service_id: plan.service_id || '',
      service_name: plan.service_name || plan.name || '',
      authority: plan.authority || '',
      authority_category: plan.authority_category || '',
      start_date: plan.start_date ? new Date(plan.start_date).toISOString().split('T')[0] : '',
      end_date: plan.end_date ? new Date(plan.end_date).toISOString().split('T')[0] : '',
      start_time: plan.start_time || '',
      end_time: plan.end_time || '',
      selected_days: plan.selected_days || [],
      frequency: plan.frequency || '',
      location: plan.location || '',
      note: plan.note || plan.notes || plan.additional_notes || '',
      status: plan.status || 'active',
      registered_on: plan.registered_on,
      registered_by: plan.registered_by,
      registered_by_name: plan.registered_by_name || '',
      is_saved: true,
    })),
    
    // Documents
    documents: safeArray(carePlan.documents?.length > 0 ? carePlan.documents : autoSaveData.documents),
    
    // Consent
    consent: {
      ...safeObject(carePlan.consent),
      ...safeObject(autoSaveData.consent),
    },
    
    // Key Contacts - Use merged data from CarePlanWithDetails
    key_contacts: safeArray(carePlan.key_contacts || autoSaveData.key_contacts),
    
    // GP Information
    gp_info: {
      ...safeObject(autoSaveData.gp_info || (carePlan as any).gp_info),
    },
    
    // Pharmacy Information
    pharmacy_info: {
      ...safeObject(autoSaveData.pharmacy_info || (carePlan as any).pharmacy_info),
    },
    
    // Additional Notes
    additional_notes: safeString(carePlan.notes || autoSaveData.notes || autoSaveData.additional_notes),
  };
};

export function CarePlanViewDialog({ carePlanId, open, onOpenChange, context = 'staff' }: CarePlanViewDialogProps) {
  const navigate = useNavigate();
  const { id: branchId, branchName } = useParams();
  const { tenantSlug } = useTenant();
  const [currentStep, setCurrentStep] = useState(1);
  const [isOpeningWizard, setIsOpeningWizard] = useState(false);
  const { data: carePlan, isLoading } = useCarePlanData(carePlanId);
  const { toast } = useToast();
  
  const carePlanWithDetails = carePlan as CarePlanWithDetails;

  // Filter steps based on client age group (show child-specific tabs only for young persons)
  const filteredViewSteps = React.useMemo(() => {
    const clientAgeGroup = (carePlanWithDetails?.client as any)?.age_group;
    const isYoungPerson = clientAgeGroup === 'child' || clientAgeGroup === 'young_person';
    
    if (!isYoungPerson) {
      // Filter out child-only steps for adults
      return viewSteps.filter(step => !step.childOnly);
    }
    return viewSteps; // Show all steps for children/young persons
  }, [carePlanWithDetails?.client]);

  // Handle dialog close
  const handleClose = useCallback((newOpen: boolean) => {
    onOpenChange(newOpen);
  }, [onOpenChange]);

  // Initialize form with care plan data
  const form = useForm({ defaultValues: {} });

  // Update form when care plan data is loaded
  useEffect(() => {
    if (carePlanWithDetails && !isLoading) {
      const wizardDefaults = mapCarePlanToWizardDefaults(carePlanWithDetails);
      form.reset(wizardDefaults);
    }
  }, [carePlanWithDetails, isLoading, form]);

  const completedSteps = filteredViewSteps.map(step => step.id); // All steps considered completed for viewing
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

  const queryClient = useQueryClient();

  const handleEditToggle = async () => {
    console.log('[CarePlanViewDialog] Opening edit wizard for care plan:', carePlanId);
    
    // Force refresh care plan data before editing to ensure latest data
    await queryClient.invalidateQueries({ queryKey: ['care-plan', carePlanId] });
    await queryClient.invalidateQueries({ queryKey: ['care-plan-draft', carePlanId] });
    
    // Trigger wizard opening directly
    setIsOpeningWizard(true);
    
    // Close view dialog AFTER a brief delay to allow wizard to open
    setTimeout(() => {
      handleClose(false);
      
      // Navigate to care plan page if not already there (for URL consistency)
      if (branchId && branchName && carePlan?.client?.id) {
        const basePath = tenantSlug ? `/${tenantSlug}` : '';
        const encodedBranchName = encodeURIComponent(branchName);
        const careTabPath = `${basePath}/branch-dashboard/${branchId}/${encodedBranchName}/care-plan`;
        navigate(careTabPath, { replace: true }); // Use replace to avoid history stack issues
      }
    }, 100); // Brief delay ensures wizard mounting starts first
  };

  const { organization } = useTenant();

  const handleExport = () => {
    if (!carePlan) {
      toast({
        title: "Export Error",
        description: "No care plan data available to export.",
        variant: "destructive",
      });
      return;
    }

    try {
      const { carePlanData, clientData } = transformCarePlanForPDF(carePlan);
      
      // Pass organization data for PDF header
      const orgData = organization ? {
        name: organization.name,
        logo_url: organization.logo_url,
        address: organization.address,
        contact_email: organization.contact_email,
        contact_phone: organization.contact_phone
      } : undefined;
      
      generateCarePlanDetailPDF(carePlanData, clientData, branchName || "Branch", orgData);
      toast({
        title: "Export Successful",
        description: "Care plan has been exported to PDF successfully.",
      });
    } catch (error) {
      console.error('Error exporting care plan:', error);
      toast({
        title: "Export Failed",
        description: "Failed to export care plan. Please try again.",
        variant: "destructive",
      });
    }
  };

  // Render client-friendly content based on current step
  const renderClientFriendlyContent = () => {
    if (!carePlanWithDetails) return null;

    const wizardData = mapCarePlanToWizardDefaults(carePlanWithDetails);
    const medications = wizardData.medications || carePlanWithDetails.medications || [];

    // QA Logging: Track what data is available for current step
    if (context === 'client') {
      console.log(`[CarePlanView QA] Step ${currentStep}: ${filteredViewSteps.find(s => s.id === currentStep)?.name}`, {
        hasData: !!wizardData,
        dataKeys: Object.keys(wizardData),
        stepSpecificData: currentStep === 2 ? wizardData.about_me : 
                          currentStep === 3 ? wizardData.medical_info :
                          currentStep === 5 ? wizardData.admin_medication :
                          currentStep === 8 ? wizardData.personal_care :
                          currentStep === 9 ? wizardData.dietary :
                          currentStep === 15 ? wizardData.consent : 'see wizardData'
      });
    }

    switch (currentStep) {
      case 1: // Basic Information (includes GP & Pharmacy)
        return <BasicInfoSection carePlan={wizardData} />;
      
      case 2: // About Me
        return <AboutMeSection aboutMe={wizardData.about_me} />;
      
      case 3: // Diagnosis / Medical and Mental
        return (
          <MedicalSection 
            medicalInfo={wizardData.medical_info}
            news2MonitoringEnabled={wizardData.news2_monitoring_enabled}
            news2MonitoringFrequency={wizardData.news2_monitoring_frequency}
            news2MonitoringNotes={wizardData.news2_monitoring_notes}
          />
        );
      
      case 4: // NEWS2 Health Monitoring (NEW - separate step)
        return (
          <News2Section 
            enabled={wizardData.news2_monitoring_enabled}
            frequency={wizardData.news2_monitoring_frequency}
            notes={wizardData.news2_monitoring_notes}
          />
        );
      
      case 5: // Medication Schedule
        return <MedicationSection medications={medications} />;

      case 6: // Medication Administration
        return <AdminMedicationSection adminMedication={wizardData.admin_medication || wizardData.medical_info?.admin_medication} />;
      
      case 7: // Goals
        return <GoalsSection goals={wizardData.goals || []} />;
      
      case 8: // Activities
        return <ActivitiesSection activities={wizardData.activities || []} />;
      
      case 9: // Personal Care
        return <PersonalCareSection personalCare={wizardData.personal_care} />;
      
      case 10: // Dietary
        return <DietarySection dietary={wizardData.dietary} />;
      
      case 11: // Risk Assessments
        return <RiskAssessmentSection riskAssessments={wizardData.risk_assessments || []} />;
      
      case 12: // Equipment
        return <EquipmentSection equipment={wizardData.equipment || []} />;
      
      case 13: // Service Plans
        return <ServicePlansSection servicePlans={wizardData.service_plans || []} />;
      
      case 14: // Service Actions
        return <ServiceActionsSection serviceActions={wizardData.service_actions || []} />;
      
      case 15: // Documents
        return <DocumentsSection documents={wizardData.documents || []} />;
      
      case 16: // Consent
        return <ConsentSection consent={wizardData.consent} />;
      
      case 17: // Key Contacts (NEW)
        return <KeyContactsSection keyContacts={wizardData.key_contacts || []} />;
      
      // Young Person (0-17 years) specific tabs
      case 18: // Behavior Support
        return <BehaviorSupportSection clientId={carePlanWithDetails.client_id} />;
      
      case 19: // Education & Development
        return <EducationDevelopmentSection clientId={carePlanWithDetails.client_id} />;
      
      case 20: // Safeguarding & Risks
        return <SafeguardingRisksSection clientId={carePlanWithDetails.client_id} />;
      
      case 21: // Review
        return <ReviewSection 
          carePlan={carePlanWithDetails} 
          additionalNotes={wizardData.additional_notes} 
        />;
      
      default:
        return <div className="text-center text-muted-foreground">Section not found</div>;
    }
  };

  const renderStepContent = () => {
    if (!carePlanWithDetails) return null;

    // If client context, render client-friendly read-only view
    if (context === 'client') {
      return renderClientFriendlyContent();
    }

    // Enhanced read-only styles for staff context
    const readOnlyStyles = `[&_input]:pointer-events-none [&_input]:bg-muted/50 [&_input]:cursor-not-allowed
         [&_textarea]:pointer-events-none [&_textarea]:bg-muted/50 [&_textarea]:cursor-not-allowed
         [&_select]:pointer-events-none [&_button[role=combobox]]:pointer-events-none [&_button[role=combobox]]:bg-muted/50 [&_button[role=combobox]]:cursor-not-allowed
         [&_button:not(.sidebar-nav-button):not(.document-action-button):not(.service-view-button)]:pointer-events-none [&_button:not(.sidebar-nav-button):not(.document-action-button):not(.service-view-button)]:opacity-50 [&_button:not(.sidebar-nav-button):not(.document-action-button):not(.service-view-button)]:cursor-not-allowed`;

    return (
      <div 
        className={readOnlyStyles}
      >
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
      <Dialog open={open} onOpenChange={handleClose}>
        <DialogPortal>
          <DialogOverlay className="z-[60]" />
          <DialogContent className="z-[70] max-w-7xl max-h-[90vh] overflow-hidden flex flex-col">
            <DialogHeader>
              <DialogTitle>Loading Care Plan...</DialogTitle>
              <DialogDescription>
                Please wait while we fetch the care plan details.
              </DialogDescription>
            </DialogHeader>
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
                <p className="text-sm text-muted-foreground">Loading care plan details...</p>
              </div>
            </div>
          </DialogContent>
        </DialogPortal>
      </Dialog>
    );
  }

  if (!carePlanWithDetails) {
    return null;
  }

  return (
    <>
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogPortal>
        <DialogOverlay className="z-[60]" />
        <DialogContent 
          className="z-[70] max-w-7xl max-h-[90vh] overflow-hidden flex flex-col"
          onPointerDownOutside={(e) => {
            // Prevent accidental closes when clicking outside
            e.preventDefault();
          }}
          onInteractOutside={(e) => {
            // Additional safety to prevent interaction issues
            e.preventDefault();
          }}
        >
        <DialogHeader className="flex-shrink-0">
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle>
                {carePlan.title || `Care Plan #${carePlan.display_id}`}
              </DialogTitle>
              <DialogDescription>
                {carePlan.client 
                  ? `Care plan for ${carePlan.client.first_name} ${carePlan.client.last_name}` 
                  : 'View and manage care plan details'}
              </DialogDescription>
            <div className="flex items-center gap-2 mt-2">
                <Badge variant="custom" className={getStatusColor(carePlan.status)}>
                  {carePlan.status?.replace('_', ' ')}
                </Badge>
                <span className="text-sm text-muted-foreground">
                  {carePlan.client ? `${carePlan.client.first_name} ${carePlan.client.last_name}` : 'Client not found'}
                </span>
                {(carePlan as any).news2_monitoring_enabled && (
                  <Badge variant="secondary" className="bg-blue-100 text-blue-800 border-blue-200">
                    <Activity className="h-3 w-3 mr-1" />
                    NEWS2 Monitoring
                  </Badge>
                )}
              </div>
            </div>
            {context === 'staff' && (
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={handleExport}>
                  <Download className="h-4 w-4 mr-2" />
                  Export
                </Button>
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
            <div className="flex flex-col h-full">
              {/* Mobile Navigation */}
              <div className="flex-shrink-0 p-4 border-b">
                <Select value={currentStep.toString()} onValueChange={(value) => setCurrentStep(parseInt(value))}>
                  <SelectTrigger className="w-full">
                    <SelectValue>
                      <div className="flex items-center justify-between w-full">
                        <span className="font-medium">
                          {filteredViewSteps.find(step => step.id === currentStep)?.name || "Select Section"}
                        </span>
                        <Badge variant="outline" className="ml-2">
                          {currentStep} of {filteredViewSteps.length}
                        </Badge>
                      </div>
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent className="max-h-60">
                    {filteredViewSteps.map((step) => (
                      <SelectItem key={step.id} value={step.id.toString()}>
                        <div className="flex items-center justify-between w-full">
                          <div>
                            <div className="font-medium">{step.name}</div>
                            <div className="text-sm text-muted-foreground">{step.description}</div>
                          </div>
                          {completedSteps.includes(step.id) && (
                            <CheckCircle2 className="h-4 w-4 text-green-600 ml-2" />
                          )}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              {/* Mobile Content */}
              <ScrollArea className="flex-1">
                <div className="p-4 space-y-6">
                  {renderStepContent()}
                </div>
              </ScrollArea>
            </div>
          </div>

          <div className="hidden lg:flex flex-1 min-h-0 gap-6">
            <div className="hidden lg:block flex-shrink-0">
              <CarePlanWizardSidebar
                steps={filteredViewSteps}
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
      </DialogPortal>
    </Dialog>
    
    {/* Edit Wizard - Opens when edit button is clicked */}
    {isOpeningWizard && carePlan && carePlan.client && (
      <CarePlanCreationWizard
        isOpen={isOpeningWizard}
        onClose={() => {
          console.log('[CarePlanViewDialog] Edit wizard closed');
          setIsOpeningWizard(false);
        }}
        clientId={carePlan.client.id}
        carePlanId={carePlanId}
      />
    )}
    </>
  );
}

export default CarePlanViewDialog;
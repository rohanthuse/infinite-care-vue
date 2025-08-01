
import React, { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { CarePlanWizardSidebar } from "./wizard/CarePlanWizardSidebar";
import { CarePlanWizardSteps } from "./wizard/CarePlanWizardSteps";
import { CarePlanWizardFooter } from "./wizard/CarePlanWizardFooter";
import { useCarePlanDraft } from "@/hooks/useCarePlanDraft";
import { useCarePlanCreation } from "@/hooks/useCarePlanCreation";
import { useClientProfile } from "@/hooks/useClientData";
import { toast } from "sonner";

const carePlanSchema = z.object({
  title: z.string().min(1, "Title is required"),
  provider_name: z.string().optional(),
  provider_type: z.string().optional(),
  start_date: z.string().optional(),
  priority: z.enum(["low", "medium", "high"]).optional(),
  care_plan_type: z.string().optional(),
  personal_info: z.any().optional(),
  about_me: z.any().optional(),
  medical_info: z.any().optional(),
  goals: z.array(z.any()).optional(),
  activities: z.array(z.any()).optional(),
  personal_care: z.any().optional(),
  dietary: z.any().optional(),
  risk_assessments: z.array(z.any()).optional(),
  equipment: z.array(z.any()).optional(),
  service_plans: z.array(z.any()).optional(),
  service_actions: z.array(z.any()).optional(),
  documents: z.array(z.any()).optional(),
  additional_notes: z.string().optional(),
});

interface CarePlanCreationWizardProps {
  isOpen: boolean;
  onClose: () => void;
  clientId: string;
  carePlanId?: string;
}

const wizardSteps = [
  { id: 1, name: "Basic Information", description: "Care plan title and basic details" },
  { id: 2, name: "Personal Information", description: "Client personal details" },
  { id: 3, name: "About Me", description: "Client preferences and background" },
  { id: 4, name: "Medical Information", description: "Health conditions and medications" },
  { id: 5, name: "Goals", description: "Care goals and objectives" },
  { id: 6, name: "Activities", description: "Daily activities and routines" },
  { id: 7, name: "Personal Care", description: "Personal care requirements" },
  { id: 8, name: "Dietary", description: "Dietary needs and restrictions" },
  { id: 9, name: "Risk Assessments", description: "Safety and risk evaluations" },
  { id: 10, name: "Equipment", description: "Required equipment and aids" },
  { id: 11, name: "Service Plans", description: "Service delivery plans" },
  { id: 12, name: "Service Actions", description: "Specific service actions" },
  { id: 13, name: "Documents", description: "Supporting documents" },
  { id: 14, name: "Review", description: "Review and finalize care plan" },
];

// Safe array initialization helper
const initializeArrayField = (value: any): any[] => {
  if (Array.isArray(value)) return value;
  if (value === null || value === undefined) return [];
  // If it's an object, convert to empty array to prevent errors
  return [];
};

// Safe object initialization helper
const initializeObjectField = (value: any): any => {
  if (value && typeof value === 'object' && !Array.isArray(value)) return value;
  return {};
};

export function CarePlanCreationWizard({
  isOpen,
  onClose,
  clientId,
  carePlanId
}: CarePlanCreationWizardProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const [clientDataLoaded, setClientDataLoaded] = useState(false);
  const [stepError, setStepError] = useState<string | null>(null);
  const totalSteps = 14;
  
  const form = useForm({
    resolver: zodResolver(carePlanSchema),
    defaultValues: {
      title: "",
      provider_name: "",
      provider_type: "individual",
      start_date: new Date().toISOString().split('T')[0],
      priority: "medium" as const,
      care_plan_type: "standard",
      personal_info: {},
      about_me: {},
      medical_info: {},
      goals: [],
      activities: [],
      personal_care: {},
      dietary: {},
      risk_assessments: [],
      equipment: [],
      service_plans: [],
      service_actions: [],
      documents: [],
      additional_notes: "",
    },
  });

  const { 
    draftData, 
    isDraftLoading, 
    saveDraft, 
    autoSave, 
    isSaving,
    savedCarePlanId,
  } = useCarePlanDraft(clientId, carePlanId);

  const { createCarePlan, isCreating } = useCarePlanCreation();

  // Fetch client profile data
  const { data: clientProfile, isLoading: isClientLoading } = useClientProfile(clientId);

  // Debug logging for form state
  useEffect(() => {
    if (isOpen) {
      console.log('CarePlanCreationWizard opened:', {
        currentStep,
        clientId,
        carePlanId,
        formValues: form.getValues()
      });
    }
  }, [isOpen, currentStep, clientId, carePlanId, form]);

  // Pre-populate form with client data when client profile is loaded
  useEffect(() => {
    if (clientProfile && !isDraftLoading && !clientDataLoaded) {
      console.log('Pre-populating form with client data:', clientProfile);
      
      try {
        // Only set values if they don't already exist (don't overwrite draft data)
        const currentPersonalInfo = form.getValues('personal_info') || {};
        
        const updatedPersonalInfo: any = {
          ...currentPersonalInfo,
        };

        // Add basic client information if not already present
        if (clientProfile.first_name && clientProfile.last_name && !updatedPersonalInfo.client_name) {
          updatedPersonalInfo.client_name = `${clientProfile.first_name} ${clientProfile.last_name}`;
        }
        if (clientProfile.email && !updatedPersonalInfo.client_email) {
          updatedPersonalInfo.client_email = clientProfile.email;
        }
        if (clientProfile.phone && !updatedPersonalInfo.client_phone) {
          updatedPersonalInfo.client_phone = clientProfile.phone;
        }
        if (clientProfile.address && !updatedPersonalInfo.client_address) {
          updatedPersonalInfo.client_address = clientProfile.address;
        }

        // Set the updated personal info
        form.setValue('personal_info', updatedPersonalInfo);
        
        // Pre-populate other basic info if available
        const currentTitle = form.getValues('title');
        if (!currentTitle && clientProfile.first_name && clientProfile.last_name) {
          form.setValue('title', `Care Plan for ${clientProfile.first_name} ${clientProfile.last_name}`);
        }

        setClientDataLoaded(true);
        console.log('Client data pre-populated successfully');
      } catch (error) {
        console.error('Error pre-populating client data:', error);
        setStepError('Failed to load client data');
      }
    }
  }, [clientProfile, isDraftLoading, clientDataLoaded, form]);

  // Load draft data when available (this should run after client data is loaded)
  useEffect(() => {
    if (draftData?.auto_save_data && !isDraftLoading && clientDataLoaded) {
      const savedData = draftData.auto_save_data;
      
      console.log('Loading draft data:', savedData);
      
      try {
        // Safely set form values from saved data with proper type handling
        Object.keys(savedData).forEach((key) => {
          if (savedData[key] !== undefined) {
            let value = savedData[key];
            
            // Handle array fields with safety checks
            if (['risk_assessments', 'equipment', 'service_plans', 'service_actions', 'documents', 'goals', 'activities'].includes(key)) {
              value = initializeArrayField(value);
            }
            // Handle object fields with safety checks
            else if (['personal_info', 'about_me', 'medical_info', 'personal_care', 'dietary'].includes(key)) {
              value = initializeObjectField(value);
            }
            
            form.setValue(key as any, value);
          }
        });

        // Set current step from saved data
        if (draftData.last_step_completed) {
          setCurrentStep(draftData.last_step_completed);
        }
        
        console.log('Draft data loaded successfully');
        setStepError(null);
      } catch (error) {
        console.error('Error loading draft data:', error);
        setStepError('Failed to load saved data');
      }
    }
  }, [draftData, isDraftLoading, clientDataLoaded, form]);

  // Auto-save on form changes
  useEffect(() => {
    const subscription = form.watch((data) => {
      if (isOpen && savedCarePlanId && clientDataLoaded) {
        try {
          autoSave(data, currentStep);
        } catch (error) {
          console.error('Auto-save error:', error);
        }
      }
    });
    
    return () => subscription.unsubscribe();
  }, [form, autoSave, currentStep, isOpen, savedCarePlanId, clientDataLoaded]);

  // Calculate completed steps based on form data
  const getCompletedSteps = () => {
    try {
      const formData = form.getValues();
      const completedSteps: number[] = [];

      // Check each step for completion with safety checks
      if (formData.title?.trim()) completedSteps.push(1);
      if (formData.personal_info && Object.keys(formData.personal_info).length > 0) completedSteps.push(2);
      if (formData.about_me && Object.keys(formData.about_me).length > 0) completedSteps.push(3);
      if (formData.medical_info && Object.keys(formData.medical_info).length > 0) completedSteps.push(4);
      if (Array.isArray(formData.goals) && formData.goals.length > 0) completedSteps.push(5);
      if (Array.isArray(formData.activities) && formData.activities.length > 0) completedSteps.push(6);
      if (formData.personal_care && Object.keys(formData.personal_care).length > 0) completedSteps.push(7);
      if (formData.dietary && Object.keys(formData.dietary).length > 0) completedSteps.push(8);
      if (Array.isArray(formData.risk_assessments) && formData.risk_assessments.length > 0) completedSteps.push(9);
      if (Array.isArray(formData.equipment) && formData.equipment.length > 0) completedSteps.push(10);
      if (Array.isArray(formData.service_plans) && formData.service_plans.length > 0) completedSteps.push(11);
      if (Array.isArray(formData.service_actions) && formData.service_actions.length > 0) completedSteps.push(12);
      if (Array.isArray(formData.documents) && formData.documents.length > 0) completedSteps.push(13);
      
      // Step 14 (Review) is considered completed when ready to finalize
      if (completedSteps.length >= 3) completedSteps.push(14);

      return completedSteps;
    } catch (error) {
      console.error('Error calculating completed steps:', error);
      return [];
    }
  };

  const handleStepClick = (stepNumber: number) => {
    try {
      console.log(`Navigating to step ${stepNumber}`);
      setCurrentStep(stepNumber);
      setStepError(null);
    } catch (error) {
      console.error('Error navigating to step:', error);
      setStepError(`Failed to navigate to step ${stepNumber}`);
    }
  };

  const handleNext = () => {
    try {
      if (currentStep < totalSteps) {
        console.log(`Moving from step ${currentStep} to ${currentStep + 1}`);
        setCurrentStep(currentStep + 1);
        setStepError(null);
      }
    } catch (error) {
      console.error('Error navigating to next step:', error);
      setStepError('Failed to proceed to next step');
    }
  };

  const handlePrevious = () => {
    try {
      if (currentStep > 1) {
        console.log(`Moving from step ${currentStep} to ${currentStep - 1}`);
        setCurrentStep(currentStep - 1);
        setStepError(null);
      }
    } catch (error) {
      console.error('Error navigating to previous step:', error);
      setStepError('Failed to go to previous step');
    }
  };

  const handleSaveDraft = async () => {
    try {
      const formData = form.getValues();
      await saveDraft(formData, currentStep);
      setStepError(null);
    } catch (error) {
      console.error('Error saving draft:', error);
      setStepError('Failed to save draft');
    }
  };

  const handleFinalize = async () => {
    try {
      const formData = form.getValues();
      
      // First save as draft to get the latest data
      await saveDraft(formData, currentStep);
      
      // Then finalize the care plan - set status to pending_approval for staff approval workflow
      await createCarePlan({
        ...formData,
        client_id: clientId,
        status: 'pending_approval',
        care_plan_id: savedCarePlanId,
      });

      toast.success("Care plan sent for staff approval successfully!");
      onClose();
      setStepError(null);
    } catch (error) {
      console.error('Error finalizing care plan:', error);
      setStepError('Failed to finalize care plan');
      toast.error("Failed to finalize care plan. Please try again.");
    }
  };

  // Reset form state when dialog closes
  const handleClose = () => {
    setStepError(null);
    setCurrentStep(1);
    onClose();
  };

  const formData = form.watch();
  const completedSteps = getCompletedSteps();

  // Show loading state while client data is being fetched
  const isLoading = isClientLoading || isDraftLoading || !clientDataLoaded;

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-7xl h-[95vh] flex flex-col p-0">
        <DialogHeader className="flex-shrink-0 px-6 py-4 border-b">
          <DialogTitle>
            {carePlanId ? "Edit Care Plan Draft" : "Create Care Plan"}
            {clientProfile && (
              <span className="text-sm font-normal text-gray-600 ml-2">
                for {clientProfile.first_name} {clientProfile.last_name}
              </span>
            )}
          </DialogTitle>
        </DialogHeader>
        
        {stepError && (
          <div className="flex-shrink-0 px-6 py-2 bg-red-50 border-b border-red-200">
            <p className="text-red-700 text-sm">{stepError}</p>
            <button 
              onClick={() => setStepError(null)}
              className="text-red-600 hover:text-red-800 text-xs underline"
            >
              Dismiss
            </button>
          </div>
        )}
        
        {isLoading ? (
          <div className="flex-1 flex items-center justify-center p-6">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
              <p className="text-gray-600">Loading client information...</p>
            </div>
          </div>
        ) : (
          <div className="flex flex-1 min-h-0">
            {/* Sidebar - Hidden on mobile, visible on lg+ */}
            <div className="hidden lg:block flex-shrink-0">
              <CarePlanWizardSidebar
                steps={wizardSteps}
                currentStep={currentStep}
                completedSteps={completedSteps}
                onStepClick={handleStepClick}
                completionPercentage={draftData?.completion_percentage || 0}
              />
            </div>
            
            {/* Main Content */}
            <div className="flex-1 flex flex-col min-h-0 relative">
              <div className="flex-1 overflow-y-auto px-4 lg:px-6 py-4">
                <div className="max-w-4xl mx-auto space-y-6">
                  <CarePlanWizardSteps 
                    currentStep={currentStep} 
                    form={form} 
                    clientId={clientId}
                  />
                </div>
              </div>

              {/* Footer - Fixed at bottom */}
              <div className="flex-shrink-0">
                <CarePlanWizardFooter
                  currentStep={currentStep}
                  totalSteps={totalSteps}
                  onPrevious={handlePrevious}
                  onNext={handleNext}
                  onSaveDraft={handleSaveDraft}
                  onFinalize={handleFinalize}
                  isLoading={isSaving || isCreating}
                  isDraft={!!draftData}
                  formData={formData}
                />
              </div>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

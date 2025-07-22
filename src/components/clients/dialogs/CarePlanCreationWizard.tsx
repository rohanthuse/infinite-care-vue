import React, { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useParams } from "react-router-dom";

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { CarePlanWizardSteps } from "./wizard/CarePlanWizardSteps";
import { CarePlanWizardFooter } from "./wizard/CarePlanWizardFooter";
import { useBranchStaff } from "@/hooks/useBranchStaff";
import { useCarePlanDraft } from "@/hooks/useCarePlanDraft";
import { parseGpDetails, parseCommunicationPreferences } from "@/utils/safeJsonParse";

const formSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters"),
  provider_type: z.enum(["staff", "external"], {
    required_error: "Please select a provider type",
  }),
  staff_id: z.string().nullable(),
  provider_name: z.string().optional(),
  priority: z.enum(["low", "medium", "high"]).optional(),
  care_plan_type: z.enum(["standard", "intensive", "respite", "palliative", "rehabilitation"]).optional(),
  start_date: z.date({
    required_error: "Start date is required",
  }),
  end_date: z.date().optional(),
  review_date: z.date().optional(),
  personal_info: z.object({
    emergency_contact_name: z.string().optional(),
    emergency_contact_phone: z.string().optional(),
    emergency_contact_relationship: z.string().optional(),
    gp_name: z.string().optional(),
    gp_practice: z.string().optional(),
    gp_phone: z.string().optional(),
  }).optional(),
  about_me: z.object({
    hobbies: z.string().optional(),
    occupation: z.string().optional(),
    summary: z.string().optional(),
    preferred_name: z.string().optional(),
    gender: z.string().optional(),
    sexual_orientation: z.string().optional(),
    relationship_status: z.string().optional(),
    living_situation: z.string().optional(),
    religion: z.string().optional(),
    values_beliefs: z.string().optional(),
    education: z.string().optional(),
    communication_method: z.string().optional(),
  }).optional(),
  medical_info: z.object({
    allergies: z.string().optional(),
    medications: z.string().optional(),
    medical_conditions: z.string().optional(),
    mobility_status: z.string().optional(),
    cognitive_status: z.string().optional(),
    sensory_impairments: z.string().optional(),
    pain_management: z.string().optional(),
    mental_health: z.string().optional(),
    hospitalizations: z.string().optional(),
    immunizations: z.string().optional(),
  }).optional(),
  goals: z.array(z.object({
    title: z.string().optional(),
    description: z.string().optional(),
    target_date: z.date().optional(),
    status: z.string().optional(),
    notes: z.string().optional(),
  })).optional(),
  activities: z.array(z.object({
    name: z.string().optional(),
    description: z.string().optional(),
    frequency: z.string().optional(),
    duration: z.string().optional(),
    status: z.string().optional(),
    notes: z.string().optional(),
  })).optional(),
  personal_care: z.object({
    bathing: z.string().optional(),
    dressing: z.string().optional(),
    grooming: z.string().optional(),
    toileting: z.string().optional(),
    feeding: z.string().optional(),
    mobility: z.string().optional(),
  }).optional(),
  dietary: z.object({
    dietaryRestrictions: z.array(z.object({
      restriction: z.string().optional(),
    })).optional(),
    foodAllergies: z.array(z.object({
      allergy: z.string().optional(),
    })).optional(),
    foodPreferences: z.array(z.object({
      preference: z.string().optional(),
    })).optional(),
    supplements: z.array(z.object({
      supplement: z.string().optional(),
    })).optional(),
    textureModifications: z.string().optional(),
    fluidRestrictions: z.string().optional(),
    nutritionalNeeds: z.string().optional(),
    feedingAssistance: z.string().optional(),
    weightMonitoring: z.boolean().optional(),
    specialEquipment: z.string().optional(),
  }).optional(),
  risk_assessments: z.array(z.object({
    risk_type: z.string().optional(),
    risk_level: z.string().optional(),
    assessed_by: z.string().optional(),
    review_date: z.date().optional(),
    risk_factors: z.array(z.string()).optional(),
    mitigation_strategies: z.array(z.string()).optional(),
  })).optional(),
  equipment: z.array(z.object({
    equipment_name: z.string().optional(),
    equipment_type: z.string().optional(),
    manufacturer: z.string().optional(),
    model_number: z.string().optional(),
    serial_number: z.string().optional(),
    installation_date: z.date().optional(),
    last_maintenance_date: z.date().optional(),
    next_maintenance_date: z.date().optional(),
    maintenance_schedule: z.string().optional(),
    location: z.string().optional(),
    notes: z.string().optional(),
  })).optional(),
  service_plans: z.array(z.object({
    service_type: z.string().optional(),
    frequency: z.string().optional(),
    duration: z.string().optional(),
    start_date: z.date().optional(),
    end_date: z.date().optional(),
    notes: z.string().optional(),
  })).optional(),
  service_actions: z.array(z.object({
    action: z.string().optional(),
    assigned_to: z.string().optional(),
    due_date: z.date().optional(),
    status: z.string().optional(),
    notes: z.string().optional(),
  })).optional(),
  documents: z.array(z.object({
    title: z.string().optional(),
    file_url: z.string().optional(),
    upload_date: z.date().optional(),
    notes: z.string().optional(),
  })).optional(),
});

type FormValues = z.infer<typeof formSchema>;

interface Client {
  id: string;
  first_name: string;
  last_name: string;
  email?: string;
  phone?: string;
  address?: string;
  date_of_birth?: string;
  emergency_contact?: string;
  emergency_phone?: string;
  gp_details?: any;
  mobility_status?: string;
  communication_preferences?: any;
}

interface CarePlanCreationWizardProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  clientId: string;
  clientName: string;
  clientData?: Client;
  draftId?: string;
}

export function CarePlanCreationWizard({ 
  open, 
  onOpenChange, 
  clientId, 
  clientName,
  clientData,
  draftId
}: CarePlanCreationWizardProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const { toast } = useToast();
  const { id: branchId } = useParams();
  const queryClient = useQueryClient();
  const { data: branchStaff = [] } = useBranchStaff(branchId || '');
  
  const { 
    draftData, 
    isDraftLoading, 
    saveDraft, 
    autoSave, 
    isSaving,
    savedCarePlanId 
  } = useCarePlanDraft(clientId, draftId);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      provider_type: "staff",
      staff_id: null,
      provider_name: "",
      priority: "medium",
      care_plan_type: "standard",
      start_date: new Date(),
      end_date: undefined,
      review_date: undefined,
      personal_info: {
        emergency_contact_name: "",
        emergency_contact_phone: "",
        emergency_contact_relationship: "",
        gp_name: "",
        gp_practice: "",
        gp_phone: "",
      },
      about_me: {
        hobbies: "",
        occupation: "",
        summary: "",
        preferred_name: "",
        gender: "",
        sexual_orientation: "",
        relationship_status: "",
        living_situation: "",
        religion: "",
        values_beliefs: "",
        education: "",
        communication_method: "",
      },
      medical_info: {
        allergies: "",
        medications: "",
        medical_conditions: "",
        mobility_status: "",
        cognitive_status: "",
        sensory_impairments: "",
        pain_management: "",
        mental_health: "",
        hospitalizations: "",
        immunizations: "",
      },
      goals: [],
      activities: [],
      personal_care: {
        bathing: "",
        dressing: "",
        grooming: "",
        toileting: "",
        feeding: "",
        mobility: "",
      },
      dietary: {
        dietaryRestrictions: [],
        foodAllergies: [],
        foodPreferences: [],
        supplements: [],
        textureModifications: "",
        fluidRestrictions: "",
        nutritionalNeeds: "",
        feedingAssistance: "",
        weightMonitoring: false,
        specialEquipment: "",
      },
      risk_assessments: [],
      equipment: [],
      service_plans: [],
      service_actions: [],
      documents: [],
    },
  });

  const watchedValues = form.watch();
  const isDraft = !!draftId || !!savedCarePlanId;

  useEffect(() => {
    if (open && (draftId || savedCarePlanId)) {
      autoSave(watchedValues, currentStep);
    }
  }, [watchedValues, currentStep, autoSave, open, draftId, savedCarePlanId]);

  useEffect(() => {
    if (draftData && draftData.auto_save_data && open) {
      console.log('Loading draft data:', draftData);
      
      try {
        const savedData = draftData.auto_save_data;
        
        form.reset(savedData as any);
        
        if (draftData.last_step_completed) {
          setCurrentStep(draftData.last_step_completed);
        }
        
        toast({
          title: "Draft loaded",
          description: `Resumed from step ${draftData.last_step_completed || 1} (${draftData.completion_percentage || 0}% complete)`,
        });
      } catch (error) {
        console.error('Error loading draft data:', error);
        toast({
          title: "Warning",
          description: "Some draft data could not be loaded properly. You can still continue creating the care plan.",
          variant: "default",
        });
      }
    }
  }, [draftData, open, form, toast]);

  useEffect(() => {
    if (clientData && open && !draftData) {
      try {
        form.setValue("title", `Comprehensive Care Plan for ${clientData.first_name} ${clientData.last_name}`);
        
        if (clientData.emergency_contact) {
          form.setValue("personal_info.emergency_contact_name", clientData.emergency_contact);
        }
        if (clientData.emergency_phone) {
          form.setValue("personal_info.emergency_contact_phone", clientData.emergency_phone);
        }
        
        if (clientData.gp_details) {
          const gpDetails = parseGpDetails(clientData.gp_details);
          
          if (gpDetails) {
            if (gpDetails.name) {
              form.setValue("personal_info.gp_name", gpDetails.name);
            }
            if (gpDetails.practice) {
              form.setValue("personal_info.gp_practice", gpDetails.practice);
            }
            if (gpDetails.phone) {
              form.setValue("personal_info.gp_phone", gpDetails.phone);
            }
          }
        }

        if (clientData.communication_preferences) {
          const commPrefs = parseCommunicationPreferences(clientData.communication_preferences);
          
          if (commPrefs && commPrefs.preferred_method) {
            form.setValue("about_me.communication_method", commPrefs.preferred_method);
          }
        }

        if (clientData.mobility_status) {
          form.setValue("medical_info.mobility_status", clientData.mobility_status);
        }
      } catch (error) {
        console.error('Error pre-populating form with client data:', error);
        toast({
          title: "Warning",
          description: "Some client data could not be loaded properly. You can still create the care plan.",
          variant: "default",
        });
      }
    }
  }, [clientData, open, form, toast, draftData]);

  const createCarePlanMutation = useMutation({
    mutationFn: async (data: FormValues) => {
      const insertData: any = {
        client_id: clientId,
        title: data.title,
        start_date: data.start_date.toISOString().split('T')[0],
        end_date: data.end_date ? data.end_date.toISOString().split('T')[0] : null,
        review_date: data.review_date ? data.review_date.toISOString().split('T')[0] : null,
        priority: data.priority,
        care_plan_type: data.care_plan_type,
        personal_info: data.personal_info,
        about_me: data.about_me,
        medical_info: data.medical_info,
        goals: data.goals,
        activities: data.activities,
        personal_care: data.personal_care,
        dietary: data.dietary,
        risk_assessments: data.risk_assessments,
        equipment: data.equipment,
        service_plans: data.service_plans,
        service_actions: data.service_actions,
        documents: data.documents,
        status: 'active'
      };

      if (data.provider_type === 'staff' && data.staff_id) {
        const staffMember = branchStaff.find(staff => staff.id === data.staff_id);
        insertData.staff_id = data.staff_id;
        insertData.provider_name = staffMember ? `${staffMember.first_name} ${staffMember.last_name}` : 'Unknown Staff';
      } else {
        insertData.provider_name = data.provider_name;
      }

      const { data: carePlanData, error } = await supabase
        .from('client_care_plans')
        .insert([insertData])
        .select()
        .single();

      if (error) throw error;
      return carePlanData;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['care-plans'] });
      queryClient.invalidateQueries({ queryKey: ['client-care-plans', clientId] });
      toast({
        title: "Care plan created",
        description: "The care plan has been created successfully",
      });
    },
    onError: (error) => {
      console.error('Error creating care plan:', error);
      toast({
        title: "Error",
        description: "Failed to create care plan. Please try again.",
        variant: "destructive",
      });
    }
  });

  const totalSteps = 14;
  const progress = (currentStep / totalSteps) * 100;

  const nextStep = () => {
    if (currentStep < totalSteps) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSaveDraft = () => {
    const currentData = form.getValues();
    saveDraft(currentData, currentStep);
  };

  const handleFinalize = async () => {
    const data = form.getValues();
    console.log('Finalizing care plan data:', data);
    
    try {
      if (draftId || savedCarePlanId) {
        const carePlanId = draftId || savedCarePlanId;
        
        const finalData: any = {
          title: data.title,
          start_date: data.start_date.toISOString().split('T')[0],
          end_date: data.end_date ? data.end_date.toISOString().split('T')[0] : null,
          review_date: data.review_date ? data.review_date.toISOString().split('T')[0] : null,
          priority: data.priority,
          care_plan_type: data.care_plan_type,
          personal_info: data.personal_info,
          about_me: data.about_me,
          medical_info: data.medical_info,
          goals: data.goals,
          activities: data.activities,
          personal_care: data.personal_care,
          dietary: data.dietary,
          risk_assessments: data.risk_assessments,
          equipment: data.equipment,
          service_plans: data.service_plans,
          service_actions: data.service_actions,
          documents: data.documents,
          status: 'active',
          completion_percentage: 100,
        };

        if (data.provider_type === 'staff' && data.staff_id) {
          const staffMember = branchStaff.find(staff => staff.id === data.staff_id);
          finalData.staff_id = data.staff_id;
          finalData.provider_name = staffMember ? `${staffMember.first_name} ${staffMember.last_name}` : 'Unknown Staff';
        } else {
          finalData.provider_name = data.provider_name || 'Not Assigned';
        }

        const { error } = await supabase
          .from('client_care_plans')
          .update(finalData)
          .eq('id', carePlanId);

        if (error) throw error;
      } else {
        await createCarePlanMutation.mutateAsync(data);
      }
      
      queryClient.invalidateQueries({ queryKey: ['care-plans'] });
      queryClient.invalidateQueries({ queryKey: ['client-care-plans', clientId] });
      
      toast({
        title: "Care plan finalized",
        description: "The care plan has been created and activated successfully",
      });
      
      onOpenChange(false);
      setCurrentStep(1);
      form.reset();
    } catch (error) {
      console.error('Error finalizing care plan:', error);
      toast({
        title: "Error",
        description: "Failed to finalize care plan. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleSubmit = async (data: FormValues) => {
    await handleFinalize();
  };

  if (isDraftLoading) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <div className="flex items-center justify-center p-8">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p>Loading draft...</p>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-blue-600">
            Care Plan Creation Wizard - {clientName}
            {isDraft && (
              <span className="px-2 py-1 text-xs bg-amber-100 text-amber-800 rounded-full">
                Draft Mode
              </span>
            )}
            {isSaving && (
              <span className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded-full animate-pulse">
                Saving...
              </span>
            )}
          </DialogTitle>
          <div className="space-y-2">
            <div className="flex justify-between text-sm text-gray-600">
              <span>Step {currentStep} of {totalSteps}</span>
              <span>{Math.round(progress)}% Complete</span>
            </div>
            <Progress value={progress} className="w-full" />
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto">
          <CarePlanWizardSteps 
            currentStep={currentStep} 
            form={form} 
            clientId={clientId}
          />
        </div>

        <CarePlanWizardFooter
          currentStep={currentStep}
          totalSteps={totalSteps}
          onPrevious={prevStep}
          onNext={nextStep}
          onSaveDraft={handleSaveDraft}
          onFinalize={handleFinalize}
          isLoading={createCarePlanMutation.isPending || isSaving}
          isDraft={isDraft}
        />
      </DialogContent>
    </Dialog>
  );
}

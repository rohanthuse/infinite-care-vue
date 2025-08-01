
import React from "react";
import { Button } from "@/components/ui/button";
import { ArrowLeft, ArrowRight, Save, CheckCircle } from "lucide-react";
import { toast } from "sonner";

interface CarePlanWizardFooterProps {
  currentStep: number;
  totalSteps: number;
  onPrevious: () => void;
  onNext: () => void;
  onSaveDraft: () => Promise<void>;
  onFinalize: () => void;
  isLoading: boolean;
  isDraft: boolean;
  formData?: any;
}

export function CarePlanWizardFooter({
  currentStep,
  totalSteps,
  onPrevious,
  onNext,
  onSaveDraft,
  onFinalize,
  isLoading,
  isDraft,
  formData
}: CarePlanWizardFooterProps) {
  const isFirstStep = currentStep === 1;
  const isLastStep = currentStep === totalSteps;

  // Check if care plan has minimum content for finalization
  const getSectionStatus = (sectionData: any) => {
    if (!sectionData) return "empty";
    if (typeof sectionData === "object" && Object.keys(sectionData).length === 0) return "empty";
    if (Array.isArray(sectionData) && sectionData.length === 0) return "empty";
    return "completed";
  };

  const sections = [
    { data: { title: formData?.title, provider_type: formData?.provider_type, start_date: formData?.start_date, priority: formData?.priority } },
    { data: formData?.personal_info },
    { data: formData?.about_me },
    { data: formData?.medical_info },
    { data: formData?.goals },
    { data: formData?.activities },
    { data: formData?.personal_care },
    { data: formData?.dietary },
    { data: formData?.risk_assessments },
    { data: formData?.equipment },
    { data: formData?.service_plans },
    { data: formData?.service_actions },
    { data: formData?.documents }
  ];

  const completedSections = sections.filter(section => getSectionStatus(section.data) === "completed");
  const hasMinimumContent = completedSections.length >= 3;

  // Check if provider information is complete
  const hasProviderInfo = formData?.provider_type && (
    (formData.provider_type === 'staff' && formData.staff_id) ||
    (formData.provider_type === 'external' && formData.provider_name)
  );

  const canFinalize = hasMinimumContent && hasProviderInfo;

  const handleNext = async () => {
    try {
      // Save draft before proceeding to next step
      await onSaveDraft();
      // Only proceed to next step after save completes successfully
      onNext();
    } catch (error) {
      console.error('Failed to save before proceeding to next step:', error);
      // Don't proceed if save fails - user will see error toast from the hook
    }
  };

  const handleSaveDraft = async () => {
    try {
      await onSaveDraft();
    } catch (error) {
      console.error('Failed to save draft:', error);
      // Error toast is handled by the hook
    }
  };

  const handleFinalize = () => {
    if (!hasMinimumContent) {
      toast.error("Please complete at least 3 sections before finalizing", {
        description: "Fill in more details about the client's care requirements"
      });
      return;
    }

    if (!hasProviderInfo) {
      toast.error("Please assign a provider before finalizing", {
        description: "Select a staff member or specify a provider name"
      });
      return;
    }

    if (!canFinalize) {
      toast.error("Cannot finalize care plan", {
        description: "Please ensure all required information is completed"
      });
      return;
    }

    onFinalize();
  };

  const getFinalizationMessage = () => {
    if (!hasMinimumContent) {
      return "Complete at least 3 sections to finalize";
    }
    if (!hasProviderInfo) {
      return "Provider information is required to finalize";
    }
    return "Send for staff approval";
  };

  return (
    <div className="border-t bg-white px-4 lg:px-6 py-4">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-0">
        <div className="flex items-center space-x-2">
          <Button
            type="button"
            variant="outline"
            onClick={onPrevious}
            disabled={isFirstStep || isLoading}
            className="flex items-center space-x-2"
          >
            <ArrowLeft className="h-4 w-4" />
            <span className="hidden sm:inline">Previous</span>
          </Button>
        </div>

        <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-2 sm:space-y-0 sm:space-x-2 w-full sm:w-auto">
          <Button
            type="button"
            variant="outline"
            onClick={handleSaveDraft}
            disabled={isLoading}
            className="flex items-center space-x-2 bg-blue-50 hover:bg-blue-100 text-blue-700 border-blue-200 w-full sm:w-auto"
          >
            <Save className="h-4 w-4" />
            <span>{isLoading ? "Saving..." : isDraft ? "Update Draft" : "Save as Draft"}</span>
          </Button>

          {isLastStep ? (
            <Button
              type="button"
              onClick={handleFinalize}
              disabled={isLoading || !canFinalize}
              className={`flex items-center space-x-2 w-full sm:w-auto ${
                canFinalize 
                  ? "bg-green-600 hover:bg-green-700" 
                  : "bg-gray-400 hover:bg-gray-400 cursor-not-allowed"
              }`}
              title={!canFinalize ? getFinalizationMessage() : "Send for staff approval"}
            >
              <CheckCircle className="h-4 w-4" />
              <span>{isLoading ? "Finalizing..." : "Send for Approval"}</span>
            </Button>
          ) : (
            <Button
              type="button"
              onClick={handleNext}
              disabled={isLoading}
              className="flex items-center space-x-2 w-full sm:w-auto"
            >
              <span>{isLoading ? "Saving..." : "Next"}</span>
              <ArrowRight className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>

      <div className="mt-3 text-center">
        <p className="text-xs sm:text-sm text-gray-500">
          Step {currentStep} of {totalSteps}
          {isDraft && <span className="text-amber-600 ml-2 block sm:inline">(Draft Mode - All changes are automatically saved)</span>}
          {isLastStep && !isDraft && (
            <span className={`ml-2 block sm:inline ${canFinalize ? "text-green-600" : "text-red-600"}`}>
              {canFinalize ? "Ready for approval" : getFinalizationMessage()}
            </span>
          )}
        </p>
      </div>
    </div>
  );
}

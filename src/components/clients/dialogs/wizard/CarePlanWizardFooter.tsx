
import React from "react";
import { Button } from "@/components/ui/button";
import { ArrowLeft, ArrowRight, Save, CheckCircle } from "lucide-react";

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
    if (!hasMinimumContent && isLastStep) {
      // Don't allow finalization if insufficient content
      return;
    }
    onFinalize();
  };

  return (
    <div className="absolute bottom-0 left-0 right-0 border-t bg-white/95 backdrop-blur-sm px-6 py-4 z-10">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Button
            type="button"
            variant="outline"
            onClick={onPrevious}
            disabled={isFirstStep || isLoading}
            className="flex items-center space-x-2"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Previous</span>
          </Button>
        </div>

        <div className="flex items-center space-x-2">
          <Button
            type="button"
            variant="outline"
            onClick={handleSaveDraft}
            disabled={isLoading}
            className="flex items-center space-x-2 bg-blue-50 hover:bg-blue-100 text-blue-700 border-blue-200"
          >
            <Save className="h-4 w-4" />
            <span>{isLoading ? "Saving..." : isDraft ? "Update Draft" : "Save as Draft"}</span>
          </Button>

          {isLastStep ? (
            <Button
              type="button"
              onClick={handleFinalize}
              disabled={isLoading || !hasMinimumContent}
              className={`flex items-center space-x-2 ${
                hasMinimumContent 
                  ? "bg-green-600 hover:bg-green-700" 
                  : "bg-gray-400 hover:bg-gray-400 cursor-not-allowed"
              }`}
              title={!hasMinimumContent ? "Complete at least 3 sections to finalize" : "Send for staff approval"}
            >
              <CheckCircle className="h-4 w-4" />
              <span>{isLoading ? "Finalizing..." : "Send for Approval"}</span>
            </Button>
          ) : (
            <Button
              type="button"
              onClick={handleNext}
              disabled={isLoading}
              className="flex items-center space-x-2"
            >
              <span>{isLoading ? "Saving..." : "Next"}</span>
              <ArrowRight className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>

      <div className="mt-3 text-center">
        <p className="text-sm text-gray-500">
          Step {currentStep} of {totalSteps}
          {isDraft && <span className="text-amber-600 ml-2">(Draft Mode - All changes are automatically saved)</span>}
          {isLastStep && !isDraft && (
            <span className={`ml-2 ${hasMinimumContent ? "text-green-600" : "text-red-600"}`}>
              {hasMinimumContent ? "Ready for approval" : "Need more content to finalize"}
            </span>
          )}
        </p>
      </div>
    </div>
  );
}

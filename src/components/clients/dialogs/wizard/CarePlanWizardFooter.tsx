
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { ArrowLeft, ArrowRight, Save, CheckCircle, Loader2, Check, Undo2 } from "lucide-react";
import { toast } from "sonner";

interface WizardStep {
  id: number;
  name: string;
  description: string;
  childOnly?: boolean;
}

interface CarePlanWizardFooterProps {
  currentStep: number;
  totalSteps: number;
  filteredSteps: WizardStep[];
  onPrevious: () => void;
  onNext: () => void;
  onSaveDraft: () => Promise<void>;
  onFinalize: () => void;
  isLoading: boolean;
  isDraft: boolean;
  formData?: any;
  onUndo?: () => void;
  canUndo?: boolean;
  lastSaveTime?: Date | null;
}

export function CarePlanWizardFooter({
  currentStep,
  totalSteps,
  filteredSteps,
  onPrevious,
  onNext,
  onSaveDraft,
  onFinalize,
  isLoading,
  isDraft,
  formData,
  onUndo,
  canUndo,
  lastSaveTime
}: CarePlanWizardFooterProps) {
  const [showSaveSuccess, setShowSaveSuccess] = useState(false);
  const [localLastSave, setLocalLastSave] = useState<Date | null>(null);
  
  // Use prop lastSaveTime or local state
  const effectiveLastSave = lastSaveTime || localLastSave;
  // Calculate first/last step based on filtered steps (handles adult vs child clients)
  const currentIndex = filteredSteps.findIndex(s => s.id === currentStep);
  
  // Defensive check: if currentIndex is -1, we're on an unknown step
  // Assume not first step and check if we're on the review step (21)
  const isFirstStep = currentIndex === 0;
  const isReviewStep = currentStep === 21;
  const isLastStep = currentIndex >= 0 
    ? currentIndex === filteredSteps.length - 1 
    : isReviewStep; // If index not found but on step 21, treat as last step
  
  // Always show finalize button on review step OR last step
  const shouldShowFinalizeButton = isLastStep || isReviewStep;

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

  // Debug logging to track validation states
  console.log('[CarePlanWizardFooter] Validation Debug:', {
    completedSections: completedSections.length,
    hasMinimumContent,
    providerType: formData?.provider_type,
    staffId: formData?.staff_id,
    providerName: formData?.provider_name,
    hasProviderInfo,
    canFinalize,
    formDataKeys: Object.keys(formData || {})
  });

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
      setShowSaveSuccess(true);
      setLocalLastSave(new Date());
      // Hide success indicator after 2 seconds
      setTimeout(() => setShowSaveSuccess(false), 2000);
    } catch (error) {
      console.error('Failed to save draft:', error);
      // Error toast is handled by the hook
    }
  };

  const handleFinalize = () => {
    // Show warning for incomplete plans but allow user to proceed
    if (!hasMinimumContent || !hasProviderInfo) {
      const warnings: string[] = [];
      if (!hasMinimumContent) {
        warnings.push(`Only ${completedSections.length}/3 sections completed`);
      }
      if (!hasProviderInfo) {
        warnings.push("No provider assigned");
      }
      
      const proceed = window.confirm(
        `This care plan has incomplete information:\n\n• ${warnings.join('\n• ')}\n\nAre you sure you want to send it for client approval?`
      );
      
      if (!proceed) return;
    }

    onFinalize();
  };

  const getFinalizationMessage = () => {
    if (!hasMinimumContent) {
      return `Complete at least 3 sections to finalize (${completedSections.length}/3)`;
    }
    if (!hasProviderInfo) {
      if (formData?.provider_type === 'staff') {
        return "Please select a staff member to assign";
      }
      if (formData?.provider_type === 'external') {
        return "Please enter provider name";
      }
      return "Please select a provider type and assign";
    }
    return "Send to client for approval";
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
          {/* Undo Button */}
          {canUndo && onUndo && (
            <Button
              type="button"
              variant="ghost"
              onClick={onUndo}
              disabled={isLoading}
              className="flex items-center space-x-2 text-gray-600 hover:text-gray-800 w-full sm:w-auto"
            >
              <Undo2 className="h-4 w-4" />
              <span>Undo</span>
            </Button>
          )}
          
          {/* Save Draft Button */}
          <Button
            type="button"
            variant="outline"
            onClick={handleSaveDraft}
            disabled={isLoading}
            className="flex items-center space-x-2 bg-blue-50 hover:bg-blue-100 text-blue-700 border-blue-200 w-full sm:w-auto"
          >
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Saving...</span>
              </>
            ) : showSaveSuccess ? (
              <>
                <Check className="h-4 w-4 text-green-600" />
                <span>Saved!</span>
              </>
            ) : (
              <>
                <Save className="h-4 w-4" />
                <span>{isDraft ? "Update Draft" : "Save as Draft"}</span>
              </>
            )}
          </Button>

          {shouldShowFinalizeButton ? (
            <Button
              type="button"
              onClick={handleFinalize}
              disabled={isLoading}
              className="flex items-center space-x-2 w-full sm:w-auto bg-green-600 hover:bg-green-700"
              title="Send to client for approval"
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
          {effectiveLastSave && (
            <span className="text-gray-400 ml-2 block sm:inline">
              Last saved: {effectiveLastSave.toLocaleTimeString()}
            </span>
          )}
          {shouldShowFinalizeButton && !isDraft && (
            <span className={`ml-2 block sm:inline ${canFinalize ? "text-green-600" : "text-red-600"}`}>
              {canFinalize ? "Ready for approval" : getFinalizationMessage()}
            </span>
          )}
        </p>
      </div>
    </div>
  );
}

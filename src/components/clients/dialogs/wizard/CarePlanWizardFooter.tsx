
import React from "react";
import { Button } from "@/components/ui/button";
import { ArrowLeft, ArrowRight, Save, CheckCircle } from "lucide-react";

interface CarePlanWizardFooterProps {
  currentStep: number;
  totalSteps: number;
  onPrevious: () => void;
  onNext: () => void;
  onSaveDraft: () => void;
  onFinalize: () => void;
  isLoading: boolean;
  isDraft: boolean;
}

export function CarePlanWizardFooter({
  currentStep,
  totalSteps,
  onPrevious,
  onNext,
  onSaveDraft,
  onFinalize,
  isLoading,
  isDraft
}: CarePlanWizardFooterProps) {
  const isFirstStep = currentStep === 1;
  const isLastStep = currentStep === totalSteps;

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
            onClick={onSaveDraft}
            disabled={isLoading}
            className="flex items-center space-x-2 bg-blue-50 hover:bg-blue-100 text-blue-700 border-blue-200"
          >
            <Save className="h-4 w-4" />
            <span>{isDraft ? "Update Draft" : "Save as Draft"}</span>
          </Button>

          {isLastStep ? (
            <Button
              type="button"
              onClick={onFinalize}
              disabled={isLoading}
              className="flex items-center space-x-2 bg-green-600 hover:bg-green-700"
            >
              <CheckCircle className="h-4 w-4" />
              <span>{isLoading ? "Finalizing..." : "Finalize Care Plan"}</span>
            </Button>
          ) : (
            <Button
              type="button"
              onClick={onNext}
              disabled={isLoading}
              className="flex items-center space-x-2"
            >
              <span>Next</span>
              <ArrowRight className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>

      <div className="mt-3 text-center">
        <p className="text-sm text-gray-500">
          Step {currentStep} of {totalSteps}
          {isDraft && <span className="text-amber-600 ml-2">(Draft Mode - All changes are automatically saved)</span>}
          {isLastStep && !isDraft && <span className="text-green-600 ml-2">Ready to finalize</span>}
        </p>
      </div>
    </div>
  );
}

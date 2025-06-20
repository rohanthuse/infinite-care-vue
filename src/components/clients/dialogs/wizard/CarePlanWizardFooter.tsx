
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
    <div className="border-t bg-white px-6 py-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Button
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
            variant="outline"
            onClick={onSaveDraft}
            disabled={isLoading}
            className="flex items-center space-x-2"
          >
            <Save className="h-4 w-4" />
            <span>{isDraft ? "Update Draft" : "Save as Draft"}</span>
          </Button>

          {isLastStep ? (
            <Button
              onClick={onFinalize}
              disabled={isLoading}
              className="flex items-center space-x-2 bg-green-600 hover:bg-green-700"
            >
              <CheckCircle className="h-4 w-4" />
              <span>{isLoading ? "Finalizing..." : "Finalize Care Plan"}</span>
            </Button>
          ) : (
            <Button
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
          Step {currentStep} of {totalSteps} - 
          {isDraft && <span className="text-amber-600 ml-1">(Draft)</span>}
          {isLastStep && <span className="text-green-600 ml-1">Ready to finalize</span>}
        </p>
      </div>
    </div>
  );
}

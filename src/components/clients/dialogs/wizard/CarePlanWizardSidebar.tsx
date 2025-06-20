
import React from "react";
import { CheckCircle, Circle, Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import { Progress } from "@/components/ui/progress";

interface Step {
  id: number;
  name: string;
  description: string;
}

interface CarePlanWizardSidebarProps {
  steps: Step[];
  currentStep: number;
  completedSteps: number[];
  onStepClick: (stepNumber: number) => void;
  completionPercentage: number;
}

export function CarePlanWizardSidebar({
  steps,
  currentStep,
  completedSteps,
  onStepClick,
  completionPercentage
}: CarePlanWizardSidebarProps) {
  return (
    <div className="w-80 bg-gray-50 border-r p-6 overflow-y-auto">
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Care Plan Progress</h3>
        <div className="space-y-2">
          <div className="flex justify-between text-sm text-gray-600">
            <span>Overall Completion</span>
            <span>{completionPercentage}%</span>
          </div>
          <Progress value={completionPercentage} className="h-2" />
        </div>
      </div>

      <div className="space-y-2">
        {steps.map((step) => {
          const isCompleted = completedSteps.includes(step.id);
          const isCurrent = currentStep === step.id;
          
          return (
            <button
              key={step.id}
              onClick={() => onStepClick(step.id)}
              className={cn(
                "w-full text-left p-3 rounded-lg border transition-all duration-200 hover:shadow-sm",
                isCurrent 
                  ? "bg-blue-50 border-blue-200 shadow-sm" 
                  : isCompleted
                  ? "bg-green-50 border-green-200 hover:bg-green-100"
                  : "bg-white border-gray-200 hover:bg-gray-50"
              )}
            >
              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0 mt-0.5">
                  {isCompleted ? (
                    <CheckCircle className="h-5 w-5 text-green-600" />
                  ) : isCurrent ? (
                    <Clock className="h-5 w-5 text-blue-600" />
                  ) : (
                    <Circle className="h-5 w-5 text-gray-400" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className={cn(
                    "text-sm font-medium",
                    isCurrent 
                      ? "text-blue-900" 
                      : isCompleted 
                      ? "text-green-900" 
                      : "text-gray-700"
                  )}>
                    {step.name}
                  </div>
                  <div className={cn(
                    "text-xs mt-1",
                    isCurrent 
                      ? "text-blue-600" 
                      : isCompleted 
                      ? "text-green-600" 
                      : "text-gray-500"
                  )}>
                    {step.description}
                  </div>
                </div>
              </div>
            </button>
          );
        })}
      </div>

      <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
        <div className="text-sm text-blue-800">
          <div className="font-medium mb-1">💡 Tip</div>
          <div>You can navigate freely between steps. All changes are automatically saved as drafts.</div>
        </div>
      </div>
    </div>
  );
}

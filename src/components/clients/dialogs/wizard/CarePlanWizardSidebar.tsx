
import React from "react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { CheckCircle, Circle, Clock } from "lucide-react";
import { cn } from "@/lib/utils";

interface WizardStep {
  id: number;
  name: string;
  description: string;
}

interface CarePlanWizardSidebarProps {
  steps: WizardStep[];
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
  const getStepIcon = (stepNumber: number) => {
    if (completedSteps.includes(stepNumber)) {
      return <CheckCircle className="h-5 w-5 text-green-600" />;
    } else if (stepNumber === currentStep) {
      return <Clock className="h-5 w-5 text-blue-600" />;
    } else {
      return <Circle className="h-5 w-5 text-gray-400" />;
    }
  };

  const getStepStatus = (stepNumber: number) => {
    if (completedSteps.includes(stepNumber)) return "completed";
    if (stepNumber === currentStep) return "current";
    if (stepNumber < currentStep) return "available";
    return "upcoming";
  };

  return (
    <div className="w-80 bg-gray-50 border-r p-6 overflow-y-auto">
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          Care Plan Creation
        </h3>
        <div className="space-y-2">
          <div className="flex justify-between text-sm text-gray-600">
            <span>Progress</span>
            <span>{completionPercentage}%</span>
          </div>
          <Progress value={completionPercentage} className="h-2" />
        </div>
      </div>

      <nav className="space-y-2">
        {steps.map((step) => {
          const status = getStepStatus(step.id);
          const isClickable = status === "completed" || status === "current" || status === "available";
          
          return (
            <Button
              key={step.id}
              variant="ghost"
              className={cn(
                "w-full justify-start h-auto p-3 text-left",
                status === "current" && "bg-blue-50 border border-blue-200",
                status === "completed" && "bg-green-50",
                !isClickable && "opacity-50 cursor-not-allowed"
              )}
              onClick={() => isClickable && onStepClick(step.id)}
              disabled={!isClickable}
            >
              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0 mt-0.5">
                  {getStepIcon(step.id)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-2">
                    <span className="text-xs font-medium text-gray-500">
                      Step {step.id}
                    </span>
                  </div>
                  <div className={cn(
                    "font-medium",
                    status === "current" && "text-blue-900",
                    status === "completed" && "text-green-900",
                    status === "upcoming" && "text-gray-500"
                  )}>
                    {step.name}
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    {step.description}
                  </div>
                </div>
              </div>
            </Button>
          );
        })}
      </nav>

      <div className="mt-6 pt-6 border-t border-gray-200">
        <div className="text-xs text-gray-500 mb-2">
          Quick Actions
        </div>
        <div className="space-y-2">
          <Button variant="outline" size="sm" className="w-full justify-start">
            Save as Template
          </Button>
          <Button variant="outline" size="sm" className="w-full justify-start">
            Import from Client
          </Button>
        </div>
      </div>
    </div>
  );
}


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
    <div className="w-72 xl:w-80 bg-muted border-r border-border p-4 xl:p-6 overflow-y-auto h-full">
      <div className="mb-4 xl:mb-6">
        <h3 className="text-base xl:text-lg font-semibold text-foreground mb-2">Care Plan Progress</h3>
        <div className="space-y-2">
          <div className="flex justify-between text-xs xl:text-sm text-muted-foreground">
            <span>Overall Completion</span>
            <span>{completionPercentage}%</span>
          </div>
          <Progress value={completionPercentage} className="h-2" />
        </div>
      </div>

      <div className="space-y-1 xl:space-y-2">
        {steps.map((step) => {
          const isCompleted = completedSteps.includes(step.id);
          const isCurrent = currentStep === step.id;
          
          return (
            <button
              key={step.id}
              onClick={() => onStepClick(step.id)}
              className={cn(
                "w-full text-left p-2 xl:p-3 rounded-lg border transition-all duration-200 hover:shadow-sm",
                isCurrent 
                  ? "bg-primary/10 border-primary/20 shadow-sm" 
                  : isCompleted
                  ? "bg-green-500/10 border-green-500/20 hover:bg-green-500/15"
                  : "bg-card border-border hover:bg-muted/50"
              )}
            >
              <div className="flex items-start space-x-2 xl:space-x-3">
                <div className="flex-shrink-0 mt-0.5">
                  {isCompleted ? (
                    <CheckCircle className="h-4 w-4 xl:h-5 xl:w-5 text-green-600" />
                  ) : isCurrent ? (
                    <Clock className="h-4 w-4 xl:h-5 xl:w-5 text-primary" />
                  ) : (
                    <Circle className="h-4 w-4 xl:h-5 xl:w-5 text-muted-foreground" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className={cn(
                    "text-xs xl:text-sm font-medium leading-tight",
                    isCurrent 
                      ? "text-primary" 
                      : isCompleted 
                      ? "text-green-700 dark:text-green-400" 
                      : "text-foreground"
                  )}>
                    {step.name}
                  </div>
                  <div className={cn(
                    "text-xs mt-1 leading-tight hidden xl:block",
                    isCurrent 
                      ? "text-primary/80" 
                      : isCompleted 
                      ? "text-green-600 dark:text-green-500" 
                      : "text-muted-foreground"
                  )}>
                    {step.description}
                  </div>
                </div>
              </div>
            </button>
          );
        })}
      </div>

      <div className="mt-4 xl:mt-6 p-3 xl:p-4 bg-primary/10 rounded-lg border border-primary/20">
        <div className="text-xs xl:text-sm text-primary">
          <div className="font-medium mb-1">💡 Tip</div>
          <div className="leading-tight">You can navigate freely between steps. All changes are automatically saved as drafts.</div>
        </div>
      </div>
    </div>
  );
}

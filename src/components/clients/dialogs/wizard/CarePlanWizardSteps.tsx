
import React from "react";
import { UseFormReturn } from "react-hook-form";
import { WizardErrorBoundary } from "./WizardErrorBoundary";
import { WizardStep1BasicInfo } from "./steps/WizardStep1BasicInfo";
import { WizardStep2PersonalInfo } from "./steps/WizardStep2PersonalInfo";
import { WizardStep3AboutMe } from "./steps/WizardStep3AboutMe";
import { WizardStep4MedicalInfo } from "./steps/WizardStep4MedicalInfo";
import { WizardStep5AdminMedication } from "./steps/WizardStep5AdminMedication";
import { WizardStep5Goals } from "./steps/WizardStep5Goals";
import { WizardStep6Activities } from "./steps/WizardStep6Activities";
import { WizardStep7PersonalCare } from "./steps/WizardStep7PersonalCare";
import WizardStep8Dietary from "./steps/WizardStep8Dietary";
import { WizardStep9RiskAssessments } from "./steps/WizardStep9RiskAssessments";
import { WizardStep10Equipment } from "./steps/WizardStep10Equipment";
import { WizardStep11ServicePlans } from "./steps/WizardStep11ServicePlans";
import { WizardStep12ServiceActions } from "./steps/WizardStep12ServiceActions";
import { WizardStep13Documents } from "./steps/WizardStep13Documents";
import { WizardStep14Review } from "./steps/WizardStep14Review";

interface CarePlanWizardStepsProps {
  currentStep: number;
  form: UseFormReturn<any>;
  clientId: string;
}

export function CarePlanWizardSteps({ currentStep, form, clientId }: CarePlanWizardStepsProps) {
  const renderStep = () => {
    // Log current step for debugging
    console.log(`Rendering step ${currentStep}`, {
      formValues: form.getValues(),
      currentStep
    });

    switch (currentStep) {
      case 1:
        return <WizardStep1BasicInfo form={form} />;
      case 2:
        return <WizardStep2PersonalInfo form={form} />;
      case 3:
        return <WizardStep3AboutMe form={form} />;
      case 4:
        return <WizardStep4MedicalInfo form={form} />;
      case 5:
        return <WizardStep5AdminMedication form={form} />;
      case 6:
        return <WizardStep5Goals form={form} />;
      case 7:
        return <WizardStep6Activities form={form} />;
      case 8:
        return <WizardStep7PersonalCare form={form} />;
      case 9:
        return <WizardStep8Dietary form={form} />;
      case 10:
        return <WizardStep9RiskAssessments form={form} />;
      case 11:
        return <WizardStep10Equipment form={form} />;
      case 12:
        return <WizardStep11ServicePlans form={form} />;
      case 13:
        return <WizardStep12ServiceActions form={form} />;
      case 14:
        return <WizardStep13Documents form={form} clientId={clientId} />;
      case 15:
        return <WizardStep14Review form={form} />;
      default:
        console.warn(`Unknown step: ${currentStep}, defaulting to step 1`);
        return <WizardStep1BasicInfo form={form} />;
    }
  };

  return (
    <div className="space-y-6">
      <WizardErrorBoundary 
        stepNumber={currentStep}
        onRetry={() => {
          // Force re-render by updating form state
          const currentValues = form.getValues();
          form.reset(currentValues);
        }}
      >
        {renderStep()}
      </WizardErrorBoundary>
    </div>
  );
}

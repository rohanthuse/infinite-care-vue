
import React from "react";
import { UseFormReturn } from "react-hook-form";
import { WizardErrorBoundary } from "./WizardErrorBoundary";
import { WizardStep1BasicInfo } from "./steps/WizardStep1BasicInfo";
import { WizardStep3AboutMe } from "./steps/WizardStep3AboutMe";

import { WizardStep4MedicalInfo } from "./steps/WizardStep4MedicalInfo";
import { WizardStepNews2Monitoring } from "./steps/WizardStepNews2Monitoring";
import { WizardStepMedication } from "./steps/WizardStepMedication";
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
import { WizardStepConsent } from "./steps/WizardStepConsent";
import { WizardStep14Review } from "./steps/WizardStep14Review";
import { BehaviorSupportTab } from "@/components/care/tabs/BehaviorSupportTab";
import { EducationDevelopmentTab } from "@/components/care/tabs/EducationDevelopmentTab";
import { SafeguardingRisksTab } from "@/components/care/tabs/SafeguardingRisksTab";

interface CarePlanWizardStepsProps {
  currentStep: number;
  form: UseFormReturn<any>;
  clientId: string;
  effectiveCarePlanId?: string;
  filteredSteps?: any[];
}

export function CarePlanWizardSteps({ currentStep, form, clientId, effectiveCarePlanId, filteredSteps }: CarePlanWizardStepsProps) {
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
        return <WizardStep3AboutMe form={form} />;
      case 3:
        return <WizardStep4MedicalInfo form={form} effectiveCarePlanId={effectiveCarePlanId} />;
      case 4:
        return <WizardStepNews2Monitoring form={form} />;
      case 5:
        return <WizardStepMedication form={form} effectiveCarePlanId={effectiveCarePlanId} />;
      case 6:
        return <WizardStep5AdminMedication form={form} />;
      case 7:
        return <WizardStep5Goals form={form} />;
      case 8:
        return <WizardStep6Activities form={form} />;
      case 9:
        return <WizardStep7PersonalCare form={form} />;
      case 10:
        return <WizardStep8Dietary form={form} clientId={clientId} />;
      case 11:
        return <WizardStep9RiskAssessments form={form} />;
      case 12:
        return <WizardStep10Equipment form={form} />;
      case 13:
        return <WizardStep11ServicePlans form={form} clientId={clientId} />;
      case 14:
        return <WizardStep12ServiceActions form={form} />;
      case 15:
        return <WizardStep13Documents form={form} clientId={clientId} />;
      case 16:
        return <WizardStepConsent form={form} />;
      case 17:
        return <BehaviorSupportTab clientId={clientId} clientName="" />;
      case 18:
        return <EducationDevelopmentTab clientId={clientId} clientName="" />;
      case 19:
        return <SafeguardingRisksTab clientId={clientId} clientName="" />;
      case 20:
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

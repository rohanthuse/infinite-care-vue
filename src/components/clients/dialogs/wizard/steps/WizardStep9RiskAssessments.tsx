
import React from "react";
import { UseFormReturn } from "react-hook-form";

interface WizardStep9RiskAssessmentsProps {
  form: UseFormReturn<any>;
}

export function WizardStep9RiskAssessments({ form }: WizardStep9RiskAssessmentsProps) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold text-gray-900 mb-2">Risk Assessments</h2>
        <p className="text-gray-600">Safety risks and mitigation strategies.</p>
      </div>
      <div className="text-center py-8 text-gray-500">
        <p>Risk assessments form coming soon...</p>
      </div>
    </div>
  );
}

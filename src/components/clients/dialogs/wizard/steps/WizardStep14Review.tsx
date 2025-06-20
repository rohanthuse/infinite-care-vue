
import React from "react";
import { UseFormReturn } from "react-hook-form";

interface WizardStep14ReviewProps {
  form: UseFormReturn<any>;
}

export function WizardStep14Review({ form }: WizardStep14ReviewProps) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold text-gray-900 mb-2">Review & Finalize</h2>
        <p className="text-gray-600">Review all information and finalize the care plan.</p>
      </div>
      <div className="text-center py-8 text-gray-500">
        <p>Review form coming soon...</p>
      </div>
    </div>
  );
}

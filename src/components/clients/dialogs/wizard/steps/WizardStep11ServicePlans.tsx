
import React from "react";
import { UseFormReturn } from "react-hook-form";

interface WizardStep11ServicePlansProps {
  form: UseFormReturn<any>;
}

export function WizardStep11ServicePlans({ form }: WizardStep11ServicePlansProps) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold text-gray-900 mb-2">Service Plans</h2>
        <p className="text-gray-600">Overall care coordination and service planning.</p>
      </div>
      <div className="text-center py-8 text-gray-500">
        <p>Service plans form coming soon...</p>
      </div>
    </div>
  );
}

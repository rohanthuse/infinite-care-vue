
import React from "react";
import { UseFormReturn } from "react-hook-form";

interface WizardStep12ServiceActionsProps {
  form: UseFormReturn<any>;
}

export function WizardStep12ServiceActions({ form }: WizardStep12ServiceActionsProps) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold text-gray-900 mb-2">Service Actions</h2>
        <p className="text-gray-600">Specific interventions and care actions.</p>
      </div>
      <div className="text-center py-8 text-gray-500">
        <p>Service actions form coming soon...</p>
      </div>
    </div>
  );
}

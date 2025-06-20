
import React from "react";
import { UseFormReturn } from "react-hook-form";

interface WizardStep5GoalsProps {
  form: UseFormReturn<any>;
}

export function WizardStep5Goals({ form }: WizardStep5GoalsProps) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold text-gray-900 mb-2">Care Goals</h2>
        <p className="text-gray-600">Set objectives and outcomes for the care plan.</p>
      </div>
      <div className="text-center py-8 text-gray-500">
        <p>Goals form coming soon...</p>
      </div>
    </div>
  );
}

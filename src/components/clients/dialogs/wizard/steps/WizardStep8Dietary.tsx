
import React from "react";
import { UseFormReturn } from "react-hook-form";

interface WizardStep8DietaryProps {
  form: UseFormReturn<any>;
}

export function WizardStep8Dietary({ form }: WizardStep8DietaryProps) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold text-gray-900 mb-2">Dietary Requirements</h2>
        <p className="text-gray-600">Nutrition needs, restrictions, and meal preferences.</p>
      </div>
      <div className="text-center py-8 text-gray-500">
        <p>Dietary form coming soon...</p>
      </div>
    </div>
  );
}

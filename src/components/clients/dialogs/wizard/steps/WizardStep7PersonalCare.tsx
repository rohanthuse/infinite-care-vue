
import React from "react";
import { UseFormReturn } from "react-hook-form";

interface WizardStep7PersonalCareProps {
  form: UseFormReturn<any>;
}

export function WizardStep7PersonalCare({ form }: WizardStep7PersonalCareProps) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold text-gray-900 mb-2">Personal Care</h2>
        <p className="text-gray-600">Daily living assistance and personal care needs.</p>
      </div>
      <div className="text-center py-8 text-gray-500">
        <p>Personal care form coming soon...</p>
      </div>
    </div>
  );
}

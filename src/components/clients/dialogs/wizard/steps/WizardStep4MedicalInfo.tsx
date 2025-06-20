
import React from "react";
import { UseFormReturn } from "react-hook-form";

interface WizardStep4MedicalInfoProps {
  form: UseFormReturn<any>;
}

export function WizardStep4MedicalInfo({ form }: WizardStep4MedicalInfoProps) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold text-gray-900 mb-2">Medical Information</h2>
        <p className="text-gray-600">Medical conditions, medications, and health status.</p>
      </div>
      <div className="text-center py-8 text-gray-500">
        <p>Medical information form coming soon...</p>
      </div>
    </div>
  );
}

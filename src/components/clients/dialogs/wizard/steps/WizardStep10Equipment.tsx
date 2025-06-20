
import React from "react";
import { UseFormReturn } from "react-hook-form";

interface WizardStep10EquipmentProps {
  form: UseFormReturn<any>;
}

export function WizardStep10Equipment({ form }: WizardStep10EquipmentProps) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold text-gray-900 mb-2">Equipment</h2>
        <p className="text-gray-600">Assistive devices and maintenance schedules.</p>
      </div>
      <div className="text-center py-8 text-gray-500">
        <p>Equipment form coming soon...</p>
      </div>
    </div>
  );
}

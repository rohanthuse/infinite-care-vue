
import React from "react";
import { UseFormReturn } from "react-hook-form";

interface WizardStep6ActivitiesProps {
  form: UseFormReturn<any>;
}

export function WizardStep6Activities({ form }: WizardStep6ActivitiesProps) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold text-gray-900 mb-2">Activities</h2>
        <p className="text-gray-600">Scheduled tasks and care activities.</p>
      </div>
      <div className="text-center py-8 text-gray-500">
        <p>Activities form coming soon...</p>
      </div>
    </div>
  );
}

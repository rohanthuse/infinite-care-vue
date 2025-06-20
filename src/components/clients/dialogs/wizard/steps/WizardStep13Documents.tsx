
import React from "react";
import { UseFormReturn } from "react-hook-form";

interface WizardStep13DocumentsProps {
  form: UseFormReturn<any>;
  clientId: string;
}

export function WizardStep13Documents({ form, clientId }: WizardStep13DocumentsProps) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold text-gray-900 mb-2">Documents</h2>
        <p className="text-gray-600">Upload and organize care plan documentation.</p>
      </div>
      <div className="text-center py-8 text-gray-500">
        <p>Document upload form coming soon...</p>
      </div>
    </div>
  );
}

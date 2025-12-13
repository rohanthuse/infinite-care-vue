import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface MedicalExpenseFieldsProps {
  formData: {
    medical_item: string;
    provider_name: string;
    prescription_ref: string;
  };
  onFieldChange: (field: string, value: string) => void;
}

export const MedicalExpenseFields: React.FC<MedicalExpenseFieldsProps> = ({
  formData,
  onFieldChange,
}) => {
  return (
    <div className="space-y-4">
      {/* Medical Item / Service Name */}
      <div className="space-y-2">
        <Label htmlFor="medical_item">Medical Item / Service Name *</Label>
        <Input
          id="medical_item"
          placeholder="Enter medical item or service"
          value={formData.medical_item}
          onChange={(e) => onFieldChange('medical_item', e.target.value)}
        />
      </div>

      {/* Provider / Pharmacy Name */}
      <div className="space-y-2">
        <Label htmlFor="provider_name">Provider / Pharmacy Name *</Label>
        <Input
          id="provider_name"
          placeholder="Enter provider or pharmacy name"
          value={formData.provider_name}
          onChange={(e) => onFieldChange('provider_name', e.target.value)}
        />
      </div>

      {/* Prescription Reference */}
      <div className="space-y-2">
        <Label htmlFor="prescription_ref">Prescription Reference (optional)</Label>
        <Input
          id="prescription_ref"
          placeholder="Enter prescription reference if applicable"
          value={formData.prescription_ref}
          onChange={(e) => onFieldChange('prescription_ref', e.target.value)}
        />
      </div>
    </div>
  );
};

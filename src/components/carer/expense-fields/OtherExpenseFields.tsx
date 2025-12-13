import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

interface OtherExpenseFieldsProps {
  formData: {
    expense_title: string;
    other_description: string;
  };
  onFieldChange: (field: string, value: string) => void;
}

export const OtherExpenseFields: React.FC<OtherExpenseFieldsProps> = ({
  formData,
  onFieldChange,
}) => {
  return (
    <div className="space-y-4">
      {/* Expense Title */}
      <div className="space-y-2">
        <Label htmlFor="expense_title">Expense Title *</Label>
        <Input
          id="expense_title"
          placeholder="Enter a title for this expense"
          value={formData.expense_title}
          onChange={(e) => onFieldChange('expense_title', e.target.value)}
        />
      </div>

      {/* Description */}
      <div className="space-y-2">
        <Label htmlFor="other_description">Description *</Label>
        <Textarea
          id="other_description"
          placeholder="Describe the expense in detail..."
          value={formData.other_description}
          onChange={(e) => onFieldChange('other_description', e.target.value)}
          rows={3}
        />
      </div>
    </div>
  );
};

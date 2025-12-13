import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface MealExpenseFieldsProps {
  formData: {
    meal_type: string;
    vendor_name: string;
    meal_date: string;
  };
  onFieldChange: (field: string, value: string) => void;
}

const MEAL_TYPES = [
  { value: 'breakfast', label: 'Breakfast' },
  { value: 'lunch', label: 'Lunch' },
  { value: 'dinner', label: 'Dinner' },
  { value: 'snack', label: 'Snack' },
];

export const MealExpenseFields: React.FC<MealExpenseFieldsProps> = ({
  formData,
  onFieldChange,
}) => {
  return (
    <div className="space-y-4">
      {/* Meal Type */}
      <div className="space-y-2">
        <Label htmlFor="meal_type">Meal Type *</Label>
        <Select
          value={formData.meal_type}
          onValueChange={(value) => onFieldChange('meal_type', value)}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select meal type" />
          </SelectTrigger>
          <SelectContent>
            {MEAL_TYPES.map((type) => (
              <SelectItem key={type.value} value={type.value}>
                {type.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Vendor / Restaurant Name */}
      <div className="space-y-2">
        <Label htmlFor="vendor_name">Vendor / Restaurant Name *</Label>
        <Input
          id="vendor_name"
          placeholder="Enter vendor or restaurant name"
          value={formData.vendor_name}
          onChange={(e) => onFieldChange('vendor_name', e.target.value)}
        />
      </div>

      {/* Meal Date */}
      <div className="space-y-2">
        <Label htmlFor="meal_date">Meal Date</Label>
        <Input
          id="meal_date"
          type="date"
          value={formData.meal_date}
          onChange={(e) => onFieldChange('meal_date', e.target.value)}
        />
      </div>
    </div>
  );
};

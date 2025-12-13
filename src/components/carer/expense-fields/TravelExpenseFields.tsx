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

interface TravelExpenseFieldsProps {
  formData: {
    travel_mode: string;
    from_location: string;
    to_location: string;
    distance: string;
    distance_unit: string;
    rate_per_unit: string;
  };
  onFieldChange: (field: string, value: string) => void;
  onAmountChange: (amount: string) => void;
}

const TRAVEL_MODES = [
  { value: 'car', label: 'Car' },
  { value: 'taxi', label: 'Taxi' },
  { value: 'bus', label: 'Bus' },
  { value: 'train', label: 'Train' },
  { value: 'other', label: 'Other' },
];

export const TravelExpenseFields: React.FC<TravelExpenseFieldsProps> = ({
  formData,
  onFieldChange,
  onAmountChange,
}) => {
  // Auto-calculate total amount when distance or rate changes
  React.useEffect(() => {
    const distance = parseFloat(formData.distance) || 0;
    const rate = parseFloat(formData.rate_per_unit) || 0;
    if (distance > 0 && rate > 0) {
      const total = (distance * rate).toFixed(2);
      onAmountChange(total);
    }
  }, [formData.distance, formData.rate_per_unit, onAmountChange]);

  return (
    <div className="space-y-4">
      {/* Travel Mode */}
      <div className="space-y-2">
        <Label htmlFor="travel_mode">Travel Mode *</Label>
        <Select
          value={formData.travel_mode}
          onValueChange={(value) => onFieldChange('travel_mode', value)}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select travel mode" />
          </SelectTrigger>
          <SelectContent>
            {TRAVEL_MODES.map((mode) => (
              <SelectItem key={mode.value} value={mode.value}>
                {mode.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* From Location */}
      <div className="space-y-2">
        <Label htmlFor="from_location">From Location *</Label>
        <Input
          id="from_location"
          placeholder="Starting point"
          value={formData.from_location}
          onChange={(e) => onFieldChange('from_location', e.target.value)}
        />
      </div>

      {/* To Location */}
      <div className="space-y-2">
        <Label htmlFor="to_location">To Location *</Label>
        <Input
          id="to_location"
          placeholder="Destination"
          value={formData.to_location}
          onChange={(e) => onFieldChange('to_location', e.target.value)}
        />
      </div>

      {/* Distance */}
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2">
          <Label htmlFor="distance">Distance *</Label>
          <Input
            id="distance"
            type="number"
            step="0.1"
            min="0"
            placeholder="0.0"
            value={formData.distance}
            onChange={(e) => onFieldChange('distance', e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="distance_unit">Unit</Label>
          <Select
            value={formData.distance_unit}
            onValueChange={(value) => onFieldChange('distance_unit', value)}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="miles">Miles</SelectItem>
              <SelectItem value="km">Kilometers</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Rate per Unit */}
      <div className="space-y-2">
        <Label htmlFor="rate_per_unit">
          Rate per {formData.distance_unit === 'km' ? 'km' : 'mile'} (£)
        </Label>
        <Input
          id="rate_per_unit"
          type="number"
          step="0.01"
          min="0"
          placeholder="0.45"
          value={formData.rate_per_unit}
          onChange={(e) => onFieldChange('rate_per_unit', e.target.value)}
        />
        <p className="text-xs text-muted-foreground">
          Leave blank to enter total amount manually
        </p>
      </div>
    </div>
  );
};

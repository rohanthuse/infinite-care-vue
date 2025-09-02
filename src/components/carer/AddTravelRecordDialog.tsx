import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useCarerTravelManagement } from '@/hooks/useCarerTravelManagement';
import { useToast } from '@/hooks/use-toast';
import { useTravelRateOptions } from '@/hooks/useParameterOptions';

interface AddTravelRecordDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const AddTravelRecordDialog = ({ open, onOpenChange }: AddTravelRecordDialogProps) => {
  const { toast } = useToast();
  const { createTravelRecord } = useCarerTravelManagement();
  const { data: travelRateOptions = [], isLoading: loadingRates } = useTravelRateOptions();

  const [formData, setFormData] = useState({
    travel_date: new Date().toISOString().split('T')[0],
    start_location: '',
    end_location: '',
    distance_miles: '',
    travel_time_minutes: '',
    vehicle_type: 'personal_car',
    purpose: '',
    notes: '',
    travel_rate_type: '', // Selected travel rate type
    mileage_rate: '0.45', // Will be updated based on selected rate
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      await createTravelRecord.mutateAsync({
        ...formData,
        distance_miles: parseFloat(formData.distance_miles),
        travel_time_minutes: formData.travel_time_minutes ? parseInt(formData.travel_time_minutes) : undefined,
        mileage_rate: parseFloat(formData.mileage_rate),
      });

      toast({
        title: "Success",
        description: "Travel record submitted for approval",
      });

      onOpenChange(false);
      setFormData({
        travel_date: new Date().toISOString().split('T')[0],
        start_location: '',
        end_location: '',
        distance_miles: '',
        travel_time_minutes: '',
        vehicle_type: 'personal_car',
        purpose: '',
        notes: '',
        travel_rate_type: '',
        mileage_rate: '0.45',
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to submit travel record",
        variant: "destructive",
      });
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleRateTypeChange = (rateType: string) => {
    const selectedRate = travelRateOptions.find(rate => rate.value === rateType);
    if (selectedRate) {
      // Extract rate from label if it contains rate information
      // Assuming the label format is like "Standard Rate (£0.45/mile)"
      const rateMatch = selectedRate.label.match(/£?(\d+\.?\d*)/);
      const rate = rateMatch ? rateMatch[1] : '0.45';
      
      setFormData(prev => ({
        ...prev,
        travel_rate_type: rateType,
        mileage_rate: rate
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        travel_rate_type: rateType
      }));
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Submit Travel & Mileage Claim</DialogTitle>
          <DialogDescription>
            Submit your travel expenses for approval and reimbursement.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="travel_date">Travel Date</Label>
              <Input
                id="travel_date"
                type="date"
                value={formData.travel_date}
                onChange={(e) => handleInputChange('travel_date', e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="travel_rate_type">Travel Rate Type</Label>
              <Select
                value={formData.travel_rate_type}
                onValueChange={handleRateTypeChange}
                disabled={loadingRates}
              >
                <SelectTrigger>
                  <SelectValue placeholder={loadingRates ? "Loading rates..." : "Select travel rate"} />
                </SelectTrigger>
                <SelectContent>
                  {travelRateOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="vehicle_type">Vehicle Type</Label>
              <Select
                value={formData.vehicle_type}
                onValueChange={(value) => handleInputChange('vehicle_type', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select vehicle type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="personal_car">Personal Car</SelectItem>
                  <SelectItem value="company_car">Company Car</SelectItem>
                  <SelectItem value="motorcycle">Motorcycle</SelectItem>
                  <SelectItem value="bicycle">Bicycle</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="start_location">Start Location</Label>
              <Input
                id="start_location"
                value={formData.start_location}
                onChange={(e) => handleInputChange('start_location', e.target.value)}
                placeholder="Enter start address"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="end_location">End Location</Label>
              <Input
                id="end_location"
                value={formData.end_location}
                onChange={(e) => handleInputChange('end_location', e.target.value)}
                placeholder="Enter destination address"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="distance_miles">Distance (miles)</Label>
              <Input
                id="distance_miles"
                type="number"
                step="0.1"
                value={formData.distance_miles}
                onChange={(e) => handleInputChange('distance_miles', e.target.value)}
                placeholder="0.0"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="travel_time_minutes">Travel Time (minutes)</Label>
              <Input
                id="travel_time_minutes"
                type="number"
                value={formData.travel_time_minutes}
                onChange={(e) => handleInputChange('travel_time_minutes', e.target.value)}
                placeholder="Optional"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="mileage_rate">Rate per mile (£)</Label>
              <Input
                id="mileage_rate"
                type="number"
                step="0.01"
                value={formData.mileage_rate}
                onChange={(e) => handleInputChange('mileage_rate', e.target.value)}
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="purpose">Purpose of Travel</Label>
            <Input
              id="purpose"
              value={formData.purpose}
              onChange={(e) => handleInputChange('purpose', e.target.value)}
              placeholder="e.g., Client visit, training, meeting"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Additional Notes</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => handleInputChange('notes', e.target.value)}
              placeholder="Any additional details or context"
            />
          </div>

          <div className="flex justify-end space-x-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={createTravelRecord.isPending}
            >
              {createTravelRecord.isPending ? 'Submitting...' : 'Submit Travel Claim'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
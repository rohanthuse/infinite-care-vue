import { useState, useEffect } from 'react';
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
  SafeSelectWrapper as Select,
  SafeSelectContent as SelectContent,
  SafeSelectItem as SelectItem,
  SafeSelectTrigger as SelectTrigger,
  SafeSelectValue as SelectValue,
} from '@/components/ui/safe-select';
import { useCarerTravelEdit } from '@/hooks/useCarerTravelEdit';
import { useTravelRateOptions } from '@/hooks/useParameterOptions';
import { useCarerAssignedClients } from '@/hooks/useCarerAssignedClients';
import { MyTravelRecord } from '@/hooks/useMyTravel';

interface EditTravelRecordDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  travel: MyTravelRecord | null;
}

export const EditTravelRecordDialog = ({ open, onOpenChange, travel }: EditTravelRecordDialogProps) => {
  const { updateTravel } = useCarerTravelEdit();
  const { data: travelRateOptions = [], isLoading: loadingRates } = useTravelRateOptions();
  const { data: assignedClients = [], isLoading: loadingClients } = useCarerAssignedClients();

  const [formData, setFormData] = useState({
    travel_date: '',
    client_id: '',
    start_location: '',
    end_location: '',
    distance_miles: '',
    travel_time_minutes: '',
    vehicle_type: 'personal_car',
    purpose: '',
    notes: '',
    mileage_rate: '0.45',
  });

  useEffect(() => {
    if (travel) {
      setFormData({
        travel_date: travel.travel_date,
        client_id: '', // Would need client_id in travel record type
        start_location: travel.start_location,
        end_location: travel.end_location,
        distance_miles: travel.distance_miles.toString(),
        travel_time_minutes: travel.travel_time_minutes?.toString() || '',
        vehicle_type: travel.vehicle_type,
        purpose: travel.purpose,
        notes: travel.notes || '',
        mileage_rate: travel.mileage_rate.toString(),
      });
    }
  }, [travel]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!travel) return;

    try {
      await updateTravel.mutateAsync({
        id: travel.id,
        travel_date: formData.travel_date,
        client_id: formData.client_id || undefined,
        start_location: formData.start_location,
        end_location: formData.end_location,
        distance_miles: parseFloat(formData.distance_miles),
        travel_time_minutes: formData.travel_time_minutes ? parseInt(formData.travel_time_minutes) : undefined,
        vehicle_type: formData.vehicle_type,
        purpose: formData.purpose,
        notes: formData.notes || undefined,
        mileage_rate: parseFloat(formData.mileage_rate),
      });
      onOpenChange(false);
    } catch (error) {
      // Error handled in hook
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  if (!travel) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Travel Record</DialogTitle>
          <DialogDescription>
            Update your pending travel claim details.
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
              <Label htmlFor="client_id">Client (Optional)</Label>
              <Select
                value={formData.client_id || 'none'}
                onValueChange={(value) => handleInputChange('client_id', value === 'none' ? '' : value)}
                disabled={loadingClients}
              >
                <SelectTrigger>
                  <SelectValue placeholder={loadingClients ? "Loading..." : "Select client"} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No specific client</SelectItem>
                  {assignedClients.map((client) => (
                    <SelectItem key={client.id} value={client.id}>
                      {client.first_name} {client.last_name}
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
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="personal_car">Personal Car</SelectItem>
                  <SelectItem value="company_car">Company Car</SelectItem>
                  <SelectItem value="motorcycle">Motorcycle</SelectItem>
                  <SelectItem value="bicycle">Bicycle</SelectItem>
                </SelectContent>
              </Select>
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

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="start_location">Start Location</Label>
              <Input
                id="start_location"
                value={formData.start_location}
                onChange={(e) => handleInputChange('start_location', e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="end_location">End Location</Label>
              <Input
                id="end_location"
                value={formData.end_location}
                onChange={(e) => handleInputChange('end_location', e.target.value)}
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="distance_miles">Distance (miles)</Label>
              <Input
                id="distance_miles"
                type="number"
                step="0.1"
                value={formData.distance_miles}
                onChange={(e) => handleInputChange('distance_miles', e.target.value)}
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
          </div>

          <div className="space-y-2">
            <Label htmlFor="purpose">Purpose of Travel</Label>
            <Input
              id="purpose"
              value={formData.purpose}
              onChange={(e) => handleInputChange('purpose', e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Additional Notes</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => handleInputChange('notes', e.target.value)}
            />
          </div>

          <div className="flex justify-end space-x-2 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={updateTravel.isPending}>
              {updateTravel.isPending ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Plus, Upload } from 'lucide-react';
import { useCreateClientVaccination } from '@/hooks/useClientVaccinations';
import { toast } from 'sonner';

interface VaccinationDialogProps {
  clientId: string;
}

export const VaccinationDialog: React.FC<VaccinationDialogProps> = ({ clientId }) => {
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState({
    vaccination_name: '',
    vaccination_date: '',
    interval_months: '',
    notes: ''
  });

  const createMutation = useCreateClientVaccination();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      await createMutation.mutateAsync({
        client_id: clientId,
        vaccination_name: formData.vaccination_name,
        vaccination_date: formData.vaccination_date,
        interval_months: formData.interval_months ? parseInt(formData.interval_months) : undefined,
        next_due_date: formData.interval_months && formData.vaccination_date 
          ? new Date(new Date(formData.vaccination_date).setMonth(
              new Date(formData.vaccination_date).getMonth() + parseInt(formData.interval_months)
            )).toISOString().split('T')[0]
          : undefined,
        notes: formData.notes || undefined
      });

      toast.success('Vaccination record created successfully');
      setOpen(false);
      setFormData({
        vaccination_name: '',
        vaccination_date: '',
        interval_months: '',
        notes: ''
      });
    } catch (error) {
      toast.error('Failed to create vaccination record');
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Add Vaccination
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Add Vaccination Record</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="vaccination_name">Vaccination Name *</Label>
            <Input
              id="vaccination_name"
              value={formData.vaccination_name}
              onChange={(e) => handleInputChange('vaccination_name', e.target.value)}
              placeholder="e.g., COVID-19, Flu, Hepatitis B"
              required
            />
          </div>
          
          <div>
            <Label htmlFor="vaccination_date">Date *</Label>
            <Input
              id="vaccination_date"
              type="date"
              value={formData.vaccination_date}
              onChange={(e) => handleInputChange('vaccination_date', e.target.value)}
              required
            />
          </div>
          
          <div>
            <Label htmlFor="interval_months">Interval (months)</Label>
            <Input
              id="interval_months"
              type="number"
              value={formData.interval_months}
              onChange={(e) => handleInputChange('interval_months', e.target.value)}
              placeholder="e.g., 12 for annual"
            />
          </div>
          
          <div>
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => handleInputChange('notes', e.target.value)}
              placeholder="Additional notes..."
              rows={3}
            />
          </div>
          
          <div className="flex items-center gap-2 p-3 border border-dashed rounded-lg">
            <Upload className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">File upload coming soon</span>
          </div>
          
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={createMutation.isPending}>
              {createMutation.isPending ? 'Adding...' : 'Add Vaccination'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
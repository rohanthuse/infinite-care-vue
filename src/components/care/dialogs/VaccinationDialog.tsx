import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Plus, Upload, X, FileText } from 'lucide-react';
import { useCreateClientVaccination } from '@/hooks/useClientVaccinations';
import { useVaccinationFileUpload } from '@/hooks/useVaccinationFileUpload';
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
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const createMutation = useCreateClientVaccination();
  const { uploadVaccinationFile, uploading, progress } = useVaccinationFileUpload();

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file size (10MB max)
      if (file.size > 10 * 1024 * 1024) {
        toast.error('File size must be less than 10MB');
        return;
      }
      setSelectedFile(file);
      toast.success(`Selected: ${file.name}`);
    }
  };

  const handleRemoveFile = () => {
    setSelectedFile(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      let filePath: string | undefined;

      // Upload file first if selected
      if (selectedFile) {
        filePath = await uploadVaccinationFile(selectedFile, { clientId });
      }

      // Create vaccination record with file path
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
        notes: formData.notes || undefined,
        file_path: filePath
      });

      // Reset form
      setOpen(false);
      setFormData({
        vaccination_name: '',
        vaccination_date: '',
        interval_months: '',
        notes: ''
      });
      setSelectedFile(null);
    } catch (error) {
      console.error('Failed to create vaccination record:', error);
      // Error toast is already handled by the mutation
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Add Vaccination
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
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

          {/* File Upload Section */}
          <div className="space-y-2">
            <Label>Vaccination Document (Optional)</Label>
            
            {!selectedFile ? (
              <div className="border-2 border-dashed rounded-lg p-4 text-center hover:border-primary/50 transition-colors">
                <input
                  type="file"
                  id="vaccination-file"
                  className="hidden"
                  accept=".pdf,.jpg,.jpeg,.png,.webp,.doc,.docx"
                  onChange={handleFileSelect}
                  disabled={uploading}
                />
                <label htmlFor="vaccination-file" className="cursor-pointer">
                  <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                  <p className="text-sm font-medium text-gray-700">Click to upload document</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    PDF, Images, or Word documents (max 10MB)
                  </p>
                </label>
              </div>
            ) : (
              <div className="flex items-center justify-between p-3 border rounded-lg bg-gray-50">
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  <FileText className="h-5 w-5 text-primary flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{selectedFile.name}</p>
                    <p className="text-xs text-muted-foreground">{formatFileSize(selectedFile.size)}</p>
                  </div>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={handleRemoveFile}
                  className="flex-shrink-0"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            )}

            {uploading && (
              <div className="space-y-1">
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>Uploading...</span>
                  <span>{progress}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-primary h-2 rounded-full transition-all"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>
            )}
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={createMutation.isPending || uploading}
            >
              {createMutation.isPending || uploading ? 'Adding...' : 'Add Vaccination'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};


import React, { useState, useEffect } from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

interface EditMedicalInfoDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (data: any) => void;
  medicalData?: any;
  isLoading?: boolean;
}

export const EditMedicalInfoDialog: React.FC<EditMedicalInfoDialogProps> = ({
  open,
  onOpenChange,
  onSave,
  medicalData,
  isLoading = false,
}) => {
  const [formData, setFormData] = useState({
    allergies: "",
    medical_conditions: "",
    current_medications: "",
    medical_history: "",
    mobility_status: "",
    cognitive_status: "",
    mental_health_status: "",
    communication_needs: "",
    sensory_impairments: "",
  });

  useEffect(() => {
    if (medicalData && open) {
      setFormData({
        allergies: Array.isArray(medicalData.allergies) ? medicalData.allergies.join(', ') : "",
        medical_conditions: Array.isArray(medicalData.medical_conditions) ? medicalData.medical_conditions.join(', ') : "",
        current_medications: Array.isArray(medicalData.current_medications) ? medicalData.current_medications.join(', ') : "",
        medical_history: medicalData.medical_history || "",
        mobility_status: medicalData.mobility_status || "",
        cognitive_status: medicalData.cognitive_status || "",
        mental_health_status: medicalData.mental_health_status || "",
        communication_needs: medicalData.communication_needs || "",
        sensory_impairments: Array.isArray(medicalData.sensory_impairments) ? medicalData.sensory_impairments.join(', ') : "",
      });
    }
  }, [medicalData, open]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Convert comma-separated strings back to arrays
    const processedData = {
      allergies: formData.allergies.split(',').map(item => item.trim()).filter(Boolean),
      medical_conditions: formData.medical_conditions.split(',').map(item => item.trim()).filter(Boolean),
      current_medications: formData.current_medications.split(',').map(item => item.trim()).filter(Boolean),
      medical_history: formData.medical_history,
      mobility_status: formData.mobility_status,
      cognitive_status: formData.cognitive_status,
      mental_health_status: formData.mental_health_status,
      communication_needs: formData.communication_needs,
      sensory_impairments: formData.sensory_impairments.split(',').map(item => item.trim()).filter(Boolean),
    };
    
    onSave(processedData);
  };

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-auto">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-semibold">Edit Medical Information</h2>
          <Button variant="ghost" size="icon" onClick={() => onOpenChange(false)}>
            <X className="h-5 w-5" />
          </Button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="space-y-2">
            <Label htmlFor="allergies">Allergies (comma-separated)</Label>
            <Input
              id="allergies"
              value={formData.allergies}
              onChange={(e) => handleChange('allergies', e.target.value)}
              placeholder="e.g., Peanuts, Shellfish, Penicillin"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="medical_conditions">Medical Conditions (comma-separated)</Label>
            <Input
              id="medical_conditions"
              value={formData.medical_conditions}
              onChange={(e) => handleChange('medical_conditions', e.target.value)}
              placeholder="e.g., Diabetes, Hypertension, Arthritis"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="current_medications">Current Diagnosis (comma-separated)</Label>
            <Input
              id="current_medications"
              value={formData.current_medications}
              onChange={(e) => handleChange('current_medications', e.target.value)}
              placeholder="e.g., Diabetes Type 2, Hypertension, Arthritis"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="medical_history">Medical History</Label>
            <Textarea
              id="medical_history"
              value={formData.medical_history}
              onChange={(e) => handleChange('medical_history', e.target.value)}
              rows={3}
              placeholder="Detailed medical history..."
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="mobility_status">Mobility Status</Label>
              <Input
                id="mobility_status"
                value={formData.mobility_status}
                onChange={(e) => handleChange('mobility_status', e.target.value)}
                placeholder="e.g., Independent, Uses walker"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="cognitive_status">Cognitive Status</Label>
              <Input
                id="cognitive_status"
                value={formData.cognitive_status}
                onChange={(e) => handleChange('cognitive_status', e.target.value)}
                placeholder="e.g., Normal, Mild impairment"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="mental_health_status">Mental Health Status</Label>
              <Input
                id="mental_health_status"
                value={formData.mental_health_status}
                onChange={(e) => handleChange('mental_health_status', e.target.value)}
                placeholder="e.g., Stable, Anxiety"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="communication_needs">Communication Needs</Label>
              <Input
                id="communication_needs"
                value={formData.communication_needs}
                onChange={(e) => handleChange('communication_needs', e.target.value)}
                placeholder="e.g., Hearing aid, Large print"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="sensory_impairments">Sensory Impairments (comma-separated)</Label>
            <Input
              id="sensory_impairments"
              value={formData.sensory_impairments}
              onChange={(e) => handleChange('sensory_impairments', e.target.value)}
              placeholder="e.g., Hearing loss, Vision impairment"
            />
          </div>

          <div className="flex justify-end space-x-2 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};


import React, { useState, useEffect } from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface EditMedicalInfoDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (data: any) => void;
  medicalInfo?: any;
  isLoading?: boolean;
}

export const EditMedicalInfoDialog: React.FC<EditMedicalInfoDialogProps> = ({
  open,
  onOpenChange,
  onSave,
  medicalInfo,
  isLoading = false,
}) => {
  console.log('[EditMedicalInfoDialog] Component rendered with props:', {
    open,
    medicalInfo,
    isLoading
  });

  const [formData, setFormData] = useState({
    allergies: [] as string[],
    medical_conditions: [] as string[],
    current_medications: [] as string[],
    medical_history: "",
    mobility_status: "",
    cognitive_status: "",
    communication_needs: "",
    sensory_impairments: [] as string[],
    mental_health_status: "",
  });

  const [newAllergy, setNewAllergy] = useState("");
  const [newCondition, setNewCondition] = useState("");
  const [newMedication, setNewMedication] = useState("");
  const [newImpairment, setNewImpairment] = useState("");

  useEffect(() => {
    console.log('[EditMedicalInfoDialog] useEffect triggered with medicalInfo:', medicalInfo);
    if (medicalInfo) {
      const newFormData = {
        allergies: medicalInfo.allergies || [],
        medical_conditions: medicalInfo.medical_conditions || [],
        current_medications: medicalInfo.current_medications || [],
        medical_history: medicalInfo.medical_history || "",
        mobility_status: medicalInfo.mobility_status || "",
        cognitive_status: medicalInfo.cognitive_status || "",
        communication_needs: medicalInfo.communication_needs || "",
        sensory_impairments: medicalInfo.sensory_impairments || [],
        mental_health_status: medicalInfo.mental_health_status || "",
      };
      console.log('[EditMedicalInfoDialog] Setting form data to:', newFormData);
      setFormData(newFormData);
    } else {
      console.log('[EditMedicalInfoDialog] No medical info provided, using default form data');
    }
  }, [medicalInfo]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('[EditMedicalInfoDialog] Form submitted with data:', formData);
    onSave(formData);
  };

  const addToArray = (field: string, value: string, setter: (value: string) => void) => {
    console.log('[EditMedicalInfoDialog] Adding to array:', { field, value });
    if (value.trim()) {
      setFormData(prev => ({
        ...prev,
        [field]: [...(prev[field as keyof typeof prev] as string[]), value.trim()]
      }));
      setter("");
    }
  };

  const removeFromArray = (field: string, index: number) => {
    console.log('[EditMedicalInfoDialog] Removing from array:', { field, index });
    setFormData(prev => ({
      ...prev,
      [field]: (prev[field as keyof typeof prev] as string[]).filter((_, i) => i !== index)
    }));
  };

  console.log('[EditMedicalInfoDialog] Current open state:', open);

  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-auto">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-semibold">Edit Medical Information</h2>
          <Button variant="ghost" size="icon" onClick={() => {
            console.log('[EditMedicalInfoDialog] Close button clicked');
            onOpenChange(false);
          }}>
            <X className="h-5 w-5" />
          </Button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Allergies */}
          <div className="space-y-3">
            <Label>Allergies</Label>
            <div className="flex gap-2">
              <Input
                value={newAllergy}
                onChange={(e) => setNewAllergy(e.target.value)}
                placeholder="Add allergy"
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addToArray('allergies', newAllergy, setNewAllergy))}
              />
              <Button type="button" onClick={() => addToArray('allergies', newAllergy, setNewAllergy)}>
                Add
              </Button>
            </div>
            <div className="flex flex-wrap gap-2">
              {formData.allergies.map((allergy, index) => (
                <span key={index} className="bg-red-100 text-red-800 px-2 py-1 rounded-md text-sm flex items-center gap-1">
                  {allergy}
                  <button type="button" onClick={() => removeFromArray('allergies', index)} className="text-red-600 hover:text-red-800">×</button>
                </span>
              ))}
            </div>
          </div>

          {/* Medical Conditions */}
          <div className="space-y-3">
            <Label>Medical Conditions</Label>
            <div className="flex gap-2">
              <Input
                value={newCondition}
                onChange={(e) => setNewCondition(e.target.value)}
                placeholder="Add medical condition"
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addToArray('medical_conditions', newCondition, setNewCondition))}
              />
              <Button type="button" onClick={() => addToArray('medical_conditions', newCondition, setNewCondition)}>
                Add
              </Button>
            </div>
            <div className="flex flex-wrap gap-2">
              {formData.medical_conditions.map((condition, index) => (
                <span key={index} className="bg-blue-100 text-blue-800 px-2 py-1 rounded-md text-sm flex items-center gap-1">
                  {condition}
                  <button type="button" onClick={() => removeFromArray('medical_conditions', index)} className="text-blue-600 hover:text-blue-800">×</button>
                </span>
              ))}
            </div>
          </div>

          {/* Current Medications */}
          <div className="space-y-3">
            <Label>Current Medications</Label>
            <div className="flex gap-2">
              <Input
                value={newMedication}
                onChange={(e) => setNewMedication(e.target.value)}
                placeholder="Add medication"
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addToArray('current_medications', newMedication, setNewMedication))}
              />
              <Button type="button" onClick={() => addToArray('current_medications', newMedication, setNewMedication)}>
                Add
              </Button>
            </div>
            <div className="flex flex-wrap gap-2">
              {formData.current_medications.map((medication, index) => (
                <span key={index} className="bg-green-100 text-green-800 px-2 py-1 rounded-md text-sm flex items-center gap-1">
                  {medication}
                  <button type="button" onClick={() => removeFromArray('current_medications', index)} className="text-green-600 hover:text-green-800">×</button>
                </span>
              ))}
            </div>
          </div>

          {/* Medical History */}
          <div className="space-y-2">
            <Label htmlFor="medical_history">Medical History</Label>
            <Textarea
              id="medical_history"
              value={formData.medical_history}
              onChange={(e) => setFormData(prev => ({ ...prev, medical_history: e.target.value }))}
              placeholder="Enter medical history..."
              rows={3}
            />
          </div>

          {/* Mobility Status */}
          <div className="space-y-2">
            <Label htmlFor="mobility_status">Mobility Status</Label>
            <Select value={formData.mobility_status} onValueChange={(value) => setFormData(prev => ({ ...prev, mobility_status: value }))}>
              <SelectTrigger>
                <SelectValue placeholder="Select mobility status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="independent">Independent</SelectItem>
                <SelectItem value="assisted">Assisted</SelectItem>
                <SelectItem value="dependent">Dependent</SelectItem>
                <SelectItem value="wheelchair">Wheelchair</SelectItem>
                <SelectItem value="bedridden">Bedridden</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Cognitive Status */}
          <div className="space-y-2">
            <Label htmlFor="cognitive_status">Cognitive Status</Label>
            <Select value={formData.cognitive_status} onValueChange={(value) => setFormData(prev => ({ ...prev, cognitive_status: value }))}>
              <SelectTrigger>
                <SelectValue placeholder="Select cognitive status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="normal">Normal</SelectItem>
                <SelectItem value="mild-impairment">Mild Impairment</SelectItem>
                <SelectItem value="moderate-impairment">Moderate Impairment</SelectItem>
                <SelectItem value="severe-impairment">Severe Impairment</SelectItem>
                <SelectItem value="dementia">Dementia</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Communication Needs */}
          <div className="space-y-2">
            <Label htmlFor="communication_needs">Communication Needs</Label>
            <Textarea
              id="communication_needs"
              value={formData.communication_needs}
              onChange={(e) => setFormData(prev => ({ ...prev, communication_needs: e.target.value }))}
              placeholder="Describe communication needs..."
              rows={2}
            />
          </div>

          {/* Sensory Impairments */}
          <div className="space-y-3">
            <Label>Sensory Impairments</Label>
            <div className="flex gap-2">
              <Input
                value={newImpairment}
                onChange={(e) => setNewImpairment(e.target.value)}
                placeholder="Add sensory impairment"
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addToArray('sensory_impairments', newImpairment, setNewImpairment))}
              />
              <Button type="button" onClick={() => addToArray('sensory_impairments', newImpairment, setNewImpairment)}>
                Add
              </Button>
            </div>
            <div className="flex flex-wrap gap-2">
              {formData.sensory_impairments.map((impairment, index) => (
                <span key={index} className="bg-purple-100 text-purple-800 px-2 py-1 rounded-md text-sm flex items-center gap-1">
                  {impairment}
                  <button type="button" onClick={() => removeFromArray('sensory_impairments', index)} className="text-purple-600 hover:text-purple-800">×</button>
                </span>
              ))}
            </div>
          </div>

          {/* Mental Health Status */}
          <div className="space-y-2">
            <Label htmlFor="mental_health_status">Mental Health Status</Label>
            <Textarea
              id="mental_health_status"
              value={formData.mental_health_status}
              onChange={(e) => setFormData(prev => ({ ...prev, mental_health_status: e.target.value }))}
              placeholder="Describe mental health status..."
              rows={2}
            />
          </div>

          <div className="flex justify-end space-x-2 pt-4">
            <Button type="button" variant="outline" onClick={() => {
              console.log('[EditMedicalInfoDialog] Cancel button clicked');
              onOpenChange(false);
            }}>
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

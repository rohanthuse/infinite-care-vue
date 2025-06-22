
import React, { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { CalendarDays, Clock, UserPlus } from "lucide-react";
import { useCreateNews2Observation, CreateObservationData } from "@/hooks/useNews2Data";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface NewObservationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  patients: Array<{
    id: string;
    name: string;
    _raw?: any;
  }>;
  defaultPatientId?: string;
  onAddPatient?: () => void;
}

export function NewObservationDialog({ 
  open, 
  onOpenChange, 
  patients, 
  defaultPatientId,
  onAddPatient 
}: NewObservationDialogProps) {
  const [selectedPatientId, setSelectedPatientId] = useState(defaultPatientId || "");
  const [formData, setFormData] = useState<Partial<CreateObservationData>>({
    consciousness_level: 'A',
    supplemental_oxygen: false,
  });
  const [previewScore, setPreviewScore] = useState<any>(null);

  const createObservation = useCreateNews2Observation();

  // Calculate NEWS2 score preview
  const calculatePreviewScore = (data: Partial<CreateObservationData>) => {
    let total = 0;
    const scores: any = {};

    // Respiratory Rate scoring
    if (data.respiratory_rate !== undefined) {
      if (data.respiratory_rate <= 8) scores.respiratory = 3;
      else if (data.respiratory_rate <= 11) scores.respiratory = 1;
      else if (data.respiratory_rate <= 20) scores.respiratory = 0;
      else if (data.respiratory_rate <= 24) scores.respiratory = 2;
      else scores.respiratory = 3;
      total += scores.respiratory;
    }

    // Oxygen Saturation scoring
    if (data.oxygen_saturation !== undefined) {
      if (data.oxygen_saturation <= 91) scores.oxygen = 3;
      else if (data.oxygen_saturation <= 93) scores.oxygen = 2;
      else if (data.oxygen_saturation <= 95) scores.oxygen = 1;
      else scores.oxygen = 0;
      total += scores.oxygen;
    }

    // Supplemental Oxygen scoring
    if (data.supplemental_oxygen) {
      scores.suppOxygen = 2;
      total += 2;
    } else {
      scores.suppOxygen = 0;
    }

    // Blood Pressure scoring
    if (data.systolic_bp !== undefined) {
      if (data.systolic_bp <= 90) scores.bloodPressure = 3;
      else if (data.systolic_bp <= 100) scores.bloodPressure = 2;
      else if (data.systolic_bp <= 110) scores.bloodPressure = 1;
      else if (data.systolic_bp <= 219) scores.bloodPressure = 0;
      else scores.bloodPressure = 3;
      total += scores.bloodPressure;
    }

    // Pulse Rate scoring
    if (data.pulse_rate !== undefined) {
      if (data.pulse_rate <= 40) scores.pulse = 3;
      else if (data.pulse_rate <= 50) scores.pulse = 1;
      else if (data.pulse_rate <= 90) scores.pulse = 0;
      else if (data.pulse_rate <= 110) scores.pulse = 1;
      else if (data.pulse_rate <= 130) scores.pulse = 2;
      else scores.pulse = 3;
      total += scores.pulse;
    }

    // Consciousness Level scoring
    if (data.consciousness_level === 'V' || data.consciousness_level === 'P' || data.consciousness_level === 'U') {
      scores.consciousness = 3;
      total += 3;
    } else {
      scores.consciousness = 0;
    }

    // Temperature scoring
    if (data.temperature !== undefined) {
      if (data.temperature <= 35.0) scores.temperature = 3;
      else if (data.temperature <= 36.0) scores.temperature = 1;
      else if (data.temperature <= 38.0) scores.temperature = 0;
      else if (data.temperature <= 39.0) scores.temperature = 1;
      else scores.temperature = 2;
      total += scores.temperature;
    }

    const riskLevel = total >= 7 ? 'high' : total >= 5 ? 'medium' : 'low';

    return { total, scores, riskLevel };
  };

  // Update preview when form data changes
  React.useEffect(() => {
    const preview = calculatePreviewScore(formData);
    setPreviewScore(preview);
  }, [formData]);

  const handleInputChange = (field: keyof CreateObservationData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async () => {
    if (!selectedPatientId) {
      return;
    }

    const selectedPatient = patients.find(p => p.id === selectedPatientId);
    const news2PatientId = selectedPatient?._raw?.id || selectedPatientId;

    try {
      await createObservation.mutateAsync({
        news2_patient_id: news2PatientId,
        ...formData,
      } as CreateObservationData);
      
      // Reset form and close dialog
      setFormData({
        consciousness_level: 'A',
        supplemental_oxygen: false,
      });
      setSelectedPatientId("");
      onOpenChange(false);
    } catch (error) {
      console.error('Error submitting observation:', error);
    }
  };

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'high': return 'bg-red-500';
      case 'medium': return 'bg-orange-500';
      default: return 'bg-green-500';
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CalendarDays className="h-5 w-5" />
            Record NEWS2 Observation
          </DialogTitle>
          <DialogDescription>
            Enter vital signs and observations. The NEWS2 score will be calculated automatically.
          </DialogDescription>
        </DialogHeader>

        {patients.length === 0 ? (
          // No patients available
          <div className="py-12 text-center">
            <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-3">
              <UserPlus className="h-6 w-6 text-gray-500" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Patients Enrolled</h3>
            <p className="text-gray-500 mb-4">
              You need to add patients to NEWS2 monitoring before recording observations.
            </p>
            {onAddPatient && (
              <Button onClick={onAddPatient}>
                <UserPlus className="h-4 w-4 mr-2" />
                Add Patient to NEWS2
              </Button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Form Section */}
            <div className="lg:col-span-2 space-y-6">
              {/* Patient Selection */}
              <div className="space-y-2">
                <Label htmlFor="patient">Patient</Label>
                <Select value={selectedPatientId} onValueChange={setSelectedPatientId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a patient" />
                  </SelectTrigger>
                  <SelectContent>
                    {patients.map((patient) => (
                      <SelectItem key={patient.id} value={patient.id}>
                        {patient.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Vital Signs */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="respiratory_rate">Respiratory Rate (per min)</Label>
                  <Input
                    id="respiratory_rate"
                    type="number"
                    min="0"
                    max="60"
                    value={formData.respiratory_rate || ""}
                    onChange={(e) => handleInputChange('respiratory_rate', parseInt(e.target.value) || undefined)}
                    placeholder="e.g., 16"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="oxygen_saturation">Oxygen Saturation (%)</Label>
                  <Input
                    id="oxygen_saturation"
                    type="number"
                    min="0"
                    max="100"
                    value={formData.oxygen_saturation || ""}
                    onChange={(e) => handleInputChange('oxygen_saturation', parseInt(e.target.value) || undefined)}
                    placeholder="e.g., 98"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="systolic_bp">Systolic Blood Pressure (mmHg)</Label>
                  <Input
                    id="systolic_bp"
                    type="number"
                    min="0"
                    max="300"
                    value={formData.systolic_bp || ""}
                    onChange={(e) => handleInputChange('systolic_bp', parseInt(e.target.value) || undefined)}
                    placeholder="e.g., 120"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="pulse_rate">Pulse Rate (per min)</Label>
                  <Input
                    id="pulse_rate"
                    type="number"
                    min="0"
                    max="300"
                    value={formData.pulse_rate || ""}
                    onChange={(e) => handleInputChange('pulse_rate', parseInt(e.target.value) || undefined)}
                    placeholder="e.g., 72"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="temperature">Temperature (°C)</Label>
                  <Input
                    id="temperature"
                    type="number"
                    step="0.1"
                    min="30"
                    max="45"
                    value={formData.temperature || ""}
                    onChange={(e) => handleInputChange('temperature', parseFloat(e.target.value) || undefined)}
                    placeholder="e.g., 36.5"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="consciousness_level">Consciousness Level</Label>
                  <Select value={formData.consciousness_level} onValueChange={(value) => handleInputChange('consciousness_level', value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="A">A - Alert</SelectItem>
                      <SelectItem value="V">V - Voice</SelectItem>
                      <SelectItem value="P">P - Pain</SelectItem>
                      <SelectItem value="U">U - Unresponsive</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Supplemental Oxygen */}
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="supplemental_oxygen"
                  checked={formData.supplemental_oxygen}
                  onCheckedChange={(checked) => handleInputChange('supplemental_oxygen', checked)}
                />
                <Label htmlFor="supplemental_oxygen">Patient receiving supplemental oxygen</Label>
              </div>

              {/* Clinical Notes */}
              <div className="space-y-2">
                <Label htmlFor="clinical_notes">Clinical Notes</Label>
                <Textarea
                  id="clinical_notes"
                  value={formData.clinical_notes || ""}
                  onChange={(e) => handleInputChange('clinical_notes', e.target.value)}
                  placeholder="Enter any relevant clinical observations..."
                  rows={3}
                />
              </div>

              {/* Action Taken */}
              <div className="space-y-2">
                <Label htmlFor="action_taken">Action Taken</Label>
                <Textarea
                  id="action_taken"
                  value={formData.action_taken || ""}
                  onChange={(e) => handleInputChange('action_taken', e.target.value)}
                  placeholder="Describe any actions taken or planned..."
                  rows={2}
                />
              </div>
            </div>

            {/* Score Preview Section */}
            <div className="lg:col-span-1">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    NEWS2 Score Preview
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {previewScore && (
                    <>
                      <div className="text-center">
                        <div className={`w-16 h-16 rounded-full ${getRiskColor(previewScore.riskLevel)} text-white flex items-center justify-center font-bold text-2xl mx-auto mb-2`}>
                          {previewScore.total}
                        </div>
                        <Badge variant={previewScore.riskLevel === 'high' ? 'destructive' : previewScore.riskLevel === 'medium' ? 'default' : 'secondary'}>
                          {previewScore.riskLevel.toUpperCase()} RISK
                        </Badge>
                      </div>

                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span>Respiratory Rate:</span>
                          <span className="font-medium">{previewScore.scores.respiratory || 0}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Oxygen Saturation:</span>
                          <span className="font-medium">{previewScore.scores.oxygen || 0}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Supplemental O₂:</span>
                          <span className="font-medium">{previewScore.scores.suppOxygen || 0}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Blood Pressure:</span>
                          <span className="font-medium">{previewScore.scores.bloodPressure || 0}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Pulse Rate:</span>
                          <span className="font-medium">{previewScore.scores.pulse || 0}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Consciousness:</span>
                          <span className="font-medium">{previewScore.scores.consciousness || 0}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Temperature:</span>
                          <span className="font-medium">{previewScore.scores.temperature || 0}</span>
                        </div>
                        <hr />
                        <div className="flex justify-between font-bold">
                          <span>Total Score:</span>
                          <span>{previewScore.total}</span>
                        </div>
                      </div>

                      {previewScore.total >= 7 && (
                        <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                          <p className="text-red-800 text-sm font-medium">
                            ⚠️ HIGH RISK: Urgent clinical response required
                          </p>
                        </div>
                      )}

                      {previewScore.total >= 5 && previewScore.total < 7 && (
                        <div className="bg-orange-50 border border-orange-200 rounded-lg p-3">
                          <p className="text-orange-800 text-sm font-medium">
                            ⚡ MEDIUM RISK: Increased monitoring required
                          </p>
                        </div>
                      )}
                    </>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        {patients.length > 0 && (
          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleSubmit} 
              disabled={!selectedPatientId || createObservation.isPending}
            >
              {createObservation.isPending ? "Recording..." : "Record Observation"}
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

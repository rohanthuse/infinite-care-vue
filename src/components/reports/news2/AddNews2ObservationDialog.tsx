
import React, { useState, useEffect } from "react";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogFooter,
  DialogDescription 
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { 
  News2Patient, 
  News2Observation, 
  calculateNews2Score,
  getScoreStatusColor
} from "@/data/mockNews2Data";
import { Badge } from "@/components/ui/badge";

interface AddNews2ObservationDialogProps {
  patient: News2Patient;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onObservationAdded: (observation: News2Observation) => void;
}

export const AddNews2ObservationDialog: React.FC<AddNews2ObservationDialogProps> = ({
  patient,
  open,
  onOpenChange,
  onObservationAdded
}) => {
  const [respiratoryRate, setRespiratoryRate] = useState(16);
  const [oxygenSaturation, setOxygenSaturation] = useState(96);
  const [supplementalOxygen, setSupplementalOxygen] = useState(false);
  const [systolicBP, setSystolicBP] = useState(120);
  const [pulseRate, setPulseRate] = useState(75);
  const [consciousness, setConsciousness] = useState<'A' | 'V' | 'P' | 'U'>('A');
  const [temperature, setTemperature] = useState(37.0);
  const [notes, setNotes] = useState("");
  const [score, setScore] = useState(0);
  
  useEffect(() => {
    // Calculate the NEWS2 score whenever any parameter changes
    const newScore = calculateNews2Score(
      respiratoryRate,
      oxygenSaturation,
      supplementalOxygen,
      systolicBP,
      pulseRate,
      consciousness,
      temperature
    );
    setScore(newScore);
  }, [respiratoryRate, oxygenSaturation, supplementalOxygen, systolicBP, pulseRate, consciousness, temperature]);
  
  const handleSubmit = () => {
    // Create new observation object
    const newObservation: News2Observation = {
      id: `NO${Math.floor(Math.random() * 10000).toString().padStart(4, '0')}`,
      patientId: patient.id,
      timestamp: new Date(),
      respiratoryRate,
      oxygenSaturation,
      supplementalOxygen,
      systolicBP,
      pulseRate,
      consciousness,
      temperature,
      score,
      notes: notes || undefined,
      recordedBy: "Current User" // Would come from authentication in a real app
    };
    
    // Call the callback with the new observation
    onObservationAdded(newObservation);
    
    // Show success message
    toast.success("Observation recorded successfully");
    
    // Close the dialog
    onOpenChange(false);
    
    // Reset form
    resetForm();
  };
  
  const resetForm = () => {
    setRespiratoryRate(16);
    setOxygenSaturation(96);
    setSupplementalOxygen(false);
    setSystolicBP(120);
    setPulseRate(75);
    setConsciousness('A');
    setTemperature(37.0);
    setNotes("");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Add New Observation</DialogTitle>
          <DialogDescription>
            Record new NEWS2 observation for patient {patient.name}
          </DialogDescription>
        </DialogHeader>
        
        <div className="grid gap-6 py-4">
          {/* Current score display */}
          <div className="bg-gray-50 p-4 rounded-md border flex items-center justify-between">
            <div>
              <h3 className="font-medium">Calculated NEWS2 Score</h3>
              <p className="text-sm text-gray-500">Based on entered parameters</p>
            </div>
            <div className="flex items-center gap-2">
              <Badge className={`text-xl px-3 py-1 ${getScoreStatusColor(score)}`}>
                {score}
              </Badge>
              <div className="text-sm">
                {score >= 7 ? (
                  <span className="text-red-600 font-medium">High Risk</span>
                ) : score >= 5 ? (
                  <span className="text-amber-600 font-medium">Medium Risk</span>
                ) : (
                  <span className="text-green-600 font-medium">Low Risk</span>
                )}
              </div>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Respiratory Rate */}
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <Label htmlFor="respiratory-rate">Respiratory Rate</Label>
                <div className="text-sm font-medium">{respiratoryRate} breaths/min</div>
              </div>
              <Slider
                id="respiratory-rate"
                min={8}
                max={40}
                step={1}
                value={[respiratoryRate]}
                onValueChange={(values) => setRespiratoryRate(values[0])}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-gray-500">
                <span>&lt;8</span>
                <span>9-11</span>
                <span>12-20</span>
                <span>21-24</span>
                <span>&gt;25</span>
              </div>
              <div className="flex justify-between text-xs text-gray-500">
                <span>3</span>
                <span>1</span>
                <span>0</span>
                <span>2</span>
                <span>3</span>
              </div>
            </div>
            
            {/* Oxygen Saturation */}
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <Label htmlFor="oxygen-saturation">SpO2</Label>
                <div className="text-sm font-medium">{oxygenSaturation}%</div>
              </div>
              <Slider
                id="oxygen-saturation"
                min={85}
                max={100}
                step={1}
                value={[oxygenSaturation]}
                onValueChange={(values) => setOxygenSaturation(values[0])}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-gray-500">
                <span>&lt;91</span>
                <span>92-93</span>
                <span>94-95</span>
                <span>&gt;96</span>
              </div>
              <div className="flex justify-between text-xs text-gray-500">
                <span>3</span>
                <span>2</span>
                <span>1</span>
                <span>0</span>
              </div>
            </div>
            
            {/* Supplemental Oxygen */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="supplemental-oxygen">Supplemental Oxygen</Label>
                <Switch 
                  id="supplemental-oxygen"
                  checked={supplementalOxygen}
                  onCheckedChange={setSupplementalOxygen}
                />
              </div>
              <div className="text-xs text-gray-500">
                {supplementalOxygen ? 'Yes (+2 points)' : 'No (0 points)'}
              </div>
            </div>
            
            {/* Systolic Blood Pressure */}
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <Label htmlFor="systolic-bp">Systolic BP</Label>
                <div className="text-sm font-medium">{systolicBP} mmHg</div>
              </div>
              <Slider
                id="systolic-bp"
                min={80}
                max={230}
                step={1}
                value={[systolicBP]}
                onValueChange={(values) => setSystolicBP(values[0])}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-gray-500">
                <span>&lt;90</span>
                <span>91-100</span>
                <span>101-110</span>
                <span>111-219</span>
                <span>&gt;220</span>
              </div>
              <div className="flex justify-between text-xs text-gray-500">
                <span>3</span>
                <span>2</span>
                <span>1</span>
                <span>0</span>
                <span>3</span>
              </div>
            </div>
            
            {/* Pulse Rate */}
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <Label htmlFor="pulse-rate">Pulse Rate</Label>
                <div className="text-sm font-medium">{pulseRate} bpm</div>
              </div>
              <Slider
                id="pulse-rate"
                min={30}
                max={170}
                step={1}
                value={[pulseRate]}
                onValueChange={(values) => setPulseRate(values[0])}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-gray-500">
                <span>&lt;40</span>
                <span>41-50</span>
                <span>51-90</span>
                <span>91-110</span>
                <span>111-130</span>
                <span>&gt;131</span>
              </div>
              <div className="flex justify-between text-xs text-gray-500">
                <span>3</span>
                <span>1</span>
                <span>0</span>
                <span>1</span>
                <span>2</span>
                <span>3</span>
              </div>
            </div>
            
            {/* Consciousness */}
            <div className="space-y-3">
              <Label>Level of Consciousness (AVPU)</Label>
              <RadioGroup value={consciousness} onValueChange={(value) => setConsciousness(value as 'A' | 'V' | 'P' | 'U')}>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="A" id="A" />
                  <Label htmlFor="A" className="cursor-pointer">Alert</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="V" id="V" />
                  <Label htmlFor="V" className="cursor-pointer">Voice</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="P" id="P" />
                  <Label htmlFor="P" className="cursor-pointer">Pain</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="U" id="U" />
                  <Label htmlFor="U" className="cursor-pointer">Unresponsive</Label>
                </div>
              </RadioGroup>
              <div className="text-xs text-gray-500">
                {consciousness === 'A' ? 'Alert (0 points)' : 'V/P/U (3 points)'}
              </div>
            </div>
            
            {/* Temperature */}
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <Label htmlFor="temperature">Temperature</Label>
                <div className="text-sm font-medium">{temperature.toFixed(1)} °C</div>
              </div>
              <Slider
                id="temperature"
                min={35.0}
                max={40.0}
                step={0.1}
                value={[temperature]}
                onValueChange={(values) => setTemperature(values[0])}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-gray-500">
                <span>&lt;35.0</span>
                <span>35.1-36.0</span>
                <span>36.1-38.0</span>
                <span>38.1-39.0</span>
                <span>&gt;39.1</span>
              </div>
              <div className="flex justify-between text-xs text-gray-500">
                <span>3</span>
                <span>1</span>
                <span>0</span>
                <span>1</span>
                <span>2</span>
              </div>
            </div>
          </div>
          
          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes">Notes (Optional)</Label>
            <Textarea 
              id="notes"
              placeholder="Add any additional observations or notes..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
            />
          </div>
          
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleSubmit} className="bg-blue-600 hover:bg-blue-700">Save Observation</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

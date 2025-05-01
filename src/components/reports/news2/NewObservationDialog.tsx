
import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { News2Patient } from "./news2Types";
import { toast } from "sonner";

interface NewObservationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  patients: News2Patient[];
  defaultPatientId?: string;
}

export const NewObservationDialog: React.FC<NewObservationDialogProps> = ({
  open,
  onOpenChange,
  patients,
  defaultPatientId,
}) => {
  const [selectedPatientId, setSelectedPatientId] = useState(defaultPatientId || "");
  const [respRate, setRespRate] = useState("16");
  const [spo2, setSpo2] = useState("98");
  const [o2Therapy, setO2Therapy] = useState(false);
  const [systolicBP, setSystolicBP] = useState("120");
  const [pulse, setPulse] = useState("75");
  const [consciousness, setConsciousness] = useState("A");
  const [temperature, setTemperature] = useState("36.7");
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Reset form when dialog opens
  React.useEffect(() => {
    if (open) {
      if (defaultPatientId) {
        setSelectedPatientId(defaultPatientId);
      }
    }
  }, [open, defaultPatientId]);
  
  const calculateNews2Score = (): number => {
    let score = 0;
    
    // Respiratory rate
    const rr = parseInt(respRate);
    if (rr <= 8) score += 3;
    else if (rr <= 11) score += 1;
    else if (rr >= 21 && rr <= 24) score += 2;
    else if (rr >= 25) score += 3;
    
    // SpO2
    const s = parseInt(spo2);
    if (s <= 91) score += 3;
    else if (s <= 93) score += 2;
    else if (s <= 95) score += 1;
    
    // O2 therapy
    if (o2Therapy) score += 2;
    
    // Systolic BP
    const sbp = parseInt(systolicBP);
    if (sbp <= 90) score += 3;
    else if (sbp <= 100) score += 2;
    else if (sbp <= 110) score += 1;
    else if (sbp >= 220) score += 3;
    
    // Pulse
    const p = parseInt(pulse);
    if (p <= 40) score += 3;
    else if (p <= 50) score += 1;
    else if (p >= 91 && p <= 110) score += 1;
    else if (p >= 111 && p <= 130) score += 2;
    else if (p >= 131) score += 3;
    
    // Consciousness
    if (consciousness !== "A") score += 3;
    
    // Temperature
    const t = parseFloat(temperature);
    if (t <= 35.0) score += 3;
    else if (t <= 36.0) score += 1;
    else if (t >= 39.1) score += 1;
    else if (t >= 39.2) score += 2;
    
    return score;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    // Validate form
    if (!selectedPatientId || !respRate || !spo2 || !systolicBP || !pulse || !consciousness || !temperature) {
      toast.error("Please complete all required fields", {
        description: "All observation values are required to calculate a NEWS2 score"
      });
      setIsSubmitting(false);
      return;
    }
    
    // Calculate score
    const score = calculateNews2Score();
    
    // Show success message based on score severity
    let toastType: "success" | "warning" | "error" = "success";
    let toastTitle = "Observation recorded";
    let toastDescription = `NEWS2 score calculated: ${score}`;
    
    if (score >= 7) {
      toastType = "error";
      toastTitle = "High Risk NEWS2 Score";
      toastDescription = `Score: ${score}. Urgent clinical response required.`;
    } else if (score >= 5) {
      toastType = "warning";
      toastTitle = "Medium Risk NEWS2 Score";
      toastDescription = `Score: ${score}. Urgent ward-based response required.`;
    }
    
    setTimeout(() => {
      setIsSubmitting(false);
      onOpenChange(false);
      
      if (toastType === "success") {
        toast.success(toastTitle, {
          description: toastDescription
        });
      } else if (toastType === "warning") {
        toast.warning(toastTitle, {
          description: toastDescription
        });
      } else {
        toast.error(toastTitle, {
          description: toastDescription
        });
      }
    }, 1000);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Record NEWS2 Observation</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4 mt-2">
          {/* Patient Selection */}
          <div className="space-y-2">
            <Label htmlFor="patient">Patient</Label>
            <Select
              value={selectedPatientId}
              onValueChange={setSelectedPatientId}
              required
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a patient" />
              </SelectTrigger>
              <SelectContent>
                {patients.map(patient => (
                  <SelectItem key={patient.id} value={patient.id}>
                    {patient.name} (ID: {patient.id})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            {/* Respiratory Rate */}
            <div className="space-y-2">
              <Label htmlFor="respRate">Respiratory Rate</Label>
              <div className="flex items-center">
                <Input
                  id="respRate"
                  type="number"
                  min="1"
                  max="60"
                  value={respRate}
                  onChange={(e) => setRespRate(e.target.value)}
                  required
                />
                <span className="ml-2 text-sm text-gray-500">breaths/min</span>
              </div>
            </div>
            
            {/* SpO2 */}
            <div className="space-y-2">
              <Label htmlFor="spo2">SpO₂</Label>
              <div className="flex items-center">
                <Input
                  id="spo2"
                  type="number"
                  min="70"
                  max="100"
                  value={spo2}
                  onChange={(e) => setSpo2(e.target.value)}
                  required
                />
                <span className="ml-2 text-sm text-gray-500">%</span>
              </div>
            </div>
            
            {/* O2 Therapy */}
            <div className="space-y-2 col-span-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="o2Therapy" className="cursor-pointer">
                  On Supplemental Oxygen
                </Label>
                <Switch
                  id="o2Therapy"
                  checked={o2Therapy}
                  onCheckedChange={setO2Therapy}
                />
              </div>
            </div>
            
            {/* Systolic BP */}
            <div className="space-y-2">
              <Label htmlFor="systolicBP">Systolic BP</Label>
              <div className="flex items-center">
                <Input
                  id="systolicBP"
                  type="number"
                  min="50"
                  max="250"
                  value={systolicBP}
                  onChange={(e) => setSystolicBP(e.target.value)}
                  required
                />
                <span className="ml-2 text-sm text-gray-500">mmHg</span>
              </div>
            </div>
            
            {/* Pulse */}
            <div className="space-y-2">
              <Label htmlFor="pulse">Pulse</Label>
              <div className="flex items-center">
                <Input
                  id="pulse"
                  type="number"
                  min="30"
                  max="200"
                  value={pulse}
                  onChange={(e) => setPulse(e.target.value)}
                  required
                />
                <span className="ml-2 text-sm text-gray-500">bpm</span>
              </div>
            </div>
            
            {/* Consciousness */}
            <div className="space-y-2">
              <Label htmlFor="consciousness">ACVPU</Label>
              <Select
                value={consciousness}
                onValueChange={setConsciousness}
                required
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select ACVPU" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="A">Alert (A)</SelectItem>
                  <SelectItem value="C">Confused (C)</SelectItem>
                  <SelectItem value="V">Voice (V)</SelectItem>
                  <SelectItem value="P">Pain (P)</SelectItem>
                  <SelectItem value="U">Unresponsive (U)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            {/* Temperature */}
            <div className="space-y-2">
              <Label htmlFor="temperature">Temperature</Label>
              <div className="flex items-center">
                <Input
                  id="temperature"
                  type="number"
                  step="0.1"
                  min="30"
                  max="44"
                  value={temperature}
                  onChange={(e) => setTemperature(e.target.value)}
                  required
                />
                <span className="ml-2 text-sm text-gray-500">°C</span>
              </div>
            </div>
          </div>
          
          <DialogFooter className="pt-4">
            <Button
              type="submit"
              disabled={isSubmitting}
              className="w-full"
            >
              {isSubmitting ? "Saving..." : "Save Observation"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

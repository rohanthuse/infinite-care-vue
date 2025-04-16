
import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { News2Patient, News2Observation } from "./news2Types";
import { toast } from "sonner";
import { v4 as uuidv4 } from "uuid";

interface NewObservationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  patients: News2Patient[];
  defaultPatientId?: string;
}

export function NewObservationDialog({
  open,
  onOpenChange,
  patients,
  defaultPatientId,
}: NewObservationDialogProps) {
  const [patientId, setPatientId] = useState(defaultPatientId || "");
  const [respRate, setRespRate] = useState("16");
  const [spo2, setSpo2] = useState("96");
  const [systolicBP, setSystolicBP] = useState("120");
  const [pulse, setPulse] = useState("75");
  const [consciousness, setConsciousness] = useState("A");
  const [temperature, setTemperature] = useState("37.0");
  const [o2Therapy, setO2Therapy] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const consciousnessLevels = [
    { value: "A", label: "Alert" },
    { value: "V", label: "Responds to Voice" },
    { value: "P", label: "Responds to Pain" },
    { value: "U", label: "Unresponsive" },
  ];

  const calculateScore = () => {
    let score = 0;
    const rr = parseFloat(respRate);
    const o2 = parseFloat(spo2);
    const bp = parseFloat(systolicBP);
    const p = parseFloat(pulse);
    const temp = parseFloat(temperature);

    // Respiratory rate scoring
    if (rr <= 8) score += 3;
    else if (rr <= 11) score += 1;
    else if (rr >= 21 && rr <= 24) score += 2;
    else if (rr >= 25) score += 3;

    // SpO2 scoring
    if (o2 <= 91) score += 3;
    else if (o2 <= 93) score += 2;
    else if (o2 <= 95) score += 1;

    // Supplemental oxygen
    if (o2Therapy) score += 2;

    // Systolic BP scoring
    if (bp <= 90) score += 3;
    else if (bp <= 100) score += 2;
    else if (bp <= 110) score += 1;
    else if (bp >= 220) score += 3;

    // Pulse scoring
    if (p <= 40) score += 3;
    else if (p <= 50) score += 1;
    else if (p >= 91 && p <= 110) score += 1;
    else if (p >= 111 && p <= 130) score += 2;
    else if (p >= 131) score += 3;

    // Consciousness scoring
    if (consciousness !== "A") score += 3;

    // Temperature scoring
    if (temp <= 35.0) score += 3;
    else if (temp <= 36.0) score += 1;
    else if (temp >= 38.1 && temp <= 39.0) score += 1;
    else if (temp >= 39.1) score += 2;

    return score;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    const score = calculateScore();
    
    // Create the new observation
    const newObservation: News2Observation = {
      id: uuidv4(),
      patientId,
      dateTime: new Date().toISOString(),
      respRate: parseFloat(respRate),
      spo2: parseFloat(spo2),
      systolicBP: parseFloat(systolicBP),
      pulse: parseFloat(pulse),
      consciousness,
      temperature: parseFloat(temperature),
      o2Therapy,
      score
    };
    
    // In a real app, this would be sent to an API
    setTimeout(() => {
      setIsSubmitting(false);
      
      // Display success message with the score
      toast.success(`Observation recorded successfully`, {
        description: `NEWS2 Score: ${score} (${score >= 7 ? "High Risk" : score >= 5 ? "Medium Risk" : "Low Risk"})`,
      });
      
      // High risk alert
      if (score >= 7) {
        setTimeout(() => {
          toast.warning("High-Risk Patient Alert", {
            description: `${patients.find(p => p.id === patientId)?.name} has a high-risk NEWS2 score (${score}) requiring urgent clinical response`,
          });
        }, 500);
      }
      
      onOpenChange(false);
      
      // Reset form
      setRespRate("16");
      setSpo2("96");
      setSystolicBP("120");
      setPulse("75");
      setConsciousness("A");
      setTemperature("37.0");
      setO2Therapy(false);
    }, 1000);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Record New Observation</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="patient">Patient</Label>
            <Select
              value={patientId}
              onValueChange={(value) => setPatientId(value)}
              disabled={!!defaultPatientId}
            >
              <SelectTrigger id="patient">
                <SelectValue placeholder="Select a patient" />
              </SelectTrigger>
              <SelectContent>
                {patients.map((patient) => (
                  <SelectItem key={patient.id} value={patient.id}>
                    {patient.name} ({patient.id})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="respRate">Respiratory Rate</Label>
              <Input
                id="respRate"
                type="number"
                min="0"
                max="60"
                value={respRate}
                onChange={(e) => setRespRate(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="spo2">SpO₂ %</Label>
              <Input
                id="spo2"
                type="number"
                min="0"
                max="100"
                value={spo2}
                onChange={(e) => setSpo2(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="systolicBP">Systolic BP</Label>
              <Input
                id="systolicBP"
                type="number"
                min="0"
                max="300"
                value={systolicBP}
                onChange={(e) => setSystolicBP(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="pulse">Pulse</Label>
              <Input
                id="pulse"
                type="number"
                min="0"
                max="300"
                value={pulse}
                onChange={(e) => setPulse(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="consciousness">Consciousness</Label>
              <Select
                value={consciousness}
                onValueChange={(value) => setConsciousness(value)}
              >
                <SelectTrigger id="consciousness">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {consciousnessLevels.map((level) => (
                    <SelectItem key={level.value} value={level.value}>
                      {level.value} - {level.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="temperature">Temperature (°C)</Label>
              <Input
                id="temperature"
                type="number"
                step="0.1"
                min="30"
                max="45"
                value={temperature}
                onChange={(e) => setTemperature(e.target.value)}
              />
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="o2Therapy"
              checked={o2Therapy}
              onCheckedChange={(checked) => setO2Therapy(checked as boolean)}
            />
            <Label htmlFor="o2Therapy">Patient on supplemental oxygen</Label>
          </div>

          <div className="mt-4 pt-4 border-t">
            <div className="text-sm font-medium">
              Calculated NEWS2 Score:{" "}
              <span
                className={`px-2 py-0.5 rounded-full ${
                  calculateScore() >= 7
                    ? "bg-red-100 text-red-700"
                    : calculateScore() >= 5
                    ? "bg-amber-100 text-amber-700"
                    : "bg-green-100 text-green-700"
                }`}
              >
                {calculateScore()}
              </span>
            </div>
            <div className="text-xs text-gray-500 mt-1">
              {calculateScore() >= 7
                ? "High Risk - Urgent clinical response required"
                : calculateScore() >= 5
                ? "Medium Risk - Urgent clinical response required"
                : "Low Risk - Continue routine monitoring"}
            </div>
          </div>

          <DialogFooter className="pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={!patientId || isSubmitting}
            >
              {isSubmitting ? "Saving..." : "Save Observation"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

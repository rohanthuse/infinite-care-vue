
import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertCircle,
  ArrowRight,
  Check,
  FileCheck,
  FileQuestion,
  UserCircle,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { News2Patient } from "./news2Types";
import { toast } from "sonner";
import { Slider } from "@/components/ui/slider";

interface NewObservationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  patients: News2Patient[];
  defaultPatientId?: string;
}

interface ObservationValues {
  respRate: number;
  spo2: number;
  systolicBP: number;
  pulse: number;
  consciousness: string;
  temperature: number;
  o2Therapy: boolean;
}

export function NewObservationDialog({
  open,
  onOpenChange,
  patients,
  defaultPatientId,
}: NewObservationDialogProps) {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [patientId, setPatientId] = useState<string>(defaultPatientId || "");
  const [values, setValues] = useState<ObservationValues>({
    respRate: 16,
    spo2: 96,
    systolicBP: 120,
    pulse: 80,
    consciousness: "A",
    temperature: 37.0,
    o2Therapy: false,
  });
  const [calculatedScore, setCalculatedScore] = useState<number | null>(null);

  const handleValueChange = (field: keyof ObservationValues, value: any) => {
    setValues({ ...values, [field]: value });
  };

  const calculateNEWS2Score = () => {
    let score = 0;

    // Respiratory rate
    if (values.respRate <= 8) score += 3;
    else if (values.respRate <= 11) score += 1;
    else if (values.respRate >= 21 && values.respRate <= 24) score += 2;
    else if (values.respRate >= 25) score += 3;

    // SpO2 Scale 1 (we're using Scale 1 for simplicity)
    if (values.spo2 <= 91) score += 3;
    else if (values.spo2 <= 93) score += 2;
    else if (values.spo2 <= 95) score += 1;

    // Systolic BP
    if (values.systolicBP <= 90) score += 3;
    else if (values.systolicBP <= 100) score += 2;
    else if (values.systolicBP <= 110) score += 1;
    else if (values.systolicBP >= 220) score += 3;

    // Pulse
    if (values.pulse <= 40) score += 3;
    else if (values.pulse <= 50) score += 1;
    else if (values.pulse >= 91 && values.pulse <= 110) score += 1;
    else if (values.pulse >= 111 && values.pulse <= 130) score += 2;
    else if (values.pulse >= 131) score += 3;

    // Consciousness
    if (values.consciousness !== "A") score += 3;

    // Temperature
    if (values.temperature <= 35.0) score += 3;
    else if (values.temperature <= 36.0) score += 1;
    else if (values.temperature >= 38.1 && values.temperature <= 39.0) score += 1;
    else if (values.temperature >= 39.1) score += 2;

    // Air or oxygen (simplified)
    if (values.o2Therapy) score += 2;

    return score;
  };

  const getScoreMessage = (score: number) => {
    if (score >= 7) {
      return {
        title: "High Risk (Score ≥ 7)",
        message:
          "Urgent assessment by a clinician with critical care competencies is needed. Consider transfer to higher level care.",
        color: "text-red-600",
      };
    } else if (score >= 5) {
      return {
        title: "Medium Risk (Score 5-6)",
        message:
          "Urgent review by a clinician skilled with competencies in the assessment of acute illness required.",
        color: "text-amber-600",
      };
    } else if (score >= 1) {
      return {
        title: "Low Risk (Score 1-4)",
        message:
          "Clinical assessment and monitoring frequency should be increased as appropriate.",
        color: "text-green-600",
      };
    } else {
      return {
        title: "Low Risk (Score 0)",
        message: "Continue routine monitoring according to clinical plan.",
        color: "text-green-600",
      };
    }
  };

  const handleNextStep = () => {
    if (step === 1) {
      if (!patientId) {
        toast.error("Please select a patient");
        return;
      }
      setStep(2);
    } else if (step === 2) {
      const score = calculateNEWS2Score();
      setCalculatedScore(score);
      setStep(3);
    }
  };

  const handlePrevStep = () => {
    if (step === 2) setStep(1);
    else if (step === 3) setStep(2);
  };

  const handleSubmit = () => {
    // In a real app, this would save the observation to the database
    toast.success("Observation recorded successfully", {
      description: `NEWS2 Score: ${calculatedScore}`,
    });
    onOpenChange(false);
    setStep(1);
    setPatientId(defaultPatientId || "");
    setValues({
      respRate: 16,
      spo2: 96,
      systolicBP: 120,
      pulse: 80,
      consciousness: "A",
      temperature: 37.0,
      o2Therapy: false,
    });
    setCalculatedScore(null);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>New Observation</DialogTitle>
        </DialogHeader>

        {step === 1 && (
          <div className="space-y-6 py-4">
            <div className="flex items-center gap-2 text-blue-600 mb-4">
              <UserCircle className="h-5 w-5" />
              <h2 className="text-lg font-medium">Select Patient</h2>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="patient">Patient</Label>
                <Select value={patientId} onValueChange={setPatientId}>
                  <SelectTrigger id="patient">
                    <SelectValue placeholder="Select patient" />
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
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-6 py-4">
            <div className="flex items-center gap-2 text-blue-600 mb-4">
              <FileCheck className="h-5 w-5" />
              <h2 className="text-lg font-medium">Record Observations</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="respRate">
                  Respiratory Rate (breaths/min)
                </Label>
                <div className="flex items-center gap-2">
                  <Slider
                    id="respRate"
                    min={8}
                    max={35}
                    step={1}
                    value={[values.respRate]}
                    onValueChange={(value) =>
                      handleValueChange("respRate", value[0])
                    }
                    className="flex-1"
                  />
                  <Input
                    type="number"
                    value={values.respRate}
                    onChange={(e) =>
                      handleValueChange(
                        "respRate",
                        parseInt(e.target.value) || 0
                      )
                    }
                    className="w-16"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="spo2">SpO₂ (%)</Label>
                <div className="flex items-center gap-2">
                  <Slider
                    id="spo2"
                    min={85}
                    max={100}
                    step={1}
                    value={[values.spo2]}
                    onValueChange={(value) =>
                      handleValueChange("spo2", value[0])
                    }
                    className="flex-1"
                  />
                  <Input
                    type="number"
                    value={values.spo2}
                    onChange={(e) =>
                      handleValueChange("spo2", parseInt(e.target.value) || 0)
                    }
                    className="w-16"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="systolicBP">Systolic BP (mmHg)</Label>
                <div className="flex items-center gap-2">
                  <Slider
                    id="systolicBP"
                    min={70}
                    max={220}
                    step={1}
                    value={[values.systolicBP]}
                    onValueChange={(value) =>
                      handleValueChange("systolicBP", value[0])
                    }
                    className="flex-1"
                  />
                  <Input
                    type="number"
                    value={values.systolicBP}
                    onChange={(e) =>
                      handleValueChange(
                        "systolicBP",
                        parseInt(e.target.value) || 0
                      )
                    }
                    className="w-16"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="pulse">Pulse (beats/min)</Label>
                <div className="flex items-center gap-2">
                  <Slider
                    id="pulse"
                    min={40}
                    max={170}
                    step={1}
                    value={[values.pulse]}
                    onValueChange={(value) =>
                      handleValueChange("pulse", value[0])
                    }
                    className="flex-1"
                  />
                  <Input
                    type="number"
                    value={values.pulse}
                    onChange={(e) =>
                      handleValueChange("pulse", parseInt(e.target.value) || 0)
                    }
                    className="w-16"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="consciousness">Consciousness</Label>
                <Select
                  value={values.consciousness}
                  onValueChange={(value) =>
                    handleValueChange("consciousness", value)
                  }
                >
                  <SelectTrigger id="consciousness">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="A">Alert (A)</SelectItem>
                    <SelectItem value="V">
                      Voice (V) - responds to voice
                    </SelectItem>
                    <SelectItem value="P">
                      Pain (P) - responds to pain
                    </SelectItem>
                    <SelectItem value="U">
                      Unresponsive (U)
                    </SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-gray-500">
                  AVPU scale: Alert, Voice, Pain, Unresponsive
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="temperature">Temperature (°C)</Label>
                <div className="flex items-center gap-2">
                  <Slider
                    id="temperature"
                    min={35.0}
                    max={41.0}
                    step={0.1}
                    value={[values.temperature]}
                    onValueChange={(value) =>
                      handleValueChange("temperature", value[0])
                    }
                    className="flex-1"
                  />
                  <Input
                    type="number"
                    value={values.temperature.toFixed(1)}
                    onChange={(e) =>
                      handleValueChange(
                        "temperature",
                        parseFloat(e.target.value) || 0
                      )
                    }
                    step={0.1}
                    className="w-16"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="o2Therapy">O₂ Therapy</Label>
                <Select
                  value={values.o2Therapy ? "yes" : "no"}
                  onValueChange={(value) =>
                    handleValueChange("o2Therapy", value === "yes")
                  }
                >
                  <SelectTrigger id="o2Therapy">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="yes">Yes</SelectItem>
                    <SelectItem value="no">No</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-gray-500">
                  Is the patient on supplemental oxygen?
                </p>
              </div>
            </div>

            <div className="border-t pt-4 mt-4">
              <div className="flex items-center gap-2">
                <FileQuestion className="h-5 w-5 text-blue-600" />
                <p className="text-sm">
                  The NEWS2 score helps identify patients at risk of
                  deterioration. Fill in all the observations accurately.
                </p>
              </div>
            </div>
          </div>
        )}

        {step === 3 && calculatedScore !== null && (
          <div className="space-y-6 py-4">
            <div className="flex items-center gap-2 mb-4">
              <Check className="h-5 w-5 text-green-600" />
              <h2 className="text-lg font-medium">Review and Submit</h2>
            </div>

            <Card className="p-6 border-2">
              <div className="mb-6">
                <h3 className="text-xl font-bold mb-2">
                  NEWS2 Score:{" "}
                  <span className={getScoreMessage(calculatedScore).color}>
                    {calculatedScore}
                  </span>
                </h3>
                <p className={`font-medium ${getScoreMessage(calculatedScore).color}`}>
                  {getScoreMessage(calculatedScore).title}
                </p>
                <p className="text-gray-600 mt-1">
                  {getScoreMessage(calculatedScore).message}
                </p>
              </div>

              {calculatedScore >= 5 && (
                <div className="flex items-start gap-2 mb-6 p-3 bg-amber-50 border border-amber-200 rounded-md">
                  <AlertCircle className="h-5 w-5 text-amber-600 mt-0.5" />
                  <div>
                    <p className="font-medium text-amber-700">
                      Clinical Attention Required
                    </p>
                    <p className="text-sm text-amber-800">
                      This score indicates the patient may need urgent clinical review.
                    </p>
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-500">Respiratory Rate</p>
                    <p className="font-medium">{values.respRate} breaths/min</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">SpO₂</p>
                    <p className="font-medium">{values.spo2}%</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Systolic BP</p>
                    <p className="font-medium">{values.systolicBP} mmHg</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Pulse</p>
                    <p className="font-medium">{values.pulse} bpm</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Consciousness</p>
                    <p className="font-medium">{values.consciousness}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Temperature</p>
                    <p className="font-medium">{values.temperature.toFixed(1)} °C</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">O₂ Therapy</p>
                    <p className="font-medium">{values.o2Therapy ? "Yes" : "No"}</p>
                  </div>
                </div>
              </div>
            </Card>
          </div>
        )}

        <DialogFooter className="flex flex-col sm:flex-row sm:justify-between gap-2">
          <div>
            {step > 1 && (
              <Button variant="outline" onClick={handlePrevStep}>
                Back
              </Button>
            )}
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            {step < 3 ? (
              <Button onClick={handleNextStep}>
                Next <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            ) : (
              <Button onClick={handleSubmit}>Submit Observation</Button>
            )}
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

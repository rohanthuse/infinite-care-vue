import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Activity, Heart, Thermometer, Wind, Plus } from 'lucide-react';
import { VisitVital } from '@/hooks/useVisitVitals';

interface NEWS2Values {
  respiratory_rate: number;
  oxygen_saturation: number;
  supplemental_oxygen: boolean;
  systolic_bp: number;
  diastolic_bp: number;
  pulse_rate: number;
  consciousness_level: 'A' | 'V' | 'P' | 'U';
  temperature: number;
}

interface EditableNEWS2FormProps {
  latestNEWS2?: VisitVital;
  onVitalChange: (values: NEWS2Values) => void;
  allowCreate?: boolean;
}

// NEWS2 Score calculation function
const calculateNEWS2Score = (vitals: NEWS2Values) => {
  let score = 0;

  // Respiratory Rate
  if (vitals.respiratory_rate <= 8) score += 3;
  else if (vitals.respiratory_rate <= 11) score += 1;
  else if (vitals.respiratory_rate <= 20) score += 0;
  else if (vitals.respiratory_rate <= 24) score += 2;
  else score += 3;

  // Oxygen Saturation
  if (vitals.oxygen_saturation <= 91) score += 3;
  else if (vitals.oxygen_saturation <= 93) score += 2;
  else if (vitals.oxygen_saturation <= 95) score += 1;
  else score += 0;

  // Supplemental Oxygen
  if (vitals.supplemental_oxygen) score += 2;

  // Blood Pressure
  if (vitals.systolic_bp <= 90) score += 3;
  else if (vitals.systolic_bp <= 100) score += 2;
  else if (vitals.systolic_bp <= 110) score += 1;
  else if (vitals.systolic_bp <= 219) score += 0;
  else score += 3;

  // Pulse Rate
  if (vitals.pulse_rate <= 40) score += 3;
  else if (vitals.pulse_rate <= 50) score += 1;
  else if (vitals.pulse_rate <= 90) score += 0;
  else if (vitals.pulse_rate <= 110) score += 1;
  else if (vitals.pulse_rate <= 130) score += 2;
  else score += 3;

  // Consciousness Level
  if (vitals.consciousness_level === 'A') score += 0;
  else score += 3;

  // Temperature
  if (vitals.temperature <= 35.0) score += 3;
  else if (vitals.temperature <= 36.0) score += 1;
  else if (vitals.temperature <= 38.0) score += 0;
  else if (vitals.temperature <= 39.0) score += 1;
  else score += 2;

  // Risk Level
  let riskLevel: 'low' | 'medium' | 'high';
  if (score >= 7) riskLevel = 'high';
  else if (score >= 5) riskLevel = 'medium';
  else riskLevel = 'low';

  return { score, riskLevel };
};

const defaultValues: NEWS2Values = {
  respiratory_rate: 16,
  oxygen_saturation: 98,
  supplemental_oxygen: false,
  systolic_bp: 120,
  diastolic_bp: 80,
  pulse_rate: 72,
  consciousness_level: 'A',
  temperature: 36.5,
};

export function EditableNEWS2Form({ latestNEWS2, onVitalChange, allowCreate = true }: EditableNEWS2FormProps) {
  const [showForm, setShowForm] = useState(!!latestNEWS2);
  const [values, setValues] = useState<NEWS2Values>({
    respiratory_rate: latestNEWS2?.respiratory_rate || defaultValues.respiratory_rate,
    oxygen_saturation: latestNEWS2?.oxygen_saturation || defaultValues.oxygen_saturation,
    supplemental_oxygen: latestNEWS2?.supplemental_oxygen || defaultValues.supplemental_oxygen,
    systolic_bp: latestNEWS2?.systolic_bp || defaultValues.systolic_bp,
    diastolic_bp: latestNEWS2?.diastolic_bp || defaultValues.diastolic_bp,
    pulse_rate: latestNEWS2?.pulse_rate || defaultValues.pulse_rate,
    consciousness_level: (latestNEWS2?.consciousness_level as 'A' | 'V' | 'P' | 'U') || defaultValues.consciousness_level,
    temperature: latestNEWS2?.temperature || defaultValues.temperature,
  });

  // Update values when latestNEWS2 changes
  useEffect(() => {
    if (latestNEWS2) {
      setShowForm(true);
      setValues({
        respiratory_rate: latestNEWS2.respiratory_rate || defaultValues.respiratory_rate,
        oxygen_saturation: latestNEWS2.oxygen_saturation || defaultValues.oxygen_saturation,
        supplemental_oxygen: latestNEWS2.supplemental_oxygen || defaultValues.supplemental_oxygen,
        systolic_bp: latestNEWS2.systolic_bp || defaultValues.systolic_bp,
        diastolic_bp: latestNEWS2.diastolic_bp || defaultValues.diastolic_bp,
        pulse_rate: latestNEWS2.pulse_rate || defaultValues.pulse_rate,
        consciousness_level: (latestNEWS2.consciousness_level as 'A' | 'V' | 'P' | 'U') || defaultValues.consciousness_level,
        temperature: latestNEWS2.temperature || defaultValues.temperature,
      });
    }
  }, [latestNEWS2]);

  // Calculate score whenever values change
  const { score, riskLevel } = useMemo(() => calculateNEWS2Score(values), [values]);

  const handleValueChange = (field: keyof NEWS2Values, value: number | boolean | string) => {
    const newValues = { ...values, [field]: value };
    setValues(newValues);
    onVitalChange(newValues);
  };

  const handleStartRecording = () => {
    setShowForm(true);
    onVitalChange(values);
  };

  const getRiskBadge = (risk: string) => {
    const colors: Record<string, string> = {
      low: 'bg-green-600',
      medium: 'bg-amber-600',
      high: 'bg-red-600',
    };

    return (
      <Badge className={colors[risk]}>
        {risk.toUpperCase()} RISK
      </Badge>
    );
  };

  // Show empty state with option to add vitals
  if (!showForm && allowCreate) {
    return (
      <div className="text-center py-6 text-muted-foreground">
        <Activity className="h-10 w-10 mx-auto mb-2 opacity-30" />
        <p className="text-sm mb-4">No vital signs recorded for this visit</p>
        <Button variant="outline" size="sm" onClick={handleStartRecording}>
          <Plus className="h-4 w-4 mr-2" />
          Record Vital Signs
        </Button>
      </div>
    );
  }

  if (!showForm) {
    return (
      <div className="text-center py-6 text-muted-foreground">
        <Activity className="h-10 w-10 mx-auto mb-2 opacity-30" />
        <p className="text-sm">No vital signs recorded for this visit</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Live NEWS2 Score */}
      <Alert className={riskLevel === 'high' ? 'border-red-500' : ''}>
        <Activity className="h-4 w-4" />
        <AlertTitle className="flex items-center justify-between">
          <span>NEWS2 Score (Live)</span>
          {getRiskBadge(riskLevel)}
        </AlertTitle>
        <AlertDescription>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
            <div>
              <p className="text-sm text-muted-foreground">Total Score</p>
              <p className="text-3xl font-bold">{score}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground flex items-center gap-1">
                <Heart className="h-3 w-3" />
                Heart Rate
              </p>
              <p className="font-medium">{values.pulse_rate} bpm</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground flex items-center gap-1">
                <Wind className="h-3 w-3" />
                SpO2
              </p>
              <p className="font-medium">{values.oxygen_saturation}%</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground flex items-center gap-1">
                <Thermometer className="h-3 w-3" />
                Temp
              </p>
              <p className="font-medium">{values.temperature}°C</p>
            </div>
          </div>
        </AlertDescription>
      </Alert>

      {/* Editable Parameters */}
      <Card>
        <CardContent className="pt-6">
          <h4 className="font-semibold mb-4">
            {latestNEWS2 ? 'Edit NEWS2 Parameters' : 'Enter NEWS2 Parameters'}
          </h4>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="respiratory_rate">Respiration Rate (/min)</Label>
              <Input
                id="respiratory_rate"
                type="number"
                value={values.respiratory_rate}
                onChange={(e) => handleValueChange('respiratory_rate', parseFloat(e.target.value) || 0)}
                min={0}
                max={60}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="oxygen_saturation">SpO2 (%)</Label>
              <Input
                id="oxygen_saturation"
                type="number"
                value={values.oxygen_saturation}
                onChange={(e) => handleValueChange('oxygen_saturation', parseFloat(e.target.value) || 0)}
                min={0}
                max={100}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="supplemental_oxygen">Oxygen Therapy</Label>
              <div className="flex items-center gap-2 pt-2">
                <Switch
                  id="supplemental_oxygen"
                  checked={values.supplemental_oxygen}
                  onCheckedChange={(checked) => handleValueChange('supplemental_oxygen', checked)}
                />
                <span className="text-sm">{values.supplemental_oxygen ? 'Yes' : 'No'}</span>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="systolic_bp">Systolic BP (mmHg)</Label>
              <Input
                id="systolic_bp"
                type="number"
                value={values.systolic_bp}
                onChange={(e) => handleValueChange('systolic_bp', parseFloat(e.target.value) || 0)}
                min={0}
                max={300}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="diastolic_bp">Diastolic BP (mmHg)</Label>
              <Input
                id="diastolic_bp"
                type="number"
                value={values.diastolic_bp}
                onChange={(e) => handleValueChange('diastolic_bp', parseFloat(e.target.value) || 0)}
                min={0}
                max={200}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="pulse_rate">Heart Rate (bpm)</Label>
              <Input
                id="pulse_rate"
                type="number"
                value={values.pulse_rate}
                onChange={(e) => handleValueChange('pulse_rate', parseFloat(e.target.value) || 0)}
                min={0}
                max={250}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="temperature">Temperature (°C)</Label>
              <Input
                id="temperature"
                type="number"
                step="0.1"
                value={values.temperature}
                onChange={(e) => handleValueChange('temperature', parseFloat(e.target.value) || 0)}
                min={30}
                max={45}
              />
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="consciousness_level">Consciousness Level (AVPU)</Label>
              <Select
                value={values.consciousness_level}
                onValueChange={(value) => handleValueChange('consciousness_level', value)}
              >
                <SelectTrigger id="consciousness_level">
                  <SelectValue placeholder="Select level" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="A">A - Alert</SelectItem>
                  <SelectItem value="V">V - Voice Responsive</SelectItem>
                  <SelectItem value="P">P - Pain Responsive</SelectItem>
                  <SelectItem value="U">U - Unresponsive</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

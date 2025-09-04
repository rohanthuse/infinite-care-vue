import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Stethoscope, Activity } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { ClientMedicalInfo } from "@/hooks/useClientMedicalInfo";

interface MedicalMentalTabProps {
  medicalInfo?: ClientMedicalInfo;
  onEditMedicalInfo?: () => void;
}

const PHYSICAL_HEALTH_CONDITIONS = [
  "Cancer", "Arthritis", "Heart Condition", "Diabetes", "Chronic Pain", 
  "Chronic Respiratory", "Addiction", "Other Medical Conditions", 
  "Blood Pressure", "Thyroid", "Multiple Sclerosis", "Parkinson's", 
  "Bilateral Periventricular Leukomalacia", "Quadriplegic", "Cerebral Palsy", 
  "Non", "Epilepsy"
];

const MENTAL_HEALTH_CONDITIONS = [
  "Dementia", "Insomnia", "Alzheimer's Disease", "Hoarding Disorder", 
  "Self-harm", "Phobia", "Panic Disorder", "Stress Disorder", "Schizophrenia", 
  "Obsessive Compulsive Disorder", "Autism", "Other Mental Conditions", 
  "Chronic Neurological", "Depression", "Non"
];

export const MedicalMentalTab: React.FC<MedicalMentalTabProps> = ({
  medicalInfo,
  onEditMedicalInfo,
}) => {
  const [activeSubTab, setActiveSubTab] = useState("medical");

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <Stethoscope className="h-5 w-5 text-primary" />
          Medical and Mental Health
        </h3>
      </div>

      <Tabs value={activeSubTab} onValueChange={setActiveSubTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="medical" className="flex items-center gap-2">
            <Stethoscope className="h-4 w-4" />
            Medical and Mental
          </TabsTrigger>
          <TabsTrigger value="serviceband" className="flex items-center gap-2">
            <Activity className="h-4 w-4" />
            Service Band
          </TabsTrigger>
        </TabsList>

        <TabsContent value="medical" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            {/* Physical Health Conditions */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Medical Physical Health Conditions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid gap-2 max-h-64 overflow-y-auto">
                  {PHYSICAL_HEALTH_CONDITIONS.map((condition) => (
                    <div key={condition} className="flex items-center space-x-2">
                      <Checkbox
                        id={`physical-${condition}`}
                        checked={medicalInfo?.physical_health_conditions?.includes(condition) || false}
                        disabled
                      />
                      <Label 
                        htmlFor={`physical-${condition}`} 
                        className="text-sm font-normal cursor-pointer"
                      >
                        {condition}
                      </Label>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Mental Health Conditions */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Mental Health Conditions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid gap-2 max-h-64 overflow-y-auto">
                  {MENTAL_HEALTH_CONDITIONS.map((condition) => (
                    <div key={condition} className="flex items-center space-x-2">
                      <Checkbox
                        id={`mental-${condition}`}
                        checked={medicalInfo?.mental_health_conditions?.includes(condition) || false}
                        disabled
                      />
                      <Label 
                        htmlFor={`mental-${condition}`} 
                        className="text-sm font-normal cursor-pointer"
                      >
                        {condition}
                      </Label>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="serviceband" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Service Band Information</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">Service band information will be displayed here.</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};
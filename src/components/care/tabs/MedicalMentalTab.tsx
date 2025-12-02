import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Stethoscope, Activity } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { ClientMedicalInfo } from "@/hooks/useClientMedicalInfo";
import { formatNews2Frequency } from "@/utils/news2FrequencyUtils";

interface MedicalMentalTabProps {
  medicalInfo?: ClientMedicalInfo;
  onEditMedicalInfo?: () => void;
  news2MonitoringEnabled?: boolean;
  news2MonitoringFrequency?: string;
  news2MonitoringNotes?: string;
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
  news2MonitoringEnabled = false,
  news2MonitoringFrequency = 'daily',
  news2MonitoringNotes,
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

          {/* NEWS2 Health Monitoring Section */}
          <Card className="border-teal-200 bg-teal-50/50">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Activity className="h-4 w-4 text-teal-600" />
                NEWS2 Health Monitoring
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {news2MonitoringEnabled ? (
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Badge className="bg-teal-500 text-white hover:bg-teal-600">
                      Monitoring Active
                    </Badge>
                  </div>
                  <div className="grid gap-3 text-sm">
                    <div className="flex items-start gap-2">
                      <span className="text-muted-foreground min-w-[120px]">Frequency:</span>
                      <span className="font-medium">
                        {formatNews2Frequency(news2MonitoringFrequency)}
                      </span>
                    </div>
                    {news2MonitoringNotes && (
                      <div className="flex items-start gap-2">
                        <span className="text-muted-foreground min-w-[120px]">Notes:</span>
                        <p className="flex-1 text-foreground">{news2MonitoringNotes}</p>
                      </div>
                    )}
                  </div>
                  <div className="mt-4 pt-3 border-t border-teal-200">
                    <p className="text-xs text-muted-foreground">
                      View detailed health monitoring data in the client's{" "}
                      <span className="font-semibold text-teal-700">Health Monitoring</span> tab
                    </p>
                  </div>
                </div>
              ) : (
                <div className="text-sm text-muted-foreground">
                  <p>NEWS2 health monitoring is not currently enabled for this client.</p>
                  <p className="mt-2 text-xs">
                    To enable monitoring, edit the care plan through the wizard.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
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
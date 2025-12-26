import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Stethoscope, Activity, Eye, Ear, Accessibility, MessageSquare } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { ClientMedicalInfo } from "@/hooks/useClientMedicalInfo";
import { formatNews2Frequency } from "@/utils/news2FrequencyUtils";

interface DiagnosisTabProps {
  medicalInfo?: ClientMedicalInfo;
  carePlanData?: any;
  onEditMedicalInfo?: () => void;
  news2MonitoringEnabled?: boolean;
  news2MonitoringFrequency?: string;
  news2MonitoringNotes?: string;
}

const MEDICAL_CONDITIONS_LIST = [
  "Cancer", "Arthritis", "Heart Condition", "Diabetes", "Chronic Pain", 
  "Chronic Respiratory", "Addiction", "Blood Pressure", "Thyroid", 
  "Multiple Sclerosis", "Parkinson's", "Cerebral Palsy", "Epilepsy",
  "Dementia", "Alzheimer's Disease", "Depression", "Anxiety", "Schizophrenia",
  "Autism", "ADHD", "Bipolar Disorder", "Stroke", "COPD", "Asthma"
];

export const DiagnosisTab: React.FC<DiagnosisTabProps> = ({
  medicalInfo,
  carePlanData,
  onEditMedicalInfo,
  news2MonitoringEnabled = false,
  news2MonitoringFrequency = 'daily',
  news2MonitoringNotes,
}) => {
  const [activeSubTab, setActiveSubTab] = useState("diagnosis");
  
  // Get diagnosis data from care plan auto_save_data
  const diagnosisData = carePlanData?.auto_save_data?.diagnosis || {};
  const serviceBandData = carePlanData?.auto_save_data?.medical_info?.service_band || {};

  const renderYesNo = (value: boolean | undefined) => {
    if (value === true) {
      return <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Yes</Badge>;
    }
    if (value === false) {
      return <Badge variant="outline" className="text-muted-foreground">No</Badge>;
    }
    return <span className="text-muted-foreground text-sm">Not specified</span>;
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <Stethoscope className="h-5 w-5 text-primary" />
          Diagnosis
        </h3>
      </div>

      <Tabs value={activeSubTab} onValueChange={setActiveSubTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="diagnosis" className="flex items-center gap-2">
            <Stethoscope className="h-4 w-4" />
            Diagnosis
          </TabsTrigger>
          <TabsTrigger value="serviceband" className="flex items-center gap-2">
            <Activity className="h-4 w-4" />
            Service Band
          </TabsTrigger>
        </TabsList>

        <TabsContent value="diagnosis" className="space-y-6">
          {/* Impairments Section */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Impairments & Accessibility</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-6 md:grid-cols-2">
                {/* Hearing Impairment */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Ear className="h-4 w-4 text-blue-600" />
                    <span className="font-medium">Hearing Impairment</span>
                  </div>
                  <div className="pl-6">
                    {renderYesNo(diagnosisData.hearing_impaired)}
                    {diagnosisData.hearing_impaired && diagnosisData.hearing_impairment_description && (
                      <p className="text-sm text-muted-foreground mt-2">
                        {diagnosisData.hearing_impairment_description}
                      </p>
                    )}
                  </div>
                </div>

                {/* Vision Impairment */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Eye className="h-4 w-4 text-purple-600" />
                    <span className="font-medium">Vision Impairment</span>
                  </div>
                  <div className="pl-6">
                    {renderYesNo(diagnosisData.vision_impaired)}
                    {diagnosisData.vision_impaired && diagnosisData.vision_impairment_description && (
                      <p className="text-sm text-muted-foreground mt-2">
                        {diagnosisData.vision_impairment_description}
                      </p>
                    )}
                  </div>
                </div>

                {/* Mobility Impairment */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Accessibility className="h-4 w-4 text-orange-600" />
                    <span className="font-medium">Mobility Impairment</span>
                  </div>
                  <div className="pl-6">
                    {renderYesNo(diagnosisData.mobility_impaired)}
                    {diagnosisData.mobility_impaired && diagnosisData.mobility_impairment_description && (
                      <p className="text-sm text-muted-foreground mt-2">
                        {diagnosisData.mobility_impairment_description}
                      </p>
                    )}
                  </div>
                </div>

                {/* Communication */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <MessageSquare className="h-4 w-4 text-green-600" />
                    <span className="font-medium">Communication Abilities</span>
                  </div>
                  <div className="pl-6">
                    {diagnosisData.communication_abilities ? (
                      <p className="text-sm">{diagnosisData.communication_abilities}</p>
                    ) : (
                      <span className="text-muted-foreground text-sm">Not specified</span>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Medical Conditions */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Medical Conditions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {diagnosisData.medical_conditions && diagnosisData.medical_conditions.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {diagnosisData.medical_conditions.map((condition: string, index: number) => (
                    <Badge key={index} variant="secondary" className="bg-blue-100 text-blue-800">
                      {condition}
                    </Badge>
                  ))}
                </div>
              ) : (
                <span className="text-muted-foreground text-sm">No medical conditions recorded</span>
              )}

              {/* Custom Diagnoses */}
              {diagnosisData.custom_diagnoses && diagnosisData.custom_diagnoses.length > 0 && (
                <div className="pt-3 border-t">
                  <p className="text-sm font-medium mb-2">Custom Diagnoses:</p>
                  <div className="flex flex-wrap gap-2">
                    {diagnosisData.custom_diagnoses.map((diagnosis: string, index: number) => (
                      <Badge key={index} variant="secondary" className="bg-purple-100 text-purple-800">
                        {diagnosis}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

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
                </div>
              ) : (
                <div className="text-sm text-muted-foreground">
                  <p>NEWS2 health monitoring is not currently enabled for this client.</p>
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
              {serviceBandData.categories && serviceBandData.categories.length > 0 ? (
                <div className="space-y-4">
                  <div className="flex flex-wrap gap-2">
                    {serviceBandData.categories.map((category: string, index: number) => (
                      <Badge key={index} variant="outline" className="bg-primary/10">
                        {category}
                      </Badge>
                    ))}
                  </div>
                  {serviceBandData.details && Object.keys(serviceBandData.details).length > 0 && (
                    <div className="space-y-3 mt-4 pt-4 border-t">
                      {Object.entries(serviceBandData.details).map(([key, value]: [string, any]) => (
                        <div key={key} className="space-y-1">
                          <h4 className="text-sm font-medium capitalize">{key.replace(/_/g, ' ')}</h4>
                          {typeof value === 'object' ? (
                            <pre className="text-xs text-muted-foreground bg-muted p-2 rounded">
                              {JSON.stringify(value, null, 2)}
                            </pre>
                          ) : (
                            <p className="text-sm text-muted-foreground">{String(value)}</p>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-muted-foreground">No service band information recorded.</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

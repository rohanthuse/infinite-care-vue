import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Activity, AlertCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { formatNews2Frequency } from '@/utils/news2FrequencyUtils';

interface MedicalSectionProps {
  medicalInfo: any;
  news2MonitoringEnabled?: boolean;
  news2MonitoringFrequency?: string;
  news2MonitoringNotes?: string;
}

export function MedicalSection({ 
  medicalInfo, 
  news2MonitoringEnabled,
  news2MonitoringFrequency,
  news2MonitoringNotes 
}: MedicalSectionProps) {
  const data = medicalInfo || {};

  const renderList = (label: string, items: any[], isAlert = false) => {
    const hasValue = items && Array.isArray(items) && items.length > 0;
    
    return (
      <div>
        <label className="text-sm font-medium text-muted-foreground flex items-center gap-2">
          {isAlert && <AlertCircle className="h-4 w-4 text-red-500" />}
          {label}
        </label>
        {hasValue ? (
          <ul className="mt-2 space-y-2">
            {items.map((item, idx) => (
              <li key={idx} className="flex items-start gap-2">
                <span className={isAlert ? "text-red-500" : "text-primary"}>•</span>
                <span className="text-base">{typeof item === 'string' ? item : item.name || item.condition || JSON.stringify(item)}</span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm mt-1 text-muted-foreground italic">No data provided</p>
        )}
      </div>
    );
  };

  const renderField = (label: string, value: any) => {
    const hasValue = value !== undefined && value !== null && value !== '';
    
    return (
      <div>
        <label className="text-sm font-medium text-muted-foreground">{label}</label>
        {hasValue ? (
          <p className="text-base mt-1 whitespace-pre-wrap">{value}</p>
        ) : (
          <p className="text-sm mt-1 text-muted-foreground italic">No data provided</p>
        )}
      </div>
    );
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Activity className="h-5 w-5 text-primary" />
          Medical & Mental Health
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Allergies - Always show prominently */}
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <h4 className="font-semibold text-red-900 mb-3 flex items-center gap-2">
            <AlertCircle className="h-4 w-4" />
            Allergies
          </h4>
          {data.allergies && data.allergies.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {data.allergies.map((allergy: any, idx: number) => (
                <Badge key={idx} variant="destructive">{typeof allergy === 'string' ? allergy : allergy?.name || JSON.stringify(allergy)}</Badge>
              ))}
            </div>
          ) : (
            <p className="text-sm text-red-700 italic">No allergies recorded</p>
          )}
        </div>

        {/* Current Diagnosis */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h4 className="font-semibold text-blue-900 mb-3">Current Diagnosis</h4>
          {data.current_medications && data.current_medications.length > 0 ? (
            <ul className="space-y-1">
              {data.current_medications.map((diagnosis: any, idx: number) => (
                <li key={idx} className="flex items-start gap-2">
                  <span className="text-blue-600">•</span>
                  <span>{typeof diagnosis === 'string' ? diagnosis : diagnosis.name || JSON.stringify(diagnosis)}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-blue-700 italic">No current diagnosis recorded</p>
          )}
        </div>

        {/* Medical Conditions */}
        <div>
          <h4 className="font-semibold text-base mb-3">Medical Conditions</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {renderList('Medical Conditions', data.medical_conditions || data.conditions)}
            {renderList('Mental Health Conditions', data.mental_health_conditions)}
            {renderList('Sensory Impairments', data.sensory_impairments)}
          </div>
        </div>

        {/* Health Status */}
        <div>
          <h4 className="font-semibold text-base mb-3">Health Status</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {renderField('Mobility Status', data.mobility_status)}
            {renderField('Mental Health Status', data.mental_health_status)}
            {renderField('Cognitive Status', data.cognitive_status)}
            {renderField('Communication Needs', data.communication_needs)}
            {renderField('Sensory Needs', data.sensory_needs)}
            {renderField('Pain Management', data.pain_management)}
          </div>
        </div>

        {/* Medical History */}
        <div>
          <h4 className="font-semibold text-base mb-3">Medical History & Contacts</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {renderField('Medical History', data.medical_history)}
            {renderField('Emergency Contacts', data.emergency_contacts)}
            {renderField('GP Information', data.gp_info)}
            {renderField('Hospital/Consultant', data.hospital_consultant)}
          </div>
        </div>

        {/* Service Band Categories */}
        <div>
          <h4 className="font-semibold text-base mb-3">Service Band Categories</h4>
          {data.service_band?.categories && data.service_band.categories.length > 0 ? (
            <div className="space-y-4">
              <div className="flex flex-wrap gap-2">
                {data.service_band.categories.map((cat: string, idx: number) => (
                  <Badge key={idx} variant="outline">{cat}</Badge>
                ))}
              </div>
              {data.service_band.details && Object.keys(data.service_band.details).length > 0 && (
                <div className="space-y-4">
                  {Object.entries(data.service_band.details).map(([categorySlug, details]: [string, any]) => (
                    <div key={categorySlug} className="bg-muted/50 rounded p-4">
                      <h5 className="font-medium capitalize mb-2">{categorySlug.replace(/_/g, ' ')}</h5>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                        {Object.entries(details).map(([key, value]: [string, any]) => {
                          if (value === undefined || value === null) return null;
                          return (
                            <div key={key}>
                              <span className="text-muted-foreground capitalize">{key.replace(/_/g, ' ')}:</span>
                              <span className="ml-2">{typeof value === 'boolean' ? (value ? 'Yes' : 'No') : String(value)}</span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground italic">No service band categories selected</p>
          )}
        </div>

        {/* NEWS2 Monitoring */}
        <div>
          <h4 className="font-semibold text-base mb-3">NEWS2 Monitoring</h4>
          {news2MonitoringEnabled ? (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <Activity className="h-4 w-4 text-blue-600" />
                <span className="font-medium text-blue-900">NEWS2 Monitoring Enabled</span>
              </div>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">Frequency:</span>
                  <span className="ml-2">{formatNews2Frequency(news2MonitoringFrequency)}</span>
                </div>
                {news2MonitoringNotes && (
                  <div className="col-span-2">
                    <span className="text-muted-foreground">Notes:</span>
                    <p className="mt-1">{news2MonitoringNotes}</p>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground italic">NEWS2 monitoring is not enabled</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

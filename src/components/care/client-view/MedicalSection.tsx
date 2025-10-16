import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Activity, AlertCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface MedicalSectionProps {
  medicalInfo: any;
}

export function MedicalSection({ medicalInfo }: MedicalSectionProps) {
  if (!medicalInfo || Object.keys(medicalInfo).length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5 text-primary" />
            Medical & Mental Health
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">No medical information provided yet.</p>
        </CardContent>
      </Card>
    );
  }

  const renderList = (label: string, items: any[], isAlert = false) => {
    if (!items || items.length === 0) return null;
    
    return (
      <div>
        <label className="text-sm font-medium text-muted-foreground flex items-center gap-2">
          {isAlert && <AlertCircle className="h-4 w-4 text-red-500" />}
          {label}
        </label>
        <ul className="mt-2 space-y-2">
          {items.map((item, idx) => (
            <li key={idx} className="flex items-start gap-2">
              <span className={isAlert ? "text-red-500" : "text-primary"}>•</span>
              <span className="text-base">{typeof item === 'string' ? item : item.name || item.condition || JSON.stringify(item)}</span>
            </li>
          ))}
        </ul>
      </div>
    );
  };

  const renderField = (label: string, value: any) => {
    if (!value) return null;
    
    return (
      <div>
        <label className="text-sm font-medium text-muted-foreground">{label}</label>
        <p className="text-base mt-1 whitespace-pre-wrap">{value}</p>
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
        {(medicalInfo.allergies && medicalInfo.allergies.length > 0) && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            {renderList('⚠️ Allergies', medicalInfo.allergies, true)}
          </div>
        )}
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {renderList('Medical Conditions', medicalInfo.medical_conditions || medicalInfo.conditions)}
          {renderList('Mental Health Conditions', medicalInfo.mental_health_conditions)}
          {renderField('Mobility Status', medicalInfo.mobility_status)}
          {renderField('Communication Needs', medicalInfo.communication_needs)}
          {renderField('Sensory Needs', medicalInfo.sensory_needs)}
          {renderField('Cognitive Status', medicalInfo.cognitive_status)}
          {renderField('Pain Management', medicalInfo.pain_management)}
          {renderField('Emergency Contacts', medicalInfo.emergency_contacts)}
          {renderField('GP Information', medicalInfo.gp_info)}
          {renderField('Hospital/Consultant', medicalInfo.hospital_consultant)}
        </div>

        {medicalInfo.news2_monitoring_enabled && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h4 className="font-medium text-blue-900 mb-2 flex items-center gap-2">
              <Activity className="h-4 w-4" />
              NEWS2 Monitoring Enabled
            </h4>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-muted-foreground">Frequency:</span>
                <span className="ml-2 capitalize">{medicalInfo.news2_monitoring_frequency || 'Daily'}</span>
              </div>
              {medicalInfo.news2_monitoring_notes && (
                <div className="col-span-2">
                  <span className="text-muted-foreground">Notes:</span>
                  <p className="mt-1">{medicalInfo.news2_monitoring_notes}</p>
                </div>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

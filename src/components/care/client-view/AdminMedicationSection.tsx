import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Pill, Clock, AlertTriangle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface AdminMedicationSectionProps {
  adminMedication: any;
}

export function AdminMedicationSection({ adminMedication }: AdminMedicationSectionProps) {
  if (!adminMedication || Object.keys(adminMedication).length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Pill className="h-5 w-5 text-primary" />
            Medication Administration
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">No medication administration details provided yet.</p>
        </CardContent>
      </Card>
    );
  }

  const renderField = (label: string, value: any) => {
    if (!value) return null;
    return (
      <div>
        <label className="text-sm font-medium text-muted-foreground">{label}</label>
        <p className="text-base mt-1 whitespace-pre-wrap">{value}</p>
      </div>
    );
  };

  const renderYesNo = (label: string, value: boolean) => {
    if (value === undefined || value === null) return null;
    return (
      <div>
        <label className="text-sm font-medium text-muted-foreground">{label}</label>
        <Badge variant={value ? 'default' : 'secondary'} className="mt-1">
          {value ? 'Yes' : 'No'}
        </Badge>
      </div>
    );
  };

  const renderArrayField = (label: string, items: any[]) => {
    if (!items || items.length === 0) return null;
    return (
      <div>
        <label className="text-sm font-medium text-muted-foreground">{label}</label>
        <ul className="mt-2 space-y-1">
          {items.map((item, idx) => (
            <li key={idx} className="flex items-start gap-2">
              <span className="text-primary">•</span>
              <span className="text-base">{typeof item === 'string' ? item : JSON.stringify(item)}</span>
            </li>
          ))}
        </ul>
      </div>
    );
  };

  const renderList = (label: string, items: any[]) => {
    if (!items || items.length === 0) return null;
    return (
      <div>
        <label className="text-sm font-medium text-muted-foreground">{label}</label>
        <ul className="mt-2 space-y-1">
          {items.map((item, idx) => (
            <li key={idx} className="flex items-start gap-2">
              <Clock className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
              <span className="text-base">{typeof item === 'string' ? item : item.time || JSON.stringify(item)}</span>
            </li>
          ))}
        </ul>
      </div>
    );
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Pill className="h-5 w-5 text-primary" />
          Medication Administration
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Medication Overview */}
        <div>
          <h4 className="font-semibold text-base mb-3">Medication Overview</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {renderYesNo('Takes Medication', adminMedication.take_medication)}
            {renderField('Medication Details', adminMedication.take_medication_details)}
            {renderYesNo('Allergic to Medicine', adminMedication.allergic_to_medicine)}
            {renderYesNo('Needs Assistance', adminMedication.need_assistance)}
          </div>
        </div>

        {/* Storage and Access */}
        <div>
          <h4 className="font-semibold text-base mb-3">Storage & Access</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {renderField('Medicine Storage Location', adminMedication.medicine_storage_location)}
            {renderField('Medication Storage', adminMedication.medication_storage)}
            {renderYesNo('Has Medicines Box', adminMedication.have_medicines_box)}
            {renderArrayField('Medicines Access', adminMedication.medicines_access)}
            {renderYesNo('Uses Dosette Box', adminMedication.use_dosette_box)}
            {renderField('Dosette Box Details', adminMedication.dosette_box_details)}
            {renderYesNo('Medication Outside Dosette', adminMedication.medication_outside_dosette)}
          </div>
        </div>

        {/* Administration */}
        <div>
          <h4 className="font-semibold text-base mb-3">Administration</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {renderField('Administration Method', adminMedication.admin_method)}
            {renderArrayField('Administration Methods', adminMedication.administration_methods)}
            {renderList('Administration Times', adminMedication.administration_times)}
            {renderYesNo('Trained Staff Required', adminMedication.trained_staff_required)}
            {renderYesNo('Help Required - Inhalers', adminMedication.help_required_inhalers)}
            {renderYesNo('Help Required - Eye Drops', adminMedication.help_required_eye_drops)}
            {renderYesNo('Help Required - Creams', adminMedication.help_required_creams)}
            {renderYesNo('Uses Pain Patches', adminMedication.use_pain_patches)}
            {renderField('Disposal Method', adminMedication.disposal_method)}
          </div>
        </div>

        {adminMedication.special_instructions && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <h4 className="font-medium text-yellow-900 mb-2 flex items-center gap-2">
              <AlertTriangle className="h-4 w-4" />
              Special Instructions
            </h4>
            <p className="text-sm text-yellow-800 whitespace-pre-wrap">{adminMedication.special_instructions}</p>
          </div>
        )}

        {(adminMedication.monitoring_requirements || adminMedication.side_effects_to_monitor) && (
          <div>
            <h4 className="font-semibold text-base mb-3">Monitoring</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {renderField('Monitoring Requirements', adminMedication.monitoring_requirements)}
              {renderField('Side Effects to Monitor', adminMedication.side_effects_to_monitor)}
            </div>
          </div>
        )}

        {adminMedication.notes && (
          <div className="bg-muted/50 rounded p-3">
            <label className="text-sm font-medium">Additional Notes</label>
            <p className="text-sm mt-1 whitespace-pre-wrap">{adminMedication.notes}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

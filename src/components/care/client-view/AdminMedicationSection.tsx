import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Pill, Clock, AlertTriangle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface AdminMedicationSectionProps {
  adminMedication: any;
}

export function AdminMedicationSection({ adminMedication }: AdminMedicationSectionProps) {
  const data = adminMedication || {};

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

  const renderYesNo = (label: string, value: any) => {
    const hasValue = value !== undefined && value !== null && value !== '';
    
    return (
      <div>
        <label className="text-sm font-medium text-muted-foreground">{label}</label>
        {hasValue ? (
          <Badge variant={value === 'yes' || value === true ? 'default' : 'secondary'} className="mt-1 block w-fit">
            {value === 'yes' || value === true ? 'Yes' : 'No'}
          </Badge>
        ) : (
          <p className="text-sm mt-1 text-muted-foreground italic">No data provided</p>
        )}
      </div>
    );
  };

  const renderArrayField = (label: string, items: any[]) => {
    const hasValue = items && Array.isArray(items) && items.length > 0;
    
    return (
      <div>
        <label className="text-sm font-medium text-muted-foreground">{label}</label>
        {hasValue ? (
          <ul className="mt-2 space-y-1">
            {items.map((item, idx) => (
              <li key={idx} className="flex items-start gap-2">
                <span className="text-primary">•</span>
                <span className="text-base">{typeof item === 'string' ? item : JSON.stringify(item)}</span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm mt-1 text-muted-foreground italic">No data provided</p>
        )}
      </div>
    );
  };

  const renderList = (label: string, items: any[]) => {
    const hasValue = items && Array.isArray(items) && items.length > 0;
    
    return (
      <div>
        <label className="text-sm font-medium text-muted-foreground">{label}</label>
        {hasValue ? (
          <ul className="mt-2 space-y-1">
            {items.map((item, idx) => (
              <li key={idx} className="flex items-start gap-2">
                <Clock className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                <span className="text-base">{typeof item === 'string' ? item : item.time || JSON.stringify(item)}</span>
              </li>
            ))}
          </ul>
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
          <Pill className="h-5 w-5 text-primary" />
          Medication Administration
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Medication Overview */}
        <div>
          <h4 className="font-semibold text-base mb-3">Medication Overview</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {renderYesNo('Do you take medication?', data.take_medication)}
            {renderField('Medication Details', data.take_medication_details)}
            {renderYesNo('Are you allergic to any medicine?', data.allergic_to_medicine)}
            {renderYesNo('Do you need assistance with your medication?', data.need_assistance)}
          </div>
        </div>

        {/* Storage and Access */}
        <div>
          <h4 className="font-semibold text-base mb-3">Storage & Access</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {renderField('Where do you store your medicines?', data.medicine_storage_location)}
            {renderField('Medication Storage', data.medication_storage)}
            {renderYesNo('Do you have a medicines box?', data.have_medicines_box)}
            {renderArrayField('Who has access to your medicines?', data.medicines_access)}
            {renderYesNo('Do you use a dosette box?', data.use_dosette_box)}
            {renderField('Dosette Box Details', data.dosette_box_details)}
            {renderYesNo('Do you take medication outside of your dosette box?', data.medication_outside_dosette)}
          </div>
        </div>

        {/* Administration Methods */}
        <div>
          <h4 className="font-semibold text-base mb-3">Administration Methods</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {renderField('Administration Method', data.admin_method)}
            {renderArrayField('Administration Methods (select all that apply)', data.administration_methods)}
            {renderList('Administration Times', data.administration_times)}
            {renderYesNo('Trained Staff Required', data.trained_staff_required)}
          </div>
        </div>

        {/* Assistance Requirements */}
        <div>
          <h4 className="font-semibold text-base mb-3">Assistance Requirements</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {renderYesNo('Do you require help with inhalers?', data.help_required_inhalers)}
            {renderYesNo('Do you require help with eye drops?', data.help_required_eye_drops)}
            {renderYesNo('Do you require help with creams?', data.help_required_creams)}
            {renderYesNo('Do you use pain patches?', data.use_pain_patches)}
            {renderField('Pain Patch Details', data.pain_patch_details)}
            {renderField('Pain Patch Location', data.pain_patch_location)}
          </div>
        </div>

        {/* Specialized Treatments */}
        <div>
          <h4 className="font-semibold text-base mb-3">Specialized Treatments</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {renderYesNo('Uses Warfarin', data.uses_warfarin)}
            {renderField('Warfarin Details', data.warfarin_details)}
            {renderYesNo('Has Diabetes', data.has_diabetes)}
            {renderField('Diabetes Management', data.diabetes_management)}
            {renderYesNo('Uses Thickener', data.uses_thickener)}
            {renderField('Thickener Usage', data.thickener_usage)}
            {renderYesNo('Has PEG Feeding', data.has_peg_feeding)}
            {renderField('PEG Feeding Details', data.peg_feeding)}
            {renderYesNo('Uses Nebuliser', data.uses_nebuliser)}
            {renderField('Nebuliser Usage', data.nebuliser_usage)}
            {renderYesNo('Uses Oxygen Therapy', data.uses_oxygen_therapy)}
            {renderField('Oxygen Therapy Details', data.oxygen_therapy)}
            {renderYesNo('Has Catheter', data.has_catheter)}
            {renderField('Catheter Care', data.catheter_care)}
            {renderYesNo('Has Stoma', data.has_stoma)}
            {renderField('Stoma Care', data.stoma_care)}
          </div>
        </div>

        {/* Topical Applications */}
        <div>
          <h4 className="font-semibold text-base mb-3">Topical Applications</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {renderField('Inhaler Details', data.inhaler_details)}
            {renderField('Eye Drop Details', data.eye_drop_details)}
            {renderField('Cream Application Details', data.cream_application_details)}
            {renderArrayField('Cream Body Areas', data.cream_body_areas)}
          </div>
        </div>

        {/* Disposal */}
        <div>
          <h4 className="font-semibold text-base mb-3">Disposal</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {renderField('Disposal Method', data.disposal_method)}
          </div>
        </div>

        {/* Special Instructions */}
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <h4 className="font-medium text-yellow-900 mb-2 flex items-center gap-2">
            <AlertTriangle className="h-4 w-4" />
            Special Instructions
          </h4>
          {data.special_instructions ? (
            <p className="text-sm text-yellow-800 whitespace-pre-wrap">{data.special_instructions}</p>
          ) : (
            <p className="text-sm text-yellow-700 italic">No special instructions provided</p>
          )}
        </div>

        {/* Monitoring */}
        <div>
          <h4 className="font-semibold text-base mb-3">Monitoring</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {renderField('Monitoring Requirements', data.monitoring_requirements)}
            {renderField('Side Effects to Monitor', data.side_effects_to_monitor)}
          </div>
        </div>

        {/* Additional Notes */}
        <div className="bg-muted/50 rounded p-3">
          <label className="text-sm font-medium">Additional Notes</label>
          {data.notes ? (
            <p className="text-sm mt-1 whitespace-pre-wrap">{data.notes}</p>
          ) : (
            <p className="text-sm mt-1 text-muted-foreground italic">No additional notes provided</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

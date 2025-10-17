import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FileSignature, CheckCircle, XCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface ConsentSectionProps {
  consent: any;
}

export function ConsentSection({ consent }: ConsentSectionProps) {
  if (!consent || Object.keys(consent).length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileSignature className="h-5 w-5 text-primary" />
            Consent & Capacity
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">No consent information provided yet.</p>
        </CardContent>
      </Card>
    );
  }

  const renderYesNo = (label: string, value: any) => {
    if (value === undefined || value === null) return null;
    
    const isYes = value === true || value === 'yes' || value === 'Yes';
    
    return (
      <div className="flex items-center justify-between p-3 bg-muted/50 rounded">
        <label className="text-sm font-medium">{label}</label>
        <div className="flex items-center gap-2">
          {isYes ? (
            <>
              <CheckCircle className="h-4 w-4 text-green-600" />
              <Badge className="bg-green-100 text-green-800">Yes</Badge>
            </>
          ) : (
            <>
              <XCircle className="h-4 w-4 text-gray-600" />
              <Badge variant="secondary">No</Badge>
            </>
          )}
        </div>
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
          <FileSignature className="h-5 w-5 text-primary" />
          Consent & Capacity
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-3">
          {renderYesNo('Has Capacity to Consent', consent.has_capacity || consent.capacity_to_consent)}
          {renderYesNo('Consent Given', consent.consent_given)}
          {renderYesNo('Care Plan Importance Understood', consent.care_plan_importance_understood)}
          {renderYesNo('Share Info with Professionals', consent.share_info_with_professionals)}
          {renderYesNo('Regular Reviews Understood', consent.regular_reviews_understood)}
          {renderYesNo('May Need Capacity Assessment', consent.may_need_capacity_assessment)}
          {renderYesNo('Consent to Care and Support', consent.consent_to_care_and_support)}
          {renderYesNo('Consent to Medication Administration', consent.consent_to_medication_administration)}
          {renderYesNo('Consent to Healthcare Professionals', consent.consent_to_healthcare_professionals)}
          {renderYesNo('Consent to Emergency Services', consent.consent_to_emergency_services)}
          {renderYesNo('Consent to Care Plan Changes', consent.consent_to_care_plan_changes)}
          {renderYesNo('Consent to Data Sharing', consent.consent_to_data_sharing)}
          {renderYesNo('Consent to Personal Care', consent.consent_to_personal_care)}
          {renderYesNo('Medication Support Consent', consent.medication_support_consent)}
          {renderYesNo('Discuss Health and Risks', consent.discuss_health_and_risks)}
          {renderYesNo('Power of Attorney in Place', consent.power_of_attorney)}
          {renderYesNo('Advanced Directive Available', consent.advanced_directive)}
          {renderYesNo('DNAR (Do Not Attempt Resuscitation)', consent.dnar)}
        </div>

        <div className="grid grid-cols-1 gap-6">
          {renderField('Capacity Assessment Notes', consent.capacity_assessment_notes || consent.capacity_notes)}
          {renderField('Consent Limitations', consent.consent_limitations)}
          {renderField('Legal Representative', consent.legal_representative)}
          {renderField('Representative Contact', consent.representative_contact)}
          {renderField('Advanced Care Preferences', consent.advanced_care_preferences)}
          {renderField('End of Life Wishes', consent.end_of_life_wishes)}
          {renderField('Consent Statement', consent.consent_statement)}
          {renderField('Assessor Name', consent.assessor_name)}
          {renderField('Assessor Role', consent.assessor_role)}
          {renderField('Assessor Statement', consent.assessor_statement_3 || consent.assessor_statement_4)}
          {renderField('Confirmed By', consent.confirmed_by)}
          {renderField('Confirmed On', consent.confirmed_on)}
          {renderField('Witness Name', consent.witness_name)}
          {renderField('Extra Information', consent.extra_information)}
          {renderField('Additional Notes', consent.notes || consent.additional_notes)}
        </div>

        {consent.signed_date && (
          <div className="bg-green-50 border border-green-200 rounded p-4">
            <div className="flex items-center gap-2 text-green-800">
              <CheckCircle className="h-5 w-5" />
              <div>
                <p className="font-medium">Consent Form Signed</p>
                <p className="text-sm text-green-700">
                  Date: {new Date(consent.signed_date).toLocaleDateString()}
                  {consent.signed_by && ` • Signed by: ${consent.signed_by}`}
                </p>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

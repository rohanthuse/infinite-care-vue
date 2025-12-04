import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FileCheck, Calendar, User, CheckCircle, AlertCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface ReviewSectionProps {
  carePlan: any;
  additionalNotes?: string;
}

export function ReviewSection({ carePlan, additionalNotes }: ReviewSectionProps) {
  const data = carePlan || {};

  const formatDate = (date: string | Date | null | undefined) => {
    if (!date) return null;
    try {
      return new Date(date).toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      });
    } catch {
      return 'Invalid date';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'pending_client_approval': return 'bg-amber-100 text-amber-800';
      case 'draft': return 'bg-gray-100 text-gray-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      default: return 'bg-blue-100 text-blue-800';
    }
  };

  const renderDateField = (label: string, value: any, highlight = false) => {
    const formattedDate = formatDate(value);
    
    return (
      <div className={`rounded p-3 ${highlight ? 'bg-blue-50 border border-blue-200' : 'bg-muted/50'}`}>
        <label className={`text-sm ${highlight ? 'text-blue-700 font-medium' : 'text-muted-foreground'}`}>{label}</label>
        {formattedDate ? (
          <p className={`font-medium mt-1 ${highlight ? 'text-blue-900' : ''}`}>{formattedDate}</p>
        ) : (
          <p className="text-sm mt-1 text-muted-foreground italic">Not specified</p>
        )}
      </div>
    );
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileCheck className="h-5 w-5 text-primary" />
          Review & Summary
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Status Overview */}
        <div>
          <h3 className="font-semibold text-base mb-3">Current Status</h3>
          <div className="flex items-center gap-3">
            <Badge variant="custom" className={getStatusColor(data.status)}>
              {data.status?.replace('_', ' ').toUpperCase() || 'UNKNOWN'}
            </Badge>
            {data.client_acknowledged_at && (
              <span className="text-sm text-green-600 flex items-center gap-1">
                <CheckCircle className="h-4 w-4" />
                Approved on {formatDate(data.client_acknowledged_at)}
              </span>
            )}
          </div>
        </div>

        {/* Key Dates */}
        <div>
          <h3 className="font-semibold text-base mb-3 flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            Important Dates
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {renderDateField('Plan Created', data.created_at)}
            {renderDateField('Last Updated', data.updated_at)}
            {renderDateField('Start Date', data.start_date)}
            {renderDateField('End Date', data.end_date)}
            {renderDateField('Next Review Date', data.review_date, true)}
          </div>
        </div>

        {/* Care Team */}
        <div>
          <h3 className="font-semibold text-base mb-3 flex items-center gap-2">
            <User className="h-4 w-4" />
            Care Team
          </h3>
          <div className="bg-muted/50 rounded p-4">
            <div className="flex items-center gap-3">
              <User className="h-8 w-8 text-primary" />
              <div>
                <p className="font-medium">{data.provider_name || <span className="text-muted-foreground italic">Not assigned</span>}</p>
                <p className="text-sm text-muted-foreground">Primary Care Provider</p>
              </div>
            </div>
          </div>
        </div>

        {/* Summary Statistics */}
        <div>
          <h3 className="font-semibold text-base mb-3">Care Plan Summary</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-blue-50 border border-blue-200 rounded p-3 text-center">
              <p className="text-2xl font-bold text-blue-700">{data.goals?.length || 0}</p>
              <p className="text-xs text-blue-600 mt-1">Goals</p>
            </div>
            <div className="bg-green-50 border border-green-200 rounded p-3 text-center">
              <p className="text-2xl font-bold text-green-700">{data.medications?.length || 0}</p>
              <p className="text-xs text-green-600 mt-1">Medications</p>
            </div>
            <div className="bg-purple-50 border border-purple-200 rounded p-3 text-center">
              <p className="text-2xl font-bold text-purple-700">{data.activities?.length || 0}</p>
              <p className="text-xs text-purple-600 mt-1">Activities</p>
            </div>
            <div className="bg-amber-50 border border-amber-200 rounded p-3 text-center">
              <p className="text-2xl font-bold text-amber-700">{data.risk_assessments?.length || 0}</p>
              <p className="text-xs text-amber-600 mt-1">Risk Assessments</p>
            </div>
          </div>
        </div>

        {/* Completion Progress */}
        <div>
          <h3 className="font-semibold text-base mb-3">Completion Progress</h3>
          <div className="space-y-2">
            {[
              { label: 'Basic Information', complete: !!data.title },
              { label: 'About Me', complete: !!data.about_me && Object.keys(data.about_me || {}).length > 0 },
              { label: 'Medical Information', complete: !!data.medical_info && Object.keys(data.medical_info || {}).length > 0 },
              { label: 'Goals', complete: (data.goals?.length || 0) > 0 },
              { label: 'Activities', complete: (data.activities?.length || 0) > 0 },
              { label: 'Personal Care', complete: !!data.personal_care && Object.keys(data.personal_care || {}).length > 0 },
              { label: 'Dietary Requirements', complete: !!data.dietary && Object.keys(data.dietary || {}).length > 0 },
              { label: 'Risk Assessments', complete: (data.risk_assessments?.length || 0) > 0 },
              { label: 'Consent', complete: !!data.consent && Object.keys(data.consent || {}).length > 0 },
            ].map((item, idx) => (
              <div key={idx} className="flex items-center justify-between p-2 rounded bg-muted/30">
                <span className="text-sm">{item.label}</span>
                {item.complete ? (
                  <Badge variant="default" className="bg-green-100 text-green-800">
                    <CheckCircle className="h-3 w-3 mr-1" />
                    Complete
                  </Badge>
                ) : (
                  <Badge variant="secondary">
                    <AlertCircle className="h-3 w-3 mr-1" />
                    Incomplete
                  </Badge>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Additional Notes */}
        <div>
          <h3 className="font-semibold text-base mb-3">Additional Notes</h3>
          <div className="bg-muted/50 rounded p-4">
            {additionalNotes || data.additional_notes ? (
              <p className="text-sm whitespace-pre-wrap">{additionalNotes || data.additional_notes}</p>
            ) : (
              <p className="text-sm text-muted-foreground italic">No additional notes provided</p>
            )}
          </div>
        </div>

        {/* Approval Information */}
        {data.status === 'pending_client_approval' && (
          <div className="bg-amber-50 border border-amber-200 rounded p-4">
            <h4 className="font-semibold text-amber-900 mb-2 flex items-center gap-2">
              <AlertCircle className="h-4 w-4" />
              Awaiting Your Approval
            </h4>
            <p className="text-sm text-amber-800">
              This care plan has been prepared by your care team and is ready for your review. 
              Please review all sections carefully and provide your approval when ready.
            </p>
          </div>
        )}

        {data.client_acknowledged_at && (
          <div className="bg-green-50 border border-green-200 rounded p-4">
            <h4 className="font-semibold text-green-900 mb-2 flex items-center gap-2">
              <CheckCircle className="h-5 w-5" />
              Approved by You
            </h4>
            <p className="text-sm text-green-800">
              You approved this care plan on {formatDate(data.client_acknowledged_at)}.
              {data.client_approval_comments && (
                <>
                  <br /><br />
                  <strong>Your comments:</strong> {data.client_approval_comments}
                </>
              )}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

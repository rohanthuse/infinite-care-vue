import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FileCheck, Calendar, User } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface ReviewSectionProps {
  carePlan: any;
  additionalNotes?: string;
}

export function ReviewSection({ carePlan, additionalNotes }: ReviewSectionProps) {
  const formatDate = (date: string | Date | null | undefined) => {
    if (!date) return 'Not specified';
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
            <Badge className={getStatusColor(carePlan.status)}>
              {carePlan.status?.replace('_', ' ').toUpperCase() || 'UNKNOWN'}
            </Badge>
            {carePlan.client_acknowledged_at && (
              <span className="text-sm text-green-600 flex items-center gap-1">
                ✓ Approved on {formatDate(carePlan.client_acknowledged_at)}
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
            <div className="bg-muted/50 rounded p-3">
              <label className="text-sm text-muted-foreground">Plan Created</label>
              <p className="font-medium mt-1">{formatDate(carePlan.created_at)}</p>
            </div>
            <div className="bg-muted/50 rounded p-3">
              <label className="text-sm text-muted-foreground">Last Updated</label>
              <p className="font-medium mt-1">{formatDate(carePlan.updated_at)}</p>
            </div>
            {carePlan.start_date && (
              <div className="bg-muted/50 rounded p-3">
                <label className="text-sm text-muted-foreground">Start Date</label>
                <p className="font-medium mt-1">{formatDate(carePlan.start_date)}</p>
              </div>
            )}
            {carePlan.end_date && (
              <div className="bg-muted/50 rounded p-3">
                <label className="text-sm text-muted-foreground">End Date</label>
                <p className="font-medium mt-1">{formatDate(carePlan.end_date)}</p>
              </div>
            )}
            {carePlan.review_date && (
              <div className="bg-blue-50 border border-blue-200 rounded p-3">
                <label className="text-sm text-blue-700 font-medium">Next Review Date</label>
                <p className="font-medium mt-1 text-blue-900">{formatDate(carePlan.review_date)}</p>
              </div>
            )}
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
                <p className="font-medium">{carePlan.provider_name || 'Not assigned'}</p>
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
              <p className="text-2xl font-bold text-blue-700">{carePlan.goals?.length || 0}</p>
              <p className="text-xs text-blue-600 mt-1">Goals</p>
            </div>
            <div className="bg-green-50 border border-green-200 rounded p-3 text-center">
              <p className="text-2xl font-bold text-green-700">{carePlan.medications?.length || 0}</p>
              <p className="text-xs text-green-600 mt-1">Medications</p>
            </div>
            <div className="bg-purple-50 border border-purple-200 rounded p-3 text-center">
              <p className="text-2xl font-bold text-purple-700">{carePlan.activities?.length || 0}</p>
              <p className="text-xs text-purple-600 mt-1">Activities</p>
            </div>
            <div className="bg-amber-50 border border-amber-200 rounded p-3 text-center">
              <p className="text-2xl font-bold text-amber-700">{carePlan.risk_assessments?.length || 0}</p>
              <p className="text-xs text-amber-600 mt-1">Risk Assessments</p>
            </div>
          </div>
        </div>

        {/* Additional Notes */}
        {additionalNotes && (
          <div>
            <h3 className="font-semibold text-base mb-3">Additional Notes</h3>
            <div className="bg-muted/50 rounded p-4">
              <p className="text-sm whitespace-pre-wrap">{additionalNotes}</p>
            </div>
          </div>
        )}

        {/* Approval Information */}
        {carePlan.status === 'pending_client_approval' && (
          <div className="bg-amber-50 border border-amber-200 rounded p-4">
            <h4 className="font-semibold text-amber-900 mb-2">⏳ Awaiting Your Approval</h4>
            <p className="text-sm text-amber-800">
              This care plan has been prepared by your care team and is ready for your review. 
              Please review all sections carefully and provide your approval when ready.
            </p>
          </div>
        )}

        {carePlan.client_acknowledged_at && (
          <div className="bg-green-50 border border-green-200 rounded p-4">
            <h4 className="font-semibold text-green-900 mb-2 flex items-center gap-2">
              <FileCheck className="h-5 w-5" />
              ✓ Approved by You
            </h4>
            <p className="text-sm text-green-800">
              You approved this care plan on {formatDate(carePlan.client_acknowledged_at)}.
              {carePlan.client_approval_comments && (
                <>
                  <br /><br />
                  <strong>Your comments:</strong> {carePlan.client_approval_comments}
                </>
              )}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

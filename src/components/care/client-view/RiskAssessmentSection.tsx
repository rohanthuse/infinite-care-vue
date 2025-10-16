import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ShieldAlert, AlertTriangle, Calendar } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface RiskAssessmentSectionProps {
  riskAssessments: any[];
}

export function RiskAssessmentSection({ riskAssessments }: RiskAssessmentSectionProps) {
  if (!riskAssessments || riskAssessments.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShieldAlert className="h-5 w-5 text-primary" />
            Risk Assessments
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">No risk assessments recorded yet.</p>
        </CardContent>
      </Card>
    );
  }

  const getRiskColor = (level: string) => {
    switch (level?.toLowerCase()) {
      case 'high': case 'critical': return 'bg-red-100 text-red-800 border-red-200';
      case 'medium': case 'moderate': return 'bg-amber-100 text-amber-800 border-amber-200';
      case 'low': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ShieldAlert className="h-5 w-5 text-primary" />
          Risk Assessments ({riskAssessments.length})
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {riskAssessments.map((risk, idx) => (
          <Card key={idx} className="border-l-4 border-l-red-500">
            <CardContent className="pt-4">
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <h4 className="font-semibold text-base flex items-center gap-2">
                      {risk.risk_type || risk.type || risk.category}
                      {(risk.risk_level === 'high' || risk.risk_level === 'critical') && (
                        <AlertTriangle className="h-4 w-4 text-red-600" />
                      )}
                    </h4>
                    {risk.description && (
                      <p className="text-sm text-muted-foreground mt-1">{risk.description}</p>
                    )}
                  </div>
                  {risk.risk_level && (
                    <Badge className={getRiskColor(risk.risk_level)}>
                      {risk.risk_level} Risk
                    </Badge>
                  )}
                </div>

                {risk.identified_risks && (
                  <div className="bg-amber-50 border border-amber-200 rounded p-3">
                    <label className="text-sm font-medium text-amber-900">Identified Risks</label>
                    <p className="text-sm text-amber-800 mt-1 whitespace-pre-wrap">{risk.identified_risks}</p>
                  </div>
                )}

                {risk.control_measures && (
                  <div className="bg-green-50 border border-green-200 rounded p-3">
                    <label className="text-sm font-medium text-green-900">Control Measures</label>
                    <p className="text-sm text-green-800 mt-1 whitespace-pre-wrap">{risk.control_measures}</p>
                  </div>
                )}

                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                  {risk.assessment_date && (
                    <div>
                      <label className="text-muted-foreground">Assessment Date</label>
                      <p className="font-medium">{new Date(risk.assessment_date).toLocaleDateString()}</p>
                    </div>
                  )}
                  {risk.review_date && (
                    <div>
                      <label className="text-muted-foreground flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        Next Review
                      </label>
                      <p className="font-medium">{new Date(risk.review_date).toLocaleDateString()}</p>
                    </div>
                  )}
                  {risk.assessed_by && (
                    <div>
                      <label className="text-muted-foreground">Assessed By</label>
                      <p className="font-medium">{risk.assessed_by}</p>
                    </div>
                  )}
                </div>

                {risk.notes && (
                  <div className="bg-muted/50 rounded p-3">
                    <label className="text-sm font-medium">Additional Notes</label>
                    <p className="text-sm mt-1">{risk.notes}</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </CardContent>
    </Card>
  );
}

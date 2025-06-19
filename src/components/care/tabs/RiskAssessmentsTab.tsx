
import React from "react";
import { format } from "date-fns";
import { AlertTriangle, Plus, Calendar, User, Shield } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ClientRiskAssessment } from "@/hooks/useClientRiskAssessments";

interface RiskAssessmentsTabProps {
  clientId: string;
  riskAssessments: ClientRiskAssessment[];
  onAddRiskAssessment?: () => void;
}

export const RiskAssessmentsTab: React.FC<RiskAssessmentsTabProps> = ({
  clientId,
  riskAssessments,
  onAddRiskAssessment,
}) => {
  const getRiskLevelColor = (level: string) => {
    switch (level.toLowerCase()) {
      case 'low': return 'bg-green-100 text-green-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'high': return 'bg-orange-100 text-orange-800';
      case 'critical': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-blue-100 text-blue-800';
      case 'resolved': return 'bg-green-100 text-green-800';
      case 'under_review': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="pb-2 bg-gradient-to-r from-blue-50 to-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-blue-600" />
              <CardTitle className="text-lg">Risk Assessments</CardTitle>
            </div>
            <Button size="sm" className="gap-1" onClick={onAddRiskAssessment}>
              <Plus className="h-4 w-4" />
              <span>Add Risk Assessment</span>
            </Button>
          </div>
          <CardDescription>Risk evaluations and mitigation strategies</CardDescription>
        </CardHeader>
        <CardContent className="pt-4">
          {riskAssessments.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Shield className="h-12 w-12 mx-auto mb-3 text-gray-300" />
              <p className="text-sm">No risk assessments available</p>
              {onAddRiskAssessment && (
                <Button variant="outline" className="mt-3" onClick={onAddRiskAssessment}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add First Risk Assessment
                </Button>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              {riskAssessments.map((assessment) => (
                <div key={assessment.id} className="border rounded-lg p-4 hover:shadow-sm transition-shadow">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <h3 className="font-medium">{assessment.risk_type}</h3>
                      <div className="flex gap-2">
                        <Badge className={getRiskLevelColor(assessment.risk_level)}>
                          {assessment.risk_level} Risk
                        </Badge>
                        <Badge variant="outline" className={getStatusColor(assessment.status)}>
                          {assessment.status}
                        </Badge>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-4 text-sm text-gray-600">
                      <div className="flex items-center gap-1">
                        <User className="h-4 w-4" />
                        <span>Assessed by: {assessment.assessed_by}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        <span>{format(new Date(assessment.assessment_date), 'MMM dd, yyyy')}</span>
                      </div>
                    </div>

                    {assessment.risk_factors && assessment.risk_factors.length > 0 && (
                      <div>
                        <h4 className="text-sm font-medium text-gray-700 mb-1">Risk Factors:</h4>
                        <ul className="text-sm text-gray-600 list-disc list-inside">
                          {assessment.risk_factors.map((factor, index) => (
                            <li key={index}>{factor}</li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {assessment.mitigation_strategies && assessment.mitigation_strategies.length > 0 && (
                      <div>
                        <h4 className="text-sm font-medium text-gray-700 mb-1">Mitigation Strategies:</h4>
                        <ul className="text-sm text-gray-600 list-disc list-inside">
                          {assessment.mitigation_strategies.map((strategy, index) => (
                            <li key={index}>{strategy}</li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {assessment.review_date && (
                      <div className="flex items-center gap-1 text-sm text-orange-600">
                        <AlertTriangle className="h-4 w-4" />
                        <span>Review due: {format(new Date(assessment.review_date), 'MMM dd, yyyy')}</span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

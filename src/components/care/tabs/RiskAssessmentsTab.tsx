
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
      case 'low': return 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300';
      case 'medium': return 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300';
      case 'high': return 'bg-orange-100 dark:bg-orange-900/30 text-orange-800 dark:text-orange-300';
      case 'critical': return 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300';
      case 'resolved': return 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300';
      case 'under_review': return 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="pb-2 bg-gradient-to-r from-blue-50 to-white dark:from-blue-950/30 dark:to-background">
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
            <div className="text-center py-8 text-muted-foreground">
              <Shield className="h-12 w-12 mx-auto mb-3 text-muted-foreground/50" />
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
                        <Badge variant="custom" className={getRiskLevelColor(assessment.risk_level)}>
                          {assessment.risk_level} Risk
                        </Badge>
                        <Badge variant="outline" className={getStatusColor(assessment.status)}>
                          {assessment.status}
                        </Badge>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
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
                        <h4 className="text-sm font-medium text-foreground mb-1">Risk Factors:</h4>
                        <ul className="text-sm text-muted-foreground list-disc list-inside">
                          {assessment.risk_factors.map((factor, index) => (
                            <li key={index}>{factor}</li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {assessment.mitigation_strategies && assessment.mitigation_strategies.length > 0 && (
                      <div>
                        <h4 className="text-sm font-medium text-foreground mb-1">Mitigation Strategies:</h4>
                        <ul className="text-sm text-muted-foreground list-disc list-inside">
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

                    {/* Risk Section */}
                    {(assessment.rag_status || assessment.has_pets || assessment.fall_risk || assessment.risk_to_staff || assessment.adverse_weather_plan) && (
                      <div className="mt-4 border-t pt-3">
                        <h4 className="text-sm font-semibold text-foreground mb-2">Risk Information</h4>
                        <div className="space-y-2">
                          {assessment.rag_status && (
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-medium">RAG Status:</span>
                              <Badge 
                                variant="custom"
                                className={
                                  assessment.rag_status === 'red' ? 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300' :
                                  assessment.rag_status === 'amber' ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-300' :
                                  assessment.rag_status === 'green' ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300' :
                                  'bg-muted text-muted-foreground'
                                }
                              >
                                {assessment.rag_status === '' ? 'None' : assessment.rag_status.charAt(0).toUpperCase() + assessment.rag_status.slice(1)}
                              </Badge>
                            </div>
                          )}
                          {assessment.has_pets && (
                            <div className="text-sm text-muted-foreground">• Has pets</div>
                          )}
                          {assessment.fall_risk && (
                            <div className="text-sm">
                              <span className="font-medium text-foreground">Fall Risk:</span>
                              <span className="text-muted-foreground ml-1">{assessment.fall_risk}</span>
                            </div>
                          )}
                          {assessment.risk_to_staff && assessment.risk_to_staff.length > 0 && (
                            <div>
                              <span className="text-sm font-medium text-foreground">Risk to Staff:</span>
                              <ul className="text-sm text-muted-foreground list-disc list-inside ml-2">
                                {assessment.risk_to_staff.map((risk, index) => (
                                  <li key={index}>{risk}</li>
                                ))}
                              </ul>
                            </div>
                          )}
                          {assessment.adverse_weather_plan && (
                            <div className="text-sm">
                              <span className="font-medium text-foreground">Adverse Weather Plan:</span>
                              <span className="text-muted-foreground ml-1">{assessment.adverse_weather_plan}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Personal Risk Section */}
                    {(assessment.lives_alone || assessment.rural_area || assessment.cared_in_bed || assessment.smoker || assessment.can_call_for_assistance || assessment.communication_needs || assessment.social_support || assessment.fallen_past_six_months || assessment.has_assistance_device || assessment.arrange_assistance_device) && (
                      <div className="mt-4 border-t pt-3">
                        <h4 className="text-sm font-semibold text-foreground mb-2">Personal Risk Factors</h4>
                        <div className="space-y-1 text-sm text-muted-foreground">
                          {assessment.lives_alone && <div>• Lives alone</div>}
                          {assessment.rural_area && <div>• Lives in rural area</div>}
                          {assessment.cared_in_bed && <div>• Cared in bed</div>}
                          {assessment.smoker && <div>• Smoker</div>}
                          {assessment.can_call_for_assistance && <div>• Can call for assistance</div>}
                          {assessment.fallen_past_six_months && <div>• Fallen in past 6 months</div>}
                          {assessment.has_assistance_device && <div>• Has assistance device</div>}
                          {assessment.arrange_assistance_device && <div>• Need to arrange assistance device</div>}
                          {assessment.communication_needs && (
                            <div>
                              <span className="font-medium text-foreground">Communication needs:</span>
                              <span className="ml-1 text-muted-foreground">{assessment.communication_needs}</span>
                            </div>
                          )}
                          {assessment.social_support && (
                            <div>
                              <span className="font-medium text-foreground">Social support:</span>
                              <span className="ml-1 text-muted-foreground">{assessment.social_support}</span>
                            </div>
                          )}
                        </div>
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

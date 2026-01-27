
import React from "react";
import { format } from "date-fns";
import { ShieldAlert, Calendar, User, AlertTriangle, Clock, Plus } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ClientRiskAssessment } from "@/hooks/useClientRiskAssessments";

interface ClientRiskInfo {
  rag_status?: string;
  has_pets?: boolean;
  fall_risk?: string;
  risk_to_staff?: string[];
  adverse_weather_plan?: string;
}

interface ClientPersonalRisk {
  lives_alone?: boolean;
  rural_area?: boolean;
  cared_in_bed?: boolean;
  smoker?: boolean;
  can_call_for_assistance?: boolean;
  communication_needs?: string;
  social_support?: string;
  fallen_past_six_months?: boolean;
  has_assistance_device?: boolean;
  arrange_assistance_device?: boolean;
}

interface RiskTabProps {
  riskAssessments: ClientRiskAssessment[];
  clientRiskInfo?: ClientRiskInfo;
  clientPersonalRisk?: ClientPersonalRisk;
  onAddRiskAssessment?: () => void;
  onEditRiskAssessment?: (riskAssessment: ClientRiskAssessment) => void;
}

export const RiskTab: React.FC<RiskTabProps> = ({ 
  riskAssessments, 
  clientRiskInfo,
  clientPersonalRisk,
  onAddRiskAssessment,
  onEditRiskAssessment 
}) => {
  // Get client-level risk info from props OR fallback to first assessment for backwards compatibility
  const effectiveRiskInfo: ClientRiskInfo = clientRiskInfo || (riskAssessments[0] ? {
    rag_status: riskAssessments[0].rag_status,
    has_pets: riskAssessments[0].has_pets,
    fall_risk: riskAssessments[0].fall_risk,
    risk_to_staff: riskAssessments[0].risk_to_staff,
    adverse_weather_plan: riskAssessments[0].adverse_weather_plan,
  } : {});

  const effectivePersonalRisk: ClientPersonalRisk = clientPersonalRisk || (riskAssessments[0] ? {
    lives_alone: riskAssessments[0].lives_alone,
    rural_area: riskAssessments[0].rural_area,
    cared_in_bed: riskAssessments[0].cared_in_bed,
    smoker: riskAssessments[0].smoker,
    can_call_for_assistance: riskAssessments[0].can_call_for_assistance,
    communication_needs: riskAssessments[0].communication_needs,
    social_support: riskAssessments[0].social_support,
    fallen_past_six_months: riskAssessments[0].fallen_past_six_months,
    has_assistance_device: riskAssessments[0].has_assistance_device,
    arrange_assistance_device: riskAssessments[0].arrange_assistance_device,
  } : {});
  const getRiskLevelClass = (level: string) => {
    switch (level.toLowerCase()) {
      case "high":
        return "bg-red-50 text-red-700 border-red-200";
      case "moderate":
      case "medium":
        return "bg-amber-50 text-amber-700 border-amber-200";
      case "low":
        return "bg-green-50 text-green-700 border-green-200";
      default:
        return "bg-gray-50 text-gray-700 border-gray-200";
    }
  };

  return (
    <Card>
      <CardHeader className="pb-2 bg-gradient-to-r from-amber-50 to-white">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg flex items-center gap-2">
              <ShieldAlert className="h-5 w-5 text-amber-600" />
              <span>Risk Assessment</span>
            </CardTitle>
            <CardDescription>Safety risks and mitigation plans</CardDescription>
          </div>
          {onAddRiskAssessment && (
            <Button variant="outline" size="sm" onClick={onAddRiskAssessment}>
              <Plus className="h-4 w-4 mr-2" />
              Add Risk Assessment
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="pt-4">
        <div className="space-y-4">
          {riskAssessments.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <ShieldAlert className="h-12 w-12 mx-auto mb-3 text-gray-300" />
              <p className="text-sm mb-4">No risk assessments available</p>
              {onAddRiskAssessment && (
                <Button variant="outline" onClick={onAddRiskAssessment}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Risk Assessment
                </Button>
              )}
            </div>
          ) : (
            <>
              {/* General Client Risk - Displayed ONCE */}
              {(effectiveRiskInfo.rag_status || effectiveRiskInfo.has_pets || effectiveRiskInfo.fall_risk || effectiveRiskInfo.adverse_weather_plan || (effectiveRiskInfo.risk_to_staff && effectiveRiskInfo.risk_to_staff.length > 0)) && (
                <div className="border rounded-lg overflow-hidden mb-4">
                  <div className="p-4 bg-orange-50">
                    <p className="text-sm font-medium text-gray-700 mb-3">General Client Risk</p>
                    <div className="bg-white p-3 rounded-md border border-orange-100 space-y-3">
                      {effectiveRiskInfo.rag_status && (
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium text-orange-800">RAG Status:</span>
                          <Badge variant="outline" className={
                            effectiveRiskInfo.rag_status === 'red' ? 'bg-red-100 text-red-700 border-red-300' :
                            effectiveRiskInfo.rag_status === 'amber' ? 'bg-amber-100 text-amber-700 border-amber-300' :
                            effectiveRiskInfo.rag_status === 'green' ? 'bg-green-100 text-green-700 border-green-300' :
                            'bg-gray-100 text-gray-700 border-gray-300'
                          }>
                            {effectiveRiskInfo.rag_status.charAt(0).toUpperCase() + effectiveRiskInfo.rag_status.slice(1)}
                          </Badge>
                        </div>
                      )}
                      {effectiveRiskInfo.has_pets && (
                        <div className="text-sm text-orange-800">
                          <span className="font-medium">• Has pets</span>
                        </div>
                      )}
                      {effectiveRiskInfo.fall_risk && (
                        <div className="text-sm">
                          <span className="font-medium text-orange-800">Fall Risk: </span>
                          <span className="text-orange-700">{effectiveRiskInfo.fall_risk}</span>
                        </div>
                      )}
                      {effectiveRiskInfo.risk_to_staff && effectiveRiskInfo.risk_to_staff.length > 0 && (
                        <div>
                          <span className="text-sm font-medium text-orange-800 block mb-1">Risks to Staff:</span>
                          <div className="space-y-1">
                            {effectiveRiskInfo.risk_to_staff.map((staffRisk, index) => (
                              <div key={index} className="text-sm text-orange-700 flex items-start">
                                <AlertTriangle className="h-3 w-3 mr-2 flex-shrink-0 mt-0.5 text-orange-600" />
                                {staffRisk}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                      {effectiveRiskInfo.adverse_weather_plan && (
                        <div className="text-sm">
                          <span className="font-medium text-orange-800">Weather Plan: </span>
                          <span className="text-orange-700">{effectiveRiskInfo.adverse_weather_plan}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Risk Assessments Loop */}
              {riskAssessments.map((risk) => (
                <div key={risk.id} className="border rounded-lg overflow-hidden hover:shadow-md transition-all mb-4">
                  <div className="p-4 bg-gradient-to-r from-gray-50 to-white border-b">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <div className="mr-3 p-2 rounded-full bg-amber-100">
                          <AlertTriangle className="h-5 w-5 text-amber-600" />
                        </div>
                        <div>
                          <h3 className="font-medium text-lg">{risk.risk_type}</h3>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge 
                              variant="outline" 
                              className={getRiskLevelClass(risk.risk_level)}
                            >
                              {risk.risk_level} Risk
                            </Badge>
                            <Badge variant="outline" className="text-xs">
                              {risk.status}
                            </Badge>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="p-4 bg-white">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                      <div>
                        <p className="text-sm font-medium text-gray-500">Assessment Date</p>
                        <div className="flex items-center gap-1 mt-1">
                          <Calendar className="h-3.5 w-3.5 text-gray-400" />
                          <span className="text-sm">{format(new Date(risk.assessment_date), 'MMM dd, yyyy')}</span>
                        </div>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-500">Assessed By</p>
                        <div className="flex items-center gap-1 mt-1">
                          <User className="h-3.5 w-3.5 text-gray-400" />
                          <span className="text-sm">{risk.assessed_by}</span>
                        </div>
                      </div>
                      {risk.review_date && (
                        <div>
                          <p className="text-sm font-medium text-gray-500">Next Review</p>
                          <div className="flex items-center gap-1 mt-1">
                            <Clock className="h-3.5 w-3.5 text-gray-400" />
                            <span className="text-sm">{format(new Date(risk.review_date), 'MMM dd, yyyy')}</span>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Risk Factors */}
                    {risk.risk_factors && risk.risk_factors.length > 0 && (
                      <div className="mb-4">
                        <p className="text-sm font-medium text-gray-700 mb-2">Risk Factors</p>
                        <div className="space-y-1">
                          {risk.risk_factors.map((factor, index) => (
                            <div key={index} className="flex items-start text-sm">
                              <AlertTriangle className="h-4 w-4 mr-2 text-amber-500 flex-shrink-0 mt-0.5" />
                              <span>{factor}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    {/* Mitigation Strategies */}
                    {risk.mitigation_strategies && risk.mitigation_strategies.length > 0 && (
                      <div className="pt-3 border-t">
                        <p className="text-sm font-medium text-gray-700 mb-2">Mitigation Strategies</p>
                        <div className="bg-green-50 p-3 rounded-md border border-green-100">
                          <div className="space-y-1">
                            {risk.mitigation_strategies.map((strategy, index) => (
                              <div key={index} className="flex items-start text-sm">
                                <div className="w-2 h-2 bg-green-500 rounded-full mt-2 mr-2 flex-shrink-0"></div>
                                <span className="text-green-800">{strategy}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}

                    <div className="flex justify-end gap-2 mt-4">
                      {onEditRiskAssessment && (
                        <Button variant="outline" size="sm" onClick={() => onEditRiskAssessment(risk)}>
                          Update Assessment
                        </Button>
                      )}
                      <Button size="sm">Schedule Review</Button>
                    </div>
                  </div>
                </div>
              ))}

              {/* Personal Risk Factors - Displayed ONCE */}
              {(effectivePersonalRisk.lives_alone || effectivePersonalRisk.rural_area || effectivePersonalRisk.cared_in_bed || effectivePersonalRisk.smoker || effectivePersonalRisk.can_call_for_assistance || 
                effectivePersonalRisk.fallen_past_six_months || effectivePersonalRisk.has_assistance_device || effectivePersonalRisk.arrange_assistance_device ||
                effectivePersonalRisk.communication_needs || effectivePersonalRisk.social_support) && (
                <div className="border rounded-lg overflow-hidden">
                  <div className="p-4 bg-blue-50">
                    <p className="text-sm font-medium text-gray-700 mb-3">Personal Risk Factors</p>
                    <div className="bg-white p-3 rounded-md border border-blue-100 space-y-2">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                        {effectivePersonalRisk.lives_alone && (
                          <div className="text-sm text-blue-800">• Lives alone</div>
                        )}
                        {effectivePersonalRisk.rural_area && (
                          <div className="text-sm text-blue-800">• Rural area</div>
                        )}
                        {effectivePersonalRisk.cared_in_bed && (
                          <div className="text-sm text-blue-800">• Cared in bed</div>
                        )}
                        {effectivePersonalRisk.smoker && (
                          <div className="text-sm text-blue-800">• Smoker</div>
                        )}
                        {effectivePersonalRisk.can_call_for_assistance && (
                          <div className="text-sm text-blue-800">• Can call for assistance</div>
                        )}
                        {effectivePersonalRisk.fallen_past_six_months && (
                          <div className="text-sm text-blue-800">• Fallen in past 6 months</div>
                        )}
                        {effectivePersonalRisk.has_assistance_device && (
                          <div className="text-sm text-blue-800">• Has assistance device</div>
                        )}
                        {effectivePersonalRisk.arrange_assistance_device && (
                          <div className="text-sm text-blue-800">• Needs assistance device arranged</div>
                        )}
                      </div>
                      {effectivePersonalRisk.communication_needs && (
                        <div className="text-sm pt-2 border-t border-blue-200">
                          <span className="font-medium text-blue-800">Communication Needs: </span>
                          <span className="text-blue-700">{effectivePersonalRisk.communication_needs}</span>
                        </div>
                      )}
                      {effectivePersonalRisk.social_support && (
                        <div className="text-sm">
                          <span className="font-medium text-blue-800">Social Support: </span>
                          <span className="text-blue-700">{effectivePersonalRisk.social_support}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
};


import React from "react";
import { format } from "date-fns";
import { ShieldAlert, Calendar, User, AlertTriangle, Clock } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ClientRiskAssessment } from "@/hooks/useClientRiskAssessments";

interface RiskTabProps {
  riskAssessments: ClientRiskAssessment[];
}

export const RiskTab: React.FC<RiskTabProps> = ({ riskAssessments }) => {
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
          <Button variant="outline" size="sm">Add Risk Assessment</Button>
        </div>
      </CardHeader>
      <CardContent className="pt-4">
        <div className="space-y-4">
          {riskAssessments.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <ShieldAlert className="h-12 w-12 mx-auto mb-3 text-gray-300" />
              <p className="text-sm">No risk assessments available</p>
            </div>
          ) : (
            riskAssessments.map((risk) => (
              <div key={risk.id} className="border rounded-lg overflow-hidden hover:shadow-md transition-all">
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
                    <Button variant="outline" size="sm">Update Assessment</Button>
                    <Button size="sm">Schedule Review</Button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
};

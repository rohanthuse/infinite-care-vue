
import React from "react";
import { format } from "date-fns";
import { ShieldAlert, Calendar, User, AlertTriangle, Clock } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface RiskAssessment {
  type: string;
  level: string;
  lastAssessed: Date;
  assessedBy: string;
  mitigationPlan: string;
  reviewDate: Date;
}

interface RiskTabProps {
  riskAssessments: RiskAssessment[];
}

export const RiskTab: React.FC<RiskTabProps> = ({ riskAssessments }) => {
  const getRiskLevelClass = (level: string) => {
    switch (level) {
      case "High":
        return "bg-red-50 text-red-700 border-red-200";
      case "Moderate":
        return "bg-amber-50 text-amber-700 border-amber-200";
      case "Low":
        return "bg-green-50 text-green-700 border-green-200";
      default:
        return "bg-gray-50 text-gray-700 border-gray-200";
    }
  };

  return (
    <Card>
      <CardHeader className="pb-2 bg-gradient-to-r from-amber-50 to-white">
        <CardTitle className="text-lg flex items-center gap-2">
          <ShieldAlert className="h-5 w-5 text-amber-600" />
          <span>Risk Assessment</span>
        </CardTitle>
        <CardDescription>Safety risks and mitigation plans</CardDescription>
      </CardHeader>
      <CardContent className="pt-4">
        <div className="space-y-4">
          {riskAssessments.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <ShieldAlert className="h-12 w-12 mx-auto mb-3 text-gray-300" />
              <p className="text-sm">No risk assessments available</p>
            </div>
          ) : (
            riskAssessments.map((risk, index) => (
              <div key={index} className="border rounded-lg overflow-hidden hover:shadow-md transition-all">
                <div className="p-4 bg-gradient-to-r from-gray-50 to-white border-b">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className="mr-3 p-2 rounded-full bg-amber-100">
                        <AlertTriangle className="h-5 w-5 text-amber-600" />
                      </div>
                      <div>
                        <h3 className="font-medium text-lg">{risk.type}</h3>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge 
                            variant="outline" 
                            className={getRiskLevelClass(risk.level)}
                          >
                            {risk.level} Risk
                          </Badge>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="p-4 bg-white">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm font-medium text-gray-500">Last Assessed</p>
                      <div className="flex items-center gap-1 mt-1">
                        <Calendar className="h-3.5 w-3.5 text-gray-400" />
                        <span className="text-sm">{format(risk.lastAssessed, 'MMM dd, yyyy')}</span>
                      </div>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-500">Assessed By</p>
                      <div className="flex items-center gap-1 mt-1">
                        <User className="h-3.5 w-3.5 text-gray-400" />
                        <span className="text-sm">{risk.assessedBy}</span>
                      </div>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-500">Next Review</p>
                      <div className="flex items-center gap-1 mt-1">
                        <Clock className="h-3.5 w-3.5 text-gray-400" />
                        <span className="text-sm">{format(risk.reviewDate, 'MMM dd, yyyy')}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="mt-4 pt-3 border-t">
                    <p className="text-sm font-medium text-gray-500 mb-1">Mitigation Plan</p>
                    <p className="text-sm bg-gray-50 p-3 rounded-md border border-gray-100">
                      {risk.mitigationPlan}
                    </p>
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


import React from "react";
import { format } from "date-fns";
import { FileBarChart2, Plus, Calendar, User, Target } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ClientAssessment } from "@/hooks/useClientAssessments";

interface AssessmentsTabProps {
  clientId: string;
  assessments: ClientAssessment[];
  onAddAssessment?: () => void;
}

export const AssessmentsTab: React.FC<AssessmentsTabProps> = ({
  clientId,
  assessments,
  onAddAssessment,
}) => {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'overdue': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="pb-2 bg-gradient-to-r from-blue-50 to-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FileBarChart2 className="h-5 w-5 text-blue-600" />
              <CardTitle className="text-lg">Assessments</CardTitle>
            </div>
            <Button size="sm" className="gap-1" onClick={onAddAssessment}>
              <Plus className="h-4 w-4" />
              <span>Add Assessment</span>
            </Button>
          </div>
          <CardDescription>Client assessments and evaluations</CardDescription>
        </CardHeader>
        <CardContent className="pt-4">
          {assessments.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <FileBarChart2 className="h-12 w-12 mx-auto mb-3 text-gray-300" />
              <p className="text-sm">No assessments available</p>
              {onAddAssessment && (
                <Button variant="outline" className="mt-3" onClick={onAddAssessment}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add First Assessment
                </Button>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              {assessments.map((assessment) => (
                <div key={assessment.id} className="border rounded-lg p-4 hover:shadow-sm transition-shadow">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <h3 className="font-medium">{assessment.assessment_name}</h3>
                      <Badge variant="custom" className={getStatusColor(assessment.status)}>
                        {assessment.status}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-gray-600">
                      <div className="flex items-center gap-1">
                        <Target className="h-4 w-4" />
                        <span>Type: {assessment.assessment_type}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <User className="h-4 w-4" />
                        <span>By: {assessment.performed_by}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        <span>{format(new Date(assessment.assessment_date), 'MMM dd, yyyy')}</span>
                      </div>
                    </div>
                    {assessment.score && (
                      <p className="text-sm"><span className="font-medium">Score:</span> {assessment.score}</p>
                    )}
                    {assessment.results && (
                      <p className="text-sm text-gray-600">{assessment.results}</p>
                    )}
                    {assessment.recommendations && (
                      <p className="text-sm"><span className="font-medium">Recommendations:</span> {assessment.recommendations}</p>
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

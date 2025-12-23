import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { AlertTriangle, CheckCircle2, Calendar } from "lucide-react";
import { format } from "date-fns";

interface ImprovementArea {
  id: string;
  area_title: string;
  description?: string;
  severity: string;
  category?: string;
  current_status?: string;
  progress_percentage?: number;
  target_completion_date?: string;
  status: string;
}

interface ImprovementAreasCardProps {
  improvementAreas: ImprovementArea[];
}

export const ImprovementAreasCard: React.FC<ImprovementAreasCardProps> = ({ improvementAreas }) => {
  const getSeverityColor = (severity: string) => {
    switch (severity?.toLowerCase()) {
      case 'critical':
        return 'bg-red-100 text-red-700 border-red-300';
      case 'high':
        return 'bg-orange-100 text-orange-700 border-orange-300';
      case 'medium':
        return 'bg-yellow-100 text-yellow-700 border-yellow-300';
      case 'low':
        return 'bg-blue-600 text-white border-blue-700';
      default:
        return 'bg-gray-100 text-gray-700 border-gray-300';
    }
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity?.toLowerCase()) {
      case 'critical':
      case 'high':
        return <AlertTriangle className="h-4 w-4" />;
      case 'medium':
        return <AlertTriangle className="h-4 w-4" />;
      case 'low':
        return <CheckCircle2 className="h-4 w-4" />;
      default:
        return <AlertTriangle className="h-4 w-4" />;
    }
  };

  // Don't render the card if there are no improvement areas
  if (improvementAreas.length === 0) {
    return null;
  }

  return (
    <Card className="border-l-4 border-l-orange-500">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 text-orange-500" />
          Areas for Improvement
        </CardTitle>
        <CardDescription>
          Focus areas to help you grow professionally
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {improvementAreas.map((area) => (
            <div key={area.id} className="p-4 border rounded-lg bg-white dark:bg-card hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between gap-3 mb-2">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <Badge variant="custom" className={getSeverityColor(area.severity)}>
                      <span className="flex items-center gap-1">
                        {getSeverityIcon(area.severity)}
                        {area.severity}
                      </span>
                    </Badge>
                    {area.category && (
                      <Badge variant="outline" className="text-xs">
                        {area.category}
                      </Badge>
                    )}
                  </div>
                  <h4 className="font-semibold text-gray-900 dark:text-foreground mb-1">
                    {area.area_title}
                  </h4>
                  {area.description && (
                    <p className="text-sm text-gray-600 dark:text-muted-foreground line-clamp-2">
                      {area.description}
                    </p>
                  )}
                </div>
              </div>

              {/* Progress Section */}
              {area.progress_percentage !== null && area.progress_percentage !== undefined && area.progress_percentage > 0 && (
                <div className="mt-3 space-y-1">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600 dark:text-muted-foreground">Progress</span>
                    <span className="font-medium text-gray-900 dark:text-foreground">
                      {area.progress_percentage}%
                    </span>
                  </div>
                  <Progress value={area.progress_percentage} className="h-2" />
                </div>
              )}

              {/* Target Date */}
              {area.target_completion_date && (
                <div className="mt-3 flex items-center gap-2 text-sm text-gray-600 dark:text-muted-foreground">
                  <Calendar className="h-4 w-4" />
                  <span>
                    Target: {format(new Date(area.target_completion_date), 'MMM dd, yyyy')}
                  </span>
                </div>
              )}

              {/* Current Status */}
              {area.current_status && (
                <div className="mt-2">
                  <p className="text-xs text-gray-500 dark:text-muted-foreground">
                    {area.current_status}
                  </p>
                </div>
              )}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

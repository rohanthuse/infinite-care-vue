import React from "react";
import { FileBarChart2, Plus } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ServicePlansTable } from "@/components/care/forms/ServicePlansTable";
import { ServicePlanData } from "@/types/servicePlan";

interface ServicePlanTabProps {
  servicePlans?: any[];
  serviceActions?: any[]; // backward compatibility
  onAddServicePlan?: () => void;
  onEditServicePlan?: (index: number) => void;
  onDeleteServicePlan?: (index: number) => void;
  readOnly?: boolean;
}

export const ServicePlanTab: React.FC<ServicePlanTabProps> = ({ 
  servicePlans,
  serviceActions,
  onAddServicePlan,
  onEditServicePlan,
  onDeleteServicePlan,
  readOnly = false
}) => {
  // Support both prop names for backward compatibility
  const plans: ServicePlanData[] = servicePlans || serviceActions || [];

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="pb-2 bg-gradient-to-r from-green-50 to-white dark:from-green-950/20 dark:to-background">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FileBarChart2 className="h-5 w-5 text-green-600" />
              <CardTitle className="text-lg">Service Plans ({plans.length})</CardTitle>
            </div>
            {!readOnly && onAddServicePlan && (
              <Button size="sm" className="gap-1" onClick={onAddServicePlan}>
                <Plus className="h-4 w-4" />
                <span>Add Service Plan</span>
              </Button>
            )}
          </div>
          <CardDescription>Comprehensive service plan overview</CardDescription>
        </CardHeader>
        <CardContent className="pt-4">
          {plans.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <FileBarChart2 className="h-12 w-12 mx-auto mb-3 opacity-30" />
              <p className="text-sm">No service plan available</p>
              {!readOnly && onAddServicePlan && (
                <Button variant="outline" className="mt-3" onClick={onAddServicePlan}>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Service Plan
                </Button>
              )}
            </div>
          ) : (
            <div className="max-h-[60vh] overflow-y-auto">
              <ServicePlansTable 
                plans={plans} 
                onEdit={!readOnly ? onEditServicePlan : undefined}
                onDelete={!readOnly ? onDeleteServicePlan : undefined}
                readOnly={readOnly}
              />
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

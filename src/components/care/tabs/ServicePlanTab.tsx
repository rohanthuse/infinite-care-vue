import React, { useState } from "react";
import { FileBarChart2, Plus, Eye } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ServicePlanData } from "@/types/servicePlan";
import { ViewServicePlanDialog } from "@/components/care/dialogs/ViewServicePlanDialog";

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
  const [viewingPlan, setViewingPlan] = useState<ServicePlanData | null>(null);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);

  const handleView = (plan: ServicePlanData) => {
    setViewingPlan(plan);
    setViewDialogOpen(true);
  };

  const formatDate = (date: Date | string | null | undefined): string => {
    if (!date) return "—";
    try {
      const dateObj = typeof date === 'string' ? new Date(date) : date;
      return format(dateObj, "MMM d, yyyy");
    } catch {
      return "—";
    }
  };

  const formatDateTime = (dateString: string | undefined): string => {
    if (!dateString) return "—";
    try {
      return format(new Date(dateString), "MMM d, yyyy 'at' h:mm a");
    } catch {
      return "—";
    }
  };

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
            <div className="max-h-[60vh] overflow-y-auto border rounded-lg">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    <TableHead className="font-semibold">Caption</TableHead>
                    <TableHead className="font-semibold">Service Name</TableHead>
                    <TableHead className="font-semibold">Start Date</TableHead>
                    <TableHead className="font-semibold">End Date</TableHead>
                    <TableHead className="font-semibold">Registered On</TableHead>
                    <TableHead className="font-semibold">Registered By</TableHead>
                    <TableHead className="font-semibold">Status</TableHead>
                    <TableHead className="font-semibold text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {plans.map((plan, index) => (
                    <TableRow key={plan.id || index}>
                      <TableCell className="font-medium">{plan.caption || "—"}</TableCell>
                      <TableCell>
                        {plan.service_names && plan.service_names.length > 0 
                          ? plan.service_names.join(", ") 
                          : plan.service_name || "—"}
                      </TableCell>
                      <TableCell>{formatDate(plan.start_date)}</TableCell>
                      <TableCell>{formatDate(plan.end_date)}</TableCell>
                      <TableCell>{formatDateTime(plan.registered_on)}</TableCell>
                      <TableCell>{plan.registered_by_name && plan.registered_by_name !== 'Unknown' ? plan.registered_by_name : "—"}</TableCell>
                      <TableCell>
                        <Badge 
                          variant="custom"
                          className={plan.status === 'active' 
                            ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' 
                            : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'}
                        >
                          {plan.status === 'active' ? 'Active' : plan.status === 'inactive' ? 'Inactive' : 'Active'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => handleView(plan)}
                            title="View Details"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          {!readOnly && onEditServicePlan && (
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => onEditServicePlan(index)}
                              title="Edit"
                            >
                              Edit
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <ViewServicePlanDialog
        open={viewDialogOpen}
        onOpenChange={setViewDialogOpen}
        plan={viewingPlan}
      />
    </div>
  );
};

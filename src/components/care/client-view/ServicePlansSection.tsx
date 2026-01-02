import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Briefcase, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { ServicePlanData } from '@/types/servicePlan';
import { ViewServicePlanDialog } from '@/components/care/dialogs/ViewServicePlanDialog';

interface ServicePlansSectionProps {
  servicePlans: any[];
}

export function ServicePlansSection({ servicePlans }: ServicePlansSectionProps) {
  const plans: ServicePlanData[] = servicePlans || [];
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
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Briefcase className="h-5 w-5 text-primary" />
            Service Plans ({plans.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {plans.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground border-2 border-dashed border-muted rounded-lg">
              <Briefcase className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p>No service plans have been recorded yet.</p>
              <p className="text-sm">Service plans can be added during care plan creation.</p>
            </div>
          ) : (
            <div className="border rounded-lg overflow-hidden">
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
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="service-view-button pointer-events-auto gap-1"
                          onClick={() => handleView(plan)}
                          title="View Details"
                        >
                          <Eye className="h-4 w-4" />
                          <span>View</span>
                        </Button>
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
}

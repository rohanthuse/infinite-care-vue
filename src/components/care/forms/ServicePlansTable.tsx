import React, { useState } from "react";
import { format } from "date-fns";
import { Eye, Pencil, Trash2 } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ServicePlanData } from "@/types/servicePlan";
import { ViewServicePlanDialog } from "@/components/care/dialogs/ViewServicePlanDialog";

interface ServicePlansTableProps {
  plans: ServicePlanData[];
  onEdit?: (index: number) => void;
  onDelete?: (index: number) => void;
  readOnly?: boolean;
}

export function ServicePlansTable({ 
  plans, 
  onEdit, 
  onDelete, 
  readOnly = false 
}: ServicePlansTableProps) {
  const [viewingPlan, setViewingPlan] = useState<ServicePlanData | null>(null);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);

  const handleView = (index: number) => {
    setViewingPlan(plans[index]);
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

  if (plans.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground border-2 border-dashed border-border rounded-lg">
        <p>No service plans saved yet.</p>
      </div>
    );
  }

  return (
    <>
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
                  <div className="flex items-center justify-end gap-1">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => handleView(index)}
                      title="View Details"
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                    {!readOnly && (
                      <>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => onEdit?.(index)}
                          title="Edit"
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => onDelete?.(index)}
                          className="text-destructive hover:text-destructive"
                          title="Delete"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <ViewServicePlanDialog
        open={viewDialogOpen}
        onOpenChange={setViewDialogOpen}
        plan={viewingPlan}
      />
    </>
  );
}

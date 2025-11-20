import React from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Eye, Edit, Trash2 } from 'lucide-react';
import { SubscriptionPlan } from '@/hooks/useSubscriptionPlans';
import { Skeleton } from '@/components/ui/skeleton';

interface SubscriptionPlansTableProps {
  plans: SubscriptionPlan[];
  isLoading: boolean;
  onView: (plan: SubscriptionPlan) => void;
  onEdit: (plan: SubscriptionPlan) => void;
  onDelete: (plan: SubscriptionPlan) => void;
  selectedPlanIds: string[];
  onSelectPlan: (planId: string) => void;
  onSelectAll: () => void;
}

export const SubscriptionPlansTable: React.FC<SubscriptionPlansTableProps> = ({
  plans,
  isLoading,
  onView,
  onEdit,
  onDelete,
  selectedPlanIds,
  onSelectPlan,
  onSelectAll,
}) => {
  const allSelected = plans.length > 0 && selectedPlanIds.length === plans.length;
  const someSelected = selectedPlanIds.length > 0 && selectedPlanIds.length < plans.length;
  if (isLoading) {
    return (
      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12">
                <Checkbox
                  checked={allSelected}
                  onCheckedChange={onSelectAll}
                  aria-label="Select all"
                />
              </TableHead>
              <TableHead>Plan Name</TableHead>
              <TableHead>Max Users</TableHead>
              <TableHead>Monthly Price</TableHead>
              <TableHead>Yearly Price</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {[1, 2, 3].map((i) => (
              <TableRow key={i}>
                <TableCell><Skeleton className="h-4 w-4" /></TableCell>
                <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                <TableCell><Skeleton className="h-5 w-16 rounded-full" /></TableCell>
                <TableCell>
                  <div className="flex items-center justify-end gap-1">
                    <Skeleton className="h-8 w-8" />
                    <Skeleton className="h-8 w-8" />
                    <Skeleton className="h-8 w-8" />
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    );
  }

  if (!plans || plans.length === 0) {
    return (
      <div className="border rounded-lg p-8 text-center">
        <p className="text-muted-foreground">No subscription plans found</p>
      </div>
    );
  }

  return (
    <div className="border rounded-lg">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-12">
              <Checkbox
                checked={allSelected}
                onCheckedChange={onSelectAll}
                aria-label="Select all"
              />
            </TableHead>
            <TableHead>Plan Name</TableHead>
            <TableHead>Max Users</TableHead>
            <TableHead>Monthly Price</TableHead>
            <TableHead>Yearly Price</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {plans.map((plan) => (
            <TableRow key={plan.id}>
              <TableCell>
                <Checkbox
                  checked={selectedPlanIds.includes(plan.id)}
                  onCheckedChange={() => onSelectPlan(plan.id)}
                  aria-label={`Select ${plan.name}`}
                />
              </TableCell>
              <TableCell className="font-medium">{plan.name}</TableCell>
              <TableCell>{plan.max_users?.toLocaleString() || 'N/A'}</TableCell>
              <TableCell>£{plan.price_monthly.toFixed(2)}</TableCell>
              <TableCell>£{plan.price_yearly.toFixed(2)}</TableCell>
              <TableCell>
                <Badge variant={plan.is_active ? 'default' : 'secondary'}>
                  {plan.is_active ? 'Active' : 'Inactive'}
                </Badge>
              </TableCell>
              <TableCell className="text-right">
                <div className="flex items-center justify-end gap-1">
                  <Button 
                    variant="ghost" 
                    size="icon"
                    onClick={() => onView(plan)}
                    aria-label={`View ${plan.name}`}
                  >
                    <Eye className="h-4 w-4" />
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="icon"
                    onClick={() => onEdit(plan)}
                    aria-label={`Edit ${plan.name}`}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="icon"
                    onClick={() => onDelete(plan)}
                    className="text-destructive hover:text-destructive"
                    aria-label={`Delete ${plan.name}`}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};

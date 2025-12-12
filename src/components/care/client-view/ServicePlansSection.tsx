import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Briefcase } from 'lucide-react';
import { ServicePlansTable } from '@/components/care/forms/ServicePlansTable';
import { ServicePlanData } from '@/types/servicePlan';

interface ServicePlansSectionProps {
  servicePlans: any[];
}

export function ServicePlansSection({ servicePlans }: ServicePlansSectionProps) {
  const plans: ServicePlanData[] = servicePlans || [];

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
            <ServicePlansTable plans={plans} readOnly />
          )}
        </CardContent>
      </Card>
    </div>
  );
}

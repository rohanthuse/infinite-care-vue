/**
 * @deprecated Staff approval workflow has been removed.
 * Care plans now go directly to client approval.
 * This component is kept for backward compatibility but should not be rendered.
 */

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertCircle } from 'lucide-react';

interface CarePlan {
  id: string;
  display_id: string;
  title: string;
  client: {
    first_name: string;
    last_name: string;
  };
  created_at: string;
  status: string;
  provider_name: string;
  staff?: {
    first_name: string;
    last_name: string;
  };
  notes?: string;
  rejection_reason?: string;
}

interface StaffCarePlanApprovalProps {
  carePlans: CarePlan[];
}

/**
 * @deprecated This component is no longer used.
 * Staff approval has been removed from the care plan workflow.
 */
export const StaffCarePlanApproval: React.FC<StaffCarePlanApprovalProps> = ({ carePlans }) => {
  return (
    <Card className="border-amber-200 bg-amber-50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <AlertCircle className="h-5 w-5 text-amber-600" />
          Staff Approval No Longer Required
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-muted-foreground">
          The staff approval workflow has been removed. Care plans now go directly to clients for review and approval.
          This component is deprecated and should not be displayed.
        </p>
      </CardContent>
    </Card>
  );
};

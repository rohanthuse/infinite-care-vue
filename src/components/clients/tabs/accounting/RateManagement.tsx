import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { useClientRateSchedules } from '@/hooks/useClientAccounting';
import { RateScheduleTable } from './RateScheduleTable';
import { AddRateScheduleDialog } from './AddRateScheduleDialog';

interface RateManagementProps {
  clientId: string;
  branchId: string;
}

export const RateManagement: React.FC<RateManagementProps> = ({
  clientId,
  branchId
}) => {
  const [showAddDialog, setShowAddDialog] = useState(false);
  const { data: rateSchedules, isLoading } = useClientRateSchedules(clientId);

  if (isLoading) {
    return <div>Loading rate schedules...</div>;
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg">Rate Management</CardTitle>
              <CardDescription>
                Configure and manage service rates for this client
              </CardDescription>
            </div>
            <Button 
              onClick={() => setShowAddDialog(true)}
              className="bg-primary text-primary-foreground"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Rate
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {rateSchedules && rateSchedules.length > 0 ? (
            <RateScheduleTable 
              rateSchedules={rateSchedules} 
              clientId={clientId}
              branchId={branchId}
            />
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <p>No rate schedules configured for this client.</p>
              <p className="text-sm mt-2">Click "Add Rate" to create the first rate schedule.</p>
            </div>
          )}
        </CardContent>
      </Card>

      <AddRateScheduleDialog
        open={showAddDialog}
        onOpenChange={setShowAddDialog}
        clientId={clientId}
        branchId={branchId}
      />
    </div>
  );
};
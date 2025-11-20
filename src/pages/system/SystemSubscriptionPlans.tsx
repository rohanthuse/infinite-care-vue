import React, { useState } from 'react';
import { DashboardHeader } from '@/components/DashboardHeader';
import { SystemInfoHeader } from '@/components/system/SystemInfoHeader';
import { SystemSectionTabs } from '@/components/system/SystemSectionTabs';
import { Tabs, TabsContent } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { SystemSubscriptionPlansStats } from '@/components/system/SystemSubscriptionPlansStats';
import { SubscriptionPlansTable } from '@/components/system/SubscriptionPlansTable';
import { CreateSubscriptionPlanDialog } from '@/components/system/CreateSubscriptionPlanDialog';
import { EditSubscriptionPlanDialog } from '@/components/system/EditSubscriptionPlanDialog';
import { ViewSubscriptionPlanDialog } from '@/components/system/ViewSubscriptionPlanDialog';
import { ConfirmDeleteSubscriptionPlanDialog } from '@/components/system/ConfirmDeleteSubscriptionPlanDialog';
import { useSubscriptionPlans, SubscriptionPlan } from '@/hooks/useSubscriptionPlans';

export default function SystemSubscriptionPlans() {
  const { data: plans, isLoading } = useSubscriptionPlans();
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showViewDialog, setShowViewDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<SubscriptionPlan | null>(null);

  const handleView = (plan: SubscriptionPlan) => {
    setSelectedPlan(plan);
    setShowViewDialog(true);
  };

  const handleEdit = (plan: SubscriptionPlan) => {
    setSelectedPlan(plan);
    setShowEditDialog(true);
  };

  const handleDelete = (plan: SubscriptionPlan) => {
    setSelectedPlan(plan);
    setShowDeleteDialog(true);
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <DashboardHeader />
      
      <main className="flex-1 container mx-auto p-6">
        <div className="mb-6">
          <div className="bg-card rounded-lg shadow-sm border border-border p-4 md:p-6">
            <div className="flex items-center gap-2">
              <h1 className="text-xl md:text-2xl font-bold">System Portal - Subscription Plans</h1>
            </div>
          </div>
        </div>

        <Tabs value="subscription-plans" className="space-y-6">
          <SystemSectionTabs value="subscription-plans" />

          <TabsContent value="subscription-plans" className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold tracking-tight">Subscription Plans</h2>
                <p className="text-muted-foreground">
                  Manage subscription plans for tenant organizations
                </p>
              </div>
              <Button onClick={() => setShowCreateDialog(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Create Plan
              </Button>
            </div>

            <SystemSubscriptionPlansStats />

            <SubscriptionPlansTable
              plans={plans || []}
              isLoading={isLoading}
              onView={handleView}
              onEdit={handleEdit}
              onDelete={handleDelete}
            />
          </TabsContent>
        </Tabs>
      </main>

      <CreateSubscriptionPlanDialog
        open={showCreateDialog}
        onOpenChange={setShowCreateDialog}
        onSuccess={() => setShowCreateDialog(false)}
      />

      <EditSubscriptionPlanDialog
        open={showEditDialog}
        onOpenChange={setShowEditDialog}
        plan={selectedPlan}
        onSuccess={() => setShowEditDialog(false)}
      />

      <ViewSubscriptionPlanDialog
        open={showViewDialog}
        onOpenChange={setShowViewDialog}
        plan={selectedPlan}
      />

      <ConfirmDeleteSubscriptionPlanDialog
        open={showDeleteDialog}
        onOpenChange={setShowDeleteDialog}
        plan={selectedPlan}
        onSuccess={() => setShowDeleteDialog(false)}
      />
    </div>
  );
}

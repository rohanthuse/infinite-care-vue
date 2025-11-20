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
import { SubscriptionPlanBulkActionsBar } from '@/components/system/SubscriptionPlanBulkActionsBar';
import { useSubscriptionPlans, SubscriptionPlan } from '@/hooks/useSubscriptionPlans';
import { useBulkDeleteSubscriptionPlans } from '@/hooks/useBulkDeleteSubscriptionPlans';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

export default function SystemSubscriptionPlans() {
  const { data: plans, isLoading } = useSubscriptionPlans();
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showViewDialog, setShowViewDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<SubscriptionPlan | null>(null);
  const [selectedPlanIds, setSelectedPlanIds] = useState<string[]>([]);
  const [showBulkDeleteDialog, setShowBulkDeleteDialog] = useState(false);

  const { mutate: bulkDeletePlans, isPending: isBulkDeleting } = useBulkDeleteSubscriptionPlans();

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

  const handleSelectPlan = (planId: string) => {
    setSelectedPlanIds((prev) =>
      prev.includes(planId) ? prev.filter((id) => id !== planId) : [...prev, planId]
    );
  };

  const handleSelectAll = () => {
    if (selectedPlanIds.length === plans?.length) {
      setSelectedPlanIds([]);
    } else {
      setSelectedPlanIds(plans?.map((plan) => plan.id) || []);
    }
  };

  const handleClearSelection = () => {
    setSelectedPlanIds([]);
  };

  const handleBulkDelete = () => {
    setShowBulkDeleteDialog(true);
  };

  const handleConfirmBulkDelete = () => {
    bulkDeletePlans(selectedPlanIds, {
      onSuccess: () => {
        setSelectedPlanIds([]);
        setShowBulkDeleteDialog(false);
      },
    });
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
              selectedPlanIds={selectedPlanIds}
              onSelectPlan={handleSelectPlan}
              onSelectAll={handleSelectAll}
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
        onOpenChange={(open) => {
          setShowEditDialog(open);
          if (!open) setSelectedPlan(null);
        }}
        plan={selectedPlan}
        onSuccess={() => {
          setShowEditDialog(false);
          setSelectedPlan(null);
        }}
      />

      <ViewSubscriptionPlanDialog
        open={showViewDialog}
        onOpenChange={(open) => {
          setShowViewDialog(open);
          if (!open) setSelectedPlan(null);
        }}
        plan={selectedPlan}
      />

      <ConfirmDeleteSubscriptionPlanDialog
        open={showDeleteDialog}
        onOpenChange={(open) => {
          setShowDeleteDialog(open);
          if (!open) setSelectedPlan(null);
        }}
        plan={selectedPlan}
        onSuccess={() => {
          setShowDeleteDialog(false);
          setSelectedPlan(null);
        }}
      />

      <SubscriptionPlanBulkActionsBar
        selectedCount={selectedPlanIds.length}
        onClearSelection={handleClearSelection}
        onBulkDelete={handleBulkDelete}
        isDeleting={isBulkDeleting}
      />

      <AlertDialog open={showBulkDeleteDialog} onOpenChange={setShowBulkDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete {selectedPlanIds.length} Subscription Plan{selectedPlanIds.length > 1 ? 's' : ''}?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the selected subscription plan{selectedPlanIds.length > 1 ? 's' : ''}. 
              {selectedPlanIds.length > 1 && ' Some plans may fail to delete if they are currently in use by organizations.'}
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isBulkDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmBulkDelete}
              disabled={isBulkDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isBulkDeleting ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

import React, { useState, useEffect } from "react";
import { UseFormReturn } from "react-hook-form";
import { Plus } from "lucide-react";
import { Form } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { useServices } from "@/data/hooks/useServices";
import { useClientAccountingSettings } from "@/hooks/useClientAccounting";
import { useTenant } from "@/contexts/TenantContext";
import { useUserRole } from "@/hooks/useUserRole";
import { ServicePlansTable } from "@/components/care/forms/ServicePlansTable";
import { ServicePlanForm } from "@/components/care/forms/ServicePlanForm";
import { getDefaultServicePlan, ServicePlanData } from "@/types/servicePlan";
import { getUserDisplayName } from "@/utils/userDisplayName";
import { toast } from "sonner";

interface WizardStep11ServicePlansProps {
  form: UseFormReturn<any>;
  clientId?: string;
}

export function WizardStep11ServicePlans({ form, clientId }: WizardStep11ServicePlansProps) {
  const { organization } = useTenant();
  const { data: services = [] } = useServices(organization?.id);
  const { data: accountingSettings } = useClientAccountingSettings(clientId || '');
  const { data: currentUser } = useUserRole();

  // State for managing service plans
  const [savedPlans, setSavedPlans] = useState<ServicePlanData[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [currentPlanIndex, setCurrentPlanIndex] = useState(0);

  // Initialize saved plans from form data on mount
  useEffect(() => {
    const existingPlans = form.getValues("service_plans") || [];
    // Map existing plans and mark them as saved
    const mappedPlans = existingPlans
      .filter((p: ServicePlanData) => p.is_saved || p.caption || p.service_name)
      .map((plan: any) => ({
        ...plan,
        id: plan.id || crypto.randomUUID(),
        caption: plan.caption || '',
        service_id: plan.service_id || '',
        service_name: plan.service_name || plan.name || '',
        authority: plan.authority || '',
        authority_category: plan.authority_category || '',
        start_date: plan.start_date,
        end_date: plan.end_date,
        start_time: plan.start_time || '',
        end_time: plan.end_time || '',
        selected_days: plan.selected_days || [],
        frequency: plan.frequency || '',
        location: plan.location || '',
        note: plan.note || plan.notes || '',
        status: plan.status || 'active',
        registered_on: plan.registered_on,
        registered_by: plan.registered_by,
        registered_by_name: plan.registered_by_name || '',
        is_saved: true,
      }));
    if (mappedPlans.length > 0) {
      setSavedPlans(mappedPlans);
    }
  }, []);

  // Sync saved plans back to form whenever they change
  useEffect(() => {
    form.setValue("service_plans", savedPlans);
  }, [savedPlans, form]);

  const handleAddNew = () => {
    const newPlan = getDefaultServicePlan(
      accountingSettings?.authority_category || '',
      accountingSettings?.authority_category || ''
    );
    
    // Set the new plan as a temporary entry in the form
    const currentPlans = form.getValues("service_plans") || [];
    setCurrentPlanIndex(currentPlans.length);
    form.setValue("service_plans", [...savedPlans, newPlan]);
    
    setEditingIndex(null);
    setShowForm(true);
  };

  const handleEdit = (index: number) => {
    // Load the plan into the form for editing
    const planToEdit = savedPlans[index];
    const updatedPlans = [...savedPlans];
    form.setValue("service_plans", updatedPlans);
    setCurrentPlanIndex(index);
    setEditingIndex(index);
    setShowForm(true);
  };

  const handleDelete = (index: number) => {
    const updated = savedPlans.filter((_, i) => i !== index);
    setSavedPlans(updated);
    toast.success("Service plan removed");
  };

  const validatePlan = (plan: ServicePlanData): boolean => {
    if (!plan.caption?.trim()) {
      toast.error("Caption is required");
      return false;
    }
    if (!plan.start_date) {
      toast.error("Start date is required");
      return false;
    }
    if (!plan.end_date) {
      toast.error("End date is required");
      return false;
    }
    if (!plan.service_id) {
      toast.error("Service name is required");
      return false;
    }
    if (!plan.start_time) {
      toast.error("Start time is required");
      return false;
    }
    if (!plan.end_time) {
      toast.error("End time is required");
      return false;
    }
    return true;
  };

  const handleSave = () => {
    const allPlans = form.getValues("service_plans") || [];
    const planData = allPlans[currentPlanIndex];
    
    if (!validatePlan(planData)) {
      return;
    }

    const enrichedPlan: ServicePlanData = {
      ...planData,
      id: planData.id || crypto.randomUUID(),
      registered_on: editingIndex !== null ? planData.registered_on : new Date().toISOString(),
      registered_by: editingIndex !== null ? planData.registered_by : currentUser?.id,
      registered_by_name: editingIndex !== null 
        ? planData.registered_by_name 
        : getUserDisplayName(currentUser),
      status: planData.status || 'active',
      is_saved: true,
    };

    if (editingIndex !== null) {
      // Update existing plan
      const updated = [...savedPlans];
      updated[editingIndex] = enrichedPlan;
      setSavedPlans(updated);
      toast.success("Service plan updated");
    } else {
      // Add new plan
      setSavedPlans([...savedPlans, enrichedPlan]);
      toast.success("Service plan saved");
    }

    setShowForm(false);
    setEditingIndex(null);
  };

  const handleCancel = () => {
    // Reset form to only saved plans
    form.setValue("service_plans", savedPlans);
    setShowForm(false);
    setEditingIndex(null);
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold text-foreground mb-2">Service Plans</h2>
        <p className="text-muted-foreground">
          Overall care coordination and service planning for comprehensive care delivery.
        </p>
      </div>

      <Form {...form}>
        <div className="space-y-6">
          {/* Header with Add Button */}
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium">
              Service Plans {savedPlans.length > 0 && `(${savedPlans.length})`}
            </h3>
            {!showForm && (
              <Button type="button" onClick={handleAddNew} size="sm">
                <Plus className="h-4 w-4 mr-1" />
                Add Service Plan
              </Button>
            )}
          </div>

          {/* Service Plans Table */}
          {savedPlans.length > 0 && !showForm && (
            <ServicePlansTable
              plans={savedPlans}
              onEdit={handleEdit}
              onDelete={handleDelete}
            />
          )}

          {/* Empty State */}
          {savedPlans.length === 0 && !showForm && (
            <div className="text-center py-8 text-muted-foreground border-2 border-dashed border-border rounded-lg">
              <p>No service plans added yet. Click "Add Service Plan" to create your first plan.</p>
            </div>
          )}

          {/* Service Plan Form */}
          {showForm && (
            <div className="max-h-[60vh] overflow-y-auto pr-2">
              <ServicePlanForm
                form={form}
                fieldPrefix={`service_plans.${currentPlanIndex}`}
                services={services}
                authorityCategory={accountingSettings?.authority_category}
                onSave={handleSave}
                onCancel={handleCancel}
                isEditing={editingIndex !== null}
                planNumber={editingIndex !== null ? editingIndex + 1 : savedPlans.length + 1}
              />
            </div>
          )}
        </div>
      </Form>
    </div>
  );
}

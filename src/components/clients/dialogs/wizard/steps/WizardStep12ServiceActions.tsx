import React, { useState, useEffect, useRef } from "react";
import { UseFormReturn, useWatch } from "react-hook-form";
import { Plus } from "lucide-react";
import { Form } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { ServiceActionForm } from "@/components/care/forms/ServiceActionForm";
import { ServiceActionsTable } from "@/components/care/forms/ServiceActionsTable";
import { ServiceActionData, getDefaultServiceAction } from "@/types/serviceAction";
import { useUserRole } from "@/hooks/useUserRole";
import { getUserDisplayName } from "@/utils/userDisplayName";

interface WizardStep12ServiceActionsProps {
  form: UseFormReturn<any>;
}

// Helper to map raw action data to ServiceActionData format
const mapActionToServiceActionData = (action: any): ServiceActionData => ({
  id: action.id || crypto.randomUUID(),
  action_type: action.action_type || 'new',
  action_name: action.action_name || action.service_name || action.name || action.action || '',
  has_instructions: action.has_instructions || false,
  instructions: action.instructions || action.schedule_details || '',
  required_written_outcome: action.required_written_outcome || false,
  written_outcome: action.written_outcome || '',
  is_service_specific: action.is_service_specific || false,
  linked_service_id: action.linked_service_id || '',
  linked_service_name: action.linked_service_name || '',
  start_date: action.start_date,
  end_date: action.end_date,
  schedule_type: action.schedule_type || 'shift',
  shift_times: action.shift_times || [],
  start_time: action.start_time || '',
  end_time: action.end_time || '',
  selected_days: action.selected_days || [],
  frequency: action.frequency || '',
  notes: action.notes || '',
  status: action.status || 'active',
  registered_on: action.registered_on,
  registered_by: action.registered_by,
  registered_by_name: action.registered_by_name || '',
  is_saved: true,
});

export function WizardStep12ServiceActions({ form }: WizardStep12ServiceActionsProps) {
  const [savedActions, setSavedActions] = useState<ServiceActionData[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const { data: currentUser } = useUserRole();
  
  // Ref to prevent infinite loop between form sync effects
  const isHydratingFromFormRef = useRef(false);
  const hasInitializedRef = useRef(false);

  // Watch form field for changes (draft loading after mount)
  const watchedServiceActions = useWatch({ control: form.control, name: "service_actions" });

  // Rehydrate savedActions when form field changes (e.g., draft loads after mount)
  useEffect(() => {
    // Skip if currently showing the add/edit form (don't interrupt user)
    if (showForm) return;
    
    const formActions = watchedServiceActions || [];
    
    // Skip if we already have local data and form is empty (prevent erasing)
    if (savedActions.length > 0 && formActions.length === 0 && hasInitializedRef.current) {
      console.log('[WizardStep12ServiceActions] Skipping empty form data - preserving local state');
      return;
    }
    
    // Only rehydrate if form has actions and local state differs
    if (formActions.length > 0) {
      const validActions = formActions.filter(
        (action: any) => action.is_saved || action.action_name || action.service_name || action.name
      );
      
      // Check if we need to update (compare by length and first/last id as quick check)
      const needsUpdate = 
        validActions.length !== savedActions.length ||
        (validActions.length > 0 && savedActions.length > 0 && 
          validActions[0]?.id !== savedActions[0]?.id);
      
      if (needsUpdate && validActions.length > 0) {
        console.log('[WizardStep12ServiceActions] Rehydrating from form data:', validActions.length, 'actions');
        isHydratingFromFormRef.current = true;
        const mappedActions = validActions.map(mapActionToServiceActionData);
        setSavedActions(mappedActions);
        hasInitializedRef.current = true;
      }
    }
  }, [watchedServiceActions, showForm, savedActions.length]);

  // Sync savedActions to form (only when change originated locally, not from hydration)
  useEffect(() => {
    if (isHydratingFromFormRef.current) {
      // Reset flag, skip writing back to form
      isHydratingFromFormRef.current = false;
      return;
    }
    form.setValue("service_actions", savedActions);
  }, [savedActions, form]);

  const handleAddAction = () => {
    const newAction = getDefaultServiceAction();
    form.setValue("temp_service_action", newAction);
    setEditingIndex(null);
    setShowForm(true);
  };

  const handleSaveAction = () => {
    const actionData = form.getValues("temp_service_action");
    
    // Validate required fields
    if (!actionData?.action_name) {
      return;
    }

    const actionToSave: ServiceActionData = {
      ...actionData,
      status: actionData.status || 'active',
      is_saved: true,
      registered_on: editingIndex !== null 
        ? actionData.registered_on 
        : new Date().toISOString(),
      registered_by: editingIndex !== null 
        ? actionData.registered_by 
        : currentUser?.id,
      registered_by_name: editingIndex !== null 
        ? actionData.registered_by_name 
        : getUserDisplayName(currentUser),
    };

    if (editingIndex !== null) {
      // Update existing action
      const updated = [...savedActions];
      updated[editingIndex] = actionToSave;
      setSavedActions(updated);
    } else {
      // Add new action
      setSavedActions([...savedActions, actionToSave]);
    }

    // Clear form and close
    form.setValue("temp_service_action", null);
    setShowForm(false);
    setEditingIndex(null);
  };

  const handleCancelForm = () => {
    form.setValue("temp_service_action", null);
    setShowForm(false);
    setEditingIndex(null);
  };

  const handleEdit = (index: number) => {
    const actionToEdit = savedActions[index];
    form.setValue("temp_service_action", actionToEdit);
    setEditingIndex(index);
    setShowForm(true);
  };

  const handleDelete = (index: number) => {
    const updated = savedActions.filter((_, i) => i !== index);
    setSavedActions(updated);
  };

  const handleToggleStatus = (index: number) => {
    const updated = [...savedActions];
    updated[index] = {
      ...updated[index],
      status: updated[index].status === 'active' ? 'inactive' : 'active',
    };
    setSavedActions(updated);
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold text-foreground mb-2">Service Actions</h2>
        <p className="text-muted-foreground">
          Specific interventions and care actions to be implemented.
        </p>
      </div>

      <Form {...form}>
        <div className="space-y-6">
          {/* Header with Add Button */}
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium">Service Actions ({savedActions.length})</h3>
            {!showForm && (
              <Button type="button" onClick={handleAddAction} size="sm">
                <Plus className="h-4 w-4 mr-1" />
                Add Service Action
              </Button>
            )}
          </div>

          {/* Service Actions Table */}
          {savedActions.length > 0 && !showForm && (
            <ServiceActionsTable
              actions={savedActions}
              onEdit={handleEdit}
              onDelete={handleDelete}
              onToggleStatus={handleToggleStatus}
            />
          )}

          {/* Empty State */}
          {savedActions.length === 0 && !showForm && (
            <div className="text-center py-8 text-muted-foreground border-2 border-dashed border-muted rounded-lg">
              <p>No service actions added yet. Click "Add Service Action" to create your first action.</p>
            </div>
          )}

          {/* Service Action Form */}
          {showForm && (
            <ServiceActionForm
              form={form}
              fieldPrefix="temp_service_action"
              onSave={handleSaveAction}
              onCancel={handleCancelForm}
              isEditing={editingIndex !== null}
              actionNumber={editingIndex !== null ? editingIndex + 1 : savedActions.length + 1}
            />
          )}
        </div>
      </Form>
    </div>
  );
}

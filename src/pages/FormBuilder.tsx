import React, { useState, useEffect, useCallback, useRef } from 'react';
import { flushSync } from 'react-dom';
import { useParams, useNavigate } from 'react-router-dom';
import { useTenant } from '@/contexts/TenantContext';
import { BranchLayout } from '@/components/branch-dashboard/BranchLayout';
import { AddClientDialog } from '@/components/AddClientDialog';
import { NewBookingDialog } from '@/components/bookings/dialogs/NewBookingDialog';
import { useBookingData } from '@/components/bookings/hooks/useBookingData';
import { useServices } from '@/data/hooks/useServices';
import { Tabs, TabsContent } from '@/components/ui/tabs';
import { FormBuilderDesigner } from '@/components/form-builder/FormBuilderDesigner';
import { FormBuilderPreview } from '@/components/form-builder/FormBuilderPreview';
import { FormBuilderPublish } from '@/components/form-builder/FormBuilderPublish';
import { FormBuilderNavBar } from '@/components/form-builder/FormBuilderNavBar';
import { FormValidationTab } from '@/components/form-builder/FormValidationTab';
import { FormAdvancedTab } from '@/components/form-builder/FormAdvancedTab';
import { FormSubmissionsTab } from '@/components/form-builder/FormSubmissionsTab';
import { FormNamingTab } from '@/components/form-builder/FormNamingTab';
import { TabNavigation as FormTabNavigation } from '@/components/form-builder/TabNavigation';

import { FormBuilderTab } from '@/components/form-builder/FormBuilderTab';
import { Form, FormElement, FormSettings, FormPermissions } from '@/types/form-builder';
import { useFormManagement, DatabaseForm } from '@/hooks/useFormManagement';
import { useFormElements } from '@/hooks/useFormElements';
import { useAuthSafe } from '@/hooks/useAuthSafe';
import { v4 as uuidv4 } from 'uuid';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/integrations/supabase/client';

// Helper function to persist form assignees to database and trigger notifications
const persistFormAssignees = async (formId: string, assignees: any[], assignedBy: string) => {
  try {
    // Filter to only include client and staff types (exclude 'branch_admin' etc.)
    const validAssignees = assignees.filter(assignee => 
      assignee.type === 'client' || assignee.type === 'carer' || assignee.type === 'staff'
    );

    if (validAssignees.length === 0) {
      console.log('No valid assignees to persist');
      return;
    }

    // Delete existing assignees for this form to ensure idempotency
    const { error: deleteError } = await supabase
      .from('form_assignees')
      .delete()
      .eq('form_id', formId);

    if (deleteError) {
      console.error('Error deleting existing form assignees:', deleteError);
      throw deleteError;
    }

    const assigneeRecords = validAssignees.map(assignee => ({
      form_id: formId,
      assignee_id: assignee.id,
      assignee_type: assignee.type === 'client' ? 'client' : 'staff', // Map 'carer' to 'staff'
      assignee_name: assignee.name,
      assigned_by: assignedBy,
    }));

    console.log('Inserting assignee records:', assigneeRecords);

    const { error } = await supabase
      .from('form_assignees')
      .insert(assigneeRecords);

    if (error) {
      console.error('Error inserting form assignees:', error);
      throw error;
    }

    console.log(`Form assignees persisted successfully: ${assigneeRecords.length} records`);

    // Fetch form details for notifications
    const { data: formData, error: formError } = await supabase
      .from('forms')
      .select('title, branch_id')
      .eq('id', formId)
      .single();

    if (formError) {
      console.error('Error fetching form data for notifications:', formError);
      return; // Don't throw - assignees were saved, just notification failed
    }

    if (formData && formData.branch_id) {
      console.log('[persistFormAssignees] Triggering notifications for assignees');
      
      // Trigger notifications for each assignee
      for (const assignee of assigneeRecords) {
        try {
          const { error: notifError } = await supabase.functions.invoke('create-form-assignment-notifications', {
            body: {
              form_id: formId,
              form_title: formData.title,
              assignee_id: assignee.assignee_id,
              assignee_type: assignee.assignee_type,
              branch_id: formData.branch_id
            }
          });

          if (notifError) {
            console.error(`[persistFormAssignees] Notification error for ${assignee.assignee_name}:`, notifError);
          } else {
            console.log(`[persistFormAssignees] Notification sent for ${assignee.assignee_name}`);
          }
        } catch (notifErr) {
          console.error('[persistFormAssignees] Failed to invoke notification function:', notifErr);
          // Continue with next assignee even if notification fails
        }
      }
    }
  } catch (error) {
    console.error('Failed to persist form assignees:', error);
    throw error;
  }
};

const FormBuilder = () => {
  const { id: branchId, branchName, formId } = useParams<{ id: string; branchName: string; formId?: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuthSafe();
  const { tenantSlug } = useTenant();
  
  // Move all hooks to the top before any conditional logic
  const { 
    forms, 
    createForm, 
    createFormAsync,
    updateForm, 
    isCreating, 
    isUpdating 
  } = useFormManagement(branchId || '');

  const { 
    uiElements, 
    isLoading: isLoadingElements, 
    saveElements,
    isSaving: isSavingElements 
  } = useFormElements(formId || '');

  // Get initial tab from URL params or localStorage
  const getInitialTab = () => {
    const urlParams = new URLSearchParams(window.location.search);
    const tabFromUrl = urlParams.get('tab');
    if (tabFromUrl && ['naming', 'design', 'validation', 'preview', 'advanced', 'submissions', 'publish'].includes(tabFromUrl)) {
      return tabFromUrl;
    }
    // Fallback to localStorage for the last opened tab
    return localStorage.getItem(`form-builder-last-tab-${formId}`) || 'naming';
  };
  
  const [activeTab, setActiveTab] = useState<string>(getInitialTab());
  const [isFormDirty, setIsFormDirty] = useState<boolean>(false);
  const [isLoadingForm, setIsLoadingForm] = useState<boolean>(!!formId);

  const [form, setForm] = useState<Form>({
    id: formId || uuidv4(),
    title: 'Untitled Form',
    description: '',
    elements: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    createdBy: {
      id: user?.id || 'temp-user',
      name: 'Admin',
    },
    published: false,
    requiresReview: false,
    version: 1,
    assignees: [],
    permissions: {
      viewAccess: ['admin', 'branch-manager'],
      editAccess: ['admin'],
      submitAccess: ['client', 'staff', 'carer'],
      manageAccess: ['admin']
    },
    settings: {
      showProgressBar: false,
      allowSaveAsDraft: false,
      autoSaveEnabled: false,
      autoSaveInterval: 60,
      redirectAfterSubmit: false,
      submitButtonText: 'Submit'
    }
  });
  
  // Quick Action dialog states
  const [addClientDialogOpen, setAddClientDialogOpen] = useState(false);
  const [newBookingDialogOpen, setNewBookingDialogOpen] = useState(false);
  
  // Data for dialogs
  const { clients, carers } = useBookingData(branchId || '');
  const { data: services = [] } = useServices();

  // Memoize the conversion function to prevent recreating on every render
  const convertDatabaseFormToForm = useCallback((dbForm: DatabaseForm, elements: FormElement[] = []): Form => {
    return {
      id: dbForm.id,
      title: dbForm.title,
      description: dbForm.description || '',
      elements: elements,
      createdAt: dbForm.created_at,
      updatedAt: dbForm.updated_at,
      createdBy: {
        id: dbForm.created_by,
        name: 'User',
      },
      published: dbForm.published,
      requiresReview: dbForm.requires_review,
      version: dbForm.version,
      assignees: [],
      permissions: {
        viewAccess: ['admin', 'branch-manager'],
        editAccess: ['admin'],
        submitAccess: ['client', 'staff', 'carer'],
        manageAccess: ['admin']
      },
      settings: dbForm.settings || {
        showProgressBar: false,
        allowSaveAsDraft: false,
        autoSaveEnabled: false,
        autoSaveInterval: 60,
        redirectAfterSubmit: false,
        submitButtonText: 'Submit'
      }
    };
  }, []);

  // Load existing form if editing - split into focused effects
  useEffect(() => {
    if (formId && forms.length > 0 && !isLoadingElements && !isFormDirty && !isUpdating) {
      const existingForm = forms.find(f => f.id === formId);
      if (existingForm) {
        const convertedForm = convertDatabaseFormToForm(existingForm, uiElements);
        // Only update if the database version is newer than our local version
        const dbUpdatedAt = new Date(existingForm.updated_at).getTime();
        const localUpdatedAt = new Date(form.updatedAt).getTime();
        
        if (dbUpdatedAt > localUpdatedAt || form.title === 'Untitled Form') {
          setForm(convertedForm);
        }
        setIsLoadingForm(false);
      } else {
        setIsLoadingForm(false);
      }
    } else if (!formId) {
      setIsLoadingForm(false);
    }
  }, [formId, forms, uiElements, isLoadingElements, convertDatabaseFormToForm, isFormDirty, isUpdating, form.updatedAt, form.title]);

  // Handle form not found separately to avoid dependency issues
  useEffect(() => {
    if (formId && forms.length > 0 && !isLoadingElements) {
      const existingForm = forms.find(f => f.id === formId);
      if (!existingForm && !isLoadingForm) {
        toast({
          title: 'Form Not Found',
          description: 'The requested form could not be found',
          variant: 'destructive',
        });
        const fullPath = tenantSlug 
          ? `/${tenantSlug}/branch-dashboard/${branchId}/${branchName}`
          : `/branch-dashboard/${branchId}/${branchName}`;
        navigate(fullPath);
      } else if (existingForm && !isLoadingForm) {
        toast({
          title: 'Form Loaded',
          description: 'The form has been loaded successfully',
        });
      }
    }
  }, [formId, forms.length, isLoadingElements, isLoadingForm, branchId, branchName]);

  // Debounced auto-save to prevent excessive API calls
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  const saveFormElements = useCallback(async (elements: FormElement[], immediate = false) => {
    if (formId && elements.length >= 0) {
      // Clear existing timeout
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }

      const performSave = () => {
        try {
          console.log('Auto-saving form elements:', elements);
          saveElements({
            formId: formId,
            elements: elements
          });
        } catch (error) {
          console.error('Failed to auto-save elements:', error);
          toast({
            title: 'Auto-save Failed',
            description: 'Failed to save form elements automatically',
            variant: 'destructive',
          });
        }
      };

      if (immediate) {
        performSave();
      } else {
        // Debounce the save operation
        saveTimeoutRef.current = setTimeout(performSave, 1000);
      }
    }
  }, [formId, saveElements, toast]);

  // Quick Action handlers
  const handleNewClient = () => setAddClientDialogOpen(true);
  const handleNewBooking = () => setNewBookingDialogOpen(true);
  const handleClientAdded = () => {};
  const handleCreateBooking = (bookingData: any) => {
    console.log("Creating new booking:", bookingData);
    setNewBookingDialogOpen(false);
  };

  const handleTabChange = (value: string) => {
    setActiveTab(value);
    
    // Update URL without page refresh
    const url = new URL(window.location.href);
    url.searchParams.set('tab', value);
    window.history.replaceState({}, '', url.toString());
    
    // Store last opened tab in localStorage
    if (formId) {
      localStorage.setItem(`form-builder-last-tab-${formId}`, value);
    }
  };

  const handleFormChange = (title: string, description: string) => {
    console.log('FormBuilder - handleFormChange called with:', { title, description });
    
    flushSync(() => {
      setForm(prev => ({
        ...prev,
        title,
        description,
        updatedAt: new Date().toISOString()
      }));
      setIsFormDirty(true);
    });
    
    console.log('FormBuilder - Form state updated');
  };

  const handleSaveForm = async (overrideTitle?: string, overrideDescription?: string) => {
    const userId = user?.id || 'temp-user-id';
    
    // Use override values if provided (from navbar), otherwise use form state
    const titleToSave = overrideTitle !== undefined ? overrideTitle : form.title;
    const descriptionToSave = overrideDescription !== undefined ? overrideDescription : form.description;
    
    console.log('FormBuilder - handleSaveForm called with:', { 
      overrideTitle, 
      overrideDescription, 
      formTitle: form.title, 
      formDescription: form.description,
      titleToSave, 
      descriptionToSave 
    });

    try {
      if (formId) {
        // Update existing form
        const now = new Date().toISOString();
        updateForm({
          formId: form.id,
          updates: {
            title: titleToSave,
            description: descriptionToSave,
            published: form.published,
            requires_review: form.requiresReview,
            settings: form.settings,
            updated_at: now
          }
        });

        // Save form elements
        saveElements({
          formId: form.id,
          elements: form.elements
        });
      } else {
        // Create new form
        console.log('Creating new form with:', { titleToSave, descriptionToSave });
        const createdForm = await createFormAsync({
          title: titleToSave,
          description: descriptionToSave,
          created_by: userId,
          published: form.published,
          requires_review: form.requiresReview,
          settings: form.settings
        });
        
        console.log('Form created, updating URL:', createdForm);
        // Update the URL to include the new form ID without page refresh
        const encodedBranchName = encodeURIComponent(branchName || 'branch');
        const newUrl = tenantSlug 
          ? `/${tenantSlug}/branch-dashboard/${branchId}/${encodedBranchName}/form-builder/${createdForm.id}`
          : `/branch-dashboard/${branchId}/${encodedBranchName}/form-builder/${createdForm.id}`;
        window.history.replaceState({}, '', newUrl);
        
        // Update local form state with the created form data
        setForm(prev => ({
          ...prev,
          id: createdForm.id,
          title: createdForm.title,
          description: createdForm.description || ''
        }));
        setIsFormDirty(false);

        // Save elements for the newly created form
        if (form.elements.length > 0) {
          saveElements({
            formId: createdForm.id,
            elements: form.elements
          });
        }
      }
      
      // Update form state with saved values to ensure UI reflects saved data
      const now = new Date().toISOString();
      setForm(prev => ({
        ...prev,
        title: titleToSave,
        description: descriptionToSave,
        updatedAt: now,
      }));
      
      setIsFormDirty(false);
      toast({
        title: 'Form Saved',
        description: 'Form and elements have been saved successfully',
      });
    } catch (error) {
      console.error('Error saving form:', error);
      toast({
        title: 'Save Failed',
        description: 'Failed to save form. Please try again.',
        variant: 'destructive',
      });
    }
  };

  const handlePublishForm = async (requiresReview: boolean, assignees: any[]) => {
    const userId = user?.id || 'temp-user-id';
    console.log('Publishing form with assignees:', assignees);

    try {
      let formIdToUse = form.id;
      
      if (formId) {
        // Update existing form to published
        updateForm({
          formId: form.id,
          updates: {
            published: true,
            requires_review: requiresReview
          }
        });

        // Save form elements
        saveElements({
          formId: form.id,
          elements: form.elements
        });
        
        formIdToUse = form.id;
      } else {
        // Create and publish new form
        console.log('Creating new form with:', form.title, form.description);
        const createdForm = await createFormAsync({
          title: form.title,
          description: form.description,
          created_by: userId,
          published: true,
          requires_review: requiresReview,
          settings: form.settings
        });

        if (form.elements.length > 0) {
          saveElements({
            formId: createdForm.id,
            elements: form.elements
          });
        }

        // Update local form state with the created form data
        setForm(prev => ({
          ...prev,
          id: createdForm.id,
          title: createdForm.title,
          description: createdForm.description || ''
        }));
        
        formIdToUse = createdForm.id;
      }
      
      // Persist assignees to the database (for both new and existing forms)
      if (assignees.length > 0) {
        await persistFormAssignees(formIdToUse, assignees, userId);
      }

      setForm(prev => ({
        ...prev,
        published: true,
        requiresReview,
        assignees,
        updatedAt: new Date().toISOString(),
      }));
      
      setIsFormDirty(false);
      
      toast({
        title: 'Form Published',
        description: `Form published successfully with ${assignees.length} assignees`,
      });
      
      const fullPath = tenantSlug 
        ? `/${tenantSlug}/branch-dashboard/${branchId}/${branchName}`
        : `/branch-dashboard/${branchId}/${branchName}`;
      navigate(fullPath);
    } catch (error) {
      console.error('Error publishing form:', error);
    }
  };

  const handleUpdatePermissions = (permissions: FormPermissions) => {
    setForm(prev => ({
      ...prev,
      permissions
    }));
    setIsFormDirty(true);
  };

  const handleUpdateSettings = (settings: FormSettings) => {
    setForm(prev => ({
      ...prev,
      settings
    }));
    setIsFormDirty(true);
    
    // Immediately persist settings to database if form exists
    if (formId) {
      updateForm({
        formId: form.id,
        updates: {
          settings: settings,
          updated_at: new Date().toISOString()
        }
      });
    }
  };

  const handleUpdateValidation = (elementId: string, errorMessage: string) => {
    setForm(prev => ({
      ...prev,
      elements: prev.elements.map(el => 
        el.id === elementId ? { ...el, errorMessage } : el
      ),
    }));
    
    setIsFormDirty(true);
    
    toast({
      title: 'Validation Updated',
      description: 'Field validation has been updated successfully',
    });
  };

  const addElement = (element: FormElement) => {
    const updatedElements = [...form.elements, element];
    setForm(prev => ({
      ...prev,
      elements: updatedElements,
    }));
    setIsFormDirty(true);
    
    // Auto-save elements immediately for new elements
    saveFormElements(updatedElements, true);
    
    toast({
      title: 'Element Added',
      description: `${element.type} field has been added to the form`,
    });
  };

  const updateElement = (elementId: string, updatedElement: Partial<FormElement>) => {
    const updatedElements = form.elements.map(el => 
      el.id === elementId ? { ...el, ...updatedElement } as FormElement : el
    );
    
    setForm(prev => ({
      ...prev,
      elements: updatedElements,
    }));
    setIsFormDirty(true);
    
    // Use debounced auto-save for element updates
    saveFormElements(updatedElements, false);
  };

  const removeElement = (elementId: string) => {
    const updatedElements = form.elements.filter(el => el.id !== elementId);
    setForm(prev => ({
      ...prev,
      elements: updatedElements,
    }));
    setIsFormDirty(true);
    
    // Auto-save elements immediately for removal
    saveFormElements(updatedElements, true);
    
    toast({
      title: 'Element Removed',
      description: 'Form element has been removed',
    });
  };

  const reorderElements = (elements: FormElement[]) => {
    setForm(prev => ({
      ...prev,
      elements,
    }));
    setIsFormDirty(true);
    
    // Auto-save elements immediately for reordering
    saveFormElements(elements, true);
  };

  const decodedBranchName = decodeURIComponent(branchName || "Med-Infinite Branch");

  const handleNavigate = (tab: string) => {
    if (tab !== "form-builder" && branchId && branchName) {
      const fullPath = tenantSlug 
        ? `/${tenantSlug}/branch-dashboard/${branchId}/${branchName}/${tab}`
        : `/branch-dashboard/${branchId}/${branchName}/${tab}`;
      navigate(fullPath);
    }
  };

  // If no formId is provided, show the Form Matrix (FormBuilderTab)
  if (!formId) {
    return (
      <>
        <BranchLayout onNewClient={handleNewClient} onNewBooking={handleNewBooking}>
          <FormBuilderTab branchId={branchId || ''} branchName={decodedBranchName} />
        </BranchLayout>
        
        <AddClientDialog
          open={addClientDialogOpen}
          onOpenChange={setAddClientDialogOpen}
          branchId={branchId || ''}
          onSuccess={handleClientAdded}
        />
        
        <NewBookingDialog
          open={newBookingDialogOpen}
          onOpenChange={setNewBookingDialogOpen}
          carers={carers}
          services={services}
          onCreateBooking={handleCreateBooking}
          branchId={branchId || ''}
        />
      </>
    );
  }

  if (isLoadingForm || (formId && isLoadingElements)) {
    return (
      <>
        <BranchLayout onNewClient={handleNewClient} onNewBooking={handleNewBooking}>
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto mb-4"></div>
              <p>Loading form...</p>
            </div>
          </div>
        </BranchLayout>
        
        <AddClientDialog
          open={addClientDialogOpen}
          onOpenChange={setAddClientDialogOpen}
          branchId={branchId || ''}
          onSuccess={handleClientAdded}
        />
        
        <NewBookingDialog
          open={newBookingDialogOpen}
          onOpenChange={setNewBookingDialogOpen}
          carers={carers}
          services={services}
          onCreateBooking={handleCreateBooking}
          branchId={branchId || ''}
        />
      </>
    );
  }

  return (
    <>
      <BranchLayout onNewClient={handleNewClient} onNewBooking={handleNewBooking}>
      <FormBuilderNavBar 
        form={form}
      />
      
      <FormTabNavigation 
        activeTab={activeTab} 
        onTabChange={handleTabChange}
        title="Form Builder" 
        subtitle="Create and manage your form" 
      />
      
      <Tabs value={activeTab} onValueChange={handleTabChange}>
        <TabsContent value="naming" className="p-4 bg-white rounded-lg border shadow-sm">
          <FormNamingTab 
            form={form}
            onFormChange={handleFormChange}
            onSave={handleSaveForm}
            isFormDirty={isFormDirty}
            isSaving={isCreating || isUpdating || isSavingElements}
          />
        </TabsContent>
        
        <TabsContent value="design" className="p-4 bg-white rounded-lg border shadow-sm">
          <FormBuilderDesigner 
            form={form}
            onAddElement={addElement}
            onUpdateElement={updateElement}
            onRemoveElement={removeElement}
            onReorderElements={reorderElements}
          />
        </TabsContent>
        
        <TabsContent value="validation" className="p-4 bg-white rounded-lg border shadow-sm">
          <FormValidationTab 
            form={form} 
            onUpdateValidation={handleUpdateValidation} 
          />
        </TabsContent>
        
        <TabsContent value="preview" className="p-4 bg-white rounded-lg border shadow-sm">
          <FormBuilderPreview form={form} />
        </TabsContent>

        <TabsContent value="advanced" className="p-4 bg-white rounded-lg border shadow-sm">
          <FormAdvancedTab 
            form={form} 
            onUpdateSettings={handleUpdateSettings}
          />
        </TabsContent>

        <TabsContent value="publish" className="p-4 bg-white rounded-lg border shadow-sm">
          <FormBuilderPublish 
            form={form}
            onPublish={handlePublishForm}
            branchId={branchId || ''}
            onUpdatePermissions={handleUpdatePermissions}
          />
        </TabsContent>
        
        <TabsContent value="submissions" className="p-4 bg-white rounded-lg border shadow-sm">
          <FormSubmissionsTab 
            formId={form.id}
            branchId={branchId || ''}
          />
        </TabsContent>
      </Tabs>
    </BranchLayout>
    
    <AddClientDialog
      open={addClientDialogOpen}
      onOpenChange={setAddClientDialogOpen}
      branchId={branchId || ''}
      onSuccess={handleClientAdded}
    />
    
    <NewBookingDialog
      open={newBookingDialogOpen}
      onOpenChange={setNewBookingDialogOpen}
      carers={carers}
      services={services}
      onCreateBooking={handleCreateBooking}
      branchId={branchId || ''}
    />
  </>
  );
};

export default FormBuilder;

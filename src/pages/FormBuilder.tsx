import React, { useState, useEffect, useCallback, useRef } from 'react';
import { flushSync } from 'react-dom';
import { useParams, useNavigate } from 'react-router-dom';
import { useTenant } from '@/contexts/TenantContext';
import { BranchLayout } from '@/components/branch-dashboard/BranchLayout';
import { Tabs, TabsContent } from '@/components/ui/tabs';
import { FormBuilderDesigner } from '@/components/form-builder/FormBuilderDesigner';
import { FormBuilderPreview } from '@/components/form-builder/FormBuilderPreview';
import { FormBuilderPublish } from '@/components/form-builder/FormBuilderPublish';
import { FormBuilderNavBar } from '@/components/form-builder/FormBuilderNavBar';
import { FormValidationTab } from '@/components/form-builder/FormValidationTab';
import { FormAdvancedTab } from '@/components/form-builder/FormAdvancedTab';
import { TabNavigation as FormTabNavigation } from '@/components/form-builder/TabNavigation';

import { FormBuilderTab } from '@/components/form-builder/FormBuilderTab';
import { Form, FormElement, FormSettings, FormPermissions } from '@/types/form-builder';
import { useFormManagement, DatabaseForm } from '@/hooks/useFormManagement';
import { useFormElements } from '@/hooks/useFormElements';
import { useAuthSafe } from '@/hooks/useAuthSafe';
import { v4 as uuidv4 } from 'uuid';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/integrations/supabase/client';

// Helper function to persist form assignees to database
const persistFormAssignees = async (formId: string, assignees: any[], assignedBy: string) => {
  try {
    const assigneeRecords = assignees.map(assignee => ({
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

    console.log('Form assignees persisted successfully');
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

  const [activeTab, setActiveTab] = useState<string>('design');
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
    if (formId && forms.length > 0 && !isLoadingElements) {
      const existingForm = forms.find(f => f.id === formId);
      if (existingForm) {
        const convertedForm = convertDatabaseFormToForm(existingForm, uiElements);
        setForm(convertedForm);
        setIsLoadingForm(false);
      } else {
        setIsLoadingForm(false);
      }
    } else if (!formId) {
      setIsLoadingForm(false);
    }
  }, [formId, forms, uiElements, isLoadingElements, convertDatabaseFormToForm]);

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

  const handleTabChange = (value: string) => {
    setActiveTab(value);
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
        updateForm({
          formId: form.id,
          updates: {
            title: titleToSave,
            description: descriptionToSave,
            published: form.published,
            requires_review: form.requiresReview,
            settings: form.settings
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
      setForm(prev => ({
        ...prev,
        title: titleToSave,
        description: descriptionToSave,
        updatedAt: new Date().toISOString(),
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

        // Persist assignees for the new form
        if (assignees.length > 0) {
          await persistFormAssignees(createdForm.id, assignees, userId);
        }

        // Update local form state with the created form data
        setForm(prev => ({
          ...prev,
          id: createdForm.id,
          title: createdForm.title,
          description: createdForm.description || ''
        }));
      }
      
      // Persist assignees to the database
      if (assignees.length > 0) {
        await persistFormAssignees(form.id, assignees, userId);
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
    
    toast({
      title: 'Settings Updated',
      description: 'Form settings have been updated successfully',
    });
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
      <BranchLayout>
        <FormBuilderTab branchId={branchId || ''} branchName={decodedBranchName} />
      </BranchLayout>
    );
  }

  if (isLoadingForm || (formId && isLoadingElements)) {
    return (
      <BranchLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto mb-4"></div>
            <p>Loading form...</p>
          </div>
        </div>
      </BranchLayout>
    );
  }

  return (
    <BranchLayout>
      <FormBuilderNavBar 
        form={form}
        onSave={handleSaveForm}
        onFormChange={(title, description) => {
          setForm(prev => ({
            ...prev,
            title,
            description,
          }));
          setIsFormDirty(true);
        }}
        isFormDirty={isFormDirty}
        isSaving={isCreating || isUpdating || isSavingElements}
      />
      
      <FormTabNavigation 
        activeTab={activeTab} 
        onTabChange={handleTabChange}
        title="Form Builder" 
        subtitle="Create and manage your form" 
      />
      
      <Tabs value={activeTab} onValueChange={handleTabChange}>
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
      </Tabs>
    </BranchLayout>
  );
};

export default FormBuilder;

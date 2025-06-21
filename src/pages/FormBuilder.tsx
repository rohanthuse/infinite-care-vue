import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { DashboardHeader } from '@/components/DashboardHeader';
import { BranchInfoHeader } from '@/components/BranchInfoHeader';
import { Tabs, TabsContent } from '@/components/ui/tabs';
import { FormBuilderDesigner } from '@/components/form-builder/FormBuilderDesigner';
import { FormBuilderPreview } from '@/components/form-builder/FormBuilderPreview';
import { FormBuilderPublish } from '@/components/form-builder/FormBuilderPublish';
import { FormBuilderNavBar } from '@/components/form-builder/FormBuilderNavBar';
import { FormValidationTab } from '@/components/form-builder/FormValidationTab';
import { FormAdvancedTab } from '@/components/form-builder/FormAdvancedTab';
import { TabNavigation as FormTabNavigation } from '@/components/form-builder/TabNavigation';
import { TabNavigation } from '@/components/TabNavigation';
import { FormBuilderTab } from '@/components/form-builder/FormBuilderTab';
import { Form, FormElement, FormSettings, FormPermissions } from '@/types/form-builder';
import { useFormManagement, DatabaseForm } from '@/hooks/useFormManagement';
import { useFormElements } from '@/hooks/useFormElements';
import { useAuthSafe } from '@/hooks/useAuthSafe';
import { v4 as uuidv4 } from 'uuid';
import { useToast } from '@/components/ui/use-toast';

const FormBuilder = () => {
  const { id: branchId, branchName, formId } = useParams<{ id: string; branchName: string; formId?: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuthSafe();
  
  // Move all hooks to the top before any conditional logic
  const { 
    forms, 
    createForm, 
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
        navigate(`/branch-dashboard/${branchId}/${branchName}`);
      } else if (existingForm && !isLoadingForm) {
        toast({
          title: 'Form Loaded',
          description: 'The form has been loaded successfully',
        });
      }
    }
  }, [formId, forms.length, isLoadingElements, isLoadingForm, branchId, branchName]);

  // Auto-save elements when form elements change
  const saveFormElements = useCallback(async (elements: FormElement[]) => {
    if (formId && elements.length >= 0) {
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
    }
  }, [formId, saveElements, toast]);

  const handleTabChange = (value: string) => {
    setActiveTab(value);
  };

  const handleFormChange = (updatedForm: Form) => {
    setForm(updatedForm);
    setIsFormDirty(true);
  };

  const handleSaveForm = async () => {
    const userId = user?.id || 'temp-user-id';

    try {
      if (formId) {
        // Update existing form
        updateForm({
          formId: form.id,
          updates: {
            title: form.title,
            description: form.description,
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
        createForm({
          title: form.title,
          description: form.description,
          created_by: userId,
          published: form.published,
          requires_review: form.requiresReview,
          settings: form.settings
        });

        // Note: For new forms, we'll need to save elements after the form is created
        // This could be improved by handling the creation response
        if (form.elements.length > 0) {
          saveElements({
            formId: form.id,
            elements: form.elements
          });
        }
      }
      
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
        createForm({
          title: form.title,
          description: form.description,
          created_by: userId,
          published: true,
          requires_review: requiresReview,
          settings: form.settings
        });

        if (form.elements.length > 0) {
          saveElements({
            formId: form.id,
            elements: form.elements
          });
        }
      }
      
      setForm(prev => ({
        ...prev,
        published: true,
        requiresReview,
        assignees,
        updatedAt: new Date().toISOString(),
      }));
      
      setIsFormDirty(false);
      
      navigate(`/branch-dashboard/${branchId}/${branchName}`);
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
    
    // Auto-save elements immediately
    saveFormElements(updatedElements);
    
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
    
    // Auto-save elements immediately
    saveFormElements(updatedElements);
  };

  const removeElement = (elementId: string) => {
    const updatedElements = form.elements.filter(el => el.id !== elementId);
    setForm(prev => ({
      ...prev,
      elements: updatedElements,
    }));
    setIsFormDirty(true);
    
    // Auto-save elements immediately
    saveFormElements(updatedElements);
    
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
    
    // Auto-save elements immediately
    saveFormElements(elements);
  };

  const decodedBranchName = decodeURIComponent(branchName || "Med-Infinite Branch");

  const handleNavigate = (tab: string) => {
    if (tab !== "form-builder" && branchId && branchName) {
      navigate(`/branch-dashboard/${branchId}/${branchName}/${tab}`);
    }
  };

  // If no formId is provided, show the Form Matrix (FormBuilderTab)
  if (!formId) {
    return (
      <div className="min-h-screen flex flex-col bg-gradient-to-br from-gray-50 to-white">
        <DashboardHeader />
        
        <main className="flex-1 px-4 md:px-8 pt-4 pb-20 md:py-6 w-full">
          <BranchInfoHeader 
            branchName={decodedBranchName} 
            branchId={branchId || ""}
            onNewBooking={() => {}}
          />
          
          <div className="mb-6">
            <TabNavigation 
              activeTab="form-builder" 
              onChange={handleNavigate}
            />
          </div>
          
          <FormBuilderTab branchId={branchId || ''} branchName={decodedBranchName} />
        </main>
      </div>
    );
  }

  if (isLoadingForm || (formId && isLoadingElements)) {
    return (
      <div className="min-h-screen flex flex-col bg-gradient-to-br from-gray-50 to-white">
        <DashboardHeader />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto mb-4"></div>
            <p>Loading form...</p>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-gray-50 to-white">
      <DashboardHeader />
      
      <main className="flex-1 px-4 md:px-8 pt-4 pb-20 md:py-6 w-full">
        <BranchInfoHeader 
          branchName={decodedBranchName} 
          branchId={branchId || ""}
          onNewBooking={() => {}}
        />
        
        <div className="mb-6">
          <TabNavigation 
            activeTab="form-builder" 
            onChange={handleNavigate}
          />
        </div>
        
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
      </main>
    </div>
  );
};

export default FormBuilder;

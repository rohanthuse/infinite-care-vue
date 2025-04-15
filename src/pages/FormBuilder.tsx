
import React, { useState, useEffect } from 'react';
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
import { TabNavigation } from '@/components/form-builder/TabNavigation';
import { Form, FormElement, FormSettings, FormPermissions } from '@/types/form-builder';
import { v4 as uuidv4 } from 'uuid';
import { useToast } from '@/components/ui/use-toast';

const FormBuilder = () => {
  const { id: branchId, branchName, formId } = useParams<{ id: string; branchName: string; formId?: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<string>('design');
  const [isFormDirty, setIsFormDirty] = useState<boolean>(false);
  const [form, setForm] = useState<Form>({
    id: formId || uuidv4(),
    title: 'Untitled Form',
    description: '',
    elements: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    createdBy: {
      id: '1',
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

  useEffect(() => {
    if (formId) {
      const mockLoadForm = async () => {
        try {
          await new Promise(resolve => setTimeout(resolve, 500));
          
          setForm(prev => ({
            ...prev,
            title: `Form ${formId}`,
            description: 'This is a sample form description',
          }));
          
          toast({
            title: 'Form Loaded',
            description: 'The form has been loaded successfully',
          });
        } catch (error) {
          toast({
            title: 'Error Loading Form',
            description: 'There was an error loading the form',
            variant: 'destructive',
          });
        }
      };

      mockLoadForm();
    }
  }, [formId, toast]);

  const handleTabChange = (value: string) => {
    setActiveTab(value);
  };

  const handleFormChange = (updatedForm: Form) => {
    setForm(updatedForm);
    setIsFormDirty(true);
  };

  const handleSaveForm = async () => {
    try {
      await new Promise(resolve => setTimeout(resolve, 500));
      
      setForm(prev => ({
        ...prev,
        updatedAt: new Date().toISOString(),
      }));
      
      setIsFormDirty(false);
      
      toast({
        title: 'Form Saved',
        description: 'Your form has been saved successfully',
      });
    } catch (error) {
      toast({
        title: 'Error Saving Form',
        description: 'There was an error saving your form',
        variant: 'destructive',
      });
    }
  };

  const handlePublishForm = async (requiresReview: boolean, assignees: any[]) => {
    try {
      await new Promise(resolve => setTimeout(resolve, 500));
      
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
        description: 'Your form has been published successfully',
      });
      
      navigate(`/branch-dashboard/${branchId}/${branchName}`);
    } catch (error) {
      toast({
        title: 'Error Publishing Form',
        description: 'There was an error publishing your form',
        variant: 'destructive',
      });
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
    setForm(prev => ({
      ...prev,
      elements: [...prev.elements, element],
    }));
    setIsFormDirty(true);
  };

  const updateElement = (elementId: string, updatedElement: Partial<FormElement>) => {
    setForm(prev => ({
      ...prev,
      elements: prev.elements.map(el => 
        el.id === elementId ? { ...el, ...updatedElement } as FormElement : el
      ),
    }));
    setIsFormDirty(true);
  };

  const removeElement = (elementId: string) => {
    setForm(prev => ({
      ...prev,
      elements: prev.elements.filter(el => el.id !== elementId),
    }));
    setIsFormDirty(true);
  };

  const reorderElements = (elements: FormElement[]) => {
    setForm(prev => ({
      ...prev,
      elements,
    }));
    setIsFormDirty(true);
  };

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-gray-50 to-white">
      <DashboardHeader />
      
      <main className="flex-1 px-4 md:px-8 pt-4 pb-20 md:py-6 w-full">
        <BranchInfoHeader 
          branchName={decodeURIComponent(branchName || "Med-Infinite Branch")} 
          branchId={branchId || ""}
          onNewBooking={() => {}}
        />
        
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
        />
        
        <TabNavigation 
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

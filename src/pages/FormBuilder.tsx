
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { DashboardHeader } from '@/components/DashboardHeader';
import { BranchInfoHeader } from '@/components/BranchInfoHeader';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { FormBuilderDesigner } from '@/components/form-builder/FormBuilderDesigner';
import { FormBuilderPreview } from '@/components/form-builder/FormBuilderPreview';
import { FormBuilderPublish } from '@/components/form-builder/FormBuilderPublish';
import { FormBuilderNavBar } from '@/components/form-builder/FormBuilderNavBar';
import { FormValidationTab } from '@/components/form-builder/FormValidationTab';
import { FormAdvancedTab } from '@/components/form-builder/FormAdvancedTab';
import { Form, FormElement } from '@/types/form-builder';
import { v4 as uuidv4 } from 'uuid';
import { useToast } from '@/components/ui/use-toast';
import { 
  NavigationMenu, 
  NavigationMenuContent, 
  NavigationMenuItem, 
  NavigationMenuLink, 
  NavigationMenuList, 
  NavigationMenuTrigger 
} from '@/components/ui/navigation-menu';
import { cn } from '@/lib/utils';

const FormBuilder = () => {
  const { id: branchId, branchName, formId } = useParams<{ id: string; branchName: string; formId?: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("design");
  const [isFormDirty, setIsFormDirty] = useState(false);
  
  // Initialize empty form with default values
  const [form, setForm] = useState<Form>({
    id: formId || uuidv4(),
    title: "New Form",
    elements: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    createdBy: {
      id: "user-1",
      name: "Admin User"
    },
    published: false,
    requiresReview: false,
    version: 1,
    assignees: [],
    permissions: {
      view: {
        clients: true,
        staff: true,
        carers: false,
        admins: true
      },
      submit: {
        clients: true,
        staff: true,
        carers: false,
        admins: true
      },
      manage: {
        clients: false,
        staff: false,
        carers: false,
        admins: true
      }
    },
    settings: {
      requireAuth: true,
      recordIP: true
    }
  });

  useEffect(() => {
    if (formId) {
      // In a real app, we would fetch the form by ID from an API
      // For now we just use the dummy form data
      console.log(`Fetching form with ID: ${formId}`);
    }
  }, [formId]);

  const handleFormChange = (title: string, description: string) => {
    setForm(prev => ({
      ...prev,
      title,
      description,
      updatedAt: new Date().toISOString()
    }));
    setIsFormDirty(true);
  };

  const handleAddElement = (element: FormElement) => {
    setForm(prev => ({
      ...prev,
      elements: [...prev.elements, element],
      updatedAt: new Date().toISOString()
    }));
    setIsFormDirty(true);
  };

  const handleUpdateElement = (elementId: string, updatedElement: Partial<FormElement>) => {
    setForm(prev => ({
      ...prev,
      elements: prev.elements.map(el => 
        el.id === elementId ? { ...el, ...updatedElement } : el
      ),
      updatedAt: new Date().toISOString()
    }));
    setIsFormDirty(true);
  };

  const handleRemoveElement = (elementId: string) => {
    setForm(prev => ({
      ...prev,
      elements: prev.elements.filter(el => el.id !== elementId),
      updatedAt: new Date().toISOString()
    }));
    setIsFormDirty(true);
  };

  const handleReorderElements = (reorderedElements: FormElement[]) => {
    setForm(prev => ({
      ...prev,
      elements: reorderedElements,
      updatedAt: new Date().toISOString()
    }));
    setIsFormDirty(true);
  };

  const handleSaveForm = () => {
    // In a real app, we would save the form to the database
    console.log("Saving form:", form);
    toast({
      title: "Form Saved",
      description: `${form.title} has been saved successfully.`,
    });
    setIsFormDirty(false);
  };

  const handleUpdatePermissions = (permissions: Form['permissions']) => {
    setForm(prev => ({
      ...prev,
      permissions,
      updatedAt: new Date().toISOString()
    }));
    setIsFormDirty(true);
  };

  const handleUpdateSettings = (settings: Form['settings']) => {
    setForm(prev => ({
      ...prev,
      settings,
      updatedAt: new Date().toISOString()
    }));
    setIsFormDirty(true);
  };

  const handleNewBooking = () => {
    // Navigate to the bookings page or open a new booking dialog
    navigate(`/branch-dashboard/${branchId}/${branchName}/bookings/new`);
  };

  return (
    <div className="container mx-auto px-4 py-6">
      <DashboardHeader title="Form Builder" subtitle="Create and manage forms for your branch" />
      
      <BranchInfoHeader 
        branchName={branchName || "Branch"} 
        branchId={branchId || "1"}
        onNewBooking={handleNewBooking}
      />

      <FormBuilderNavBar
        form={form}
        onSave={handleSaveForm}
        onFormChange={handleFormChange}
        isFormDirty={isFormDirty}
      />

      <div className="mb-6 mt-4">
        <NavigationMenu>
          <NavigationMenuList>
            <NavigationMenuItem>
              <NavigationMenuTrigger>Form Setup</NavigationMenuTrigger>
              <NavigationMenuContent>
                <ul className="grid w-[400px] gap-3 p-4 md:grid-cols-2">
                  <li className="row-span-3">
                    <NavigationMenuLink asChild>
                      <a
                        className="flex h-full w-full select-none flex-col justify-end rounded-md bg-gradient-to-b from-blue-50 to-blue-100 p-6 no-underline outline-none focus:shadow-md"
                        href="#"
                        onClick={(e) => {
                          e.preventDefault();
                          setActiveTab("permissions");
                        }}
                      >
                        <div className="mb-2 mt-4 text-lg font-medium">
                          Permissions
                        </div>
                        <p className="text-sm leading-tight text-muted-foreground">
                          Configure who can view, submit, and manage this form
                        </p>
                      </a>
                    </NavigationMenuLink>
                  </li>
                  <li>
                    <NavigationMenuLink asChild>
                      <a
                        className="block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground"
                        href="#"
                        onClick={(e) => {
                          e.preventDefault();
                          setActiveTab("design");
                        }}
                      >
                        <div className="text-sm font-medium leading-none">Design</div>
                        <p className="line-clamp-2 text-sm leading-snug text-muted-foreground">
                          Build your form with various field types
                        </p>
                      </a>
                    </NavigationMenuLink>
                  </li>
                  <li>
                    <NavigationMenuLink asChild>
                      <a
                        className="block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground"
                        href="#"
                        onClick={(e) => {
                          e.preventDefault();
                          setActiveTab("validation");
                        }}
                      >
                        <div className="text-sm font-medium leading-none">Validation</div>
                        <p className="line-clamp-2 text-sm leading-snug text-muted-foreground">
                          Set validation rules for form fields
                        </p>
                      </a>
                    </NavigationMenuLink>
                  </li>
                  <li>
                    <NavigationMenuLink asChild>
                      <a
                        className="block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground"
                        href="#"
                        onClick={(e) => {
                          e.preventDefault();
                          setActiveTab("advanced");
                        }}
                      >
                        <div className="text-sm font-medium leading-none">Advanced</div>
                        <p className="line-clamp-2 text-sm leading-snug text-muted-foreground">
                          Configure notifications and workflow
                        </p>
                      </a>
                    </NavigationMenuLink>
                  </li>
                </ul>
              </NavigationMenuContent>
            </NavigationMenuItem>

            <NavigationMenuItem>
              <NavigationMenuTrigger>View & Test</NavigationMenuTrigger>
              <NavigationMenuContent>
                <ul className="grid gap-3 p-4 w-[300px]">
                  <li>
                    <NavigationMenuLink asChild>
                      <a
                        className="block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground"
                        href="#"
                        onClick={(e) => {
                          e.preventDefault();
                          setActiveTab("preview");
                        }}
                      >
                        <div className="text-sm font-medium leading-none">Preview</div>
                        <p className="line-clamp-2 text-sm leading-snug text-muted-foreground">
                          Test your form in desktop and mobile views
                        </p>
                      </a>
                    </NavigationMenuLink>
                  </li>
                </ul>
              </NavigationMenuContent>
            </NavigationMenuItem>

            <NavigationMenuItem>
              <NavigationMenuTrigger>Publish</NavigationMenuTrigger>
              <NavigationMenuContent>
                <ul className="grid gap-3 p-4 w-[300px]">
                  <li>
                    <NavigationMenuLink asChild>
                      <a
                        className="block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground"
                        href="#"
                        onClick={(e) => {
                          e.preventDefault();
                          setActiveTab("publish");
                        }}
                      >
                        <div className="text-sm font-medium leading-none">Publish Form</div>
                        <p className="line-clamp-2 text-sm leading-snug text-muted-foreground">
                          Make your form available to users
                        </p>
                      </a>
                    </NavigationMenuLink>
                  </li>
                </ul>
              </NavigationMenuContent>
            </NavigationMenuItem>
          </NavigationMenuList>
        </NavigationMenu>
      </div>

      <div className="bg-white rounded-lg border shadow-sm p-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="w-full justify-start mb-4">
            <TabsTrigger value="design">Design</TabsTrigger>
            <TabsTrigger value="validation">Validation</TabsTrigger>
            <TabsTrigger value="advanced">Advanced</TabsTrigger>
            <TabsTrigger value="preview">Preview</TabsTrigger>
            <TabsTrigger value="permissions">Permissions</TabsTrigger>
            <TabsTrigger value="publish">Publish</TabsTrigger>
          </TabsList>

          <TabsContent value="design" className="mt-6">
            <FormBuilderDesigner 
              form={form}
              onAddElement={handleAddElement}
              onUpdateElement={handleUpdateElement}
              onRemoveElement={handleRemoveElement}
              onReorderElements={handleReorderElements}
            />
          </TabsContent>

          <TabsContent value="validation" className="mt-6">
            <FormValidationTab 
              form={form}
              onUpdateElement={handleUpdateElement}
            />
          </TabsContent>

          <TabsContent value="advanced" className="mt-6">
            <FormAdvancedTab 
              form={form}
              onUpdateSettings={handleUpdateSettings}
            />
          </TabsContent>

          <TabsContent value="preview" className="mt-6">
            <FormBuilderPreview form={form} />
          </TabsContent>

          <TabsContent value="permissions" className="mt-6">
            <FormBuilderPublish 
              form={form}
              onPublish={() => {
                setForm(prev => ({
                  ...prev,
                  published: true,
                  updatedAt: new Date().toISOString()
                }));
                setIsFormDirty(true);
                toast({
                  title: "Form Published",
                  description: `${form.title} has been published and is now available.`,
                });
              }}
              onUpdatePermissions={handleUpdatePermissions}
            />
          </TabsContent>

          <TabsContent value="publish" className="mt-6">
            <FormBuilderPublish 
              form={form}
              onPublish={() => {
                setForm(prev => ({
                  ...prev,
                  published: true,
                  updatedAt: new Date().toISOString()
                }));
                setIsFormDirty(true);
                toast({
                  title: "Form Published",
                  description: `${form.title} has been published and is now available.`,
                });
              }}
              onUpdatePermissions={handleUpdatePermissions}
            />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

// Add the default export
export default FormBuilder;

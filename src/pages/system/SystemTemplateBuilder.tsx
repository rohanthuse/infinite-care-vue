import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { DashboardHeader } from '@/components/DashboardHeader';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Save, Eye, Settings, Loader2, CheckCircle } from 'lucide-react';
import { useSystemTemplate, useUpdateSystemTemplate } from '@/hooks/useSystemTemplates';
import { useSystemTemplateElements, useSaveSystemTemplateElements, convertToUIElements } from '@/hooks/useSystemTemplateElements';
import { FormBuilderDesigner } from '@/components/form-builder/FormBuilderDesigner';
import { FormBuilderPreview } from '@/components/form-builder/FormBuilderPreview';
import { Form, FormElement, FormSettings } from '@/types/form-builder';
import { toast } from '@/hooks/use-toast';

export default function SystemTemplateBuilder() {
  const { templateId } = useParams<{ templateId: string }>();
  const navigate = useNavigate();
  
  const { data: template, isLoading: templateLoading } = useSystemTemplate(templateId);
  const { data: dbElements = [], isLoading: elementsLoading } = useSystemTemplateElements(templateId);
  const updateTemplate = useUpdateSystemTemplate();
  const saveElements = useSaveSystemTemplateElements();

  const [activeTab, setActiveTab] = useState('design');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [elements, setElements] = useState<FormElement[]>([]);
  const [settings, setSettings] = useState<FormSettings>({
    showProgressBar: false,
    allowSaveAsDraft: false,
    autoSaveEnabled: false,
    autoSaveInterval: 60,
    redirectAfterSubmit: false,
    submitButtonText: 'Submit'
  });
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Initialize state from fetched data
  useEffect(() => {
    if (template) {
      setTitle(template.title);
      setDescription(template.description || '');
      if (template.settings) {
        setSettings(prev => ({ ...prev, ...template.settings }));
      }
    }
  }, [template]);

  useEffect(() => {
    if (dbElements.length > 0) {
      setElements(convertToUIElements(dbElements));
    }
  }, [dbElements]);

  // Build form object for the designer and preview
  const formObject: Form = {
    id: templateId || '',
    title,
    description,
    elements,
    createdAt: template?.created_at || new Date().toISOString(),
    updatedAt: template?.updated_at || new Date().toISOString(),
    createdBy: { id: template?.created_by || '', name: 'System' },
    published: template?.published || false,
    requiresReview: template?.requires_review || false,
    version: template?.version || 1,
    assignees: [],
    settings,
  };

  const handleSave = async () => {
    if (!templateId) return;
    
    setIsSaving(true);
    try {
      // Save template metadata
      await updateTemplate.mutateAsync({
        templateId,
        updates: {
          title,
          description,
          settings,
        }
      });

      // Save elements
      await saveElements.mutateAsync({
        templateId,
        elements,
      });

      setHasUnsavedChanges(false);
      toast({
        title: 'Template Saved',
        description: 'Your template has been saved successfully.',
      });
    } catch (error) {
      console.error('Error saving template:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handlePublishToggle = async (published: boolean) => {
    if (!templateId) return;

    await updateTemplate.mutateAsync({
      templateId,
      updates: { published }
    });

    toast({
      title: published ? 'Template Published' : 'Template Unpublished',
      description: published 
        ? 'This template is now available to all tenant organisations.' 
        : 'This template is now hidden from tenant organisations.',
    });
  };

  // Element handlers for FormBuilderDesigner
  const handleAddElement = useCallback((element: FormElement) => {
    setElements(prev => [...prev, element]);
    setHasUnsavedChanges(true);
  }, []);

  const handleUpdateElement = useCallback((elementId: string, updatedElement: Partial<FormElement>) => {
    setElements(prev => prev.map(el => 
      el.id === elementId ? { ...el, ...updatedElement } as FormElement : el
    ));
    setHasUnsavedChanges(true);
  }, []);

  const handleRemoveElement = useCallback((elementId: string) => {
    setElements(prev => prev.filter(el => el.id !== elementId));
    setHasUnsavedChanges(true);
  }, []);

  const handleReorderElements = useCallback((newElements: FormElement[]) => {
    setElements(newElements);
    setHasUnsavedChanges(true);
  }, []);

  if (templateLoading || elementsLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background to-muted/30">
        <DashboardHeader />
        <div className="flex items-center justify-center h-[calc(100vh-80px)]">
          <Loader2 className="h-8 w-8 animate-spin" />
          <span className="ml-2">Loading template...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted/30">
      <DashboardHeader />
      
      <main className="w-full px-4 sm:px-6 lg:px-8 py-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <Button 
              variant="ghost" 
              size="icon"
              onClick={() => navigate('/system-dashboard/system-templates')}
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-bold">{title || 'Untitled Template'}</h1>
                {template?.published ? (
                  <Badge className="bg-green-100 text-green-700">Published</Badge>
                ) : (
                  <Badge variant="secondary">Draft</Badge>
                )}
                {hasUnsavedChanges && (
                  <Badge variant="outline" className="text-amber-600 border-amber-300">
                    Unsaved changes
                  </Badge>
                )}
              </div>
              <p className="text-sm text-muted-foreground">System Template Builder</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <Label htmlFor="publish-toggle" className="text-sm">Published</Label>
              <Switch
                id="publish-toggle"
                checked={template?.published || false}
                onCheckedChange={handlePublishToggle}
              />
            </div>
            <Button onClick={handleSave} disabled={isSaving}>
              {isSaving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Save Template
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Main Content */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-6">
            <TabsTrigger value="design">
              <Settings className="mr-2 h-4 w-4" />
              Design
            </TabsTrigger>
            <TabsTrigger value="preview">
              <Eye className="mr-2 h-4 w-4" />
              Preview
            </TabsTrigger>
            <TabsTrigger value="settings">
              <CheckCircle className="mr-2 h-4 w-4" />
              Settings
            </TabsTrigger>
          </TabsList>

          <TabsContent value="design" className="space-y-6">
            {/* Template Info */}
            <Card>
              <CardHeader>
                <CardTitle>Template Information</CardTitle>
                <CardDescription>Basic details about this template</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Template Title</Label>
                  <Input
                    id="title"
                    value={title}
                    onChange={(e) => {
                      setTitle(e.target.value);
                      setHasUnsavedChanges(true);
                    }}
                    placeholder="Enter template title"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={description}
                    onChange={(e) => {
                      setDescription(e.target.value);
                      setHasUnsavedChanges(true);
                    }}
                    placeholder="Enter template description"
                    rows={3}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Form Designer */}
            <FormBuilderDesigner
              form={formObject}
              onAddElement={handleAddElement}
              onUpdateElement={handleUpdateElement}
              onRemoveElement={handleRemoveElement}
              onReorderElements={handleReorderElements}
            />
          </TabsContent>

          <TabsContent value="preview">
            <FormBuilderPreview form={formObject} />
          </TabsContent>

          <TabsContent value="settings">
            <Card>
              <CardHeader>
                <CardTitle>Template Settings</CardTitle>
                <CardDescription>Configure how this template behaves when used</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Show Progress Bar</Label>
                    <p className="text-sm text-muted-foreground">Display a progress bar showing form completion</p>
                  </div>
                  <Switch
                    checked={settings.showProgressBar}
                    onCheckedChange={(checked) => {
                      setSettings(prev => ({ ...prev, showProgressBar: checked }));
                      setHasUnsavedChanges(true);
                    }}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Allow Save as Draft</Label>
                    <p className="text-sm text-muted-foreground">Allow users to save incomplete forms</p>
                  </div>
                  <Switch
                    checked={settings.allowSaveAsDraft}
                    onCheckedChange={(checked) => {
                      setSettings(prev => ({ ...prev, allowSaveAsDraft: checked }));
                      setHasUnsavedChanges(true);
                    }}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Requires Review</Label>
                    <p className="text-sm text-muted-foreground">Submissions require admin review before completion</p>
                  </div>
                  <Switch
                    checked={template?.requires_review || false}
                    onCheckedChange={async (checked) => {
                      if (templateId) {
                        await updateTemplate.mutateAsync({
                          templateId,
                          updates: { requires_review: checked }
                        });
                      }
                    }}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="submit-text">Submit Button Text</Label>
                  <Input
                    id="submit-text"
                    value={settings.submitButtonText}
                    onChange={(e) => {
                      setSettings(prev => ({ ...prev, submitButtonText: e.target.value }));
                      setHasUnsavedChanges(true);
                    }}
                    placeholder="Submit"
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}

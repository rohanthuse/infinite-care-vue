import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTenant } from '@/contexts/TenantContext';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Search, FileText, Eye, Copy, Loader2, Lock, CheckCircle } from 'lucide-react';
import { usePublishedSystemTemplates } from '@/hooks/useSystemTemplates';
import { useSystemTemplateElements, convertToUIElements } from '@/hooks/useSystemTemplateElements';
import { useFormManagement } from '@/hooks/useFormManagement';
import { useAuthSafe } from '@/hooks/useAuthSafe';
import { toast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { FormBuilderPreview } from './FormBuilderPreview';
import { Form, FormSettings } from '@/types/form-builder';
import { supabase } from '@/integrations/supabase/client';

interface SystemTemplatesContentProps {
  branchId: string;
  branchName: string;
}

export const SystemTemplatesContent: React.FC<SystemTemplatesContentProps> = ({ branchId, branchName }) => {
  const navigate = useNavigate();
  const { user } = useAuthSafe();
  const { tenantSlug } = useTenant();
  const [searchQuery, setSearchQuery] = useState('');
  const [previewTemplateId, setPreviewTemplateId] = useState<string | null>(null);
  const [isUsingTemplate, setIsUsingTemplate] = useState(false);

  const { data: templates = [], isLoading } = usePublishedSystemTemplates();
  const { data: previewElements = [] } = useSystemTemplateElements(previewTemplateId || undefined);
  const { createForm } = useFormManagement(branchId);

  const filteredTemplates = templates.filter(template =>
    template.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (template.description && template.description.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const selectedTemplate = templates.find(t => t.id === previewTemplateId);

  const handlePreview = (templateId: string) => {
    setPreviewTemplateId(templateId);
  };

  const handleUseTemplate = async (templateId: string) => {
    if (!user?.id) {
      toast({
        title: 'Authentication Required',
        description: 'You must be logged in to use templates',
        variant: 'destructive',
      });
      return;
    }

    const template = templates.find(t => t.id === templateId);
    if (!template) return;

    setIsUsingTemplate(true);

    try {
      // Create a new form based on the template
      const newFormData = {
        title: `${template.title}`,
        description: template.description || '',
        created_by: user.id,
        published: false,
        requires_review: template.requires_review,
        settings: template.settings as FormSettings || {
          showProgressBar: false,
          allowSaveAsDraft: false,
          autoSaveEnabled: false,
          autoSaveInterval: 60,
          redirectAfterSubmit: false,
          submitButtonText: 'Submit'
        }
      };

      // The createForm will handle the navigation
      createForm(newFormData, {
        onSuccess: async (newForm: any) => {
          try {
            // Fetch template elements
            const { data: templateElements, error: fetchError } = await supabase
              .from('system_template_elements')
              .select('*')
              .eq('template_id', templateId)
              .order('order_index', { ascending: true });

            if (fetchError) {
              console.error('Error fetching template elements:', fetchError);
            }

            // Copy elements to the new form
            if (templateElements && templateElements.length > 0) {
              const formElements = templateElements.map(el => ({
                form_id: newForm.id,
                element_type: el.element_type,
                label: el.label,
                required: el.required,
                order_index: el.order_index,
                properties: el.properties,
                validation_rules: el.validation_rules,
              }));

              const { error: insertError } = await supabase
                .from('form_elements')
                .insert(formElements);

              if (insertError) {
                console.error('Error copying template elements:', insertError);
                toast({
                  title: 'Partial Success',
                  description: 'Form created but some elements could not be copied. Please add them manually.',
                  variant: 'default',
                });
              } else {
                toast({
                  title: 'Form Created',
                  description: `A new form with ${templateElements.length} element(s) has been created from the system template.`,
                });
              }
            } else {
              toast({
                title: 'Form Created',
                description: 'A new form has been created from the system template. You can now customize it.',
              });
            }
          } catch (copyError) {
            console.error('Error copying elements:', copyError);
            toast({
              title: 'Form Created',
              description: 'Form created but elements could not be copied. Please add them manually.',
            });
          }
          
          const fullPath = tenantSlug 
            ? `/${tenantSlug}/branch-dashboard/${branchId}/${encodeURIComponent(branchName)}/form-builder/${newForm.id}?source=forms`
            : `/branch-dashboard/${branchId}/${encodeURIComponent(branchName)}/form-builder/${newForm.id}?source=forms`;
          navigate(fullPath);
        },
        onError: (error: any) => {
          toast({
            title: 'Error',
            description: error.message || 'Failed to create form from template',
            variant: 'destructive',
          });
        }
      });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to create form from template',
        variant: 'destructive',
      });
    } finally {
      setIsUsingTemplate(false);
      setPreviewTemplateId(null);
    }
  };

  // Build preview form object
  const previewForm: Form | null = selectedTemplate ? {
    id: selectedTemplate.id,
    title: selectedTemplate.title,
    description: selectedTemplate.description || undefined,
    elements: convertToUIElements(previewElements),
    createdAt: selectedTemplate.created_at,
    updatedAt: selectedTemplate.updated_at,
    createdBy: { id: selectedTemplate.created_by, name: 'System' },
    published: selectedTemplate.published,
    requiresReview: selectedTemplate.requires_review,
    version: selectedTemplate.version,
    assignees: [],
    settings: selectedTemplate.settings as FormSettings,
  } : null;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2">Loading system templates...</span>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center gap-4 mb-6">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search system templates..."
            className="pl-9"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Lock className="h-4 w-4" />
          <span>System templates are read-only</span>
        </div>
      </div>

      {filteredTemplates.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-64 text-center">
          <FileText className="h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium">No system templates available</h3>
          <p className="text-sm text-muted-foreground mt-1">
            {searchQuery ? 'Try adjusting your search criteria' : 'System templates will appear here when published by administrators'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredTemplates.map((template) => (
            <Card key={template.id} className="overflow-hidden hover:shadow-md transition-shadow">
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between">
                  <div className="space-y-1 flex-1">
                    <CardTitle className="text-base flex items-center gap-2">
                      <FileText className="h-4 w-4 text-primary" />
                      {template.title}
                    </CardTitle>
                    {template.description && (
                      <CardDescription className="line-clamp-2">{template.description}</CardDescription>
                    )}
                  </div>
                  <Badge variant="secondary" className="ml-2 flex items-center gap-1">
                    <CheckCircle className="h-3 w-3" />
                    System
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="pb-2">
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between text-muted-foreground">
                    <span>Version:</span>
                    <span className="font-medium">v{template.version}</span>
                  </div>
                  <div className="flex justify-between text-muted-foreground">
                    <span>Updated:</span>
                    <span className="font-medium">{format(new Date(template.updated_at), 'dd MMM yyyy')}</span>
                  </div>
                </div>
              </CardContent>
              <CardFooter className="pt-2 flex gap-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="flex-1"
                  onClick={() => handlePreview(template.id)}
                >
                  <Eye className="mr-2 h-4 w-4" />
                  Preview
                </Button>
                <Button 
                  size="sm" 
                  className="flex-1"
                  onClick={() => handleUseTemplate(template.id)}
                  disabled={isUsingTemplate}
                >
                  <Copy className="mr-2 h-4 w-4" />
                  Use Template
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}

      {/* Preview Dialog */}
      <Dialog open={!!previewTemplateId} onOpenChange={(open) => !open && setPreviewTemplateId(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-primary" />
              {selectedTemplate?.title}
              <Badge variant="secondary" className="ml-2">System Template</Badge>
            </DialogTitle>
            <DialogDescription>
              {selectedTemplate?.description || 'Preview this system template before using it'}
            </DialogDescription>
          </DialogHeader>
          
          {previewForm && (
            <div className="py-4">
              <FormBuilderPreview form={previewForm} />
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setPreviewTemplateId(null)}>
              Close
            </Button>
            <Button 
              onClick={() => previewTemplateId && handleUseTemplate(previewTemplateId)}
              disabled={isUsingTemplate}
            >
              {isUsingTemplate ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <Copy className="mr-2 h-4 w-4" />
                  Use This Template
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

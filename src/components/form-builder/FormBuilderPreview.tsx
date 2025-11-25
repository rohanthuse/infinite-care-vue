
import React, { useState, useMemo } from 'react';
import { Form } from '@/types/form-builder';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { FormElementRenderer } from './FormElementRenderer';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';
import { FileText, Smartphone, Monitor, AlertCircle, Save, Clock } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

interface FormBuilderPreviewProps {
  form: Form;
}

export const FormBuilderPreview: React.FC<FormBuilderPreviewProps> = ({ form }) => {
  const [viewMode, setViewMode] = useState<'desktop' | 'mobile'>('desktop');
  const [previewValues, setPreviewValues] = useState<Record<string, any>>({});
  const [showSubmitAlert, setShowSubmitAlert] = useState(false);
  const { toast } = useToast();

  // Get form settings
  const settings = form.settings || {
    showProgressBar: false,
    allowSaveAsDraft: false,
    autoSaveEnabled: false,
    autoSaveInterval: 60,
    redirectAfterSubmit: false,
    submitButtonText: 'Submit',
  };

  // Calculate progress based on filled required fields
  const progress = useMemo(() => {
    const requiredElements = form.elements.filter(el => 
      el.required && !['heading', 'paragraph', 'divider', 'section'].includes(el.type)
    );
    
    if (requiredElements.length === 0) return 100;
    
    const filledCount = requiredElements.filter(el => {
      const value = previewValues[el.id];
      if (value === undefined || value === null || value === '') return false;
      if (Array.isArray(value) && value.length === 0) return false;
      return true;
    }).length;
    
    return Math.round((filledCount / requiredElements.length) * 100);
  }, [form.elements, previewValues]);

  const handleChange = (elementId: string, value: any) => {
    setPreviewValues(prev => ({
      ...prev,
      [elementId]: value,
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Check if redirect is configured
    if (settings.redirectAfterSubmit && settings.redirectUrl) {
      toast({
        title: "Form Submitted",
        description: `In production, you would be redirected to: ${settings.redirectUrl}`,
      });
    } else {
      toast({
        title: "Form Submitted",
        description: "Your form has been submitted successfully in preview mode.",
      });
    }
    
    setShowSubmitAlert(true);
    console.log('Form submitted with values:', previewValues);
  };

  const handleSaveDraft = () => {
    toast({
      title: "Draft Saved",
      description: "Your form progress has been saved as a draft in preview mode.",
    });
    console.log('Draft saved with values:', previewValues);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-medium">Form Preview</h2>
        
        <div className="flex bg-gray-100 p-1 rounded-lg">
          <Button
            variant={viewMode === 'desktop' ? 'default' : 'ghost'}
            size="sm"
            className="flex items-center gap-1"
            onClick={() => setViewMode('desktop')}
          >
            <Monitor className="h-4 w-4" />
            <span className="hidden sm:inline">Desktop</span>
          </Button>
          <Button
            variant={viewMode === 'mobile' ? 'default' : 'ghost'}
            size="sm"
            className="flex items-center gap-1"
            onClick={() => setViewMode('mobile')}
          >
            <Smartphone className="h-4 w-4" />
            <span className="hidden sm:inline">Mobile</span>
          </Button>
        </div>
      </div>

      {/* Settings indicators */}
      <div className="flex flex-wrap gap-2 text-sm">
        {settings.showProgressBar && (
          <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded-md">Progress Bar: ON</span>
        )}
        {settings.allowSaveAsDraft && (
          <span className="px-2 py-1 bg-green-100 text-green-700 rounded-md">Save Draft: ON</span>
        )}
        {settings.autoSaveEnabled && (
          <span className="px-2 py-1 bg-purple-100 text-purple-700 rounded-md">
            Auto-Save: {settings.autoSaveInterval}s
          </span>
        )}
        {settings.redirectAfterSubmit && (
          <span className="px-2 py-1 bg-orange-100 text-orange-700 rounded-md">Redirect: ON</span>
        )}
      </div>
      
      {showSubmitAlert && (
        <Alert className="mb-4">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Success!</AlertTitle>
          <AlertDescription>
            Form submitted successfully in preview mode. This is just a simulation - 
            no data was actually saved. You can continue testing the form.
          </AlertDescription>
          <Button 
            variant="outline" 
            size="sm" 
            className="mt-2"
            onClick={() => {
              setShowSubmitAlert(false);
              setPreviewValues({});
            }}
          >
            Reset Form
          </Button>
        </Alert>
      )}
      
      <div className={`mx-auto ${viewMode === 'mobile' ? 'max-w-sm' : 'max-w-3xl'}`}>
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-blue-600" />
              <CardTitle>{form.title}</CardTitle>
            </div>
            {form.description && (
              <CardDescription>{form.description}</CardDescription>
            )}
            
            {/* Progress Bar */}
            {settings.showProgressBar && (
              <div className="mt-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Progress</span>
                  <span className="font-medium">{progress}%</span>
                </div>
                <Progress value={progress} className="h-2" />
              </div>
            )}
          </CardHeader>
          <CardContent>
            <ScrollArea className={viewMode === 'desktop' ? 'h-[calc(100vh-400px)]' : 'h-[500px]'}>
              {form.elements.length === 0 ? (
                <div className="text-center py-10 border-2 border-dashed rounded-lg bg-gray-50">
                  <p className="text-gray-500">No form elements added yet. Add elements in the design tab.</p>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-6">
                  {form.elements.map((element) => (
                    <div key={element.id}>
                      <FormElementRenderer 
                        element={element} 
                        onChange={(value) => handleChange(element.id, value)}
                        value={previewValues[element.id]}
                        isPreview={true}
                      />
                    </div>
                  ))}
                  
                  <Separator className="my-6" />

                  {/* Auto-save indicator */}
                  {settings.autoSaveEnabled && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Clock className="h-4 w-4" />
                      <span>Auto-save enabled (every {settings.autoSaveInterval} seconds)</span>
                    </div>
                  )}
                  
                  <div className="flex justify-end gap-3">
                    {/* Save as Draft button - only show if setting is enabled */}
                    {settings.allowSaveAsDraft && (
                      <Button type="button" variant="outline" onClick={handleSaveDraft}>
                        <Save className="h-4 w-4 mr-2" />
                        Save as Draft
                      </Button>
                    )}
                    
                    {/* Submit button with custom text */}
                    <Button type="submit">
                      {settings.submitButtonText || 'Submit'}
                    </Button>
                  </div>
                </form>
              )}
            </ScrollArea>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

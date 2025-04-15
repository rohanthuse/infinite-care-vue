
import React, { useState } from 'react';
import { Form } from '@/types/form-builder';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { FormElementRenderer } from './FormElementRenderer';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { FileText, Smartphone, Monitor, AlertCircle } from 'lucide-react';
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

  const handleChange = (elementId: string, value: any) => {
    setPreviewValues(prev => ({
      ...prev,
      [elementId]: value,
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    toast({
      title: "Form Submitted",
      description: "Your form has been submitted successfully in preview mode.",
    });
    setShowSubmitAlert(true);
    console.log('Form submitted with values:', previewValues);
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
                  
                  <div className="flex justify-end">
                    <Button type="submit">Submit Form</Button>
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

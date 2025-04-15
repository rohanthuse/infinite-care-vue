
import React from 'react';
import { Form } from '@/types/form-builder';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { FormElementRenderer } from './FormElementRenderer';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { FileText, Smartphone, Monitor } from 'lucide-react';

interface FormBuilderPreviewProps {
  form: Form;
}

export const FormBuilderPreview: React.FC<FormBuilderPreviewProps> = ({ form }) => {
  const [viewMode, setViewMode] = React.useState<'desktop' | 'mobile'>('desktop');

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
                <div className="space-y-6">
                  {form.elements.map((element) => (
                    <div key={element.id}>
                      <FormElementRenderer element={element} />
                    </div>
                  ))}
                  
                  <Separator className="my-6" />
                  
                  <div className="flex justify-end">
                    <Button type="submit">Submit Form</Button>
                  </div>
                </div>
              )}
            </ScrollArea>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

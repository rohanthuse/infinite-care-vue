
import React from 'react';
import { Form, FormElement } from '@/types/form-builder';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ListFilter, AlertTriangle, CheckCircle, XCircle, FormInput } from 'lucide-react';

interface FormValidationTabProps {
  form: Form;
  onUpdateElement: (elementId: string, updatedElement: Partial<FormElement>) => void;
}

export const FormValidationTab: React.FC<FormValidationTabProps> = ({ 
  form,
  onUpdateElement
}) => {
  const handleRequiredChange = (id: string, required: boolean) => {
    onUpdateElement(id, { required });
  };

  const handleValidationChange = (id: string, field: string, value: any) => {
    onUpdateElement(id, { 
      [field]: value 
    });
  };

  // Filter out non-input elements like headings, dividers, etc.
  const inputElements = form.elements.filter(element => 
    !['heading', 'paragraph', 'divider', 'section'].includes(element.type)
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold">Form Validation</h2>
          <p className="text-muted-foreground">Set validation rules for your form fields</p>
        </div>
        <div className="flex items-center space-x-2">
          <Badge variant="outline" className="bg-amber-50 text-amber-600 border-amber-200">
            <AlertTriangle className="w-4 h-4 mr-1" /> {form.elements.filter(e => e.required).length} Required Fields
          </Badge>
        </div>
      </div>

      {inputElements.length === 0 ? (
        <div className="text-center py-10 border-2 border-dashed rounded-lg">
          <FormInput className="h-12 w-12 text-gray-400 mx-auto mb-3" />
          <h3 className="text-lg font-medium mb-1">No Form Fields</h3>
          <p className="text-muted-foreground">Add form elements in the Design tab first</p>
        </div>
      ) : (
        <ScrollArea className="h-[calc(100vh-350px)]">
          <Accordion 
            type="multiple" 
            defaultValue={inputElements.length > 0 ? [inputElements[0].id] : []}
            className="space-y-4"
          >
            {inputElements.map((element) => (
              <AccordionItem 
                key={element.id} 
                value={element.id}
                className="border rounded-md overflow-hidden"
              >
                <AccordionTrigger className="px-4 py-3 hover:bg-gray-50">
                  <div className="flex items-center justify-between w-full">
                    <div className="flex items-center">
                      <span className="font-medium">{element.label || "Unlabeled Field"}</span>
                      <span className="ml-2 text-xs text-muted-foreground">{element.type}</span>
                    </div>
                    <div className="flex items-center">
                      {element.required ? (
                        <Badge variant="outline" className="bg-red-50 text-red-600 border-red-100 mr-2">
                          Required
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="bg-gray-50 text-gray-600 border-gray-100 mr-2">
                          Optional
                        </Badge>
                      )}
                    </div>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="p-4 border-t">
                  <div className="space-y-4">
                    <div className="flex items-start space-x-2">
                      <Checkbox 
                        id={`required-${element.id}`} 
                        checked={element.required} 
                        onCheckedChange={(checked) => handleRequiredChange(element.id, !!checked)}
                      />
                      <div className="grid gap-1.5 leading-none">
                        <Label htmlFor={`required-${element.id}`} className="font-medium">
                          Required Field
                        </Label>
                        <p className="text-sm text-muted-foreground">
                          Users must complete this field to submit the form
                        </p>
                      </div>
                    </div>

                    {/* Type-specific validation options */}
                    {element.type === 'text' && (
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor={`min-length-${element.id}`}>Minimum Length</Label>
                          <Input 
                            id={`min-length-${element.id}`}
                            type="number"
                            min="0"
                            value={element.minLength || ''}
                            onChange={(e) => handleValidationChange(
                              element.id, 
                              'minLength',
                              e.target.value ? parseInt(e.target.value) : undefined
                            )}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor={`max-length-${element.id}`}>Maximum Length</Label>
                          <Input 
                            id={`max-length-${element.id}`}
                            type="number"
                            min="0"
                            value={element.maxLength || ''}
                            onChange={(e) => handleValidationChange(
                              element.id, 
                              'maxLength',
                              e.target.value ? parseInt(e.target.value) : undefined
                            )}
                          />
                        </div>
                      </div>
                    )}

                    {element.type === 'textarea' && (
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor={`min-length-${element.id}`}>Minimum Length</Label>
                          <Input 
                            id={`min-length-${element.id}`}
                            type="number"
                            min="0"
                            value={element.minLength || ''}
                            onChange={(e) => handleValidationChange(
                              element.id, 
                              'minLength',
                              e.target.value ? parseInt(e.target.value) : undefined
                            )}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor={`max-length-${element.id}`}>Maximum Length</Label>
                          <Input 
                            id={`max-length-${element.id}`}
                            type="number"
                            min="0"
                            value={element.maxLength || ''}
                            onChange={(e) => handleValidationChange(
                              element.id, 
                              'maxLength',
                              e.target.value ? parseInt(e.target.value) : undefined
                            )}
                          />
                        </div>
                      </div>
                    )}

                    {element.type === 'number' && (
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor={`min-${element.id}`}>Minimum Value</Label>
                          <Input 
                            id={`min-${element.id}`}
                            type="number"
                            value={element.min !== undefined ? element.min : ''}
                            onChange={(e) => handleValidationChange(
                              element.id, 
                              'min',
                              e.target.value !== '' ? parseFloat(e.target.value) : undefined
                            )}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor={`max-${element.id}`}>Maximum Value</Label>
                          <Input 
                            id={`max-${element.id}`}
                            type="number"
                            value={element.max !== undefined ? element.max : ''}
                            onChange={(e) => handleValidationChange(
                              element.id, 
                              'max',
                              e.target.value !== '' ? parseFloat(e.target.value) : undefined
                            )}
                          />
                        </div>
                      </div>
                    )}

                    {element.type === 'date' && (
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor={`min-date-${element.id}`}>Minimum Date</Label>
                          <Input 
                            id={`min-date-${element.id}`}
                            type="date"
                            value={element.min || ''}
                            onChange={(e) => handleValidationChange(element.id, 'min', e.target.value)}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor={`max-date-${element.id}`}>Maximum Date</Label>
                          <Input 
                            id={`max-date-${element.id}`}
                            type="date"
                            value={element.max || ''}
                            onChange={(e) => handleValidationChange(element.id, 'max', e.target.value)}
                          />
                        </div>
                      </div>
                    )}

                    {/* Custom error message */}
                    <div className="space-y-2">
                      <Label htmlFor={`error-message-${element.id}`}>Custom Error Message</Label>
                      <Textarea 
                        id={`error-message-${element.id}`}
                        placeholder="Enter a custom error message to show when validation fails"
                        value={(element as any).errorMessage || ''}
                        onChange={(e) => handleValidationChange(element.id, 'errorMessage', e.target.value)}
                        rows={2}
                      />
                    </div>
                  </div>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </ScrollArea>
      )}
    </div>
  );
};

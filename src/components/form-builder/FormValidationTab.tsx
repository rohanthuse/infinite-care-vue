
import React, { useState } from 'react';
import { Form, FormElement } from '@/types/form-builder';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { AlertCircle, Check, X } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

interface FormValidationTabProps {
  form: Form;
  onUpdateValidation: (elementId: string, errorMessage: string) => void;
}

export const FormValidationTab: React.FC<FormValidationTabProps> = ({ 
  form, 
  onUpdateValidation 
}) => {
  const [validationMessages, setValidationMessages] = useState<{[key: string]: string}>(() => {
    const initialState: {[key: string]: string} = {};
    form.elements.forEach(element => {
      if (element.errorMessage) {
        initialState[element.id] = element.errorMessage;
      }
    });
    return initialState;
  });

  const handleValidationChange = (elementId: string, message: string) => {
    setValidationMessages(prev => ({
      ...prev,
      [elementId]: message
    }));
  };

  const handleApplyValidation = (elementId: string) => {
    onUpdateValidation(elementId, validationMessages[elementId] || '');
  };

  // Filter out elements that don't need validation (like headings, paragraphs, etc.)
  const validatableElements = form.elements.filter(element => 
    !['heading', 'paragraph', 'divider'].includes(element.type)
  );
  
  const getElementTypeLabel = (type: FormElementType): string => {
    const typeMap: {[key in FormElementType]?: string} = {
      text: 'Text Field',
      textarea: 'Text Area',
      number: 'Number',
      email: 'Email',
      tel: 'Phone Number',
      date: 'Date',
      time: 'Time',
      checkbox: 'Checkbox Group',
      radio: 'Radio Group',
      select: 'Dropdown',
      multiselect: 'Multi-select',
      signature: 'Signature',
      file: 'File Upload',
      section: 'Section',
      heading: 'Heading',
      paragraph: 'Paragraph',
      divider: 'Divider'
    };
    
    return typeMap[type] || type.charAt(0).toUpperCase() + type.slice(1);
  };

  return (
    <div className="space-y-6">
      <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg flex items-start gap-3">
        <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5" />
        <div>
          <h3 className="font-medium text-blue-800">Form Validation</h3>
          <p className="text-sm text-blue-600">
            Configure custom error messages for each form field. These messages will be displayed when validation fails.
          </p>
        </div>
      </div>

      {validatableElements.length === 0 ? (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>No form elements</AlertTitle>
          <AlertDescription>
            Add form elements in the Design tab before configuring validation.
          </AlertDescription>
        </Alert>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Field Validation</CardTitle>
            <CardDescription>
              Configure validation messages for your form fields
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[500px]">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Field Label</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Required</TableHead>
                    <TableHead>Error Message</TableHead>
                    <TableHead className="w-[100px]">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {validatableElements.map((element) => (
                    <TableRow key={element.id}>
                      <TableCell className="font-medium">{element.label}</TableCell>
                      <TableCell>{getElementTypeLabel(element.type)}</TableCell>
                      <TableCell>
                        {element.required ? 
                          <Check className="h-5 w-5 text-green-500" /> : 
                          <X className="h-5 w-5 text-gray-400" />}
                      </TableCell>
                      <TableCell>
                        <Input 
                          value={validationMessages[element.id] || ''} 
                          onChange={(e) => handleValidationChange(element.id, e.target.value)}
                          placeholder={element.required ? "This field is required" : "Enter custom error message"}
                        />
                      </TableCell>
                      <TableCell>
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => handleApplyValidation(element.id)}
                        >
                          Apply
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </ScrollArea>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

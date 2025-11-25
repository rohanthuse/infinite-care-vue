
import React, { useState, useEffect } from 'react';
import { Form, FormElement, FormElementType } from '@/types/form-builder';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { AlertCircle, Check, X, Loader2 } from 'lucide-react';
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
  
  const [applyingForElement, setApplyingForElement] = useState<string | null>(null);
  
  // Track elements where current input matches saved value (persistent applied state)
  const [appliedElements, setAppliedElements] = useState<Set<string>>(() => {
    const initial = new Set<string>();
    form.elements.forEach(element => {
      // If element has a saved errorMessage, mark as applied
      if (element.errorMessage !== undefined && element.errorMessage !== '') {
        initial.add(element.id);
      }
    });
    return initial;
  });

  // Sync applied state when form prop changes (tab switch, refresh, external updates)
  useEffect(() => {
    const newAppliedElements = new Set<string>();
    const newValidationMessages: {[key: string]: string} = {};
    
    form.elements.forEach(element => {
      if (element.errorMessage) {
        newValidationMessages[element.id] = element.errorMessage;
      }
      
      const currentMessage = validationMessages[element.id] ?? '';
      const savedMessage = element.errorMessage ?? '';
      
      // If current input matches saved value, mark as applied
      if (currentMessage === savedMessage && savedMessage !== '') {
        newAppliedElements.add(element.id);
      } else if (currentMessage === '' && savedMessage === '') {
        // Both empty - check if it was previously applied with empty value
        // Don't mark as applied if both are empty (nothing to apply)
      }
    });
    
    setValidationMessages(prev => ({...prev, ...newValidationMessages}));
    setAppliedElements(newAppliedElements);
  }, [form.elements]);

  const handleValidationChange = (elementId: string, message: string) => {
    setValidationMessages(prev => ({
      ...prev,
      [elementId]: message
    }));
    
    // Find the element and check if the new message differs from the saved value
    const element = form.elements.find(el => el.id === elementId);
    const savedMessage = element?.errorMessage ?? '';
    
    if (message !== savedMessage) {
      // Value changed from saved, mark as not applied
      setAppliedElements(prev => {
        const newSet = new Set(prev);
        newSet.delete(elementId);
        return newSet;
      });
    } else if (message === savedMessage && savedMessage !== '') {
      // Value matches saved non-empty value, mark as applied
      setAppliedElements(prev => {
        const newSet = new Set(prev);
        newSet.add(elementId);
        return newSet;
      });
    }
  };

  const handleApplyValidation = (elementId: string) => {
    setApplyingForElement(elementId);
    
    onUpdateValidation(elementId, validationMessages[elementId] || '');
    
    // Show loading animation briefly, then permanently mark as applied
    setTimeout(() => {
      setApplyingForElement(null);
      // Permanently mark as applied (no more timeout to revert)
      setAppliedElements(prev => {
        const newSet = new Set(prev);
        newSet.add(elementId);
        return newSet;
      });
    }, 300);
  };

  // Filter out elements that don't need validation (like headings, paragraphs, etc.)
  const validatableElements = form.elements.filter(element => 
    !['heading', 'paragraph', 'divider'].includes(element.type)
  );
  
  const getElementTypeLabel = (type: string): string => {
    const typeMap: {[key: string]: string} = {
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
                  {validatableElements.map((element) => {
                    const isApplied = appliedElements.has(element.id);
                    const isApplying = applyingForElement === element.id;
                    
                    return (
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
                            variant={
                              isApplying 
                                ? "default" 
                                : isApplied 
                                  ? "success"
                                  : "outline"
                            }
                            onClick={() => handleApplyValidation(element.id)}
                            disabled={isApplying || isApplied}
                            className="relative transition-all duration-300"
                          >
                            {isApplying ? (
                              <>
                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                Applying...
                              </>
                            ) : isApplied ? (
                              <>
                                <Check className="h-4 w-4 mr-2" />
                                Applied
                              </>
                            ) : (
                              'Apply'
                            )}
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </ScrollArea>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

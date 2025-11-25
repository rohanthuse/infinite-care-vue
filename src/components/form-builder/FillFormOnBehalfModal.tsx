import React, { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useFormElements } from '@/hooks/useFormElements';
import { useFormSubmissions } from '@/hooks/useFormSubmissions';
import { useFormValidation } from '@/hooks/useFormValidation';
import { useFileUpload } from '@/hooks/useFileUpload';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Shield, Save, Send, AlertCircle, Loader2, Upload, X } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { FileUploadDropzone } from '@/components/agreements/FileUploadDropzone';
import { SignatureCanvas } from '@/components/ui/signature-canvas';
import type { FormElement } from '@/types/form-builder';

interface FillFormOnBehalfModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  formId: string;
  staffId: string;
  staffName: string;
  formTitle: string;
  branchId: string;
}

export const FillFormOnBehalfModal: React.FC<FillFormOnBehalfModalProps> = ({
  open,
  onOpenChange,
  formId,
  staffId,
  staffName,
  formTitle,
  branchId,
}) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  // Get form details
  const { data: currentForm, isLoading: isLoadingForm } = useQuery({
    queryKey: ['form-details', formId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('forms')
        .select('*')
        .eq('id', formId)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!formId && open
  });

  const { uiElements: elements, isLoading: isLoadingElements } = useFormElements(formId || '');
  const { createSubmission, isCreating } = useFormSubmissions(branchId, formId);
  const { validateFormData, validateRequiredFields } = useFormValidation();
  const { uploadFile, uploading } = useFileUpload();

  // Get form settings
  const formSettings = (currentForm?.settings as any) || {
    showProgressBar: false,
    allowSaveAsDraft: false,
    submitButtonText: 'Submit',
  };

  // Load existing submission for this staff member
  useEffect(() => {
    if (!staffId || !formId || !open) return;

    const loadExistingSubmission = async () => {
      const { data } = await supabase
        .from('form_submissions')
        .select('*')
        .eq('form_id', formId)
        .eq('submitted_by', staffId)
        .single();

      if (data) {
        setFormData((data.submission_data as Record<string, any>) || {});
      }
    };

    loadExistingSubmission();
  }, [staffId, formId, open]);

  // Reset form when modal closes
  useEffect(() => {
    if (!open) {
      setFormData({});
      setValidationErrors({});
    }
  }, [open]);

  // Calculate progress
  const calculateProgress = () => {
    const requiredElements = elements.filter(el => 
      el.required && !['heading', 'paragraph', 'divider', 'section'].includes(el.type)
    );
    if (requiredElements.length === 0) return 100;
    
    const filledCount = requiredElements.filter(el => {
      const value = formData[el.id];
      if (value === undefined || value === null || value === '') return false;
      if (Array.isArray(value) && value.length === 0) return false;
      return true;
    }).length;
    
    return Math.round((filledCount / requiredElements.length) * 100);
  };

  const handleInputChange = (elementId: string, value: any) => {
    setFormData(prev => ({ ...prev, [elementId]: value }));
    if (validationErrors[elementId]) {
      setValidationErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[elementId];
        return newErrors;
      });
    }
  };

  const handleSubmit = async (status: 'draft' | 'completed') => {
    if (!user?.id || !formId || !branchId) {
      toast({
        title: "Error",
        description: "Missing required information to submit form",
        variant: "destructive",
      });
      return;
    }

    // Validate for completed submissions
    if (status === 'completed') {
      const validation = validateFormData(elements, formData);
      
      if (!validation.isValid) {
        setValidationErrors(validation.errors);
        const missingFields = validateRequiredFields(elements, formData);
        
        if (missingFields.length > 0) {
          toast({
            title: "Validation Error",
            description: `Please fill in: ${missingFields.join(', ')}`,
            variant: "destructive",
          });
          return;
        }
        
        toast({
          title: "Validation Error",
          description: "Please correct the errors before submitting",
          variant: "destructive",
        });
        return;
      }
      
      setValidationErrors({});
    }

    try {
      createSubmission({
        form_id: formId,
        submitted_by: staffId,
        submitted_by_type: 'carer',
        submission_data: formData,
        status,
        submitted_on_behalf_of: staffId,
        submitted_by_admin: user.id,
        submission_type: 'admin_on_behalf' as const
      });

      toast({
        title: status === 'completed' ? "Form Submitted" : "Draft Saved",
        description: status === 'completed' 
          ? `Form submitted on behalf of ${staffName}` 
          : "Draft saved successfully",
      });

      // Invalidate queries to refresh the list
      queryClient.invalidateQueries({ queryKey: ['staff-assigned-forms'] });
      queryClient.invalidateQueries({ queryKey: ['form-submissions'] });

      // Close modal after brief delay
      setTimeout(() => {
        onOpenChange(false);
      }, 500);
    } catch (error) {
      console.error('Error submitting form:', error);
    }
  };

  const renderFormElement = (element: FormElement) => {
    const value = formData[element.id] || '';

    switch (element.type) {
      case 'text':
      case 'email':
      case 'tel':
        return (
          <div key={element.id} className="space-y-2">
            <Label htmlFor={element.id}>
              {element.label}
              {element.required && <span className="text-destructive ml-1">*</span>}
            </Label>
            <Input
              id={element.id}
              type={element.type}
              value={value}
              onChange={(e) => handleInputChange(element.id, e.target.value)}
              placeholder={(element as any).placeholder}
              required={element.required}
              className={validationErrors[element.id] ? 'border-destructive' : ''}
            />
            {validationErrors[element.id] && (
              <p className="text-sm text-destructive">{validationErrors[element.id]}</p>
            )}
          </div>
        );

      case 'textarea':
        return (
          <div key={element.id} className="space-y-2">
            <Label htmlFor={element.id}>
              {element.label}
              {element.required && <span className="text-destructive ml-1">*</span>}
            </Label>
            <Textarea
              id={element.id}
              value={value}
              onChange={(e) => handleInputChange(element.id, e.target.value)}
              placeholder={(element as any).placeholder}
              rows={(element as any).rows || 3}
              required={element.required}
              className={validationErrors[element.id] ? 'border-destructive' : ''}
            />
            {validationErrors[element.id] && (
              <p className="text-sm text-destructive">{validationErrors[element.id]}</p>
            )}
          </div>
        );

      case 'number':
        return (
          <div key={element.id} className="space-y-2">
            <Label htmlFor={element.id}>
              {element.label}
              {element.required && <span className="text-destructive ml-1">*</span>}
            </Label>
            <Input
              id={element.id}
              type="number"
              value={value}
              onChange={(e) => handleInputChange(element.id, Number(e.target.value))}
              placeholder={(element as any).placeholder}
              min={(element as any).min}
              max={(element as any).max}
              step={(element as any).step}
              required={element.required}
            />
          </div>
        );

      case 'date':
        return (
          <div key={element.id} className="space-y-2">
            <Label htmlFor={element.id}>
              {element.label}
              {element.required && <span className="text-destructive ml-1">*</span>}
            </Label>
            <Input
              id={element.id}
              type="date"
              value={value}
              onChange={(e) => handleInputChange(element.id, e.target.value)}
              min={(element as any).min}
              max={(element as any).max}
              required={element.required}
            />
          </div>
        );

      case 'time':
        return (
          <div key={element.id} className="space-y-2">
            <Label htmlFor={element.id}>
              {element.label}
              {element.required && <span className="text-destructive ml-1">*</span>}
            </Label>
            <Input
              id={element.id}
              type="time"
              value={value}
              onChange={(e) => handleInputChange(element.id, e.target.value)}
              required={element.required}
            />
          </div>
        );

      case 'checkbox':
        const checkboxElement = element as any;
        return (
          <div key={element.id} className="space-y-3">
            <Label>
              {element.label}
              {element.required && <span className="text-destructive ml-1">*</span>}
            </Label>
            <div className="space-y-2">
              {checkboxElement.options?.map((option: any) => (
                <div key={option.id} className="flex items-center space-x-2">
                  <Checkbox
                    id={`${element.id}-${option.id}`}
                    checked={(value || []).includes(option.value)}
                    onCheckedChange={(checked) => {
                      const currentValues = value || [];
                      if (checked) {
                        handleInputChange(element.id, [...currentValues, option.value]);
                      } else {
                        handleInputChange(element.id, currentValues.filter((v: string) => v !== option.value));
                      }
                    }}
                  />
                  <Label htmlFor={`${element.id}-${option.id}`}>{option.label}</Label>
                </div>
              ))}
            </div>
          </div>
        );

      case 'radio':
        const radioElement = element as any;
        return (
          <div key={element.id} className="space-y-3">
            <Label>
              {element.label}
              {element.required && <span className="text-destructive ml-1">*</span>}
            </Label>
            <RadioGroup
              value={value}
              onValueChange={(value) => handleInputChange(element.id, value)}
            >
              {radioElement.options?.map((option: any) => (
                <div key={option.id} className="flex items-center space-x-2">
                  <RadioGroupItem value={option.value} id={`${element.id}-${option.id}`} />
                  <Label htmlFor={`${element.id}-${option.id}`}>{option.label}</Label>
                </div>
              ))}
            </RadioGroup>
          </div>
        );

      case 'select':
        const selectElement = element as any;
        return (
          <div key={element.id} className="space-y-2">
            <Label htmlFor={element.id}>
              {element.label}
              {element.required && <span className="text-destructive ml-1">*</span>}
            </Label>
            <Select value={value} onValueChange={(value) => handleInputChange(element.id, value)}>
              <SelectTrigger>
                <SelectValue placeholder={selectElement.placeholder || "Select an option"} />
              </SelectTrigger>
              <SelectContent>
                {selectElement.options?.map((option: any) => (
                  <SelectItem key={option.id} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        );

      case 'heading':
        const headingElement = element as any;
        const HeadingTag = headingElement.headingLevel || 'h3';
        return (
          <HeadingTag key={element.id} className="text-lg font-semibold mt-6 mb-2">
            {headingElement.text || element.label}
          </HeadingTag>
        );

      case 'paragraph':
        const paragraphElement = element as any;
        return (
          <p key={element.id} className="text-muted-foreground mb-4">
            {paragraphElement.text || element.label}
          </p>
        );

      case 'divider':
        return <hr key={element.id} className="border-border my-6" />;

      case 'file':
        const fileElement = element as any;
        return (
          <div key={element.id} className="space-y-2">
            <Label>
              {element.label}
              {element.required && <span className="text-destructive ml-1">*</span>}
            </Label>
            <FileUploadDropzone
              category="document"
              onFilesSelected={async (files) => {
                if (files.length === 0) return;
                try {
                  const uploadedFiles = [];
                  for (const file of files) {
                    const result = await uploadFile(file, { category: 'attachment' });
                    uploadedFiles.push({
                      id: result.id,
                      name: result.file_name,
                      url: result.storage_path,
                      type: result.file_type,
                      size: result.file_size
                    });
                  }
                  handleInputChange(element.id, uploadedFiles);
                } catch (error) {
                  console.error('File upload error:', error);
                }
              }}
              acceptedFileTypes={fileElement.acceptedTypes || ['application/pdf', 'image/*']}
              maxFiles={fileElement.maxFiles || 5}
              disabled={uploading}
            />
            {value && Array.isArray(value) && value.length > 0 && (
              <div className="mt-2 space-y-1">
                {value.map((file: any, index: number) => (
                  <div key={index} className="text-sm text-muted-foreground flex items-center gap-2">
                    <Upload className="h-3 w-3" />
                    {file.name}
                  </div>
                ))}
              </div>
            )}
            {validationErrors[element.id] && (
              <p className="text-sm text-destructive">{validationErrors[element.id]}</p>
            )}
          </div>
        );

      case 'signature':
        return (
          <div key={element.id} className="space-y-2">
            <Label>
              {element.label}
              {element.required && <span className="text-destructive ml-1">*</span>}
            </Label>
            <div className="border border-input rounded-md p-4">
              <SignatureCanvas
                onSave={(signature) => handleInputChange(element.id, signature)}
                width={500}
                height={150}
                initialSignature={value}
              />
            </div>
            {validationErrors[element.id] && (
              <p className="text-sm text-destructive">{validationErrors[element.id]}</p>
            )}
          </div>
        );

      default:
        return (
          <div key={element.id} className="space-y-2">
            <Label>{element.label} (Unsupported: {element.type})</Label>
          </div>
        );
    }
  };

  const isLoading = isLoadingForm || isLoadingElements;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col p-0 overflow-hidden">
        <DialogHeader className="px-6 pt-6 pb-4 border-b">
          <DialogTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-primary" />
            Fill Form on Behalf
          </DialogTitle>
          <DialogDescription>
            Filling out "{formTitle}" for <strong>{staffName}</strong>
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <span className="ml-2">Loading form...</span>
          </div>
        ) : (
          <ScrollArea className="flex-1 min-h-0 h-0 px-6">
            <div className="py-4 space-y-6">
              {/* Proxy banner */}
              <Alert className="bg-orange-50 border-orange-200">
                <AlertCircle className="h-4 w-4 text-orange-600" />
                <AlertDescription className="text-orange-800">
                  You are submitting this form on behalf of <strong>{staffName}</strong>. 
                  The submission will be recorded under their name.
                </AlertDescription>
              </Alert>

              {/* Progress bar */}
              {formSettings.showProgressBar && (
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Progress</span>
                    <span className="font-medium">{calculateProgress()}%</span>
                  </div>
                  <Progress value={calculateProgress()} className="h-2" />
                </div>
              )}

              {/* Form description */}
              {currentForm?.description && (
                <p className="text-muted-foreground">{currentForm.description}</p>
              )}

              {/* Form elements */}
              <div className="space-y-6">
                {elements.map(renderFormElement)}
              </div>
            </div>
          </ScrollArea>
        )}

        {/* Footer actions */}
        {!isLoading && (
          <div className="px-6 py-4 border-t bg-muted/30 flex justify-end gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isCreating}
            >
              Cancel
            </Button>
            {formSettings.allowSaveAsDraft && (
              <Button
                type="button"
                variant="outline"
                onClick={() => handleSubmit('draft')}
                disabled={isCreating}
              >
                <Save className="h-4 w-4 mr-2" />
                Save as Draft
              </Button>
            )}
            <Button
              type="button"
              onClick={() => handleSubmit('completed')}
              disabled={isCreating}
            >
              {isCreating ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Send className="h-4 w-4 mr-2" />
              )}
              {formSettings.submitButtonText || 'Submit Form'}
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

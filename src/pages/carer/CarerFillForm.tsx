import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useFormElements } from '@/hooks/useFormElements';
import { useFormSubmissions } from '@/hooks/useFormSubmissions';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, Save, Send } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { useCarerNavigation } from '@/hooks/useCarerNavigation';
import type { FormElement } from '@/types/form-builder';

const CarerFillForm = () => {
  const { formId } = useParams<{ formId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { navigateToCarerPage } = useCarerNavigation();
  
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [isDraft, setIsDraft] = useState(false);

  // Get the form details
  const { data: currentForm, isLoading: isLoadingForm } = useQuery({
    queryKey: ['form-details', formId],
    queryFn: async () => {
      if (!formId) return null;
      
      const { data, error } = await supabase
        .from('forms')
        .select('*')
        .eq('id', formId)
        .single();
        
      if (error) throw error;
      return data;
    },
    enabled: !!formId
  });

  const branchId = currentForm?.branch_id || '';

  const { uiElements: elements, isLoading: isLoadingElements } = useFormElements(formId || '');
  const { createSubmission, isCreating } = useFormSubmissions(branchId, formId);

  const handleInputChange = (elementId: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [elementId]: value
    }));
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

    try {
      await createSubmission({
        form_id: formId,
        submitted_by: user.id,
        submitted_by_type: 'carer',
        submission_data: formData,
        status
      });

      toast({
        title: "Success",
        description: status === 'draft' ? "Form saved as draft" : "Form submitted successfully",
      });

      navigateToCarerPage('/forms');
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
            />
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
            />
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

      default:
        return (
          <div key={element.id} className="space-y-2">
            <Label>{element.label} (Unsupported element type: {element.type})</Label>
          </div>
        );
    }
  };

  if (isLoadingElements || isLoadingForm) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!currentForm) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <h3 className="text-lg font-semibold mb-2">Form Not Found</h3>
          <p className="text-muted-foreground mb-4">The requested form could not be found.</p>
          <Button onClick={() => navigateToCarerPage('/forms')} variant="outline">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Forms
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={() => navigateToCarerPage('/forms')}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Forms
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{currentForm.title}</CardTitle>
          {currentForm.description && (
            <CardDescription>{currentForm.description}</CardDescription>
          )}
        </CardHeader>
        <CardContent>
          <form className="space-y-6">
            {elements.map(renderFormElement)}
            
            <div className="flex gap-3 pt-6 border-t">
              <Button
                type="button"
                variant="outline"
                onClick={() => handleSubmit('draft')}
                disabled={isCreating}
              >
                <Save className="h-4 w-4 mr-2" />
                Save as Draft
              </Button>
              <Button
                type="button"
                onClick={() => handleSubmit('completed')}
                disabled={isCreating}
              >
                <Send className="h-4 w-4 mr-2" />
                Submit Form
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default CarerFillForm;
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useUserRole } from '@/hooks/useUserRole';
import { useFormElements } from '@/hooks/useFormElements';
import { useFormSubmissions } from '@/hooks/useFormSubmissions';
import { useFormValidation } from '@/hooks/useFormValidation';
import { useFormAutoSave } from '@/hooks/useFormAutoSave';
import { useFileUpload } from '@/hooks/useFileUpload';
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
import { ArrowLeft, Save, Send, FileText, AlertCircle, Clock, CheckCircle, Upload } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { useCarerNavigation } from '@/hooks/useCarerNavigation';
import { useTenant } from '@/contexts/TenantContext';
import { FileUploadDropzone } from '@/components/agreements/FileUploadDropzone';
import { SignatureCanvas } from '@/components/ui/signature-canvas';
import type { FormElement } from '@/types/form-builder';
import { format } from 'date-fns';

const CarerFillForm = () => {
  const { formId, branchId: urlBranchId, branchName: urlBranchName } = useParams<{ 
    formId: string;
    branchId?: string; 
    branchName?: string; 
  }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const { data: userRoleData } = useUserRole();
  const { navigateToCarerPage } = useCarerNavigation();
  const { tenantSlug } = useTenant();
  
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [existingSubmission, setExistingSubmission] = useState<any>(null);

  // Get form data from navigation state if available
  const passedFormData = location.state?.formData;
  
  // Check if submitting on behalf of someone
  const searchParams = new URLSearchParams(location.search);
  // Support both parameter names for backwards compatibility
  const onBehalfOfUserId = searchParams.get('proxyFor') || searchParams.get('onBehalfOf');
  const staffName = searchParams.get('proxyName') || searchParams.get('staffName');
  const returnTo = searchParams.get('returnTo');
  const isProxySubmission = !!onBehalfOfUserId;

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

  // Smart navigation handler - role-aware back navigation
  const handleBackNavigation = () => {
    const currentUserRole = userRoleData?.role;
    
    // SUPER ADMIN / BRANCH ADMIN: Go back to tenant dashboard
    if (currentUserRole === 'super_admin' || currentUserRole === 'branch_admin') {
      const tenantDashboardPath = tenantSlug
        ? `/${tenantSlug}/dashboard`
        : '/dashboard';
      
      console.log('[CarerFillForm] Super admin/branch admin navigating back to tenant dashboard:', tenantDashboardPath);
      navigate(tenantDashboardPath);
      return;
    }
    
    // CARER: Navigate back to their forms page
    if (currentUserRole === 'carer') {
      console.log('[CarerFillForm] Carer navigating back to carer forms page');
      navigateToCarerPage('/forms');
      return;
    }
    
    // FALLBACK: If role is unknown, try to use returnTo parameter with branch dashboard
    if (returnTo && urlBranchId && urlBranchName) {
      const branchBasePath = tenantSlug
        ? `/${tenantSlug}/branch-dashboard/${urlBranchId}/${urlBranchName}`
        : `/branch-dashboard/${urlBranchId}/${urlBranchName}`;
      
      const backPath = `${branchBasePath}/${returnTo}`;
      console.log('[CarerFillForm] Fallback navigation to:', backPath);
      navigate(backPath);
      return;
    }
    
    // ULTIMATE FALLBACK: Go to carer forms page
    console.warn('[CarerFillForm] No role detected, using fallback navigation to carer forms');
    navigateToCarerPage('/forms');
  };

  const { uiElements: elements, isLoading: isLoadingElements, error: elementsError } = useFormElements(formId || '');
  const { createSubmission, isCreating } = useFormSubmissions(branchId, formId);
  const { validateFormData, validateRequiredFields } = useFormValidation();
  const { uploadFile, uploading } = useFileUpload();

  // Auto-save functionality
  const { autoSave, markAsChanged, hasUnsavedChanges, lastSaveTime } = useFormAutoSave({
    onSave: async (data, isDraft) => {
      if (!user?.id || !formId || !branchId) return;
      
      await new Promise((resolve, reject) => {
        createSubmission({
          form_id: formId,
          submitted_by: user.id,
          submitted_by_type: 'carer',
          submission_data: data,
          status: 'draft'
        });
        // Note: This is a simplified approach - in real implementation, 
        // you'd want to properly handle the promise resolution
        setTimeout(resolve, 1000);
      });
    },
    enabled: true
  });

  // Load existing submission data
  useEffect(() => {
    const loadExistingSubmission = async () => {
      if (!user?.id || !formId || !branchId) return;

      const { data } = await supabase
        .from('form_submissions')
        .select('*')
        .eq('form_id', formId)
        .eq('submitted_by', user.id)
        .single();

      if (data) {
        setExistingSubmission(data);
        setFormData((data.submission_data as Record<string, any>) || {});
      }
    };

    loadExistingSubmission();
  }, [user?.id, formId, branchId]);

  // Auto-save trigger
  useEffect(() => {
    if (hasUnsavedChanges && Object.keys(formData).length > 0) {
      const timer = setTimeout(() => {
        autoSave(formData);
      }, 30000); // 30 seconds

      return () => clearTimeout(timer);
    }
  }, [formData, hasUnsavedChanges, autoSave]);

  console.log('CarerFillForm - Form ID:', formId);
  console.log('CarerFillForm - Current Form:', currentForm);
  console.log('CarerFillForm - Elements:', elements);
  console.log('CarerFillForm - Passed Form Data:', passedFormData);

  const handleInputChange = (elementId: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [elementId]: value
    }));
    markAsChanged();
    
    // Clear validation error for this field
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

    // Validate form data for completed submissions
    if (status === 'completed') {
      const validation = validateFormData(elements, formData);
      
      if (!validation.isValid) {
        setValidationErrors(validation.errors);
        const missingFields = validateRequiredFields(elements, formData);
        
        if (missingFields.length > 0) {
          toast({
            title: "Validation Error",
            description: `Please fill in the following required fields: ${missingFields.join(', ')}`,
            variant: "destructive",
          });
          return;
        }
        
        toast({
          title: "Validation Error",
          description: "Please correct the errors in the form before submitting",
          variant: "destructive",
        });
        return;
      }
      
      setValidationErrors({});
    }

    try {
      createSubmission({
        form_id: formId,
        submitted_by: isProxySubmission ? onBehalfOfUserId : user.id,
        submitted_by_type: 'carer',
        submission_data: formData,
        status,
        // Proxy submission metadata
        ...(isProxySubmission && {
          submitted_on_behalf_of: onBehalfOfUserId,
          submitted_by_admin: user.id,
          submission_type: 'admin_on_behalf' as const
        })
      });

      // Don't navigate immediately, let the mutation handle success
      if (status === 'completed') {
        setTimeout(() => handleBackNavigation(), 1000);
      }
    } catch (error) {
      console.error('Error submitting form:', error);
    }
  };

  const handleSaveDraft = () => handleSubmit('draft');

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
              <p className="text-sm text-destructive mt-1">{validationErrors[element.id]}</p>
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
              <p className="text-sm text-destructive mt-1">{validationErrors[element.id]}</p>
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
                    const result = await uploadFile(file, {
                      category: 'attachment'
                    });
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
              acceptedFileTypes={fileElement.acceptedTypes || ['application/pdf', 'image/*', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']}
              maxFiles={fileElement.maxFiles || 5}
              disabled={uploading}
            />
            {value && Array.isArray(value) && value.length > 0 && (
              <div className="mt-2 space-y-1">
                {value.map((file: any, index: number) => (
                  <div key={index} className="text-sm text-muted-foreground flex items-center gap-2">
                    <Upload className="h-3 w-3" />
                    {file.name} ({(file.size / 1024 / 1024).toFixed(2)} MB)
                  </div>
                ))}
              </div>
            )}
            {validationErrors[element.id] && (
              <p className="text-sm text-destructive mt-1">{validationErrors[element.id]}</p>
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
                width={600}
                height={200}
                initialSignature={value}
              />
            </div>
            {validationErrors[element.id] && (
              <p className="text-sm text-destructive mt-1">{validationErrors[element.id]}</p>
            )}
          </div>
        );

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

  if (!currentForm && !passedFormData) {
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

  // Use passed form data if available, otherwise use fetched form data
  const displayForm = currentForm || passedFormData;

  // Show error state if no form elements are found
  if (!isLoadingElements && elements.length === 0 && !elementsError) {
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
            <CardTitle>{displayForm?.title}</CardTitle>
            {displayForm?.description && (
              <CardDescription>{displayForm?.description}</CardDescription>
            )}
          </CardHeader>
          <CardContent>
            <div className="text-center py-12">
              <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Form Elements Not Found</h3>
              <p className="text-muted-foreground mb-4">
                This form doesn't have any form elements configured yet. Please contact your administrator.
              </p>
              <Button onClick={() => navigateToCarerPage('/forms')} variant="outline">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Forms
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Show error state if there was an error loading elements
  if (elementsError) {
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
            <CardTitle>{displayForm?.title}</CardTitle>
            {displayForm?.description && (
              <CardDescription>{displayForm?.description}</CardDescription>
            )}
          </CardHeader>
          <CardContent>
            <div className="text-center py-12">
              <AlertCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Error Loading Form</h3>
              <p className="text-muted-foreground mb-4">
                There was an error loading the form elements. Please try again later.
              </p>
              <Button onClick={handleBackNavigation} variant="outline">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Forms
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={handleBackNavigation}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Forms
        </Button>
      </div>

      {/* Proxy submission banner */}
      {isProxySubmission && (
        <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
          <div className="flex items-center gap-2 text-orange-900">
            <AlertCircle className="h-5 w-5" />
            <div>
              <p className="font-semibold">Submitting on Behalf of Staff Member</p>
              <p className="text-sm">You are filling this form for: {staffName || 'Staff Member'}</p>
            </div>
          </div>
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>{displayForm?.title}</CardTitle>
          {displayForm?.description && (
            <CardDescription>{displayForm?.description}</CardDescription>
          )}
        </CardHeader>
        <CardContent>
          <form className="space-y-6">
            {elements.map(renderFormElement)}
            
            <div className="space-y-4 pt-6 border-t">
              {/* Auto-save status */}
              {hasUnsavedChanges && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Clock className="h-4 w-4" />
                  <span>You have unsaved changes</span>
                </div>
              )}
              
              {lastSaveTime && !hasUnsavedChanges && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <CheckCircle className="h-4 w-4" />
                  <span>Auto-saved at {format(lastSaveTime, 'HH:mm')}</span>
                </div>
              )}

              {existingSubmission && (
                <div className="p-3 bg-muted rounded-lg">
                  <p className="text-sm text-muted-foreground">
                    <strong>Status:</strong> {existingSubmission.status.replace('_', ' ').toUpperCase()}
                    {existingSubmission.submitted_at && (
                      <span className="ml-2">
                        • Submitted {format(new Date(existingSubmission.submitted_at), 'PPP')}
                      </span>
                    )}
                  </p>
                </div>
              )}
              
              <div className="flex gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleSaveDraft}
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
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default CarerFillForm;
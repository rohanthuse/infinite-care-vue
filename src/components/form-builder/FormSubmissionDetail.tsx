import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useFormSubmissions, FormSubmission } from '@/hooks/useFormSubmissions';
import { useFormElements } from '@/hooks/useFormElements';
import { useFileUpload } from '@/hooks/useFileUpload';
import { useToast } from '@/hooks/use-toast';
import { useUserRoleCheck } from '@/hooks/useUserRoleCheck';
import { useFormManagement } from '@/hooks/useFormManagement';
import { format } from 'date-fns';
import { 
  User, 
  Calendar, 
  FileText, 
  MessageSquare, 
  CheckCircle, 
  XCircle, 
  Clock,
  Save,
  Download,
  Eye,
  Image as ImageIcon,
  AlertCircle
} from 'lucide-react';

interface FormSubmissionDetailProps {
  submission: FormSubmission;
  branchId: string;
  formId?: string;
  allowManageReviews?: boolean;
}

const getStatusColor = (status: string) => {
  switch (status) {
    case 'completed':
      return 'bg-green-100 text-green-800 border-green-200';
    case 'draft':
      return 'bg-gray-100 text-gray-800 border-gray-200';
    case 'under_review':
      return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    case 'approved':
      return 'bg-blue-100 text-blue-800 border-blue-200';
    case 'rejected':
      return 'bg-red-100 text-red-800 border-red-200';
    default:
      return 'bg-gray-100 text-gray-800 border-gray-200';
  }
};

const getSubmitterTypeColor = (type: string) => {
  switch (type) {
    case 'client':
      return 'bg-purple-100 text-purple-800 border-purple-200';
    case 'staff':
    case 'carer':
      return 'bg-green-100 text-green-800 border-green-200';
    default:
      return 'bg-gray-100 text-gray-800 border-gray-200';
  }
};

export const FormSubmissionDetail: React.FC<FormSubmissionDetailProps> = ({ 
  submission, 
  branchId,
  formId,
  allowManageReviews = true
}) => {
  const { toast } = useToast();
  const { updateSubmission, isUpdating } = useFormSubmissions(branchId);
  const { uiElements: formElements, isLoading: elementsLoading } = useFormElements(formId || submission.form_id);
  const { getFileUrl } = useFileUpload();
  const { data: userRoles } = useUserRoleCheck();
  const { forms } = useFormManagement(branchId);
  
  const [newStatus, setNewStatus] = useState<'completed' | 'draft' | 'under_review' | 'approved' | 'rejected'>(submission.status);
  const [reviewNotes, setReviewNotes] = useState(submission.review_notes || '');
  const [hasChanges, setHasChanges] = useState(false);

  const handleStatusChange = (status: string) => {
    const validStatus = status as 'completed' | 'draft' | 'under_review' | 'approved' | 'rejected';
    setNewStatus(validStatus);
    setHasChanges(validStatus !== submission.status || reviewNotes !== (submission.review_notes || ''));
  };

  const handleNotesChange = (notes: string) => {
    setReviewNotes(notes);
    setHasChanges(newStatus !== submission.status || notes !== (submission.review_notes || ''));
  };

  const handleSaveChanges = async () => {
    try {
      const updates: Partial<FormSubmission> = {
        status: newStatus as any,
        review_notes: reviewNotes.trim() || null,
      };

      // Add review timestamp and reviewer only when status changes to approved or rejected
      if (newStatus !== submission.status && ['approved', 'rejected'].includes(newStatus)) {
        updates.reviewed_at = new Date().toISOString();
        updates.reviewed_by = userRoles?.userId;
      }

      await updateSubmission({
        submissionId: submission.id,
        updates
      });

      setHasChanges(false);
      
      toast({
        title: 'Submission Updated',
        description: 'The submission status and notes have been updated successfully.',
      });
    } catch (error) {
      toast({
        title: 'Update Failed',
        description: 'Failed to update submission. Please try again.',
        variant: 'destructive',
      });
    }
  };

  const renderFieldValue = (key: string, value: any, elementType?: string) => {
    if (value === null || value === undefined || value === '') {
      return <span className="text-muted-foreground italic">No response</span>;
    }

    // Handle signature fields (base64 image data)
    if (elementType === 'signature' || (typeof value === 'string' && value.startsWith('data:image/'))) {
      return (
        <div className="space-y-2">
          <div className="border rounded-lg p-2 bg-gray-50 max-w-md">
            <img 
              src={value} 
              alt="Signature" 
              className="max-w-full h-auto rounded"
              style={{ maxHeight: '200px' }}
            />
          </div>
          <p className="text-xs text-muted-foreground">Digital signature</p>
        </div>
      );
    }

    // Handle file uploads
    if (elementType === 'file' || (typeof value === 'object' && value && (value.id || value.file_name || value.storage_path))) {
      if (Array.isArray(value)) {
        return (
          <div className="space-y-2">
            {value.map((file, index) => renderSingleFile(file, index))}
          </div>
        );
      } else {
        return renderSingleFile(value, 0);
      }
    }

    if (typeof value === 'boolean') {
      return (
        <Badge variant={value ? 'default' : 'secondary'}>
          {value ? 'Yes' : 'No'}
        </Badge>
      );
    }

    if (Array.isArray(value)) {
      // Check if it's an array of files
      if (value.length > 0 && typeof value[0] === 'object' && (value[0].id || value[0].file_name)) {
        return (
          <div className="space-y-2">
            {value.map((file, index) => renderSingleFile(file, index))}
          </div>
        );
      }
      
      return (
        <div className="flex flex-wrap gap-1">
          {value.map((item, index) => (
            <Badge key={index} variant="outline">
              {String(item)}
            </Badge>
          ))}
        </div>
      );
    }

    if (typeof value === 'object') {
      return (
        <pre className="text-sm bg-muted p-2 rounded">
          {JSON.stringify(value, null, 2)}
        </pre>
      );
    }

    // For long text, show in a text area style
    if (typeof value === 'string' && value.length > 100) {
      return (
        <div className="bg-muted p-3 rounded text-sm whitespace-pre-wrap">
          {value}
        </div>
      );
    }

    return <span>{String(value)}</span>;
  };

  const renderSingleFile = (file: any, index: number) => {
    if (!file) return null;

    const fileName = file.file_name || file.name || `File ${index + 1}`;
    const fileUrl = file.storage_path ? getFileUrl(file.storage_path) : file.url;
    const isImage = fileName.toLowerCase().match(/\.(jpg|jpeg|png|gif|webp)$/);

    return (
      <div key={index} className="border rounded-lg p-3 bg-gray-50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {isImage ? (
              <ImageIcon className="h-4 w-4 text-blue-500" />
            ) : (
              <FileText className="h-4 w-4 text-gray-500" />
            )}
            <span className="text-sm font-medium">{fileName}</span>
          </div>
          
          {fileUrl && (
            <div className="flex gap-1">
              {isImage && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => window.open(fileUrl, '_blank')}
                >
                  <Eye className="h-3 w-3" />
                </Button>
              )}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  const link = document.createElement('a');
                  link.href = fileUrl;
                  link.download = fileName;
                  link.click();
                }}
              >
                <Download className="h-3 w-3" />
              </Button>
            </div>
          )}
        </div>
        
        {isImage && fileUrl && (
          <div className="mt-2">
            <img 
              src={fileUrl} 
              alt={fileName}
              className="max-w-full h-auto rounded max-h-32 object-cover"
            />
          </div>
        )}
        
        {file.file_size && (
          <p className="text-xs text-muted-foreground mt-1">
            Size: {(file.file_size / 1024).toFixed(1)} KB
          </p>
        )}
      </div>
    );
  };

  // Create a map of form element IDs to their labels and types
  const elementMap = formElements?.reduce((acc, element) => {
    acc[element.id] = {
      label: element.label,
      type: element.type,
      order: element.order
    };
    return acc;
  }, {} as Record<string, { label: string; type: string; order: number }>) || {};

  // Sort submission data by form element order, then alphabetically for unmapped fields
  const sortedSubmissionEntries = Object.entries(submission.submission_data).sort(([keyA], [keyB]) => {
    const elementA = elementMap[keyA];
    const elementB = elementMap[keyB];
    
    // If both have form elements, sort by order
    if (elementA && elementB) {
      return elementA.order - elementB.order;
    }
    
    // Form elements come first
    if (elementA && !elementB) return -1;
    if (!elementA && elementB) return 1;
    
    // Alphabetical for unmapped fields
    return keyA.localeCompare(keyB);
  });

  // Get current form details
  const currentForm = forms?.find(f => f.id === (formId || submission.form_id));
  
  // Determine if the review section should be visible
  const shouldShowReviewSection = allowManageReviews ? 
    (userRoles?.isSuperAdmin || userRoles?.isBranchAdmin) : 
    true; // Always show for view-only mode
  
  // Determine if the review controls should be disabled
  const isReviewDisabled = !userRoles?.isSuperAdmin && !userRoles?.isBranchAdmin && ['approved', 'rejected'].includes(submission.status);

  return (
    <div className="space-y-6">
      {/* Submission Overview */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Submission Overview
            </CardTitle>
            <div className="flex items-center gap-2">
              <Badge className={getStatusColor(submission.status)}>
                {submission.status.replace('_', ' ')}
              </Badge>
              <Badge className={getSubmitterTypeColor(submission.submitted_by_type)}>
                {submission.submitted_by_type}
              </Badge>
              {submission.submission_type === 'admin_on_behalf' && (
                <Badge className="bg-orange-100 text-orange-800 border-orange-200">
                  Submitted by Admin
                </Badge>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Show proxy submission info if applicable */}
          {submission.submission_type === 'admin_on_behalf' && (
            <div className="mb-4 p-3 bg-orange-50 border border-orange-200 rounded-lg">
              <div className="flex items-start gap-2">
                <AlertCircle className="h-4 w-4 text-orange-600 mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-orange-900">
                    This form was submitted by an administrator on behalf of the staff member
                  </p>
                  {submission.submitted_by_admin && (
                    <p className="text-xs text-orange-700 mt-1">
                      Admin ID: {submission.submitted_by_admin}
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center gap-2">
              <User className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">
                  {submission.submission_type === 'admin_on_behalf' ? 'Submitted for' : 'Submitted by'}
                </p>
                <p className="font-medium">{submission.submitter_name || `#${submission.id.slice(-8)}`}</p>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">Submitted at</p>
                <p className="font-medium">
                  {format(new Date(submission.submitted_at), 'MMM dd, yyyy HH:mm')}
                </p>
              </div>
            </div>

            {submission.reviewed_at && (
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Reviewed at</p>
                  <p className="font-medium">
                    {format(new Date(submission.reviewed_at), 'MMM dd, yyyy HH:mm')}
                  </p>
                  {submission.reviewed_by && (
                    <p className="text-xs text-muted-foreground">
                      Reviewed by: {submission.reviewed_by}
                    </p>
                  )}
                </div>
              </div>
            )}

            <div className="flex items-center gap-2">
              <FileText className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">Submission ID</p>
                <p className="font-medium font-mono text-xs">
                  {submission.id}
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Form Data */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            Form Data
          </CardTitle>
          <CardDescription>
            The data submitted by the user
          </CardDescription>
        </CardHeader>
        <CardContent>
          {elementsLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary" />
              <span className="ml-2 text-muted-foreground">Loading form structure...</span>
            </div>
          ) : Object.keys(submission.submission_data).length === 0 ? (
            <p className="text-muted-foreground italic text-center py-8">
              No form data submitted
            </p>
          ) : (
            <div className="space-y-4">
              {sortedSubmissionEntries.map(([key, value]) => {
                const element = elementMap[key];
                const displayLabel = element?.label || key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
                
                // Check if key looks like a UUID and element is a simple input type
                const isUuidKey = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(key);
                const isSimpleInput = element?.type && ['text', 'textarea', 'number', 'email', 'url'].includes(element.type);
                
                // For simple inputs with UUID keys, just show the value without label
                if (isUuidKey && isSimpleInput) {
                  return (
                    <div key={key} className="border-b pb-3 last:border-b-0">
                      <div className="pl-0">
                        {renderFieldValue(key, value, element?.type)}
                      </div>
                    </div>
                  );
                }
                
                return (
                  <div key={key} className="border-b pb-3 last:border-b-0">
                    <div className="flex flex-col gap-2">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium text-muted-foreground">
                          {displayLabel}
                        </p>
                        {element?.type && (
                          <Badge variant="outline" className="text-xs">
                            {element.type}
                          </Badge>
                        )}
                      </div>
                      <div className="pl-2">
                        {renderFieldValue(key, value, element?.type)}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Review & Status Management - Conditional visibility */}
      {shouldShowReviewSection && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5" />
              {allowManageReviews ? 'Review & Status Management' : 'Review Status'}
            </CardTitle>
            <CardDescription>
              {allowManageReviews ? (
                currentForm?.requires_review 
                  ? "This form requires review. Update the submission status and add review notes."
                  : "Update the submission status and add review notes."
              ) : (
                "Current review status and notes for this submission."
              )}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {allowManageReviews ? (
              <>
                {isReviewDisabled && (
                  <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <p className="text-sm text-blue-800">
                      This submission has been {submission.status} and cannot be modified by non-admin users.
                    </p>
                  </div>
                )}
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium mb-2 block">
                      Status
                    </label>
                    <Select 
                      value={newStatus} 
                      onValueChange={handleStatusChange}
                      disabled={isReviewDisabled}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="completed">Completed</SelectItem>
                        <SelectItem value="under_review">Under Review</SelectItem>
                        <SelectItem value="approved">Approved</SelectItem>
                        <SelectItem value="rejected">Rejected</SelectItem>
                        <SelectItem value="draft">Draft</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  {currentForm?.requires_review && (
                    <div className="flex items-center">
                      <Badge variant="outline" className="bg-blue-50 text-blue-600 border-blue-200">
                        Review Required
                      </Badge>
                    </div>
                  )}
                </div>

                <div>
                  <label className="text-sm font-medium mb-2 block">
                    Review Notes
                  </label>
                  <Textarea
                    placeholder="Add notes about this submission..."
                    value={reviewNotes}
                    onChange={(e) => handleNotesChange(e.target.value)}
                    rows={4}
                    className="resize-none"
                    disabled={isReviewDisabled}
                  />
                </div>

                {hasChanges && !isReviewDisabled && (
                  <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                    <p className="text-sm text-muted-foreground">
                      You have unsaved changes
                    </p>
                    <Button 
                      onClick={handleSaveChanges}
                      disabled={isUpdating}
                      size="sm"
                    >
                      {isUpdating ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                          Saving...
                        </>
                      ) : (
                        <>
                          <Save className="h-4 w-4 mr-2" />
                          Save Changes
                        </>
                      )}
                    </Button>
                  </div>
                )}

                {submission.review_notes && !hasChanges && (
                  <div className="p-3 bg-muted rounded-lg">
                    <p className="text-sm font-medium mb-1">Current Review Notes:</p>
                    <p className="text-sm text-muted-foreground">
                      {submission.review_notes}
                    </p>
                  </div>
                )}
              </>
            ) : (
              // Read-only view for clients/carers
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium mb-2">Current Status</p>
                    <Badge className={getStatusColor(submission.status)}>
                      {submission.status.replace('_', ' ')}
                    </Badge>
                  </div>
                  
                  {currentForm?.requires_review && (
                    <div>
                      <p className="text-sm font-medium mb-2">Review Requirement</p>
                      <Badge variant="outline" className="bg-blue-50 text-blue-600 border-blue-200">
                        Review Required
                      </Badge>
                    </div>
                  )}
                </div>

                {submission.review_notes && (
                  <div>
                    <p className="text-sm font-medium mb-2">Review Notes</p>
                    <div className="p-3 bg-muted rounded-lg">
                      <p className="text-sm text-muted-foreground">
                        {submission.review_notes}
                      </p>
                    </div>
                  </div>
                )}

                {!submission.review_notes && (
                  <div className="p-3 bg-muted/50 rounded-lg">
                    <p className="text-sm text-muted-foreground italic">
                      No review notes available yet.
                    </p>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
};
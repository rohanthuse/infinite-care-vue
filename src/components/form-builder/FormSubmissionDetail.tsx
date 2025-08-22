import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useFormSubmissions, FormSubmission } from '@/hooks/useFormSubmissions';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { 
  User, 
  Calendar, 
  FileText, 
  MessageSquare, 
  CheckCircle, 
  XCircle, 
  Clock,
  Save
} from 'lucide-react';

interface FormSubmissionDetailProps {
  submission: FormSubmission;
  branchId: string;
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
  branchId 
}) => {
  const { toast } = useToast();
  const { updateSubmission, isUpdating } = useFormSubmissions(branchId);
  
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

      // Add review timestamp if status is changing to reviewed states
      if (newStatus !== submission.status && ['approved', 'rejected', 'under_review'].includes(newStatus)) {
        updates.reviewed_at = new Date().toISOString();
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

  const renderFieldValue = (key: string, value: any) => {
    if (value === null || value === undefined || value === '') {
      return <span className="text-muted-foreground italic">No response</span>;
    }

    if (typeof value === 'boolean') {
      return (
        <Badge variant={value ? 'default' : 'secondary'}>
          {value ? 'Yes' : 'No'}
        </Badge>
      );
    }

    if (Array.isArray(value)) {
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
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center gap-2">
              <User className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">Submitted by</p>
                <p className="font-medium">{submission.submitter_name || `Unknown user (${submission.submitted_by.slice(-8)})`}</p>
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
          {Object.keys(submission.submission_data).length === 0 ? (
            <p className="text-muted-foreground italic text-center py-8">
              No form data submitted
            </p>
          ) : (
            <div className="space-y-4">
              {Object.entries(submission.submission_data).map(([key, value]) => (
                <div key={key} className="border-b pb-3 last:border-b-0">
                  <div className="flex flex-col gap-2">
                    <p className="text-sm font-medium text-muted-foreground">
                      {key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                    </p>
                    <div className="pl-2">
                      {renderFieldValue(key, value)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Review & Status Management */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5" />
            Review & Status Management
          </CardTitle>
          <CardDescription>
            Update the submission status and add review notes
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium mb-2 block">
                Status
              </label>
              <Select value={newStatus} onValueChange={handleStatusChange}>
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
            />
          </div>

          {hasChanges && (
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
        </CardContent>
      </Card>
    </div>
  );
};
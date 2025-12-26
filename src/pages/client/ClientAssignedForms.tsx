import React, { useState } from 'react';
import { useSimpleClientAuth } from '@/hooks/useSimpleClientAuth';
import { useMyAssignedForms } from '@/hooks/useMyAssignedForms';
import { useClientNavigation } from '@/hooks/useClientNavigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { FileText, Calendar, CheckCircle, Clock, AlertCircle } from 'lucide-react';
import { format } from 'date-fns';
import { supabase } from '@/integrations/supabase/client';
import { FormSubmissionDetail } from '@/components/form-builder/FormSubmissionDetail';
import { useToast } from '@/hooks/use-toast';

const ClientAssignedForms = () => {
  const { data: authData } = useSimpleClientAuth();
  const authUserId = authData?.user?.id;
  const { navigateToClientPage } = useClientNavigation();
  const { toast } = useToast();
  
  const { data: assignedForms, isLoading, error } = useMyAssignedForms(
    authUserId || '', 
    'client'
  );

  // State for submission details dialog
  const [selectedSubmission, setSelectedSubmission] = useState(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [loadingByFormId, setLoadingByFormId] = useState({});

  // Function to fetch and view submission details
  const viewSubmission = async (formId) => {
    if (!authUserId) return;
    
    setLoadingByFormId(prev => ({ ...prev, [formId]: true }));
    try {
      const { data: submission, error } = await supabase
        .from('form_submissions')
        .select(`
          *,
          forms (
            id,
            title,
            description
          )
        `)
        .eq('form_id', formId)
        .eq('submitted_by', authUserId)
        .maybeSingle();

      if (error) {
        console.error('Error fetching submission:', error);
        return;
      }

      if (submission) {
        setSelectedSubmission(submission);
        setIsDialogOpen(true);
      } else {
        toast({
          title: 'No submission found',
          description: 'You haven\'t submitted this form yet.',
          variant: 'default',
        });
      }
    } catch (error) {
      console.error('Error fetching submission:', error);
    } finally {
      setLoadingByFormId(prev => ({ ...prev, [formId]: false }));
    }
  };

  // Handle dialog close
  const handleDialogClose = (open) => {
    setIsDialogOpen(open);
    if (!open) {
      setSelectedSubmission(null);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2 text-foreground">Error Loading Forms</h3>
          <p className="text-muted-foreground">There was an error loading your assigned forms.</p>
        </div>
      </div>
    );
  }

  const getStatusIcon = (submissionStatus: string) => {
    switch (submissionStatus) {
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />;
      case 'under_review':
        return <Clock className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />;
      default:
        return <FileText className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getStatusBadge = (submissionStatus: string) => {
    switch (submissionStatus) {
      case 'completed':
        return <Badge variant="default" className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300">Completed</Badge>;
      case 'under_review':
        return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300">Under Review</Badge>;
      default:
        return <Badge variant="outline">Not Submitted</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">My Assigned Forms</h1>
        <p className="text-muted-foreground mt-2">
          Complete the forms that have been assigned to you by your care team.
        </p>
      </div>

      {!assignedForms || assignedForms.length === 0 ? (
        <Card>
          <CardContent className="flex items-center justify-center py-12">
            <div className="text-center">
              <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2 text-foreground">No Forms Assigned</h3>
              <p className="text-muted-foreground">
                You don't have any forms assigned to you at the moment.
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {assignedForms.map((form) => (
            <Card key={form.id} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    {getStatusIcon(form.submission_status || 'not_submitted')}
                    <CardTitle className="text-lg line-clamp-2">{form.title}</CardTitle>
                  </div>
                  {getStatusBadge(form.submission_status || 'not_submitted')}
                </div>
                {form.description && (
                  <CardDescription className="line-clamp-2">
                    {form.description}
                  </CardDescription>
                )}
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Calendar className="h-4 w-4" />
                    <span>Assigned: {format(new Date(form.assigned_at), 'MMM d, yyyy')}</span>
                  </div>
                  
                  {form.submitted_at && (
                    <div className="text-sm text-muted-foreground">
                      <span>Submitted: {format(new Date(form.submitted_at), 'MMM d, yyyy')}</span>
                    </div>
                  )}
                  
                  {form.reviewed_at && (
                    <div className="text-sm text-muted-foreground">
                      <span>Reviewed: {format(new Date(form.reviewed_at), 'MMM d, yyyy')}</span>
                    </div>
                  )}

                  <div className="pt-2">
                    {form.submission_status === 'not_submitted' ? (
                      <Button 
                        className="w-full" 
                        size="sm"
                        onClick={() => navigateToClientPage(`/forms/${form.id}`, { formData: form })}
                      >
                        Fill Out Form
                      </Button>
                    ) : form.submission_status === 'completed' ? (
                      <Button 
                        variant="outline" 
                        className="w-full" 
                        size="sm"
                        onClick={() => viewSubmission(form.id)}
                        disabled={loadingByFormId[form.id]}
                      >
                        {loadingByFormId[form.id] ? 'Loading...' : 'View Submission'}
                      </Button>
                    ) : (
                      <Button 
                        variant="secondary" 
                        className="w-full" 
                        size="sm"
                        onClick={() => viewSubmission(form.id)}
                        disabled={loadingByFormId[form.id]}
                      >
                        {loadingByFormId[form.id] ? 'Loading...' : 'View Status'}
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Submission Details Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={handleDialogClose}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {selectedSubmission?.forms?.title || 'Form Submission'}
            </DialogTitle>
            <DialogDescription>
              {selectedSubmission?.forms?.description || 'View your submitted form details and responses'}
            </DialogDescription>
          </DialogHeader>
          {selectedSubmission && (
            <FormSubmissionDetail
              submission={selectedSubmission}
              branchId={selectedSubmission.branch_id}
              formId={selectedSubmission.form_id}
              allowManageReviews={false}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ClientAssignedForms;

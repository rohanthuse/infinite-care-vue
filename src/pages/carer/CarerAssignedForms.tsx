
import React from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useMyAssignedForms } from '@/hooks/useMyAssignedForms';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { FileText, Calendar, CheckCircle, Clock, AlertCircle } from 'lucide-react';
import { format } from 'date-fns';

const CarerAssignedForms = () => {
  const { user } = useAuth();
  const authUserId = user?.id;
  
  const { data: assignedForms, isLoading, error } = useMyAssignedForms(
    authUserId || '', 
    'carer'
  );

  console.log('CarerAssignedForms - Auth User ID:', authUserId);
  console.log('CarerAssignedForms - Assigned Forms:', assignedForms);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (error) {
    console.error('Error in CarerAssignedForms:', error);
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">Error Loading Forms</h3>
          <p className="text-muted-foreground">There was an error loading your assigned forms.</p>
        </div>
      </div>
    );
  }

  const getStatusIcon = (submissionStatus: string) => {
    switch (submissionStatus) {
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'under_review':
        return <Clock className="h-4 w-4 text-yellow-600" />;
      default:
        return <FileText className="h-4 w-4 text-gray-400" />;
    }
  };

  const getStatusBadge = (submissionStatus: string) => {
    switch (submissionStatus) {
      case 'completed':
        return <Badge variant="default" className="bg-green-100 text-green-800">Completed</Badge>;
      case 'under_review':
        return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">Under Review</Badge>;
      default:
        return <Badge variant="outline">Not Submitted</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">My Assigned Forms</h1>
        <p className="text-gray-600 mt-2">
          Complete the forms that have been assigned to you by your branch admin.
        </p>
      </div>

      {!assignedForms || assignedForms.length === 0 ? (
        <Card>
          <CardContent className="flex items-center justify-center py-12">
            <div className="text-center">
              <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No Forms Assigned</h3>
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
                      <Button className="w-full" size="sm">
                        Fill Out Form
                      </Button>
                    ) : form.submission_status === 'completed' ? (
                      <Button variant="outline" className="w-full" size="sm">
                        View Submission
                      </Button>
                    ) : (
                      <Button variant="secondary" className="w-full" size="sm">
                        View Status
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default CarerAssignedForms;

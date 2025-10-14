import React, { useState } from "react";
import { FileText, Clock, CheckCircle, AlertCircle, Eye, Calendar } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useStaffAuthInfo } from "@/hooks/useStaffAuthInfo";
import { useMyAssignedForms } from "@/hooks/useMyAssignedForms";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";

interface CarerFormsTabProps {
  carerId: string;
  branchId?: string;
}

export const CarerFormsTab: React.FC<CarerFormsTabProps> = ({ carerId, branchId }) => {
  const [selectedSubmission, setSelectedSubmission] = useState<{
    formId: string;
    formTitle: string;
  } | null>(null);

  // Get staff auth info to retrieve auth_user_id
  const { data: staffInfo, isLoading: isLoadingStaff } = useStaffAuthInfo(carerId);
  
  // Fetch assigned forms using the auth_user_id
  const { data: assignedForms, isLoading: isLoadingForms } = useMyAssignedForms(
    staffInfo?.auth_user_id || '',
    'carer'
  );

  // Fetch form submission details when a form is selected
  const { data: submissionData } = useQuery({
    queryKey: ['form-submission', selectedSubmission?.formId, staffInfo?.auth_user_id],
    queryFn: async () => {
      if (!selectedSubmission?.formId || !staffInfo?.auth_user_id) return null;
      
      const { data, error } = await supabase
        .from('form_submissions')
        .select('*')
        .eq('form_id', selectedSubmission.formId)
        .eq('submitted_by', staffInfo.auth_user_id)
        .order('submitted_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      
      if (error) throw error;
      return data;
    },
    enabled: !!selectedSubmission && !!staffInfo?.auth_user_id,
  });

  const isLoading = isLoadingStaff || isLoadingForms;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading forms...</p>
        </div>
      </div>
    );
  }

  if (!staffInfo?.auth_user_id) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center text-muted-foreground">
            <AlertCircle className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <p>This staff member does not have an account set up yet.</p>
            <p className="text-sm mt-2">They need to accept their invitation to view assigned forms.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const forms = assignedForms || [];
  
  // Calculate statistics
  const totalForms = forms.length;
  const completedForms = forms.filter(f => f.submission_status === 'completed').length;
  const inProgressForms = forms.filter(f => f.submission_status === 'not_submitted').length;
  const underReviewForms = forms.filter(f => f.submission_status === 'under_review').length;
  const completionRate = totalForms > 0 ? (completedForms / totalForms) * 100 : 0;

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <Badge variant="default" className="bg-green-500"><CheckCircle className="h-3 w-3 mr-1" />Completed</Badge>;
      case 'under_review':
        return <Badge variant="secondary"><Clock className="h-3 w-3 mr-1" />Under Review</Badge>;
      case 'not_submitted':
        return <Badge variant="outline"><AlertCircle className="h-3 w-3 mr-1" />Not Started</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'under_review':
        return <Clock className="h-5 w-5 text-blue-500" />;
      default:
        return <AlertCircle className="h-5 w-5 text-orange-500" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Overview Statistics */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-primary" />
            Forms Overview
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-4 gap-4">
            <div className="text-center p-4 bg-muted rounded-lg">
              <div className="text-2xl font-bold text-primary">{totalForms}</div>
              <div className="text-sm text-muted-foreground">Total Assigned</div>
            </div>
            <div className="text-center p-4 bg-muted rounded-lg">
              <div className="text-2xl font-bold text-green-600">{completedForms}</div>
              <div className="text-sm text-muted-foreground">Completed</div>
            </div>
            <div className="text-center p-4 bg-muted rounded-lg">
              <div className="text-2xl font-bold text-orange-600">{inProgressForms}</div>
              <div className="text-sm text-muted-foreground">Not Started</div>
            </div>
            <div className="text-center p-4 bg-muted rounded-lg">
              <div className="text-2xl font-bold text-blue-600">{underReviewForms}</div>
              <div className="text-sm text-muted-foreground">Under Review</div>
            </div>
          </div>
          
          <div>
            <div className="flex justify-between text-sm mb-2">
              <span className="text-muted-foreground">Completion Rate</span>
              <span className="font-medium">{completionRate.toFixed(0)}%</span>
            </div>
            <Progress value={completionRate} className="h-2" />
          </div>
        </CardContent>
      </Card>

      {/* Assigned Forms List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-primary" />
            Assigned Forms
          </CardTitle>
        </CardHeader>
        <CardContent>
          {forms.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <FileText className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-lg font-medium">No Forms Assigned</p>
              <p className="text-sm mt-2">This staff member has not been assigned any forms yet.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {forms.map((form) => (
                <div
                  key={form.id}
                  className="border border-border rounded-lg p-4 hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3 flex-1">
                      {getStatusIcon(form.submission_status || 'not_submitted')}
                      <div className="flex-1">
                        <h4 className="font-medium mb-1">{form.title}</h4>
                        {form.description && (
                          <p className="text-sm text-muted-foreground mb-3">{form.description}</p>
                        )}
                        
                        <div className="flex flex-wrap gap-3 text-sm text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            Assigned: {format(new Date(form.assigned_at), 'MMM dd, yyyy')}
                          </div>
                          {form.submitted_at && (
                            <div className="flex items-center gap-1">
                              <CheckCircle className="h-3 w-3" />
                              Submitted: {format(new Date(form.submitted_at), 'MMM dd, yyyy')}
                            </div>
                          )}
                          {form.reviewed_at && (
                            <div className="flex items-center gap-1">
                              <Eye className="h-3 w-3" />
                              Reviewed: {format(new Date(form.reviewed_at), 'MMM dd, yyyy')}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      {getStatusBadge(form.submission_status || 'not_submitted')}
                      {form.submission_status === 'completed' && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setSelectedSubmission({ formId: form.id, formTitle: form.title })}
                        >
                          <Eye className="h-4 w-4 mr-2" />
                          View Submission
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Submission Detail Dialog */}
      <Dialog open={!!selectedSubmission} onOpenChange={() => setSelectedSubmission(null)}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Form Submission: {selectedSubmission?.formTitle}</DialogTitle>
          </DialogHeader>
          {submissionData && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 p-4 bg-muted rounded-lg">
                <div>
                  <div className="text-sm text-muted-foreground">Status</div>
                  <div className="font-medium">{submissionData.status}</div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">Submitted</div>
                  <div className="font-medium">
                    {submissionData.submitted_at 
                      ? format(new Date(submissionData.submitted_at), 'MMM dd, yyyy HH:mm')
                      : 'Not submitted'}
                  </div>
                </div>
              </div>
              
              <div className="border border-border rounded-lg p-4">
                <h4 className="font-medium mb-3">Submission Data</h4>
                <pre className="text-sm bg-muted p-4 rounded overflow-auto max-h-96">
                  {JSON.stringify(submissionData.submission_data, null, 2)}
                </pre>
              </div>

              {submissionData.review_notes && (
                <div className="border border-border rounded-lg p-4">
                  <h4 className="font-medium mb-2">Review Notes</h4>
                  <p className="text-sm text-muted-foreground">{submissionData.review_notes}</p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};
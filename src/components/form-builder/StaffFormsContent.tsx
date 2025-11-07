import React, { useState } from 'react';
import { Loader2, UserCircle, FileText, Clock, CheckCircle, AlertCircle } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { useStaffAssignedForms } from '@/hooks/useStaffAssignedForms';
import { useCanSubmitOnBehalf } from '@/hooks/useCanSubmitOnBehalf';
import { FillFormOnBehalfDialog } from './FillFormOnBehalfDialog';

interface StaffFormsContentProps {
  branchId: string;
  branchName: string;
}

export const StaffFormsContent: React.FC<StaffFormsContentProps> = ({ branchId, branchName }) => {
  const { data: assignments, isLoading } = useStaffAssignedForms(branchId);
  const { canSubmit: canSubmitOnBehalf } = useCanSubmitOnBehalf(branchId);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedForm, setSelectedForm] = useState<{
    formId: string;
    staffId: string;
    staffName: string;
    formTitle: string;
  } | null>(null);

  if (!canSubmitOnBehalf) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Access Denied</CardTitle>
          <CardDescription>
            You don't have permission to submit forms on behalf of staff members.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2">Loading staff assignments...</span>
      </div>
    );
  }

  // Group assignments by staff
  const staffGroups = assignments?.reduce((acc, assignment) => {
    const key = assignment.staff_id;
    if (!acc[key]) {
      acc[key] = {
        staffId: assignment.staff_id,
        staffName: assignment.staff_name,
        staffAuthId: assignment.staff_auth_id,
        forms: []
      };
    }
    acc[key].forms.push(assignment);
    return acc;
  }, {} as Record<string, { staffId: string; staffName: string; staffAuthId: string; forms: typeof assignments }>) || {};

  // Filter by search
  const filteredStaffGroups = Object.values(staffGroups).filter(group =>
    group.staffName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { variant: any; label: string; icon?: React.ReactNode }> = {
      not_submitted: { variant: 'outline', label: 'Not Started', icon: <AlertCircle className="h-3 w-3 mr-1" /> },
      draft: { variant: 'warning', label: 'In Progress', icon: <Clock className="h-3 w-3 mr-1" /> },
      completed: { variant: 'success', label: 'Completed', icon: <CheckCircle className="h-3 w-3 mr-1" /> },
      under_review: { variant: 'info', label: 'Under Review' },
      approved: { variant: 'success', label: 'Approved' },
      rejected: { variant: 'destructive', label: 'Rejected' },
    };

    const config = variants[status] || variants.not_submitted;
    return (
      <Badge variant={config.variant} className="flex items-center">
        {config.icon}
        {config.label}
      </Badge>
    );
  };

  const handleFillForm = (formId: string, staffId: string, staffName: string, formTitle: string) => {
    setSelectedForm({ formId, staffId, staffName, formTitle });
  };

  const handleViewSubmission = (formId: string) => {
    // Navigate to submission view
    console.log('View submission for form:', formId);
  };

  if (filteredStaffGroups.length === 0) {
    return (
      <Card>
        <CardContent className="py-16 text-center">
          <UserCircle className="h-12 w-12 mx-auto text-gray-400 mb-4" />
          <p className="text-gray-500">No staff members with assigned forms found</p>
          {searchQuery && (
            <p className="text-sm text-gray-400 mt-1">Try adjusting your search</p>
          )}
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <div className="relative flex-1">
          <Input
            placeholder="Search staff members..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
          <UserCircle className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
        </div>
      </div>

      <div className="space-y-4">
        {filteredStaffGroups.map((group) => (
          <Card key={group.staffId}>
            <CardHeader className="pb-3">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <UserCircle className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <CardTitle className="text-lg">{group.staffName}</CardTitle>
                  <CardDescription>
                    {group.forms.length} {group.forms.length === 1 ? 'form' : 'forms'} assigned
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {group.forms.map((form) => (
                  <div
                    key={form.assignment_id}
                    className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-accent/5 transition-colors"
                  >
                    <div className="flex items-center gap-3 flex-1">
                      <FileText className="h-5 w-5 text-muted-foreground" />
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{form.form_title}</p>
                        <p className="text-xs text-muted-foreground">
                          Assigned {new Date(form.assigned_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      {getStatusBadge(form.submission_status)}
                      {form.submission_status === 'not_submitted' || form.submission_status === 'draft' ? (
                        <Button
                          size="sm"
                          onClick={() => handleFillForm(form.form_id, group.staffId, group.staffName, form.form_title)}
                        >
                          {form.submission_status === 'draft' ? 'Continue' : 'Fill on Behalf'}
                        </Button>
                      ) : (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleViewSubmission(form.form_id)}
                        >
                          View
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {selectedForm && (
        <FillFormOnBehalfDialog
          open={!!selectedForm}
          onOpenChange={(open) => !open && setSelectedForm(null)}
          formId={selectedForm.formId}
          staffId={selectedForm.staffId}
          staffName={selectedForm.staffName}
          formTitle={selectedForm.formTitle}
          branchId={branchId}
          branchName={branchName}
        />
      )}
    </div>
  );
};

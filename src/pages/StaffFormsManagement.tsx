import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { DashboardHeader } from '@/components/DashboardHeader';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useStaffAssignedForms } from '@/hooks/useStaffAssignedForms';
import { useCanSubmitOnBehalf } from '@/hooks/useCanSubmitOnBehalf';
import { useTenant } from '@/contexts/TenantContext';
import { Search, Users, FileText, Clock, CheckCircle, AlertCircle, ArrowRight } from 'lucide-react';
import { format } from 'date-fns';

const getStatusColor = (status: string) => {
  switch (status) {
    case 'completed':
      return 'bg-green-100 text-green-800 border-green-200';
    case 'draft':
      return 'bg-gray-100 text-gray-800 border-gray-200';
    case 'not_submitted':
      return 'bg-red-100 text-red-800 border-red-200';
    case 'under_review':
      return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    case 'approved':
      return 'bg-blue-100 text-blue-800 border-blue-200';
    default:
      return 'bg-gray-100 text-gray-800 border-gray-200';
  }
};

const StaffFormsManagement = () => {
  const navigate = useNavigate();
  const { organization } = useTenant();
  // For now, get branch from localStorage or use a default
  // In a real implementation, you'd have branch context or get it from user profile
  const branchId = localStorage.getItem('selectedBranchId') || organization?.id || '';
  
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStaffId, setSelectedStaffId] = useState<string | null>(null);
  
  const { data: allAssignments = [], isLoading } = useStaffAssignedForms(branchId);
  const { canSubmit } = useCanSubmitOnBehalf(branchId);
  
  // Group assignments by staff
  const staffGroups = allAssignments.reduce((acc, assignment) => {
    if (!acc[assignment.staff_id]) {
      acc[assignment.staff_id] = {
        staffId: assignment.staff_id,
        staffName: assignment.staff_name,
        staffAuthId: assignment.staff_auth_id,
        forms: []
      };
    }
    acc[assignment.staff_id].forms.push(assignment);
    return acc;
  }, {} as Record<string, any>);
  
  const staffList = Object.values(staffGroups);
  
  // Filter by search
  const filteredStaff = staffList.filter(staff =>
    staff.staffName.toLowerCase().includes(searchQuery.toLowerCase())
  );
  
  if (!canSubmit) {
    return (
      <div className="min-h-screen flex flex-col bg-gradient-to-br from-gray-50 to-white">
        <DashboardHeader />
        <main className="flex-1 container px-4 pt-6 pb-20 md:py-8 mx-auto">
          <Card>
            <CardContent className="p-8 text-center">
              <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Access Denied</h3>
              <p className="text-muted-foreground">
                You don't have permission to submit forms on behalf of staff members.
              </p>
            </CardContent>
          </Card>
        </main>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-gray-50 to-white">
      <DashboardHeader />
      
      <main className="flex-1 container px-4 pt-6 pb-20 md:py-8 mx-auto">
        <div className="mb-6 md:mb-8">
          <h1 className="text-2xl md:text-3xl font-bold text-gray-800 tracking-tight">Staff Forms Management</h1>
          <p className="text-gray-500 mt-2 font-medium">View and submit forms on behalf of staff members</p>
        </div>
        
        {/* Search */}
        <Card className="mb-6">
          <CardContent className="p-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search staff members..."
                className="pl-10"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </CardContent>
        </Card>
        
        {/* Staff List */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Staff Members ({filteredStaff.length})
            </CardTitle>
            <CardDescription>
              Click on a staff member to view and manage their assigned forms
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
              </div>
            ) : filteredStaff.length === 0 ? (
              <div className="text-center py-8">
                <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">No staff members found</p>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredStaff.map((staff) => {
                  const pendingForms = staff.forms.filter((f: any) => 
                    f.submission_status === 'not_submitted' || f.submission_status === 'draft'
                  ).length;
                  
                  return (
                    <Dialog key={staff.staffId}>
                      <DialogTrigger asChild>
                        <div
                          className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors cursor-pointer"
                          onClick={() => setSelectedStaffId(staff.staffId)}
                        >
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <h3 className="font-semibold">{staff.staffName}</h3>
                              {pendingForms > 0 && (
                                <Badge variant="destructive" className="text-xs">
                                  {pendingForms} Pending
                                </Badge>
                              )}
                            </div>
                            <div className="flex items-center gap-4 text-sm text-muted-foreground">
                              <span>{staff.forms.length} forms assigned</span>
                              <span>
                                {staff.forms.filter((f: any) => f.submission_status === 'completed').length} completed
                              </span>
                            </div>
                          </div>
                          <ArrowRight className="h-5 w-5 text-muted-foreground" />
                        </div>
                      </DialogTrigger>
                      
                      <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
                        <DialogHeader>
                          <DialogTitle>Forms for {staff.staffName}</DialogTitle>
                        </DialogHeader>
                        
                        <div className="space-y-3 mt-4">
                          {staff.forms.map((form: any) => (
                            <div key={form.assignment_id} className="border rounded-lg p-4">
                              <div className="flex items-start justify-between gap-4">
                                <div className="flex-1">
                                  <div className="flex items-center gap-2 mb-2">
                                    <FileText className="h-4 w-4 text-muted-foreground" />
                                    <h4 className="font-medium">{form.form_title}</h4>
                                  </div>
                                  
                                  <div className="flex items-center gap-3 text-sm text-muted-foreground mb-2">
                                    <Badge className={getStatusColor(form.submission_status)}>
                                      {form.submission_status.replace('_', ' ')}
                                    </Badge>
                                    <span className="flex items-center gap-1">
                                      <Clock className="h-3 w-3" />
                                      Assigned {format(new Date(form.assigned_at), 'MMM dd, yyyy')}
                                    </span>
                                  </div>
                                  
                                  {form.submitted_at && (
                                    <div className="text-sm text-muted-foreground flex items-center gap-1">
                                      <CheckCircle className="h-3 w-3" />
                                      Submitted {format(new Date(form.submitted_at), 'MMM dd, yyyy HH:mm')}
                                      {form.submitted_by_admin && (
                                        <span className="text-orange-600 ml-1">(by admin)</span>
                                      )}
                                    </div>
                                  )}
                                </div>
                                
                                <div className="flex gap-2">
                                  {form.submission_status === 'not_submitted' || form.submission_status === 'draft' ? (
                                    <Button
                                      size="sm"
                                      onClick={() => navigate(`/forms/${form.form_id}/fill?onBehalfOf=${staff.staffAuthId}&staffName=${encodeURIComponent(staff.staffName)}`)}
                                    >
                                      Fill on Behalf
                                    </Button>
                                  ) : (
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={() => navigate(`/forms/${form.form_id}`)}
                                    >
                                      View
                                    </Button>
                                  )}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </DialogContent>
                    </Dialog>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default StaffFormsManagement;

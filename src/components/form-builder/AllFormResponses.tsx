import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from '@/components/ui/pagination';
import { useAllFormSubmissions } from '@/hooks/useAllFormSubmissions';
import { useFormManagement } from '@/hooks/useFormManagement';
import { FormSubmissionDetail } from './FormSubmissionDetail';
import { Search, FileText, User, Calendar, Filter, Eye, Loader2, CheckCircle, Clock, XCircle, AlertCircle } from 'lucide-react';
import { format } from 'date-fns';

interface AllFormResponsesProps {
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

export const AllFormResponses: React.FC<AllFormResponsesProps> = ({ branchId }) => {
  const { submissions, isLoading } = useAllFormSubmissions(branchId);
  const { forms } = useFormManagement(branchId);
  
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [formFilter, setFormFilter] = useState('all');
  const [submitterTypeFilter, setSubmitterTypeFilter] = useState('all');
  const [selectedSubmission, setSelectedSubmission] = useState<any>(null);
  const [currentPage, setCurrentPage] = useState(1);
  
  const itemsPerPage = 10;

  // Calculate statistics
  const stats = useMemo(() => {
    const total = submissions.length;
    const completed = submissions.filter(s => s.status === 'completed').length;
    const underReview = submissions.filter(s => s.status === 'under_review').length;
    const approved = submissions.filter(s => s.status === 'approved').length;
    const rejected = submissions.filter(s => s.status === 'rejected').length;
    
    return { total, completed, underReview, approved, rejected };
  }, [submissions]);

  // Filter submissions
  const filteredSubmissions = useMemo(() => {
    return submissions.filter(submission => {
      const matchesSearch = 
        submission.submitter_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        submission.form_title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        submission.id.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesStatus = statusFilter === 'all' || submission.status === statusFilter;
      const matchesForm = formFilter === 'all' || submission.form_id === formFilter;
      const matchesSubmitterType = submitterTypeFilter === 'all' || submission.submitted_by_type === submitterTypeFilter;
      
      return matchesSearch && matchesStatus && matchesForm && matchesSubmitterType;
    });
  }, [submissions, searchQuery, statusFilter, formFilter, submitterTypeFilter]);

  // Pagination
  const totalPages = Math.ceil(filteredSubmissions.length / itemsPerPage);
  const paginatedSubmissions = filteredSubmissions.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const handleViewSubmission = (submission: any) => {
    setSelectedSubmission(submission);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2 text-muted-foreground">Loading submissions...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Submissions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="text-2xl font-bold">{stats.total}</div>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Completed</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="text-2xl font-bold text-green-600">{stats.completed}</div>
              <CheckCircle className="h-4 w-4 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Under Review</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="text-2xl font-bold text-yellow-600">{stats.underReview}</div>
              <Clock className="h-4 w-4 text-yellow-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Approved</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="text-2xl font-bold text-blue-600">{stats.approved}</div>
              <CheckCircle className="h-4 w-4 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Rejected</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="text-2xl font-bold text-red-600">{stats.rejected}</div>
              <XCircle className="h-4 w-4 text-red-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filters & Search
          </CardTitle>
          <CardDescription>Filter and search through form submissions</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by name, form, or ID..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>

            <Select value={formFilter} onValueChange={setFormFilter}>
              <SelectTrigger>
                <SelectValue placeholder="All Forms" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Forms</SelectItem>
                {forms.map((form) => (
                  <SelectItem key={form.id} value={form.id}>
                    {form.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue placeholder="All Statuses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="draft">Draft</SelectItem>
                <SelectItem value="under_review">Under Review</SelectItem>
                <SelectItem value="approved">Approved</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
              </SelectContent>
            </Select>

            <Select value={submitterTypeFilter} onValueChange={setSubmitterTypeFilter}>
              <SelectTrigger>
                <SelectValue placeholder="All Submitter Types" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="client">Client</SelectItem>
                <SelectItem value="staff">Staff</SelectItem>
                <SelectItem value="carer">Carer</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {(searchQuery || statusFilter !== 'all' || formFilter !== 'all' || submitterTypeFilter !== 'all') && (
            <div className="flex items-center gap-2 mt-4">
              <p className="text-sm text-muted-foreground">
                Showing {filteredSubmissions.length} of {submissions.length} submissions
              </p>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setSearchQuery('');
                  setStatusFilter('all');
                  setFormFilter('all');
                  setSubmitterTypeFilter('all');
                  setCurrentPage(1);
                }}
              >
                Clear Filters
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Submissions Table */}
      <Card>
        <CardHeader>
          <CardTitle>All Form Submissions</CardTitle>
          <CardDescription>
            View and manage all form submissions across all forms
          </CardDescription>
        </CardHeader>
        <CardContent>
          {paginatedSubmissions.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <AlertCircle className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No submissions found</h3>
              <p className="text-muted-foreground">
                {submissions.length === 0
                  ? 'No form submissions have been received yet.'
                  : 'Try adjusting your filters to see more results.'}
              </p>
            </div>
          ) : (
            <>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Submitter</TableHead>
                      <TableHead>Form</TableHead>
                      <TableHead>Submission Date</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedSubmissions.map((submission) => (
                      <TableRow key={submission.id}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <User className="h-4 w-4 text-muted-foreground" />
                            <div>
                              <div className="font-medium">
                                {submission.submitter_name || 'Unknown'}
                              </div>
                              <div className="text-xs text-muted-foreground">
                                ID: {submission.submitted_by.slice(-8)}
                              </div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <FileText className="h-4 w-4 text-muted-foreground" />
                            <div className="font-medium">{submission.form_title}</div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4 text-muted-foreground" />
                            {format(new Date(submission.submitted_at), 'MMM dd, yyyy HH:mm')}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge className={getStatusColor(submission.status)}>
                            {submission.status.replace('_', ' ')}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge className={getSubmitterTypeColor(submission.submitted_by_type)}>
                            {submission.submitted_by_type}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleViewSubmission(submission)}
                          >
                            <Eye className="h-4 w-4 mr-1" />
                            View
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="mt-4">
                  <Pagination>
                    <PaginationContent>
                      <PaginationItem>
                        <PaginationPrevious
                          onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                          className={currentPage === 1 ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                        />
                      </PaginationItem>
                      {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                        <PaginationItem key={page}>
                          <PaginationLink
                            onClick={() => setCurrentPage(page)}
                            isActive={currentPage === page}
                            className="cursor-pointer"
                          >
                            {page}
                          </PaginationLink>
                        </PaginationItem>
                      ))}
                      <PaginationItem>
                        <PaginationNext
                          onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                          className={currentPage === totalPages ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                        />
                      </PaginationItem>
                    </PaginationContent>
                  </Pagination>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Submission Detail Dialog */}
      <Dialog open={!!selectedSubmission} onOpenChange={(open) => !open && setSelectedSubmission(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Form Submission Details</DialogTitle>
          </DialogHeader>
          {selectedSubmission && (
            <FormSubmissionDetail
              submission={selectedSubmission}
              branchId={branchId}
              formId={selectedSubmission.form_id}
              allowManageReviews={true}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

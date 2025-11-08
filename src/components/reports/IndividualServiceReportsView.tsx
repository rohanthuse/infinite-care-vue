import React, { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar, Search, FileText, Clock, User, CheckCircle2, XCircle, AlertCircle, Loader2 } from "lucide-react";
import { format } from "date-fns";
import { useBranchServiceReports } from "@/hooks/useServiceReports";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";

interface IndividualServiceReportsViewProps {
  branchId: string;
  branchName: string;
}

export function IndividualServiceReportsView({ branchId }: IndividualServiceReportsViewProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string[]>([]);
  const [selectedReport, setSelectedReport] = useState<any>(null);

  const { data: reports, isLoading, error } = useBranchServiceReports(branchId, {
    status: statusFilter.length > 0 ? statusFilter : undefined,
  });

  // Calculate statistics
  const stats = useMemo(() => {
    if (!reports) return { total: 0, pending: 0, approved: 0, revision: 0, rejected: 0 };
    
    return {
      total: reports.length,
      pending: reports.filter(r => r.status === 'pending').length,
      approved: reports.filter(r => r.status === 'approved').length,
      revision: reports.filter(r => r.status === 'requires_revision').length,
      rejected: reports.filter(r => r.status === 'rejected').length,
    };
  }, [reports]);

  // Filter reports by search query
  const filteredReports = useMemo(() => {
    if (!reports) return [];
    
    return reports.filter(report => {
      const searchLower = searchQuery.toLowerCase();
      const clientName = `${report.clients?.first_name} ${report.clients?.last_name}`.toLowerCase();
      const staffName = `${report.staff?.first_name} ${report.staff?.last_name}`.toLowerCase();
      
      return clientName.includes(searchLower) || staffName.includes(searchLower);
    });
  }, [reports, searchQuery]);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="outline" className="bg-yellow-500/10 text-yellow-700 border-yellow-500/20"><AlertCircle className="h-3 w-3 mr-1" />Pending</Badge>;
      case 'approved':
        return <Badge variant="outline" className="bg-green-500/10 text-green-700 border-green-500/20"><CheckCircle2 className="h-3 w-3 mr-1" />Approved</Badge>;
      case 'requires_revision':
        return <Badge variant="outline" className="bg-orange-500/10 text-orange-700 border-orange-500/20"><AlertCircle className="h-3 w-3 mr-1" />Needs Revision</Badge>;
      case 'rejected':
        return <Badge variant="outline" className="bg-red-500/10 text-red-700 border-red-500/20"><XCircle className="h-3 w-3 mr-1" />Rejected</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const renderReportsList = (filterStatus?: string) => {
    const reportsToShow = filterStatus 
      ? filteredReports.filter(r => r.status === filterStatus)
      : filteredReports;

    if (reportsToShow.length === 0) {
      return (
        <div className="text-center py-8 text-muted-foreground">
          <FileText className="h-12 w-12 mx-auto mb-2 opacity-50" />
          <p>No service reports found</p>
        </div>
      );
    }

    return (
      <div className="space-y-3">
        {reportsToShow.map((report) => (
          <Card key={report.id} className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => setSelectedReport(report)}>
            <CardContent className="p-4">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 space-y-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h4 className="font-semibold text-base">
                      {report.clients?.first_name} {report.clients?.last_name}
                    </h4>
                    {getStatusBadge(report.status)}
                  </div>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm text-muted-foreground">
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4" />
                      <span>Carer: {report.staff?.first_name} {report.staff?.last_name}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      <span>{format(new Date(report.service_date), 'MMM dd, yyyy')}</span>
                    </div>
                    {report.service_duration_minutes && (
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4" />
                        <span>{Math.round(report.service_duration_minutes / 60 * 10) / 10} hours</span>
                      </div>
                    )}
                  </div>

                  {report.services_provided && report.services_provided.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {report.services_provided.slice(0, 3).map((service: string, idx: number) => (
                        <Badge key={idx} variant="secondary" className="text-xs">{service}</Badge>
                      ))}
                      {report.services_provided.length > 3 && (
                        <Badge variant="secondary" className="text-xs">+{report.services_provided.length - 3} more</Badge>
                      )}
                    </div>
                  )}
                </div>
                
                <Button variant="ghost" size="sm">
                  View Details
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  };

  if (error) {
    return (
      <div className="text-center py-8">
        <p className="text-destructive">Error loading service reports</p>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-6">
        {/* Search and Filters */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by client or carer name..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
          <Select value={statusFilter[0] || "all"} onValueChange={(value) => setStatusFilter(value === "all" ? [] : [value])}>
            <SelectTrigger className="w-full sm:w-[200px]">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="approved">Approved</SelectItem>
              <SelectItem value="requires_revision">Needs Revision</SelectItem>
              <SelectItem value="rejected">Rejected</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold">{stats.total}</div>
              <div className="text-sm text-muted-foreground">Total Reports</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-yellow-600">{stats.pending}</div>
              <div className="text-sm text-muted-foreground">Pending</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-green-600">{stats.approved}</div>
              <div className="text-sm text-muted-foreground">Approved</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-orange-600">{stats.revision}</div>
              <div className="text-sm text-muted-foreground">Needs Revision</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-red-600">{stats.rejected}</div>
              <div className="text-sm text-muted-foreground">Rejected</div>
            </CardContent>
          </Card>
        </div>

        {/* Reports List with Tabs */}
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin mr-2" />
            <span>Loading service reports...</span>
          </div>
        ) : (
          <Tabs defaultValue="all" className="w-full">
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="all">All ({stats.total})</TabsTrigger>
              <TabsTrigger value="pending">Pending ({stats.pending})</TabsTrigger>
              <TabsTrigger value="approved">Approved ({stats.approved})</TabsTrigger>
              <TabsTrigger value="revision">Revision ({stats.revision})</TabsTrigger>
              <TabsTrigger value="rejected">Rejected ({stats.rejected})</TabsTrigger>
            </TabsList>
            <TabsContent value="all" className="mt-4">
              {renderReportsList()}
            </TabsContent>
            <TabsContent value="pending" className="mt-4">
              {renderReportsList('pending')}
            </TabsContent>
            <TabsContent value="approved" className="mt-4">
              {renderReportsList('approved')}
            </TabsContent>
            <TabsContent value="revision" className="mt-4">
              {renderReportsList('requires_revision')}
            </TabsContent>
            <TabsContent value="rejected" className="mt-4">
              {renderReportsList('rejected')}
            </TabsContent>
          </Tabs>
        )}
      </div>

      {/* Report Details Dialog */}
      {selectedReport && (
        <Dialog open={!!selectedReport} onOpenChange={() => setSelectedReport(null)}>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Service Report Details</DialogTitle>
              <DialogDescription>
                Report for {selectedReport.clients?.first_name} {selectedReport.clients?.last_name}
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium">Status</p>
                  <div className="mt-1">{getStatusBadge(selectedReport.status)}</div>
                </div>
                <div>
                  <p className="text-sm font-medium">Service Date</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    {format(new Date(selectedReport.service_date), 'MMMM dd, yyyy')}
                  </p>
                </div>
                {selectedReport.service_duration_minutes && (
                  <div>
                    <p className="text-sm font-medium">Duration</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      {Math.round(selectedReport.service_duration_minutes / 60 * 10) / 10} hours ({selectedReport.service_duration_minutes} minutes)
                    </p>
                  </div>
                )}
              </div>

              <div>
                <p className="text-sm font-medium">Carer</p>
                <p className="text-sm text-muted-foreground mt-1">
                  {selectedReport.staff?.first_name} {selectedReport.staff?.last_name}
                </p>
              </div>

              {selectedReport.services_provided && selectedReport.services_provided.length > 0 && (
                <div>
                  <p className="text-sm font-medium mb-2">Services Provided</p>
                  <div className="flex flex-wrap gap-2">
                    {selectedReport.services_provided.map((service: string, idx: number) => (
                      <Badge key={idx} variant="secondary">{service}</Badge>
                    ))}
                  </div>
                </div>
              )}

              {selectedReport.carer_observations && (
                <div>
                  <p className="text-sm font-medium">Carer Observations</p>
                  <p className="text-sm text-muted-foreground mt-1 whitespace-pre-wrap">
                    {selectedReport.carer_observations}
                  </p>
                </div>
              )}

              {selectedReport.activities_undertaken && (
                <div>
                  <p className="text-sm font-medium">Activities Undertaken</p>
                  <p className="text-sm text-muted-foreground mt-1 whitespace-pre-wrap">
                    {selectedReport.activities_undertaken}
                  </p>
                </div>
              )}

              {selectedReport.review_notes && (
                <div>
                  <p className="text-sm font-medium">Review Notes</p>
                  <p className="text-sm text-muted-foreground mt-1 whitespace-pre-wrap">
                    {selectedReport.review_notes}
                  </p>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4 text-xs text-muted-foreground">
                <div>
                  <p>Submitted: {selectedReport.submitted_at ? format(new Date(selectedReport.submitted_at), 'MMM dd, yyyy HH:mm') : 'N/A'}</p>
                </div>
                {selectedReport.reviewed_at && (
                  <div>
                    <p>Reviewed: {format(new Date(selectedReport.reviewed_at), 'MMM dd, yyyy HH:mm')}</p>
                  </div>
                )}
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
}

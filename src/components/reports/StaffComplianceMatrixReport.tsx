import React, { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Loader2, Download, TrendingUp, Users, AlertTriangle, CheckCircle, Eye } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, ResponsiveContainer, BarChart, Bar } from "recharts";
import { useStaffComplianceMatrix, StaffComplianceRow } from "@/hooks/useStaffComplianceMatrix";
import { StaffComplianceBreakdownDialog } from "./StaffComplianceBreakdownDialog";
import { ReportExporter } from "@/utils/reportExporter";
import { toast } from "sonner";
import { format } from "date-fns";

interface StaffComplianceMatrixReportProps {
  branchId: string;
  branchName: string;
}

type FilterLevel = "all" | "compliant" | "at-risk" | "non-compliant";

export function StaffComplianceMatrixReport({ branchId, branchName }: StaffComplianceMatrixReportProps) {
  const [filterLevel, setFilterLevel] = useState<FilterLevel>("all");
  const [selectedStaff, setSelectedStaff] = useState<StaffComplianceRow | null>(null);
  const [breakdownDialogOpen, setBreakdownDialogOpen] = useState(false);
  
  const { data: matrixData, isLoading, error, refetch } = useStaffComplianceMatrix({
    branchId,
  });

  // Filter staff rows based on selected compliance level
  const filteredStaffRows = useMemo(() => {
    if (!matrixData?.staffRows) return [];
    if (filterLevel === "all") return matrixData.staffRows;
    return matrixData.staffRows.filter((row) => row.complianceLevel === filterLevel);
  }, [matrixData?.staffRows, filterLevel]);

  const handleExport = async (type: 'pdf' | 'csv' | 'excel') => {
    if (!matrixData) {
      toast.error("No data available to export");
      return;
    }

    try {
      const exportData = filteredStaffRows.map((row) => ({
        'Staff Name': row.staffName,
        'Training Compliance %': row.trainingCompliancePercentage,
        'Document Status': row.documentStatus,
        'Missed Calls': row.missedCallsCount,
        'Late Arrivals': row.lateArrivalsCount,
        'Incidents': row.incidentsCount,
        'Overall Score': row.overallScore,
        'Compliance Level': row.complianceLevel,
      }));

      const options = {
        title: 'Staff Compliance Matrix Report',
        data: exportData,
        columns: [
          'Staff Name',
          'Training Compliance %',
          'Document Status',
          'Missed Calls',
          'Late Arrivals',
          'Incidents',
          'Overall Score',
          'Compliance Level',
        ],
        branchName,
        fileName: `Staff_Compliance_Matrix_${branchName}_${format(new Date(), 'yyyyMMdd')}`,
      };

      if (type === 'pdf') {
        await ReportExporter.exportToPDF(options);
      } else if (type === 'csv') {
        ReportExporter.exportToCSV(options);
      } else {
        ReportExporter.exportToExcel(options);
      }

      toast.success(`${type.toUpperCase()} exported successfully`);
    } catch (error) {
      console.error('Export error:', error);
      toast.error('Failed to export report');
    }
  };

  const getComplianceBadge = (level: string) => {
    switch (level) {
      case 'compliant':
        return <Badge variant="default" className="bg-success text-success-foreground">Compliant</Badge>;
      case 'at-risk':
        return <Badge variant="secondary" className="bg-warning text-warning-foreground">At Risk</Badge>;
      case 'non-compliant':
        return <Badge variant="destructive">Non-Compliant</Badge>;
      default:
        return <Badge variant="outline">{level}</Badge>;
    }
  };

  const getDocumentStatusBadge = (status: string) => {
    switch (status) {
      case 'compliant':
        return <Badge variant="default" className="bg-success text-success-foreground">Valid</Badge>;
      case 'at-risk':
        return <Badge variant="secondary" className="bg-warning text-warning-foreground">Expiring Soon</Badge>;
      case 'non-compliant':
        return <Badge variant="destructive">Expired</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getScoreBadge = (score: number) => {
    if (score >= 85) {
      return <Badge variant="default" className="bg-success text-success-foreground">{score}%</Badge>;
    } else if (score >= 70) {
      return <Badge variant="secondary" className="bg-warning text-warning-foreground">{score}%</Badge>;
    } else {
      return <Badge variant="destructive">{score}%</Badge>;
    }
  };

  const handleViewDetails = (staff: StaffComplianceRow) => {
    setSelectedStaff(staff);
    setBreakdownDialogOpen(true);
  };

  if (error) {
    return (
      <div className="text-center py-8">
        <p className="text-destructive">Error loading staff compliance matrix</p>
        <Button onClick={() => refetch()} className="mt-2">
          Try Again
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Controls */}
      <div className="flex flex-col sm:flex-row justify-between gap-4">
        <div className="flex items-center gap-2">
          <Select value={filterLevel} onValueChange={(value) => setFilterLevel(value as FilterLevel)}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Filter by level" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Staff</SelectItem>
              <SelectItem value="compliant">Compliant Only</SelectItem>
              <SelectItem value="at-risk">At Risk Only</SelectItem>
              <SelectItem value="non-compliant">Non-Compliant Only</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button>
              <Download className="h-4 w-4 mr-2" />
              Export Report
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => handleExport('pdf')}>
              Export as PDF
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleExport('csv')}>
              Export as CSV
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleExport('excel')}>
              Export as Excel
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin mr-2" />
          <span>Loading compliance matrix...</span>
        </div>
      ) : (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Total Staff</p>
                    <p className="text-2xl font-bold">{matrixData?.summary.totalStaff || 0}</p>
                  </div>
                  <Users className="h-8 w-8 text-muted-foreground" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Compliant</p>
                    <p className="text-2xl font-bold text-success">{matrixData?.summary.compliantStaff || 0}</p>
                  </div>
                  <CheckCircle className="h-8 w-8 text-success" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">At Risk</p>
                    <p className="text-2xl font-bold text-warning">{matrixData?.summary.atRiskStaff || 0}</p>
                  </div>
                  <AlertTriangle className="h-8 w-8 text-warning" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Non-Compliant</p>
                    <p className="text-2xl font-bold text-destructive">{matrixData?.summary.nonCompliantStaff || 0}</p>
                  </div>
                  <AlertTriangle className="h-8 w-8 text-destructive" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Trend Chart */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Compliance Trend (Last 6 Months)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ChartContainer config={{}}>
                <ResponsiveContainer width="100%" height={250}>
                  <LineChart data={matrixData?.trends || []}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis domain={[0, 100]} />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Line 
                      type="monotone" 
                      dataKey="averageScore" 
                      stroke="hsl(var(--primary))" 
                      strokeWidth={2}
                      name="Average Score"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </ChartContainer>
            </CardContent>
          </Card>

          {/* Compliance Distribution Chart */}
          <Card>
            <CardHeader>
              <CardTitle>Compliance Distribution</CardTitle>
            </CardHeader>
            <CardContent>
              <ChartContainer config={{}}>
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart
                    data={[
                      { name: 'Compliant', value: matrixData?.summary.compliantStaff || 0 },
                      { name: 'At Risk', value: matrixData?.summary.atRiskStaff || 0 },
                      { name: 'Non-Compliant', value: matrixData?.summary.nonCompliantStaff || 0 },
                    ]}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Bar dataKey="value" fill="hsl(var(--primary))" name="Staff Count" />
                  </BarChart>
                </ResponsiveContainer>
              </ChartContainer>
            </CardContent>
          </Card>

          {/* Staff Compliance Matrix Table */}
          <Card>
            <CardHeader>
              <CardTitle>
                Staff Compliance Matrix
                {filterLevel !== "all" && (
                  <span className="ml-2 text-sm font-normal text-muted-foreground">
                    (Filtered: {filteredStaffRows.length} of {matrixData?.summary.totalStaff || 0})
                  </span>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[500px]">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Staff Member</TableHead>
                      <TableHead className="text-center">Training %</TableHead>
                      <TableHead className="text-center">Documents</TableHead>
                      <TableHead className="text-center">Missed Calls</TableHead>
                      <TableHead className="text-center">Late Arrivals</TableHead>
                      <TableHead className="text-center">Incidents</TableHead>
                      <TableHead className="text-center">Overall Score</TableHead>
                      <TableHead className="text-center">Compliance Level</TableHead>
                      <TableHead className="text-center">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredStaffRows.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={9} className="text-center text-muted-foreground py-8">
                          No staff members found matching the selected filter
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredStaffRows.map((staff) => (
                        <TableRow key={staff.staffId}>
                          <TableCell className="font-medium">{staff.staffName}</TableCell>
                          <TableCell className="text-center">
                            <Badge
                              variant={
                                staff.trainingCompliancePercentage >= 90
                                  ? "default"
                                  : staff.trainingCompliancePercentage >= 70
                                  ? "secondary"
                                  : "destructive"
                              }
                            >
                              {staff.trainingCompliancePercentage}%
                            </Badge>
                          </TableCell>
                          <TableCell className="text-center">
                            {getDocumentStatusBadge(staff.documentStatus)}
                          </TableCell>
                          <TableCell className="text-center">
                            <Badge variant={staff.missedCallsCount > 0 ? "destructive" : "outline"}>
                              {staff.missedCallsCount}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-center">
                            <Badge variant={staff.lateArrivalsCount > 0 ? "destructive" : "outline"}>
                              {staff.lateArrivalsCount}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-center">
                            <Badge variant={staff.incidentsCount > 0 ? "destructive" : "outline"}>
                              {staff.incidentsCount}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-center">{getScoreBadge(staff.overallScore)}</TableCell>
                          <TableCell className="text-center">{getComplianceBadge(staff.complianceLevel)}</TableCell>
                          <TableCell className="text-center">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleViewDetails(staff)}
                            >
                              <Eye className="h-4 w-4 mr-1" />
                              View Details
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </ScrollArea>
            </CardContent>
          </Card>
        </>
      )}
      
      {/* Breakdown Dialog */}
      {selectedStaff && (
        <StaffComplianceBreakdownDialog
          open={breakdownDialogOpen}
          onOpenChange={setBreakdownDialogOpen}
          staffName={selectedStaff.staffName}
          breakdown={selectedStaff.detailedBreakdown}
        />
      )}
    </div>
  );
}

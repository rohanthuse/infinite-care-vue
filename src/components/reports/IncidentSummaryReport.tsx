import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Loader2, Download, TrendingUp, AlertTriangle, CheckCircle, Clock, Activity } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell, Legend } from "recharts";
import { useIncidentReportsData } from "@/hooks/useIncidentReportsData";
import { ReportExporter } from "@/utils/reportExporter";
import { toast } from "sonner";
import { format } from "date-fns";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { Calendar } from "lucide-react";
import { DateRange } from "react-day-picker";
import { addDays } from "date-fns";

interface IncidentSummaryReportProps {
  branchId: string;
  branchName: string;
}

const SEVERITY_COLORS: Record<string, string> = {
  Critical: '#ef4444',
  High: '#f97316',
  Medium: '#eab308',
  Low: '#22c55e',
  Unknown: '#6b7280',
};

export function IncidentSummaryReport({ branchId, branchName }: IncidentSummaryReportProps) {
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: addDays(new Date(), -90), // Last 90 days
    to: new Date(),
  });

  const { data: incidentData, isLoading, error, refetch } = useIncidentReportsData({
    branchId,
    startDate: dateRange?.from ? format(dateRange.from, 'yyyy-MM-dd') : undefined,
    endDate: dateRange?.to ? format(dateRange.to, 'yyyy-MM-dd') : undefined,
  });

  const handleExport = async (type: 'pdf' | 'csv' | 'excel') => {
    if (!incidentData) {
      toast.error("No data available to export");
      return;
    }

    try {
      const exportData = incidentData.recentIncidents.map((incident) => ({
        'Date': format(new Date(incident.date), 'yyyy-MM-dd'),
        'Category': incident.category,
        'Severity': incident.severity,
        'Description': incident.description,
        'Client': incident.clientName,
        'Staff': incident.staffName,
        'Status': incident.status,
        'Resolution Time (days)': incident.resolutionTime || 'N/A',
      }));

      const options = {
        title: 'Incident & Event Summary Report',
        data: exportData,
        columns: [
          'Date',
          'Category',
          'Severity',
          'Description',
          'Client',
          'Staff',
          'Status',
          'Resolution Time (days)',
        ],
        branchName,
        dateRange: dateRange?.from && dateRange?.to ? { from: dateRange.from, to: dateRange.to } : null,
        fileName: `Incident_Summary_Report_${branchName}_${format(new Date(), 'yyyyMMdd')}`,
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

  const getSeverityBadge = (severity: string) => {
    const normalizedSeverity = severity.toLowerCase();
    if (normalizedSeverity === 'critical') {
      return <Badge variant="destructive" className="bg-destructive">Critical</Badge>;
    } else if (normalizedSeverity === 'high') {
      return <Badge variant="destructive" className="bg-orange-500">High</Badge>;
    } else if (normalizedSeverity === 'medium') {
      return <Badge variant="secondary" className="bg-warning text-warning-foreground">Medium</Badge>;
    } else if (normalizedSeverity === 'low') {
      return <Badge variant="default" className="bg-success text-success-foreground">Low</Badge>;
    }
    return <Badge variant="outline">{severity}</Badge>;
  };

  const getStatusBadge = (status: string) => {
    if (status === 'resolved') {
      return <Badge variant="default" className="bg-success text-success-foreground">Resolved</Badge>;
    } else if (status === 'pending') {
      return <Badge variant="secondary" className="bg-warning text-warning-foreground">Pending</Badge>;
    } else if (status === 'investigating') {
      return <Badge variant="outline">Investigating</Badge>;
    }
    return <Badge variant="outline">{status}</Badge>;
  };

  if (error) {
    return (
      <div className="text-center py-8">
        <p className="text-destructive">Error loading incident reports</p>
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
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" className="w-full sm:w-auto">
              <Calendar className="h-4 w-4 mr-2" />
              {dateRange?.from ? (
                dateRange.to ? (
                  <>
                    {format(dateRange.from, "LLL dd, y")} -{" "}
                    {format(dateRange.to, "LLL dd, y")}
                  </>
                ) : (
                  format(dateRange.from, "LLL dd, y")
                )
              ) : (
                <span>Pick a date range</span>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <CalendarComponent
              initialFocus
              mode="range"
              defaultMonth={dateRange?.from}
              selected={dateRange}
              onSelect={setDateRange}
            />
          </PopoverContent>
        </Popover>

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
          <span>Loading incident reports...</span>
        </div>
      ) : (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Total Incidents</p>
                    <p className="text-2xl font-bold">{incidentData?.summary.totalIncidents || 0}</p>
                  </div>
                  <Activity className="h-8 w-8 text-muted-foreground" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Resolved</p>
                    <p className="text-2xl font-bold text-success">{incidentData?.summary.resolvedIncidents || 0}</p>
                  </div>
                  <CheckCircle className="h-8 w-8 text-success" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Pending</p>
                    <p className="text-2xl font-bold text-warning">{incidentData?.summary.pendingIncidents || 0}</p>
                  </div>
                  <Clock className="h-8 w-8 text-warning" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Avg Resolution</p>
                    <p className="text-2xl font-bold">{incidentData?.summary.averageResolutionTime || 0} days</p>
                  </div>
                  <TrendingUp className="h-8 w-8 text-primary" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Critical Incidents Alert */}
          {incidentData && incidentData.summary.criticalIncidents > 0 && (
            <Card className="border-destructive">
              <CardContent className="pt-6">
                <div className="flex items-center gap-4">
                  <AlertTriangle className="h-8 w-8 text-destructive" />
                  <div>
                    <p className="font-semibold text-destructive">
                      {incidentData.summary.criticalIncidents} Critical/High Priority Incidents Require Attention
                    </p>
                    <p className="text-sm text-muted-foreground">
                      These incidents need immediate review and resolution
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Charts Row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Severity Breakdown */}
            <Card>
              <CardHeader>
                <CardTitle>Incidents by Severity</CardTitle>
              </CardHeader>
              <CardContent>
                <ChartContainer config={{}}>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={incidentData?.bySeverity || []}
                        cx="50%"
                        cy="50%"
                        labelLine={true}
                        label={({ severity, count }) => `${severity}: ${count}`}
                        outerRadius={100}
                        fill="#8884d8"
                        dataKey="count"
                      >
                        {(incidentData?.bySeverity || []).map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={SEVERITY_COLORS[entry.severity] || '#6b7280'} />
                        ))}
                      </Pie>
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </ChartContainer>
              </CardContent>
            </Card>

            {/* Incident Types */}
            <Card>
              <CardHeader>
                <CardTitle>Top Incident Types</CardTitle>
              </CardHeader>
              <CardContent>
                <ChartContainer config={{}}>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={incidentData?.byType || []} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis type="number" />
                      <YAxis dataKey="type" type="category" width={100} />
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <Bar dataKey="count" fill="hsl(var(--primary))" name="Count" />
                    </BarChart>
                  </ResponsiveContainer>
                </ChartContainer>
              </CardContent>
            </Card>
          </div>

          {/* Trend Analysis */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Incident Trends Over Time
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ChartContainer config={{}}>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={incidentData?.trends || []}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Legend />
                    <Line 
                      type="monotone" 
                      dataKey="incidents" 
                      stroke="hsl(var(--primary))" 
                      strokeWidth={2}
                      name="Total Incidents"
                    />
                    <Line 
                      type="monotone" 
                      dataKey="resolved" 
                      stroke="hsl(var(--success))" 
                      strokeWidth={2}
                      name="Resolved"
                    />
                    <Line 
                      type="monotone" 
                      dataKey="pending" 
                      stroke="hsl(var(--warning))" 
                      strokeWidth={2}
                      name="Pending"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </ChartContainer>
            </CardContent>
          </Card>

          {/* Staff Incidents Table */}
          <Card>
            <CardHeader>
              <CardTitle>Incidents by Staff Member</CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[300px]">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Staff Member</TableHead>
                      <TableHead className="text-center">Incident Count</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {incidentData?.byStaff && incidentData.byStaff.length > 0 ? (
                      incidentData.byStaff.map((staff) => (
                        <TableRow key={staff.staffId}>
                          <TableCell className="font-medium">{staff.staffName}</TableCell>
                          <TableCell className="text-center">
                            <Badge variant={staff.incidentCount > 5 ? "destructive" : "outline"}>
                              {staff.incidentCount}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={2} className="text-center text-muted-foreground py-8">
                          No staff incident data available
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </ScrollArea>
            </CardContent>
          </Card>

          {/* Client Incidents Table */}
          <Card>
            <CardHeader>
              <CardTitle>Incidents by Client</CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[300px]">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Client Name</TableHead>
                      <TableHead className="text-center">Incident Count</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {incidentData?.byClient && incidentData.byClient.length > 0 ? (
                      incidentData.byClient.map((client) => (
                        <TableRow key={client.clientId}>
                          <TableCell className="font-medium">{client.clientName}</TableCell>
                          <TableCell className="text-center">
                            <Badge variant={client.incidentCount > 5 ? "destructive" : "outline"}>
                              {client.incidentCount}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={2} className="text-center text-muted-foreground py-8">
                          No client incident data available
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </ScrollArea>
            </CardContent>
          </Card>

          {/* Recent Incidents Detail Table */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Incidents</CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[500px]">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Severity</TableHead>
                      <TableHead>Client</TableHead>
                      <TableHead>Staff</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-center">Resolution Time</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {incidentData?.recentIncidents && incidentData.recentIncidents.length > 0 ? (
                      incidentData.recentIncidents.map((incident) => (
                        <TableRow key={incident.id}>
                          <TableCell>{format(new Date(incident.date), 'MMM dd, yyyy')}</TableCell>
                          <TableCell>{incident.category}</TableCell>
                          <TableCell>{getSeverityBadge(incident.severity)}</TableCell>
                          <TableCell className="font-medium">{incident.clientName}</TableCell>
                          <TableCell>{incident.staffName}</TableCell>
                          <TableCell>{getStatusBadge(incident.status)}</TableCell>
                          <TableCell className="text-center">
                            {incident.resolutionTime ? (
                              <Badge variant="outline">{incident.resolutionTime} days</Badge>
                            ) : (
                              <span className="text-muted-foreground">-</span>
                            )}
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                          No incidents found for the selected date range
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </ScrollArea>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}

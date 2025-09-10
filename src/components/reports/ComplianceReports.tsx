
import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { DateRange } from "react-day-picker";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { Calendar, Download, FileText, Loader2 } from "lucide-react";
import { format, addDays } from "date-fns";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from "recharts";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useComplianceReportsData } from "@/hooks/useComplianceReportsData";
import { ReportExporter } from "@/utils/reportExporter";
import { toast } from "sonner";

interface ComplianceReportsProps {
  branchId: string;
  branchName: string;
}

const COLORS = ['#10b981', '#ef4444', '#f59e0b', '#3b82f6', '#8b5cf6'];

export function ComplianceReports({ branchId, branchName }: ComplianceReportsProps) {
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: addDays(new Date(), -30),
    to: new Date(),
  });

  const { data: complianceData, isLoading, error, refetch } = useComplianceReportsData({
    branchId,
    startDate: dateRange?.from ? format(dateRange.from, 'yyyy-MM-dd') : undefined,
    endDate: dateRange?.to ? format(dateRange.to, 'yyyy-MM-dd') : undefined,
  });

  const handleExport = (type: 'pdf' | 'csv' | 'excel') => {
    if (!complianceData) {
      toast.error("No data available to export");
      return;
    }

    try {
      const exportData = [
        ...complianceData.trainingCompliance.map(item => ({
          type: 'Training Compliance',
          name: item.name,
          compliant: item.compliant,
          noncompliant: item.noncompliant,
          total: item.compliant + item.noncompliant
        })),
        ...complianceData.incidentTypes.map(item => ({
          type: 'Incident Types',
          name: item.name,
          value: item.value,
          compliant: '',
          noncompliant: ''
        })),
        ...complianceData.carerPerformance.map(item => ({
          type: 'Carer Performance',
          name: item.carerName,
          missedCalls: item.missedCalls,
          lateArrivals: item.lateArrivals,
          reliabilityPercentage: item.reliabilityPercentage
        })),
        ...complianceData.medicationAdministration.map(item => ({
          type: 'Medication Administration',
          clientName: item.clientName,
          medicationName: item.medicationName,
          dosage: item.dosage,
          status: item.status,
          administeredAt: item.administeredAt
        }))
      ];

      const exportDateRange = dateRange?.from && dateRange?.to 
        ? { from: dateRange.from, to: dateRange.to }
        : null;

      const options = {
        title: 'Enhanced Compliance Reports',
        data: exportData,
        columns: ['type', 'name', 'compliant', 'noncompliant', 'value', 'missedCalls', 'lateArrivals', 'reliabilityPercentage', 'clientName', 'medicationName', 'dosage', 'status', 'administeredAt'],
        branchName,
        dateRange: exportDateRange,
        fileName: `Enhanced_Compliance_Report_${branchName}_${format(new Date(), 'yyyyMMdd')}`
      };

      if (type === 'pdf') {
        ReportExporter.exportToPDF(options);
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

  if (error) {
    return (
      <div className="text-center py-8">
        <p className="text-red-500">Error loading compliance reports data</p>
        <Button onClick={() => refetch()} className="mt-2">
          Try Again
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Controls */}
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
            <Button className="w-full sm:w-auto">
              <Download className="h-4 w-4 mr-2" />
              Export Report
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => handleExport('pdf')}>
              <FileText className="h-4 w-4 mr-2" />
              Export as PDF
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleExport('csv')}>
              <FileText className="h-4 w-4 mr-2" />
              Export as CSV
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleExport('excel')}>
              <FileText className="h-4 w-4 mr-2" />
              Export as Excel
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin mr-2" />
          <span>Loading compliance reports...</span>
        </div>
      ) : (
        <div id="compliance-reports-content" className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Training Compliance */}
          <Card>
            <CardHeader>
              <CardTitle>Training Compliance</CardTitle>
            </CardHeader>
            <CardContent>
              <ChartContainer config={{}}>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={complianceData?.trainingCompliance || []}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Bar dataKey="compliant" fill="#10b981" name="Compliant" />
                    <Bar dataKey="noncompliant" fill="#ef4444" name="Non-compliant" />
                  </BarChart>
                </ResponsiveContainer>
              </ChartContainer>
            </CardContent>
          </Card>

          {/* Incident Types */}
          <Card>            <CardHeader>
              <CardTitle>Incident Types</CardTitle>
            </CardHeader>
            <CardContent>
              <ChartContainer config={{}}>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={complianceData?.incidentTypes || []}
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                      label
                    >
                      {complianceData?.incidentTypes?.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <ChartTooltip content={<ChartTooltipContent />} />
                  </PieChart>
                </ResponsiveContainer>
              </ChartContainer>
            </CardContent>
          </Card>

          {/* Carer Performance */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Carer Performance & Attendance</CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-80">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Carer Name</TableHead>
                      <TableHead>Total Bookings</TableHead>
                      <TableHead>Missed Calls</TableHead>
                      <TableHead>Late Arrivals</TableHead>
                      <TableHead>Reliability %</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {complianceData?.carerPerformance?.map((carer, index) => (
                      <TableRow key={index}>
                        <TableCell className="font-medium">{carer.carerName}</TableCell>
                        <TableCell>{carer.totalBookings}</TableCell>
                        <TableCell>
                          <Badge variant={carer.missedCalls > 0 ? "destructive" : "secondary"}>
                            {carer.missedCalls}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant={carer.lateArrivals > 0 ? "destructive" : "secondary"}>
                            {carer.lateArrivals}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant={carer.reliabilityPercentage >= 95 ? "default" : carer.reliabilityPercentage >= 85 ? "secondary" : "destructive"}>
                            {carer.reliabilityPercentage}%
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </ScrollArea>
            </CardContent>
          </Card>

          {/* Medication Summary */}
          <Card>
            <CardHeader>
              <CardTitle>Medication Administration Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Total Medications:</span>
                  <Badge variant="outline">{complianceData?.medicationSummary?.totalMedications || 0}</Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Administered:</span>
                  <Badge variant="default">{complianceData?.medicationSummary?.administeredCount || 0}</Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Missed:</span>
                  <Badge variant="destructive">{complianceData?.medicationSummary?.missedCount || 0}</Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Administration Rate:</span>
                  <Badge variant={
                    (complianceData?.medicationSummary?.administrationRate || 0) >= 95 ? "default" :
                    (complianceData?.medicationSummary?.administrationRate || 0) >= 85 ? "secondary" : "destructive"
                  }>
                    {complianceData?.medicationSummary?.administrationRate || 0}%
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Detailed Medication Administration */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Medication Administration</CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-80">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Client</TableHead>
                      <TableHead>Medication</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Administered By</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {complianceData?.medicationAdministration?.slice(0, 10).map((med, index) => (
                      <TableRow key={index}>
                        <TableCell className="font-medium">{med.clientName}</TableCell>
                        <TableCell>{med.medicationName} ({med.dosage})</TableCell>
                        <TableCell>
                          <Badge variant={med.status === 'Administered' ? "default" : "destructive"}>
                            {med.status}
                          </Badge>
                        </TableCell>
                        <TableCell>{med.administeredByName || 'N/A'}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </ScrollArea>
            </CardContent>
          </Card>

          {/* Compliance Trends */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Incident Trends Over Time</CardTitle>
            </CardHeader>
            <CardContent>
              <ChartContainer config={{}}>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={complianceData?.complianceTrends || []}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Line type="monotone" dataKey="incidents" stroke="#ef4444" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              </ChartContainer>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}

import React, { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Loader2, Download, TrendingUp, Users, AlertTriangle, CheckCircle, Activity, Pill } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, ResponsiveContainer, BarChart, Bar, Legend } from "recharts";
import { useClientComplianceMatrix } from "@/hooks/useClientComplianceMatrix";
import { ReportExporter } from "@/utils/reportExporter";
import { toast } from "sonner";
import { format } from "date-fns";

interface ClientComplianceReportProps {
  branchId: string;
  branchName: string;
}

type FilterLevel = "all" | "compliant" | "at-risk" | "non-compliant";

export function ClientComplianceReport({ branchId, branchName }: ClientComplianceReportProps) {
  const [filterLevel, setFilterLevel] = useState<FilterLevel>("all");
  
  const { data: matrixData, isLoading, error, refetch } = useClientComplianceMatrix({
    branchId,
  });

  // Filter client rows based on selected compliance level
  const filteredClientRows = useMemo(() => {
    if (!matrixData?.clientRows) return [];
    if (filterLevel === "all") return matrixData.clientRows;
    return matrixData.clientRows.filter((row) => row.complianceLevel === filterLevel);
  }, [matrixData?.clientRows, filterLevel]);

  const handleExport = async (type: 'pdf' | 'csv' | 'excel') => {
    if (!matrixData) {
      toast.error("No data available to export");
      return;
    }

    try {
      const exportData = filteredClientRows.map((row) => ({
        'Client Name': row.clientName,
        'Medication Compliance %': row.medicationCompliancePercentage,
        'Visit Compliance %': row.visitCompliancePercentage,
        'Appointment Adherence %': row.appointmentAdherencePercentage,
        'Health Monitoring %': row.healthMonitoringPercentage,
        'Total Visits': row.totalVisits,
        'Completed Visits': row.completedVisits,
        'Missed Medications': row.missedMedications,
        'Missed Appointments': row.missedAppointments,
        'Overall Score': row.overallScore,
        'Compliance Level': row.complianceLevel,
      }));

      const options = {
        title: 'Client Compliance Matrix Report',
        data: exportData,
        columns: [
          'Client Name',
          'Medication Compliance %',
          'Visit Compliance %',
          'Appointment Adherence %',
          'Health Monitoring %',
          'Total Visits',
          'Completed Visits',
          'Missed Medications',
          'Missed Appointments',
          'Overall Score',
          'Compliance Level',
        ],
        branchName,
        fileName: `Client_Compliance_Matrix_${branchName}_${format(new Date(), 'yyyyMMdd')}`,
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

  const getScoreBadge = (score: number) => {
    if (score >= 85) {
      return <Badge variant="default" className="bg-success text-success-foreground">{score}%</Badge>;
    } else if (score >= 70) {
      return <Badge variant="secondary" className="bg-warning text-warning-foreground">{score}%</Badge>;
    } else {
      return <Badge variant="destructive">{score}%</Badge>;
    }
  };

  if (error) {
    return (
      <div className="text-center py-8">
        <p className="text-destructive">Error loading client compliance matrix</p>
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
              <SelectItem value="all">All Clients</SelectItem>
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
                    <p className="text-sm font-medium text-muted-foreground">Total Clients</p>
                    <p className="text-2xl font-bold">{matrixData?.summary.totalClients || 0}</p>
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
                    <p className="text-2xl font-bold text-success">{matrixData?.summary.compliantClients || 0}</p>
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
                    <p className="text-2xl font-bold text-warning">{matrixData?.summary.atRiskClients || 0}</p>
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
                    <p className="text-2xl font-bold text-destructive">{matrixData?.summary.nonCompliantClients || 0}</p>
                  </div>
                  <AlertTriangle className="h-8 w-8 text-destructive" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Additional Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Visits Completed</p>
                    <p className="text-2xl font-bold">{matrixData?.summary.totalVisitsCompleted || 0}</p>
                  </div>
                  <Activity className="h-8 w-8 text-primary" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Visits Missed</p>
                    <p className="text-2xl font-bold text-destructive">{matrixData?.summary.totalVisitsMissed || 0}</p>
                  </div>
                  <AlertTriangle className="h-8 w-8 text-destructive" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Medications Given</p>
                    <p className="text-2xl font-bold">{matrixData?.summary.totalMedicationAdministrations || 0}</p>
                  </div>
                  <Pill className="h-8 w-8 text-primary" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Medications Missed</p>
                    <p className="text-2xl font-bold text-destructive">{matrixData?.summary.totalMissedMedications || 0}</p>
                  </div>
                  <AlertTriangle className="h-8 w-8 text-destructive" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Compliance Trends */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Compliance Trends (Last 6 Months)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ChartContainer config={{}}>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={matrixData?.trends || []}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis domain={[0, 100]} />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Legend />
                    <Line 
                      type="monotone" 
                      dataKey="averageScore" 
                      stroke="hsl(var(--primary))" 
                      strokeWidth={2}
                      name="Overall Score"
                    />
                    <Line 
                      type="monotone" 
                      dataKey="medicationCompliance" 
                      stroke="hsl(var(--success))" 
                      strokeWidth={2}
                      name="Medication Compliance"
                    />
                    <Line 
                      type="monotone" 
                      dataKey="visitCompliance" 
                      stroke="hsl(var(--warning))" 
                      strokeWidth={2}
                      name="Visit Compliance"
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
                      { name: 'Compliant', value: matrixData?.summary.compliantClients || 0 },
                      { name: 'At Risk', value: matrixData?.summary.atRiskClients || 0 },
                      { name: 'Non-Compliant', value: matrixData?.summary.nonCompliantClients || 0 },
                    ]}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Bar dataKey="value" fill="hsl(var(--primary))" name="Client Count" />
                  </BarChart>
                </ResponsiveContainer>
              </ChartContainer>
            </CardContent>
          </Card>

          {/* Client Compliance Matrix Table */}
          <Card>
            <CardHeader>
              <CardTitle>
                Client Compliance Matrix
                {filterLevel !== "all" && (
                  <span className="ml-2 text-sm font-normal text-muted-foreground">
                    (Filtered: {filteredClientRows.length} of {matrixData?.summary.totalClients || 0})
                  </span>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[500px]">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Client Name</TableHead>
                      <TableHead className="text-center">Medication</TableHead>
                      <TableHead className="text-center">Visits</TableHead>
                      <TableHead className="text-center">Appointments</TableHead>
                      <TableHead className="text-center">Health Monitoring</TableHead>
                      <TableHead className="text-center">Missed Meds</TableHead>
                      <TableHead className="text-center">Missed Appts</TableHead>
                      <TableHead className="text-center">Overall Score</TableHead>
                      <TableHead className="text-center">Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredClientRows.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={9} className="text-center text-muted-foreground py-8">
                          No clients found matching the selected filter
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredClientRows.map((client) => (
                        <TableRow key={client.clientId}>
                          <TableCell className="font-medium">{client.clientName}</TableCell>
                          <TableCell className="text-center">
                            <Badge
                              variant={
                                client.medicationCompliancePercentage >= 90
                                  ? "default"
                                  : client.medicationCompliancePercentage >= 70
                                  ? "secondary"
                                  : "destructive"
                              }
                            >
                              {client.medicationCompliancePercentage}%
                            </Badge>
                          </TableCell>
                          <TableCell className="text-center">
                            <Badge
                              variant={
                                client.visitCompliancePercentage >= 90
                                  ? "default"
                                  : client.visitCompliancePercentage >= 70
                                  ? "secondary"
                                  : "destructive"
                              }
                            >
                              {client.visitCompliancePercentage}%
                            </Badge>
                          </TableCell>
                          <TableCell className="text-center">
                            <Badge
                              variant={
                                client.appointmentAdherencePercentage >= 90
                                  ? "default"
                                  : client.appointmentAdherencePercentage >= 70
                                  ? "secondary"
                                  : "destructive"
                              }
                            >
                              {client.appointmentAdherencePercentage}%
                            </Badge>
                          </TableCell>
                          <TableCell className="text-center">
                            <Badge
                              variant={
                                client.healthMonitoringPercentage >= 90
                                  ? "default"
                                  : client.healthMonitoringPercentage >= 70
                                  ? "secondary"
                                  : "destructive"
                              }
                            >
                              {client.healthMonitoringPercentage}%
                            </Badge>
                          </TableCell>
                          <TableCell className="text-center">
                            <Badge variant={client.missedMedications > 0 ? "destructive" : "outline"}>
                              {client.missedMedications}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-center">
                            <Badge variant={client.missedAppointments > 0 ? "destructive" : "outline"}>
                              {client.missedAppointments}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-center">{getScoreBadge(client.overallScore)}</TableCell>
                          <TableCell className="text-center">{getComplianceBadge(client.complianceLevel)}</TableCell>
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
    </div>
  );
}

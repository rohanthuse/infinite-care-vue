import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Loader2, Download, TrendingDown, CalendarX, Clock, Users } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, ResponsiveContainer, BarChart, Bar, Legend, PieChart, Pie, Cell } from "recharts";
import { useMissedCallsData } from "@/hooks/useMissedCallsData";
import { useLateArrivalsData } from "@/hooks/useLateArrivalsData";
import { ReportExporter } from "@/utils/reportExporter";
import { toast } from "sonner";
import { format, addDays } from "date-fns";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { Calendar } from "lucide-react";
import { DateRange } from "react-day-picker";
import { ReasonTrendChart } from "@/components/reports/analytics/ReasonTrendChart";
import { ReasonBreakdownCard } from "@/components/reports/analytics/ReasonBreakdownCard";
import { ExpandableTableRow } from "@/components/reports/shared/ExpandableTableRow";
import { StaffPerformanceDrillDown } from "@/components/reports/analytics/StaffPerformanceDrillDown";

interface MissedCallsLateArrivalsReportProps {
  branchId: string;
  branchName: string;
}

const REASON_COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

export function MissedCallsLateArrivalsReport({ branchId, branchName }: MissedCallsLateArrivalsReportProps) {
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: addDays(new Date(), -90),
    to: new Date(),
  });

  const { data: missedCallsData, isLoading: isMissedLoading, error: missedError, refetch: refetchMissed } = useMissedCallsData({
    branchId,
    startDate: dateRange?.from ? format(dateRange.from, 'yyyy-MM-dd') : undefined,
    endDate: dateRange?.to ? format(dateRange.to, 'yyyy-MM-dd') : undefined,
  });

  const { data: lateArrivalsData, isLoading: isLateLoading, error: lateError, refetch: refetchLate } = useLateArrivalsData({
    branchId,
    startDate: dateRange?.from ? format(dateRange.from, 'yyyy-MM-dd') : undefined,
    endDate: dateRange?.to ? format(dateRange.to, 'yyyy-MM-dd') : undefined,
  });

  const handleExportMissedCalls = async (type: 'pdf' | 'csv' | 'excel') => {
    if (!missedCallsData) {
      toast.error("No data available to export");
      return;
    }

    try {
      const exportData = missedCallsData.recentMissedCalls.map((call) => ({
        'Date': call.scheduledDate,
        'Time': call.scheduledTime,
        'Staff': call.staffName,
        'Client': call.clientName,
        'Reason': call.reason,
        'Status': call.status,
      }));

      const options = {
        title: 'Missed Calls Report',
        data: exportData,
        columns: ['Date', 'Time', 'Staff', 'Client', 'Reason', 'Status'],
        branchName,
        dateRange: dateRange?.from && dateRange?.to ? { from: dateRange.from, to: dateRange.to } : null,
        fileName: `Missed_Calls_Report_${branchName}_${format(new Date(), 'yyyyMMdd')}`,
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

  const handleExportLateArrivals = async (type: 'pdf' | 'csv' | 'excel') => {
    if (!lateArrivalsData) {
      toast.error("No data available to export");
      return;
    }

    try {
      const exportData = lateArrivalsData.recentLateArrivals.map((arrival) => ({
        'Date': arrival.date,
        'Staff': arrival.staffName,
        'Client': arrival.clientName,
        'Scheduled': arrival.scheduledTime,
        'Actual': arrival.actualArrivalTime,
        'Minutes Late': arrival.minutesLate,
      }));

      const options = {
        title: 'Late Arrivals Report',
        data: exportData,
        columns: ['Date', 'Staff', 'Client', 'Scheduled', 'Actual', 'Minutes Late'],
        branchName,
        dateRange: dateRange?.from && dateRange?.to ? { from: dateRange.from, to: dateRange.to } : null,
        fileName: `Late_Arrivals_Report_${branchName}_${format(new Date(), 'yyyyMMdd')}`,
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

  if (missedError || lateError) {
    return (
      <div className="text-center py-8">
        <p className="text-destructive">Error loading reports</p>
        <div className="flex gap-2 justify-center mt-2">
          <Button onClick={() => refetchMissed()}>Retry Missed Bookings</Button>
          <Button onClick={() => refetchLate()}>Retry Late Arrivals</Button>
        </div>
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
                    {format(dateRange.from, "LLL dd, y")} - {format(dateRange.to, "LLL dd, y")}
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
      </div>

      <Tabs defaultValue="missed-bookings" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="missed-bookings">
            <CalendarX className="h-4 w-4 mr-2" />
            Missed Bookings
          </TabsTrigger>
          <TabsTrigger value="late-arrivals">
            <Clock className="h-4 w-4 mr-2" />
            Late Arrivals
          </TabsTrigger>
        </TabsList>

        {/* Missed Bookings Tab */}
        <TabsContent value="missed-bookings" className="space-y-6">
          {isMissedLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin mr-2" />
              <span>Loading missed bookings data...</span>
            </div>
          ) : (
            <>
              {/* Summary Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Total Missed</p>
                        <p className="text-2xl font-bold text-destructive">{missedCallsData?.summary.totalMissedCalls || 0}</p>
                      </div>
                      <CalendarX className="h-8 w-8 text-destructive" />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Total Bookings</p>
                        <p className="text-2xl font-bold">{missedCallsData?.summary.totalBookings || 0}</p>
                      </div>
                      <Users className="h-8 w-8 text-primary" />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Miss Rate</p>
                        <p className="text-2xl font-bold text-warning">{missedCallsData?.summary.missRate || 0}%</p>
                      </div>
                      <TrendingDown className="h-8 w-8 text-warning" />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="pt-6">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground mb-2">Top Staff</p>
                      <p className="text-sm font-semibold">{missedCallsData?.summary.topStaffWithMissedCalls || 'N/A'}</p>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <div className="flex justify-end">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button>
                      <Download className="h-4 w-4 mr-2" />
                      Export Missed Bookings
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => handleExportMissedCalls('pdf')}>Export as PDF</DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleExportMissedCalls('csv')}>Export as CSV</DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleExportMissedCalls('excel')}>Export as Excel</DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              {/* Reason Trend Chart */}
              <ReasonTrendChart 
                data={missedCallsData?.reasonTrends || []}
                title="Cancellation Reasons Over Time"
              />

              {/* Reason Breakdown */}
              <ReasonBreakdownCard 
                data={missedCallsData?.byReason || []}
                title="Cancellation Reasons"
              />

              {/* Charts */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Missed Bookings Trend</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ChartContainer config={{}}>
                      <ResponsiveContainer width="100%" height={300}>
                        <LineChart data={missedCallsData?.trends || []}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="month" />
                          <YAxis />
                          <ChartTooltip content={<ChartTooltipContent />} />
                          <Legend />
                          <Line type="monotone" dataKey="missedCalls" stroke="hsl(var(--destructive))" strokeWidth={2} name="Missed" />
                          <Line type="monotone" dataKey="totalBookings" stroke="hsl(var(--primary))" strokeWidth={2} name="Total" />
                        </LineChart>
                      </ResponsiveContainer>
                    </ChartContainer>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Top Reasons</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ChartContainer config={{}}>
                      <ResponsiveContainer width="100%" height={300}>
                        <PieChart>
                          <Pie
                            data={missedCallsData?.byReason.slice(0, 5) || []}
                            cx="50%"
                            cy="50%"
                            labelLine={true}
                            label={({ reason, count }) => `${count}`}
                            outerRadius={100}
                            fill="#8884d8"
                            dataKey="count"
                            nameKey="reason"
                          >
                            {(missedCallsData?.byReason.slice(0, 5) || []).map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={REASON_COLORS[index % REASON_COLORS.length]} />
                            ))}
                          </Pie>
                          <ChartTooltip content={<ChartTooltipContent />} />
                          <Legend />
                        </PieChart>
                      </ResponsiveContainer>
                    </ChartContainer>
                  </CardContent>
                </Card>
              </div>

              {/* Staff Table with Drill-Down */}
              <Card>
                <CardHeader>
                  <CardTitle>Missed Bookings by Staff (Click to Expand)</CardTitle>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-[500px]">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-12"></TableHead>
                          <TableHead>Staff Member</TableHead>
                          <TableHead className="text-center">Missed Bookings</TableHead>
                          <TableHead className="text-center">Reliability Rate</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {missedCallsData?.byStaff && missedCallsData.byStaff.length > 0 ? (
                          missedCallsData.byStaff.map((staff) => {
                            const staffTrends = (missedCallsData.trends || []).map(trend => ({
                              month: trend.month,
                              count: 0, // Would need individual staff trend data
                              branchAverage: trend.missedCalls / (missedCallsData.byStaff.length || 1)
                            }));
                            const avgMissedCalls = missedCallsData.summary.totalMissedCalls / (missedCallsData.byStaff.length || 1);

                            return (
                              <ExpandableTableRow
                                key={staff.staffId}
                                expandedContent={
                                  <StaffPerformanceDrillDown
                                    staffName={staff.staffName}
                                    trendData={staffTrends}
                                    currentCount={staff.missedCallsCount}
                                    averageCount={avgMissedCalls}
                                    type="missed-calls"
                                  />
                                }
                              >
                                <TableCell className="font-medium">{staff.staffName}</TableCell>
                                <TableCell className="text-center">
                                  <Badge variant={staff.missedCallsCount > 5 ? "destructive" : "secondary"}>
                                    {staff.missedCallsCount}
                                  </Badge>
                                </TableCell>
                                <TableCell className="text-center">
                                  <Badge variant={staff.reliabilityRate >= 95 ? "default" : staff.reliabilityRate >= 85 ? "secondary" : "destructive"}>
                                    {staff.reliabilityRate}%
                                  </Badge>
                                </TableCell>
                              </ExpandableTableRow>
                            );
                          })
                        ) : (
                          <TableRow>
                            <TableCell colSpan={4} className="text-center text-muted-foreground py-8">
                              No missed bookings data available
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
        </TabsContent>

        {/* Late Arrivals Tab */}
        <TabsContent value="late-arrivals" className="space-y-6">
          {isLateLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin mr-2" />
              <span>Loading late arrivals data...</span>
            </div>
          ) : (
            <>
              {/* Summary Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Total Late</p>
                        <p className="text-2xl font-bold text-warning">{lateArrivalsData?.summary.totalLateArrivals || 0}</p>
                      </div>
                      <Clock className="h-8 w-8 text-warning" />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Total Visits</p>
                        <p className="text-2xl font-bold">{lateArrivalsData?.summary.totalVisits || 0}</p>
                      </div>
                      <Users className="h-8 w-8 text-primary" />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Late Rate</p>
                        <p className="text-2xl font-bold text-destructive">{lateArrivalsData?.summary.lateRate || 0}%</p>
                      </div>
                      <TrendingDown className="h-8 w-8 text-destructive" />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="pt-6">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground mb-2">Avg Minutes Late</p>
                      <p className="text-2xl font-bold">{lateArrivalsData?.summary.averageMinutesLate || 0} min</p>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <div className="flex justify-end">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button>
                      <Download className="h-4 w-4 mr-2" />
                      Export Late Arrivals
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => handleExportLateArrivals('pdf')}>Export as PDF</DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleExportLateArrivals('csv')}>Export as CSV</DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleExportLateArrivals('excel')}>Export as Excel</DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              {/* Reason Trend Chart */}
              <ReasonTrendChart 
                data={lateArrivalsData?.reasonTrends || []}
                title="Late Arrival Reasons Over Time"
              />

              {/* Reason Breakdown */}
              <ReasonBreakdownCard 
                data={lateArrivalsData?.byReason || []}
                title="Late Arrival Reasons"
                showPercentages={true}
              />

              {/* Charts */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Late Arrivals Trend</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ChartContainer config={{}}>
                      <ResponsiveContainer width="100%" height={300}>
                        <LineChart data={lateArrivalsData?.trends || []}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="month" />
                          <YAxis />
                          <ChartTooltip content={<ChartTooltipContent />} />
                          <Legend />
                          <Line type="monotone" dataKey="lateArrivals" stroke="hsl(var(--warning))" strokeWidth={2} name="Late" />
                          <Line type="monotone" dataKey="totalVisits" stroke="hsl(var(--primary))" strokeWidth={2} name="Total" />
                        </LineChart>
                      </ResponsiveContainer>
                    </ChartContainer>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Punctuality by Staff</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ChartContainer config={{}}>
                      <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={lateArrivalsData?.byStaff.slice(0, 5) || []} layout="vertical">
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis type="number" domain={[0, 100]} />
                          <YAxis dataKey="staffName" type="category" width={100} />
                          <ChartTooltip content={<ChartTooltipContent />} />
                          <Bar dataKey="punctualityRate" fill="hsl(var(--success))" name="Punctuality %" />
                        </BarChart>
                      </ResponsiveContainer>
                    </ChartContainer>
                  </CardContent>
                </Card>
              </div>

              {/* Staff Table with Drill-Down */}
              <Card>
                <CardHeader>
                  <CardTitle>Late Arrivals by Staff (Click to Expand)</CardTitle>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-[500px]">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-12"></TableHead>
                          <TableHead>Staff Member</TableHead>
                          <TableHead className="text-center">Late Count</TableHead>
                          <TableHead className="text-center">Avg Minutes Late</TableHead>
                          <TableHead className="text-center">Punctuality Rate</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {lateArrivalsData?.byStaff && lateArrivalsData.byStaff.length > 0 ? (
                          lateArrivalsData.byStaff.map((staff) => {
                            const staffTrends = (lateArrivalsData.trends || []).map(trend => ({
                              month: trend.month,
                              count: 0, // Would need individual staff trend data
                              branchAverage: trend.lateArrivals / (lateArrivalsData.byStaff.length || 1)
                            }));
                            const avgLateArrivals = lateArrivalsData.summary.totalLateArrivals / (lateArrivalsData.byStaff.length || 1);

                            return (
                              <ExpandableTableRow
                                key={staff.staffId}
                                expandedContent={
                                  <StaffPerformanceDrillDown
                                    staffName={staff.staffName}
                                    trendData={staffTrends}
                                    currentCount={staff.lateArrivalsCount}
                                    averageCount={avgLateArrivals}
                                    type="late-arrivals"
                                  />
                                }
                              >
                                <TableCell className="font-medium">{staff.staffName}</TableCell>
                                <TableCell className="text-center">
                                  <Badge variant={staff.lateArrivalsCount > 5 ? "destructive" : "secondary"}>
                                    {staff.lateArrivalsCount}
                                  </Badge>
                                </TableCell>
                                <TableCell className="text-center">{staff.averageMinutesLate} min</TableCell>
                                <TableCell className="text-center">
                                  <Badge variant={staff.punctualityRate >= 95 ? "default" : staff.punctualityRate >= 85 ? "secondary" : "destructive"}>
                                    {staff.punctualityRate}%
                                  </Badge>
                                </TableCell>
                              </ExpandableTableRow>
                            );
                          })
                        ) : (
                          <TableRow>
                            <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                              No late arrivals data available
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
        </TabsContent>
      </Tabs>
    </div>
  );
}

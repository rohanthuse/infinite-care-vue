import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { 
  LineChart, Line, AreaChart, Area, BarChart, Bar, PieChart, Pie, 
  XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, Cell, ResponsiveContainer 
} from "recharts";
import { ChartContainer } from "@/components/ui/chart";
import { Calendar, Clock, BarChart as BarChartIcon, Users, TrendingUp, CheckSquare, Download, Loader2, Info } from "lucide-react";
import { useClientServiceReports } from "@/hooks/useClientServiceReports";
import { useClientAppointments } from "@/hooks/useClientAppointments";
import { useClientServiceActions } from "@/hooks/useClientServiceActions";
import { useClientAuth } from "@/hooks/useClientAuth";
import { format } from "date-fns";

const ClientServiceReports = () => {
  const [timeFilter, setTimeFilter] = useState("month");
  const [serviceFilter, setServiceFilter] = useState("all");
  
  // Get authenticated client data
  const { clientId, isAuthenticated, loading: authLoading } = useClientAuth();
  
  const { data: reportData, isLoading, error } = useClientServiceReports(clientId || "", timeFilter, serviceFilter);
  const { data: appointments } = useClientAppointments(clientId || "");
  const { data: serviceActions } = useClientServiceActions(clientId || "");
  
  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];
  
  const formatDate = (dateStr: string) => {
    try {
      return format(new Date(dateStr), 'MMM dd, yyyy');
    } catch {
      return dateStr;
    }
  };

  const handleExport = () => {
    // Create a simple CSV export
    if (!reportData) return;
    
    const csvData = [
      ['Service Reports Export'],
      ['Generated on:', new Date().toLocaleDateString()],
      ['Time Filter:', timeFilter],
      ['Service Filter:', serviceFilter],
      [''],
      ['Service Type Distribution:'],
      ['Service Type', 'Count'],
      ...reportData.serviceTypeData.map(item => [item.name, item.value.toString()]),
      [''],
      ['Progress Data:'],
      ['Period', 'Progress %'],
      ...reportData.progressData.map(item => [item.month, item.progress.toString()]),
    ];
    
    const csvContent = csvData.map(row => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `service_reports_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Helper function to determine if progress data is based on real goals
  const hasRealProgressData = () => {
    if (!reportData?.progressData) return false;
    // Check if progress values show realistic goal-based progression
    const progressValues = reportData.progressData.map(item => item.progress);
    const hasVariation = Math.max(...progressValues) - Math.min(...progressValues) > 5;
    const hasReasonableValues = progressValues.some(val => val > 0 && val < 100);
    return hasVariation && hasReasonableValues;
  };
  
  if (authLoading || isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin mr-2" />
        <span className="text-foreground">Loading your service reports...</span>
      </div>
    );
  }

  if (!isAuthenticated || !clientId) {
    return (
      <div className="text-center py-8">
        <p className="text-red-500">Authentication required to view service reports</p>
        <Button onClick={() => window.location.href = '/client-login'} className="mt-2">
          Login
        </Button>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <p className="text-red-500">Error loading service reports</p>
        <Button onClick={() => window.location.reload()} className="mt-2">
          Try Again
        </Button>
      </div>
    );
  }

  if (!reportData) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">No service data available</p>
      </div>
    );
  }

  return (
    <TooltipProvider>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Service Reports</h1>
            <p className="text-muted-foreground">Review your completed service history and outcomes</p>
          </div>
          <div className="flex gap-2">
            <Select value={timeFilter} onValueChange={setTimeFilter}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Select period" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="week">This Week</SelectItem>
                <SelectItem value="month">This Month</SelectItem>
                <SelectItem value="quarter">This Quarter</SelectItem>
                <SelectItem value="year">This Year</SelectItem>
              </SelectContent>
            </Select>
            
            <Select value={serviceFilter} onValueChange={setServiceFilter}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Select service" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Services</SelectItem>
                <SelectItem value="therapy">Therapy</SelectItem>
                <SelectItem value="check-in">Check-ins</SelectItem>
                <SelectItem value="specialist">Specialist</SelectItem>
              </SelectContent>
            </Select>

            <Button onClick={handleExport} variant="outline" size="sm">
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
          </div>
        </div>
        
        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="mb-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="progress">Progress</TabsTrigger>
            <TabsTrigger value="details">Service Details</TabsTrigger>
          </TabsList>
          
          <TabsContent value="overview">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Service Type Distribution */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Service Type Distribution</CardTitle>
                  <CardDescription>Breakdown of services by type ({timeFilter})</CardDescription>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="h-[300px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <ChartContainer 
                        config={{
                          primary: { color: "#0088FE" },
                        }}
                      >
                        <PieChart>
                          <Pie
                            data={reportData.serviceTypeData}
                            cx="50%"
                            cy="50%"
                            labelLine={true}
                            outerRadius={100}
                            fill="#8884d8"
                            dataKey="value"
                            label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                          >
                            {reportData.serviceTypeData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                          </Pie>
                          <RechartsTooltip formatter={(value) => [`${value} services`, 'Count']} />
                          <Legend />
                        </PieChart>
                      </ChartContainer>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
              
              {/* Overall Progress */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    Care Plan Progress
                    {!hasRealProgressData() && (
                      <Tooltip>
                        <TooltipTrigger>
                          <Info className="h-4 w-4 text-amber-500" />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Limited progress data available</p>
                        </TooltipContent>
                      </Tooltip>
                    )}
                  </CardTitle>
                  <CardDescription>
                    {timeFilter === 'week' ? 'Daily' : 
                     timeFilter === 'quarter' ? 'Monthly' : 
                     timeFilter === 'year' ? 'Monthly' : 'Daily'} progress on your care plan goals
                    {!hasRealProgressData() && (
                      <span className="text-amber-600 dark:text-amber-400 text-xs block mt-1">
                        * Limited goal data - showing estimated progression
                      </span>
                    )}
                  </CardDescription>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="h-[300px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <ChartContainer
                        config={{
                          progress: { color: "#0088FE" },
                        }}
                      >
                        <AreaChart
                          data={reportData.progressData}
                          margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
                        >
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="month" />
                          <YAxis domain={[0, 100]} />
                          <RechartsTooltip formatter={(value) => [`${value}%`, 'Progress']} />
                          <Area 
                            type="monotone" 
                            dataKey="progress" 
                            stroke="var(--color-progress)" 
                            fill="var(--color-progress)" 
                            fillOpacity={0.3}
                          />
                        </AreaChart>
                      </ChartContainer>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
          
          <TabsContent value="progress">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Progress Timeline</CardTitle>
                <CardDescription>Detailed view of your progress over time</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[400px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <ChartContainer
                      config={{
                        goals: { color: "#0088FE" },
                        completed: { color: "#00C49F" },
                      }}
                    >
                      <BarChart
                        data={reportData.serviceUtilization}
                        margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="date" tickFormatter={(value) => formatDate(value)} />
                        <YAxis />
                        <RechartsTooltip />
                        <Legend />
                        <Bar dataKey="goals" name="Goals Set" fill="var(--color-goals)" />
                        <Bar dataKey="completed" name="Goals Completed" fill="var(--color-completed)" />
                      </BarChart>
                    </ChartContainer>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="details">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Service Details</CardTitle>
                <CardDescription>Detailed breakdown of your recent services</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {reportData.serviceUtilization.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <BarChartIcon className="h-12 w-12 mx-auto mb-3 text-muted-foreground/50" />
                      <p className="text-sm">No service data available for the selected period</p>
                    </div>
                  ) : (
                    reportData.serviceUtilization.map((service, i) => (
                      <div key={i} className="p-4 border border-border rounded-lg hover:shadow-md transition-all">
                        <div className="flex flex-col md:flex-row justify-between mb-4">
                          <div className="flex items-center">
                            <div className="bg-blue-100 dark:bg-blue-950/30 p-2 rounded-full mr-3">
                              {service.type === "Therapy" ? (
                                <Users className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                              ) : service.type === "Check-in" ? (
                                <Clock className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                              ) : (
                                <BarChartIcon className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                              )}
                            </div>
                            <div>
                              <h3 className="font-medium text-foreground">{service.type} Session</h3>
                              <p className="text-sm text-muted-foreground flex items-center">
                                <Calendar className="inline h-3.5 w-3.5 mr-1.5" />
                                {formatDate(service.date)}
                                <Clock className="inline h-3.5 w-3.5 mx-1.5" />
                                {service.duration} minutes
                              </p>
                            </div>
                          </div>
                          <div className="mt-2 md:mt-0">
                            <Badge className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300 border-0">
                              {service.completed}/{service.goals} Goals {service.goals === 1 ? 'Completed' : 'Completed'}
                            </Badge>
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                          <div className="bg-muted/50 dark:bg-muted/30 p-3 rounded-md">
                            <div className="font-medium text-foreground">Progress</div>
                            <div className="flex items-center mt-1 text-muted-foreground">
                              <TrendingUp className="h-4 w-4 mr-2 text-green-600 dark:text-green-400" />
                              {service.goals > 0 ? Math.round((service.completed / service.goals) * 100) : 0}% of goals achieved
                            </div>
                          </div>
                          
                          <div className="bg-muted/50 dark:bg-muted/30 p-3 rounded-md">
                            <div className="font-medium text-foreground">Focus Areas</div>
                            <div className="flex items-center mt-1 text-muted-foreground">
                              <CheckSquare className="h-4 w-4 mr-2 text-blue-600 dark:text-blue-400" />
                              {service.type === "Therapy" ? "Mobility & Strength" : 
                               service.type === "Check-in" ? "Vital Signs & Wellness" : 
                               "Specialized Assessment"}
                            </div>
                          </div>
                          
                          <div className="bg-muted/50 dark:bg-muted/30 p-3 rounded-md">
                            <div className="font-medium text-foreground">Outcome</div>
                            <div className="flex items-center mt-1 text-muted-foreground">
                              <CheckSquare className="h-4 w-4 mr-2 text-green-600 dark:text-green-400" />
                              {service.completed === service.goals ? "All goals met" : 
                               service.completed > (service.goals / 2) ? "Good progress" : 
                               "In progress"}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </TooltipProvider>
  );
};

export default ClientServiceReports;

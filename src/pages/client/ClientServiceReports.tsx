
import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { 
  LineChart, Line, AreaChart, Area, BarChart, Bar, PieChart, Pie, 
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, Cell, ResponsiveContainer 
} from "recharts";
import { ChartContainer } from "@/components/ui/chart";
import { Calendar, Clock, BarChart as BarChartIcon, Users, TrendingUp, CheckSquare } from "lucide-react";

const ClientServiceReports = () => {
  const [timeFilter, setTimeFilter] = useState("month");
  const [serviceFilter, setServiceFilter] = useState("all");
  
  // Mock data for service reports
  const serviceUtilizationData = [
    { date: "May 1", duration: 60, type: "Therapy", goals: 3, completed: 2 },
    { date: "May 8", duration: 45, type: "Check-in", goals: 2, completed: 2 },
    { date: "May 15", duration: 60, type: "Therapy", goals: 4, completed: 3 },
    { date: "May 22", duration: 45, type: "Check-in", goals: 2, completed: 2 },
    { date: "May 29", duration: 60, type: "Specialist", goals: 5, completed: 4 },
  ];
  
  const progressData = [
    { month: "Jan", progress: 65 },
    { month: "Feb", progress: 70 },
    { month: "Mar", progress: 75 },
    { month: "Apr", progress: 80 },
    { month: "May", progress: 85 },
  ];
  
  const serviceTypeData = [
    { name: "Therapy", value: 45 },
    { name: "Check-in", value: 30 },
    { name: "Specialist", value: 15 },
    { name: "Other", value: 10 },
  ];
  
  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];
  
  const formatDate = (dateStr: string) => {
    return dateStr; // In real app, would format based on locale
  };
  
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold">Service Reports</h1>
          <p className="text-gray-500">Review your completed service history and outcomes</p>
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
              <SelectItem value="checkin">Check-ins</SelectItem>
              <SelectItem value="specialist">Specialist</SelectItem>
            </SelectContent>
          </Select>
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
                <CardDescription>Breakdown of services by type</CardDescription>
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
                          data={serviceTypeData}
                          cx="50%"
                          cy="50%"
                          labelLine={true}
                          outerRadius={100}
                          fill="#8884d8"
                          dataKey="value"
                          label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                        >
                          {serviceTypeData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip formatter={(value) => [`${value} hours`, 'Hours']} />
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
                <CardTitle className="text-lg">Care Plan Progress</CardTitle>
                <CardDescription>Monthly progress on your care plan goals</CardDescription>
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
                        data={progressData}
                        margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="month" />
                        <YAxis />
                        <Tooltip />
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
                      data={serviceUtilizationData}
                      margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis />
                      <Tooltip />
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
                {serviceUtilizationData.map((service, i) => (
                  <div key={i} className="p-4 border rounded-lg hover:shadow-sm transition-all">
                    <div className="flex flex-col md:flex-row justify-between mb-4">
                      <div className="flex items-center">
                        <div className="bg-blue-100 p-2 rounded-full mr-3">
                          {service.type === "Therapy" ? (
                            <Users className="h-5 w-5 text-blue-600" />
                          ) : service.type === "Check-in" ? (
                            <Clock className="h-5 w-5 text-blue-600" />
                          ) : (
                            <BarChartIcon className="h-5 w-5 text-blue-600" />
                          )}
                        </div>
                        <div>
                          <h3 className="font-medium">{service.type} Session</h3>
                          <p className="text-sm text-gray-500 flex items-center">
                            <Calendar className="inline h-3.5 w-3.5 mr-1.5" />
                            {formatDate(service.date)}
                            <Clock className="inline h-3.5 w-3.5 mx-1.5" />
                            {service.duration} minutes
                          </p>
                        </div>
                      </div>
                      <div className="mt-2 md:mt-0">
                        <Badge className="bg-green-100 text-green-800 border-0">
                          {service.completed}/{service.goals} Goals Completed
                        </Badge>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                      <div className="bg-gray-50 p-3 rounded-md">
                        <div className="font-medium text-gray-700">Progress</div>
                        <div className="flex items-center mt-1">
                          <TrendingUp className="h-4 w-4 mr-2 text-green-600" />
                          {Math.round((service.completed / service.goals) * 100)}% of goals achieved
                        </div>
                      </div>
                      
                      <div className="bg-gray-50 p-3 rounded-md">
                        <div className="font-medium text-gray-700">Focus Areas</div>
                        <div className="flex items-center mt-1">
                          <CheckSquare className="h-4 w-4 mr-2 text-blue-600" />
                          {service.type === "Therapy" ? "Mobility & Strength" : 
                           service.type === "Check-in" ? "Vital Signs & Wellness" : 
                           "Specialized Assessment"}
                        </div>
                      </div>
                      
                      <div className="bg-gray-50 p-3 rounded-md">
                        <div className="font-medium text-gray-700">Outcome</div>
                        <div className="flex items-center mt-1">
                          <CheckSquare className="h-4 w-4 mr-2 text-green-600" />
                          {service.completed === service.goals ? "All goals met" : 
                           service.completed > (service.goals / 2) ? "Good progress" : 
                           "In progress"}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ClientServiceReports;

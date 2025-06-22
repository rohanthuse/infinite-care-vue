
import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell
} from "recharts";
import { ActivityReportsData } from "@/hooks/useCarerActivityReports";
import { format, parseISO } from "date-fns";

interface ActivityChartsGridProps {
  data: ActivityReportsData;
  isLoading?: boolean;
}

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

export function ActivityChartsGrid({ data, isLoading }: ActivityChartsGridProps) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader>
              <div className="h-5 bg-gray-200 rounded w-32"></div>
            </CardHeader>
            <CardContent>
              <div className="h-64 bg-gray-200 rounded"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  // Prepare weekly trends data
  const weeklyData = data.weeklyTrends.map(trend => ({
    ...trend,
    week: format(parseISO(trend.date), 'MMM dd'),
  }));

  // Prepare service delivery data
  const serviceData = data.serviceDelivery.slice(0, 5); // Top 5 services

  // Prepare incident data by severity
  const incidentData = data.incidentReports.reduce((acc, incident) => {
    const existing = acc.find(item => item.severity === incident.severity);
    if (existing) {
      existing.count += incident.count;
    } else {
      acc.push({ severity: incident.severity, count: incident.count });
    }
    return acc;
  }, [] as { severity: string; count: number }[]);

  // Prepare monthly incident trends
  const monthlyIncidents = data.incidentReports.reduce((acc, incident) => {
    const existing = acc.find(item => item.month === incident.month);
    if (existing) {
      existing.incidents += incident.count;
    } else {
      acc.push({ month: incident.month, incidents: incident.count });
    }
    return acc;
  }, [] as { month: string; incidents: number }[]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Weekly Activity Trends */}
      <Card>
        <CardHeader>
          <CardTitle>Weekly Activity Trends</CardTitle>
        </CardHeader>
        <CardContent>
          <ChartContainer config={{}}>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={weeklyData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="week" 
                  fontSize={12}
                  tick={{ fontSize: 10 }}
                />
                <YAxis fontSize={12} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Line 
                  type="monotone" 
                  dataKey="activities" 
                  stroke="#3b82f6" 
                  strokeWidth={2}
                  name="Total Activities"
                />
                <Line 
                  type="monotone" 
                  dataKey="completed" 
                  stroke="#10b981" 
                  strokeWidth={2}
                  name="Completed"
                />
                <Line 
                  type="monotone" 
                  dataKey="incidents" 
                  stroke="#ef4444" 
                  strokeWidth={2}
                  name="Incidents"
                />
              </LineChart>
            </ResponsiveContainer>
          </ChartContainer>
        </CardContent>
      </Card>

      {/* Service Delivery Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle>Service Delivery</CardTitle>
        </CardHeader>
        <CardContent>
          <ChartContainer config={{}}>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={serviceData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="category" fontSize={12} />
                <YAxis fontSize={12} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar dataKey="count" fill="#10b981" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </ChartContainer>
        </CardContent>
      </Card>

      {/* Incident Severity Distribution */}
      <Card>
        <CardHeader>
          <CardTitle>Incident Severity</CardTitle>
        </CardHeader>
        <CardContent>
          <ChartContainer config={{}}>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={incidentData}
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="count"
                  label={({ severity, count }) => `${severity}: ${count}`}
                  labelLine={false}
                >
                  {incidentData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <ChartTooltip content={<ChartTooltipContent />} />
              </PieChart>
            </ResponsiveContainer>
          </ChartContainer>
        </CardContent>
      </Card>

      {/* Monthly Incident Trends */}
      <Card>
        <CardHeader>
          <CardTitle>Incident Trends</CardTitle>
        </CardHeader>
        <CardContent>
          <ChartContainer config={{}}>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={monthlyIncidents}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" fontSize={12} />
                <YAxis fontSize={12} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar dataKey="incidents" fill="#f59e0b" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </ChartContainer>
        </CardContent>
      </Card>
    </div>
  );
}


import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { ChartContainer } from "@/components/ui/chart";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  LineChart,
  Line,
  ResponsiveContainer
} from "recharts";
import { useOperationalReportsData, transformChartData } from "@/hooks/useReportsData";
import { Skeleton } from "@/components/ui/skeleton";

interface OperationalReportsProps {
  branchId: string;
  branchName: string;
}

// Fallback data
const fallbackTaskCompletionData = [
  { day: "Monday", scheduled: 0, completed: 0, cancelled: 0 },
  { day: "Tuesday", scheduled: 0, completed: 0, cancelled: 0 },
  { day: "Wednesday", scheduled: 0, completed: 0, cancelled: 0 },
  { day: "Thursday", scheduled: 0, completed: 0, cancelled: 0 },
  { day: "Friday", scheduled: 0, completed: 0, cancelled: 0 },
  { day: "Saturday", scheduled: 0, completed: 0, cancelled: 0 },
  { day: "Sunday", scheduled: 0, completed: 0, cancelled: 0 },
];

const fallbackResponseTimeData = [
  { month: "Jan", responseTime: 0 },
  { month: "Feb", responseTime: 0 },
  { month: "Mar", responseTime: 0 },
  { month: "Apr", responseTime: 0 },
  { month: "May", responseTime: 0 },
  { month: "Jun", responseTime: 0 },
];

export function OperationalReports({ branchId, branchName }: OperationalReportsProps) {
  const { data: reportData, isLoading, error } = useOperationalReportsData({ 
    branchId,
    startDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 1 week ago
    endDate: new Date().toISOString().split('T')[0] // today
  });

  // Transform data with fallbacks
  const taskCompletionData = transformChartData(reportData?.taskCompletion, fallbackTaskCompletionData);
  const responseTimeData = fallbackResponseTimeData; // This would need a new database function to implement properly

  if (error) {
    return (
      <div className="space-y-4">
        <div className="p-4 text-center text-red-600">
          Error loading operational reports: {error.message}
        </div>
      </div>
    );
  }

  const renderLoadingSkeleton = () => (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <Card className="border border-border shadow-sm">
        <CardContent className="p-6">
          <Skeleton className="h-6 w-48 mb-4" />
          <Skeleton className="h-[350px] w-full" />
          <Skeleton className="h-4 w-full mt-4" />
        </CardContent>
      </Card>
      <Card className="border border-border shadow-sm">
        <CardContent className="p-6">
          <Skeleton className="h-6 w-48 mb-4" />
          <Skeleton className="h-[350px] w-full" />
          <Skeleton className="h-4 w-full mt-4" />
        </CardContent>
      </Card>
    </div>
  );

  if (isLoading) {
    return renderLoadingSkeleton();
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <Card className="border border-border shadow-sm">
        <CardContent className="p-6">
          <h3 className="text-lg font-semibold mb-4">Task Completion Rates</h3>
          <div className="w-full" style={{ height: "350px" }}>
            <ResponsiveContainer width="100%" height="100%">
              <ChartContainer 
                config={{
                  scheduled: { color: "#0088FE" },
                  completed: { color: "#00C49F" },
                  cancelled: { color: "#FF8042" },
                }}
              >
                <BarChart
                  data={taskCompletionData}
                  margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="day" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="scheduled" name="Scheduled Tasks" fill="var(--color-scheduled)" />
                  <Bar dataKey="completed" name="Completed Tasks" fill="var(--color-completed)" />
                  <Bar dataKey="cancelled" name="Cancelled Tasks" fill="var(--color-cancelled)" />
                </BarChart>
              </ChartContainer>
            </ResponsiveContainer>
          </div>
          <div className="mt-4 text-sm text-muted-foreground">
            <p>This report shows task completion rates across different days of the week.</p>
          </div>
        </CardContent>
      </Card>

      <Card className="border border-border shadow-sm">
        <CardContent className="p-6">
          <h3 className="text-lg font-semibold mb-4">Average Response Time Trend</h3>
          <div className="w-full" style={{ height: "350px" }}>
            <ResponsiveContainer width="100%" height="100%">
              <ChartContainer 
                config={{
                  responseTime: { color: "#0088FE" },
                }}
              >
                <LineChart
                  data={responseTimeData}
                  margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip formatter={(value) => [`${value} minutes`, 'Response Time']} />
                  <Legend />
                  <Line type="monotone" dataKey="responseTime" name="Response Time (min)" stroke="var(--color-responseTime)" activeDot={{ r: 8 }} />
                </LineChart>
              </ChartContainer>
            </ResponsiveContainer>
          </div>
          <div className="mt-4 text-sm text-muted-foreground">
            <p>This report shows the average time to respond to client requests over the past 6 months.</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

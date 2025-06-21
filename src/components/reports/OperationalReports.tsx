
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
import { useOperationalReportsData } from "@/hooks/useReportsData";
import { Loader2 } from "lucide-react";

interface OperationalReportsProps {
  branchId: string;
  branchName: string;
  dateRange?: { from: Date; to: Date };
}

// Mock response time data since we don't have this in the database yet
const responseTimeData = [
  { month: "Jan", responseTime: 28 },
  { month: "Feb", responseTime: 26 },
  { month: "Mar", responseTime: 24 },
  { month: "Apr", responseTime: 22 },
  { month: "May", responseTime: 20 },
  { month: "Jun", responseTime: 18 },
];

export function OperationalReports({ branchId, branchName, dateRange }: OperationalReportsProps) {
  const { data: reportsData, isLoading, error } = useOperationalReportsData({
    branchId,
    startDate: dateRange?.from?.toISOString().split('T')[0],
    endDate: dateRange?.to?.toISOString().split('T')[0]
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2">Loading operational reports...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center p-8 text-red-600">
        Error loading operational reports. Please try again later.
      </div>
    );
  }

  const taskCompletionData = reportsData?.taskCompletion || [];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <Card className="border border-gray-200 shadow-sm">
        <CardContent className="p-6">
          <h3 className="text-lg font-semibold mb-4">Task Completion Rates</h3>
          {taskCompletionData.length > 0 ? (
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
          ) : (
            <div className="text-center py-8 text-gray-500">
              No task completion data available for the selected period.
            </div>
          )}
          <div className="mt-4 text-sm text-muted-foreground">
            <p>This report shows task completion rates across different days of the week for the selected period.</p>
          </div>
        </CardContent>
      </Card>

      <Card className="border border-gray-200 shadow-sm">
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
            <p>This report shows the average time to respond to client requests. <em>(Currently showing sample data - response time tracking to be implemented)</em></p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

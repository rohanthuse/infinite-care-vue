
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
} from "recharts";

interface OperationalReportsProps {
  branchId: string;
  branchName: string;
}

// Mock data for operational reports
const taskCompletionData = [
  { day: "Monday", scheduled: 65, completed: 62, cancelled: 3 },
  { day: "Tuesday", scheduled: 68, completed: 65, cancelled: 3 },
  { day: "Wednesday", scheduled: 70, completed: 68, cancelled: 2 },
  { day: "Thursday", scheduled: 72, completed: 69, cancelled: 3 },
  { day: "Friday", scheduled: 75, completed: 73, cancelled: 2 },
  { day: "Saturday", scheduled: 60, completed: 57, cancelled: 3 },
  { day: "Sunday", scheduled: 50, completed: 48, cancelled: 2 },
];

const responseTimeData = [
  { month: "Jan", responseTime: 28 },
  { month: "Feb", responseTime: 26 },
  { month: "Mar", responseTime: 24 },
  { month: "Apr", responseTime: 22 },
  { month: "May", responseTime: 20 },
  { month: "Jun", responseTime: 18 },
];

export function OperationalReports({ branchId, branchName }: OperationalReportsProps) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      <Card className="border border-gray-200 shadow-sm">
        <CardContent className="p-6">
          <h3 className="text-lg font-semibold mb-4">Task Completion Rates</h3>
          <div className="h-80 w-full">
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
          </div>
          <div className="mt-4 text-sm text-muted-foreground">
            <p>This report shows task completion rates across different days of the week.</p>
          </div>
        </CardContent>
      </Card>

      <Card className="border border-gray-200 shadow-sm">
        <CardContent className="p-6">
          <h3 className="text-lg font-semibold mb-4">Average Response Time Trend</h3>
          <div className="h-80 w-full">
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
          </div>
          <div className="mt-4 text-sm text-muted-foreground">
            <p>This report shows the average time to respond to client requests over the past 6 months.</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}


import React, { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { ChartContainer } from "@/components/ui/chart";
import {
  BarChart,
  XAxis,
  YAxis,
  Bar,
  Legend,
  Tooltip,
  LineChart,
  Line,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer
} from "recharts";

interface StaffReportsProps {
  branchId: string;
  branchName: string;
}

type StaffReportTab = "performance" | "availability" | "qualifications";

interface TabOption {
  id: StaffReportTab;
  label: string;
}

// Mock data for the charts
const staffPerformanceData = [
  { name: "Smith, John", completedTasks: 45, onTimePercentage: 95, clientFeedback: 4.8 },
  { name: "Jones, Mary", completedTasks: 52, onTimePercentage: 98, clientFeedback: 4.9 },
  { name: "Williams, David", completedTasks: 38, onTimePercentage: 90, clientFeedback: 4.5 },
  { name: "Brown, Linda", completedTasks: 41, onTimePercentage: 92, clientFeedback: 4.7 },
  { name: "Taylor, Sarah", completedTasks: 49, onTimePercentage: 97, clientFeedback: 4.9 },
  { name: "Johnson, Michael", completedTasks: 36, onTimePercentage: 88, clientFeedback: 4.4 },
];

const staffAvailabilityData = [
  { day: "Monday", available: 18, unavailable: 3 },
  { day: "Tuesday", available: 17, unavailable: 4 },
  { day: "Wednesday", available: 19, unavailable: 2 },
  { day: "Thursday", available: 16, unavailable: 5 },
  { day: "Friday", available: 15, unavailable: 6 },
  { day: "Saturday", available: 12, unavailable: 9 },
  { day: "Sunday", available: 10, unavailable: 11 },
];

const staffQualificationsData = [
  { name: "Home Care", value: 15 },
  { name: "Dementia Care", value: 8 },
  { name: "Nursing", value: 10 },
  { name: "First Aid", value: 21 },
  { name: "Medication Management", value: 14 },
];

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

export function StaffReports({ branchId, branchName }: StaffReportsProps) {
  const [activeTab, setActiveTab] = useState<StaffReportTab>("performance");
  
  const tabOptions: TabOption[] = [
    { id: "performance", label: "Staff Performance" },
    { id: "availability", label: "Availability" },
    { id: "qualifications", label: "Qualifications" },
  ];
  
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2 mb-4">
        {tabOptions.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              activeTab === tab.id
                ? "bg-blue-100 text-blue-700"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === "performance" && (
        <Card className="border border-gray-200 shadow-sm">
          <CardContent className="p-6">
            <h3 className="text-lg font-semibold mb-4">Staff Performance Metrics</h3>
            <div className="w-full" style={{ height: "350px" }}>
              <ResponsiveContainer width="100%" height="100%">
                <ChartContainer 
                  config={{
                    completedTasks: { color: "#0088FE" },
                    onTimePercentage: { color: "#00C49F" },
                  }}
                >
                  <BarChart 
                    data={staffPerformanceData} 
                    margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                    layout="vertical"
                  >
                    <XAxis type="number" />
                    <YAxis dataKey="name" type="category" width={100} />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="completedTasks" name="Tasks Completed" fill="var(--color-completedTasks)" />
                    <Bar dataKey="onTimePercentage" name="On-time %" fill="var(--color-onTimePercentage)" />
                  </BarChart>
                </ChartContainer>
              </ResponsiveContainer>
            </div>
            <div className="mt-4 text-sm text-muted-foreground">
              <p>This report shows performance metrics for staff members including completed tasks and punctuality.</p>
            </div>
          </CardContent>
        </Card>
      )}
      
      {activeTab === "availability" && (
        <Card className="border border-gray-200 shadow-sm">
          <CardContent className="p-6">
            <h3 className="text-lg font-semibold mb-4">Staff Availability by Day</h3>
            <div className="w-full" style={{ height: "350px" }}>
              <ResponsiveContainer width="100%" height="100%">
                <ChartContainer
                  config={{
                    available: { color: "#0088FE" },
                    unavailable: { color: "#FF8042" },
                  }}
                >
                  <LineChart
                    data={staffAvailabilityData}
                    margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="day" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line type="monotone" dataKey="available" name="Available Staff" stroke="var(--color-available)" activeDot={{ r: 8 }} />
                    <Line type="monotone" dataKey="unavailable" name="Unavailable Staff" stroke="var(--color-unavailable)" />
                  </LineChart>
                </ChartContainer>
              </ResponsiveContainer>
            </div>
            <div className="mt-4 text-sm text-muted-foreground">
              <p>This report shows staff availability patterns throughout the week.</p>
            </div>
          </CardContent>
        </Card>
      )}
      
      {activeTab === "qualifications" && (
        <Card className="border border-gray-200 shadow-sm">
          <CardContent className="p-6">
            <h3 className="text-lg font-semibold mb-4">Staff Qualifications Distribution</h3>
            <div className="w-full" style={{ height: "350px" }}>
              <ResponsiveContainer width="100%" height="100%">
                <ChartContainer
                  config={{
                    primary: { color: "#0088FE" },
                  }}
                >
                  <PieChart>
                    <Pie
                      data={staffQualificationsData}
                      cx="50%"
                      cy="50%"
                      labelLine={true}
                      outerRadius={100}
                      fill="#8884d8"
                      dataKey="value"
                      label={({ name, value }) => `${name}: ${value}`}
                    >
                      {staffQualificationsData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => [`${value} staff members`, 'Count']} />
                    <Legend />
                  </PieChart>
                </ChartContainer>
              </ResponsiveContainer>
            </div>
            <div className="mt-4 text-sm text-muted-foreground">
              <p>This report shows the distribution of qualifications among staff members.</p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

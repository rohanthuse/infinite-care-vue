
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
import { useStaffReportsData } from "@/hooks/useReportsData";
import { Loader2 } from "lucide-react";

interface StaffReportsProps {
  branchId: string;
  branchName: string;
  dateRange?: { from: Date; to: Date };
}

type StaffReportTab = "performance" | "availability" | "qualifications";

interface TabOption {
  id: StaffReportTab;
  label: string;
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

// Mock qualifications data since we don't have this in the database yet
const staffQualificationsData = [
  { name: "Home Care", value: 15 },
  { name: "Dementia Care", value: 8 },
  { name: "Nursing", value: 10 },
  { name: "First Aid", value: 21 },
  { name: "Medication Management", value: 14 },
];

export function StaffReports({ branchId, branchName, dateRange }: StaffReportsProps) {
  const [activeTab, setActiveTab] = useState<StaffReportTab>("performance");
  
  const { data: reportsData, isLoading, error } = useStaffReportsData({
    branchId,
    startDate: dateRange?.from?.toISOString().split('T')[0],
    endDate: dateRange?.to?.toISOString().split('T')[0]
  });
  
  const tabOptions: TabOption[] = [
    { id: "performance", label: "Staff Performance" },
    { id: "availability", label: "Availability" },
    { id: "qualifications", label: "Qualifications" },
  ];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2">Loading staff reports...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center p-8 text-red-600">
        Error loading staff reports. Please try again later.
      </div>
    );
  }

  const performanceData = reportsData?.performance || [];
  const availabilityData = reportsData?.availability || [];
  
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
            {performanceData.length > 0 ? (
              <div className="w-full" style={{ height: "350px" }}>
                <ResponsiveContainer width="100%" height="100%">
                  <ChartContainer 
                    config={{
                      completedTasks: { color: "#0088FE" },
                      onTimePercentage: { color: "#00C49F" },
                    }}
                  >
                    <BarChart 
                      data={performanceData} 
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
            ) : (
              <div className="text-center py-8 text-gray-500">
                No staff performance data available for the selected period.
              </div>
            )}
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
            {availabilityData.length > 0 ? (
              <div className="w-full" style={{ height: "350px" }}>
                <ResponsiveContainer width="100%" height="100%">
                  <ChartContainer
                    config={{
                      available: { color: "#0088FE" },
                      unavailable: { color: "#FF8042" },
                    }}
                  >
                    <LineChart
                      data={availabilityData}
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
            ) : (
              <div className="text-center py-8 text-gray-500">
                No staff availability data available for the selected period.
              </div>
            )}
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
              <p>This report shows the distribution of qualifications among staff members. <em>(Currently showing sample data - qualifications tracking to be implemented)</em></p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

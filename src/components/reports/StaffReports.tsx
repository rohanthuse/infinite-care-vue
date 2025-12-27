
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
import { useStaffReportsData, transformChartData } from "@/hooks/useReportsData";
import { Skeleton } from "@/components/ui/skeleton";

interface StaffReportsProps {
  branchId: string;
  branchName: string;
}

type StaffReportTab = "performance" | "availability" | "qualifications";

interface TabOption {
  id: StaffReportTab;
  label: string;
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

// Fallback data
const fallbackPerformanceData = [
  { name: "No Staff Data", completedTasks: 0, onTimePercentage: 0 },
];

const fallbackAvailabilityData = [
  { day: "Monday", available: 0, unavailable: 0 },
  { day: "Tuesday", available: 0, unavailable: 0 },
  { day: "Wednesday", available: 0, unavailable: 0 },
  { day: "Thursday", available: 0, unavailable: 0 },
  { day: "Friday", available: 0, unavailable: 0 },
  { day: "Saturday", available: 0, unavailable: 0 },
  { day: "Sunday", available: 0, unavailable: 0 },
];

const fallbackQualificationsData = [
  { name: "No Data", value: 1 },
];

export function StaffReports({ branchId, branchName }: StaffReportsProps) {
  const [activeTab, setActiveTab] = useState<StaffReportTab>("performance");
  
  const { data: reportData, isLoading, error } = useStaffReportsData({ 
    branchId,
    startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 1 month ago
    endDate: new Date().toISOString().split('T')[0] // today
  });
  
  const tabOptions: TabOption[] = [
    { id: "performance", label: "Staff Performance" },
    { id: "availability", label: "Availability" },
    { id: "qualifications", label: "Qualifications" },
  ];

  // Transform data with fallbacks
  const staffPerformanceData = transformChartData(reportData?.performance, fallbackPerformanceData);
  const staffAvailabilityData = transformChartData(reportData?.availability, fallbackAvailabilityData);
  const staffQualificationsData = transformChartData(reportData?.qualifications, fallbackQualificationsData);

  if (error) {
    return (
      <div className="space-y-4">
        <div className="p-4 text-center text-red-600">
          Error loading staff reports: {error.message}
        </div>
      </div>
    );
  }

  const renderLoadingSkeleton = () => (
    <Card className="border border-border shadow-sm">
      <CardContent className="p-6">
        <Skeleton className="h-6 w-48 mb-4" />
        <Skeleton className="h-[350px] w-full" />
        <Skeleton className="h-4 w-full mt-4" />
      </CardContent>
    </Card>
  );
  
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2 mb-4">
        {tabOptions.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              activeTab === tab.id
                ? "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300"
                : "bg-muted text-muted-foreground hover:bg-muted/80"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {isLoading ? (
        renderLoadingSkeleton()
      ) : (
        <>
          {activeTab === "performance" && (
            <Card className="border border-border shadow-sm">
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
            <Card className="border border-border shadow-sm">
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
            <Card className="border border-border shadow-sm">
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
        </>
      )}
    </div>
  );
}

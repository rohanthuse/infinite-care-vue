
import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { ChartContainer } from "@/components/ui/chart";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  BarChart,
  Bar,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from "recharts";
import { useFinancialReportsData, transformChartData } from "@/hooks/useReportsData";
import { Skeleton } from "@/components/ui/skeleton";

interface FinancialReportsProps {
  branchId: string;
  branchName: string;
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

// Fallback data
const fallbackRevenueData = [
  { month: "Jan", revenue: 0, expenses: 0, profit: 0 },
  { month: "Feb", revenue: 0, expenses: 0, profit: 0 },
  { month: "Mar", revenue: 0, expenses: 0, profit: 0 },
  { month: "Apr", revenue: 0, expenses: 0, profit: 0 },
  { month: "May", revenue: 0, expenses: 0, profit: 0 },
  { month: "Jun", revenue: 0, expenses: 0, profit: 0 },
];

const fallbackServiceRevenueData = [
  { name: "No Services", value: 1 },
];

export function FinancialReports({ branchId, branchName }: FinancialReportsProps) {
  const { data: reportData, isLoading, error } = useFinancialReportsData({ 
    branchId,
    startDate: new Date(Date.now() - 6 * 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 6 months ago
    endDate: new Date().toISOString().split('T')[0] // today
  });

  // Transform data with fallbacks
  const revenueData = transformChartData(reportData?.monthlyRevenue, fallbackRevenueData);
  const serviceRevenueData = transformChartData(reportData?.serviceRevenue, fallbackServiceRevenueData);

  if (error) {
    return (
      <div className="space-y-4">
        <div className="p-4 text-center text-red-600">
          Error loading financial reports: {error.message}
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
          <h3 className="text-lg font-semibold mb-4">Revenue & Expenses</h3>
          <div className="w-full" style={{ height: "350px" }}>
            <ResponsiveContainer width="100%" height="100%">
              <ChartContainer 
                config={{
                  revenue: { color: "#0088FE" },
                  expenses: { color: "#FF8042" },
                  profit: { color: "#00C49F" },
                }}
              >
                <LineChart
                  data={revenueData}
                  margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip formatter={(value) => [`£${value}`, '']} />
                  <Legend />
                  <Line type="monotone" dataKey="revenue" name="Revenue" stroke="var(--color-revenue)" activeDot={{ r: 8 }} />
                  <Line type="monotone" dataKey="expenses" name="Expenses" stroke="var(--color-expenses)" />
                  <Line type="monotone" dataKey="profit" name="Profit" stroke="var(--color-profit)" />
                </LineChart>
              </ChartContainer>
            </ResponsiveContainer>
          </div>
          <div className="mt-4 text-sm text-muted-foreground">
            <p>This report shows revenue, expenses, and profit for the past 6 months.</p>
          </div>
        </CardContent>
      </Card>

      <Card className="border border-border shadow-sm">
        <CardContent className="p-6">
          <h3 className="text-lg font-semibold mb-4">Revenue by Service Type</h3>
          <div className="w-full" style={{ height: "350px" }}>
            <ResponsiveContainer width="100%" height="100%">
              <ChartContainer 
                config={{
                  value: { color: "#0088FE" },
                }}
              >
                <PieChart>
                  <Pie
                    data={serviceRevenueData}
                    cx="50%"
                    cy="50%"
                    labelLine={true}
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="value"
                    label={({ name, value, percent }) => `${name}: £${value}`}
                  >
                    {serviceRevenueData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => [`£${value}`, 'Revenue']} />
                  <Legend />
                </PieChart>
              </ChartContainer>
            </ResponsiveContainer>
          </div>
          <div className="mt-4 text-sm text-muted-foreground">
            <p>This report shows the distribution of revenue across different service types.</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

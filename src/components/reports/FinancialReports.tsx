
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
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer
} from "recharts";
import { useFinancialReportsData } from "@/hooks/useReportsData";
import { Loader2 } from "lucide-react";

interface FinancialReportsProps {
  branchId: string;
  branchName: string;
  dateRange?: { from: Date; to: Date };
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

export function FinancialReports({ branchId, branchName, dateRange }: FinancialReportsProps) {
  const { data: reportsData, isLoading, error } = useFinancialReportsData({
    branchId,
    startDate: dateRange?.from?.toISOString().split('T')[0],
    endDate: dateRange?.to?.toISOString().split('T')[0]
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2">Loading financial reports...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center p-8 text-red-600">
        Error loading financial reports. Please try again later.
      </div>
    );
  }

  const monthlyRevenueData = reportsData?.monthlyRevenue || [];
  const serviceRevenueData = reportsData?.serviceRevenue || [];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <Card className="border border-gray-200 shadow-sm">
        <CardContent className="p-6">
          <h3 className="text-lg font-semibold mb-4">Revenue & Expenses</h3>
          {monthlyRevenueData.length > 0 ? (
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
                    data={monthlyRevenueData}
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
          ) : (
            <div className="text-center py-8 text-gray-500">
              No financial data available for the selected period.
            </div>
          )}
          <div className="mt-4 text-sm text-muted-foreground">
            <p>This report shows revenue, expenses, and profit for the selected period.</p>
          </div>
        </CardContent>
      </Card>

      <Card className="border border-gray-200 shadow-sm">
        <CardContent className="p-6">
          <h3 className="text-lg font-semibold mb-4">Revenue by Service Type</h3>
          {serviceRevenueData.length > 0 ? (
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
                      {serviceRevenueData.map((entry: any, index: number) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => [`£${value}`, 'Revenue']} />
                    <Legend />
                  </PieChart>
                </ChartContainer>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              No service revenue data available for the selected period.
            </div>
          )}
          <div className="mt-4 text-sm text-muted-foreground">
            <p>This report shows the distribution of revenue across different service types.</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

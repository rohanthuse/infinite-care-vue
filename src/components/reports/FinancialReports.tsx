
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

interface FinancialReportsProps {
  branchId: string;
  branchName: string;
}

// Mock data for financial reports
const revenueData = [
  { month: "Jan", revenue: 45000, expenses: 35000, profit: 10000 },
  { month: "Feb", revenue: 48000, expenses: 36000, profit: 12000 },
  { month: "Mar", revenue: 52000, expenses: 38000, profit: 14000 },
  { month: "Apr", revenue: 49000, expenses: 37000, profit: 12000 },
  { month: "May", revenue: 54000, expenses: 39000, profit: 15000 },
  { month: "Jun", revenue: 58000, expenses: 41000, profit: 17000 },
];

const serviceRevenueData = [
  { name: "Home Care", value: 35000 },
  { name: "Nursing", value: 25000 },
  { name: "Respite Care", value: 15000 },
  { name: "Companionship", value: 18000 },
  { name: "Other", value: 7000 },
];

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

export function FinancialReports({ branchId, branchName }: FinancialReportsProps) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <Card className="border border-gray-200 shadow-sm">
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

      <Card className="border border-gray-200 shadow-sm">
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

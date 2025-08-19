
import React from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { RefreshCw, Download } from "lucide-react";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, Line, PieChart, Pie, Cell } from "recharts";
import { Skeleton } from "@/components/ui/skeleton";
import { useBranchChartData } from "@/data/hooks/useBranchChartData";

interface DashboardChartsSectionProps {
  branchId: string | undefined;
}

const COLORS = ["#4f46e5", "#a5b4fc"];

export const DashboardChartsSection: React.FC<DashboardChartsSectionProps> = ({ branchId }) => {
  const { data: chartData, isLoading: isLoadingChartData } = useBranchChartData(branchId);

  const totalClientsForDist = chartData?.clientDistribution.reduce((acc, cur) => acc + cur.value, 0) || 0;
  const returningClientsCount = chartData?.clientDistribution.find(d => d.name === "Returning")?.value || 0;
  const newClientsCount = chartData?.clientDistribution.find(d => d.name === "New")?.value || 0;
  const returningPercentage = totalClientsForDist > 0 ? Math.round((returningClientsCount / totalClientsForDist) * 100) : 0;
  const newPercentage = totalClientsForDist > 0 ? Math.round((newClientsCount / totalClientsForDist) * 100) : 0;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6 mb-6">
      <Card className="lg:col-span-2">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base md:text-lg font-semibold">Weekly Statistics</CardTitle>
              <CardDescription>Appointments, visits and revenue</CardDescription>
            </div>
            <div className="flex gap-2">
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <RefreshCw className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <Download className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="h-[220px] md:h-[300px] w-full">
            {isLoadingChartData ? (
              <div className="flex items-center justify-center h-full">
                <Skeleton className="h-full w-full" />
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData?.weeklyStats} margin={{
                  top: 20,
                  right: 30,
                  left: 0,
                  bottom: 5
                }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="day" />
                  <YAxis yAxisId="left" />
                  <YAxis yAxisId="right" orientation="right" />
                  <Tooltip contentStyle={{
                    backgroundColor: "hsl(var(--card))",
                    color: "hsl(var(--card-foreground))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "8px",
                    boxShadow: "0 4px 12px rgba(0,0,0,0.1)"
                  }} />
                  <Legend />
                  <Bar yAxisId="left" dataKey="visits" name="Visits" fill="#a5b4fc" radius={[4, 4, 0, 0]} />
                  <Bar yAxisId="left" dataKey="bookings" name="Bookings" fill="#4f46e5" radius={[4, 4, 0, 0]} />
                  <Line yAxisId="right" type="monotone" dataKey="revenue" name="Revenue (£)" stroke="#10b981" strokeWidth={2} dot={{
                    r: 4
                  }} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base md:text-lg font-semibold">Client Distribution</CardTitle>
          <CardDescription>New vs returning clients</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[180px] md:h-[240px] flex items-center justify-center">
            {isLoadingChartData ? (
              <div className="flex items-center justify-center h-full">
                <Skeleton className="h-48 w-48 rounded-full" />
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={chartData?.clientDistribution} innerRadius={50} outerRadius={70} paddingAngle={5} dataKey="value">
                    {chartData?.clientDistribution.map((entry, index) => 
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    )}
                  </Pie>
                  <Tooltip formatter={(value, name) => [`${value} clients`, name]} contentStyle={{
                    backgroundColor: "hsl(var(--card))",
                    color: "hsl(var(--card-foreground))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "8px",
                    boxShadow: "0 4px 12px rgba(0,0,0,0.1)"
                  }} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
          
          <div className="flex justify-around mt-3">
            <div className="flex items-center gap-2">
              <div className="h-3 w-3 rounded-full bg-indigo-600"></div>
              <span className="text-xs md:text-sm">Returning ({returningPercentage}%)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-3 w-3 rounded-full bg-indigo-300"></div>
              <span className="text-xs md:text-sm">New ({newPercentage}%)</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};


import React from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  ChartContainer, 
  ChartTooltip, 
  ChartTooltipContent 
} from "@/components/ui/chart";
import { useMARChartData } from "@/hooks/useMARChartData";
import { Loader2 } from "lucide-react";

// Pie chart colors
const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884d8"];

interface MedChartDataProps {
  patientId?: string;
  viewType: "overview" | "patient";
}

export const MedChartData: React.FC<MedChartDataProps> = ({ patientId, viewType }) => {
  const { data: chartData, isLoading, error } = useMARChartData();

  // Configuration for the charts
  const chartConfig = {
    administration: {
      administered: { label: "Administered", theme: { light: "#22c55e", dark: "#22c55e" } },
      missed: { label: "Missed", theme: { light: "#ef4444", dark: "#ef4444" } },
      refused: { label: "Refused", theme: { light: "#f59e0b", dark: "#f59e0b" } },
    },
    timeOfDay: {
      administered: { label: "Administered", theme: { light: "#3b82f6", dark: "#3b82f6" } },
      total: { label: "Total", theme: { light: "#9ca3af", dark: "#9ca3af" } },
    },
  };

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <Card className="col-span-1 lg:col-span-2">
          <CardContent className="flex items-center justify-center h-[300px]">
            <Loader2 className="h-8 w-8 animate-spin" />
            <span className="ml-2">Loading medication data...</span>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <Card className="col-span-1 lg:col-span-2">
          <CardContent className="flex items-center justify-center h-[300px]">
            <p className="text-red-600">Error loading medication data</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const hasData = chartData && (
    chartData.weeklyStats.some(stat => stat.administered > 0 || stat.missed > 0 || stat.refused > 0) ||
    chartData.typeDistribution.length > 0 ||
    chartData.timeOfDayStats.some(stat => stat.total > 0)
  );

  if (!hasData) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <Card className="col-span-1 lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-lg">Medication Administration Overview</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col items-center justify-center h-[200px] text-center">
            <p className="text-gray-500 mb-2">No medication administration data available yet</p>
            <p className="text-sm text-gray-400">
              Start recording medication administration to see trends and analytics here
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
      {/* Medication Administration Trend */}
      <Card className="col-span-1 lg:col-span-2">
        <CardHeader>
          <CardTitle className="text-lg">Medication Administration Trend (Last 7 Days)</CardTitle>
        </CardHeader>
        <CardContent>
          <ChartContainer config={chartConfig.administration} className="h-[300px]">
            <BarChart data={chartData?.weeklyStats || []}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="day" />
              <YAxis />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Legend />
              <Bar dataKey="administered" name="Administered" fill="var(--color-administered)" radius={[4, 4, 0, 0]} />
              <Bar dataKey="missed" name="Missed" fill="var(--color-missed)" radius={[4, 4, 0, 0]} />
              <Bar dataKey="refused" name="Refused" fill="var(--color-refused)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ChartContainer>
        </CardContent>
      </Card>

      {/* Medication Type Distribution */}
      {chartData?.typeDistribution && chartData.typeDistribution.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Active Medication Categories</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={chartData.typeDistribution}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                >
                  {chartData.typeDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => [`${value} medications`, 'Count']} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* Time of Day Distribution */}
      {chartData?.timeOfDayStats && chartData.timeOfDayStats.some(stat => stat.total > 0) && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Administration by Time of Day</CardTitle>
          </CardHeader>
          <CardContent>
            <ChartContainer config={chartConfig.timeOfDay} className="h-[300px]">
              <LineChart data={chartData.timeOfDayStats}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" />
                <YAxis />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Legend />
                <Line 
                  type="monotone" 
                  dataKey="administered" 
                  name="Administered" 
                  stroke="var(--color-administered)" 
                  strokeWidth={2} 
                  dot={{ r: 4 }} 
                  activeDot={{ r: 6 }} 
                />
                <Line 
                  type="monotone" 
                  dataKey="total" 
                  name="Expected" 
                  stroke="var(--color-total)" 
                  strokeWidth={2} 
                  dot={{ r: 4 }} 
                  activeDot={{ r: 6 }} 
                />
              </LineChart>
            </ChartContainer>
          </CardContent>
        </Card>
      )}

      {/* Show message when no type/time data */}
      {(!chartData?.typeDistribution?.length && !chartData?.timeOfDayStats?.some(stat => stat.total > 0)) && (
        <Card className="col-span-1 lg:col-span-2">
          <CardContent className="flex items-center justify-center h-[200px] text-center">
            <div>
              <p className="text-gray-500 mb-2">No active medications found</p>
              <p className="text-sm text-gray-400">
                Add medications to see category distribution and administration patterns
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default MedChartData;

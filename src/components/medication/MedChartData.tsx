
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

// Mock data for medication administration trends
const medicationTrendData = [
  { date: "Mon", administered: 12, missed: 2, refused: 1 },
  { date: "Tue", administered: 15, missed: 1, refused: 2 },
  { date: "Wed", administered: 13, missed: 3, refused: 1 },
  { date: "Thu", administered: 17, missed: 2, refused: 0 },
  { date: "Fri", administered: 14, missed: 1, refused: 3 },
  { date: "Sat", administered: 10, missed: 2, refused: 1 },
  { date: "Sun", administered: 9, missed: 3, refused: 2 },
];

// Mock data for medication type distribution
const medicationTypeData = [
  { name: "Analgesics", value: 15 },
  { name: "Antibiotics", value: 8 },
  { name: "Antihypertensives", value: 12 },
  { name: "Antidiabetics", value: 9 },
  { name: "Others", value: 11 },
];

// Pie chart colors
const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884d8"];

// Mock data for time-of-day distribution
const timeOfDayData = [
  { name: "Morning", administered: 23, total: 25 },
  { name: "Afternoon", administered: 18, total: 20 },
  { name: "Evening", administered: 20, total: 22 },
  { name: "Night", administered: 12, total: 15 },
];

interface MedChartDataProps {
  patientId?: string;
  viewType: "overview" | "patient";
}

export const MedChartData: React.FC<MedChartDataProps> = ({ patientId, viewType }) => {
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

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
      {/* Medication Administration Trend */}
      <Card className="col-span-1 lg:col-span-2">
        <CardHeader>
          <CardTitle className="text-lg">Medication Administration Trend</CardTitle>
        </CardHeader>
        <CardContent>
          <ChartContainer config={chartConfig.administration} className="h-[300px]">
            <BarChart data={medicationTrendData}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="date" />
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
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Medication Type Distribution</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={medicationTypeData}
                cx="50%"
                cy="50%"
                labelLine={false}
                outerRadius={100}
                fill="#8884d8"
                dataKey="value"
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
              >
                {medicationTypeData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip formatter={(value) => [`${value} medications`, 'Count']} />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Time of Day Distribution */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Time of Day Distribution</CardTitle>
        </CardHeader>
        <CardContent>
          <ChartContainer config={chartConfig.timeOfDay} className="h-[300px]">
            <LineChart data={timeOfDayData}>
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
                name="Total" 
                stroke="var(--color-total)" 
                strokeWidth={2} 
                dot={{ r: 4 }} 
                activeDot={{ r: 6 }} 
              />
            </LineChart>
          </ChartContainer>
        </CardContent>
      </Card>
    </div>
  );
};

export default MedChartData;

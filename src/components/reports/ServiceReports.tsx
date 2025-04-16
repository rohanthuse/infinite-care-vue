
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
  Area,
  AreaChart,
  ResponsiveContainer
} from "recharts";

interface ServiceReportsProps {
  branchId: string;
  branchName: string;
}

type ServiceReportTab = "utilization" | "satisfaction" | "distribution";

interface TabOption {
  id: ServiceReportTab;
  label: string;
}

// Mock data for the charts
const serviceUtilizationData = [
  { name: "Jan", homecare: 145, nursing: 80, respite: 45, companion: 65 },
  { name: "Feb", homecare: 150, nursing: 85, respite: 50, companion: 70 },
  { name: "Mar", homecare: 160, nursing: 90, respite: 55, companion: 75 },
  { name: "Apr", homecare: 155, nursing: 95, respite: 48, companion: 80 },
  { name: "May", homecare: 170, nursing: 100, respite: 52, companion: 85 },
  { name: "Jun", homecare: 180, nursing: 105, respite: 60, companion: 90 },
];

const serviceSatisfactionData = [
  { name: "Home Care", excellent: 65, good: 25, average: 8, poor: 2 },
  { name: "Nursing", excellent: 70, good: 20, average: 8, poor: 2 },
  { name: "Respite Care", excellent: 60, good: 30, average: 7, poor: 3 },
  { name: "Companionship", excellent: 75, good: 15, average: 8, poor: 2 },
];

const serviceTimeDistributionData = [
  { name: "Morning (6-12)", value: 35 },
  { name: "Afternoon (12-5)", value: 25 },
  { name: "Evening (5-10)", value: 30 },
  { name: "Night (10-6)", value: 10 },
];

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

export function ServiceReports({ branchId, branchName }: ServiceReportsProps) {
  const [activeTab, setActiveTab] = useState<ServiceReportTab>("utilization");
  
  const tabOptions: TabOption[] = [
    { id: "utilization", label: "Service Utilization" },
    { id: "satisfaction", label: "Satisfaction Scores" },
    { id: "distribution", label: "Time Distribution" },
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

      {activeTab === "utilization" && (
        <Card className="border border-gray-200 shadow-sm">
          <CardContent className="p-6">
            <h3 className="text-lg font-semibold mb-4">Service Utilization Trends</h3>
            <div className="w-full" style={{ height: "350px" }}>
              <ResponsiveContainer width="100%" height="100%">
                <ChartContainer 
                  config={{
                    homecare: { color: "#0088FE" },
                    nursing: { color: "#00C49F" },
                    respite: { color: "#FFBB28" },
                    companion: { color: "#FF8042" },
                  }}
                >
                  <AreaChart
                    data={serviceUtilizationData}
                    margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Area type="monotone" dataKey="homecare" name="Home Care" stackId="1" stroke="var(--color-homecare)" fill="var(--color-homecare)" />
                    <Area type="monotone" dataKey="nursing" name="Nursing" stackId="1" stroke="var(--color-nursing)" fill="var(--color-nursing)" />
                    <Area type="monotone" dataKey="respite" name="Respite Care" stackId="1" stroke="var(--color-respite)" fill="var(--color-respite)" />
                    <Area type="monotone" dataKey="companion" name="Companionship" stackId="1" stroke="var(--color-companion)" fill="var(--color-companion)" />
                  </AreaChart>
                </ChartContainer>
              </ResponsiveContainer>
            </div>
            <div className="mt-4 text-sm text-muted-foreground">
              <p>This report shows service utilization trends over the past 6 months by service type.</p>
            </div>
          </CardContent>
        </Card>
      )}
      
      {activeTab === "satisfaction" && (
        <Card className="border border-gray-200 shadow-sm">
          <CardContent className="p-6">
            <h3 className="text-lg font-semibold mb-4">Service Satisfaction Scores</h3>
            <div className="w-full" style={{ height: "350px" }}>
              <ResponsiveContainer width="100%" height="100%">
                <ChartContainer
                  config={{
                    excellent: { color: "#00C49F" },
                    good: { color: "#0088FE" },
                    average: { color: "#FFBB28" },
                    poor: { color: "#FF8042" },
                  }}
                >
                  <BarChart
                    data={serviceSatisfactionData}
                    margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="excellent" name="Excellent" fill="var(--color-excellent)" stackId="a" />
                    <Bar dataKey="good" name="Good" fill="var(--color-good)" stackId="a" />
                    <Bar dataKey="average" name="Average" fill="var(--color-average)" stackId="a" />
                    <Bar dataKey="poor" name="Poor" fill="var(--color-poor)" stackId="a" />
                  </BarChart>
                </ChartContainer>
              </ResponsiveContainer>
            </div>
            <div className="mt-4 text-sm text-muted-foreground">
              <p>This report shows client satisfaction scores across different service types.</p>
            </div>
          </CardContent>
        </Card>
      )}
      
      {activeTab === "distribution" && (
        <Card className="border border-gray-200 shadow-sm">
          <CardContent className="p-6">
            <h3 className="text-lg font-semibold mb-4">Service Time Distribution</h3>
            <div className="w-full" style={{ height: "350px" }}>
              <ResponsiveContainer width="100%" height="100%">
                <ChartContainer
                  config={{
                    primary: { color: "#0088FE" },
                  }}
                >
                  <PieChart>
                    <Pie
                      data={serviceTimeDistributionData}
                      cx="50%"
                      cy="50%"
                      labelLine={true}
                      outerRadius={100}
                      fill="#8884d8"
                      dataKey="value"
                      label={({ name, value, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    >
                      {serviceTimeDistributionData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => [`${value} hours`, 'Hours']} />
                    <Legend />
                  </PieChart>
                </ChartContainer>
              </ResponsiveContainer>
            </div>
            <div className="mt-4 text-sm text-muted-foreground">
              <p>This report shows the distribution of service hours across different times of the day.</p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

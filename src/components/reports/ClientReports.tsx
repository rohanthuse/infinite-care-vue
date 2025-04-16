
import React, { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { ChartContainer } from "@/components/ui/chart";
import { BarChart, XAxis, YAxis, Bar, Legend, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";

interface ClientReportsProps {
  branchId: string;
  branchName: string;
}

type ClientReportTab = "activity" | "demographics" | "services";

interface TabOption {
  id: ClientReportTab;
  label: string;
}

// Mock data for the charts
const clientActivityData = [
  { name: "Jan", active: 65, inactive: 25, new: 15 },
  { name: "Feb", active: 70, inactive: 20, new: 10 },
  { name: "Mar", active: 75, inactive: 15, new: 18 },
  { name: "Apr", active: 72, inactive: 18, new: 12 },
  { name: "May", active: 78, inactive: 14, new: 16 },
  { name: "Jun", active: 82, inactive: 10, new: 20 },
];

const clientDemographicsData = [
  { name: "18-30", value: 15 },
  { name: "31-50", value: 25 },
  { name: "51-65", value: 30 },
  { name: "66-80", value: 20 },
  { name: "81+", value: 10 },
];

const clientServiceTypeData = [
  { name: "Home Care", value: 40 },
  { name: "Nursing", value: 25 },
  { name: "Respite Care", value: 15 },
  { name: "Companionship", value: 20 },
];

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

export function ClientReports({ branchId, branchName }: ClientReportsProps) {
  const [activeTab, setActiveTab] = useState<ClientReportTab>("activity");
  
  const tabOptions: TabOption[] = [
    { id: "activity", label: "Client Activity" },
    { id: "demographics", label: "Demographics" },
    { id: "services", label: "Service Utilization" },
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

      {activeTab === "activity" && (
        <Card className="border border-gray-200 shadow-sm">
          <CardContent className="p-6">
            <h3 className="text-lg font-semibold mb-4">Client Activity Overview</h3>
            <div className="w-full" style={{ height: "350px" }}>
              <ResponsiveContainer width="100%" height="100%">
                <ChartContainer 
                  config={{
                    active: { color: "#0088FE" },
                    inactive: { color: "#FF8042" },
                    new: { color: "#00C49F" },
                  }}
                >
                  <BarChart data={clientActivityData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="active" name="Active Clients" fill="var(--color-active)" />
                    <Bar dataKey="inactive" name="Inactive Clients" fill="var(--color-inactive)" />
                    <Bar dataKey="new" name="New Clients" fill="var(--color-new)" />
                  </BarChart>
                </ChartContainer>
              </ResponsiveContainer>
            </div>
            <div className="mt-4 text-sm text-muted-foreground">
              <p>This report shows client activity trends over the last 6 months, including active, inactive, and new client counts.</p>
            </div>
          </CardContent>
        </Card>
      )}
      
      {activeTab === "demographics" && (
        <Card className="border border-gray-200 shadow-sm">
          <CardContent className="p-6">
            <h3 className="text-lg font-semibold mb-4">Client Demographics</h3>
            <div className="w-full" style={{ height: "350px" }}>
              <ResponsiveContainer width="100%" height="100%">
                <ChartContainer
                  config={{
                    primary: { color: "#0088FE" },
                  }}
                >
                  <PieChart>
                    <Pie
                      data={clientDemographicsData}
                      cx="50%"
                      cy="50%"
                      labelLine={true}
                      outerRadius={130}
                      fill="#8884d8"
                      dataKey="value"
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    >
                      {clientDemographicsData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => [`${value} clients`, 'Count']} />
                    <Legend layout="horizontal" verticalAlign="bottom" align="center" />
                  </PieChart>
                </ChartContainer>
              </ResponsiveContainer>
            </div>
            <div className="mt-4 text-sm text-muted-foreground">
              <p>This report shows the age distribution of clients currently registered with the branch.</p>
            </div>
          </CardContent>
        </Card>
      )}
      
      {activeTab === "services" && (
        <Card className="border border-gray-200 shadow-sm">
          <CardContent className="p-6">
            <h3 className="text-lg font-semibold mb-4">Client Service Utilization</h3>
            <div className="w-full" style={{ height: "350px" }}>
              <ResponsiveContainer width="100%" height="100%">
                <ChartContainer
                  config={{
                    primary: { color: "#0088FE" },
                  }}
                >
                  <PieChart>
                    <Pie
                      data={clientServiceTypeData}
                      cx="50%"
                      cy="50%"
                      labelLine={true}
                      outerRadius={130}
                      fill="#8884d8"
                      dataKey="value"
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    >
                      {clientServiceTypeData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => [`${value} clients`, 'Count']} />
                    <Legend layout="horizontal" verticalAlign="bottom" align="center" />
                  </PieChart>
                </ChartContainer>
              </ResponsiveContainer>
            </div>
            <div className="mt-4 text-sm text-muted-foreground">
              <p>This report shows the distribution of different service types utilized by clients.</p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}


import React, { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { ChartContainer } from "@/components/ui/chart";
import { BarChart, XAxis, YAxis, Bar, Legend, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { useClientReportsData } from "@/hooks/useReportsData";
import { Loader2 } from "lucide-react";

interface ClientReportsProps {
  branchId: string;
  branchName: string;
  dateRange?: { from: Date; to: Date };
}

type ClientReportTab = "activity" | "demographics" | "services";

interface TabOption {
  id: ClientReportTab;
  label: string;
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

export function ClientReports({ branchId, branchName, dateRange }: ClientReportsProps) {
  const [activeTab, setActiveTab] = useState<ClientReportTab>("activity");
  
  const { data: reportsData, isLoading, error } = useClientReportsData({
    branchId,
    startDate: dateRange?.from?.toISOString().split('T')[0],
    endDate: dateRange?.to?.toISOString().split('T')[0]
  });
  
  const tabOptions: TabOption[] = [
    { id: "activity", label: "Client Activity" },
    { id: "demographics", label: "Demographics" },
    { id: "services", label: "Service Utilization" },
  ];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2">Loading client reports...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center p-8 text-red-600">
        Error loading client reports. Please try again later.
      </div>
    );
  }

  const clientActivityData = reportsData?.clientActivity || [];
  const demographicsData = reportsData?.demographics || [];
  const serviceUtilizationData = reportsData?.serviceUtilization || [];
  
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
            {clientActivityData.length > 0 ? (
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
            ) : (
              <div className="text-center py-8 text-gray-500">
                No client activity data available for the selected period.
              </div>
            )}
            <div className="mt-4 text-sm text-muted-foreground">
              <p>This report shows client activity trends over the selected period, including active, inactive, and new client counts.</p>
            </div>
          </CardContent>
        </Card>
      )}
      
      {activeTab === "demographics" && (
        <Card className="border border-gray-200 shadow-sm">
          <CardContent className="p-6">
            <h3 className="text-lg font-semibold mb-4">Client Demographics</h3>
            {demographicsData.length > 0 ? (
              <div className="w-full" style={{ height: "350px" }}>
                <ResponsiveContainer width="100%" height="100%">
                  <ChartContainer
                    config={{
                      primary: { color: "#0088FE" },
                    }}
                  >
                    <PieChart>
                      <Pie
                        data={demographicsData}
                        cx="50%"
                        cy="50%"
                        labelLine={true}
                        outerRadius={130}
                        fill="#8884d8"
                        dataKey="value"
                        label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                      >
                        {demographicsData.map((entry: any, index: number) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value) => [`${value} clients`, 'Count']} />
                      <Legend layout="horizontal" verticalAlign="bottom" align="center" />
                    </PieChart>
                  </ChartContainer>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                No demographic data available. Please ensure client birth dates are recorded.
              </div>
            )}
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
            {serviceUtilizationData.length > 0 ? (
              <div className="w-full" style={{ height: "350px" }}>
                <ResponsiveContainer width="100%" height="100%">
                  <ChartContainer
                    config={{
                      primary: { color: "#0088FE" },
                    }}
                  >
                    <PieChart>
                      <Pie
                        data={serviceUtilizationData}
                        cx="50%"
                        cy="50%"
                        labelLine={true}
                        outerRadius={130}
                        fill="#8884d8"
                        dataKey="value"
                        label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                      >
                        {serviceUtilizationData.map((entry: any, index: number) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value) => [`${value} bookings`, 'Count']} />
                      <Legend layout="horizontal" verticalAlign="bottom" align="center" />
                    </PieChart>
                  </ChartContainer>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                No service utilization data available for the selected period.
              </div>
            )}
            <div className="mt-4 text-sm text-muted-foreground">
              <p>This report shows the distribution of different service types utilized by clients.</p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

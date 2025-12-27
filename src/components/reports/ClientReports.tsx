
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChartContainer } from "@/components/ui/chart";
import { BarChart, XAxis, YAxis, Bar, Legend, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { useClientReportsData, transformChartData } from "@/hooks/useReportsData";
import { Skeleton } from "@/components/ui/skeleton";
import { Share2 } from "lucide-react";
import { useState } from "react";
import { UnifiedShareDialog } from "@/components/sharing/UnifiedShareDialog";
import { ReportExporter } from "@/utils/reportExporter";

interface ClientReportsProps {
  branchId: string;
  branchName: string;
}

type ClientReportTab = "activity" | "demographics" | "services";

interface TabOption {
  id: ClientReportTab;
  label: string;
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

// Fallback data in case of no real data
const fallbackActivityData = [
  { name: "Jan", active: 0, inactive: 0, new: 0 },
  { name: "Feb", active: 0, inactive: 0, new: 0 },
  { name: "Mar", active: 0, inactive: 0, new: 0 },
  { name: "Apr", active: 0, inactive: 0, new: 0 },
  { name: "May", active: 0, inactive: 0, new: 0 },
  { name: "Jun", active: 0, inactive: 0, new: 0 },
];

const fallbackDemographicsData = [
  { name: "No Data", value: 1 },
];

const fallbackServiceData = [
  { name: "No Services", value: 1 },
];

export function ClientReports({ branchId, branchName }: ClientReportsProps) {
  const [activeTab, setActiveTab] = useState<ClientReportTab>("activity");
  const [shareDialogOpen, setShareDialogOpen] = useState(false);
  
  const { data: reportData, isLoading, error } = useClientReportsData({
    branchId,
    startDate: new Date(Date.now() - 6 * 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 6 months ago
    endDate: new Date().toISOString().split('T')[0] // today
  });
  
  const tabOptions: TabOption[] = [
    { id: "activity", label: "Client Activity" },
    { id: "demographics", label: "Demographics" },
    { id: "services", label: "Service Utilization" },
  ];

  // Transform data with fallbacks
  const clientActivityData = transformChartData(reportData?.clientActivity, fallbackActivityData);
  const clientDemographicsData = transformChartData(reportData?.demographics, fallbackDemographicsData);
  const clientServiceTypeData = transformChartData(reportData?.serviceUtilization, fallbackServiceData);

  const handleGenerateReportPDF = async (): Promise<Blob> => {
    const reportTypeLabel = activeTab === 'activity' ? 'Client Activity Report' : 
                            activeTab === 'demographics' ? 'Demographics Report' : 
                            'Service Utilization Report';
    
    const currentData = activeTab === 'activity' ? clientActivityData : 
                       activeTab === 'demographics' ? clientDemographicsData : 
                       clientServiceTypeData;
    
    // Generate PDF using ReportExporter
    const pdfBlob = await ReportExporter.exportToPDFBlob({
      title: reportTypeLabel,
      branchName: branchName,
      data: currentData,
      columns: Object.keys(currentData[0] || {}),
      fileName: `${reportTypeLabel.replace(/\s+/g, '_')}.pdf`,
    });
    
    return pdfBlob;
  };

  if (error) {
    return (
      <div className="space-y-4">
        <div className="p-4 text-center text-red-600">
          Error loading client reports: {error.message}
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
      <div className="flex flex-wrap gap-2 mb-4 justify-between items-center">
        <div className="flex flex-wrap gap-2">
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
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShareDialogOpen(true)}
        >
          <Share2 className="h-4 w-4 mr-2" />
          Share Report
        </Button>
      </div>

      {isLoading ? (
        renderLoadingSkeleton()
      ) : (
        <>
          {activeTab === "activity" && (
            <Card className="border border-border shadow-sm">
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
            <Card className="border border-border shadow-sm">
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
            <Card className="border border-border shadow-sm">
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
        </>
      )}

      <UnifiedShareDialog
        open={shareDialogOpen}
        onOpenChange={setShareDialogOpen}
        contentId={branchId}
        contentType="report"
        contentTitle={`Client ${activeTab === 'activity' ? 'Activity' : activeTab === 'demographics' ? 'Demographics' : 'Service Utilization'} Report`}
        branchId={branchId}
        reportType="client"
        reportData={{ type: activeTab, branchName }}
        onGeneratePDF={handleGenerateReportPDF}
      />
    </div>
  );
}

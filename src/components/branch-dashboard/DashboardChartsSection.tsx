
import React from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { RefreshCw, BarChart4, PieChart as PieChartIcon } from "lucide-react";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, Line, PieChart, Pie, Cell } from "recharts";
import { Skeleton } from "@/components/ui/skeleton";
import { useBranchChartData } from "@/data/hooks/useBranchChartData";
import { useQueryClient } from "@tanstack/react-query";
import { ChartExportMenu } from "./ChartExportMenu";
import { useToast } from "@/hooks/use-toast";

interface DashboardChartsSectionProps {
  branchId: string | undefined;
}

const COLORS = ["#10b981", "#3b82f6", "#f59e0b", "#ef4444", "#6b7280", "#8b5cf6"];

export const DashboardChartsSection: React.FC<DashboardChartsSectionProps> = ({ branchId }) => {
  const { data: chartData, isLoading: isLoadingChartData } = useBranchChartData(branchId);
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [isRefreshing, setIsRefreshing] = React.useState(false);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await queryClient.invalidateQueries({ queryKey: ['branch-chart-data', branchId] });
      toast({
        title: "Data refreshed",
        description: "Chart data has been updated.",
      });
    } catch (error) {
      toast({
        title: "Refresh failed",
        description: "Could not refresh chart data.",
        variant: "destructive",
      });
    } finally {
      setIsRefreshing(false);
    }
  };

  const totalClients = chartData?.clientDistribution.reduce((acc, cur) => acc + cur.value, 0) || 0;
  const statusPercentages = chartData?.clientDistribution.map(item => ({
    name: item.name,
    value: item.value,
    percentage: totalClients > 0 ? Math.round((item.value / totalClients) * 100) : 0
  })) || [];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6 mb-6">
      <Card className="lg:col-span-2 border-l-4 border-l-indigo-500 hover:shadow-lg hover:shadow-indigo-100/30 transition-all duration-300 overflow-hidden">
        <CardHeader className="pb-2 bg-gradient-to-r from-indigo-50/70 to-transparent dark:from-indigo-950/30">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-indigo-500/20 shadow-sm">
                <BarChart4 className="h-5 w-5 text-indigo-600" />
              </div>
              <div>
                <CardTitle className="text-base md:text-lg font-semibold">Weekly Statistics</CardTitle>
                <CardDescription>Appointments, visits and revenue</CardDescription>
              </div>
            </div>
            <div className="flex gap-2">
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-8 w-8"
                onClick={handleRefresh}
                disabled={isRefreshing || isLoadingChartData}
              >
                <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
              </Button>
              <ChartExportMenu 
                chartData={chartData?.weeklyStats || []}
                chartTitle="Weekly Statistics"
              />
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
      
      <Card className="border-l-4 border-l-emerald-500 hover:shadow-lg hover:shadow-emerald-100/30 transition-all duration-300 overflow-hidden">
        <CardHeader className="pb-2 bg-gradient-to-r from-emerald-50/70 to-transparent dark:from-emerald-950/30">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-emerald-500/20 shadow-sm">
              <PieChartIcon className="h-5 w-5 text-emerald-600" />
            </div>
            <div>
              <CardTitle className="text-base md:text-lg font-semibold">Client Status</CardTitle>
              <CardDescription>Distribution by current status</CardDescription>
            </div>
          </div>
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
          
          <div className="grid grid-cols-2 gap-2 mt-3">
            {statusPercentages.map((item, index) => (
              <div key={item.name} className="flex items-center gap-2">
                <div 
                  className="h-3 w-3 rounded-full flex-shrink-0" 
                  style={{ backgroundColor: COLORS[index % COLORS.length] }}
                />
                <span className="text-xs md:text-sm truncate" title={`${item.name}: ${item.value} (${item.percentage}%)`}>
                  {item.name} ({item.percentage}%)
                </span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

import React, { useMemo } from "react";
import { format, subDays, startOfWeek, endOfWeek } from "date-fns";
import { TrendingUp, TrendingDown, Clock, Users, Target, AlertTriangle, Star, Zap } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from "recharts";

interface StaffUtilizationData {
  id: string;
  name: string;
  contractedHours: number;
  scheduledHours: number;
  actualHours: number;
  availableHours: number;
  revenue: number;
  bookingsCount: number;
  efficiency: number;
  lastWeekHours: number;
  rank: number;
}

interface UtilizationMetrics {
  overallUtilization: number;
  averageEfficiency: number;
  totalRevenue: number;
  capacityGap: number;
  peakUtilization: number;
  offPeakUtilization: number;
  underutilizedStaff: number;
  overutilizedStaff: number;
}

interface StaffUtilizationMetricsProps {
  staffData: StaffUtilizationData[];
  date: Date;
  branchId?: string;
}

const chartConfig = {
  utilization: { label: "Utilization", color: "hsl(var(--chart-1))" },
  efficiency: { label: "Efficiency", color: "hsl(var(--chart-2))" },
  revenue: { label: "Revenue", color: "hsl(var(--chart-3))" },
  hours: { label: "Hours", color: "hsl(var(--chart-4))" },
};

export function StaffUtilizationMetrics({ staffData, date, branchId }: StaffUtilizationMetricsProps) {
  const metrics = useMemo((): UtilizationMetrics => {
    const totalContractedHours = staffData.reduce((sum, staff) => sum + staff.contractedHours, 0);
    const totalScheduledHours = staffData.reduce((sum, staff) => sum + staff.scheduledHours, 0);
    const totalActualHours = staffData.reduce((sum, staff) => sum + staff.actualHours, 0);
    const totalRevenue = staffData.reduce((sum, staff) => sum + staff.revenue, 0);
    
    const overallUtilization = totalContractedHours > 0 ? (totalScheduledHours / totalContractedHours) * 100 : 0;
    const averageEfficiency = staffData.length > 0 ? staffData.reduce((sum, staff) => sum + staff.efficiency, 0) / staffData.length : 0;
    
    const underutilizedStaff = staffData.filter(staff => 
      (staff.scheduledHours / staff.contractedHours) < 0.8
    ).length;
    
    const overutilizedStaff = staffData.filter(staff => 
      (staff.scheduledHours / staff.contractedHours) > 1.1
    ).length;
    
    // Mock peak/off-peak data (in real implementation, calculate from time-based data)
    const peakUtilization = overallUtilization * 1.3;
    const offPeakUtilization = overallUtilization * 0.7;
    const capacityGap = Math.max(0, totalContractedHours - totalScheduledHours);

    return {
      overallUtilization,
      averageEfficiency,
      totalRevenue,
      capacityGap,
      peakUtilization: Math.min(100, peakUtilization),
      offPeakUtilization: Math.max(0, offPeakUtilization),
      underutilizedStaff,
      overutilizedStaff,
    };
  }, [staffData]);

  const utilizationRanking = useMemo(() => {
    return [...staffData]
      .map(staff => ({
        ...staff,
        utilizationRate: (staff.scheduledHours / staff.contractedHours) * 100,
        revenuePerHour: staff.actualHours > 0 ? staff.revenue / staff.actualHours : 0,
        weeklyTrend: ((staff.scheduledHours - staff.lastWeekHours) / Math.max(staff.lastWeekHours, 1)) * 100,
      }))
      .sort((a, b) => b.utilizationRate - a.utilizationRate);
  }, [staffData]);

  const utilizationDistribution = useMemo(() => {
    const ranges = [
      { name: "Under 60%", value: 0, color: "#ef4444" },
      { name: "60-80%", value: 0, color: "#f97316" },
      { name: "80-100%", value: 0, color: "#22c55e" },
      { name: "Over 100%", value: 0, color: "#8b5cf6" },
    ];

    staffData.forEach(staff => {
      const utilization = (staff.scheduledHours / staff.contractedHours) * 100;
      if (utilization < 60) ranges[0].value++;
      else if (utilization < 80) ranges[1].value++;
      else if (utilization <= 100) ranges[2].value++;
      else ranges[3].value++;
    });

    return ranges.filter(range => range.value > 0);
  }, [staffData]);

  const weeklyTrendData = useMemo(() => {
    return utilizationRanking.slice(0, 8).map(staff => ({
      name: staff.name.split(' ')[0],
      thisWeek: staff.scheduledHours,
      lastWeek: staff.lastWeekHours,
      efficiency: staff.efficiency,
    }));
  }, [utilizationRanking]);

  const getUtilizationColor = (utilization: number) => {
    if (utilization < 60) return "bg-destructive/20 text-destructive";
    if (utilization < 80) return "bg-orange-100 text-orange-800";
    if (utilization <= 100) return "bg-green-100 text-green-800";
    return "bg-purple-100 text-purple-800";
  };

  const getEfficiencyIcon = (efficiency: number) => {
    if (efficiency >= 95) return <Star className="h-4 w-4 text-yellow-500" />;
    if (efficiency >= 85) return <Zap className="h-4 w-4 text-green-500" />;
    if (efficiency < 70) return <AlertTriangle className="h-4 w-4 text-orange-500" />;
    return null;
  };

  return (
    <div className="space-y-6">
      {/* Key Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Overall Utilization</p>
                <p className="text-2xl font-bold">{metrics.overallUtilization.toFixed(1)}%</p>
              </div>
              <div className="p-2 bg-primary/10 rounded-full">
                <Target className="h-5 w-5 text-primary" />
              </div>
            </div>
            <Progress value={metrics.overallUtilization} className="mt-2" />
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Average Efficiency</p>
                <p className="text-2xl font-bold">{metrics.averageEfficiency.toFixed(1)}%</p>
              </div>
              <div className="p-2 bg-green-100 rounded-full">
                <Zap className="h-5 w-5 text-green-600" />
              </div>
            </div>
            <Progress value={metrics.averageEfficiency} className="mt-2" />
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Revenue</p>
                <p className="text-2xl font-bold">£{metrics.totalRevenue.toLocaleString()}</p>
              </div>
              <div className="p-2 bg-blue-100 rounded-full">
                <TrendingUp className="h-5 w-5 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Capacity Gap</p>
                <p className="text-2xl font-bold">{metrics.capacityGap.toFixed(1)}h</p>
              </div>
              <div className="p-2 bg-orange-100 rounded-full">
                <Clock className="h-5 w-5 text-orange-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="utilization" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="utilization">Utilization Analysis</TabsTrigger>
          <TabsTrigger value="trends">Weekly Trends</TabsTrigger>
          <TabsTrigger value="distribution">Distribution</TabsTrigger>
          <TabsTrigger value="recommendations">Insights</TabsTrigger>
        </TabsList>

        <TabsContent value="utilization" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Staff Utilization Ranking</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {utilizationRanking.slice(0, 10).map((staff, index) => (
                  <div key={staff.id} className="flex items-center justify-between p-3 rounded-lg border">
                    <div className="flex items-center gap-3">
                      <div className="text-sm font-medium text-muted-foreground w-6">
                        #{index + 1}
                      </div>
                      <div>
                        <p className="font-medium">{staff.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {staff.scheduledHours}h / {staff.contractedHours}h scheduled
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      {getEfficiencyIcon(staff.efficiency)}
                      <Badge className={getUtilizationColor(staff.utilizationRate)}>
                        {staff.utilizationRate.toFixed(1)}%
                      </Badge>
                      <div className="text-right">
                        <p className="font-medium">£{staff.revenuePerHour.toFixed(2)}/h</p>
                        <div className="flex items-center gap-1 text-sm">
                          {staff.weeklyTrend >= 0 ? (
                            <TrendingUp className="h-3 w-3 text-green-500" />
                          ) : (
                            <TrendingDown className="h-3 w-3 text-red-500" />
                          )}
                          <span className={staff.weeklyTrend >= 0 ? "text-green-600" : "text-red-600"}>
                            {Math.abs(staff.weeklyTrend).toFixed(1)}%
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="trends" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Weekly Hours Comparison</CardTitle>
            </CardHeader>
            <CardContent>
              <ChartContainer config={chartConfig} className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={weeklyTrendData}>
                    <XAxis dataKey="name" />
                    <YAxis />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Bar dataKey="thisWeek" fill="var(--color-utilization)" name="This Week" />
                    <Bar dataKey="lastWeek" fill="var(--color-efficiency)" name="Last Week" />
                  </BarChart>
                </ResponsiveContainer>
              </ChartContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="distribution" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Utilization Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                <ChartContainer config={chartConfig} className="h-[250px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={utilizationDistribution}
                        dataKey="value"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        outerRadius={80}
                        label={({ name, value }) => `${name}: ${value}`}
                      >
                        {utilizationDistribution.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <ChartTooltip content={<ChartTooltipContent />} />
                    </PieChart>
                  </ResponsiveContainer>
                </ChartContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Peak vs Off-Peak</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>Peak Hours (9AM-5PM)</span>
                    <span>{metrics.peakUtilization.toFixed(1)}%</span>
                  </div>
                  <Progress value={metrics.peakUtilization} />
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>Off-Peak Hours</span>
                    <span>{metrics.offPeakUtilization.toFixed(1)}%</span>
                  </div>
                  <Progress value={metrics.offPeakUtilization} />
                </div>
                <div className="pt-4 space-y-2">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 text-orange-500" />
                    <span className="text-sm">
                      {metrics.underutilizedStaff} staff underutilized (&lt;80%)
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-purple-500" />
                    <span className="text-sm">
                      {metrics.overutilizedStaff} staff overutilized (&gt;110%)
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="recommendations" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-green-500" />
                  Optimization Opportunities
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {metrics.underutilizedStaff > 0 && (
                  <div className="p-3 bg-orange-50 rounded-lg">
                    <p className="font-medium text-orange-800">Underutilized Staff</p>
                    <p className="text-sm text-orange-600">
                      {metrics.underutilizedStaff} staff members have utilization below 80%. 
                      Consider redistributing workload or additional training.
                    </p>
                  </div>
                )}
                
                {metrics.capacityGap > 8 && (
                  <div className="p-3 bg-blue-50 rounded-lg">
                    <p className="font-medium text-blue-800">Capacity Available</p>
                    <p className="text-sm text-blue-600">
                      {metrics.capacityGap.toFixed(1)} hours of unused capacity available. 
                      Opportunity to take on additional clients.
                    </p>
                  </div>
                )}
                
                {metrics.averageEfficiency < 80 && (
                  <div className="p-3 bg-red-50 rounded-lg">
                    <p className="font-medium text-red-800">Efficiency Concerns</p>
                    <p className="text-sm text-red-600">
                      Average efficiency at {metrics.averageEfficiency.toFixed(1)}%. 
                      Review scheduling and travel optimization.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Star className="h-5 w-5 text-yellow-500" />
                  Top Performers
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {utilizationRanking.slice(0, 3).map((staff, index) => (
                  <div key={staff.id} className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                    <div>
                      <p className="font-medium text-green-800">{staff.name}</p>
                      <p className="text-sm text-green-600">
                        {staff.utilizationRate.toFixed(1)}% utilization • {staff.efficiency.toFixed(1)}% efficiency
                      </p>
                    </div>
                    <Badge variant="secondary">
                      #{index + 1}
                    </Badge>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
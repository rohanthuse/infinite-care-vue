
import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell, BarChart, Bar } from "recharts";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, TrendingDown, AlertTriangle, Activity } from "lucide-react";
import { useNews2Analytics } from "@/hooks/useNews2Analytics";
import { format } from "date-fns";

interface News2AnalyticsDashboardProps {
  branchId: string;
}

export function News2AnalyticsDashboard({ branchId }: News2AnalyticsDashboardProps) {
  const { trendData, riskDistribution, deterioratingPatients, isLoading } = useNews2Analytics(branchId);

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
          <p className="font-medium">{label}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} style={{ color: entry.color }}>
              {`${entry.name}: ${entry.value}`}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'deteriorating':
        return <TrendingUp className="h-4 w-4 text-red-500" />;
      case 'improving':
        return <TrendingDown className="h-4 w-4 text-green-500" />;
      default:
        return <Activity className="h-4 w-4 text-gray-500" />;
    }
  };

  const getTrendBadge = (trend: string) => {
    switch (trend) {
      case 'deteriorating':
        return <Badge variant="destructive">Deteriorating</Badge>;
      case 'improving':
        return <Badge className="bg-green-500">Improving</Badge>;
      default:
        return <Badge variant="outline">Stable</Badge>;
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <div className="animate-pulse">
                  <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
                  <div className="h-32 bg-gray-200 rounded"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Weekly Trends Chart */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            NEWS2 Score Trends (Last 7 Days)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={trendData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip content={<CustomTooltip />} />
                <Legend />
                <Line 
                  type="monotone" 
                  dataKey="highRisk" 
                  stroke="#ef4444" 
                  strokeWidth={3}
                  name="High Risk Patients"
                  dot={{ fill: '#ef4444', strokeWidth: 2, r: 4 }}
                />
                <Line 
                  type="monotone" 
                  dataKey="mediumRisk" 
                  stroke="#f97316" 
                  strokeWidth={2}
                  name="Medium Risk Patients"
                  dot={{ fill: '#f97316', strokeWidth: 2, r: 4 }}
                />
                <Line 
                  type="monotone" 
                  dataKey="lowRisk" 
                  stroke="#22c55e" 
                  strokeWidth={2}
                  name="Low Risk Patients"
                  dot={{ fill: '#22c55e', strokeWidth: 2, r: 4 }}
                />
                <Line 
                  type="monotone" 
                  dataKey="averageScore" 
                  stroke="#8b5cf6" 
                  strokeWidth={2}
                  strokeDasharray="5 5"
                  name="Average Score"
                  dot={{ fill: '#8b5cf6', strokeWidth: 2, r: 3 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Risk Distribution Pie Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Current Risk Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={riskDistribution}
                    cx="50%"
                    cy="50%"
                    innerRadius={40}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                    label={({ name, value }) => `${name}: ${value}`}
                  >
                    {riskDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Daily Patient Count Bar Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Daily Patient Observations</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={trendData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend />
                  <Bar dataKey="totalPatients" fill="#3b82f6" name="Total Observations" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Deteriorating Patients Alert */}
      {deterioratingPatients.length > 0 && (
        <Card className="border-orange-200 bg-orange-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-orange-800">
              <AlertTriangle className="h-5 w-5" />
              Patients Requiring Attention ({deterioratingPatients.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {deterioratingPatients.slice(0, 5).map((patient) => (
                <div key={patient.patientId} className="flex items-center justify-between p-3 bg-white rounded-lg border">
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1">
                      {getTrendIcon(patient.trend)}
                    </div>
                    <div>
                      <p className="font-medium">{patient.patientName}</p>
                      <p className="text-sm text-gray-600">
                        Last observation: {format(new Date(patient.lastObservation), "MMM dd, HH:mm")}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <p className="font-medium">
                        Score: {patient.previousScore} → {patient.currentScore}
                      </p>
                      <p className="text-sm text-gray-600">
                        Change: {patient.currentScore > patient.previousScore ? '+' : ''}{patient.currentScore - patient.previousScore}
                      </p>
                    </div>
                    {getTrendBadge(patient.trend)}
                  </div>
                </div>
              ))}
              {deterioratingPatients.length > 5 && (
                <p className="text-center text-sm text-gray-600 pt-2">
                  + {deterioratingPatients.length - 5} more patients requiring attention
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

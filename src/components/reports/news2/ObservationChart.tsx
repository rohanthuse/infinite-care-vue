
import React from "react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { format } from "date-fns";
import { News2Observation } from "@/hooks/useNews2Data";
import { TrendingUp } from "lucide-react";

interface ObservationChartProps {
  observations: News2Observation[];
}

export function ObservationChart({ observations }: ObservationChartProps) {
  // Prepare data for the chart (reverse to show chronological order)
  const chartData = observations
    .slice()
    .reverse()
    .map((obs, index) => ({
      id: obs.id,
      date: format(new Date(obs.recorded_at), "MMM dd"),
      time: format(new Date(obs.recorded_at), "HH:mm"),
      fullDate: obs.recorded_at,
      totalScore: obs.total_score,
      respiratoryRate: obs.respiratory_rate || null,
      oxygenSaturation: obs.oxygen_saturation || null,
      systolicBP: obs.systolic_bp || null,
      pulseRate: obs.pulse_rate || null,
      temperature: obs.temperature || null,
      riskLevel: obs.risk_level,
    }));

  // Custom tooltip
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
          <p className="font-medium">{`${data.date} at ${data.time}`}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} style={{ color: entry.color }}>
              {`${entry.name}: ${entry.value}`}
              {entry.dataKey === 'temperature' && '°C'}
              {entry.dataKey === 'oxygenSaturation' && '%'}
              {(entry.dataKey === 'respiratoryRate' || entry.dataKey === 'pulseRate') && ' bpm'}
              {entry.dataKey === 'systolicBP' && ' mmHg'}
            </p>
          ))}
          <p className="text-sm text-gray-600 mt-1">
            Risk: <span className={`font-medium ${
              data.riskLevel === 'high' ? 'text-red-600' :
              data.riskLevel === 'medium' ? 'text-orange-600' : 'text-green-600'
            }`}>
              {data.riskLevel.toUpperCase()}
            </span>
          </p>
        </div>
      );
    }
    return null;
  };

  if (chartData.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Observation Trends
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-gray-500">
            No observation data available for trending
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* NEWS2 Score Trend */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            NEWS2 Score Trend
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="date" 
                  tick={{ fontSize: 12 }}
                />
                <YAxis 
                  domain={[0, 20]}
                  tick={{ fontSize: 12 }}
                />
                <Tooltip content={<CustomTooltip />} />
                <Legend />
                <Line 
                  type="monotone" 
                  dataKey="totalScore" 
                  stroke="#dc2626" 
                  strokeWidth={3}
                  name="NEWS2 Score"
                  dot={{ fill: '#dc2626', strokeWidth: 2, r: 4 }}
                />
                {/* Risk level reference lines */}
                <Line 
                  type="monotone" 
                  dataKey={() => 7} 
                  stroke="#ef4444" 
                  strokeDasharray="5 5"
                  name="High Risk (≥7)"
                  dot={false}
                />
                <Line 
                  type="monotone" 
                  dataKey={() => 5} 
                  stroke="#f97316" 
                  strokeDasharray="5 5"
                  name="Medium Risk (≥5)"
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Vital Signs Trends */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Respiratory & Heart Rate */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Respiratory & Heart Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend />
                  <Line 
                    type="monotone" 
                    dataKey="respiratoryRate" 
                    stroke="#3b82f6" 
                    name="Respiratory Rate"
                    strokeWidth={2}
                    connectNulls={false}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="pulseRate" 
                    stroke="#ef4444" 
                    name="Heart Rate"
                    strokeWidth={2}
                    connectNulls={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Blood Pressure & Oxygen Saturation */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Blood Pressure & O₂ Saturation</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend />
                  <Line 
                    type="monotone" 
                    dataKey="systolicBP" 
                    stroke="#8b5cf6" 
                    name="Systolic BP"
                    strokeWidth={2}
                    connectNulls={false}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="oxygenSaturation" 
                    stroke="#10b981" 
                    name="O₂ Saturation"
                    strokeWidth={2}
                    connectNulls={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Temperature Trend */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-lg">Temperature Trend</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                  <YAxis 
                    domain={[35, 40]} 
                    tick={{ fontSize: 12 }}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend />
                  <Line 
                    type="monotone" 
                    dataKey="temperature" 
                    stroke="#f59e0b" 
                    name="Temperature (°C)"
                    strokeWidth={2}
                    connectNulls={false}
                  />
                  {/* Normal temperature range */}
                  <Line 
                    type="monotone" 
                    dataKey={() => 37} 
                    stroke="#6b7280" 
                    strokeDasharray="3 3"
                    name="Normal (37°C)"
                    dot={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

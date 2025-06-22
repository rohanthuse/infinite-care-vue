
import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Clock, Target, TrendingUp, AlertCircle } from "lucide-react";
import { AttendanceMetrics } from "@/hooks/useCarerAttendanceReports";

interface AttendanceMetricsCardsProps {
  metrics: AttendanceMetrics;
  isLoading?: boolean;
}

export function AttendanceMetricsCards({ metrics, isLoading }: AttendanceMetricsCardsProps) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <div className="h-4 bg-gray-200 rounded w-24"></div>
              <div className="h-4 w-4 bg-gray-200 rounded"></div>
            </CardHeader>
            <CardContent>
              <div className="h-8 bg-gray-200 rounded w-16 mb-2"></div>
              <div className="h-3 bg-gray-200 rounded w-20"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const cards = [
    {
      title: "Total Hours",
      value: `${metrics.totalHoursWorked.toFixed(1)}h`,
      subtitle: `Avg: ${metrics.averageDailyHours.toFixed(1)}h/day`,
      icon: Clock,
      color: "text-blue-600",
    },
    {
      title: "Attendance Rate",
      value: `${metrics.attendanceRate.toFixed(1)}%`,
      subtitle: `${metrics.presentDays}/${metrics.totalScheduledDays} days`,
      icon: Target,
      color: metrics.attendanceRate >= 95 ? "text-green-600" : metrics.attendanceRate >= 85 ? "text-yellow-600" : "text-red-600",
    },
    {
      title: "Overtime Hours",
      value: `${metrics.overtimeHours.toFixed(1)}h`,
      subtitle: metrics.overtimeHours > 0 ? "Above standard" : "Within limits",
      icon: TrendingUp,
      color: metrics.overtimeHours > 20 ? "text-red-600" : metrics.overtimeHours > 10 ? "text-yellow-600" : "text-green-600",
    },
    {
      title: "Punctuality",
      value: `${metrics.punctualityScore.toFixed(1)}%`,
      subtitle: `${metrics.lateDays} late days`,
      icon: AlertCircle,
      color: metrics.punctualityScore >= 95 ? "text-green-600" : metrics.punctualityScore >= 85 ? "text-yellow-600" : "text-red-600",
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      {cards.map((card, index) => (
        <Card key={index}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              {card.title}
            </CardTitle>
            <card.icon className={`h-4 w-4 ${card.color}`} />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${card.color}`}>
              {card.value}
            </div>
            <p className="text-xs text-gray-500">
              {card.subtitle}
            </p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

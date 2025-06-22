
import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle, Activity, AlertTriangle, ClipboardList } from "lucide-react";
import { ActivityMetrics } from "@/hooks/useCarerActivityReports";

interface ActivityMetricsCardsProps {
  metrics: ActivityMetrics;
  isLoading?: boolean;
}

export function ActivityMetricsCards({ metrics, isLoading }: ActivityMetricsCardsProps) {
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
      title: "Total Activities",
      value: metrics.totalActivities.toString(),
      subtitle: `${metrics.averageActivitiesPerWeek.toFixed(1)}/week avg`,
      icon: Activity,
      color: "text-blue-600",
    },
    {
      title: "Completion Rate",
      value: `${metrics.completionRate.toFixed(1)}%`,
      subtitle: `${metrics.completedActivities}/${metrics.totalActivities} completed`,
      icon: CheckCircle,
      color: metrics.completionRate >= 90 ? "text-green-600" : metrics.completionRate >= 70 ? "text-yellow-600" : "text-red-600",
    },
    {
      title: "Service Actions",
      value: metrics.serviceActions.toString(),
      subtitle: "Care services delivered",
      icon: ClipboardList,
      color: "text-purple-600",
    },
    {
      title: "Incidents",
      value: metrics.totalIncidents.toString(),
      subtitle: metrics.totalIncidents === 0 ? "No incidents" : "Requires attention",
      icon: AlertTriangle,
      color: metrics.totalIncidents === 0 ? "text-green-600" : metrics.totalIncidents < 5 ? "text-yellow-600" : "text-red-600",
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

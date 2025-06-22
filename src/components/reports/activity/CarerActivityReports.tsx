
import React from "react";
import { Loader2 } from "lucide-react";
import { useCarerActivityReports } from "@/hooks/useCarerActivityReports";
import { ActivityMetricsCards } from "./ActivityMetricsCards";
import { ActivityChartsGrid } from "./ActivityChartsGrid";

interface CarerActivityReportsProps {
  dateRange?: { from: Date; to: Date };
}

export function CarerActivityReports({ dateRange }: CarerActivityReportsProps) {
  const { data: activityData, isLoading, error } = useCarerActivityReports(dateRange);

  if (error) {
    return (
      <div className="text-center py-8">
        <p className="text-red-500 mb-2">Error loading activity reports</p>
        <p className="text-sm text-gray-500">{error.message}</p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin mr-2" />
          <span>Loading activity reports...</span>
        </div>
        <ActivityMetricsCards 
          metrics={{
            totalActivities: 0,
            completedActivities: 0,
            completionRate: 0,
            totalIncidents: 0,
            serviceActions: 0,
            averageActivitiesPerWeek: 0,
          }} 
          isLoading={true} 
        />
        <ActivityChartsGrid 
          data={{
            metrics: {
              totalActivities: 0,
              completedActivities: 0,
              completionRate: 0,
              totalIncidents: 0,
              serviceActions: 0,
              averageActivitiesPerWeek: 0,
            },
            weeklyTrends: [],
            serviceDelivery: [],
            incidentReports: [],
          }} 
          isLoading={true} 
        />
      </div>
    );
  }

  if (!activityData) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500">No activity data available for the selected period.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <ActivityMetricsCards metrics={activityData.metrics} />
      <ActivityChartsGrid data={activityData} />
    </div>
  );
}

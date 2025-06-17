
import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FileText, Clock, CheckCircle, AlertCircle } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { useClientCarePlansWithDetails } from "@/hooks/useCarePlanData";

const ClientCarePlans = () => {
  const clientId = "76394b1f-d2e3-43f2-b0ae-4605dcb75551"; // John Michael's client ID
  const { data: carePlans, isLoading, error } = useClientCarePlansWithDetails(clientId);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your care plans...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">Error loading care plans</h3>
        <p className="text-gray-600">{error.message}</p>
      </div>
    );
  }

  if (!carePlans || carePlans.length === 0) {
    return (
      <div className="text-center py-12">
        <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">No care plans found</h3>
        <p className="text-gray-600">You don't have any care plans at this time.</p>
      </div>
    );
  }

  const carePlan = carePlans[0]; // Get the first (and likely only) care plan

  // Function to render goal status badge
  const renderGoalStatus = (status: string) => {
    switch (status) {
      case "completed":
        return <span className="text-xs font-medium bg-green-100 text-green-800 px-2 py-1 rounded-full">Completed</span>;
      case "in-progress":
        return <span className="text-xs font-medium bg-blue-100 text-blue-800 px-2 py-1 rounded-full">In Progress</span>;
      case "not-started":
        return <span className="text-xs font-medium bg-gray-100 text-gray-800 px-2 py-1 rounded-full">Not Started</span>;
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      {/* Care Plan Header */}
      <div className="bg-white p-6 rounded-xl border border-gray-200">
        <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
          <div>
            <h2 className="text-xl font-bold flex items-center">
              <FileText className="h-5 w-5 mr-2 text-blue-600" />
              {carePlan.title}
            </h2>
            <div className="text-sm text-gray-500 mt-2">
              Last updated: {new Date(carePlan.updated_at).toLocaleDateString()} • Care Provider: {carePlan.provider_name}
            </div>
          </div>
          <div className="flex gap-2">
            <Button>Request Changes</Button>
            <Button variant="outline">Print Plan</Button>
          </div>
        </div>
        <div className="mt-6 flex flex-col md:flex-row md:items-center gap-4 md:gap-8">
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-blue-600" />
            <span className="text-sm">Next review: {carePlan.review_date ? new Date(carePlan.review_date).toLocaleDateString() : 'Not scheduled'}</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm font-medium">Goals progress:</span>
            <div className="flex-1 md:w-48">
              <Progress value={carePlan.goals_progress || 0} className="h-2" />
            </div>
            <span className="text-sm font-medium">{carePlan.goals_progress || 0}%</span>
          </div>
        </div>
      </div>

      {/* Care Plan Content */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <Tabs defaultValue="goals">
          <div className="border-b border-gray-200">
            <div className="p-4">
              <TabsList className="grid grid-cols-3 w-full lg:w-auto">
                <TabsTrigger value="goals">Goals</TabsTrigger>
                <TabsTrigger value="medications">Medications</TabsTrigger>
                <TabsTrigger value="activities">Activities</TabsTrigger>
              </TabsList>
            </div>
          </div>
          
          {/* Goals Tab */}
          <TabsContent value="goals" className="p-6">
            <div className="space-y-6">
              {carePlan.goals && carePlan.goals.length > 0 ? (
                carePlan.goals.map(goal => (
                  <div key={goal.id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h4 className="font-medium">{goal.description}</h4>
                          {renderGoalStatus(goal.status)}
                        </div>
                        <div className="flex items-center gap-3 mb-2">
                          <div className="flex-1">
                            <Progress value={goal.progress || 0} className="h-2" />
                          </div>
                          <span className="text-sm font-medium">{goal.progress || 0}%</span>
                        </div>
                        {goal.notes && (
                          <p className="text-sm text-gray-600 mt-2">{goal.notes}</p>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-gray-500 text-center py-8">No goals defined for this care plan.</p>
              )}
            </div>
          </TabsContent>
          
          {/* Medications Tab */}
          <TabsContent value="medications" className="p-6">
            <div className="space-y-4">
              {carePlan.medications && carePlan.medications.length > 0 ? (
                carePlan.medications.map(med => (
                  <div key={med.id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
                      <div>
                        <h4 className="font-medium">{med.name}</h4>
                        <p className="text-sm text-gray-600">{med.dosage}, {med.frequency}</p>
                      </div>
                      <div className="text-sm text-gray-600">
                        Started: {new Date(med.start_date).toLocaleDateString()} • Status: {med.status}
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-gray-500 text-center py-8">No medications defined for this care plan.</p>
              )}
            </div>
          </TabsContent>
          
          {/* Activities Tab */}
          <TabsContent value="activities" className="p-6">
            <div className="space-y-4">
              {carePlan.activities && carePlan.activities.length > 0 ? (
                carePlan.activities.map(activity => (
                  <div key={activity.id} className="border border-gray-200 rounded-lg p-4">
                    <h4 className="font-medium">{activity.name}</h4>
                    {activity.description && (
                      <p className="text-sm text-gray-600 mt-1">{activity.description}</p>
                    )}
                    <div className="flex items-center mt-2 gap-2">
                      <span className="text-xs font-medium bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                        {activity.frequency}
                      </span>
                      <span className="text-xs font-medium bg-green-100 text-green-800 px-2 py-1 rounded-full">
                        {activity.status}
                      </span>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-gray-500 text-center py-8">No activities defined for this care plan.</p>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default ClientCarePlans;
